import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const body = await req.json()
    const { type } = body

    if (type === "program") {
      const program = await prisma.program.update({
        where: { id },
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
      const course = await prisma.course.update({
        where: { id },
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
      const subject = await prisma.subject.update({
        where: { id },
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
    return NextResponse.json({ error: "Failed to update record" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get("type")

    if (type === "program") {
      await prisma.program.delete({ where: { id } })
    } else if (type === "course") {
      await prisma.course.delete({ where: { id } })
    } else if (type === "subject") {
      await prisma.subject.delete({ where: { id } })
    } else {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 })
    }
    return NextResponse.json({ message: "Deleted successfully" })
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 })
  }
}
