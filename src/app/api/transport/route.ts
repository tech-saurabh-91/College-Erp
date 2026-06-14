import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get("type")

  try {
    if (type === "routes") {
      const data = await prisma.transportRoute.findMany({
        include: { vehicles: { include: { driver: true } } },
        orderBy: { name: "asc" },
      })
      return NextResponse.json(data)
    }

    if (type === "vehicles") {
      const data = await prisma.transportVehicle.findMany({
        include: { route: true, driver: true },
        orderBy: { vehicleNo: "asc" },
      })
      return NextResponse.json(data)
    }

    if (type === "drivers") {
      const data = await prisma.transportDriver.findMany({
        include: { vehicles: true },
        orderBy: { name: "asc" },
      })
      return NextResponse.json(data)
    }

    if (type === "passes") {
      const data = await prisma.transportPass.findMany({
        include: { student: true, route: true },
        orderBy: { issueDate: "desc" },
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

    if (type === "route") {
      const route = await prisma.transportRoute.create({
        data: {
          name: body.name,
          startPoint: body.startPoint,
          endPoint: body.endPoint,
          distance: body.distance ? parseFloat(body.distance) : null,
          fee: parseFloat(body.fee),
          capacity: parseInt(body.capacity),
        },
      })
      return NextResponse.json(route)
    }

    if (type === "vehicle") {
      const vehicle = await prisma.transportVehicle.create({
        data: {
          routeId: body.routeId,
          vehicleNo: body.vehicleNo,
          type: body.type,
          capacity: parseInt(body.capacity),
          driverId: body.driverId || null,
        },
        include: { route: true, driver: true },
      })
      return NextResponse.json(vehicle)
    }

    if (type === "driver") {
      const driver = await prisma.transportDriver.create({
        data: {
          name: body.name,
          phone: body.phone,
          licenseNo: body.licenseNo,
          address: body.address,
        },
      })
      return NextResponse.json(driver)
    }

    if (type === "pass") {
      const existing = await prisma.transportPass.findUnique({ where: { studentId: body.studentId } })
      if (existing && existing.status === "ACTIVE") {
        return NextResponse.json({ error: "Student already has an active pass" }, { status: 400 })
      }

      const pass = await prisma.transportPass.create({
        data: {
          studentId: body.studentId,
          routeId: body.routeId,
          amount: parseFloat(body.amount),
          issueDate: new Date(),
          expiryDate: new Date(body.expiryDate),
          status: "ACTIVE",
        },
        include: { student: true, route: true },
      })
      return NextResponse.json(pass)
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

    if (type === "route" && id) {
      const route = await prisma.transportRoute.update({
        where: { id },
        data: {
          name: body.name,
          startPoint: body.startPoint,
          endPoint: body.endPoint,
          distance: body.distance ? parseFloat(body.distance) : undefined,
          fee: body.fee ? parseFloat(body.fee) : undefined,
          capacity: body.capacity ? parseInt(body.capacity) : undefined,
        },
      })
      return NextResponse.json(route)
    }

    if (type === "vehicle" && id) {
      const vehicle = await prisma.transportVehicle.update({
        where: { id },
        data: {
          routeId: body.routeId,
          vehicleNo: body.vehicleNo,
          type: body.type,
          capacity: body.capacity ? parseInt(body.capacity) : undefined,
          driverId: body.driverId || null,
        },
        include: { route: true, driver: true },
      })
      return NextResponse.json(vehicle)
    }

    if (type === "driver" && id) {
      const driver = await prisma.transportDriver.update({
        where: { id },
        data: {
          name: body.name,
          phone: body.phone,
          licenseNo: body.licenseNo,
          address: body.address,
        },
      })
      return NextResponse.json(driver)
    }

    if (type === "cancelPass" && id) {
      const pass = await prisma.transportPass.update({
        where: { id },
        data: { status: "CANCELLED" },
        include: { student: true, route: true },
      })
      return NextResponse.json(pass)
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

    if (type === "route") {
      await prisma.transportVehicle.updateMany({ where: { routeId: id }, data: { isActive: false } })
      await prisma.transportRoute.update({ where: { id }, data: { isActive: false } })
      return NextResponse.json({ message: "Route deleted" })
    }

    if (type === "vehicle") {
      await prisma.transportVehicle.update({ where: { id }, data: { isActive: false } })
      return NextResponse.json({ message: "Vehicle deleted" })
    }

    if (type === "driver") {
      await prisma.transportDriver.update({ where: { id }, data: { isActive: false } })
      return NextResponse.json({ message: "Driver deleted" })
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 })
  }
}
