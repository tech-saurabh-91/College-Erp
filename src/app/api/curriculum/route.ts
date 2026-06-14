import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get("type")

  try {
    if (type === "program") {
      const data = await prisma.program.findMany({ orderBy: { name: "asc" } })
      return NextResponse.json(data)
    }
    if (type === "course") {
      const programId = searchParams.get("programId")
      const where: any = {}
      if (programId) where.programId = programId
      const data = await prisma.course.findMany({ where, include: { program: true }, orderBy: [{ semester: "asc" }, { name: "asc" }] })
      return NextResponse.json(data)
    }
    if (type === "subject") {
      const courseId = searchParams.get("courseId")
      const where: any = {}
      if (courseId) where.courseId = courseId
      const data = await prisma.subject.findMany({ where, include: { course: { include: { program: true } } }, orderBy: { name: "asc" } })
      return NextResponse.json(data)
    }
    return NextResponse.json({ error: "Invalid type" }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { type } = body

    if (type === "program") {
      const program = await prisma.program.create({
        data: {
          code: body.code,
          name: body.name,
          duration: parseInt(body.duration),
          degreeType: body.degreeType,
          department: body.department,
          description: body.description,
          totalSemesters: parseInt(body.totalSemesters),
          totalCredits: body.totalCredits ? parseInt(body.totalCredits) : null,
        },
      })
      return NextResponse.json(program)
    }

    if (type === "course") {
      const course = await prisma.course.create({
        data: {
          code: body.code,
          name: body.name,
          programId: body.programId,
          semester: parseInt(body.semester),
          credits: parseInt(body.credits),
          isElective: body.isElective === true,
          description: body.description,
          maxMarks: body.maxMarks ? parseInt(body.maxMarks) : 100,
          passMarks: body.passMarks ? parseInt(body.passMarks) : 40,
        },
        include: { program: true },
      })
      return NextResponse.json(course)
    }

    if (type === "subject") {
      const subject = await prisma.subject.create({
        data: {
          code: body.code,
          name: body.name,
          courseId: body.courseId,
          credits: parseInt(body.credits),
          type: body.type || "THEORY",
          maxMarks: body.maxMarks ? parseInt(body.maxMarks) : 100,
          passMarks: body.passMarks ? parseInt(body.passMarks) : 40,
        },
        include: { course: { include: { program: true } } },
      })
      return NextResponse.json(subject)
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create record" }, { status: 500 })
  }
}
