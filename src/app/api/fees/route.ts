import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get("type")
  const programId = searchParams.get("programId")
  const studentId = searchParams.get("studentId")
  const feeAccountId = searchParams.get("feeAccountId")
  const status = searchParams.get("status")

  try {
    if (type === "structures") {
      const where: any = {}
      if (programId) where.programId = programId
      const data = await prisma.feeStructure.findMany({
        where,
        include: { program: true },
        orderBy: [{ academicYear: "desc" }, { semester: "asc" }],
      })
      return NextResponse.json(data)
    }

    if (type === "accounts") {
      const where: any = {}
      if (studentId) where.studentId = studentId
      if (status) where.status = status
      const data = await prisma.feeAccount.findMany({
        where,
        include: { student: true, feeStructure: { include: { program: true } }, payments: true },
        orderBy: { createdAt: "desc" },
      })
      return NextResponse.json(data)
    }

    if (type === "payments") {
      const where: any = {}
      if (feeAccountId) where.feeAccountId = feeAccountId
      const data = await prisma.payment.findMany({
        where,
        include: { feeAccount: { include: { student: true, feeStructure: true } } },
        orderBy: { paymentDate: "desc" },
      })
      return NextResponse.json(data)
    }

    if (type === "dues") {
      const accounts = await prisma.feeAccount.findMany({
        where: { status: { in: ["UNPAID", "PARTIAL", "OVERDUE"] } },
        include: { student: true, feeStructure: { include: { program: true } }, payments: true },
        orderBy: { dueAmount: "desc" },
      })
      return NextResponse.json(accounts)
    }

    if (type === "programs") {
      const data = await prisma.program.findMany({ where: { isActive: true }, orderBy: { name: "asc" } })
      return NextResponse.json(data)
    }

    if (type === "students") {
      const data = await prisma.student.findMany({
        where: { status: "ACTIVE" },
        orderBy: { rollNo: "asc" },
        select: { id: true, rollNo: true, firstName: true, lastName: true, programId: true, currentSemester: true },
      })
      return NextResponse.json(data)
    }

    if (type === "stats") {
      const totalStructures = await prisma.feeStructure.count({ where: { isActive: true } })
      const totalCollections = await prisma.payment.aggregate({ _sum: { amount: true }, where: { status: "COMPLETED" } })
      const totalDues = await prisma.feeAccount.aggregate({ _sum: { dueAmount: true } })
      const pendingAccounts = await prisma.feeAccount.count({ where: { status: { in: ["UNPAID", "PARTIAL"] } } })
      return NextResponse.json({
        totalStructures,
        totalCollections: totalCollections._sum.amount || 0,
        totalDues: totalDues._sum.dueAmount || 0,
        pendingAccounts,
      })
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

    if (type === "structure") {
      const tuitionFee = parseFloat(body.tuitionFee) || 0
      const examFee = parseFloat(body.examFee) || 0
      const libraryFee = parseFloat(body.libraryFee) || 0
      const labFee = parseFloat(body.labFee) || 0
      const sportsFee = parseFloat(body.sportsFee) || 0
      const hostelFee = body.hostelFee ? parseFloat(body.hostelFee) : null
      const transportFee = body.transportFee ? parseFloat(body.transportFee) : null
      const otherFees = parseFloat(body.otherFees) || 0

      const totalFee = tuitionFee + examFee + libraryFee + labFee + sportsFee + (hostelFee || 0) + (transportFee || 0) + otherFees

      const structure = await prisma.feeStructure.create({
        data: {
          programId: body.programId,
          name: body.name,
          semester: parseInt(body.semester),
          academicYear: body.academicYear,
          tuitionFee,
          examFee,
          libraryFee,
          labFee,
          sportsFee,
          hostelFee,
          transportFee,
          otherFees,
          totalFee,
          dueDate: body.dueDate ? new Date(body.dueDate) : null,
          lateFee: parseFloat(body.lateFee) || 0,
        },
        include: { program: true },
      })
      return NextResponse.json(structure)
    }

    if (type === "account") {
      const totalFee = parseFloat(body.totalFee)
      const paidAmount = parseFloat(body.paidAmount) || 0
      const dueAmount = totalFee - paidAmount
      let status = "UNPAID"
      if (paidAmount >= totalFee) status = "PAID"
      else if (paidAmount > 0) status = "PARTIAL"

      const account = await prisma.feeAccount.create({
        data: {
          studentId: body.studentId,
          feeStructureId: body.feeStructureId,
          totalFee,
          paidAmount,
          dueAmount,
          status,
          dueDate: body.dueDate ? new Date(body.dueDate) : null,
        },
        include: { student: true, feeStructure: { include: { program: true } } },
      })
      return NextResponse.json(account)
    }

    if (type === "payment") {
      const paymentCount = await prisma.payment.count()
      const receiptNo = `RCPT${String(paymentCount + 1).padStart(6, "0")}`

      const payment = await prisma.payment.create({
        data: {
          feeAccountId: body.feeAccountId,
          transactionId: body.transactionId || `TXN${Date.now()}`,
          amount: parseFloat(body.amount),
          method: body.method || "CASH",
          status: body.status || "COMPLETED",
          razorpayOrderId: body.razorpayOrderId,
          receiptNo,
          remarks: body.remarks,
        },
        include: { feeAccount: { include: { student: true, feeStructure: true } } },
      })

      const account = await prisma.feeAccount.findUnique({ where: { id: body.feeAccountId } })
      if (account && payment.status === "COMPLETED") {
        const newPaid = account.paidAmount + payment.amount
        const newDue = account.totalFee - newPaid
        let newStatus = "PARTIAL"
        if (newPaid >= account.totalFee) newStatus = "PAID"
        else if (newDue > 0 && account.dueDate && new Date() > account.dueDate) newStatus = "OVERDUE"
        await prisma.feeAccount.update({
          where: { id: body.feeAccountId },
          data: { paidAmount: newPaid, dueAmount: newDue, status: newStatus },
        })
      }

      return NextResponse.json(payment)
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

    if (type === "structure" && id) {
      const tuitionFee = parseFloat(body.tuitionFee) || 0
      const examFee = parseFloat(body.examFee) || 0
      const libraryFee = parseFloat(body.libraryFee) || 0
      const labFee = parseFloat(body.labFee) || 0
      const sportsFee = parseFloat(body.sportsFee) || 0
      const hostelFee = body.hostelFee ? parseFloat(body.hostelFee) : null
      const transportFee = body.transportFee ? parseFloat(body.transportFee) : null
      const otherFees = parseFloat(body.otherFees) || 0
      const totalFee = tuitionFee + examFee + libraryFee + labFee + sportsFee + (hostelFee || 0) + (transportFee || 0) + otherFees

      const structure = await prisma.feeStructure.update({
        where: { id },
        data: {
          name: body.name,
          programId: body.programId,
          semester: body.semester ? parseInt(body.semester) : undefined,
          academicYear: body.academicYear,
          tuitionFee,
          examFee,
          libraryFee,
          labFee,
          sportsFee,
          hostelFee,
          transportFee,
          otherFees,
          totalFee,
          dueDate: body.dueDate ? new Date(body.dueDate) : null,
          lateFee: body.lateFee ? parseFloat(body.lateFee) : undefined,
          isActive: body.isActive !== undefined ? body.isActive : undefined,
        },
        include: { program: true },
      })
      return NextResponse.json(structure)
    }

    if (type === "account" && id) {
      const account = await prisma.feeAccount.update({
        where: { id },
        data: {
          status: body.status,
          dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
        },
        include: { student: true, feeStructure: true },
      })
      return NextResponse.json(account)
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

    if (type === "structure") {
      await prisma.feeAccount.deleteMany({ where: { feeStructureId: id } })
      await prisma.feeStructure.delete({ where: { id } })
      return NextResponse.json({ message: "Fee structure deleted" })
    }
    if (type === "payment") {
      const payment = await prisma.payment.findUnique({ where: { id } })
      if (payment && payment.status === "COMPLETED") {
        const account = await prisma.feeAccount.findUnique({ where: { id: payment.feeAccountId } })
        if (account) {
          const newPaid = account.paidAmount - payment.amount
          const newDue = account.totalFee - newPaid
          const newStatus = newPaid <= 0 ? "UNPAID" : newPaid >= account.totalFee ? "PAID" : "PARTIAL"
          await prisma.feeAccount.update({
            where: { id: payment.feeAccountId },
            data: { paidAmount: newPaid, dueAmount: newDue, status: newStatus },
          })
        }
      }
      await prisma.payment.delete({ where: { id } })
      return NextResponse.json({ message: "Payment deleted" })
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 })
  }
}
