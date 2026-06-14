import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Starting seed...")

  // Clean existing data
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
  await prisma.transferCertificate.deleteMany()
  await prisma.studentDocument.deleteMany()
  await prisma.academicHistory.deleteMany()
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
  await prisma.role.deleteMany()
  await prisma.permission.deleteMany()
  await prisma.userPermission.deleteMany()
  await prisma.user.deleteMany()
  await prisma.auditLog.deleteMany()
  await prisma.systemSetting.deleteMany()

  console.log("✅ Cleaned all data")

  // ===================== PERMISSIONS =====================
  const modules = [
    { key: "admission", name: "Admissions" },
    { key: "student", name: "Students" },
    { key: "curriculum", name: "Curriculum" },
    { key: "examination", name: "Examinations" },
    { key: "attendance", name: "Attendance" },
    { key: "faculty", name: "Faculty" },
    { key: "fee", name: "Fee Management" },
    { key: "account", name: "Accounts" },
    { key: "library", name: "Library" },
    { key: "hostel", name: "Hostel" },
    { key: "hr", name: "HR & Payroll" },
    { key: "transport", name: "Transport" },
    { key: "communication", name: "Communication" },
    { key: "report", name: "Reports" },
    { key: "alumni", name: "Alumni" },
    { key: "portal", name: "Portals" },
    { key: "timetable", name: "Timetable" },
    { key: "settings", name: "Settings" },
  ]

  const permissions: any[] = []
  for (const mod of modules) {
    const perm = await prisma.permission.create({
      data: { key: mod.key, name: mod.name, module: mod.key },
    })
    permissions.push(perm)
  }
  console.log("✅ Created permissions")

  const pw = await bcrypt.hash("password123", 10)

  // ===================== ROLES =====================
  // Only one default role: Admin with full access
  // User will create other roles manually via the Roles page
  const adminRole = await prisma.role.create({
    data: { name: "Admin", description: "Full system access", isSystem: true },
  })
  for (const perm of permissions) {
    await prisma.rolePermission.create({
      data: { roleId: adminRole.id, permissionId: perm.id, canCreate: true, canRead: true, canUpdate: true, canDelete: true },
    })
  }
  console.log("✅ Created Admin role with all permissions")

  // ===================== USERS =====================
  const adminUser = await prisma.user.create({
    data: { email: "admin@college.edu", password: pw, name: "Admin User", role: "ADMIN", phone: "+91-9876543210", isActive: true },
  })
  await prisma.roleAssignment.create({ data: { userId: adminUser.id, roleId: adminRole.id } })

  const facultyUser1 = await prisma.user.create({
    data: { email: "faculty1@college.edu", password: pw, name: "Dr. Rajesh Sharma", role: "FACULTY", phone: "+91-9876543211", isActive: true },
  })

  const facultyUser2 = await prisma.user.create({
    data: { email: "faculty2@college.edu", password: pw, name: "Prof. Priya Patel", role: "FACULTY", phone: "+91-9876543212", isActive: true },
  })

  const facultyUser3 = await prisma.user.create({
    data: { email: "faculty3@college.edu", password: pw, name: "Dr. Amit Verma", role: "FACULTY", phone: "+91-9876543213", isActive: true },
  })

  const studentNames = [
    ["Aarav", "Singh"], ["Diya", "Patel"], ["Arjun", "Sharma"], ["Ananya", "Verma"], ["Rohan", "Gupta"],
    ["Ishita", "Reddy"], ["Vivaan", "Joshi"], ["Myra", "Nair"], ["Aditya", "Kumar"], ["Sara", "Khan"],
    ["Krishna", "Iyer"], ["Aadhya", "Deshmukh"],
  ]
  const studentUsers: any[] = []
  for (let i = 0; i < studentNames.length; i++) {
    const [first, last] = studentNames[i]
    const email = `student${i + 1}@college.edu`
    const u = await prisma.user.create({
      data: { email, password: pw, name: `${first} ${last}`, role: "STUDENT", phone: `+91-98765432${10 + i}`, isActive: true },
    })
    studentUsers.push(u)
  }

  const parentUser1 = await prisma.user.create({
    data: { email: "parent1@college.edu", password: pw, name: "Sunita Singh", role: "PARENT", phone: "+91-9876543301", isActive: true },
  })
  const parentUser2 = await prisma.user.create({
    data: { email: "parent2@college.edu", password: pw, name: "Rajesh Patel", role: "PARENT", phone: "+91-9876543302", isActive: true },
  })

  console.log("✅ Created users")

  // ===================== PROGRAMS =====================
  const programs = await Promise.all([
    prisma.program.create({ data: { code: "BTCS", name: "B.Tech Computer Science", duration: 4, degreeType: "Bachelor", department: "Computer Science", totalSemesters: 8, totalCredits: 160 } }),
    prisma.program.create({ data: { code: "BCA", name: "Bachelor of Computer Applications", duration: 3, degreeType: "Bachelor", department: "Computer Science", totalSemesters: 6, totalCredits: 120 } }),
    prisma.program.create({ data: { code: "MBA", name: "Master of Business Administration", duration: 2, degreeType: "Master", department: "Management", totalSemesters: 4, totalCredits: 80 } }),
    prisma.program.create({ data: { code: "BTEC", name: "B.Tech Electronics", duration: 4, degreeType: "Bachelor", department: "Electronics", totalSemesters: 8, totalCredits: 160 } }),
  ])
  console.log("✅ Created programs")

  // ===================== COURSES & SUBJECTS =====================
  const coursesData = [
    { programIdx: 0, semester: 1, courses: [
      { code: "CS101", name: "Programming Fundamentals", credits: 4, subjects: ["C Programming", "Data Structures Basics", "Algorithm Design"] },
      { code: "CS102", name: "Mathematics for Computing", credits: 4, subjects: ["Discrete Mathematics", "Linear Algebra", "Probability"] },
      { code: "CS103", name: "Digital Logic", credits: 3, subjects: ["Boolean Algebra", "Logic Gates", "Sequential Circuits"] },
    ]},
    { programIdx: 0, semester: 2, courses: [
      { code: "CS201", name: "Object-Oriented Programming", credits: 4, subjects: ["C++ Basics", "Inheritance & Polymorphism", "File Handling"] },
      { code: "CS202", name: "Database Management", credits: 4, subjects: ["SQL", "Normalization", "Transaction Processing"] },
    ]},
    { programIdx: 1, semester: 1, courses: [
      { code: "BC101", name: "Computer Fundamentals", credits: 4, subjects: ["Computer Organization", "OS Basics", "Network Basics"] },
      { code: "BC102", name: "Programming in C", credits: 4, subjects: ["C Basics", "Functions", "Pointers"] },
    ]},
    { programIdx: 2, semester: 1, courses: [
      { code: "MB101", name: "Principles of Management", credits: 3, subjects: ["Management Theory", "Planning", "Organizing"] },
      { code: "MB102", name: "Business Economics", credits: 3, subjects: ["Microeconomics", "Macroeconomics", "Market Analysis"] },
    ]},
  ]

  const allCourses: any[] = []
  const allSubjects: any[] = []

  for (const cd of coursesData) {
    for (const c of cd.courses) {
      const course = await prisma.course.create({
        data: { code: c.code, name: c.name, programId: programs[cd.programIdx].id, semester: cd.semester, credits: c.credits },
      })
      allCourses.push(course)
      for (let s = 0; s < c.subjects.length; s++) {
        const sub = await prisma.subject.create({
          data: { code: `${c.code}-SUB${s + 1}`, name: c.subjects[s], courseId: course.id, credits: Math.floor(c.credits / c.subjects.length) || 1 },
        })
        allSubjects.push(sub)
      }
    }
  }
  console.log("✅ Created courses & subjects")

  // ===================== CLASS SECTIONS =====================
  const classSections = await Promise.all([
    prisma.classSection.create({ data: { name: "BTCS Sem1 A", programId: programs[0].id, semester: 1, section: "A", academicYear: "2025-26", capacity: 60 } }),
    prisma.classSection.create({ data: { name: "BTCS Sem1 B", programId: programs[0].id, semester: 1, section: "B", academicYear: "2025-26", capacity: 60 } }),
    prisma.classSection.create({ data: { name: "BCA Sem1 A", programId: programs[1].id, semester: 1, section: "A", academicYear: "2025-26", capacity: 50 } }),
    prisma.classSection.create({ data: { name: "MBA Sem1 A", programId: programs[2].id, semester: 1, section: "A", academicYear: "2025-26", capacity: 40 } }),
  ])
  console.log("✅ Created class sections")

  // ===================== FACULTY =====================
  const faculties = await Promise.all([
    prisma.faculty.create({
      data: { userId: facultyUser1.id, employeeId: "FAC001", firstName: "Rajesh", lastName: "Sharma", email: "faculty1@college.edu", phone: "+91-9876543211", department: "Computer Science", designation: "Professor", qualification: "Ph.D. Computer Science", specialization: "AI & Machine Learning", dateOfJoining: new Date("2020-06-01"), salary: 120000, address: "123, Green Avenue, New Delhi" },
    }),
    prisma.faculty.create({
      data: { userId: facultyUser2.id, employeeId: "FAC002", firstName: "Priya", lastName: "Patel", email: "faculty2@college.edu", phone: "+91-9876543212", department: "Computer Science", designation: "Associate Professor", qualification: "Ph.D. Data Science", specialization: "Big Data Analytics", dateOfJoining: new Date("2021-07-15"), salary: 95000, address: "456, Lake View, Mumbai" },
    }),
    prisma.faculty.create({
      data: { userId: facultyUser3.id, employeeId: "FAC003", firstName: "Amit", lastName: "Verma", email: "faculty3@college.edu", phone: "+91-9876543213", department: "Management", designation: "Professor", qualification: "Ph.D. Management", specialization: "Marketing & Strategy", dateOfJoining: new Date("2019-01-10"), salary: 130000, address: "789, Hill Road, Bangalore" },
    }),
  ])

  // Assign class teachers
  await prisma.classSection.update({ where: { id: classSections[0].id }, data: { classTeacherId: faculties[0].id } })
  await prisma.classSection.update({ where: { id: classSections[1].id }, data: { classTeacherId: faculties[1].id } })
  await prisma.classSection.update({ where: { id: classSections[2].id }, data: { classTeacherId: faculties[0].id } })
  await prisma.classSection.update({ where: { id: classSections[3].id }, data: { classTeacherId: faculties[2].id } })

  // Faculty subject assignments
  await prisma.facultySubject.createMany({
    data: [
      { facultyId: faculties[0].id, courseId: allCourses[0].id, subjectId: allSubjects[0].id, semester: 1, academicYear: "2025-26" },
      { facultyId: faculties[1].id, courseId: allCourses[0].id, subjectId: allSubjects[1].id, semester: 1, academicYear: "2025-26" },
      { facultyId: faculties[0].id, courseId: allCourses[1].id, subjectId: allSubjects[3].id, semester: 1, academicYear: "2025-26" },
      { facultyId: faculties[2].id, courseId: allCourses[6].id, subjectId: allSubjects[12].id, semester: 1, academicYear: "2025-26" },
    ],
  })
  console.log("✅ Created faculty")

  // ===================== STUDENTS =====================
  const genders = ["MALE", "FEMALE", "MALE", "FEMALE", "MALE", "FEMALE", "MALE", "FEMALE", "MALE", "FEMALE", "MALE", "FEMALE"]
  const cities = ["Delhi", "Mumbai", "Bangalore", "Hyderabad", "Pune", "Chennai", "Kolkata", "Ahmedabad", "Jaipur", "Lucknow", "Chandigarh", "Indore"]

  for (let i = 0; i < studentUsers.length; i++) {
    const [first, last] = studentNames[i]
    const sectionIdx = i < 6 ? 0 : 2
    const progIdx = i < 6 ? 0 : 1
    await prisma.student.create({
      data: {
        userId: studentUsers[i].id,
        rollNo: `${programs[progIdx].code}${String(i + 1).padStart(4, "0")}`,
        admissionNo: `ADM${String(i + 1).padStart(5, "0")}`,
        firstName: first, lastName: last,
        dateOfBirth: new Date(2000 + (i % 5), i % 12, (i % 28) + 1),
        gender: genders[i], bloodGroup: i % 2 === 0 ? "O+" : "B+",
        email: studentUsers[i].email,
        phone: `+91-98765432${10 + i}`,
        address: `${100 + i}, ${cities[i]} Colony`,
        city: cities[i], state: "State", pincode: "11000" + i,
        nationality: "Indian", category: ["GENERAL", "OBC", "SC", "ST", "GENERAL"][i % 5],
        religion: i % 2 === 0 ? "Hindu" : "Muslim",
        fatherName: `Mr. ${last}`, fatherPhone: `+91-98765439${10 + i}`,
        motherName: `Mrs. ${last}`, motherPhone: `+91-98765449${10 + i}`,
        programId: programs[progIdx].id,
        classSectionId: sectionIdx < classSections.length ? classSections[sectionIdx].id : classSections[0].id,
        currentSemester: 1, batchYear: "2025", status: "ACTIVE",
      },
    })
  }
  console.log("✅ Created students")

  // ===================== PARENTS =====================
  const parent1 = await prisma.parent.create({ data: { userId: parentUser1.id, name: "Sunita Singh", email: "parent1@college.edu", phone: "+91-9876543301", relation: "MOTHER" } })
  const parent2 = await prisma.parent.create({ data: { userId: parentUser2.id, name: "Rajesh Patel", email: "parent2@college.edu", phone: "+91-9876543302", relation: "FATHER" } })
  // Link students to parents: first 6 to parent1, next 6 to parent2
  const allStudents = await prisma.student.findMany({ orderBy: { rollNo: "asc" } })
  for (let i = 0; i < allStudents.length; i++) {
    await prisma.student.update({
      where: { id: allStudents[i].id },
      data: { parentId: i < 6 ? parent1.id : parent2.id },
    })
  }
  console.log("✅ Created parents & linked to students")

  // ===================== ATTENDANCE (last 30 days) =====================
  const students = await prisma.student.findMany()
  const today = new Date()
  let attCount = 0
  for (let d = 30; d >= 0; d--) {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - d)
    if (date.getDay() === 0) continue // skip Sundays
    const dayStudents = students.filter(s => {
      if (date.getDate() % 2 === 0) return s.id
      return students.indexOf(s) % 3 !== 0 // 66% attendance pattern
    })
    for (const s of dayStudents) {
      const status = students.indexOf(s) % 3 === 0 ? "ABSENT" : students.indexOf(s) % 5 === 0 ? "LEAVE" : "PRESENT"
      await prisma.attendance.create({
        data: { studentId: s.id, date, status, markedBy: "seed" },
      })
      attCount++
    }
  }
  console.log(`✅ Created ${attCount} attendance records`)

  // ===================== TIMETABLE =====================
  const timetableEntries = [
    { cs: 0, sub: 0, course: 0, faculty: 0, day: 1, time: "09:00", room: "101" },
    { cs: 0, sub: 1, course: 0, faculty: 1, day: 1, time: "10:00", room: "102" },
    { cs: 0, sub: 2, course: 0, faculty: 0, day: 2, time: "09:00", room: "101" },
    { cs: 0, sub: 0, course: 0, faculty: 0, day: 3, time: "09:00", room: "101" },
    { cs: 0, sub: 3, course: 1, faculty: 0, day: 3, time: "10:00", room: "103" },
    { cs: 1, sub: 0, course: 0, faculty: 0, day: 1, time: "11:00", room: "104" },
    { cs: 2, sub: 6, course: 3, faculty: 0, day: 1, time: "09:00", room: "201" },
    { cs: 3, sub: 12, course: 6, faculty: 2, day: 2, time: "10:00", room: "301" },
  ]

  for (const t of timetableEntries) {
    await prisma.timetable.create({
      data: {
        classSectionId: classSections[t.cs].id,
        subjectId: allSubjects[t.sub].id,
        courseId: allCourses[t.course].id,
        facultyId: faculties[t.faculty].id,
        dayOfWeek: t.day,
        startTime: t.time,
        endTime: `${parseInt(t.time.split(":")[0]) + 1}:00`,
        roomNo: t.room,
        academicYear: "2025-26",
        semester: 1,
      },
    })
  }
  console.log("✅ Created timetable")

  // ===================== FEE STRUCTURES =====================
  for (const prog of programs) {
    await prisma.feeStructure.create({
      data: {
        programId: prog.id, name: `${prog.name} Sem1 Fee`, semester: 1, academicYear: "2025-26",
        tuitionFee: 50000, examFee: 5000, libraryFee: 3000, labFee: 4000, sportsFee: 2000,
        totalFee: 64000, dueDate: new Date("2025-08-15"), isActive: true,
      },
    })
  }
  console.log("✅ Created fee structures")

  // ===================== FEE ACCOUNTS =====================
  const feeStructures = await prisma.feeStructure.findMany()
  for (let i = 0; i < students.length; i++) {
    const feeIdx = students[i].programId === programs[0].id ? 0 : students[i].programId === programs[1].id ? 1 : 2
    const feeStr = feeStructures[feeIdx] || feeStructures[0]
    const total = feeStr.totalFee
    const paid = i < 8 ? total : i < 10 ? total * 0.5 : 0
    await prisma.feeAccount.create({
      data: {
        studentId: students[i].id,
        feeStructureId: feeStr.id,
        totalFee: total,
        paidAmount: paid,
        dueAmount: total - paid,
        status: paid >= total ? "PAID" : paid > 0 ? "PARTIAL" : "UNPAID",
        dueDate: new Date("2025-08-15"),
      },
    })
  }
  console.log("✅ Created fee accounts")

  // ===================== EXAM SCHEDULE =====================
  const examSchedule = await prisma.examSchedule.create({
    data: {
      name: "Mid Term Exams 2025",
      programId: programs[0].id,
      semester: 1,
      academicYear: "2025-26",
      startDate: new Date("2025-09-15"),
      endDate: new Date("2025-09-25"),
      type: "MIDTERM",
      isPublished: true,
    },
  })

  // Create exams
  for (let c = 0; c < 3; c++) {
    await prisma.exam.create({
      data: {
        scheduleId: examSchedule.id,
        courseId: allCourses[c].id,
        subjectId: allSubjects[c].id,
        date: new Date(2025, 8, 15 + c),
        startTime: "09:00",
        endTime: "12:00",
        maxMarks: 100,
        roomNo: `Hall ${101 + c}`,
      },
    })
  }

  // Marks for students
  const exams = await prisma.exam.findMany()
  for (const s of students.slice(0, 6)) {
    for (const exam of exams) {
      const marks = 30 + Math.floor(Math.random() * 60)
      await prisma.mark.create({
        data: {
          studentId: s.id, examId: exam.id, courseId: exam.courseId, subjectId: exam.subjectId,
          totalMarks: marks, grade: marks >= 40 ? "PASS" : "FAIL", result: marks >= 40 ? "PASS" : "FAIL",
          enteredBy: "seed", isApproved: true,
        },
      })
    }
  }
  console.log("✅ Created exam schedules & marks")

  // ===================== BOOKS =====================
  const books = [
    { title: "Introduction to Algorithms", author: "Cormen", isbn: "978-0-262-03384-8", category: "Computer Science", rackNo: "CS-A1", quantity: 5 },
    { title: "Database System Concepts", author: "Silberschatz", isbn: "978-0-07-352332-3", category: "Computer Science", rackNo: "CS-A2", quantity: 3 },
    { title: "Operating System Concepts", author: "Galvin", isbn: "978-1-118-06333-0", category: "Computer Science", rackNo: "CS-B1", quantity: 4 },
    { title: "Principles of Management", author: "Koontz", isbn: "978-0-07-133340-5", category: "Management", rackNo: "MG-A1", quantity: 3 },
    { title: "Engineering Mathematics", author: "Kreyszig", isbn: "978-0-470-45836-5", category: "Mathematics", rackNo: "MA-A1", quantity: 2 },
  ]
  for (const b of books) {
    await prisma.book.create({ data: { ...b, available: b.quantity, year: 2020, publisher: "Oxford Press" } })
  }
  console.log("✅ Created books")

  // ===================== HOSTEL =====================
  const hostel = await prisma.hostel.create({
    data: { name: "Boys Hostel A", type: "BOYS", address: "Campus North Block", phone: "+91-1234567890", totalRooms: 50 },
  })
  await prisma.hostelRoom.create({ data: { hostelId: hostel.id, roomNo: "101", type: "SHARING", capacity: 2, occupied: 1, rent: 12000, floor: 1 } })
  await prisma.hostelRoom.create({ data: { hostelId: hostel.id, roomNo: "102", type: "SHARING", capacity: 2, occupied: 0, rent: 12000, floor: 1 } })
  await prisma.hostelRoom.create({ data: { hostelId: hostel.id, roomNo: "201", type: "SINGLE", capacity: 1, occupied: 1, rent: 18000, floor: 2 } })

  await prisma.hostelAllocation.create({
    data: { studentId: students[0].id, roomId: (await prisma.hostelRoom.findFirst({ where: { roomNo: "101" } }))!.id, startDate: new Date("2025-07-01"), status: "ACTIVE" },
  })
  console.log("✅ Created hostel data")

  // ===================== TRANSPORT =====================
  const route = await prisma.transportRoute.create({
    data: { name: "Route 1 - North Campus", startPoint: "City Center", endPoint: "College Campus", distance: 12.5, fee: 5000, capacity: 40 },
  })
  const driver = await prisma.transportDriver.create({
    data: { name: "Suresh Kumar", phone: "+91-9988776655", licenseNo: "DL-1234567890", address: "Driver Colony, Delhi" },
  })
  await prisma.transportVehicle.create({
    data: { routeId: route.id, vehicleNo: "DL-01-AB-1234", type: "BUS", capacity: 40, driverId: driver.id },
  })
  await prisma.transportPass.create({
    data: { studentId: students[1].id, routeId: route.id, amount: 5000, issueDate: new Date("2025-07-01"), expiryDate: new Date("2026-06-30"), status: "ACTIVE" },
  })
  console.log("✅ Created transport data")

  // ===================== COMMUNICATION =====================
  await prisma.broadcast.create({
    data: { title: "Welcome to New Academic Year", message: "Dear students, welcome to the academic year 2025-26. Classes start from July 15th.", type: "ANNOUNCEMENT", audience: "ALL", status: "SENT", sentAt: new Date() },
  })
  await prisma.broadcast.create({
    data: { title: "Mid Term Exam Schedule", message: "Mid term exams will be held from Sep 15-25. Please check the schedule.", type: "ANNOUNCEMENT", audience: "STUDENT", status: "SENT", sentAt: new Date() },
  })

  for (const su of studentUsers) {
    await prisma.notification.create({
      data: { userId: su.id, title: "Welcome!", message: `Welcome ${su.name}! Your account has been activated.`, type: "SYSTEM" },
    })
  }
  console.log("✅ Created communication data")

  // ===================== ACCOUNTS =====================
  const accounts = await Promise.all([
    prisma.ledgerAccount.create({ data: { code: "TUIT", name: "Tuition Fees", type: "INCOME", balance: 0 } }),
    prisma.ledgerAccount.create({ data: { code: "SAL", name: "Salary Account", type: "EXPENSE", balance: 0 } }),
    prisma.ledgerAccount.create({ data: { code: "CASH", name: "Cash Account", type: "ASSET", balance: 500000 } }),
  ])
  const voucher = await prisma.voucher.create({
    data: { voucherNo: "VCH-001", type: "RECEIPT", date: new Date(), description: "Tuition fee collection", amount: 320000, createdBy: "seed" },
  })
  await prisma.voucherEntry.create({ data: { voucherId: voucher.id, accountId: accounts[0].id, credit: 320000, narration: "Sem 1 fees collected" } })
  await prisma.voucherEntry.create({ data: { voucherId: voucher.id, accountId: accounts[2].id, debit: 320000, narration: "Cash received" } })
  console.log("✅ Created accounts data")

  // ===================== ALUMNI =====================
  const alumniUser = await prisma.user.create({
    data: { email: "alumni1@college.edu", password: pw, name: "Vikram Mehta", role: "STUDENT", phone: "+91-9876543001", isActive: true },
  })
  await prisma.alumni.create({
    data: { userId: alumniUser.id, graduationYear: 2020, program: "B.Tech Computer Science", currentEmployer: "Google", position: "Software Engineer", phone: "+91-9876543001", isVerified: true },
  })
  console.log("✅ Created alumni")

  console.log("\n🎉 Seed complete! Login credentials:")
  console.log("  Admin:   admin@college.edu / password123")
  console.log("  Faculty: faculty1@college.edu / password123")
  console.log("  Student: student1@college.edu / password123")
  console.log("  Parent:  parent1@college.edu / password123")
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
