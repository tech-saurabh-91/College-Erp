import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

async function seedAll() {
  const pw = await bcrypt.hash("password123", 10)

  // 1. Users
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@college.edu" }, update: { isActive: true },
    create: { email: "admin@college.edu", password: pw, name: "Admin User", role: "ADMIN", phone: "+91-9876543210", isActive: true },
  })
  const fac1 = await prisma.user.upsert({ where: { email: "faculty1@college.edu" }, update: {}, create: { email: "faculty1@college.edu", password: pw, name: "Dr. Rajesh Sharma", role: "FACULTY", isActive: true } })
  const fac2 = await prisma.user.upsert({ where: { email: "faculty2@college.edu" }, update: {}, create: { email: "faculty2@college.edu", password: pw, name: "Prof. Priya Patel", role: "FACULTY", isActive: true } })
  const fac3 = await prisma.user.upsert({ where: { email: "faculty3@college.edu" }, update: {}, create: { email: "faculty3@college.edu", password: pw, name: "Dr. Amit Verma", role: "FACULTY", isActive: true } })
  const stuUsers: any[] = []
  for (let i = 1; i <= 12; i++) {
    const u = await prisma.user.upsert({ where: { email: `student${i}@college.edu` }, update: {}, create: { email: `student${i}@college.edu`, password: pw, name: `Student ${i}`, role: "STUDENT", isActive: true } })
    stuUsers.push(u)
  }
  const parentU = await prisma.user.upsert({ where: { email: "parent1@college.edu" }, update: {}, create: { email: "parent1@college.edu", password: pw, name: "Parent User", role: "PARENT", isActive: true } })
  const parentU2 = await prisma.user.upsert({ where: { email: "parent2@college.edu" }, update: {}, create: { email: "parent2@college.edu", password: pw, name: "Parent 2", role: "PARENT", isActive: true } })

  // 2. Permissions & Roles
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
  const perms: any[] = []
  for (const m of modules) {
    perms.push(await prisma.permission.upsert({
      where: { key: m.key }, update: {}, create: { key: m.key, name: m.name, module: m.key },
    }))
  }

  const adminRole = await prisma.role.upsert({ where: { name: "Admin" }, update: {}, create: { name: "Admin", description: "Full system access", isSystem: true } })
  const facultyRole = await prisma.role.upsert({ where: { name: "Faculty" }, update: {}, create: { name: "Faculty", description: "Academic staff access", isSystem: true } })
  const studentRole = await prisma.role.upsert({ where: { name: "Student" }, update: {}, create: { name: "Student", description: "Student self-service", isSystem: true } })
  const parentRole = await prisma.role.upsert({ where: { name: "Parent" }, update: {}, create: { name: "Parent", description: "Parent view access", isSystem: true } })

  const facultyMods = ["student", "curriculum", "examination", "attendance", "fee", "timetable", "report", "faculty", "admission"]
  const studentMods = ["student", "curriculum", "examination", "attendance", "fee", "library", "hostel", "transport", "portal", "timetable"]
  const parentMods = ["attendance", "fee", "examination", "portal", "communication", "transport"]

  for (const p of perms) {
    await prisma.rolePermission.upsert({ where: { roleId_permissionId: { roleId: adminRole.id, permissionId: p.id } }, update: { canCreate: true, canRead: true, canUpdate: true, canDelete: true }, create: { roleId: adminRole.id, permissionId: p.id, canCreate: true, canRead: true, canUpdate: true, canDelete: true } })
    const isFM = facultyMods.includes(p.module)
    await prisma.rolePermission.upsert({ where: { roleId_permissionId: { roleId: facultyRole.id, permissionId: p.id } }, update: { canRead: isFM, canCreate: isFM, canUpdate: isFM, canDelete: p.module === "attendance" }, create: { roleId: facultyRole.id, permissionId: p.id, canRead: isFM, canCreate: isFM, canUpdate: isFM, canDelete: p.module === "attendance" } })
    const isSM = studentMods.includes(p.module)
    await prisma.rolePermission.upsert({ where: { roleId_permissionId: { roleId: studentRole.id, permissionId: p.id } }, update: { canRead: isSM }, create: { roleId: studentRole.id, permissionId: p.id, canRead: isSM } })
    const isPM = parentMods.includes(p.module)
    await prisma.rolePermission.upsert({ where: { roleId_permissionId: { roleId: parentRole.id, permissionId: p.id } }, update: { canRead: isPM }, create: { roleId: parentRole.id, permissionId: p.id, canRead: isPM } })
  }

  // Role assignments
  for (const u of [adminUser]) await prisma.roleAssignment.upsert({ where: { userId_roleId: { userId: u.id, roleId: adminRole.id } }, update: {}, create: { userId: u.id, roleId: adminRole.id } })
  for (const u of [fac1, fac2, fac3]) await prisma.roleAssignment.upsert({ where: { userId_roleId: { userId: u.id, roleId: facultyRole.id } }, update: {}, create: { userId: u.id, roleId: facultyRole.id } })
  for (const u of stuUsers) await prisma.roleAssignment.upsert({ where: { userId_roleId: { userId: u.id, roleId: studentRole.id } }, update: {}, create: { userId: u.id, roleId: studentRole.id } })
  for (const u of [parentU, parentU2]) await prisma.roleAssignment.upsert({ where: { userId_roleId: { userId: u.id, roleId: parentRole.id } }, update: {}, create: { userId: u.id, roleId: parentRole.id } })

  // 3. Programs
  const prog1 = await prisma.program.upsert({ where: { code: "BTECH-CSE" }, update: {}, create: { code: "BTECH-CSE", name: "B.Tech Computer Science & Engineering", duration: 4, degreeType: "Bachelor", department: "Engineering", totalSemesters: 8, totalCredits: 160 } })
  const prog2 = await prisma.program.upsert({ where: { code: "BCA" }, update: {}, create: { code: "BCA", name: "Bachelor of Computer Applications", duration: 3, degreeType: "Bachelor", department: "Computer Applications", totalSemesters: 6, totalCredits: 120 } })
  const prog3 = await prisma.program.upsert({ where: { code: "MBA" }, update: {}, create: { code: "MBA", name: "Master of Business Administration", duration: 2, degreeType: "Master", department: "Management", totalSemesters: 4, totalCredits: 80 } })

  // 4. Courses
  const courses: any[] = []
  const courseData = [
    { code: "CSE101", name: "Programming Fundamentals", programId: prog1.id, semester: 1, credits: 4 },
    { code: "CSE102", name: "Data Structures", programId: prog1.id, semester: 2, credits: 4 },
    { code: "CSE201", name: "Database Management Systems", programId: prog1.id, semester: 3, credits: 3 },
    { code: "CSE202", name: "Operating Systems", programId: prog1.id, semester: 4, credits: 3 },
    { code: "CSE301", name: "Computer Networks", programId: prog1.id, semester: 5, credits: 3 },
    { code: "CSE302", name: "Software Engineering", programId: prog1.id, semester: 6, credits: 3 },
    { code: "BCA101", name: "Introduction to Programming", programId: prog2.id, semester: 1, credits: 4 },
    { code: "BCA102", name: "Mathematics for Computing", programId: prog2.id, semester: 2, credits: 4 },
    { code: "BCA201", name: "Object Oriented Programming", programId: prog2.id, semester: 3, credits: 3 },
    { code: "BCA202", name: "Web Technologies", programId: prog2.id, semester: 4, credits: 3 },
    { code: "MBA101", name: "Principles of Management", programId: prog3.id, semester: 1, credits: 4 },
    { code: "MBA102", name: "Financial Accounting", programId: prog3.id, semester: 2, credits: 4 },
    { code: "MBA201", name: "Marketing Management", programId: prog3.id, semester: 3, credits: 3 },
    { code: "MBA202", name: "Human Resource Management", programId: prog3.id, semester: 4, credits: 3 },
  ]
  for (const cd of courseData) {
    const c = await prisma.course.upsert({ where: { code: cd.code }, update: {}, create: cd })
    courses.push(c)
  }

  // 5. Subjects
  const subjects: any[] = []
  const subjectData = [
    ...[
      { code: "CSE101-T", name: "Programming in C", courseId: courses[0].id, credits: 4 },
      { code: "CSE101-L", name: "C Programming Lab", courseId: courses[0].id, credits: 2 },
      { code: "CSE102-T", name: "Data Structures & Algorithms", courseId: courses[1].id, credits: 4 },
      { code: "CSE102-L", name: "Data Structures Lab", courseId: courses[1].id, credits: 2 },
      { code: "CSE201-T", name: "Database Design", courseId: courses[2].id, credits: 3 },
      { code: "CSE201-L", name: "SQL Lab", courseId: courses[2].id, credits: 2 },
      { code: "CSE202-T", name: "OS Concepts", courseId: courses[3].id, credits: 3 },
      { code: "CSE301-T", name: "Network Protocols", courseId: courses[4].id, credits: 3 },
      { code: "CSE302-T", name: "Software Development Lifecycle", courseId: courses[5].id, credits: 3 },
    ],
    ...[
      { code: "BCA101-T", name: "Programming with Python", courseId: courses[6].id, credits: 4 },
      { code: "BCA102-T", name: "Discrete Mathematics", courseId: courses[7].id, credits: 4 },
      { code: "BCA201-T", name: "Java Programming", courseId: courses[8].id, credits: 3 },
      { code: "BCA202-T", name: "HTML, CSS & JavaScript", courseId: courses[9].id, credits: 3 },
    ],
    ...[
      { code: "MBA101-T", name: "Management Theory", courseId: courses[10].id, credits: 4 },
      { code: "MBA102-T", name: "Accounting Principles", courseId: courses[11].id, credits: 4 },
      { code: "MBA201-T", name: "Marketing Strategy", courseId: courses[12].id, credits: 3 },
      { code: "MBA202-T", name: "HR Planning", courseId: courses[13].id, credits: 3 },
    ],
  ]
  for (const sd of subjectData) {
    const s = await prisma.subject.upsert({ where: { code: sd.code }, update: {}, create: sd })
    subjects.push(s)
  }

  // 6. Faculty profiles
  const facultyProfiles = [
    { userId: fac1.id, employeeId: "FAC001", firstName: "Rajesh", lastName: "Sharma", email: "faculty1@college.edu", phone: "+91-9876543211", department: "Computer Science", designation: "Professor", qualification: "Ph.D. Computer Science", specialization: "AI & Machine Learning", dateOfJoining: new Date("2020-01-15"), salary: 150000, address: "Mumbai" },
    { userId: fac2.id, employeeId: "FAC002", firstName: "Priya", lastName: "Patel", email: "faculty2@college.edu", phone: "+91-9876543212", department: "Mathematics", designation: "Associate Professor", qualification: "Ph.D. Mathematics", specialization: "Graph Theory", dateOfJoining: new Date("2021-06-01"), salary: 120000, address: "Delhi" },
    { userId: fac3.id, employeeId: "FAC003", firstName: "Amit", lastName: "Verma", email: "faculty3@college.edu", phone: "+91-9876543213", department: "Management", designation: "Professor", qualification: "Ph.D. Management", specialization: "Marketing & Strategy", dateOfJoining: new Date("2019-08-20"), salary: 130000, address: "Bangalore" },
  ]
  const facultys: any[] = []
  for (const fp of facultyProfiles) {
    const f = await prisma.faculty.upsert({ where: { employeeId: fp.employeeId }, update: {}, create: fp })
    facultys.push(f)
  }

  // 7. Class sections
  const sections: any[] = []
  const sectionData = [
    { name: "BTech CSE Sem1", programId: prog1.id, semester: 1, section: "A", academicYear: "2025-26", classTeacherId: facultys[0].id, capacity: 60 },
    { name: "BTech CSE Sem3", programId: prog1.id, semester: 3, section: "A", academicYear: "2025-26", classTeacherId: facultys[0].id, capacity: 60 },
    { name: "BCA Sem1", programId: prog2.id, semester: 1, section: "A", academicYear: "2025-26", classTeacherId: facultys[1].id, capacity: 50 },
    { name: "BCA Sem3", programId: prog2.id, semester: 3, section: "A", academicYear: "2025-26", classTeacherId: facultys[1].id, capacity: 50 },
    { name: "MBA Sem1", programId: prog3.id, semester: 1, section: "A", academicYear: "2025-26", classTeacherId: facultys[2].id, capacity: 45 },
    { name: "MBA Sem3", programId: prog3.id, semester: 3, section: "A", academicYear: "2025-26", classTeacherId: facultys[2].id, capacity: 45 },
  ]
  for (const sd of sectionData) {
    const s = await prisma.classSection.create({ data: sd })
    sections.push(s)
  }

  // 8. Students
  const students: any[] = []
  const studentNames = ["Aarav Sharma", "Priya Singh", "Rohit Kumar", "Sneha Patel", "Arjun Verma", "Ananya Gupta", "Vikram Reddy", "Neha Joshi", "Karan Mehta", "Ishita Rao", "Rahul Desai", "Pooja Nair"]
  const programAssign = [prog1, prog1, prog2, prog2, prog3, prog3, prog1, prog1, prog2, prog2, prog3, prog3]
  const sectionAssign = [sections[0], sections[0], sections[2], sections[2], sections[4], sections[4], sections[1], sections[1], sections[3], sections[3], sections[5], sections[5]]
  const genders = ["Male", "Female", "Male", "Female", "Male", "Female", "Male", "Female", "Male", "Female", "Male", "Female"]
  for (let i = 0; i < 12; i++) {
    const parts = studentNames[i].split(" ")
    const s = await prisma.student.upsert({
      where: { rollNo: `S2025${String(i + 1).padStart(3, "0")}` },
      update: {},
      create: {
        userId: stuUsers[i].id, rollNo: `S2025${String(i + 1).padStart(3, "0")}`, admissionNo: `ADM${String(i + 1).padStart(4, "0")}`,
        firstName: parts[0], lastName: parts[1] || "", dateOfBirth: new Date(`200${(i % 5) + 2}-0${(i % 9) + 1}-15`),
        gender: genders[i], email: stuUsers[i].email, phone: `+91-98765${String(400 + i).padStart(3, "0")}`,
        address: "College Campus", city: "Mumbai", state: "Maharashtra", pincode: "400001",
        nationality: "Indian", category: i % 2 === 0 ? "General" : "OBC", religion: "Hindu",
        fatherName: `Father of ${parts[0]}`, fatherPhone: `+91-98765${String(500 + i).padStart(3, "0")}`,
        motherName: `Mother of ${parts[0]}`, motherPhone: `+91-98765${String(600 + i).padStart(3, "0")}`,
        programId: programAssign[i].id, currentSemester: i < 6 ? 1 : 3, batchYear: "2025",
        status: "ACTIVE", classSectionId: sectionAssign[i].id,
      },
    })
    students.push(s)
  }

  // 9. Faculty subject assignments
  const fsData = [
    { facultyId: facultys[0].id, courseId: courses[0].id, subjectId: subjects[0].id, semester: 1, academicYear: "2025-26" },
    { facultyId: facultys[0].id, courseId: courses[1].id, subjectId: subjects[2].id, semester: 2, academicYear: "2025-26" },
    { facultyId: facultys[1].id, courseId: courses[6].id, subjectId: subjects[9].id, semester: 1, academicYear: "2025-26" },
    { facultyId: facultys[1].id, courseId: courses[7].id, subjectId: subjects[10].id, semester: 2, academicYear: "2025-26" },
    { facultyId: facultys[2].id, courseId: courses[10].id, subjectId: subjects[14].id, semester: 1, academicYear: "2025-26" },
    { facultyId: facultys[2].id, courseId: courses[11].id, subjectId: subjects[15].id, semester: 2, academicYear: "2025-26" },
  ]
  for (const fd of fsData) {
    await prisma.facultySubject.create({ data: fd })
  }

  // 10. Attendance (5 days for each student = 60 records)
  for (let i = 0; i < 12; i++) {
    for (let d = 0; d < 5; d++) {
      const dt = new Date(2025, 5, 10 + d)
      await prisma.attendance.create({
        data: {
          studentId: students[i].id,
          classSectionId: sectionAssign[i].id,
          date: dt,
          status: Math.random() > 0.15 ? "PRESENT" : "ABSENT",
          period: "1",
          facultyId: i < 6 ? facultys[0].id : facultys[1].id,
          markedBy: "SYSTEM_SEED",
        },
      })
    }
  }

  // 11. Fee structures
  const feeStructs: any[] = []
  for (const prog of [prog1, prog2, prog3]) {
    const fs = await prisma.feeStructure.create({
      data: {
        programId: prog.id, name: `${prog.name} Sem1`, semester: 1, academicYear: "2025-26",
        tuitionFee: prog.id === prog1.id ? 80000 : prog.id === prog2.id ? 50000 : 100000,
        examFee: 5000, libraryFee: 3000, labFee: 4000, sportsFee: 2000,
        totalFee: (prog.id === prog1.id ? 80000 : prog.id === prog2.id ? 50000 : 100000) + 14000,
        dueDate: new Date("2025-07-15"), lateFee: 500,
      },
    })
    feeStructs.push(fs)
  }

  // 12. Fee accounts & payments
  for (let i = 0; i < 12; i++) {
    const fsIdx = programAssign[i].id === prog1.id ? 0 : programAssign[i].id === prog2.id ? 1 : 2
    const totalFee = feeStructs[fsIdx].totalFee
    const paid = i < 8 ? totalFee : i < 10 ? totalFee / 2 : 0
    const fa = await prisma.feeAccount.create({
      data: {
        studentId: students[i].id, feeStructureId: feeStructs[fsIdx].id,
        totalFee: totalFee, paidAmount: paid, dueAmount: totalFee - paid,
        status: i < 8 ? "PAID" : i < 10 ? "PARTIAL" : "UNPAID",
        dueDate: new Date("2025-07-15"),
      },
    })
    if (paid > 0) {
      await prisma.payment.create({
        data: {
          feeAccountId: fa.id, transactionId: `TXN${String(i + 1).padStart(6, "0")}`,
          amount: paid, method: i % 2 === 0 ? "ONLINE" : "CASH",
          paymentDate: new Date(2025, 6, 1 + i), status: "COMPLETED",
          receiptNo: `RCPT${String(i + 1).padStart(5, "0")}`,
        },
      })
    }
  }

  // 13. Exam schedules, exams & marks
  for (let idx = 0; idx < 3; idx++) {
    const prog = [prog1, prog2, prog3][idx]
    const progStudents = students.filter((_, i) => programAssign[i].id === prog.id)
    if (progStudents.length === 0) continue
    const schedule = await prisma.examSchedule.create({
      data: {
        name: `${prog.name} Midterm 2025`, programId: prog.id, semester: 1,
        academicYear: "2025-26", startDate: new Date("2025-08-01"), endDate: new Date("2025-08-10"),
        type: "MIDTERM", isPublished: true,
      },
    })
    const progCourses = courses.filter((c) => c.programId === prog.id)
    for (const course of progCourses) {
      const exam = await prisma.exam.create({
        data: {
          scheduleId: schedule.id, courseId: course.id, subjectId: subjects.find((s) => s.courseId === course.id)?.id || course.id,
          date: new Date("2025-08-05"), startTime: "09:00", endTime: "12:00", maxMarks: 100,
          roomNo: `Room ${100 + idx}`,
        },
      })
      for (const stu of progStudents) {
        const internal = Math.round(15 + Math.random() * 15)
        const external = Math.round(35 + Math.random() * 35)
        const total = internal + external
        await prisma.mark.create({
          data: {
            studentId: stu.id, examId: exam.id, courseId: course.id, subjectId: subjects.find((s) => s.courseId === course.id)?.id || course.id,
            internalMarks: internal, externalMarks: external, totalMarks: total,
            grade: total >= 90 ? "A+" : total >= 75 ? "A" : total >= 60 ? "B" : total >= 40 ? "C" : "F",
            gradePoint: total >= 90 ? 10 : total >= 75 ? 9 : total >= 60 ? 8 : total >= 40 ? 6 : 0,
            result: total >= 40 ? "PASS" : "FAIL",
            enteredBy: "SYSTEM_SEED", isApproved: true, approvedBy: "SYSTEM_SEED",
          },
        })
      }
    }
  }

  // 14. Library
  const books = [
    { isbn: "978-0-13-110362-7", title: "The C Programming Language", author: "Kernighan & Ritchie", publisher: "Prentice Hall", year: 1988, category: "Programming", rackNo: "A1", quantity: 5, available: 3, price: 499 },
    { isbn: "978-0-262-03384-8", title: "Introduction to Algorithms", author: "Cormen et al.", publisher: "MIT Press", year: 2009, category: "Computer Science", rackNo: "A2", quantity: 3, available: 2, price: 899 },
    { isbn: "978-1-4919-1889-0", title: "Python Programming", author: "Mark Lutz", publisher: "O'Reilly", year: 2013, category: "Programming", rackNo: "B1", quantity: 4, available: 4, price: 699 },
    { isbn: "978-0-07-352332-3", title: "Database System Concepts", author: "Silberschatz", publisher: "McGraw Hill", year: 2010, category: "Database", rackNo: "C1", quantity: 3, available: 1, price: 799 },
    { isbn: "978-0-13-468599-1", title: "Operating System Concepts", author: "Silberschatz", publisher: "Wiley", year: 2018, category: "Computer Science", rackNo: "C2", quantity: 3, available: 2, price: 749 },
    { isbn: "978-0-12-374856-0", title: "Computer Networks", author: "Tanenbaum", publisher: "Pearson", year: 2010, category: "Networking", rackNo: "D1", quantity: 4, available: 3, price: 649 },
    { isbn: "978-0-07-802212-8", title: "Accounting Principles", author: "Weygandt", publisher: "Wiley", year: 2018, category: "Management", rackNo: "E1", quantity: 3, available: 3, price: 599 },
  ]
  for (const b of books) {
    await prisma.book.upsert({ where: { id: b.isbn || b.title }, update: {}, create: b })
  }

  // 15. Hostel
  const hostel = await prisma.hostel.create({
    data: { name: "Boys Hostel A", type: "BOYS", address: "Campus North", phone: "+91-9876540001", totalRooms: 50 },
  })
  const hostel2 = await prisma.hostel.create({
    data: { name: "Girls Hostel B", type: "GIRLS", address: "Campus South", phone: "+91-9876540002", totalRooms: 40 },
  })
  const rooms = []
  for (let i = 101; i <= 105; i++) {
    rooms.push(await prisma.hostelRoom.create({ data: { hostelId: hostel.id, roomNo: `A-${i}`, type: "THREE_SEATER", capacity: 3, rent: 4000, floor: 1 } }))
  }
  for (let i = 1; i <= 2; i++) {
    await prisma.hostelAllocation.create({
      data: { studentId: students[i < 2 ? i : i + 4].id, roomId: rooms[i].id, startDate: new Date("2025-07-01"), status: "ACTIVE" },
    })
  }

  // 16. Transport
  const route = await prisma.transportRoute.create({
    data: { name: "Route 1 - North Campus", startPoint: "City Center", endPoint: "College", distance: 12, fee: 3000, capacity: 50 },
  })
  await prisma.transportRoute.create({
    data: { name: "Route 2 - South Campus", startPoint: "Railway Station", endPoint: "College", distance: 8, fee: 2500, capacity: 40 },
  })

  // 17. Communication
  for (const u of [adminUser, fac1, fac2]) {
    await prisma.notification.create({
      data: { userId: u.id, title: "Welcome!", message: "Welcome to College ERP System", type: "SYSTEM" },
    })
  }

  // 18. Accounts
  const acct1 = await prisma.ledgerAccount.upsert({ where: { code: "CASH-001" }, update: {}, create: { code: "CASH-001", name: "Cash Account", type: "ASSET", balance: 500000 } })
  const acct2 = await prisma.ledgerAccount.upsert({ where: { code: "BANK-001" }, update: {}, create: { code: "BANK-001", name: "Bank Account - SBI", type: "ASSET", balance: 2500000 } })
  const acct3 = await prisma.ledgerAccount.upsert({ where: { code: "FEE-001" }, update: {}, create: { code: "FEE-001", name: "Fee Receivable", type: "ASSET", balance: 500000 } })

  // 19. Alumni
  for (let i = 0; i < 2; i++) {
    await prisma.alumni.upsert({
      where: { userId: stuUsers[i].id },
      update: {},
      create: { userId: stuUsers[i].id, studentId: students[i].id, graduationYear: 2029, program: programAssign[i].name, currentEmployer: "Tech Corp", position: "Software Developer", phone: stuUsers[i].phone!, isVerified: true },
    })
  }

  // 20. Enquiries
  await prisma.enquiry.create({
    data: { name: "Ravi Kumar", email: "ravi@example.com", phone: "+91-9988776655", courseInterest: "B.Tech CSE", message: "Interested in admission 2025", status: "NEW" },
  })

  return { users: await prisma.user.count(), programs: await prisma.program.count(), courses: await prisma.course.count(), students: await prisma.student.count(), faculty: await prisma.faculty.count(), attendance: await prisma.attendance.count() }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const key = searchParams.get("key")
  if (key !== "seed2025") return NextResponse.json({ error: "Invalid key" }, { status: 403 })
  try {
    const result = await seedAll()
    return NextResponse.json({ message: "Seed complete!", ...result, login: "admin@college.edu / password123" })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
