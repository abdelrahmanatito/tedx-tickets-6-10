import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

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
      console.error("Error checking existing user:", checkError)
      return NextResponse.json({ error: "Database error occurred" }, { status: 500 })
    }

    if (existingUser) {
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

    // Upload payment proof to Supabase Storage
    const fileExt = paymentProof.name.split(".").pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("payment-proofs")
      .upload(fileName, paymentProof)

    let paymentProofUrl = null
    if (!uploadError && uploadData) {
      const { data: urlData } = supabase.storage.from("payment-proofs").getPublicUrl(fileName)
      paymentProofUrl = urlData.publicUrl
    }

    // Insert registration into database
    const { data, error } = await supabase
      .from("registrations")
      .insert({
        name,
        email,
        phone,
        phone_type: phoneType,
        university,
        payment_proof_url: paymentProofUrl,
        payment_status: "pending",
      })
      .select()

    if (error) {
      console.error("Database error:", error)
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "This email is already registered. Please use a different email address." },
          { status: 409 },
        )
      }
      return NextResponse.json({ error: "Registration failed" }, { status: 500 })
    }

    // Send confirmation email
    let emailSent = false
    try {
      const emailResponse = await sendConfirmationEmail({
        name,
        email,
        phone,
        phoneType,
        university,
      })
      emailSent = emailResponse.success
    } catch (emailError) {
      console.error("Email sending failed:", emailError)
    }

    return NextResponse.json({
      success: true,
      data,
      emailSent,
      message: uploadError
        ? "Registration successful, but payment proof upload failed. Admin will contact you for verification."
        : "Registration submitted successfully!",
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function sendConfirmationEmail({
  name,
  email,
  phone,
  phoneType,
  university,
}: {
  name: string
  email: string
  phone: string
  phoneType: string
  university: string
}) {
  try {
    if (!process.env.RESEND_API_KEY) {
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
        from: "onboarding@resend.dev",
        to: [email],
        subject: "TEDxECU Registration Confirmation - Payment Received",
        html: emailContent,
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      return { success: false, error: result.message || "Email sending failed" }
    }

    return { success: true, data: result }
  } catch (error) {
    return { success: false, error: "Exception occurred while sending email" }
  }
}
