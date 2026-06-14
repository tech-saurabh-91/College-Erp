import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get("search")
  const role = searchParams.get("role")
  const status = searchParams.get("status")

  try {
    const where: any = {}
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ]
    }
    if (role) where.role = role
    if (status === "active") where.isActive = true
    if (status === "inactive") where.isActive = false

    const users = await prisma.user.findMany({
      where,
      include: {
        roleAssignments: { include: { role: true } },
        student: { select: { id: true, rollNo: true } },
        faculty: { select: { id: true, employeeId: true } },
        parent: { select: { id: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(users)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, password, phone, role, roleIds } = body

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 })
    }

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: role || "STUDENT",
        phone: phone || null,
        isActive: true,
      },
    })

    if (roleIds?.length > 0) {
      await prisma.roleAssignment.createMany({
        data: roleIds.map((roleId: string) => ({ userId: user.id, roleId })),
      })
    }

    const created = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        roleAssignments: { include: { role: true } },
        student: { select: { id: true, rollNo: true } },
        faculty: { select: { id: true, employeeId: true } },
        parent: { select: { id: true } },
      },
    })

    return NextResponse.json(created)
  } catch (error) {
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
  }
}
