import { exportVeiculosEmManutencaoToExcel } from '@/lib/actions/export.actions';
import { NextResponse } from 'next/server';

export async function GET() {
  const resultado = await exportVeiculosEmManutencaoToExcel();

  if (!resultado.success || !resultado.data) {
    return NextResponse.json(
      { error: resultado.error },
      { status: 500 }
    );
  }

  return new NextResponse(resultado.data, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="veiculos_em_manutencao.xlsx"',
    },
  });
}
