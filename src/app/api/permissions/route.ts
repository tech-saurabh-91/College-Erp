import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const permissions = await prisma.permission.findMany({
      orderBy: [{ module: "asc" }, { name: "asc" }],
    })
    return NextResponse.json(permissions)
  } catch {
    return NextResponse.json({ error: "Failed to fetch permissions" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const permission = await prisma.permission.create({
      data: {
        key: body.key,
        name: body.name,
        description: body.description,
        module: body.module,
      },
    })
    return NextResponse.json(permission)
  } catch {
    return NextResponse.json({ error: "Failed to create permission" }, { status: 500 })
  }
}
