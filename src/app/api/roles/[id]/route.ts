import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const body = await req.json()
    const role = await prisma.role.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
      },
    })
    return NextResponse.json(role)
  } catch {
    return NextResponse.json({ error: "Failed to update role" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const role = await prisma.role.findUnique({ where: { id } })
    if (role?.isSystem) {
      return NextResponse.json({ error: "Cannot delete system role" }, { status: 400 })
    }
    await prisma.rolePermission.deleteMany({ where: { roleId: id } })
    await prisma.roleAssignment.deleteMany({ where: { roleId: id } })
    await prisma.role.delete({ where: { id } })
    return NextResponse.json({ message: "Deleted" })
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 })
  }
}
