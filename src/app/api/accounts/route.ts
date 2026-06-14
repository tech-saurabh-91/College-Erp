import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get("type")

  try {
    if (type === "ledger") {
      const data = await prisma.ledgerAccount.findMany({ where: { isActive: true }, orderBy: { code: "asc" } })
      return NextResponse.json(data)
    }

    if (type === "voucher") {
      const data = await prisma.voucher.findMany({
        include: { entries: { include: { account: true } } },
        orderBy: { createdAt: "desc" },
      })
      return NextResponse.json(data)
    }

    if (type === "budget") {
      const data = await prisma.budgetPlan.findMany({ orderBy: { fiscalYear: "desc" } })
      return NextResponse.json(data)
    }

    if (type === "balance") {
      const assets = await prisma.ledgerAccount.aggregate({ _sum: { balance: true }, where: { type: "ASSET", isActive: true } })
      const liabilities = await prisma.ledgerAccount.aggregate({ _sum: { balance: true }, where: { type: "LIABILITY", isActive: true } })
      const income = await prisma.ledgerAccount.aggregate({ _sum: { balance: true }, where: { type: "INCOME", isActive: true } })
      const expense = await prisma.ledgerAccount.aggregate({ _sum: { balance: true }, where: { type: "EXPENSE", isActive: true } })
      const equity = await prisma.ledgerAccount.aggregate({ _sum: { balance: true }, where: { type: "EQUITY", isActive: true } })
      return NextResponse.json({
        totalAssets: assets._sum.balance || 0,
        totalLiabilities: liabilities._sum.balance || 0,
        totalIncome: income._sum.balance || 0,
        totalExpenses: expense._sum.balance || 0,
        totalEquity: equity._sum.balance || 0,
      })
    }

    if (type === "accounts") {
      const data = await prisma.ledgerAccount.findMany({ where: { isActive: true }, orderBy: { name: "asc" } })
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

    if (type === "ledger") {
      const account = await prisma.ledgerAccount.create({
        data: { code: body.code, name: body.name, type: body.type, balance: parseFloat(body.balance) || 0 },
      })
      return NextResponse.json(account)
    }

    if (type === "voucher") {
      const voucherCount = await prisma.voucher.count()
      const voucherNo = `${body.type?.substring(0, 3) || "VCH"}${String(voucherCount + 1).padStart(5, "0")}`

      const voucher = await prisma.voucher.create({
        data: {
          voucherNo,
          type: body.voucherType,
          date: body.date ? new Date(body.date) : new Date(),
          description: body.description,
          amount: parseFloat(body.amount),
          status: "POSTED",
          createdBy: body.createdBy || "admin",
          entries: {
            create: body.entries?.map((e: any) => ({
              accountId: e.accountId,
              debit: parseFloat(e.debit) || 0,
              credit: parseFloat(e.credit) || 0,
              narration: e.narration,
            })) || [],
          },
        },
        include: { entries: { include: { account: true } } },
      })

      for (const entry of body.entries || []) {
        const account = await prisma.ledgerAccount.findUnique({ where: { id: entry.accountId } })
        if (account) {
          const newBalance = account.balance + (parseFloat(entry.debit) || 0) - (parseFloat(entry.credit) || 0)
          await prisma.ledgerAccount.update({ where: { id: entry.accountId }, data: { balance: newBalance } })
        }
      }

      return NextResponse.json(voucher)
    }

    if (type === "budget") {
      const budget = await prisma.budgetPlan.create({
        data: {
          fiscalYear: body.fiscalYear,
          category: body.category,
          allocated: parseFloat(body.allocated),
          spent: parseFloat(body.spent) || 0,
          description: body.description,
        },
      })
      return NextResponse.json(budget)
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

    if (type === "ledger" && id) {
      const account = await prisma.ledgerAccount.update({
        where: { id },
        data: {
          code: body.code,
          name: body.name,
          type: body.type,
          balance: body.balance !== undefined ? parseFloat(body.balance) : undefined,
          isActive: body.isActive !== undefined ? body.isActive : undefined,
        },
      })
      return NextResponse.json(account)
    }

    if (type === "budget" && id) {
      const budget = await prisma.budgetPlan.update({
        where: { id },
        data: {
          allocated: body.allocated !== undefined ? parseFloat(body.allocated) : undefined,
          spent: body.spent !== undefined ? parseFloat(body.spent) : undefined,
          description: body.description,
        },
      })
      return NextResponse.json(budget)
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

    if (type === "ledger") {
      await prisma.voucherEntry.deleteMany({ where: { accountId: id } })
      await prisma.ledgerAccount.delete({ where: { id } })
      return NextResponse.json({ message: "Account deleted" })
    }

    if (type === "voucher") {
      const voucher = await prisma.voucher.findUnique({ where: { id }, include: { entries: true } })
      if (voucher) {
        for (const entry of voucher.entries) {
          const account = await prisma.ledgerAccount.findUnique({ where: { id: entry.accountId } })
          if (account) {
            const newBalance = account.balance - entry.debit + entry.credit
            await prisma.ledgerAccount.update({ where: { id: entry.accountId }, data: { balance: newBalance } })
          }
        }
        await prisma.voucherEntry.deleteMany({ where: { voucherId: id } })
        await prisma.voucher.delete({ where: { id } })
      }
      return NextResponse.json({ message: "Voucher deleted" })
    }

    if (type === "budget") {
      await prisma.budgetPlan.delete({ where: { id } })
      return NextResponse.json({ message: "Budget plan deleted" })
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 })
  }
}
