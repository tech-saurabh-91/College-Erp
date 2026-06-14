import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const key = searchParams.get("key")
  if (key !== "seed2025") {
    return NextResponse.json({ error: "Invalid key" }, { status: 403 })
  }

  try {
    const pw = await bcrypt.hash("password123", 10)

    // Clean data (respect FK order)
    await prisma.attendance.deleteMany()
    await prisma.mark.deleteMany()
    await prisma.hallTicket.deleteMany()
    await prisma.result.deleteMany()
    await prisma.exam.deleteMany()
    await prisma.examSchedule.deleteMany()
    await prisma.timetable.deleteMany()
    await prisma.facultySubject.deleteMany()
    await prisma.leaveRequest.deleteMany()
    await prisma.performanceReview.deleteMany()
    await prisma.bookIssue.deleteMany()
    await prisma.book.deleteMany()
    await prisma.payment.deleteMany()
    await prisma.feeAccount.deleteMany()
    await prisma.feeStructure.deleteMany()
    await prisma.voucherEntry.deleteMany()
    await prisma.voucher.deleteMany()
    await prisma.ledgerAccount.deleteMany()
    await prisma.budgetPlan.deleteMany()
    await prisma.hostelAllocation.deleteMany()
    await prisma.visitor.deleteMany()
    await prisma.messMenu.deleteMany()
    await prisma.hostelRoom.deleteMany()
    await prisma.hostel.deleteMany()
    await prisma.transportPass.deleteMany()
    await prisma.transportVehicle.deleteMany()
    await prisma.transportDriver.deleteMany()
    await prisma.transportRoute.deleteMany()
    await prisma.notification.deleteMany()
    await prisma.message.deleteMany()
    await prisma.broadcast.deleteMany()
    await prisma.alumniDonation.deleteMany()
    await prisma.alumni.deleteMany()
    await prisma.jobBoard.deleteMany()
    await prisma.alumniEvent.deleteMany()
    await prisma.parent.deleteMany()
    await prisma.student.deleteMany()
    await prisma.faculty.deleteMany()
    await prisma.staff.deleteMany()
    await prisma.salaryStructure.deleteMany()
    await prisma.payslip.deleteMany()
    await prisma.classSection.deleteMany()
    await prisma.subject.deleteMany()
    await prisma.course.deleteMany()
    await prisma.program.deleteMany()
    await prisma.enquiry.deleteMany()
    await prisma.application.deleteMany()
    await prisma.document.deleteMany()
    await prisma.meritListEntry.deleteMany()
    await prisma.meritList.deleteMany()
    await prisma.seatAllotment.deleteMany()
    await prisma.roleAssignment.deleteMany()
    await prisma.rolePermission.deleteMany()
    await prisma.userPermission.deleteMany()
    await prisma.role.deleteMany()
    await prisma.permission.deleteMany()
    await prisma.user.deleteMany()

    // Permissions
    const modules = [
      { key: "admission", name: "Admissions" }, { key: "student", name: "Students" },
      { key: "curriculum", name: "Curriculum" }, { key: "examination", name: "Examinations" },
      { key: "attendance", name: "Attendance" }, { key: "faculty", name: "Faculty" },
      { key: "fee", name: "Fee Management" }, { key: "account", name: "Accounts" },
      { key: "library", name: "Library" }, { key: "hostel", name: "Hostel" },
      { key: "hr", name: "HR & Payroll" }, { key: "transport", name: "Transport" },
      { key: "communication", name: "Communication" }, { key: "report", name: "Reports" },
      { key: "alumni", name: "Alumni" }, { key: "portal", name: "Portals" },
      { key: "timetable", name: "Timetable" }, { key: "settings", name: "Settings" },
    ]
    const permissions: any[] = []
    for (const mod of modules) {
      permissions.push(await prisma.permission.create({ data: { key: mod.key, name: mod.name, module: mod.key } }))
    }

    // Roles
    const adminRole = await prisma.role.create({ data: { name: "Admin", description: "Full system access", isSystem: true } })
    const facultyRole = await prisma.role.create({ data: { name: "Faculty", description: "Academic staff access", isSystem: true } })
    const studentRole = await prisma.role.create({ data: { name: "Student", description: "Student self-service", isSystem: true } })
    const parentRole = await prisma.role.create({ data: { name: "Parent", description: "Parent/guardian view access", isSystem: true } })

    const facultyModules = ["student", "curriculum", "examination", "attendance", "fee", "timetable", "report", "faculty"]
    const studentModules = ["student", "curriculum", "examination", "attendance", "fee", "library", "hostel", "transport", "portal", "timetable"]
    const parentModules = ["attendance", "fee", "examination", "portal", "communication", "transport"]

    for (const perm of permissions) {
      await prisma.rolePermission.create({ data: { roleId: adminRole.id, permissionId: perm.id, canCreate: true, canRead: true, canUpdate: true, canDelete: true } })
      await prisma.rolePermission.create({ data: { roleId: facultyRole.id, permissionId: perm.id, canRead: facultyModules.includes(perm.module) || perm.module === "communication" || perm.module === "portal", canCreate: facultyModules.includes(perm.module), canUpdate: facultyModules.includes(perm.module), canDelete: perm.module === "attendance" } })
      await prisma.rolePermission.create({ data: { roleId: studentRole.id, permissionId: perm.id, canRead: studentModules.includes(perm.module), canCreate: false, canUpdate: false, canDelete: false } })
      await prisma.rolePermission.create({ data: { roleId: parentRole.id, permissionId: perm.id, canRead: parentModules.includes(perm.module), canCreate: false, canUpdate: false, canDelete: false } })
    }

    // Users
    const adminUser = await prisma.user.create({ data: { email: "admin@college.edu", password: pw, name: "Admin User", role: "ADMIN", phone: "+91-9876543210", isActive: true } })
    await prisma.roleAssignment.create({ data: { userId: adminUser.id, roleId: adminRole.id } })

    const f1 = await prisma.user.create({ data: { email: "faculty1@college.edu", password: pw, name: "Dr. Rajesh Sharma", role: "FACULTY", phone: "+91-9876543211", isActive: true } })
    const f2 = await prisma.user.create({ data: { email: "faculty2@college.edu", password: pw, name: "Prof. Priya Patel", role: "FACULTY", phone: "+91-9876543212", isActive: true } })
    const f3 = await prisma.user.create({ data: { email: "faculty3@college.edu", password: pw, name: "Dr. Amit Verma", role: "FACULTY", phone: "+91-9876543213", isActive: true } })
    for (const u of [f1, f2, f3]) await prisma.roleAssignment.create({ data: { userId: u.id, roleId: facultyRole.id } })

    const studentNames = [["Aarav","Singh"],["Diya","Patel"],["Arjun","Sharma"],["Ananya","Verma"],["Rohan","Gupta"],["Ishita","Reddy"],["Vivaan","Joshi"],["Myra","Nair"],["Aditya","Kumar"],["Sara","Khan"],["Krishna","Iyer"],["Aadhya","Deshmukh"]]
    const studentUsers: any[] = []
    for (let i = 0; i < studentNames.length; i++) {
      const [first, last] = studentNames[i]
      const u = await prisma.user.create({ data: { email: `student${i+1}@college.edu`, password: pw, name: `${first} ${last}`, role: "STUDENT", phone: `+91-98765432${10+i}`, isActive: true } })
      await prisma.roleAssignment.create({ data: { userId: u.id, roleId: studentRole.id } })
      studentUsers.push(u)
    }

    const p1 = await prisma.user.create({ data: { email: "parent1@college.edu", password: pw, name: "Sunita Singh", role: "PARENT", phone: "+91-9876543301", isActive: true } })
    const p2 = await prisma.user.create({ data: { email: "parent2@college.edu", password: pw, name: "Rajesh Patel", role: "PARENT", phone: "+91-9876543302", isActive: true } })
    await prisma.roleAssignment.create({ data: { userId: p1.id, roleId: parentRole.id } })
    await prisma.roleAssignment.create({ data: { userId: p2.id, roleId: parentRole.id } })

    // Programs
    const progs = await Promise.all([
      prisma.program.create({ data: { code: "BTCS", name: "B.Tech Computer Science", duration: 4, degreeType: "Bachelor", department: "CS", totalSemesters: 8, totalCredits: 160 } }),
      prisma.program.create({ data: { code: "BCA", name: "Bachelor of Computer Applications", duration: 3, degreeType: "Bachelor", department: "CS", totalSemesters: 6, totalCredits: 120 } }),
      prisma.program.create({ data: { code: "MBA", name: "MBA", duration: 2, degreeType: "Master", department: "Management", totalSemesters: 4, totalCredits: 80 } }),
    ])

    // Courses & Subjects
    const c1 = await prisma.course.create({ data: { code: "CS101", name: "Programming Fundamentals", programId: progs[0].id, semester: 1, credits: 4 } })
    const s1 = await prisma.subject.create({ data: { code: "CS101-S1", name: "C Programming", courseId: c1.id, credits: 2 } })
    const s2 = await prisma.subject.create({ data: { code: "CS101-S2", name: "Data Structures", courseId: c1.id, credits: 2 } })
    const c2 = await prisma.course.create({ data: { code: "CS102", name: "Mathematics", programId: progs[0].id, semester: 1, credits: 4 } })
    const s3 = await prisma.subject.create({ data: { code: "CS102-S1", name: "Discrete Mathematics", courseId: c2.id, credits: 2 } })
    const c3 = await prisma.course.create({ data: { code: "BC101", name: "Computer Fundamentals", programId: progs[1].id, semester: 1, credits: 4 } })
    const s4 = await prisma.subject.create({ data: { code: "BC101-S1", name: "Computer Organization", courseId: c3.id, credits: 2 } })
    const c4 = await prisma.course.create({ data: { code: "MB101", name: "Principles of Management", programId: progs[2].id, semester: 1, credits: 3 } })
    const s5 = await prisma.subject.create({ data: { code: "MB101-S1", name: "Management Theory", courseId: c4.id, credits: 2 } })

    // Class sections
    const cs1 = await prisma.classSection.create({ data: { name: "BTCS Sem1 A", programId: progs[0].id, semester: 1, section: "A", academicYear: "2025-26", capacity: 60 } })
    const cs2 = await prisma.classSection.create({ data: { name: "BCA Sem1 A", programId: progs[1].id, semester: 1, section: "A", academicYear: "2025-26", capacity: 50 } })

    // Faculty
    const fac1 = await prisma.faculty.create({ data: { userId: f1.id, employeeId: "FAC001", firstName: "Rajesh", lastName: "Sharma", email: "faculty1@college.edu", phone: "+91-9876543211", department: "CS", designation: "Professor", qualification: "Ph.D.", dateOfJoining: new Date("2020-06-01"), salary: 120000, address: "Delhi" } })
    const fac2 = await prisma.faculty.create({ data: { userId: f2.id, employeeId: "FAC002", firstName: "Priya", lastName: "Patel", email: "faculty2@college.edu", phone: "+91-9876543212", department: "CS", designation: "Associate Professor", qualification: "Ph.D.", dateOfJoining: new Date("2021-07-15"), salary: 95000, address: "Mumbai" } })
    const fac3 = await prisma.faculty.create({ data: { userId: f3.id, employeeId: "FAC003", firstName: "Amit", lastName: "Verma", email: "faculty3@college.edu", phone: "+91-9876543213", department: "Management", designation: "Professor", qualification: "Ph.D.", dateOfJoining: new Date("2019-01-10"), salary: 130000, address: "Bangalore" } })

    await prisma.classSection.update({ where: { id: cs1.id }, data: { classTeacherId: fac1.id } })
    await prisma.classSection.update({ where: { id: cs2.id }, data: { classTeacherId: fac2.id } })

    // Students
    const genders = ["MALE","FEMALE","MALE","FEMALE","MALE","FEMALE","MALE","FEMALE","MALE","FEMALE","MALE","FEMALE"]
    const cities = ["Delhi","Mumbai","Bangalore","Hyderabad","Pune","Chennai","Kolkata","Ahmedabad","Jaipur","Lucknow","Chandigarh","Indore"]
    for (let i = 0; i < studentUsers.length; i++) {
      const [first, last] = studentNames[i]
      const sectionIdx = i < 6 ? cs1.id : cs2.id
      const progIdx = i < 6 ? progs[0].id : progs[1].id
      await prisma.student.create({ data: { userId: studentUsers[i].id, rollNo: `${i < 6 ? "BTCS" : "BCA"}${String(i+1).padStart(4,"0")}`, admissionNo: `ADM${String(i+1).padStart(5,"0")}`, firstName: first, lastName: last, dateOfBirth: new Date(2002, i % 12, (i % 28) + 1), gender: genders[i], email: studentUsers[i].email, phone: `+91-98765432${10+i}`, address: `${100+i} ${cities[i]}`, city: cities[i], state: "State", pincode: "110001", nationality: "Indian", category: ["GENERAL","OBC","SC","ST","GENERAL"][i%5], fatherName: `Mr. ${last}`, fatherPhone: `+91-98765439${10+i}`, motherName: `Mrs. ${last}`, motherPhone: `+91-98765449${10+i}`, programId: progIdx, classSectionId: sectionIdx, currentSemester: 1, batchYear: "2025", status: "ACTIVE" } })
    }

    // Parents
    await prisma.parent.create({ data: { userId: p1.id, name: "Sunita Singh", email: "parent1@college.edu", phone: "+91-9876543301", relation: "MOTHER" } })
    await prisma.parent.create({ data: { userId: p2.id, name: "Rajesh Patel", email: "parent2@college.edu", phone: "+91-9876543302", relation: "FATHER" } })

    return NextResponse.json({ message: "Seed complete! Login: admin@college.edu / password123" })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
