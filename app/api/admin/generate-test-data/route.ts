import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// Sample data for generating realistic test users
const firstNames = [
  "Ahmed",
  "Mohamed",
  "Omar",
  "Ali",
  "Hassan",
  "Mahmoud",
  "Youssef",
  "Khaled",
  "Amr",
  "Tamer",
  "Fatma",
  "Aisha",
  "Maryam",
  "Nour",
  "Sara",
  "Dina",
  "Rana",
  "Heba",
  "Yasmin",
  "Nada",
  "John",
  "David",
  "Michael",
  "James",
  "Robert",
  "William",
  "Richard",
  "Joseph",
  "Thomas",
  "Christopher",
  "Mary",
  "Patricia",
  "Jennifer",
  "Linda",
  "Elizabeth",
  "Barbara",
  "Susan",
  "Jessica",
  "Sarah",
  "Karen",
]

const lastNames = [
  "Ibrahim",
  "Hassan",
  "Mohamed",
  "Ali",
  "Mahmoud",
  "Ahmed",
  "Omar",
  "Youssef",
  "Khaled",
  "Amr",
  "Smith",
  "Johnson",
  "Williams",
  "Brown",
  "Jones",
  "Garcia",
  "Miller",
  "Davis",
  "Rodriguez",
  "Martinez",
  "Wilson",
  "Anderson",
  "Taylor",
  "Thomas",
  "Hernandez",
  "Moore",
  "Martin",
  "Jackson",
  "Thompson",
  "White",
]

const universities = [
  "Cairo University",
  "American University in Cairo",
  "Ain Shams University",
  "Alexandria University",
  "Helwan University",
  "Mansoura University",
  "Assiut University",
  "Zagazig University",
  "Tanta University",
  "Suez Canal University",
  "Benha University",
  "Fayoum University",
  "Beni-Suef University",
  "Minia University",
  "South Valley University",
  "Egyptian Chinese University",
  "German University in Cairo",
  "British University in Egypt",
  "Future University in Egypt",
  "Modern Sciences and Arts University",
]

const emailDomains = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "student.edu.eg"]
const paymentStatuses = ["pending", "confirmed", "rejected"]

function getRandomElement(array: any[]) {
  return array[Math.floor(Math.random() * array.length)]
}

function generateRandomPhone() {
  const prefixes = ["010", "011", "012", "015"]
  const prefix = getRandomElement(prefixes)
  const remaining = Math.floor(Math.random() * 100000000)
    .toString()
    .padStart(8, "0")
  return prefix + remaining
}

function generateRandomEmail(firstName: string, lastName: string) {
  const domain = getRandomElement(emailDomains)
  const variations = [
    `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`,
    `${firstName.toLowerCase()}${lastName.toLowerCase()}@${domain}`,
    `${firstName.toLowerCase()}${Math.floor(Math.random() * 1000)}@${domain}`,
    `${firstName.toLowerCase()}_${lastName.toLowerCase()}@${domain}`,
  ]
  return getRandomElement(variations)
}

function generateTicketId() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

function generateRandomDate(start: Date, end: Date) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

export async function POST() {
  try {
    console.log("🚀 Starting to generate 500 test users...")

    const users = []
    const startDate = new Date("2024-01-01")
    const endDate = new Date()

    for (let i = 0; i < 500; i++) {
      const firstName = getRandomElement(firstNames)
      const lastName = getRandomElement(lastNames)
      const paymentStatus = getRandomElement(paymentStatuses)
      const createdAt = generateRandomDate(startDate, endDate)

      const user = {
        name: `${firstName} ${lastName}`,
        email: generateRandomEmail(firstName, lastName),
        phone: generateRandomPhone(),
        university: getRandomElement(universities),
        payment_proof_url: `https://example.com/payment-proof-${i + 1}.jpg`,
        payment_status: paymentStatus,
        ticket_id: paymentStatus === "confirmed" ? generateTicketId() : null,
        created_at: createdAt.toISOString(),
        confirmed_at: paymentStatus === "confirmed" ? generateRandomDate(createdAt, endDate).toISOString() : null,
        ticket_sent: paymentStatus === "confirmed" ? Math.random() > 0.3 : false,
      }

      users.push(user)
    }

    console.log("💾 Inserting users into database...")

    // Insert users in batches of 50
    const batchSize = 50
    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize)

      try {
        const { error } = await supabase.from("registrations").insert(batch)

        if (error) {
          console.error(`❌ Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error)
          errorCount += batch.length
        } else {
          successCount += batch.length
          console.log(`✅ Successfully inserted batch ${Math.floor(i / batchSize) + 1}`)
        }
      } catch (err) {
        console.error(`❌ Exception in batch ${Math.floor(i / batchSize) + 1}:`, err)
        errorCount += batch.length
      }
    }

    // Generate statistics
    const statusCounts = users.reduce((acc: any, user) => {
      acc[user.payment_status] = (acc[user.payment_status] || 0) + 1
      return acc
    }, {})

    return NextResponse.json({
      success: true,
      message: "Test data generated successfully!",
      summary: {
        totalAttempted: users.length,
        successCount,
        errorCount,
        statusDistribution: statusCounts,
      },
    })
  } catch (error) {
    console.error("Error generating test data:", error)
    return NextResponse.json({ error: "Failed to generate test data", details: String(error) }, { status: 500 })
  }
}
