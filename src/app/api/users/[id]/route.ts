import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        roleAssignments: { include: { role: true } },
        student: { select: { id: true, rollNo: true } },
        faculty: { select: { id: true, employeeId: true } },
        parent: { select: { id: true } },
      },
    })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })
    return NextResponse.json(user)
  } catch {
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const body = await req.json()
    const { isActive, name, phone, role } = body

    const data: any = {}
    if (isActive !== undefined) data.isActive = isActive
    if (name !== undefined) data.name = name
    if (phone !== undefined) data.phone = phone
    if (role !== undefined) data.role = role

    const user = await prisma.user.update({
      where: { id },
      data,
      include: {
        roleAssignments: { include: { role: true } },
        student: { select: { id: true, rollNo: true } },
        faculty: { select: { id: true, employeeId: true } },
        parent: { select: { id: true } },
      },
    })
    return NextResponse.json(user)
  } catch {
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    await prisma.roleAssignment.deleteMany({ where: { userId: id } })
    await prisma.user.delete({ where: { id } })
    return NextResponse.json({ message: "User deleted" })
  } catch {
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
  }
}
