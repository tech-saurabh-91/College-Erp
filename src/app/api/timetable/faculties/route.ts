import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const data = await prisma.faculty.findMany({
      where: { isActive: true },
      orderBy: { firstName: "asc" },
    })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json([])
  }
}
