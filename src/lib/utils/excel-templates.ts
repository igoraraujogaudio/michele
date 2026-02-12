import * as XLSX from 'xlsx';

export function gerarTemplatePrefixos() {
  const ws = XLSX.utils.aoa_to_sheet([
    ['NOME', 'DESCRIÇÃO'],
    ['V001', 'Prefixo padrão 1'],
    ['V002', 'Prefixo padrão 2'],
    ['V003', 'Prefixo padrão 3'],
  ]);
  
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Prefixos');
  
  return XLSX.write(wb, { type: 'buffer' });
}

export function gerarTemplateLocais() {
  const ws = XLSX.utils.aoa_to_sheet([
    ['NOME', 'DESCRIÇÃO'],
    ['SEDE', 'Sede principal'],
    ['FILIAL 1', 'Filial norte'],
    ['FILIAL 2', 'Filial sul'],
  ]);
  
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Locais');
  
  return XLSX.write(wb, { type: 'buffer' });
}

export function gerarTemplateVeiculos() {
  const ws = XLSX.utils.aoa_to_sheet([
    ['PLACA', 'MODELO', 'PREFIXO', 'LOCAL', 'GERENCIA', 'MOTORISTA', 'TELEFONE'],
    ['ABC1234', 'FIAT UNO', 'V001', 'SEDE', 'DIR', 'JOÃO DA SILVA', '(11) 98765-4321'],
    ['DEF5678', 'VW GOL', 'V002', 'FILIAL 1', 'UGU', 'MARIA SANTOS', '(11) 91234-5678'],
    ['GHI9012', 'CHEVET ONIX', 'V003', 'FILIAL 2', 'LDS', 'PEDRO COSTA', '(11) 92345-6789'],
  ]);
  
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Veiculos');
  
  return XLSX.write(wb, { type: 'buffer' });
}
