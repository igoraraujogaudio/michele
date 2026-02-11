import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { VehicleService } from '@/lib/services/vehicle.service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const vehicleService = new VehicleService(supabase)
    const vehicle = await vehicleService.findById(id)

    if (!vehicle) {
      return NextResponse.json({ error: 'Veículo não encontrado' }, { status: 404 })
    }

    return NextResponse.json(vehicle)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const vehicleService = new VehicleService(supabase)

    if (body.plate) {
      const isPlateUnique = await vehicleService.validatePlateUniqueness(body.plate, id)
      if (!isPlateUnique) {
        return NextResponse.json({ error: 'Placa já cadastrada' }, { status: 400 })
      }
    }

    const vehicle = await vehicleService.update(id, body)
    return NextResponse.json(vehicle)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const vehicleService = new VehicleService(supabase)
    await vehicleService.delete(id)

    return NextResponse.json({ message: 'Veículo excluído com sucesso' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
