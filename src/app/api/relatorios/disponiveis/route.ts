import { NextResponse } from 'next/server';
import { getVeiculosDisponiveis } from '@/lib/actions/relatorios.actions';

export async function GET() {
  try {
    const resultado = await getVeiculosDisponiveis();

    if (!resultado.success || !resultado.data) {
      return NextResponse.json(
        { error: resultado.error || 'Erro ao buscar dados' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      veiculos: resultado.data,
      total: resultado.data.length,
    });
  } catch (error) {
    console.error('Erro ao buscar veículos disponíveis:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar veículos disponíveis' },
      { status: 500 }
    );
  }
}
