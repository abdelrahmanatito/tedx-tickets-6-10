import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Check if RESEND_API_KEY is available
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

    // Test email sending with detailed diagnostics
    const testEmail = "test@example.com" // Replace with a test email if needed

    // Create a simple test email
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #dc2626;">TEDxECU Email Service Test</h1>
        <p>This is a test email to verify that the email service is working correctly.</p>
        <p>If you received this email, your email configuration is working perfectly!</p>
        <p>Time sent: ${new Date().toISOString()}</p>
      </div>
    `

    console.log("Attempting to send test email...")

    const startTime = Date.now()
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "onboarding@resend.dev", // Use Resend's default verified sender
        to: [testEmail],
        subject: "TEDxECU Email Service Test",
        html: emailContent,
      }),
    })
    const endTime = Date.now()
    const responseTime = endTime - startTime

    const result = await response.json()

    if (!response.ok) {
      console.error("Email API error:", result)
      return NextResponse.json(
        {
          success: false,
          error: result.message || "Email sending failed",
          details: {
            statusCode: response.status,
            statusText: response.statusText,
            responseTime: `${responseTime}ms`,
            apiResponse: result,
            headers: Object.fromEntries(response.headers.entries()),
          },
          troubleshooting: [
            "Check if your RESEND_API_KEY is valid and not expired",
            "Verify you have enough email credits in your Resend account",
            "Check if there are any rate limits or restrictions on your account",
            "Try using a different sender email or getting a verified domain",
          ],
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: `Test email sent successfully to ${testEmail}`,
      details: {
        responseTime: `${responseTime}ms`,
        apiResponse: result,
        emailId: result.id,
        timestamp: new Date().toISOString(),
      },
      note: "Using Resend's default verified sender (onboarding@resend.dev)",
    })
  } catch (error) {
    console.error("Test email error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Exception occurred while sending test email",
        details: String(error),
        troubleshooting: [
          "Check your network connection",
          "Verify the Resend API is accessible from your server",
          "Check for any firewall or proxy issues",
        ],
      },
      { status: 500 },
    )
  }
}
