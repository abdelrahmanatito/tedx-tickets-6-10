"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, Clock, Download, Mail, Trash2, Search, RefreshCw, Users, DollarSign } from "lucide-react"

interface Registration {
  id: string
  name: string
  email: string
  phone: string
  phone_type: string
  university: string
  payment_proof_url: string | null
  payment_status: "pending" | "confirmed" | "rejected"
  ticket_id: string | null
  created_at: string
  confirmed_at: string | null
  ticket_sent: boolean
}

export function AdminDashboard() {
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    fetchRegistrations()
  }, [])

  const fetchRegistrations = async () => {
    try {
      const response = await fetch("/api/admin/registrations")
      const data = await response.json()
      if (response.ok) {
        setRegistrations(data)
      } else {
        setMessage({ type: "error", text: "Failed to fetch registrations" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Error fetching registrations" })
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id: string, status: "confirmed" | "rejected") => {
    setActionLoading(id)
    try {
      const response = await fetch("/api/admin/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      })

      const result = await response.json()
      if (response.ok) {
        setMessage({ type: "success", text: result.message })
        fetchRegistrations()
      } else {
        setMessage({ type: "error", text: result.error })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Error updating status" })
    } finally {
      setActionLoading(null)
    }
  }

  const sendTicket = async (registration: Registration) => {
    setActionLoading(registration.id)
    try {
      const response = await fetch("/api/admin/send-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registration,
          ticketData: {
            name: registration.name,
            ticketId: registration.ticket_id,
            email: registration.email,
            university: registration.university,
            date: "June 20, 2025",
            time: "9:00 AM - 6:00 PM",
            venue: "Egyptian Chinese University",
            seat: "General Admission",
          },
        }),
      })

      const result = await response.json()
      if (response.ok) {
        setMessage({ type: "success", text: "Ticket sent successfully!" })
        fetchRegistrations()
      } else {
        setMessage({ type: "error", text: result.error })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Error sending ticket" })
    } finally {
      setActionLoading(null)
    }
  }

  const deleteRegistration = async (id: string) => {
    if (!confirm("Are you sure you want to delete this registration?")) return

    setActionLoading(id)
    try {
      const response = await fetch("/api/admin/delete-registration", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })

      const result = await response.json()
      if (response.ok) {
        setMessage({ type: "success", text: "Registration deleted successfully" })
        fetchRegistrations()
      } else {
        setMessage({ type: "error", text: result.error })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Error deleting registration" })
    } finally {
      setActionLoading(null)
    }
  }

  const exportData = async () => {
    try {
      const response = await fetch("/api/admin/export-excel")
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `tedxecu-registrations-${new Date().toISOString().split("T")[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        setMessage({ type: "success", text: "Data exported successfully" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Error exporting data" })
    }
  }

  const testEmail = async () => {
    setActionLoading("email-test")
    try {
      const response = await fetch("/api/test-email")
      const result = await response.json()
      if (result.success) {
        setMessage({ type: "success", text: result.message })
      } else {
        setMessage({ type: "error", text: result.error })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Error testing email" })
    } finally {
      setActionLoading(null)
    }
  }

  const filteredRegistrations = registrations.filter((reg) => {
    const matchesSearch =
      reg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.university.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || reg.payment_status === statusFilter

    return matchesSearch && matchesStatus
  })

  const stats = {
    total: registrations.length,
    pending: registrations.filter((r) => r.payment_status === "pending").length,
    confirmed: registrations.filter((r) => r.payment_status === "confirmed").length,
    rejected: registrations.filter((r) => r.payment_status === "rejected").length,
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return (
          <Badge className="bg-green-500">
            <CheckCircle className="w-3 h-3 mr-1" />
            Confirmed
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        )
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-red-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/80 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-400">Total Registrations</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/80 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-400">Pending</p>
                <p className="text-2xl font-bold text-white">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/80 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-400">Confirmed</p>
                <p className="text-2xl font-bold text-white">{stats.confirmed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/80 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-400">Revenue</p>
                <p className="text-2xl font-bold text-white">{stats.confirmed * 350} EGP</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card className="bg-slate-800/80 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Admin Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <Button onClick={fetchRegistrations} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Data
            </Button>
            <Button onClick={exportData} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={testEmail} variant="outline" disabled={actionLoading === "email-test"}>
              <Mail className="w-4 h-4 mr-2" />
              {actionLoading === "email-test" ? "Testing..." : "Test Email"}
            </Button>
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="search" className="text-slate-200">
                Search
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  id="search"
                  placeholder="Search by name, email, or university..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-700/50 border-slate-600 text-white"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status" className="text-slate-200">
                Filter by Status
              </Label>
              <select
                id="status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-md text-white"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Message Alert */}
      {message && (
        <Alert
          className={message.type === "success" ? "border-green-500 bg-green-500/10" : "border-red-500 bg-red-500/10"}
        >
          <AlertDescription className={message.type === "success" ? "text-green-300" : "text-red-300"}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      {/* Registrations Table */}
      <Card className="bg-slate-800/80 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Registrations ({filteredRegistrations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700">
                  <TableHead className="text-slate-300">Name</TableHead>
                  <TableHead className="text-slate-300">Email</TableHead>
                  <TableHead className="text-slate-300">Phone</TableHead>
                  <TableHead className="text-slate-300">University</TableHead>
                  <TableHead className="text-slate-300">Status</TableHead>
                  <TableHead className="text-slate-300">Ticket ID</TableHead>
                  <TableHead className="text-slate-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRegistrations.map((registration) => (
                  <TableRow key={registration.id} className="border-slate-700">
                    <TableCell className="text-white font-medium">{registration.name}</TableCell>
                    <TableCell className="text-slate-300">{registration.email}</TableCell>
                    <TableCell className="text-slate-300">{registration.phone}</TableCell>
                    <TableCell className="text-slate-300">{registration.university}</TableCell>
                    <TableCell>{getStatusBadge(registration.payment_status)}</TableCell>
                    <TableCell className="text-slate-300 font-mono">{registration.ticket_id || "-"}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {registration.payment_status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => updateStatus(registration.id, "confirmed")}
                              disabled={actionLoading === registration.id}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Confirm
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => updateStatus(registration.id, "rejected")}
                              disabled={actionLoading === registration.id}
                            >
                              <XCircle className="w-3 h-3 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                        {registration.payment_status === "confirmed" && !registration.ticket_sent && (
                          <Button
                            size="sm"
                            onClick={() => sendTicket(registration)}
                            disabled={actionLoading === registration.id}
                            variant="outline"
                          >
                            <Mail className="w-3 h-3 mr-1" />
                            Send Ticket
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteRegistration(registration.id)}
                          disabled={actionLoading === registration.id}
                          className="text-red-400 border-red-600 hover:bg-red-600/20"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
