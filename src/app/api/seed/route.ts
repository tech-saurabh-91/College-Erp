import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const key = searchParams.get("key")
  if (key !== "seed2025") return NextResponse.json({ error: "Invalid key" }, { status: 403 })

  try {
    const pw = await bcrypt.hash("password123", 10)

    // Create permissions if they don't exist
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
        where: { key: m.key }, update: { name: m.name, module: m.key }, create: { key: m.key, name: m.name, module: m.key },
      }))
    }

    // Create system roles
    const adminRole = await prisma.role.upsert({ where: { name: "Admin" }, update: { description: "Full system access", isSystem: true }, create: { name: "Admin", description: "Full system access", isSystem: true } })
    const facultyRole = await prisma.role.upsert({ where: { name: "Faculty" }, update: { description: "Academic staff access", isSystem: true }, create: { name: "Faculty", description: "Academic staff access", isSystem: true } })
    const studentRole = await prisma.role.upsert({ where: { name: "Student" }, update: { description: "Student self-service", isSystem: true }, create: { name: "Student", description: "Student self-service", isSystem: true } })
    const parentRole = await prisma.role.upsert({ where: { name: "Parent" }, update: { description: "Parent view access", isSystem: true }, create: { name: "Parent", description: "Parent view access", isSystem: true } })

    const facultyMods = ["student", "curriculum", "examination", "attendance", "fee", "timetable", "report", "faculty"]
    const studentMods = ["student", "curriculum", "examination", "attendance", "fee", "library", "hostel", "transport", "portal", "timetable"]
    const parentMods = ["attendance", "fee", "examination", "portal", "communication", "transport"]

    for (const p of perms) {
      // Admin: full access
      await prisma.rolePermission.upsert({ where: { roleId_permissionId: { roleId: adminRole.id, permissionId: p.id } }, update: { canCreate: true, canRead: true, canUpdate: true, canDelete: true }, create: { roleId: adminRole.id, permissionId: p.id, canCreate: true, canRead: true, canUpdate: true, canDelete: true } })
      // Faculty
      const isFM = facultyMods.includes(p.module)
      await prisma.rolePermission.upsert({ where: { roleId_permissionId: { roleId: facultyRole.id, permissionId: p.id } }, update: { canRead: isFM || ["communication","portal"].includes(p.module), canCreate: isFM, canUpdate: isFM, canDelete: p.module === "attendance" }, create: { roleId: facultyRole.id, permissionId: p.id, canRead: isFM || ["communication","portal"].includes(p.module), canCreate: isFM, canUpdate: isFM, canDelete: p.module === "attendance" } })
      // Student
      const isSM = studentMods.includes(p.module)
      await prisma.rolePermission.upsert({ where: { roleId_permissionId: { roleId: studentRole.id, permissionId: p.id } }, update: { canRead: isSM }, create: { roleId: studentRole.id, permissionId: p.id, canRead: isSM } })
      // Parent
      const isPM = parentMods.includes(p.module)
      await prisma.rolePermission.upsert({ where: { roleId_permissionId: { roleId: parentRole.id, permissionId: p.id } }, update: { canRead: isPM }, create: { roleId: parentRole.id, permissionId: p.id, canRead: isPM } })
    }

    // Users
    const adminUser = await prisma.user.upsert({
      where: { email: "admin@college.edu" }, update: { isActive: true },
      create: { email: "admin@college.edu", password: pw, name: "Admin User", role: "ADMIN", phone: "+91-9876543210", isActive: true },
    })
    await prisma.roleAssignment.upsert({ where: { userId_roleId: { userId: adminUser.id, roleId: adminRole.id } }, update: {}, create: { userId: adminUser.id, roleId: adminRole.id } })

    const facUsers = [
      { email: "faculty1@college.edu", name: "Dr. Rajesh Sharma" },
      { email: "faculty2@college.edu", name: "Prof. Priya Patel" },
    ]
    for (const fu of facUsers) {
      const u = await prisma.user.upsert({ where: { email: fu.email }, update: { isActive: true }, create: { email: fu.email, password: pw, name: fu.name, role: "FACULTY", isActive: true } })
      await prisma.roleAssignment.upsert({ where: { userId_roleId: { userId: u.id, roleId: facultyRole.id } }, update: {}, create: { userId: u.id, roleId: facultyRole.id } })
    }

    for (let i = 1; i <= 5; i++) {
      const u = await prisma.user.upsert({ where: { email: `student${i}@college.edu` }, update: { isActive: true }, create: { email: `student${i}@college.edu`, password: pw, name: `Student ${i}`, role: "STUDENT", isActive: true } })
      await prisma.roleAssignment.upsert({ where: { userId_roleId: { userId: u.id, roleId: studentRole.id } }, update: {}, create: { userId: u.id, roleId: studentRole.id } })
    }

    const pu = await prisma.user.upsert({ where: { email: "parent1@college.edu" }, update: { isActive: true }, create: { email: "parent1@college.edu", password: pw, name: "Parent User", role: "PARENT", isActive: true } })
    await prisma.roleAssignment.upsert({ where: { userId_roleId: { userId: pu.id, roleId: parentRole.id } }, update: {}, create: { userId: pu.id, roleId: parentRole.id } })

    return NextResponse.json({
      message: "Seed complete!",
      users: await prisma.user.count(),
      roles: await prisma.role.count(),
      login: "admin@college.edu / password123",
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
