import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const data = await prisma.classSection.findMany({
      include: { program: true },
      orderBy: { name: "asc" },
    })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json([])
  }
}
