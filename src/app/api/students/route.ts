import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get("search")
  const program = searchParams.get("program")

  try {
    const where: any = {}
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { rollNo: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ]
    }
    if (program) where.programId = program

    const students = await prisma.student.findMany({
      where,
      include: { program: true },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(students)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const existingUser = await prisma.user.findUnique({ where: { email: body.email } })
    if (existingUser) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash("changeme123", 10)
    const user = await prisma.user.create({
      data: {
        email: body.email,
        password: hashedPassword,
        name: `${body.firstName} ${body.lastName}`,
        role: "STUDENT",
        phone: body.phone,
      },
    })

    const studentCount = await prisma.student.count()
    const rollNo = `${body.programId.substring(0, 3).toUpperCase()}${String(studentCount + 1).padStart(4, "0")}`
    const admissionNo = `ADM${String(studentCount + 1).padStart(5, "0")}`

    const student = await prisma.student.create({
      data: {
        userId: user.id,
        rollNo,
        admissionNo,
        firstName: body.firstName,
        lastName: body.lastName,
        dateOfBirth: new Date(body.dateOfBirth),
        gender: body.gender,
        bloodGroup: body.bloodGroup,
        email: body.email,
        phone: body.phone,
        address: body.address,
        city: body.city,
        state: body.state,
        pincode: body.pincode,
        nationality: body.nationality || "Indian",
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
        currentSemester: body.currentSemester || 1,
        batchYear: body.batchYear,
        status: "ACTIVE",
      },
      include: { program: true },
    })

    return NextResponse.json(student)
  } catch (error) {
    return NextResponse.json({ error: "Failed to create student" }, { status: 500 })
  }
}
