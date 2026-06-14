import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const [
      studentCount, facultyCount, programCount, courseCount,
      todayAttendance, totalAttendance, feeData, examData,
      recentEnquiries, activeUsers, classSections, activeAlumni,
    ] = await Promise.all([
      prisma.student.count({ where: { status: "ACTIVE" } }),
      prisma.faculty.count({ where: { isActive: true } }),
      prisma.program.count({ where: { isActive: true } }),
      prisma.course.count({ where: { isActive: true } }),
      prisma.attendance.count({
        where: { date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
      }),
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
    const attendancePercent = totalAttendance > 0
      ? Math.round((totalAttendance - await prisma.attendance.count({ where: { status: "ABSENT" } })) / totalAttendance * 100)
      : 0

    return NextResponse.json({
      stats: {
        totalStudents: studentCount,
        totalFaculty: facultyCount,
        totalPrograms: programCount,
        totalCourses: courseCount,
        todayAttendance: todayAttendance,
        attendancePercent,
        totalRevenue: feeData._sum.paidAmount || 0,
        totalDues: feeData._sum.dueAmount || 0,
        passRate,
        activeUsers,
        classSections,
        activeAlumni,
      },
      recentEnquiries,
    })
  } catch {
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 })
  }
}
