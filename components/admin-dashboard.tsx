"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"

export function AdminDashboard() {
  const [testDataLoading, setTestDataLoading] = useState(false)
  const [emailTestLoading, setEmailTestLoading] = useState(false)
  const [emailStatus, setEmailStatus] = useState<{ success: boolean; message: string } | null>(null)

  const handleGenerateTestData = async () => {
    setTestDataLoading(true)
    try {
      await fetch("/api/admin/generate-test-data")
      // Optionally, handle success or failure feedback
    } catch (error) {
      console.error("Error generating test data:", error)
    } finally {
      setTestDataLoading(false)
    }
  }

  const testEmailService = async () => {
    setEmailTestLoading(true)
    try {
      const response = await fetch("/api/admin/test-email")
      const data = await response.json()
      if (data.success) {
        setEmailStatus({ success: true, message: data.message })
      } else {
        setEmailStatus({ success: false, message: data.message })
      }
    } catch (error) {
      console.error("Error testing email:", error)
      setEmailStatus({ success: false, message: "Error testing email service." })
    } finally {
      setEmailTestLoading(false)
    }
  }

  const handleTestEmailService = async () => {
    setEmailTestLoading(true)
    try {
      const response = await fetch("/api/admin/test-email-service")
      const result = await response.json()

      if (result.success) {
        setEmailStatus({
          success: true,
          message: `${result.message} (Response time: ${result.details.responseTime})`,
        })
      } else {
        setEmailStatus({
          success: false,
          message: `Advanced email test failed: ${result.error}. Check console for details.`,
        })
        console.error("Email test details:", result)
      }
    } catch (error) {
      console.error("Error testing email:", error)
      setEmailStatus({ success: false, message: "Error testing email service. Check console for details." })
    } finally {
      setEmailTestLoading(false)
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>

      <section className="mb-4">
        <h2 className="text-xl font-semibold mb-2">System Controls</h2>
        <div className="flex gap-2">
          <Button onClick={testEmailService} disabled={emailTestLoading} variant="outline">
            {emailTestLoading ? "Testing..." : "Test Email Service"}
          </Button>
          <Button
            onClick={handleTestEmailService}
            disabled={emailTestLoading}
            variant="outline"
            className="border-blue-600 text-blue-400 hover:text-blue-300"
          >
            Advanced Email Test
          </Button>
          <Button
            onClick={handleGenerateTestData}
            disabled={testDataLoading}
            variant="outline"
            className="border-purple-600 text-purple-400 hover:text-purple-300"
          >
            {testDataLoading ? "Generating..." : "Generate 500 Test Users"}
          </Button>
        </div>
        {emailStatus && (
          <div
            className={`mt-2 p-2 rounded ${emailStatus.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
          >
            {emailStatus.message}
          </div>
        )}
      </section>

      {/* Add more sections for other admin functionalities */}
    </div>
  )
}
