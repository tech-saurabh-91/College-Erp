import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const classSectionId = searchParams.get("classSectionId")
  const dayOfWeek = searchParams.get("dayOfWeek")
  const facultyId = searchParams.get("facultyId")

  try {
    const where: any = { isActive: true }
    if (classSectionId) where.classSectionId = classSectionId
    if (dayOfWeek) where.dayOfWeek = parseInt(dayOfWeek)
    if (facultyId) where.facultyId = facultyId

    const timetables = await prisma.timetable.findMany({
      where,
      include: {
        classSection: { include: { program: true } },
        subject: true,
        course: true,
        faculty: true,
      },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    })
    return NextResponse.json(timetables)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch timetables" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const timetable = await prisma.timetable.create({
      data: {
        classSectionId: body.classSectionId,
        subjectId: body.subjectId,
        courseId: body.courseId,
        facultyId: body.facultyId,
        dayOfWeek: parseInt(body.dayOfWeek),
        startTime: body.startTime,
        endTime: body.endTime,
        roomNo: body.roomNo,
        academicYear: body.academicYear,
        semester: parseInt(body.semester),
      },
      include: {
        classSection: { include: { program: true } },
        subject: true,
        course: true,
        faculty: true,
      },
    })
    return NextResponse.json(timetable)
  } catch (error) {
    return NextResponse.json({ error: "Failed to create timetable entry" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...data } = body
    const timetable = await prisma.timetable.update({
      where: { id },
      data: {
        classSectionId: data.classSectionId,
        subjectId: data.subjectId,
        courseId: data.courseId,
        facultyId: data.facultyId,
        dayOfWeek: parseInt(data.dayOfWeek),
        startTime: data.startTime,
        endTime: data.endTime,
        roomNo: data.roomNo,
        academicYear: data.academicYear,
        semester: parseInt(data.semester),
      },
      include: {
        classSection: { include: { program: true } },
        subject: true,
        course: true,
        faculty: true,
      },
    })
    return NextResponse.json(timetable)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update timetable entry" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 })
    await prisma.timetable.delete({ where: { id } })
    return NextResponse.json({ message: "Deleted" })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete timetable entry" }, { status: 500 })
  }
}
