import { NextRequest, NextResponse } from 'next/server';
import { getVeiculosEmManutencao } from '@/lib/actions/relatorios.actions';
import { gerarBufferExcelVeiculosEmManutencao } from '@/lib/utils/excel.utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') as any;
    const nivel_alerta = searchParams.get('nivel_alerta');
    const is_reserva = searchParams.get('is_reserva');

    const filtros = {
      status: status || undefined,
      nivel_alerta: nivel_alerta ? parseInt(nivel_alerta) : undefined,
      is_reserva: is_reserva === 'true' ? true : is_reserva === 'false' ? false : undefined,
    };

    const resultado = await getVeiculosEmManutencao(filtros);

    if (!resultado.success || !resultado.data) {
      return NextResponse.json(
        { error: resultado.error || 'Erro ao buscar dados' },
        { status: 500 }
      );
    }

    const buffer = gerarBufferExcelVeiculosEmManutencao(resultado.data);

    const dataHora = format(new Date(), 'yyyy-MM-dd_HH-mm-ss', { locale: ptBR });
    const nomeArquivo = `veiculos_em_manutencao_${dataHora}.xlsx`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${nomeArquivo}"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Erro ao exportar veículos em manutenção:', error);
    return NextResponse.json(
      { error: 'Erro ao exportar relatório' },
      { status: 500 }
    );
  }
}
