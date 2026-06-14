import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const role = (session.user as any).role
  const userId = (session.user as any).id

  try {
    if (role === "ADMIN") {
      const [studentCount, facultyCount, programCount, courseCount, todayAttendance, totalAttendance, feeData, examData, recentEnquiries, activeUsers, classSections, activeAlumni] = await Promise.all([
        prisma.student.count({ where: { status: "ACTIVE" } }),
        prisma.faculty.count({ where: { isActive: true } }),
        prisma.program.count({ where: { isActive: true } }),
        prisma.course.count({ where: { isActive: true } }),
        prisma.attendance.count({ where: { date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
        prisma.attendance.count(),
        prisma.feeAccount.aggregate({ _sum: { paidAmount: true, dueAmount: true } }),
        prisma.mark.count({ where: { result: "PASS" } }),
        prisma.enquiry.findMany({ take: 5, orderBy: { createdAt: "desc" } }),
        prisma.user.count({ where: { isActive: true } }),
        prisma.classSection.count(),
        prisma.alumni.count({ where: { isVerified: true } }),
      ])
      const marksTotal = await prisma.mark.count()
      const passRate = marksTotal > 0 ? Math.round((examData / marksTotal) * 100) : 0
      const absentCount = await prisma.attendance.count({ where: { status: "ABSENT" } })
      const attendancePercent = totalAttendance > 0 ? Math.round((totalAttendance - absentCount) / totalAttendance * 100) : 0

      return NextResponse.json({
        role: "ADMIN",
        stats: {
          totalStudents: studentCount, totalFaculty: facultyCount, totalPrograms: programCount,
          totalCourses: courseCount, todayAttendance, attendancePercent,
          totalRevenue: feeData._sum.paidAmount || 0, totalDues: feeData._sum.dueAmount || 0,
          passRate, activeUsers, classSections, activeAlumni,
        },
        recentEnquiries,
      })
    }

    if (role === "STUDENT") {
      const student = await prisma.student.findUnique({
        where: { userId },
        include: { program: true, classSection: true },
      })
      if (!student) return NextResponse.json({ role: "STUDENT", student: null })

      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const attendanceRecords = await prisma.attendance.findMany({
        where: { studentId: student.id, date: { gte: monthStart } },
      })
      const present = attendanceRecords.filter(r => r.status === "PRESENT").length
      const absent = attendanceRecords.filter(r => r.status === "ABSENT").length
      const leave = attendanceRecords.filter(r => r.status === "LEAVE").length
      const attTotal = attendanceRecords.length
      const attPct = attTotal > 0 ? Math.round((present / attTotal) * 100) : 0

      const feeAccounts = await prisma.feeAccount.findMany({
        where: { studentId: student.id },
        include: { feeStructure: true, payments: { orderBy: { paymentDate: "desc" }, take: 3 } },
      })

      const marks = await prisma.mark.findMany({
        where: { studentId: student.id },
        include: { exam: { include: { schedule: { select: { name: true } } } }, subject: { select: { name: true } } },
        orderBy: { enteredAt: "desc" },
      })

      const totalPaid = feeAccounts.reduce((s, a) => s + a.paidAmount, 0)
      const totalDue = feeAccounts.reduce((s, a) => s + a.dueAmount, 0)
      const feeStatus = feeAccounts.length > 0 ? feeAccounts[0].status : null

      return NextResponse.json({
        role: "STUDENT",
        student: {
          ...student,
          dateOfBirth: student.dateOfBirth.toISOString(),
          enrollmentDate: student.enrollmentDate.toISOString(),
        },
        attendance: { total: attTotal, present, absent, leave, percentage: attPct },
        fee: feeAccounts.length > 0 ? { paid: totalPaid, due: totalDue, status: feeStatus, accounts: feeAccounts } : null,
        recentMarks: marks,
      })
    }

    if (role === "FACULTY") {
      const faculty = await prisma.faculty.findUnique({
        where: { userId },
      })
      if (!faculty) return NextResponse.json({ role: "FACULTY", faculty: null })

      const classSections = await prisma.classSection.findMany({
        where: { classTeacherId: faculty.id },
        include: { program: true, _count: { select: { students: true } } },
      })

      const today = new Date()
      const todayAttendance = await prisma.attendance.count({
        where: { date: { gte: new Date(today.setHours(0, 0, 0, 0)) }, markedBy: faculty.employeeId },
      })

      return NextResponse.json({
        role: "FACULTY",
        faculty,
        classSections,
        todayAttendance,
      })
    }

    if (role === "PARENT") {
      const parent = await prisma.parent.findUnique({
        where: { userId },
        include: {
          children: {
            include: { program: true, classSection: true },
          },
        },
      })
      if (!parent) return NextResponse.json({ role: "PARENT", parent: null })

      const childrenData = await Promise.all(parent.children.map(async (child) => {
        const now = new Date()
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        const attRecs = await prisma.attendance.findMany({
          where: { studentId: child.id, date: { gte: monthStart } },
        })
        const present = attRecs.filter(r => r.status === "PRESENT").length
        const attTotal = attRecs.length
        const feeAcc = await prisma.feeAccount.findFirst({
          where: { studentId: child.id },
          select: { paidAmount: true, dueAmount: true, status: true },
        })
        return {
          id: child.id, rollNo: child.rollNo, firstName: child.firstName, lastName: child.lastName,
          program: child.program?.name, classSection: child.classSection?.name,
          attendance: { total: attTotal, present, percentage: attTotal > 0 ? Math.round((present / attTotal) * 100) : 0 },
          fee: feeAcc ? { paid: feeAcc.paidAmount, due: feeAcc.dueAmount, status: feeAcc.status } : null,
        }
      }))

      return NextResponse.json({
        role: "PARENT",
        parent: { name: parent.name, relation: parent.relation },
        children: childrenData,
      })
    }

    return NextResponse.json({ role, message: "Dashboard data not available for this role" })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 })
  }
}