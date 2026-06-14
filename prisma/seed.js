const { PrismaClient } = require("@prisma/client")
const { hash } = require("bcryptjs")

const prisma = new PrismaClient()

async function main() {
  console.log("Seeding database...")

  // Users
  const adminPassword = await hash("admin123", 10)
  const facultyPassword = await hash("faculty123", 10)
  const studentPassword = await hash("student123", 10)
  const parentPassword = await hash("parent123", 10)

  const admin = await prisma.user.upsert({
    where: { email: "admin@college.edu" },
    update: {},
    create: { email: "admin@college.edu", password: adminPassword, name: "Admin User", role: "ADMIN" },
  })

  const faculty = await prisma.user.upsert({
    where: { email: "faculty@college.edu" },
    update: {},
    create: { email: "faculty@college.edu", password: facultyPassword, name: "Dr. Sharma", role: "FACULTY" },
  })

  const student = await prisma.user.upsert({
    where: { email: "student@college.edu" },
    update: {},
    create: { email: "student@college.edu", password: studentPassword, name: "Rahul Kumar", role: "STUDENT" },
  })

  const parent = await prisma.user.upsert({
    where: { email: "parent@college.edu" },
    update: {},
    create: { email: "parent@college.edu", password: parentPassword, name: "Mr. Kumar", role: "PARENT" },
  })

  console.log("Users created")

  // Program
  const program = await prisma.program.upsert({
    where: { code: "BTECH-CS" },
    update: {},
    create: {
      code: "BTECH-CS",
      name: "B.Tech Computer Science",
      duration: 4,
      degreeType: "BACHELOR",
      department: "Computer Science",
      totalSemesters: 8,
      totalCredits: 160,
    },
  })

  console.log("Program created")

  // Courses & Subjects
  const course1 = await prisma.course.create({
    data: {
      code: "CS101",
      name: "Programming Fundamentals",
      programId: program.id,
      semester: 1,
      credits: 4,
      maxMarks: 100,
      passMarks: 40,
    },
  })

  const course2 = await prisma.course.create({
    data: {
      code: "CS102",
      name: "Data Structures",
      programId: program.id,
      semester: 1,
      credits: 4,
      maxMarks: 100,
      passMarks: 40,
    },
  })

  const course3 = await prisma.course.create({
    data: {
      code: "CS201",
      name: "Database Management Systems",
      programId: program.id,
      semester: 2,
      credits: 4,
      maxMarks: 100,
      passMarks: 40,
    },
  })

  const subject1 = await prisma.subject.create({
    data: { code: "CS101T", name: "Programming Theory", courseId: course1.id, credits: 3 },
  })
  const subject2 = await prisma.subject.create({
    data: { code: "CS101L", name: "Programming Lab", courseId: course1.id, credits: 1, type: "PRACTICAL" },
  })
  const subject3 = await prisma.subject.create({
    data: { code: "CS102T", name: "Data Structures Theory", courseId: course2.id, credits: 3 },
  })
  const subject4 = await prisma.subject.create({
    data: { code: "CS201T", name: "DBMS Theory", courseId: course3.id, credits: 3 },
  })

  // Faculty
  const facProfile = await prisma.faculty.create({
    data: {
      userId: faculty.id,
      employeeId: "FAC001",
      firstName: "Dr.",
      lastName: "Sharma",
      email: "faculty@college.edu",
      phone: "9876543210",
      department: "Computer Science",
      designation: "Professor",
      qualification: "Ph.D.",
      specialization: "Artificial Intelligence",
      dateOfJoining: new Date("2020-01-01"),
      salary: 85000,
      address: "College Campus",
    },
  })

  await prisma.facultySubject.create({
    data: { facultyId: facProfile.id, courseId: course1.id, subjectId: subject1.id, semester: 1, academicYear: "2025-26" },
  })

  // Student
  const studentProfile = await prisma.student.create({
    data: {
      userId: student.id,
      rollNo: "CS2025001",
      admissionNo: "ADM001",
      firstName: "Rahul",
      lastName: "Kumar",
      dateOfBirth: new Date("2003-05-15"),
      gender: "MALE",
      bloodGroup: "O+",
      email: "student@college.edu",
      phone: "9876543211",
      address: "123 Main Street",
      city: "New Delhi",
      state: "Delhi",
      pincode: "110001",
      nationality: "Indian",
      category: "General",
      fatherName: "Mr. Rajesh Kumar",
      fatherPhone: "9876543212",
      motherName: "Mrs. Sunita Kumar",
      motherPhone: "9876543213",
      programId: program.id,
      currentSemester: 1,
      batchYear: "2025",
      status: "ACTIVE",
    },
  })

  // Parent
  await prisma.parent.create({
    data: {
      userId: parent.id,
      name: "Mr. Rajesh Kumar",
      email: "parent@college.edu",
      phone: "9876543212",
      relation: "FATHER",
    },
  })

  // Class Section
  const classSection = await prisma.classSection.create({
    data: {
      name: "CS-1A",
      programId: program.id,
      semester: 1,
      section: "A",
      academicYear: "2025-26",
      classTeacherId: facProfile.id,
      capacity: 60,
    },
  })

  // Timetable entry
  await prisma.timetable.create({
    data: {
      classSectionId: classSection.id,
      subjectId: subject1.id,
      courseId: course1.id,
      facultyId: facProfile.id,
      dayOfWeek: 0,
      startTime: "09:00",
      endTime: "10:00",
      roomNo: "CS-101",
      academicYear: "2025-26",
      semester: 1,
    },
  })

  await prisma.timetable.create({
    data: {
      classSectionId: classSection.id,
      subjectId: subject2.id,
      courseId: course1.id,
      facultyId: facProfile.id,
      dayOfWeek: 1,
      startTime: "10:00",
      endTime: "12:00",
      roomNo: "CS-LAB-1",
      academicYear: "2025-26",
      semester: 1,
    },
  })

  // Fee structure
  const feeStructure = await prisma.feeStructure.create({
    data: {
      programId: program.id,
      name: "B.Tech CS Semester 1",
      semester: 1,
      academicYear: "2025-26",
      tuitionFee: 50000,
      examFee: 5000,
      libraryFee: 3000,
      labFee: 2000,
      sportsFee: 1000,
      otherFees: 2000,
      totalFee: 63000,
      dueDate: new Date("2025-08-15"),
      lateFee: 500,
    },
  })

  // Fee account
  const feeAccount = await prisma.feeAccount.create({
    data: {
      studentId: studentProfile.id,
      feeStructureId: feeStructure.id,
      totalFee: 63000,
      paidAmount: 63000,
      dueAmount: 0,
      status: "PAID",
      dueDate: new Date("2025-08-15"),
    },
  })

  // Payment
  await prisma.payment.create({
    data: {
      feeAccountId: feeAccount.id,
      transactionId: "TXN001",
      amount: 63000,
      method: "ONLINE",
      status: "COMPLETED",
      receiptNo: "RCP001",
    },
  })

  // Attendance records (30 days)
  const today = new Date()
  for (let i = 30; i > 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    if (date.getDay() !== 0 && date.getDay() !== 6) {
      await prisma.attendance.create({
        data: {
          studentId: studentProfile.id,
          classSectionId: classSection.id,
          date,
          status: Math.random() > 0.15 ? "PRESENT" : "ABSENT",
          subjectId: subject1.id,
          facultyId: facProfile.id,
          markedBy: facProfile.id,
        },
      })
    }
  }

  // Exam schedule
  const examSchedule = await prisma.examSchedule.create({
    data: {
      name: "Mid Term Exams - Semester 1",
      programId: program.id,
      semester: 1,
      academicYear: "2025-26",
      startDate: new Date("2025-09-15"),
      endDate: new Date("2025-09-25"),
      type: "MIDTERM",
      isPublished: false,
    },
  })

  const exam = await prisma.exam.create({
    data: {
      scheduleId: examSchedule.id,
      courseId: course1.id,
      subjectId: subject1.id,
      date: new Date("2025-09-15"),
      startTime: "09:00",
      endTime: "12:00",
      maxMarks: 100,
      roomNo: "CS-101",
      invigilatorId: facProfile.id,
    },
  })

  // Marks
  await prisma.mark.create({
    data: {
      studentId: studentProfile.id,
      examId: exam.id,
      courseId: course1.id,
      subjectId: subject1.id,
      internalMarks: 35,
      externalMarks: 52,
      totalMarks: 87,
      grade: "A",
      gradePoint: 9.0,
      result: "PASS",
      enteredBy: facProfile.id,
      isApproved: true,
      approvedBy: admin.id,
    },
  })

  // Library
  await prisma.book.create({
    data: {
      isbn: "978-0262033848",
      title: "Introduction to Algorithms",
      author: "Thomas H. Cormen",
      publisher: "MIT Press",
      category: "Computer Science",
      rackNo: "CS-A1",
      quantity: 5,
      available: 4,
      price: 2500,
    },
  })

  await prisma.book.create({
    data: {
      isbn: "978-0131103627",
      title: "The C Programming Language",
      author: "Brian Kernighan",
      publisher: "Prentice Hall",
      category: "Computer Science",
      rackNo: "CS-A2",
      quantity: 3,
      available: 2,
      price: 1800,
    },
  })

  // Book issue
  const issueDate = new Date()
  issueDate.setDate(issueDate.getDate() - 14)
  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + 7)
  const book = await prisma.book.findFirst()
  if (book) {
    await prisma.bookIssue.create({
      data: {
        bookId: book.id,
        studentId: studentProfile.id,
        issueDate,
        dueDate,
        status: "ISSUED",
      },
    })
  }

  // Hostel
  const hostel = await prisma.hostel.create({
    data: {
      name: "Boys Hostel A",
      type: "BOYS",
      address: "College Campus North Wing",
      phone: "011-2345678",
      totalRooms: 100,
    },
  })

  const room = await prisma.hostelRoom.create({
    data: {
      hostelId: hostel.id,
      roomNo: "A-101",
      type: "DOUBLE",
      capacity: 2,
      occupied: 1,
      rent: 12000,
      floor: 1,
    },
  })

  await prisma.hostelAllocation.create({
    data: {
      studentId: studentProfile.id,
      roomId: room.id,
      status: "ACTIVE",
    },
  })

  // Transport
  const route = await prisma.transportRoute.create({
    data: {
      name: "Route 1 - City Center",
      startPoint: "City Center",
      endPoint: "College",
      distance: 15,
      fee: 5000,
      capacity: 50,
    },
  })

  const driver = await prisma.transportDriver.create({
    data: {
      name: "Suresh Singh",
      phone: "9876543200",
      licenseNo: "DL-2020-12345",
      address: "City Center Colony",
    },
  })

  await prisma.transportVehicle.create({
    data: {
      routeId: route.id,
      vehicleNo: "DL-01-AB-1234",
      type: "BUS",
      capacity: 50,
      driverId: driver.id,
    },
  })

  await prisma.transportPass.create({
    data: {
      studentId: studentProfile.id,
      routeId: route.id,
      amount: 5000,
      issueDate: new Date("2025-07-01"),
      expiryDate: new Date("2026-06-30"),
      status: "ACTIVE",
    },
  })

  // Accounts
  await prisma.ledgerAccount.createMany({
    data: [
      { code: "CASH", name: "Cash Account", type: "ASSET", balance: 500000 },
      { code: "BANK", name: "Bank Account", type: "ASSET", balance: 2000000 },
      { code: "FEE_INCOME", name: "Fee Income", type: "INCOME", balance: 5000000 },
      { code: "SALARY_EXP", name: "Salary Expenses", type: "EXPENSE", balance: 3000000 },
    ],
  })

  // Communication - Broadcast
  await prisma.broadcast.create({
    data: {
      title: "Welcome to New Academic Year",
      message: "Dear students, welcome to the academic year 2025-26. Classes start from July 15th.",
      type: "NOTICE",
      audience: "ALL",
      status: "SENT",
      sentAt: new Date(),
    },
  })

  // Enquiry
  await prisma.enquiry.create({
    data: {
      name: "Amit Singh",
      email: "amit@example.com",
      phone: "9988776655",
      courseInterest: "B.Tech Computer Science",
      message: "Interested in admission for 2025-26",
      status: "NEW",
    },
  })

  // Mess Menu
  await prisma.messMenu.create({
    data: { day: "MONDAY", meal: "BREAKFAST", items: "Aloo Paratha, Curd, Juice", hostelId: hostel.id },
  })
  await prisma.messMenu.create({
    data: { day: "MONDAY", meal: "LUNCH", items: "Dal, Rice, Roti, Paneer, Salad", hostelId: hostel.id },
  })
  await prisma.messMenu.create({
    data: { day: "MONDAY", meal: "DINNER", items: "Chicken Curry, Rice, Roti, Raita", hostelId: hostel.id },
  })

  // Alumni
  const alumniUser = await prisma.user.create({
    data: {
      email: "alumni@college.edu",
      password: adminPassword,
      name: "Vikram Patel",
      role: "ALUMNI",
    },
  })
  await prisma.alumni.create({
    data: {
      userId: alumniUser.id,
      graduationYear: 2022,
      program: "B.Tech Computer Science",
      currentEmployer: "Google",
      position: "Software Engineer",
      isVerified: true,
      phone: "9988776644",
    },
  })

  // System Settings
  await prisma.systemSetting.createMany({
    data: [
      { key: "college_name", value: "Saurabh College of Engineering & Technology" },
      { key: "college_address", value: "Knowledge Park, New Delhi - 110001" },
      { key: "college_phone", value: "011-23456789" },
      { key: "college_email", value: "info@scet.edu" },
      { key: "academic_year", value: "2025-26" },
      { key: "attendance_threshold", value: "75" },
      { key: "whatsapp_bot_number", value: "+919876543210" },
    ],
  })

  // Salary Structure
  const staff = await prisma.staff.create({
    data: {
      employeeId: "STF001",
      firstName: "Rajesh",
      lastName: "Gupta",
      email: "rajesh.gupta@college.edu",
      phone: "9876543222",
      department: "Administration",
      designation: "Accountant",
      type: "NON_TEACHING",
      dateOfJoining: new Date("2021-01-01"),
      salary: 45000,
      bankAccount: "1234567890",
      ifscCode: "SBIN0001234",
      panNo: "ABCDE1234F",
      address: "College Campus",
    },
  })

  await prisma.salaryStructure.create({
    data: {
      staffId: staff.id,
      basicPay: 25000,
      hra: 10000,
      da: 5000,
      ta: 2000,
      pfDeduction: 3000,
      taxDeduction: 2000,
      netSalary: 37000,
      effectiveFrom: new Date("2025-04-01"),
    },
  })

  // ====================== RBAC: Roles & Permissions ======================
  const modKeys = [
    "admission", "student", "curriculum", "examination", "attendance",
    "faculty", "fee", "account", "library", "hostel", "hr", "transport",
    "communication", "report", "alumni", "portal", "timetable", "settings",
  ]
  const permRecords = {}
  for (const mod of modKeys) {
    const perm = await prisma.permission.upsert({
      where: { key: `${mod}_access` },
      update: {},
      create: {
        key: `${mod}_access`,
        name: `${mod.charAt(0).toUpperCase() + mod.slice(1)} Access`,
        module: mod,
        description: `Access to ${mod} module`,
      },
    })
    permRecords[mod] = perm
  }

  const roleAdmin = await prisma.role.upsert({
    where: { name: "Admin" },
    update: {},
    create: { name: "Admin", description: "Full system access", isSystem: true },
  })
  const roleFaculty = await prisma.role.upsert({
    where: { name: "Faculty" },
    update: {},
    create: { name: "Faculty", description: "Faculty member access", isSystem: true },
  })
  const roleStudent = await prisma.role.upsert({
    where: { name: "Student" },
    update: {},
    create: { name: "Student", description: "Student access", isSystem: true },
  })
  const roleParent = await prisma.role.upsert({
    where: { name: "Parent" },
    update: {},
    create: { name: "Parent", description: "Parent/guardian access", isSystem: true },
  })

  const fullAccess = ["admission", "student", "curriculum", "examination", "attendance", "faculty", "fee", "account", "library", "hostel", "hr", "transport", "communication", "report", "alumni", "portal", "timetable", "settings"]
  const facultyAccess = ["student", "curriculum", "attendance", "examination", "timetable", "communication", "report"]
  const studentAccess = ["curriculum", "examination", "attendance", "library", "hostel", "transport", "communication", "portal"]
  const parentAccess = ["student", "attendance", "examination", "fee", "communication", "portal"]

  async function assignPerms(roleId, modules, canRead, canCreate, canUpdate, canDelete) {
    for (const mod of modules) {
      const perm = permRecords[mod]
      if (perm) {
        await prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId, permissionId: perm.id } },
          update: { canRead, canCreate, canUpdate, canDelete },
          create: { roleId, permissionId: perm.id, canRead, canCreate, canUpdate, canDelete },
        })
      }
    }
  }

  await assignPerms(roleAdmin.id, fullAccess, true, true, true, true)
  await assignPerms(roleFaculty.id, facultyAccess, true, false, true, false)
  await assignPerms(roleStudent.id, studentAccess, true, false, false, false)
  await assignPerms(roleParent.id, parentAccess, true, false, false, false)

  const userRoleMap = [
    { email: "admin@college.edu", roleName: "Admin" },
    { email: "faculty@college.edu", roleName: "Faculty" },
    { email: "student@college.edu", roleName: "Student" },
    { email: "parent@college.edu", roleName: "Parent" },
  ]
  for (const ur of userRoleMap) {
    const user = await prisma.user.findUnique({ where: { email: ur.email } })
    const role = await prisma.role.findUnique({ where: { name: ur.roleName } })
    if (user && role) {
      try {
        await prisma.roleAssignment.create({ data: { userId: user.id, roleId: role.id } })
      } catch {}
    }
  }

  console.log("Database seeded successfully!")
  console.log("\nLogin Credentials:")
  console.log("Admin:   admin@college.edu / admin123")
  console.log("Faculty: faculty@college.edu / faculty123")
  console.log("Student: student@college.edu / student123")
  console.log("Parent:  parent@college.edu / parent123")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
