import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { id, status } = await request.json()

    if (!id || !status) {
      return NextResponse.json({ error: "ID and status are required" }, { status: 400 })
    }

    if (!["confirmed", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    // Generate ticket ID for confirmed registrations
    let ticketId = null
    if (status === "confirmed") {
      ticketId = Math.floor(100000 + Math.random() * 900000).toString()
    }

    const updateData: any = {
      payment_status: status,
      confirmed_at: status === "confirmed" ? new Date().toISOString() : null,
    }

    if (ticketId) {
      updateData.ticket_id = ticketId
    }

    const { data, error } = await supabase.from("registrations").update(updateData).eq("id", id).select().single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to update status" }, { status: 500 })
    }

    // Send ticket email automatically if confirmed
    if (status === "confirmed" && data) {
      try {
        await sendTicketEmail(data)
      } catch (emailError) {
        console.error("Email sending failed:", emailError)
        // Don't fail the status update if email fails
      }
    }

    return NextResponse.json({
      success: true,
      message: `Registration ${status} successfully${status === "confirmed" ? " and ticket email sent" : ""}`,
      data,
    })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function sendTicketEmail(registration: any) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("Email service not configured")
  }

  const emailContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #dc2626; font-size: 36px; margin: 0;">TED<span style="color: #dc2626;">x</span>ECU</h1>
        <p style="color: #6b7280; margin: 5px 0;">x = independently organized TED event</p>
      </div>
      
      <div style="background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
        <h2 style="margin: 0 0 10px 0; font-size: 28px;">🎉 Your ticket is confirmed!</h2>
        <p style="margin: 0; opacity: 0.9;">Get ready for an amazing experience!</p>
      </div>
      
      <p style="font-size: 18px; color: #374151;">Dear ${registration.name},</p>
      <p style="color: #6b7280; line-height: 1.6;">
        Congratulations! Your payment has been confirmed and your ticket is ready.
      </p>
      
      <div style="background: #f9fafb; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #dc2626;">
        <h3 style="color: #374151; margin-top: 0;">🎫 Your Ticket Details</h3>
        <p><strong>Name:</strong> ${registration.name}</p>
        <p><strong>Email:</strong> ${registration.email}</p>
        <p><strong>Ticket ID:</strong> <span style="color: #dc2626; font-weight: bold;">${registration.ticket_id}</span></p>
        <p><strong>Date:</strong> June 20, 2025</p>
        <p><strong>Time:</strong> 9:00 AM - 6:00 PM</p>
        <p><strong>Venue:</strong> Egyptian Chinese University</p>
      </div>
      
      <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 25px 0;">
        <h4 style="color: #92400e; margin-top: 0;">📱 Important Instructions:</h4>
        <ul style="color: #92400e; margin: 0; padding-left: 20px;">
          <li>Present your Ticket ID (${registration.ticket_id}) at the venue</li>
          <li>Arrive 30 minutes before the event starts</li>
          <li>Bring a valid ID for verification</li>
        </ul>
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
      to: [registration.email],
      subject: "🎫 Your TEDxECU Ticket - Payment Confirmed!",
      html: emailContent,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || "Email sending failed")
  }

  // Update ticket_sent status
  await supabase.from("registrations").update({ ticket_sent: true }).eq("id", registration.id)
}
