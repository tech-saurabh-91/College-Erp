import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get("type")

  try {
    if (type === "books") {
      const search = searchParams.get("search")
      const where: any = { isActive: true }
      if (search) {
        where.OR = [
          { title: { contains: search, mode: "insensitive" } },
          { author: { contains: search, mode: "insensitive" } },
          { isbn: { contains: search, mode: "insensitive" } },
        ]
      }
      const data = await prisma.book.findMany({ where, orderBy: { title: "asc" } })
      return NextResponse.json(data)
    }

    if (type === "issues") {
      const status = searchParams.get("status")
      const where: any = {}
      if (status) where.status = status
      const data = await prisma.bookIssue.findMany({
        where,
        include: { book: true, student: true },
        orderBy: { issueDate: "desc" },
      })
      return NextResponse.json(data)
    }

    if (type === "history") {
      const studentId = searchParams.get("studentId")
      const where: any = { status: "RETURNED" }
      if (studentId) where.studentId = studentId
      const data = await prisma.bookIssue.findMany({
        where,
        include: { book: true, student: true },
        orderBy: { returnDate: "desc" },
      })
      return NextResponse.json(data)
    }

    if (type === "fines") {
      const data = await prisma.bookIssue.findMany({
        where: { fine: { gt: 0 } },
        include: { book: true, student: true },
        orderBy: { createdAt: "desc" },
      })
      return NextResponse.json(data)
    }

    if (type === "students") {
      const data = await prisma.student.findMany({
        where: { status: "ACTIVE" },
        select: { id: true, rollNo: true, firstName: true, lastName: true },
        orderBy: { rollNo: "asc" },
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

    if (type === "book") {
      const book = await prisma.book.create({
        data: {
          isbn: body.isbn || null,
          title: body.title,
          author: body.author,
          publisher: body.publisher || null,
          edition: body.edition || null,
          year: body.year ? parseInt(body.year) : null,
          category: body.category,
          rackNo: body.rackNo || null,
          quantity: parseInt(body.quantity) || 1,
          available: parseInt(body.quantity) || 1,
          price: body.price ? parseFloat(body.price) : null,
          description: body.description || null,
        },
      })
      return NextResponse.json(book)
    }

    if (type === "issue") {
      const book = await prisma.book.findUnique({ where: { id: body.bookId } })
      if (!book || book.available < 1) {
        return NextResponse.json({ error: "Book not available" }, { status: 400 })
      }

      const maxDays = parseInt(body.maxDays) || 14
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + maxDays)

      const issue = await prisma.bookIssue.create({
        data: {
          bookId: body.bookId,
          studentId: body.studentId,
          issueDate: new Date(),
          dueDate,
          status: "ISSUED",
        },
        include: { book: true, student: true },
      })

      await prisma.book.update({ where: { id: body.bookId }, data: { available: book.available - 1 } })

      return NextResponse.json(issue)
    }

    if (type === "return") {
      const issue = await prisma.bookIssue.findUnique({
        where: { id: body.issueId },
        include: { book: true },
      })
      if (!issue) return NextResponse.json({ error: "Issue record not found" }, { status: 400 })

      const returnDate = new Date()
      const dueDate = new Date(issue.dueDate)
      let fine = 0

      if (returnDate > dueDate) {
        const diffDays = Math.ceil((returnDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
        fine = diffDays * (parseFloat(body.finePerDay) || 5)
      }

      const updated = await prisma.bookIssue.update({
        where: { id: body.issueId },
        data: {
          returnDate,
          status: fine > 0 ? "OVERDUE" : "RETURNED",
          fine,
          finePaid: fine === 0,
        },
        include: { book: true, student: true },
      })

      if (fine === 0) {
        await prisma.book.update({ where: { id: issue.bookId }, data: { available: issue.book.available + 1 } })
      }

      return NextResponse.json(updated)
    }

    if (type === "payfine") {
      const issue = await prisma.bookIssue.findUnique({ where: { id: body.issueId }, include: { book: true } })
      if (!issue) return NextResponse.json({ error: "Issue not found" }, { status: 400 })

      const updated = await prisma.bookIssue.update({
        where: { id: body.issueId },
        data: { finePaid: true, status: "RETURNED" },
        include: { book: true, student: true },
      })

      if (issue.book) {
        await prisma.book.update({ where: { id: issue.bookId }, data: { available: issue.book.available + 1 } })
      }

      return NextResponse.json(updated)
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

    if (type === "book" && id) {
      const oldBook = await prisma.book.findUnique({ where: { id } })
      const newQty = parseInt(body.quantity) || oldBook?.quantity || 1
      const diff = newQty - (oldBook?.quantity || 0)

      const book = await prisma.book.update({
        where: { id },
        data: {
          isbn: body.isbn,
          title: body.title,
          author: body.author,
          publisher: body.publisher,
          edition: body.edition,
          year: body.year ? parseInt(body.year) : undefined,
          category: body.category,
          rackNo: body.rackNo,
          quantity: newQty,
          available: (oldBook?.available || 0) + diff,
          price: body.price ? parseFloat(body.price) : undefined,
          description: body.description,
          isActive: body.isActive !== undefined ? body.isActive : undefined,
        },
      })
      return NextResponse.json(book)
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

    if (type === "book") {
      const issues = await prisma.bookIssue.count({ where: { bookId: id, status: "ISSUED" } })
      if (issues > 0) return NextResponse.json({ error: "Book has active issues" }, { status: 400 })
      await prisma.book.update({ where: { id }, data: { isActive: false } })
      return NextResponse.json({ message: "Book deleted" })
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 })
  }
}
