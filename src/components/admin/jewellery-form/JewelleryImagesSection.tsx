import React from 'react';
import { Upload, X, ExternalLink } from 'lucide-react';

interface JewelleryImagesSectionProps {
  selectedImages: File[];
  setSelectedImages: (images: File[]) => void;
  currentImages: string[];
  setCurrentImages: (images: string[]) => void;
  imagesToDelete: string[];
  setImagesToDelete: (images: string[]) => void;
  uploading: boolean;
}

export function JewelleryImagesSection({
  selectedImages,
  setSelectedImages,
  currentImages,
  setCurrentImages,
  imagesToDelete,
  setImagesToDelete,
  uploading
}: JewelleryImagesSectionProps) {
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileArray = Array.from(files);
      setSelectedImages(fileArray);
    }
  };

  const removeNewImage = (index: number) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
  };

  const removeCurrentImage = (imageUrl: string) => {
    setCurrentImages(currentImages.filter(url => url !== imageUrl));
    setImagesToDelete([...imagesToDelete, imageUrl]);
  };

  const restoreImage = (imageUrl: string) => {
    setImagesToDelete(imagesToDelete.filter(url => url !== imageUrl));
    setCurrentImages([...currentImages, imageUrl]);
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-gray-800">
        Jewellery Images
      </label>
      
      {/* Current Images Gallery */}
      {(currentImages.length > 0 || imagesToDelete.length > 0) && (
        <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-2">
          {/* Active current images */}
          {currentImages.map((imageUrl, index) => (
            <div key={`current-${index}`} className="relative group">
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                <img src={imageUrl} alt={`Current ${index + 1}`} className="w-full h-full object-cover" />
              </div>
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-2">
                  <button type="button" onClick={() => window.open(imageUrl, '_blank')} className="bg-white text-gray-700 p-1.5 rounded-full hover:bg-gray-100">
                    <ExternalLink className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => removeCurrentImage(imageUrl)} className="bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600" disabled={uploading}>
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {/* Images marked for deletion */}
          {imagesToDelete.map((imageUrl, index) => (
            <div key={`deleted-${index}`} className="relative group">
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden opacity-40 border border-red-200">
                <img src={imageUrl} alt={`Deleted ${index + 1}`} className="w-full h-full object-cover grayscale" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <button type="button" onClick={() => restoreImage(imageUrl)} className="bg-blue-500 text-white px-2 py-1 rounded-full hover:bg-blue-600 text-xs shadow-md" disabled={uploading}>
                  Restore
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload New Images Dropzone */}
      <div className="flex items-center justify-center w-full">
        <label className={`flex flex-col items-center justify-center w-full h-20 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
          <div className="flex items-center justify-center space-x-2">
            <Upload className="w-5 h-5 text-gray-500" />
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-gray-700">Click to upload</span> <span className="hidden sm:inline">or drag and drop</span>
            </p>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">PNG, JPG up to 10MB</p>
          <input type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" disabled={uploading} />
        </label>
      </div>

      {/* Display selected new images */}
      {selectedImages.length > 0 && (
        <div className="grid grid-cols-3 md:grid-cols-5 gap-3 pt-2">
          {selectedImages.map((file, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-green-200">
                <img src={URL.createObjectURL(file)} alt={`New ${index + 1}`} className="w-full h-full object-cover" />
              </div>
              <button type="button" onClick={() => removeNewImage(index)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 shadow-md" disabled={uploading}>
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}