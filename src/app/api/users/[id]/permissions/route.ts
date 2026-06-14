import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const perms = await prisma.userPermission.findMany({ where: { userId: id } })
    return NextResponse.json(perms)
  } catch {
    return NextResponse.json({ error: "Failed to fetch permissions" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const body = await req.json()
    const { permissions } = body

    await prisma.userPermission.deleteMany({ where: { userId: id } })

    if (permissions?.length > 0) {
      await prisma.userPermission.createMany({
        data: permissions.map((p: any) => ({
          userId: id,
          module: p.module,
          canCreate: p.canCreate || false,
          canRead: p.canRead || false,
          canUpdate: p.canUpdate || false,
          canDelete: p.canDelete || false,
        })),
      })
    }

    return NextResponse.json({ message: "Permissions updated" })
  } catch {
    return NextResponse.json({ error: "Failed to update permissions" }, { status: 500 })
  }
}
