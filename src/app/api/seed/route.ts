import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const key = searchParams.get("key")
  if (key !== "seed2025") return NextResponse.json({ error: "Invalid key" }, { status: 403 })

  try {
    const pw = await bcrypt.hash("password123", 10)
    const emails = ["admin@college.edu", "faculty1@college.edu", "faculty2@college.edu", "faculty3@college.edu", "student1@college.edu", "student2@college.edu", "student3@college.edu", "student4@college.edu", "student5@college.edu", "student6@college.edu", "student7@college.edu", "student8@college.edu", "student9@college.edu", "student10@college.edu", "student11@college.edu", "student12@college.edu", "parent1@college.edu", "parent2@college.edu"]

    for (const email of emails) {
      await prisma.user.upsert({
        where: { email },
        update: { password: pw, isActive: true },
        create: { email, password: pw, name: email.split("@")[0], role: "STUDENT", isActive: true },
      })
    }

    return NextResponse.json({ message: "Passwords reset", updated: emails.length })
  } catch (e: any) {
    return NextResponse.json({ error: e.message, stack: e.stack?.split("\n")[0] }, { status: 500 })
  }
}
