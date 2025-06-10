import { NextResponse } from "next/server"

export async function GET() {
  try {
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: "RESEND_API_KEY is not configured",
          message: "Please add the RESEND_API_KEY environment variable to enable email functionality.",
        },
        { status: 500 },
      )
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "onboarding@resend.dev",
        to: ["test@example.com"],
        subject: "TEDxECU Email Test - Service Working ✅",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #dc2626;">TEDxECU Email Service Test</h1>
            <p>This is a test email to verify that the email service is working correctly.</p>
            <p>Time sent: ${new Date().toISOString()}</p>
          </div>
        `,
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: result.message || "Email sending failed",
          details: result,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Test email sent successfully",
      details: result,
    })
  } catch (error) {
    console.error("Test email error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Exception occurred while sending test email",
        details: String(error),
      },
      { status: 500 },
    )
  }
}
