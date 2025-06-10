import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 })
    }

    // Get registration details first
    const { data: registration, error: fetchError } = await supabase
      .from("registrations")
      .select("id, name, email, payment_proof_url")
      .eq("id", id)
      .single()

    if (fetchError || !registration) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 })
    }

    // Delete the registration
    const { error: deleteError } = await supabase.from("registrations").delete().eq("id", id)

    if (deleteError) {
      console.error("Delete error:", deleteError)
      return NextResponse.json({ error: "Failed to delete registration" }, { status: 500 })
    }

    // Try to delete the payment proof file if it exists
    if (registration.payment_proof_url) {
      try {
        const url = new URL(registration.payment_proof_url)
        const pathParts = url.pathname.split("/")
        const filename = pathParts[pathParts.length - 1]

        if (filename && filename !== "payment-proofs") {
          await supabase.storage.from("payment-proofs").remove([filename])
        }
      } catch (fileError) {
        console.error("File deletion error:", fileError)
        // Don't fail the whole operation if file deletion fails
      }
    }

    return NextResponse.json({
      success: true,
      message: "Registration deleted successfully",
      deletedRecord: {
        id: registration.id,
        name: registration.name,
        email: registration.email,
      },
    })
  } catch (error) {
    console.error("Delete error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
