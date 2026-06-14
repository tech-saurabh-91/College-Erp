import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get("type")

  try {
    if (type === "enquiry") {
      const data = await prisma.enquiry.findMany({ orderBy: { createdAt: "desc" } })
      return NextResponse.json(data)
    }
    if (type === "application") {
      const data = await prisma.application.findMany({
        include: { program: true },
        orderBy: { createdAt: "desc" },
      })
      return NextResponse.json(data)
    }
    if (type === "merit") {
      const data = await prisma.meritList.findMany({
        include: { program: true, entries: { include: { application: true }, orderBy: { rank: "asc" } } },
        orderBy: { publishedDate: "desc" },
      })
      return NextResponse.json(data)
    }
    if (type === "enrolled") {
      const data = await prisma.seatAllotment.findMany({
        include: { application: true, program: true },
        orderBy: { allotmentDate: "desc" },
      })
      return NextResponse.json(data)
    }
    return NextResponse.json({ error: "Invalid type" }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { type } = body

    if (type === "enquiry") {
      const enquiry = await prisma.enquiry.create({
        data: {
          name: body.name,
          email: body.email,
          phone: body.phone,
          courseInterest: body.courseInterest,
          message: body.message,
          source: body.source || "WEBSITE",
          status: "NEW",
        },
      })
      return NextResponse.json(enquiry)
    }

    if (type === "application") {
      const count = await prisma.application.count()
      const applicationNo = `APP${String(count + 1).padStart(5, "0")}`
      const application = await prisma.application.create({
        data: {
          applicationNo,
          firstName: body.firstName,
          lastName: body.lastName,
          dateOfBirth: new Date(body.dateOfBirth),
          email: body.email,
          phone: body.phone,
          address: body.address,
          city: body.city,
          state: body.state,
          pincode: body.pincode,
          gender: body.gender,
          nationality: body.nationality || "Indian",
          category: body.category,
          fatherName: body.fatherName,
          motherName: body.motherName,
          guardianPhone: body.guardianPhone,
          programId: body.programId,
          academicYear: body.academicYear,
          percentage10: body.percentage10 ? parseFloat(body.percentage10) : null,
          percentage12: body.percentage12 ? parseFloat(body.percentage12) : null,
          graduationPct: body.graduationPct ? parseFloat(body.graduationPct) : null,
          status: "PENDING",
        },
      })
      return NextResponse.json(application)
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create record" }, { status: 500 })
  }
}
