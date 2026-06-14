import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const body = await req.json()
    const { type } = body

    if (type === "enquiry") {
      const data = await prisma.enquiry.update({
        where: { id },
        data: {
          name: body.name,
          email: body.email,
          phone: body.phone,
          courseInterest: body.courseInterest,
          message: body.message,
          source: body.source,
          status: body.status,
        },
      })
      return NextResponse.json(data)
    }

    if (type === "application") {
      const data = await prisma.application.update({
        where: { id },
        data: {
          firstName: body.firstName,
          lastName: body.lastName,
          dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : undefined,
          email: body.email,
          phone: body.phone,
          address: body.address,
          city: body.city,
          state: body.state,
          pincode: body.pincode,
          gender: body.gender,
          nationality: body.nationality,
          category: body.category,
          fatherName: body.fatherName,
          motherName: body.motherName,
          guardianPhone: body.guardianPhone,
          programId: body.programId,
          academicYear: body.academicYear,
          percentage10: body.percentage10 ? parseFloat(body.percentage10) : null,
          percentage12: body.percentage12 ? parseFloat(body.percentage12) : null,
          graduationPct: body.graduationPct ? parseFloat(body.graduationPct) : null,
          status: body.status,
        },
        include: { program: true },
      })
      return NextResponse.json(data)
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 })
  } catch {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get("type")

    if (type === "enquiry") {
      await prisma.enquiry.delete({ where: { id } })
    } else if (type === "application") {
      await prisma.application.delete({ where: { id } })
    } else {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 })
    }
    return NextResponse.json({ message: "Deleted" })
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 })
  }
}
