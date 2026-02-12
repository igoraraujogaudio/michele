'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import type { Veiculo } from '@/lib/types/database.types';

interface VeiculoSearchBoxProps {
  veiculos: Veiculo[];
  value: string;
  onChange: (veiculoId: string) => void;
  onVeiculoSelect?: (veiculo: Veiculo | null) => void;
  placeholder?: string;
  required?: boolean;
}

export default function VeiculoSearchBox({
  veiculos,
  value,
  onChange,
  onVeiculoSelect,
  placeholder = 'Buscar veículo por prefixo, placa ou modelo...',
  required = false,
}: VeiculoSearchBoxProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedVeiculo, setSelectedVeiculo] = useState<Veiculo | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Atualizar veículo selecionado quando value mudar
  useEffect(() => {
    if (value) {
      const veiculo = veiculos.find(v => v.id === value);
      setSelectedVeiculo(veiculo || null);
      if (veiculo) {
        setSearchTerm('');
      }
    } else {
      setSelectedVeiculo(null);
      setSearchTerm('');
    }
  }, [value, veiculos]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtrar veículos baseado no termo de busca
  const veiculosFiltrados = veiculos.filter((veiculo) => {
    const term = searchTerm.toLowerCase();
    return (
      veiculo.prefixo?.nome?.toLowerCase().includes(term) ||
      veiculo.placa.toLowerCase().includes(term) ||
      veiculo.modelo?.toLowerCase().includes(term)
    );
  });

  const handleSelect = (veiculo: Veiculo) => {
    setSelectedVeiculo(veiculo);
    onChange(veiculo.id);
    if (onVeiculoSelect) {
      onVeiculoSelect(veiculo);
    }
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleClear = () => {
    setSelectedVeiculo(null);
    onChange('');
    if (onVeiculoSelect) {
      onVeiculoSelect(null);
    }
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setIsOpen(true);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  return (
    <div ref={wrapperRef} className="relative">
      {selectedVeiculo ? (
        // Veículo selecionado - mostrar card
        <div className="flex items-center justify-between p-3 border border-blue-500 bg-blue-50 rounded-md">
          <div className="flex-1">
            <div className="font-semibold text-blue-900">
              {selectedVeiculo.prefixo?.nome || 'Sem prefixo'} - {selectedVeiculo.placa}
            </div>
            {selectedVeiculo.modelo && (
              <div className="text-sm text-blue-700">{selectedVeiculo.modelo}</div>
            )}
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="ml-2 p-1 hover:bg-blue-200 rounded-full transition-colors"
            aria-label="Limpar seleção"
          >
            <X className="w-5 h-5 text-blue-700" />
          </button>
        </div>
      ) : (
        // Input de busca
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            placeholder={placeholder}
            required={required}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
          />
        </div>
      )}

      {/* Dropdown de resultados */}
      {isOpen && !selectedVeiculo && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {veiculosFiltrados.length > 0 ? (
            <ul>
              {veiculosFiltrados.map((veiculo) => (
                <li key={veiculo.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(veiculo)}
                    className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                  >
                    <div className="font-medium text-gray-900">
                      {veiculo.prefixo?.nome || 'Sem prefixo'} - {veiculo.placa}
                    </div>
                    {veiculo.modelo && (
                      <div className="text-sm text-gray-600">{veiculo.modelo}</div>
                    )}
                    {veiculo.local_trabalho?.nome && (
                      <div className="text-xs text-gray-500 mt-1">
                        Local: {veiculo.local_trabalho.nome}
                      </div>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-3 text-center text-gray-500">
              {searchTerm ? 'Nenhum veículo encontrado' : 'Digite para buscar veículos'}
            </div>
          )}
        </div>
      )}

      {/* Input hidden para validação de formulário */}
      <input type="hidden" name="veiculo_id" value={value} required={required} />
    </div>
  );
}
