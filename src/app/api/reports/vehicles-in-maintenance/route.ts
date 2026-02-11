import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { VehicleService } from '@/lib/services/vehicle.service'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const vehicleService = new VehicleService(supabase)
    const vehicles = await vehicleService.getVehiclesInMaintenance()

    return NextResponse.json(vehicles)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
