import React from 'react';
import { X } from 'lucide-react';

interface ImagePreviewModalProps {
  previewImage: string | null;
  setPreviewImage: (image: string | null) => void;
}

export function ImagePreviewModal({ previewImage, setPreviewImage }: ImagePreviewModalProps) {
  if (!previewImage) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60 p-4">
      <div className="relative max-w-4xl max-h-full">
        <button
          onClick={() => setPreviewImage(null)}
          className="absolute top-4 right-4 bg-white text-gray-700 p-2 rounded-full hover:bg-gray-100 z-10"
        >
          <X className="h-6 w-6" />
        </button>
        <img
          src={previewImage}
          alt="Preview"
          className="max-w-full max-h-full object-contain rounded-lg"
        />
      </div>
    </div>
  );
}