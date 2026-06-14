import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get("type")

  try {
    if (type === "hostels") {
      const data = await prisma.hostel.findMany({ include: { rooms: true }, orderBy: { name: "asc" } })
      return NextResponse.json(data)
    }

    if (type === "rooms") {
      const hostelId = searchParams.get("hostelId")
      const where: any = { isActive: true }
      if (hostelId) where.hostelId = hostelId
      const data = await prisma.hostelRoom.findMany({
        where,
        include: { hostel: true, allocations: { where: { status: "ACTIVE" }, include: { student: true } } },
        orderBy: { roomNo: "asc" },
      })
      return NextResponse.json(data)
    }

    if (type === "allocations") {
      const status = searchParams.get("status")
      const where: any = {}
      if (status) where.status = status
      const data = await prisma.hostelAllocation.findMany({
        where,
        include: { student: true, room: { include: { hostel: true } } },
        orderBy: { createdAt: "desc" },
      })
      return NextResponse.json(data)
    }

    if (type === "mess") {
      const hostelId = searchParams.get("hostelId")
      const where: any = {}
      if (hostelId) where.hostelId = hostelId
      const data = await prisma.messMenu.findMany({ where, orderBy: [{ day: "asc" }, { meal: "asc" }] })
      return NextResponse.json(data)
    }

    if (type === "visitors") {
      const data = await prisma.visitor.findMany({
        include: { student: true },
        orderBy: { entryTime: "desc" },
      })
      return NextResponse.json(data)
    }

    if (type === "students") {
      const data = await prisma.student.findMany({
        where: { status: "ACTIVE" },
        select: { id: true, rollNo: true, firstName: true, lastName: true, programId: true },
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

    if (type === "hostel") {
      const hostel = await prisma.hostel.create({
        data: { name: body.name, type: body.type, address: body.address, phone: body.phone, totalRooms: parseInt(body.totalRooms) || 0 },
        include: { rooms: true },
      })
      return NextResponse.json(hostel)
    }

    if (type === "room") {
      const room = await prisma.hostelRoom.create({
        data: {
          hostelId: body.hostelId,
          roomNo: body.roomNo,
          type: body.type,
          capacity: parseInt(body.capacity),
          rent: parseFloat(body.rent),
          floor: body.floor ? parseInt(body.floor) : null,
        },
        include: { hostel: true },
      })

      await prisma.hostel.update({ where: { id: body.hostelId }, data: { totalRooms: { increment: 1 } } })

      return NextResponse.json(room)
    }

    if (type === "allocate") {
      const existing = await prisma.hostelAllocation.findUnique({ where: { studentId: body.studentId } })
      if (existing && existing.status === "ACTIVE") {
        return NextResponse.json({ error: "Student already allocated" }, { status: 400 })
      }

      const room = await prisma.hostelRoom.findUnique({ where: { id: body.roomId } })
      if (!room || room.occupied >= room.capacity) {
        return NextResponse.json({ error: "Room is full" }, { status: 400 })
      }

      const allocation = await prisma.hostelAllocation.create({
        data: { studentId: body.studentId, roomId: body.roomId, startDate: new Date(), status: "ACTIVE" },
        include: { student: true, room: { include: { hostel: true } } },
      })

      await prisma.hostelRoom.update({ where: { id: body.roomId }, data: { occupied: room.occupied + 1 } })

      return NextResponse.json(allocation)
    }

    if (type === "deallocate") {
      const allocation = await prisma.hostelAllocation.findUnique({
        where: { id: body.allocationId },
        include: { room: true },
      })
      if (!allocation) return NextResponse.json({ error: "Allocation not found" }, { status: 400 })

      const updated = await prisma.hostelAllocation.update({
        where: { id: body.allocationId },
        data: { status: "COMPLETED", endDate: new Date() },
        include: { student: true, room: { include: { hostel: true } } },
      })

      await prisma.hostelRoom.update({
        where: { id: allocation.roomId },
        data: { occupied: Math.max(0, allocation.room.occupied - 1) },
      })

      return NextResponse.json(updated)
    }

    if (type === "mess") {
      const menu = await prisma.messMenu.create({
        data: { day: body.day, meal: body.meal, items: body.items, hostelId: body.hostelId },
      })
      return NextResponse.json(menu)
    }

    if (type === "visitor") {
      const visitor = await prisma.visitor.create({
        data: {
          studentId: body.studentId,
          visitorName: body.visitorName,
          relation: body.relation,
          phone: body.phone,
          purpose: body.purpose,
        },
        include: { student: true },
      })
      return NextResponse.json(visitor)
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

    if (type === "room" && id) {
      const room = await prisma.hostelRoom.update({
        where: { id },
        data: {
          roomNo: body.roomNo,
          type: body.type,
          capacity: body.capacity ? parseInt(body.capacity) : undefined,
          rent: body.rent ? parseFloat(body.rent) : undefined,
          floor: body.floor ? parseInt(body.floor) : undefined,
          isActive: body.isActive !== undefined ? body.isActive : undefined,
        },
        include: { hostel: true },
      })
      return NextResponse.json(room)
    }

    if (type === "mess" && id) {
      const menu = await prisma.messMenu.update({
        where: { id },
        data: { day: body.day, meal: body.meal, items: body.items },
      })
      return NextResponse.json(menu)
    }

    if (type === "visitor" && id) {
      const visitor = await prisma.visitor.update({
        where: { id },
        data: { exitTime: new Date() },
        include: { student: true },
      })
      return NextResponse.json(visitor)
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

    if (type === "room") {
      await prisma.hostelAllocation.deleteMany({ where: { roomId: id, status: "ACTIVE" } })
      await prisma.hostelRoom.update({ where: { id }, data: { isActive: false } })
      return NextResponse.json({ message: "Room deleted" })
    }

    if (type === "mess") {
      await prisma.messMenu.delete({ where: { id } })
      return NextResponse.json({ message: "Menu item deleted" })
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 })
  }
}
