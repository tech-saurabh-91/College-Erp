import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const key = searchParams.get("key")
  if (key !== "seed2025") return NextResponse.json({ error: "Invalid key" }, { status: 403 })

  try {
    const pw = await bcrypt.hash("password123", 10)

    const adminUser = await prisma.user.upsert({
      where: { email: "admin@college.edu" },
      update: { isActive: true },
      create: { email: "admin@college.edu", password: pw, name: "Admin User", role: "ADMIN", phone: "+91-9876543210", isActive: true },
    })

    const f1 = await prisma.user.upsert({
      where: { email: "faculty1@college.edu" },
      update: {},
      create: { email: "faculty1@college.edu", password: pw, name: "Dr. Rajesh Sharma", role: "FACULTY", phone: "+91-9876543211", isActive: true },
    })

    for (let i = 1; i <= 5; i++) {
      await prisma.user.upsert({
        where: { email: `student${i}@college.edu` },
        update: {},
        create: { email: `student${i}@college.edu`, password: pw, name: `Student ${i}`, role: "STUDENT", phone: `+91-98765432${10+i}`, isActive: true },
      })
    }

    await prisma.user.upsert({
      where: { email: "parent1@college.edu" },
      update: {},
      create: { email: "parent1@college.edu", password: pw, name: "Parent User", role: "PARENT", phone: "+91-9876543301", isActive: true },
    })

    return NextResponse.json({
      message: "Users seeded. Login: admin@college.edu / password123",
      users: await prisma.user.count(),
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message, stack: e.stack }, { status: 500 })
  }
}
