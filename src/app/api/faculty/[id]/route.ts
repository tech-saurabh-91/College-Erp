import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const faculty = await prisma.faculty.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, name: true, role: true, isActive: true } },
        facultySubjects: { include: { course: true, subject: true } },
        leaveRequests: { orderBy: { createdAt: "desc" } },
      },
    })
    if (!faculty) return NextResponse.json({ error: "Faculty not found" }, { status: 404 })
    return NextResponse.json(faculty)
  } catch {
    return NextResponse.json({ error: "Failed to fetch faculty" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const body = await req.json()
    const faculty = await prisma.faculty.update({
      where: { id },
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        phone: body.phone,
        department: body.department,
        designation: body.designation,
        qualification: body.qualification,
        specialization: body.specialization,
        salary: body.salary ? parseFloat(body.salary) : null,
        address: body.address,
        isActive: body.isActive !== undefined ? body.isActive : undefined,
      },
      include: { user: true },
    })
    return NextResponse.json(faculty)
  } catch {
    return NextResponse.json({ error: "Failed to update faculty" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const faculty = await prisma.faculty.findUnique({ where: { id } })
    if (!faculty) return NextResponse.json({ error: "Faculty not found" }, { status: 404 })
    await prisma.facultySubject.deleteMany({ where: { facultyId: id } })
    await prisma.leaveRequest.deleteMany({ where: { facultyId: id } })
    await prisma.timetable.deleteMany({ where: { facultyId: id } })
    await prisma.faculty.delete({ where: { id } })
    await prisma.user.delete({ where: { id: faculty.userId } })
    return NextResponse.json({ message: "Faculty deleted" })
  } catch {
    return NextResponse.json({ error: "Failed to delete faculty" }, { status: 500 })
  }
}
