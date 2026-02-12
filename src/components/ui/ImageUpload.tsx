'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from './Button';

interface ImageFile {
  file: File;
  preview: string;
  descricao?: string;
}

interface ImageUploadProps {
  onImagesChange: (images: ImageFile[]) => void;
  maxImages?: number;
  maxSizeMB?: number;
}

export default function ImageUpload({ 
  onImagesChange, 
  maxImages = 10,
  maxSizeMB = 5 
}: ImageUploadProps) {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setError(null);

    // Validar número de imagens
    if (images.length + files.length > maxImages) {
      setError(`Máximo de ${maxImages} imagens permitidas`);
      return;
    }

    // Validar e processar cada arquivo
    const newImages: ImageFile[] = [];
    
    for (const file of files) {
      // Validar tipo
      if (!file.type.startsWith('image/')) {
        setError(`${file.name} não é uma imagem válida`);
        continue;
      }

      // Validar tamanho
      const sizeMB = file.size / (1024 * 1024);
      if (sizeMB > maxSizeMB) {
        setError(`${file.name} excede o tamanho máximo de ${maxSizeMB}MB`);
        continue;
      }

      // Criar preview
      const preview = URL.createObjectURL(file);
      newImages.push({ file, preview });
    }

    const updatedImages = [...images, ...newImages];
    setImages(updatedImages);
    onImagesChange(updatedImages);

    // Limpar input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemove = (index: number) => {
    const imageToRemove = images[index];
    URL.revokeObjectURL(imageToRemove.preview);
    
    const updatedImages = images.filter((_, i) => i !== index);
    setImages(updatedImages);
    onImagesChange(updatedImages);
  };

  const handleDescricaoChange = (index: number, descricao: string) => {
    const updatedImages = images.map((img, i) => 
      i === index ? { ...img, descricao } : img
    );
    setImages(updatedImages);
    onImagesChange(updatedImages);
  };

  return (
    <div className="space-y-4">
      {/* Botão de Upload */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        <Button
          type="button"
          variant="secondary"
          onClick={() => fileInputRef.current?.click()}
          disabled={images.length >= maxImages}
          className="w-full flex items-center justify-center gap-2"
        >
          <Upload className="w-4 h-4" />
          Adicionar Fotos ({images.length}/{maxImages})
        </Button>
        <p className="text-xs text-gray-500 mt-1">
          Formatos aceitos: JPG, PNG, GIF. Tamanho máximo: {maxSizeMB}MB por imagem
        </p>
      </div>

      {/* Mensagem de Erro */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Grid de Imagens */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              {/* Preview da Imagem */}
              <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-300 relative">
                <Image
                  src={image.preview}
                  alt={`Preview ${index + 1}`}
                  className="object-cover"
                  fill
                  sizes="(max-width: 768px) 50vw, 33vw"
                />
              </div>

              {/* Botão Remover */}
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                aria-label="Remover imagem"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Campo de Descrição */}
              <div className="mt-2">
                <input
                  type="text"
                  placeholder="Descrição (opcional)"
                  value={image.descricao || ''}
                  onChange={(e) => handleDescricaoChange(index, e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Info do Arquivo */}
              <div className="mt-1 text-xs text-gray-500 truncate">
                {image.file.name}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mensagem quando não há imagens */}
      {images.length === 0 && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-sm text-gray-500">
            Nenhuma foto adicionada ainda
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Clique no botão acima para adicionar fotos de evidência
          </p>
        </div>
      )}
    </div>
  );
}
