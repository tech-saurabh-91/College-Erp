import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const body = await req.json()
    const { permissions } = body

    await prisma.rolePermission.deleteMany({ where: { roleId: id } })

    if (permissions?.length > 0) {
      await prisma.rolePermission.createMany({
        data: permissions.map((p: any) => ({
          roleId: id,
          permissionId: p.permissionId,
          canCreate: p.canCreate || false,
          canRead: p.canRead || false,
          canUpdate: p.canUpdate || false,
          canDelete: p.canDelete || false,
        })),
      })
    }

    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        permissions: { include: { permission: true } },
      },
    })
    return NextResponse.json(role)
  } catch {
    return NextResponse.json({ error: "Failed to update permissions" }, { status: 500 })
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    })
    return NextResponse.json(role)
  } catch {
    return NextResponse.json({ error: "Role not found" }, { status: 404 })
  }
}
