"use client"
import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  BookOpen, ChevronDown, ChevronRight, FileText, Users, CalendarCheck,
  ClipboardList, ClipboardCheck, UserCog, DollarSign, CreditCard,
  BookMarked, Building2, Bus, Bell, BarChart3, Globe, Smartphone,
  LayoutDashboard, Shield, HelpCircle, School, Settings, Camera
} from "lucide-react"

const modules = [
  {
    key: "admission", icon: FileText, title: "Admissions",
    content: `Manage the complete admission lifecycle from enquiry to enrollment.

Step-by-step:
1. Enquiries tab: Click "New Enquiry" to record a prospective student's details (name, email, phone, course interest, source). Use the Eye icon to view details, Edit icon to update status (New → Contacted → Converted → Closed).
2. Applications tab: Click "New Application" to create a formal application. Fill in personal details, academic percentages, and select the program. The system generates a unique application number automatically.
3. Merit tab: Create merit lists for each program. Add entries with ranks and scores. Publish the list when ready.
4. Enrolled tab: View seat allotments. Track fee payment status for each enrolled student.

Search: Use the search bar to filter by name, email, or application number.`
  },
  {
    key: "student", icon: Users, title: "Student Information",
    content: `Central repository for all student records.

Step-by-step:
1. Click "Add Student" to register a new student. Fill in personal details, address, parent/guardian information, and program enrollment.
2. The system auto-generates Roll Number and Admission Number based on the program.
3. Edit: Click the Edit icon on any student row to update their information (address, phone, parent details, semester, batch year).
4. View all students in the table. Use the search bar to filter by name, roll number, or email.
5. Filter by Program using the dropdown to see students from a specific program only.

Note: Student status (Active, Alumni, Transferred, Withdrawn) can be updated from the edit form.`
  },
  {
    key: "curriculum", icon: BookOpen, title: "Curriculum Management",
    content: `Manage academic programs, courses, and subjects.

Step-by-step:
1. Programs tab: Click "Add Program" to create a new academic program (e.g., B.Tech Computer Science). Set code, name, degree type, department, duration, and total semesters.
2. Courses tab: Expand a program to see its courses. Click "Add Course" to add courses under a program. Set semester, credits, and whether it's an elective.
3. Subjects tab: Expand a course to see its subjects. Click "Add Subject" to add subjects. Set type (Theory/Practical/Project), credits, max marks, and pass marks.
4. Click Edit on any item to modify its details.

Tip: The accordion view helps you navigate the program → course → subject hierarchy easily.`
  },
  {
    key: "timetable", icon: CalendarCheck, title: "Timetable",
    content: `Weekly class schedule management with a visual grid view.

Step-by-step:
1. Select a Class Section from the dropdown to filter the timetable.
2. Click "Add Entry" to schedule a class. Select: Class Section, Course, Subject, Faculty member, Day of the week, Start & End time, Room number, Academic Year & Semester.
3. The grid shows Monday-Saturday with time slots from 7 AM to 5 PM.
4. Hover over any scheduled class to see Edit (green) and Delete (red) buttons.
5. Edit: Click the Edit icon to update the entry's details.
6. Delete: Click the Delete icon to remove the entry.

Tip: Use the section filter to view timetables for different classes.`
  },
  {
    key: "examination", icon: ClipboardList, title: "Examinations",
    content: `End-to-end exam management from scheduling to results.

Step-by-step:
1. Schedule tab: Click "Add Schedule" to create an exam schedule. Select program, course, subject, exam type (Midterm/Final/Practical), date, start/end time, max marks, and room.
2. Hall Tickets tab: Generate hall tickets for students. Select the exam schedule and click "Generate" to create hall tickets for all enrolled students.
3. Marks Entry tab: Select an exam schedule, then enter marks for each student. The table shows roll number, student name, and a marks input field.
4. Results tab: View published results. Filter by program, semester, or exam type. Results show grade, percentage, and status (Pass/Fail).

Tip: Marks are automatically saved as you enter them.`
  },
  {
    key: "attendance", icon: ClipboardCheck, title: "Attendance",
    content: `Track student attendance with multiple marking methods.

Step-by-step:
=== Daily Mode ===
1. Select the Class Section and Date.
2. Use the Present (green check), Absent (red cross), or Leave (yellow document) buttons for each student.
3. The stats bar shows total students, present, absent, and on-leave counts.
4. A red alert appears if attendance falls below 75%.
5. Click "Save Attendance" to save all entries.

=== Monthly Mode ===
1. Switch to the Monthly tab.
2. Select Class Section, Month, and Year.
3. View the monthly summary (total records, present, absent, leave, percentage).
4. Use the Student Report section: select a student and click "View Report" to see their individual attendance record with daily breakdown.

=== Camera Mode (Face Recognition) ===
1. Switch to the Camera tab.
2. Select the student from the dropdown.
3. Click "Start Camera" and allow camera access when prompted.
4. Look at the camera. The system detects your face and shows a green bounding box.
5. Blink when prompted to confirm liveness (proves you're a real person, not a photo).
6. Once liveness is confirmed, click "Mark Present".
7. The present status is recorded for that student.
8. Click "Stop Camera" when done.

Tip: Camera data stays on your device. No images are uploaded to the server.`
  },
  {
    key: "faculty", icon: UserCog, title: "Faculty Management",
    content: `Manage faculty profiles, subject assignments, leave, and appraisals.

Step-by-step:
1. Faculty tab: View all faculty members. Click "Add Faculty" to register a new faculty member with personal details, qualification, and specialization.
2. Subject Assignments tab: Click "Assign Subject" to assign a faculty member to teach a specific subject for a course and section.
3. Leave tab: Click "Apply Leave" to record faculty leave. Select faculty member, leave type (Sick/Casual/Earned/Maternity), dates, and reason.
4. Appraisal tab: Click "Add Appraisal" to record performance reviews. Select faculty, review period, and rating.

Tip: Use the tabs to switch between different faculty management functions.`
  },
  {
    key: "fee", icon: DollarSign, title: "Fee Management",
    content: `Manage fee structures, collect payments, and track dues.

Step-by-step:
1. Structures tab: Click "Add Structure" to define fee structures for each program. Set fee heads (Tuition, Library, Lab, Sports, etc.) with amounts per semester.
2. Collections tab: Click "Collect Fee" to record a payment. Select the student, fee structure, and enter the amount paid.
3. Dues tab: View all pending fee dues. The table shows student name, program, total fee, amount paid, and balance due.
4. Receipts tab: View all payment receipts with receipt number, student details, amount, date, and payment mode.

Tip: The dues section highlights overdue payments in red.`
  },
  {
    key: "account", icon: CreditCard, title: "Accounts & Finance",
    content: `Full accounting system with ledger, vouchers, and budget management.

Step-by-step:
1. Ledger tab: View all ledger accounts. Click "Add Account" to create a new account (e.g., Tuition Fees, Salary, Electricity). Each account has a unique code and opening balance.
2. Vouchers tab: Click "Add Voucher" to record financial transactions. Select type (Payment / Receipt / Journal / Contra), debit and credit accounts, amount, and description.
3. Budget tab: Click "Add Budget" to set budget allocations for each account for a fiscal year.
4. Balance Sheet tab: View the balance sheet showing assets and liabilities. The system calculates totals from the ledger accounts.

Tip: Filter by date range to see transactions for a specific period.`
  },
  {
    key: "library", icon: BookMarked, title: "Library Management",
    content: `Manage books, issues/returns, and fines.

Step-by-step:
1. Books tab: Click "Add Book" to add a new book to the library. Enter title, author, ISBN, publisher, category, and rack number. The system tracks total and available copies.
2. Issue/Return tab: Click "Issue Book" to lend a book to a student. Select the student and book. The issue date is auto-filled. Click "Return" when the book is returned.
3. Fines tab: Click "Add Fine" to charge a fine for late returns. Select the student, enter the amount and reason. Track paid/unpaid status.

Tip: The availability count updates automatically when books are issued or returned.`
  },
  {
    key: "hostel", icon: Building2, title: "Hostel Management",
    content: `Manage hostel rooms, allocations, mess menu, and visitors.

Step-by-step:
1. Rooms tab: Click "Add Room" to create hostel rooms. Enter room number, floor, type (Single/Sharing/Dormitory), capacity, and monthly rent.
2. Allocations tab: Click "Allocate Room" to assign a room to a student. Select the student, room, and allocation period. Click "Vacate" when the student leaves.
3. Mess Menu tab: Click "Add Menu" to set the daily mess menu. Select day of week, meal type (Breakfast/Lunch/Dinner/Snacks), and menu items.
4. Visitors tab: Click "Add Visitor" to log a visitor entry for a student. Enter visitor name, relation, phone, in-time, and purpose.

Tip: Room availability shows as "Available / Total" capacity.`
  },
  {
    key: "hr", icon: UserCog, title: "HR & Payroll",
    content: `Manage staff records, salary structures, and payslip generation.

Step-by-step:
1. Staff tab: Click "Add Staff" to register non-teaching staff. Enter personal details, designation, department, and bank information.
2. Salary Structures tab: Click "Add Structure" to define a salary for a staff member. Set basic pay, HRA, DA, TA, and deductions (PF, tax). Net salary is auto-calculated.
3. Payslips tab: Click "Generate Payslip" to create a payslip for a staff member for a specific month. View or delete existing payslips.

Tip: Net salary = (Basic + HRA + DA + TA) - (PF + Tax deductions).`
  },
  {
    key: "transport", icon: Bus, title: "Transport Management",
    content: `Manage bus routes, vehicles, drivers, and student transport passes.

Step-by-step:
1. Routes tab: Click "Add Route" to create transport routes. Enter route name, start/end points, and stops.
2. Vehicles tab: Click "Add Vehicle" to register a bus/van. Enter vehicle number, type, capacity, and insurance details.
3. Drivers tab: Click "Add Driver" to register drivers. Enter name, license number, phone, and emergency contact.
4. Passes tab: Click "Issue Pass" to issue a transport pass to a student. Select the student, route, vehicle, driver, and pass validity period.`

  },
  {
    key: "communication", icon: Bell, title: "Communication",
    content: `Send broadcast messages and manage notifications.

Step-by-step:
1. Broadcast tab: Click "Send Broadcast" to send a message to all users or a specific role. Enter the title, message, and select the target audience (All / Admin / Faculty / Student / Parent).
2. Notifications tab: View all sent notifications. Click the Eye icon to view full message details.

Tip: Broadcasts are visible to users in their respective portals.`
  },
  {
    key: "report", icon: BarChart3, title: "Reports & Analytics",
    content: `Visual analytics dashboard with charts and statistics.

Step-by-step:
1. View the overview statistics at the top: total students, faculty, programs, and courses.
2. Enrollment Trend chart: Shows enrollment over the last 6 months.
3. Attendance Distribution chart: Shows the percentage split of present, absent, and on-leave.
4. Fee Collection chart: Shows monthly fee collection amounts.
5. Exam Performance chart: Shows average marks across subjects.

Tip: Hover over chart elements to see exact values. Charts auto-update when new data is added.`
  },
  {
    key: "alumni", icon: Globe, title: "Alumni Portal",
    content: `Manage alumni directory, job postings, events, and donations.

Step-by-step:
1. Directory tab: View all registered alumni with their graduation year, program, company, and designation.
2. Jobs tab: Click "Post Job" to share job opportunities visible to alumni.
3. Events tab: Click "Add Event" to create alumni events (reunions, webinars, etc.) with date, location, and description.
4. Donations tab: Click "Record Donation" to track alumni contributions.

Tip: Alumni can update their profiles through the alumni self-service portal.`
  },
  {
    key: "portal", icon: Smartphone, title: "Portals Overview",
    content: `Overview of role-specific portals and features available to each user type.

Step-by-step:
The Portals page shows four role-based portals:
1. Student Portal: View personal info, attendance, timetable, exam schedule, marks, fees, library books, hostel details, and transport pass.
2. Parent Portal: View ward's attendance, exam results, fee details, and communication.
3. Faculty Portal: View assigned courses, timetable, mark entry, leave status, and appraisal history.
4. Admin Portal: Full system access to all modules with CRUD operations.

Click on any portal card to see the features available for that role.`
  },
  {
    key: "settings", icon: Settings, title: "Roles & Permissions",
    content: `Role-based access control management (Admin only).

Step-by-step:
1. Click on a role (Admin, Faculty, Student, Parent) to manage its permissions.
2. Click the "Permissions" button next to any role to open the permission editor.
3. For each module, toggle checkboxes: Read (View), Create (Add), Edit (Update), Delete (Remove).
4. The right panel shows a quick overview of the selected role's permissions.
5. Click "Save Permissions" to apply changes.

Admin role has full access by default (all toggles ON). Other roles have limited access.
Changes take effect immediately for all users assigned to that role.

To assign roles to users, use the role assignment feature in the users section.

Note: System roles (Admin, Faculty, Student, Parent) cannot be deleted, but their permissions can be modified.`
  },
]

export default function ManualPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [expanded, setExpanded] = useState<string | null>("overview")
  const [userPerms, setUserPerms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return }
    if (session) {
      const perms = (session.user as any)?.permissions || []
      setUserPerms(perms)
      setLoading(false)
    }
  }, [session, status, router])

  if (status === "loading" || loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" /></div>
  }

  const role = (session?.user as any)?.role || "STUDENT"
  const isAdmin = role === "ADMIN"

  function hasAccess(moduleKey: string): boolean {
    if (isAdmin) return true
    return userPerms.some((rp: any) =>
      rp.permission?.module === moduleKey && rp.canRead === true
    )
  }

  function toggleSection(key: string) {
    setExpanded(expanded === key ? null : key)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-blue-100 rounded-xl">
          <HelpCircle className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">User Manual</h1>
          <p className="text-sm text-gray-500">Complete guide to using the College ERP system</p>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-3">
          <School size={20} className="text-blue-600" /> About College ERP
        </h2>
        <p className="text-gray-600 leading-relaxed">
          College ERP is a comprehensive academic management system designed to digitize and streamline all
          college operations. It covers the complete lifecycle from student admission to alumni management,
          including academics, examinations, attendance, fees, library, hostel, transport, HR, accounts, and communication.
        </p>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-blue-50 rounded-lg p-3 text-center"><p className="text-2xl font-bold text-blue-600">18</p><p className="text-xs text-gray-600">Modules</p></div>
          <div className="bg-green-50 rounded-lg p-3 text-center"><p className="text-2xl font-bold text-green-600">4</p><p className="text-xs text-gray-600">User Roles</p></div>
          <div className="bg-purple-50 rounded-lg p-3 text-center"><p className="text-2xl font-bold text-purple-600">Full</p><p className="text-xs text-gray-600">CRUD Operations</p></div>
          <div className="bg-orange-50 rounded-lg p-3 text-center"><p className="text-2xl font-bold text-orange-600">RBAC</p><p className="text-xs text-gray-600">Access Control</p></div>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-3">
          <Shield size={20} className="text-blue-600" /> Getting Started
        </h2>
        <div className="space-y-3 text-gray-600 text-sm leading-relaxed">
          <p><strong>1. Login:</strong> Use your credentials at the login page. Demo accounts:
            <br />Admin: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">admin@college.edu</code> / <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">admin123</code>
            <br />Faculty: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">faculty@college.edu</code> / <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">faculty123</code>
            <br />Student: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">student@college.edu</code> / <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">student123</code>
            <br />Parent: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">parent@college.edu</code> / <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">parent123</code>
          </p>
          <p><strong>2. Dashboard:</strong> After login, you&apos;ll see the dashboard with key statistics and quick links. The sidebar on the left shows all modules you have access to.</p>
          <p><strong>3. Navigation:</strong> Use the sidebar menu to navigate between modules. Each module has its own set of features organized in tabs or views.</p>
          <p><strong>4. Role-Based Access:</strong> What you see depends on your role. Admin has full access. Faculty can view and edit academics. Students and Parents have read-only access to their relevant sections.</p>
          <p><strong>5. Permissions:</strong> Admins can configure button-level permissions (Create, Read, Edit, Delete) for each role in Settings → Roles & Permissions.</p>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
          <BookOpen size={20} className="text-blue-600" /> Module Guides
        </h2>
        <p className="text-sm text-gray-500 mb-4">Click each section to expand the guide. Modules you don&apos;t have access to are hidden.</p>

        <div className="space-y-2">
          <button onClick={() => toggleSection("overview")}
            className="w-full flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
            <span className="font-medium text-gray-800 flex items-center gap-2"><LayoutDashboard size={18} className="text-blue-500" /> Dashboard Overview</span>
            {expanded === "overview" ? <ChevronDown size={18} className="text-gray-400" /> : <ChevronRight size={18} className="text-gray-400" />}
          </button>
          {expanded === "overview" && (
            <div className="p-4 bg-white border border-gray-100 rounded-lg text-sm text-gray-600 leading-relaxed">
              <p><strong>Purpose:</strong> The Dashboard is your home screen after login. It provides a quick snapshot of key metrics and quick links to frequently used modules.</p>
              <br />
              <p><strong>What you&apos;ll see:</strong></p>
              <ul className="list-disc pl-5 space-y-1 mt-1">
                <li><strong>Statistics Cards:</strong> Total Students, Faculty, Programs, and Courses counts.</li>
                <li><strong>Quick Links:</strong> Shortcuts to Admissions, Attendance, Timetable, and Fee modules.</li>
                <li><strong>Role Badge:</strong> Your current role is displayed in the top bar (Admin, Faculty, Student, Parent).</li>
              </ul>
              <br />
              <p><strong>Tip:</strong> Use the sidebar to navigate to any module. The sidebar collapses on smaller screens.</p>
            </div>
          )}

          {modules.filter(m => hasAccess(m.key)).map((mod) => {
            const Icon = mod.icon
            return (
              <div key={mod.key}>
                <button onClick={() => toggleSection(mod.key)}
                  className="w-full flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                  <span className="font-medium text-gray-800 flex items-center gap-2"><Icon size={18} className="text-blue-500" /> {mod.title}</span>
                  {expanded === mod.key ? <ChevronDown size={18} className="text-gray-400" /> : <ChevronRight size={18} className="text-gray-400" />}
                </button>
                {expanded === mod.key && (
                  <div className="p-4 bg-white border border-gray-100 rounded-lg text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                    {mod.content}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {isAdmin && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-3">
            <Settings size={20} className="text-blue-600" /> Admin Features
          </h2>
          <div className="text-sm text-gray-600 leading-relaxed space-y-2">
            <p>As an <strong>Admin</strong>, you have additional capabilities:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Roles & Permissions:</strong> Go to Settings → Roles & Permissions in the sidebar. Assign button-level access (Create, Read, Edit, Delete) for each module to each role.</li>
              <li><strong>User Management:</strong> Admins can view and manage all users across the system.</li>
              <li><strong>Full CRUD:</strong> All modules allow Create, Read, Edit, and Delete operations.</li>
              <li><strong>All Modules Visible:</strong> The sidebar shows all 18 modules for Admin users.</li>
            </ul>
          </div>
        </div>
      )}

      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-3">
          <Camera size={20} className="text-blue-600" /> Face Recognition Attendance
        </h2>
        <div className="text-sm text-gray-600 leading-relaxed space-y-2">
          <p>The system includes a <strong>free, browser-based face recognition</strong> feature for attendance marking.</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>How it works:</strong> Uses your device camera with face-api.js (TensorFlow.js). All processing happens locally in your browser — no images are uploaded.</li>
            <li><strong>Liveness Detection:</strong> The system detects blinks to confirm you&apos;re a real person, preventing photo-based fraud.</li>
            <li><strong>Requirements:</strong> Camera access permission, good lighting, face clearly visible.</li>
            <li><strong>Fallback:</strong> Manual attendance (Present/Absent/Leave toggles) is always available as an alternative.</li>
            <li><strong>Privacy:</strong> No facial data is stored on the server. The camera feed is processed in real-time and discarded.</li>
          </ul>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-3">
          <HelpCircle size={20} className="text-blue-600" /> Need Help?
        </h2>
        <div className="text-sm text-gray-600 leading-relaxed">
          <p>For additional support:</p>
          <ul className="list-disc pl-5 space-y-1 mt-1">
            <li>Contact your system administrator for role-based access issues.</li>
            <li>Use the Roles & Permissions page (Admin only) to configure access rights.</li>
            <li>This manual is available to all users, but sections are hidden if you don&apos;t have access to that module.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
