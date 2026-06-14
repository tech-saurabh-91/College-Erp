import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get("type")

  try {
    if (type === "alumni") {
      const data = await prisma.alumni.findMany({
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { graduationYear: "desc" },
      })
      return NextResponse.json(data)
    }

    if (type === "jobs") {
      const data = await prisma.jobBoard.findMany({
        where: { isActive: true },
        orderBy: { postedAt: "desc" },
      })
      return NextResponse.json(data)
    }

    if (type === "events") {
      const data = await prisma.alumniEvent.findMany({
        orderBy: { date: "desc" },
      })
      return NextResponse.json(data)
    }

    if (type === "donations") {
      const data = await prisma.alumniDonation.findMany({
        include: { alumni: { include: { user: { select: { id: true, name: true, email: true } } } } },
        orderBy: { date: "desc" },
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

    if (type === "job") {
      const job = await prisma.jobBoard.create({
        data: {
          company: body.company,
          title: body.title,
          description: body.description,
          location: body.location,
          salary: body.salary || null,
          contactEmail: body.contactEmail,
          expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
        },
      })
      return NextResponse.json(job)
    }

    if (type === "event") {
      const event = await prisma.alumniEvent.create({
        data: {
          title: body.title,
          description: body.description || null,
          date: new Date(body.date),
          venue: body.venue || null,
          type: body.type || "MEETUP",
          maxAttendees: body.maxAttendees ? parseInt(body.maxAttendees) : null,
        },
      })
      return NextResponse.json(event)
    }

    if (type === "donation") {
      const donation = await prisma.alumniDonation.create({
        data: {
          alumniId: body.alumniId,
          amount: parseFloat(body.amount),
          purpose: body.purpose || null,
          paymentMethod: body.paymentMethod || "ONLINE",
        },
        include: { alumni: { include: { user: { select: { id: true, name: true, email: true } } } } },
      })
      return NextResponse.json(donation)
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

    if (type === "job" && id) {
      const job = await prisma.jobBoard.update({
        where: { id },
        data: {
          company: body.company,
          title: body.title,
          description: body.description,
          location: body.location,
          salary: body.salary || null,
          contactEmail: body.contactEmail,
          expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
        },
      })
      return NextResponse.json(job)
    }

    if (type === "event" && id) {
      const event = await prisma.alumniEvent.update({
        where: { id },
        data: {
          title: body.title,
          description: body.description || null,
          date: new Date(body.date),
          venue: body.venue || null,
          type: body.type,
          maxAttendees: body.maxAttendees ? parseInt(body.maxAttendees) : null,
        },
      })
      return NextResponse.json(event)
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

    if (type === "job") {
      await prisma.jobBoard.update({ where: { id }, data: { isActive: false } })
      return NextResponse.json({ message: "Job deleted" })
    }

    if (type === "event") {
      await prisma.alumniEvent.delete({ where: { id } })
      return NextResponse.json({ message: "Event deleted" })
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 })
  }
}
