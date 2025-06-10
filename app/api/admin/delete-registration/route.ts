import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 })
    }

    console.log(`Attempting to delete registration with ID: ${id}`)

    // First, get the registration to check if there's a payment proof to delete
    const { data: registration, error: fetchError } = await supabase
      .from("registrations")
      .select("id, payment_proof_url, name, email")
      .eq("id", id)
      .single()

    if (fetchError) {
      console.error("Error fetching registration:", fetchError)

      // If it's a "not found" error, the record might already be deleted
      if (fetchError.code === "PGRST116") {
        return NextResponse.json(
          { error: "Registration not found - it may have already been deleted" },
          { status: 404 },
        )
      }

      return NextResponse.json(
        {
          error: "Failed to fetch registration",
          details: fetchError.message,
          code: fetchError.code,
        },
        { status: 500 },
      )
    }

    if (!registration) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 })
    }

    console.log(`Found registration for: ${registration.name} (${registration.email})`)

    // Try to delete the payment proof file if it exists
    let fileDeleteResult = { success: true, message: "No file to delete" }

    if (registration.payment_proof_url) {
      try {
        console.log(`Attempting to delete file: ${registration.payment_proof_url}`)

        // Extract filename from URL
        const url = new URL(registration.payment_proof_url)
        const pathParts = url.pathname.split("/")
        const filename = pathParts[pathParts.length - 1]

        if (filename && filename !== "payment-proofs") {
          console.log(`Deleting file: ${filename}`)

          const { error: deleteFileError } = await supabase.storage.from("payment-proofs").remove([filename])

          if (deleteFileError) {
            console.error("Error deleting file:", deleteFileError)
            fileDeleteResult = {
              success: false,
              message: `File deletion failed: ${deleteFileError.message}`,
            }
          } else {
            console.log("File deleted successfully")
            fileDeleteResult = { success: true, message: "File deleted successfully" }
          }
        }
      } catch (fileError) {
        console.error("Error processing file deletion:", fileError)
        fileDeleteResult = {
          success: false,
          message: `File deletion error: ${fileError}`,
        }
      }
    }

    // Delete the registration record (proceed even if file deletion failed)
    console.log("Attempting to delete registration record...")

    const { error: deleteError, count } = await supabase.from("registrations").delete().eq("id", id)

    if (deleteError) {
      console.error("Database delete error:", deleteError)
      return NextResponse.json(
        {
          error: "Failed to delete registration",
          details: deleteError.message,
          code: deleteError.code,
          hint: deleteError.hint,
          fileDeleteResult,
        },
        { status: 500 },
      )
    }

    console.log(`Delete operation completed. Affected rows: ${count}`)

    // Check if any rows were actually deleted
    if (count === 0) {
      return NextResponse.json(
        {
          error: "No registration was deleted - record may not exist",
          fileDeleteResult,
        },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Registration deleted successfully",
      deletedRecord: {
        id: registration.id,
        name: registration.name,
        email: registration.email,
      },
      fileDeleteResult,
    })
  } catch (error) {
    console.error("Delete error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: String(error),
      },
      { status: 500 },
    )
  }
}

// Also add a GET method to test if the API is working
export async function GET() {
  try {
    // Test database connection and permissions
    const { data, error } = await supabase.from("registrations").select("count", { count: "exact", head: true })

    if (error) {
      return NextResponse.json({
        status: "error",
        message: "Database connection failed",
        error: error.message,
        code: error.code,
      })
    }

    return NextResponse.json({
      status: "ok",
      message: "Delete API is working",
      totalRegistrations: data?.length || 0,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json({
      status: "error",
      message: "API test failed",
      error: String(error),
    })
  }
}
