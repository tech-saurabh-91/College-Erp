import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get("type")

  try {
    if (type === "staff") {
      const search = searchParams.get("search")
      const where: any = {}
      if (search) {
        where.OR = [
          { firstName: { contains: search, mode: "insensitive" } },
          { lastName: { contains: search, mode: "insensitive" } },
          { employeeId: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ]
      }
      const data = await prisma.staff.findMany({ where, orderBy: { createdAt: "desc" } })
      return NextResponse.json(data)
    }

    if (type === "salary") {
      const staffId = searchParams.get("staffId")
      const where: any = {}
      if (staffId) where.staffId = staffId
      const data = await prisma.salaryStructure.findMany({
        where,
        orderBy: { effectiveFrom: "desc" },
      })
      return NextResponse.json(data)
    }

    if (type === "payslip") {
      const staffId = searchParams.get("staffId")
      const month = searchParams.get("month")
      const year = searchParams.get("year")
      const where: any = {}
      if (staffId) where.staffId = staffId
      if (month && year) { where.month = parseInt(month); where.year = parseInt(year) }
      const data = await prisma.payslip.findMany({
        where,
        orderBy: [{ year: "desc" }, { month: "desc" }],
      })
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

    if (type === "staff") {
      const staffCount = await prisma.staff.count()
      const employeeId = body.employeeId || `EMP${String(staffCount + 1).padStart(4, "0")}`

      const staff = await prisma.staff.create({
        data: {
          employeeId,
          firstName: body.firstName,
          lastName: body.lastName,
          email: body.email,
          phone: body.phone,
          department: body.department,
          designation: body.designation,
          type: body.type || "TEACHING",
          dateOfJoining: new Date(body.dateOfJoining),
          salary: body.salary ? parseFloat(body.salary) : null,
          bankAccount: body.bankAccount || null,
          ifscCode: body.ifscCode || null,
          panNo: body.panNo || null,
          uanNo: body.uanNo || null,
          address: body.address,
        },
      })
      return NextResponse.json(staff)
    }

    if (type === "salary") {
      const basicPay = parseFloat(body.basicPay) || 0
      const hra = parseFloat(body.hra) || 0
      const da = parseFloat(body.da) || 0
      const ta = parseFloat(body.ta) || 0
      const pfDeduction = parseFloat(body.pfDeduction) || 0
      const taxDeduction = parseFloat(body.taxDeduction) || 0
      const otherAllowance = parseFloat(body.otherAllowance) || 0
      const otherDeduction = parseFloat(body.otherDeduction) || 0
      const grossEarnings = basicPay + hra + da + ta + otherAllowance
      const totalDeductions = pfDeduction + taxDeduction + otherDeduction
      const netSalary = grossEarnings - totalDeductions

      const salary = await prisma.salaryStructure.create({
        data: {
          staffId: body.staffId,
          basicPay,
          hra,
          da,
          ta,
          pfDeduction,
          taxDeduction,
          otherAllowance,
          otherDeduction,
          netSalary,
          effectiveFrom: new Date(body.effectiveFrom),
        },
      })
      return NextResponse.json(salary)
    }

    if (type === "payslip") {
      const staffId = body.staffId
      const month = parseInt(body.month)
      const year = parseInt(body.year)

      const salaryStructure = await prisma.salaryStructure.findFirst({
        where: { staffId, effectiveFrom: { lte: new Date(year, month - 1, 1) } },
        orderBy: { effectiveFrom: "desc" },
      })

      if (!salaryStructure) {
        return NextResponse.json({ error: "No salary structure found for this period" }, { status: 400 })
      }

      const existing = await prisma.payslip.findFirst({ where: { staffId, month, year } })
      if (existing) {
        return NextResponse.json({ error: "Payslip already exists for this period" }, { status: 400 })
      }

      const grossPay = salaryStructure.basicPay + salaryStructure.hra + salaryStructure.da + salaryStructure.ta + salaryStructure.otherAllowance
      const totalDeductions = salaryStructure.pfDeduction + salaryStructure.taxDeduction + salaryStructure.otherDeduction
      const netPay = grossPay - totalDeductions

      const payslip = await prisma.payslip.create({
        data: {
          staffId,
          month,
          year,
          basicPay: salaryStructure.basicPay,
          hra: salaryStructure.hra,
          da: salaryStructure.da,
          ta: salaryStructure.ta,
          otherAllowance: salaryStructure.otherAllowance,
          grossPay,
          pfDeduction: salaryStructure.pfDeduction,
          taxDeduction: salaryStructure.taxDeduction,
          otherDeduction: salaryStructure.otherDeduction,
          netPay,
          status: "GENERATED",
        },
      })
      return NextResponse.json(payslip)
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

    if (type === "staff" && id) {
      const staff = await prisma.staff.update({
        where: { id },
        data: {
          firstName: body.firstName,
          lastName: body.lastName,
          email: body.email,
          phone: body.phone,
          department: body.department,
          designation: body.designation,
          type: body.type,
          salary: body.salary ? parseFloat(body.salary) : undefined,
          bankAccount: body.bankAccount,
          ifscCode: body.ifscCode,
          panNo: body.panNo,
          uanNo: body.uanNo,
          address: body.address,
          isActive: body.isActive !== undefined ? body.isActive : undefined,
        },
      })
      return NextResponse.json(staff)
    }

    if (type === "salary" && id) {
      const basicPay = parseFloat(body.basicPay) || 0
      const hra = parseFloat(body.hra) || 0
      const da = parseFloat(body.da) || 0
      const ta = parseFloat(body.ta) || 0
      const pfDeduction = parseFloat(body.pfDeduction) || 0
      const taxDeduction = parseFloat(body.taxDeduction) || 0
      const otherAllowance = parseFloat(body.otherAllowance) || 0
      const otherDeduction = parseFloat(body.otherDeduction) || 0
      const grossEarnings = basicPay + hra + da + ta + otherAllowance
      const totalDeductions = pfDeduction + taxDeduction + otherDeduction
      const netSalary = grossEarnings - totalDeductions

      const salary = await prisma.salaryStructure.update({
        where: { id },
        data: {
          basicPay,
          hra,
          da,
          ta,
          pfDeduction,
          taxDeduction,
          otherAllowance,
          otherDeduction,
          netSalary,
          effectiveFrom: body.effectiveFrom ? new Date(body.effectiveFrom) : undefined,
        },
      })
      return NextResponse.json(salary)
    }

    if (type === "payslip" && id) {
      const payslip = await prisma.payslip.update({
        where: { id },
        data: { status: body.status || "PAID", paidAt: body.status === "PAID" ? new Date() : undefined },
      })
      return NextResponse.json(payslip)
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

    if (type === "staff") {
      await prisma.salaryStructure.deleteMany({ where: { staffId: id } })
      await prisma.payslip.deleteMany({ where: { staffId: id } })
      await prisma.staff.update({ where: { id }, data: { isActive: false } })
      return NextResponse.json({ message: "Staff deactivated" })
    }

    if (type === "salary") {
      await prisma.salaryStructure.delete({ where: { id } })
      return NextResponse.json({ message: "Salary structure deleted" })
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 })
  }
}
