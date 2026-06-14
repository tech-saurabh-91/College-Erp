import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const role = (session.user as any).role
  const userId = (session.user as any).id

  const { searchParams } = new URL(req.url)
  const type = searchParams.get("type")
  const classSectionId = searchParams.get("classSectionId")
  const date = searchParams.get("date")
  const month = searchParams.get("month")
  const year = searchParams.get("year")
  let studentId = searchParams.get("studentId")

  try {
    // Resolve own student ID for STUDENT role
    if (!studentId && role === "STUDENT") {
      const myStudent = await prisma.student.findUnique({ where: { userId }, select: { id: true } })
      if (myStudent) studentId = myStudent.id
    }

    // Resolve children IDs for PARENT role
    let childIds: string[] = []
    if (role === "PARENT") {
      const parent = await prisma.parent.findUnique({ where: { userId }, select: { id: true } })
      if (parent) {
        const children = await prisma.student.findMany({ where: { parentId: parent.id }, select: { id: true } })
        childIds = children.map(c => c.id)
      }
    }

    if (type === "sections") {
      const data = await prisma.classSection.findMany({
        include: { program: true, _count: { select: { students: true } } },
        orderBy: { name: "asc" },
      })
      return NextResponse.json(data)
    }

    if (type === "students") {
      if (role !== "ADMIN" && role !== "FACULTY") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      if (!classSectionId) return NextResponse.json({ error: "classSectionId required" }, { status: 400 })
      const students = await prisma.student.findMany({
        where: { classSectionId, status: "ACTIVE" },
        orderBy: { rollNo: "asc" },
        select: { id: true, rollNo: true, firstName: true, lastName: true, photoUrl: true },
      })
      return NextResponse.json(students)
    }

    if (type === "attendance") {
      if (role !== "ADMIN" && role !== "FACULTY") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      if (!classSectionId || !date) return NextResponse.json({ error: "classSectionId and date required" }, { status: 400 })
      const dateObj = new Date(date)
      const records = await prisma.attendance.findMany({
        where: { classSectionId, date: dateObj },
        orderBy: { student: { rollNo: "asc" } },
        include: { student: { select: { id: true, rollNo: true, firstName: true, lastName: true } } },
      })
      return NextResponse.json(records)
    }

    if (type === "summary") {
      if (role !== "ADMIN" && role !== "FACULTY") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      if (!classSectionId) return NextResponse.json({ error: "classSectionId required" }, { status: 400 })
      const where: any = { classSectionId }
      if (month) {
        const m = parseInt(month) - 1
        const y = year ? parseInt(year) : new Date().getFullYear()
        const start = new Date(y, m, 1)
        const end = new Date(y, m + 1, 0)
        where.date = { gte: start, lte: end }
      }
      const records = await prisma.attendance.findMany({
        where,
        include: { student: { select: { id: true, rollNo: true, firstName: true, lastName: true } } },
      })
      const total = records.length
      const present = records.filter(r => r.status === "PRESENT").length
      const absent = records.filter(r => r.status === "ABSENT").length
      const leave = records.filter(r => r.status === "LEAVE").length
      const percentage = total > 0 ? ((present / total) * 100).toFixed(1) : "0"
      return NextResponse.json({ total, present, absent, leave, percentage: parseFloat(percentage), records })
    }

    if (type === "monthly") {
      if (!studentId || !month || !year) return NextResponse.json({ error: "studentId, month, year required" }, { status: 400 })
      // Students can only view their own, parents can only view children's
      if (role === "STUDENT") {
        const myStudent = await prisma.student.findUnique({ where: { userId }, select: { id: true } })
        if (!myStudent || myStudent.id !== studentId) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      } else if (role === "PARENT") {
        if (!childIds.includes(studentId)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
      const m = parseInt(month) - 1
      const y = parseInt(year)
      const start = new Date(y, m, 1)
      const end = new Date(y, m + 1, 0)
      const records = await prisma.attendance.findMany({
        where: { studentId, date: { gte: start, lte: end } },
        orderBy: { date: "asc" },
      })
      const present = records.filter(r => r.status === "PRESENT").length
      const absent = records.filter(r => r.status === "ABSENT").length
      const leave = records.filter(r => r.status === "LEAVE").length
      const total = records.length
      const percentage = total > 0 ? ((present / total) * 100).toFixed(1) : "0"
      return NextResponse.json({ records, present, absent, leave, total, percentage: parseFloat(percentage) })
    }

    if (type === "student-attendance") {
      if (!studentId) return NextResponse.json({ error: "studentId required" }, { status: 400 })
      // Students can only view their own, parents can only view children's
      if (role === "STUDENT") {
        const myStudent = await prisma.student.findUnique({ where: { userId }, select: { id: true } })
        if (!myStudent || myStudent.id !== studentId) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      } else if (role === "PARENT") {
        if (!childIds.includes(studentId)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
      const records = await prisma.attendance.findMany({
        where: { studentId },
        orderBy: { date: "desc" },
        take: 100,
      })
      const present = records.filter(r => r.status === "PRESENT").length
      const absent = records.filter(r => r.status === "ABSENT").length
      const leave = records.filter(r => r.status === "LEAVE").length
      const total = records.length
      const percentage = total > 0 ? ((present / total) * 100).toFixed(1) : "0"
      return NextResponse.json({ records, present, absent, leave, total, percentage: parseFloat(percentage) })
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const role = (session.user as any).role
  if (role !== "ADMIN" && role !== "FACULTY") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { type } = body

    if (type === "attendance") {
      const { classSectionId, date, records, markedBy } = body
      if (!classSectionId || !date || !records) {
        return NextResponse.json({ error: "classSectionId, date, records required" }, { status: 400 })
      }
      const dateObj = new Date(date)
      const results = []
      for (const r of records) {
        const existing = await prisma.attendance.findFirst({
          where: { studentId: r.studentId, date: dateObj, classSectionId },
        })
        if (existing && r.status !== undefined) {
          const updated = await prisma.attendance.update({
            where: { id: existing.id },
            data: { status: r.status, remark: r.remark || null, markedBy: markedBy || "system" },
          })
          results.push(updated)
        } else if (r.status && r.status !== "NONE") {
          const created = await prisma.attendance.create({
            data: {
              studentId: r.studentId,
              classSectionId,
              date: dateObj,
              status: r.status,
              subjectId: r.subjectId || null,
              facultyId: r.facultyId || null,
              remark: r.remark || null,
              markedBy: markedBy || "system",
            },
          })
          results.push(created)
        }
      }
      return NextResponse.json(results)
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to save attendance" }, { status: 500 })
  }
}
