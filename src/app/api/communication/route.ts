import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get("type")

  try {
    if (type === "broadcast") {
      const data = await prisma.broadcast.findMany({ orderBy: { createdAt: "desc" } })
      return NextResponse.json(data)
    }

    if (type === "notifications") {
      const data = await prisma.notification.findMany({
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "desc" },
      })
      return NextResponse.json(data)
    }

    if (type === "messages") {
      const data = await prisma.message.findMany({
        include: {
          fromUser: { select: { id: true, name: true, email: true } },
          toUser: { select: { id: true, name: true, email: true } },
        },
        orderBy: { sentAt: "desc" },
      })
      return NextResponse.json(data)
    }

    if (type === "users") {
      const data = await prisma.user.findMany({
        where: { isActive: true },
        select: { id: true, name: true, email: true, role: true },
        orderBy: { name: "asc" },
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

    if (type === "broadcast") {
      const broadcast = await prisma.broadcast.create({
        data: {
          title: body.title,
          message: body.message,
          type: body.type || "NOTICE",
          audience: body.audience || "ALL",
          status: body.status || "DRAFT",
          sentAt: body.status === "SENT" ? new Date() : null,
        },
      })
      return NextResponse.json(broadcast)
    }

    if (type === "message") {
      const message = await prisma.message.create({
        data: {
          fromUserId: body.fromUserId || "system",
          toUserId: body.toUserId,
          subject: body.subject || null,
          body: body.body,
        },
        include: {
          fromUser: { select: { id: true, name: true, email: true } },
          toUser: { select: { id: true, name: true, email: true } },
        },
      })
      return NextResponse.json(message)
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

    if (type === "broadcast" && id) {
      const broadcast = await prisma.broadcast.update({
        where: { id },
        data: {
          title: body.title,
          message: body.message,
          type: body.type,
          audience: body.audience,
          status: body.status || "DRAFT",
          sentAt: body.status === "SENT" ? new Date() : undefined,
        },
      })
      return NextResponse.json(broadcast)
    }

    if (type === "notification" && id) {
      const notification = await prisma.notification.update({
        where: { id },
        data: { isRead: true },
      })
      return NextResponse.json(notification)
    }

    if (type === "message" && id) {
      const message = await prisma.message.update({
        where: { id },
        data: { isRead: true, readAt: new Date() },
        include: {
          fromUser: { select: { id: true, name: true, email: true } },
          toUser: { select: { id: true, name: true, email: true } },
        },
      })
      return NextResponse.json(message)
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

    if (type === "broadcast") {
      await prisma.broadcast.delete({ where: { id } })
      return NextResponse.json({ message: "Broadcast deleted" })
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 })
  }
}
