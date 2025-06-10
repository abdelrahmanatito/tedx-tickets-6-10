import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { registration, ticketData } = await request.json()

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: "Email service not configured" }, { status: 500 })
    }

    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #dc2626; font-size: 36px; margin: 0;">TED<span style="color: #dc2626;">x</span>ECU</h1>
          <p style="color: #6b7280; margin: 5px 0;">x = independently organized TED event</p>
        </div>
        
        <div style="background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
          <h2 style="margin: 0 0 10px 0; font-size: 28px;">🎉 Your ticket is ready!</h2>
          <p style="margin: 0; opacity: 0.9;">Get ready for an amazing experience!</p>
        </div>
        
        <p style="font-size: 18px; color: #374151;">Dear ${registration.name},</p>
        <p style="color: #6b7280; line-height: 1.6;">
          Your ticket for TEDxECU 2025 is confirmed and ready!
        </p>
        
        <div style="background: #f9fafb; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #dc2626;">
          <h3 style="color: #374151; margin-top: 0;">🎫 Your Ticket Details</h3>
          <p><strong>Name:</strong> ${ticketData.name}</p>
          <p><strong>Email:</strong> ${registration.email}</p>
          <p><strong>Ticket ID:</strong> <span style="color: #dc2626; font-weight: bold;">${ticketData.ticketId}</span></p>
          <p><strong>Date:</strong> ${ticketData.date}</p>
          <p><strong>Time:</strong> ${ticketData.time}</p>
          <p><strong>Venue:</strong> ${ticketData.venue}</p>
          <p><strong>Seat:</strong> ${ticketData.seat}</p>
        </div>
        
        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 25px 0;">
          <h4 style="color: #92400e; margin-top: 0;">📱 Important Instructions:</h4>
          <ul style="color: #92400e; margin: 0; padding-left: 20px;">
            <li>Present your Ticket ID (${ticketData.ticketId}) at the venue</li>
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
        subject: "🎫 Your TEDxECU Ticket is Ready!",
        html: emailContent,
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      return NextResponse.json({ error: result.message || "Email sending failed" }, { status: 500 })
    }

    // Update ticket_sent status
    await supabase.from("registrations").update({ ticket_sent: true }).eq("id", registration.id)

    return NextResponse.json({ message: "Ticket sent successfully!" })
  } catch (error) {
    console.error("Error sending ticket:", error)
    return NextResponse.json({ error: "Failed to send ticket" }, { status: 500 })
  }
}
