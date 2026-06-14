import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const student = await prisma.student.findUnique({
      where: { id },
      include: { program: true, user: true },
    })
    if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 })
    return NextResponse.json(student)
  } catch {
    return NextResponse.json({ error: "Failed to fetch student" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const body = await req.json()
    const student = await prisma.student.update({
      where: { id },
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : undefined,
        gender: body.gender,
        bloodGroup: body.bloodGroup,
        phone: body.phone,
        address: body.address,
        city: body.city,
        state: body.state,
        pincode: body.pincode,
        nationality: body.nationality,
        category: body.category,
        religion: body.religion,
        aadharNo: body.aadharNo,
        fatherName: body.fatherName,
        fatherPhone: body.fatherPhone,
        fatherOccupation: body.fatherOccupation,
        motherName: body.motherName,
        motherPhone: body.motherPhone,
        motherOccupation: body.motherOccupation,
        guardianName: body.guardianName,
        guardianPhone: body.guardianPhone,
        programId: body.programId,
        classSectionId: body.classSectionId || null,
        currentSemester: body.currentSemester,
        batchYear: body.batchYear,
        status: body.status,
      },
      include: { program: true },
    })
    return NextResponse.json(student)
  } catch {
    return NextResponse.json({ error: "Failed to update student" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const student = await prisma.student.findUnique({ where: { id } })
    if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 })
    await prisma.student.delete({ where: { id } })
    await prisma.user.delete({ where: { id: student.userId } })
    return NextResponse.json({ message: "Student deleted" })
  } catch {
    return NextResponse.json({ error: "Failed to delete student" }, { status: 500 })
  }
}
