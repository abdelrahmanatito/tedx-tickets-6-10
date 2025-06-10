import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// Update the POST function to handle the phoneType field
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const phone = formData.get("phone") as string
    const phoneType = formData.get("phoneType") as string
    const university = formData.get("university") as string
    const paymentProof = formData.get("paymentProof") as File

    if (!name || !email || !phone || !university || !paymentProof) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    // Validate name length
    if (name.length < 5 || name.length > 50) {
      return NextResponse.json({ error: "Name must be between 5 and 50 characters" }, { status: 400 })
    }

    // Validate university length
    if (university.length < 5 || university.length > 50) {
      return NextResponse.json({ error: "University name must be between 5 and 50 characters" }, { status: 400 })
    }

    // Validate file type
    const fileType = paymentProof.type.toLowerCase()
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"]

    if (!validTypes.includes(fileType)) {
      return NextResponse.json({ error: "Only JPG, PNG, and PDF files are accepted" }, { status: 400 })
    }

    // Check file size (max 10MB)
    if (paymentProof.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be less than 10MB" }, { status: 400 })
    }

    // Check if email already exists
    const { data: existingUser, error: checkError } = await supabase
      .from("registrations")
      .select("id, email, payment_status")
      .eq("email", email)
      .single()

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 is "not found" error, which is what we want
      console.error("Error checking existing user:", checkError)
      return NextResponse.json({ error: "Database error occurred" }, { status: 500 })
    }

    if (existingUser) {
      // User already exists
      const statusMessage = {
        pending: "Your registration is already submitted and pending payment verification.",
        confirmed: "You are already registered and your payment has been confirmed.",
        rejected: "Your previous registration was rejected. Please contact support for assistance.",
      }

      return NextResponse.json(
        {
          error: `Email already registered. ${statusMessage[existingUser.payment_status as keyof typeof statusMessage]}`,
        },
        { status: 409 },
      )
    }

    // Check if bucket exists, create if it doesn't
    const { data: buckets } = await supabase.storage.listBuckets()
    const bucketExists = buckets?.some((bucket) => bucket.name === "payment-proofs")

    if (!bucketExists) {
      const { error: bucketError } = await supabase.storage.createBucket("payment-proofs", {
        public: true,
      })
      if (bucketError) {
        console.error("Bucket creation error:", bucketError)
      }
    }

    // Upload payment proof to Supabase Storage
    const fileExt = paymentProof.name.split(".").pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("payment-proofs")
      .upload(fileName, paymentProof)

    if (uploadError) {
      console.error("Upload error:", uploadError)
      // Fallback: store without file upload
      const { data, error } = await supabase
        .from("registrations")
        .insert({
          name,
          email,
          phone,
          phoneType,
          university,
          payment_proof_url: null,
          payment_status: "pending",
        })
        .select()

      if (error) {
        console.error("Database error:", error)
        if (error.code === "23505") {
          // Unique constraint violation
          return NextResponse.json(
            { error: "This email is already registered. Please use a different email address." },
            { status: 409 },
          )
        }
        return NextResponse.json({ error: "Registration failed" }, { status: 500 })
      }

      // Send notification email to admin (without payment proof link)
      let emailSent = false
      try {
        // Use direct email sending instead of Resend API
        const emailResponse = await sendAdminNotificationEmail({
          name,
          email,
          phone,
          phoneType,
          university,
          paymentProofUrl: null,
        })

        emailSent = emailResponse.success
        if (!emailResponse.success) {
          console.error("Email sending failed:", emailResponse.error)
        }
      } catch (emailError) {
        console.error("Email sending failed:", emailError)
      }

      return NextResponse.json({
        success: true,
        data,
        warning: "Registration successful, but payment proof upload failed. Admin will contact you for verification.",
        emailSent,
      })
    }

    const { data: urlData } = supabase.storage.from("payment-proofs").getPublicUrl(fileName)

    // Insert registration into database
    const { data, error } = await supabase
      .from("registrations")
      .insert({
        name,
        email,
        phone,
        phoneType,
        university,
        payment_proof_url: urlData.publicUrl,
        payment_status: "pending",
      })
      .select()

    if (error) {
      console.error("Database error:", error)
      if (error.code === "23505") {
        // Unique constraint violation - this shouldn't happen due to our check above, but just in case
        return NextResponse.json(
          { error: "This email is already registered. Please use a different email address." },
          { status: 409 },
        )
      }
      return NextResponse.json({ error: "Registration failed" }, { status: 500 })
    }

    // Send notification email to admin
    let emailSent = false
    try {
      // Use direct email sending instead of Resend API
      const emailResponse = await sendAdminNotificationEmail({
        name,
        email,
        phone,
        phoneType,
        university,
        paymentProofUrl: urlData.publicUrl,
      })

      emailSent = emailResponse.success
      if (!emailResponse.success) {
        console.error("Email sending failed:", emailResponse.error)
      }
    } catch (emailError) {
      console.error("Email sending failed:", emailError)
    }

    return NextResponse.json({
      success: true,
      data,
      emailSent,
      emailStatus: emailSent
        ? "Email notification sent successfully"
        : "Email notification failed to send, but registration was successful",
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function sendAdminNotificationEmail({
  name,
  email,
  phone,
  phoneType,
  university,
  paymentProofUrl,
}: {
  name: string
  email: string
  phone: string
  phoneType: string
  university: string
  paymentProofUrl: string | null
}) {
  try {
    // Check if RESEND_API_KEY is available
    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not configured")
      return { success: false, error: "Email service not configured" }
    }

    const emailContent = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #dc2626; margin-bottom: 20px;">TED<span style="color: #dc2626;">x</span>ECU</h1>
    <h2 style="color: #374151; margin-bottom: 20px;">Registration Confirmation</h2>
    
    <p>Dear ${name},</p>
    
    <p>Thank you for registering for TEDxECU 2025! We have received your registration and payment proof.</p>
    
    <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="color: #374151; margin-top: 0;">Your Registration Details:</h3>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone}</p>
      <p><strong>University:</strong> ${university}</p>
    </div>
    
    <div style="background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b;">
      <p style="margin: 0; color: #92400e;">
        <strong>Next Steps:</strong> Our team will review your payment proof and confirm your registration within 24-48 hours. You will receive your ticket via email once confirmed.
      </p>
    </div>
    
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      <p style="color: #6b7280; font-size: 14px; margin: 0;">
        Thank you for joining TEDxECU 2025 - Ideas Worth Spreading!
      </p>
    </div>
  </div>
`

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "onboarding@resend.dev", // Use Resend's default verified sender
        to: [email], // Send directly to the user's email
        subject: "TEDxECU Registration Confirmation - Payment Received",
        html: emailContent,
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      console.error("Email API error:", result)
      return { success: false, error: result.message || "Email sending failed" }
    }

    return { success: true, data: result }
  } catch (error) {
    console.error("Email sending error:", error)
    return { success: false, error: "Exception occurred while sending email" }
  }
}
