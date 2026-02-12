'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X, Trash2, ZoomIn } from 'lucide-react';
import { deleteEvidencia, type EvidenciaManutencao } from '@/lib/actions/evidencias.actions';
import { Button } from '@/components/ui/Button';

interface EvidenciasGalleryProps {
  evidencias: EvidenciaManutencao[];
  onDelete?: () => void;
  readOnly?: boolean;
}

export default function EvidenciasGallery({ evidencias, onDelete, readOnly = false }: EvidenciasGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<EvidenciaManutencao | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (evidenciaId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta evidência?')) {
      return;
    }

    setDeleting(evidenciaId);
    const result = await deleteEvidencia(evidenciaId);
    
    if (result.success) {
      if (onDelete) onDelete();
    } else {
      alert(result.error || 'Erro ao deletar evidência');
    }
    setDeleting(null);
  };

  if (evidencias.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Nenhuma foto de evidência adicionada</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {evidencias.map((evidencia) => (
          <div key={evidencia.id} className="relative group">
            {/* Imagem */}
            <div 
              className="aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-300 cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => setSelectedImage(evidencia)}
            >
              <Image
                src={evidencia.arquivo_url}
                alt={evidencia.descricao || evidencia.arquivo_nome}
                className="w-full h-full object-cover"
                fill
                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
              
              {/* Overlay com ícone de zoom */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>

            {/* Botão Deletar */}
            {!readOnly && (
              <button
                type="button"
                onClick={() => handleDelete(evidencia.id)}
                disabled={deleting === evidencia.id}
                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg disabled:opacity-50"
                aria-label="Deletar evidência"
              >
                {deleting === evidencia.id ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
            )}

            {/* Descrição */}
            {evidencia.descricao && (
              <div className="mt-2 text-xs text-gray-600 line-clamp-2">
                {evidencia.descricao}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal de Visualização */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="max-w-6xl max-h-[90vh] flex flex-col">
            <div className="relative w-full h-[80vh]">
              <Image
                src={selectedImage.arquivo_url}
                alt={selectedImage.descricao || selectedImage.arquivo_nome}
                className="object-contain rounded-lg"
                fill
                sizes="90vw"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            
            {selectedImage.descricao && (
              <div className="mt-4 p-4 bg-white rounded-lg">
                <p className="text-sm text-gray-900">{selectedImage.descricao}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
