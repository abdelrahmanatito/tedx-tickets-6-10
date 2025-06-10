import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET() {
  try {
    const { data, error } = await supabase.from("registrations").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to fetch registrations" }, { status: 500 })
    }

    // Convert data to CSV format
    const csvHeaders = [
      "Name",
      "Email",
      "Phone",
      "University",
      "Payment Status",
      "Ticket ID",
      "Registration Date",
      "Confirmation Date",
      "Ticket Sent",
    ]

    const csvRows = data.map((registration) => [
      registration.name,
      registration.email,
      registration.phone,
      registration.university,
      registration.payment_status,
      registration.ticket_id || "",
      new Date(registration.created_at).toLocaleDateString(),
      registration.confirmed_at ? new Date(registration.confirmed_at).toLocaleDateString() : "",
      registration.ticket_sent ? "Yes" : "No",
    ])

    // Create CSV content
    const csvContent = [csvHeaders.join(","), ...csvRows.map((row) => row.map((field) => `"${field}"`).join(","))].join(
      "\n",
    )

    // Return CSV file
    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="tedxecu-registrations-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error("Export error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
