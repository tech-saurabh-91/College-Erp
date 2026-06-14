import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get("type")
  const search = searchParams.get("search")
  const department = searchParams.get("department")
  const facultyId = searchParams.get("facultyId")

  try {
    if (type === "list" || !type) {
      const where: any = {}
      if (search) {
        where.OR = [
          { firstName: { contains: search, mode: "insensitive" } },
          { lastName: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { employeeId: { contains: search, mode: "insensitive" } },
        ]
      }
      if (department) where.department = department
      const faculty = await prisma.faculty.findMany({
        where,
        include: { user: { select: { isActive: true } }, _count: { select: { facultySubjects: true, leaveRequests: true } } },
        orderBy: { firstName: "asc" },
      })
      return NextResponse.json(faculty)
    }

    if (type === "single" && facultyId) {
      const faculty = await prisma.faculty.findUnique({
        where: { id: facultyId },
        include: {
          user: true,
          facultySubjects: { include: { course: true, subject: true } },
          leaveRequests: { orderBy: { createdAt: "desc" } },
        },
      })
      if (!faculty) return NextResponse.json({ error: "Not found" }, { status: 404 })
      return NextResponse.json(faculty)
    }

    if (type === "subjects") {
      const where: any = {}
      if (facultyId) where.facultyId = facultyId
      const data = await prisma.facultySubject.findMany({
        where,
        include: { course: true, subject: true, faculty: true },
        orderBy: { semester: "asc" },
      })
      return NextResponse.json(data)
    }

    if (type === "leaves") {
      const where: any = {}
      if (facultyId) where.facultyId = facultyId
      const data = await prisma.leaveRequest.findMany({
        where,
        include: { faculty: true },
        orderBy: { createdAt: "desc" },
      })
      return NextResponse.json(data)
    }

    if (type === "departments") {
      const data = await prisma.faculty.findMany({
        where: { isActive: true },
        select: { department: true },
        distinct: ["department"],
        orderBy: { department: "asc" },
      })
      return NextResponse.json(data.map(d => d.department))
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch faculty" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { type } = body

    if (type === "faculty") {
      const existingUser = await prisma.user.findUnique({ where: { email: body.email } })
      if (existingUser) return NextResponse.json({ error: "Email already exists" }, { status: 400 })

      const hashedPassword = await bcrypt.hash("changeme123", 10)
      const user = await prisma.user.create({
        data: {
          email: body.email,
          password: hashedPassword,
          name: `${body.firstName} ${body.lastName}`,
          role: "FACULTY",
          phone: body.phone,
        },
      })

      const facultyCount = await prisma.faculty.count()
      const employeeId = `FAC${String(facultyCount + 1).padStart(4, "0")}`

      const faculty = await prisma.faculty.create({
        data: {
          userId: user.id,
          employeeId,
          firstName: body.firstName,
          lastName: body.lastName,
          email: body.email,
          phone: body.phone,
          department: body.department,
          designation: body.designation,
          qualification: body.qualification,
          specialization: body.specialization,
          dateOfJoining: new Date(body.dateOfJoining),
          salary: body.salary ? parseFloat(body.salary) : null,
          address: body.address,
        },
        include: { user: true },
      })
      return NextResponse.json(faculty)
    }

    if (type === "subject") {
      const existing = await prisma.facultySubject.findFirst({
        where: { facultyId: body.facultyId, subjectId: body.subjectId, academicYear: body.academicYear },
      })
      if (existing) return NextResponse.json(existing)
      const fs = await prisma.facultySubject.create({
        data: {
          facultyId: body.facultyId,
          courseId: body.courseId,
          subjectId: body.subjectId,
          semester: parseInt(body.semester),
          academicYear: body.academicYear,
        },
        include: { faculty: true, course: true, subject: true },
      })
      return NextResponse.json(fs)
    }

    if (type === "leave") {
      const leave = await prisma.leaveRequest.create({
        data: {
          facultyId: body.facultyId,
          type: body.leaveType,
          startDate: new Date(body.startDate),
          endDate: new Date(body.endDate),
          reason: body.reason,
          status: "PENDING",
        },
        include: { faculty: true },
      })
      return NextResponse.json(leave)
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { type, id } = body

    if (type === "leave" && id) {
      const leave = await prisma.leaveRequest.update({
        where: { id },
        data: {
          status: body.status,
          approvedBy: body.approvedBy,
          approvedAt: body.status === "APPROVED" || body.status === "REJECTED" ? new Date() : undefined,
        },
        include: { faculty: true },
      })
      return NextResponse.json(leave)
    }

    if (type === "faculty" && id) {
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
    }

    return NextResponse.json({ error: "Invalid type or missing id" }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get("type")
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

    if (type === "subject") {
      await prisma.facultySubject.delete({ where: { id } })
      return NextResponse.json({ message: "Subject assignment deleted" })
    }
    if (type === "leave") {
      await prisma.leaveRequest.delete({ where: { id } })
      return NextResponse.json({ message: "Leave request deleted" })
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 })
  }
}
