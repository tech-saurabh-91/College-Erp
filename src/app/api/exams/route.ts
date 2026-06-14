import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  const userId = (session?.user as any)?.id

  const { searchParams } = new URL(req.url)
  const type = searchParams.get("type")
  const scheduleId = searchParams.get("scheduleId")
  let studentId = searchParams.get("studentId")

  try {
    if (type === "schedule") {
      const data = await prisma.examSchedule.findMany({
        include: { program: true, exams: { include: { subject: true, course: true } } },
        orderBy: { startDate: "desc" },
      })
      return NextResponse.json(data)
    }
    if (type === "exam") {
      const where: any = {}
      if (scheduleId) where.scheduleId = scheduleId
      const data = await prisma.exam.findMany({
        where,
        include: { subject: true, course: true, invigilator: true },
        orderBy: { date: "asc" },
      })
      return NextResponse.json(data)
    }
    if (type === "hallticket") {
      const where: any = {}
      if (studentId) where.studentId = studentId
      if (scheduleId) where.examScheduleId = scheduleId
      const data = await prisma.hallTicket.findMany({
        where,
        include: { student: true, examSchedule: { include: { program: true, exams: { include: { subject: true } } } } },
        orderBy: { issuedAt: "desc" },
      })
      return NextResponse.json(data)
    }
    if (type === "mark") {
      const where: any = {}
      if (scheduleId) where.exam = { scheduleId }
      if (studentId) where.studentId = studentId
      const data = await prisma.mark.findMany({
        where,
        include: { student: true, exam: { include: { subject: true } }, subject: true, course: true },
        orderBy: { enteredAt: "desc" },
      })
      return NextResponse.json(data)
    }
    if (type === "result" || type === "results") {
      const where: any = {}
      if (scheduleId) where.examScheduleId = scheduleId
      if (studentId) where.studentId = studentId
      const data = await prisma.result.findMany({
        where,
        include: { student: true, examSchedule: { include: { program: true } } },
        orderBy: { publishedAt: "desc" },
      })
      return NextResponse.json(data)
    }
    if (type === "my-results") {
      if (!role || !userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      let myStudentIds: string[] = []
      if (role === "STUDENT") {
        const myStudent = await prisma.student.findUnique({ where: { userId }, select: { id: true } })
        if (myStudent) myStudentIds = [myStudent.id]
      } else if (role === "PARENT") {
        const parent = await prisma.parent.findUnique({ where: { userId }, select: { id: true } })
        if (parent) {
          const children = await prisma.student.findMany({ where: { parentId: parent.id }, select: { id: true } })
          myStudentIds = children.map(c => c.id)
        }
      } else {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
      if (myStudentIds.length === 0) return NextResponse.json([])
      const data = await prisma.mark.findMany({
        where: { studentId: { in: myStudentIds } },
        include: { student: true, exam: { include: { subject: true, schedule: true } }, subject: true, course: true },
        orderBy: [{ exam: { scheduleId: "desc" } }, { exam: { date: "desc" } }, { student: { rollNo: "asc" } }],
      })
      return NextResponse.json(data)
    }

    if (type === "programs") {
      const data = await prisma.program.findMany({ where: { isActive: true }, orderBy: { name: "asc" } })
      return NextResponse.json(data)
    }
    if (type === "students") {
      const examId = searchParams.get("examId")
      if (!examId) return NextResponse.json({ error: "examId required" }, { status: 400 })
      const exam = await prisma.exam.findUnique({ where: { id: examId }, include: { schedule: true } })
      if (!exam) return NextResponse.json({ error: "Exam not found" }, { status: 404 })
      const students = await prisma.student.findMany({
        where: { programId: exam.schedule.programId, currentSemester: exam.schedule.semester, status: "ACTIVE" },
        include: { marks: { where: { examId } } },
        orderBy: { rollNo: "asc" },
      })
      return NextResponse.json(students)
    }
    if (type === "courses") {
      const data = await prisma.course.findMany({ where: { isActive: true }, orderBy: { name: "asc" } })
      return NextResponse.json(data)
    }
    if (type === "subjects") {
      const courseId = searchParams.get("courseId")
      const where: any = { isActive: true }
      if (courseId) where.courseId = courseId
      const data = await prisma.subject.findMany({ where, orderBy: { name: "asc" } })
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

    if (type === "schedule") {
      const schedule = await prisma.examSchedule.create({
        data: {
          name: body.name,
          programId: body.programId,
          semester: parseInt(body.semester),
          academicYear: body.academicYear,
          startDate: new Date(body.startDate),
          endDate: new Date(body.endDate),
          type: body.examType || "MIDTERM",
          description: body.description,
        },
        include: { program: true },
      })
      return NextResponse.json(schedule)
    }

    if (type === "exam") {
      const exam = await prisma.exam.create({
        data: {
          scheduleId: body.scheduleId,
          courseId: body.courseId,
          subjectId: body.subjectId,
          date: new Date(body.date),
          startTime: body.startTime,
          endTime: body.endTime,
          maxMarks: body.maxMarks ? parseInt(body.maxMarks) : 100,
          roomNo: body.roomNo,
          invigilatorId: body.invigilatorId || null,
        },
        include: { subject: true, course: true },
      })
      return NextResponse.json(exam)
    }

    if (type === "hallticket") {
      const existing = await prisma.hallTicket.findFirst({
        where: { studentId: body.studentId, examScheduleId: body.examScheduleId },
      })
      if (existing) return NextResponse.json(existing)
      const hallTicket = await prisma.hallTicket.create({
        data: { studentId: body.studentId, examScheduleId: body.examScheduleId },
        include: { student: true, examSchedule: true },
      })
      return NextResponse.json(hallTicket)
    }

    if (type === "mark") {
      const existing = await prisma.mark.findFirst({
        where: { studentId: body.studentId, examId: body.examId, subjectId: body.subjectId },
      })
      if (existing) {
        const mark = await prisma.mark.update({
          where: { id: existing.id },
          data: {
            internalMarks: body.internalMarks ? parseFloat(body.internalMarks) : null,
            externalMarks: body.externalMarks ? parseFloat(body.externalMarks) : null,
            totalMarks: body.totalMarks ? parseFloat(body.totalMarks) : null,
            grade: body.grade,
            gradePoint: body.gradePoint ? parseFloat(body.gradePoint) : null,
            result: body.result || "PENDING",
            enteredBy: body.enteredBy || "system",
          },
        })
        return NextResponse.json(mark)
      }
      const mark = await prisma.mark.create({
        data: {
          studentId: body.studentId,
          examId: body.examId,
          courseId: body.courseId,
          subjectId: body.subjectId,
          internalMarks: body.internalMarks ? parseFloat(body.internalMarks) : null,
          externalMarks: body.externalMarks ? parseFloat(body.externalMarks) : null,
          totalMarks: body.totalMarks ? parseFloat(body.totalMarks) : null,
          grade: body.grade,
          gradePoint: body.gradePoint ? parseFloat(body.gradePoint) : null,
          result: body.result || "PENDING",
          enteredBy: body.enteredBy || "system",
        },
        include: { student: true, exam: true, subject: true },
      })
      return NextResponse.json(mark)
    }

    if (type === "marks_bulk") {
      const { marks, enteredBy } = body
      if (!Array.isArray(marks)) return NextResponse.json({ error: "marks must be array" }, { status: 400 })
      const results = []
      for (const m of marks) {
        const existing = await prisma.mark.findFirst({
          where: { studentId: m.studentId, examId: m.examId, subjectId: m.subjectId },
        })
        if (existing) {
          const updated = await prisma.mark.update({
            where: { id: existing.id },
            data: {
              internalMarks: m.internalMarks != null ? parseFloat(m.internalMarks) : null,
              externalMarks: m.externalMarks != null ? parseFloat(m.externalMarks) : null,
              totalMarks: m.totalMarks != null ? parseFloat(m.totalMarks) : null,
              result: m.result || "PENDING",
              enteredBy: enteredBy || "system",
            },
          })
          results.push(updated)
        } else {
          const created = await prisma.mark.create({
            data: {
              studentId: m.studentId,
              examId: m.examId,
              courseId: m.courseId,
              subjectId: m.subjectId,
              internalMarks: m.internalMarks != null ? parseFloat(m.internalMarks) : null,
              externalMarks: m.externalMarks != null ? parseFloat(m.externalMarks) : null,
              totalMarks: m.totalMarks != null ? parseFloat(m.totalMarks) : null,
              result: m.result || "PENDING",
              enteredBy: enteredBy || "system",
            },
          })
          results.push(created)
        }
      }
      return NextResponse.json(results)
    }

    if (type === "result" || type === "results") {
      const existing = await prisma.result.findFirst({
        where: { studentId: body.studentId, examScheduleId: body.examScheduleId },
      })
      if (existing) {
        const result = await prisma.result.update({
          where: { id: existing.id },
          data: {
            totalMarks: body.totalMarks ? parseFloat(body.totalMarks) : null,
            percentage: body.percentage ? parseFloat(body.percentage) : null,
            grade: body.grade,
            cgpa: body.cgpa ? parseFloat(body.cgpa) : null,
            rank: body.rank ? parseInt(body.rank) : null,
            status: body.status || "PENDING",
            isPublished: body.isPublished === true,
          },
        })
        return NextResponse.json(result)
      }
      const result = await prisma.result.create({
        data: {
          studentId: body.studentId,
          examScheduleId: body.examScheduleId,
          totalMarks: body.totalMarks ? parseFloat(body.totalMarks) : null,
          percentage: body.percentage ? parseFloat(body.percentage) : null,
          grade: body.grade,
          cgpa: body.cgpa ? parseFloat(body.cgpa) : null,
          rank: body.rank ? parseInt(body.rank) : null,
          status: body.status || "PENDING",
          isPublished: body.isPublished === true,
        },
        include: { student: true, examSchedule: true },
      })
      return NextResponse.json(result)
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create record" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { type, id } = body

    if (type === "schedule" && id) {
      const schedule = await prisma.examSchedule.update({
        where: { id },
        data: {
          name: body.name,
          programId: body.programId,
          semester: body.semester ? parseInt(body.semester) : undefined,
          academicYear: body.academicYear,
          startDate: body.startDate ? new Date(body.startDate) : undefined,
          endDate: body.endDate ? new Date(body.endDate) : undefined,
          type: body.examType,
          description: body.description,
          isPublished: body.isPublished !== undefined ? body.isPublished : undefined,
        },
        include: { program: true },
      })
      return NextResponse.json(schedule)
    }

    if (type === "exam" && id) {
      const exam = await prisma.exam.update({
        where: { id },
        data: {
          date: body.date ? new Date(body.date) : undefined,
          startTime: body.startTime,
          endTime: body.endTime,
          maxMarks: body.maxMarks ? parseInt(body.maxMarks) : undefined,
          roomNo: body.roomNo,
          invigilatorId: body.invigilatorId,
        },
      })
      return NextResponse.json(exam)
    }

    return NextResponse.json({ error: "Invalid type or missing id" }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get("type")
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

    if (type === "schedule") {
      await prisma.exam.deleteMany({ where: { scheduleId: id } })
      await prisma.hallTicket.deleteMany({ where: { examScheduleId: id } })
      await prisma.result.deleteMany({ where: { examScheduleId: id } })
      await prisma.examSchedule.delete({ where: { id } })
      return NextResponse.json({ message: "Schedule deleted" })
    }
    if (type === "exam") {
      await prisma.mark.deleteMany({ where: { examId: id } })
      await prisma.exam.delete({ where: { id } })
      return NextResponse.json({ message: "Exam deleted" })
    }
    if (type === "hallticket") {
      await prisma.hallTicket.delete({ where: { id } })
      return NextResponse.json({ message: "Hall ticket deleted" })
    }
    if (type === "mark") {
      await prisma.mark.delete({ where: { id } })
      return NextResponse.json({ message: "Mark deleted" })
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 })
  }
}
