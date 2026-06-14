import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const assignments = await prisma.roleAssignment.findMany({
      where: { userId: id },
      include: { role: { include: { permissions: { include: { permission: true } } } } },
    })
    return NextResponse.json(assignments)
  } catch {
    return NextResponse.json({ error: "Failed to fetch roles" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const body = await req.json()
    const { roleIds } = body

    await prisma.roleAssignment.deleteMany({ where: { userId: id } })

    if (roleIds?.length > 0) {
      await prisma.roleAssignment.createMany({
        data: roleIds.map((roleId: string) => ({ userId: id, roleId })),
      })
    }

    return NextResponse.json({ message: "Roles updated" })
  } catch {
    return NextResponse.json({ error: "Failed to update roles" }, { status: 500 })
  }
}
