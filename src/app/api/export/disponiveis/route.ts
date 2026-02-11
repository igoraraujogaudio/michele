import { exportVeiculosDisponiveisToExcel } from '@/lib/actions/export.actions';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const filtroLocal = searchParams.get('local') || undefined;

  const resultado = await exportVeiculosDisponiveisToExcel(filtroLocal);

  if (!resultado.success || !resultado.data) {
    return NextResponse.json(
      { error: resultado.error },
      { status: 500 }
    );
  }

  return new NextResponse(new Uint8Array(resultado.data), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="veiculos_disponiveis.xlsx"',
    },
  });
}
