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
    // Read directly from the selectedImages prop instead of using 'prev'
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
  };

  const removeCurrentImage = (imageUrl: string) => {
    // Read directly from the currentImages and imagesToDelete props
    setCurrentImages(currentImages.filter(url => url !== imageUrl));
    setImagesToDelete([...imagesToDelete, imageUrl]);
  };

  const restoreImage = (imageUrl: string) => {
    // Read directly from the currentImages and imagesToDelete props
    setImagesToDelete(imagesToDelete.filter(url => url !== imageUrl));
    setCurrentImages([...currentImages, imageUrl]);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-3">
        Jewellery Images
      </label>
      
      {/* Current Images */}
      {(currentImages.length > 0 || imagesToDelete.length > 0) && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Current Images</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Active current images */}
            {currentImages.map((imageUrl, index) => (
              <div key={`current-${index}`} className="relative group">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={imageUrl}
                    alt={`Current image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-2">
                    <button
                      type="button"
                      onClick={() => window.open(imageUrl, '_blank')}
                      className="bg-white text-gray-700 p-2 rounded-full hover:bg-gray-100"
                      title="Open in new tab"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeCurrentImage(imageUrl)}
                      className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                      title="Remove"
                      disabled={uploading}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Images marked for deletion */}
            {imagesToDelete.map((imageUrl, index) => (
              <div key={`deleted-${index}`} className="relative group">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden opacity-50">
                  <img
                    src={imageUrl}
                    alt={`Deleted image ${index + 1}`}
                    className="w-full h-full object-cover grayscale"
                  />
                </div>
                <div className="absolute inset-0 bg-red-500 bg-opacity-30 rounded-lg flex items-center justify-center">
                  <div className="bg-red-500 text-white px-2 py-1 rounded text-xs font-medium">
                    Will be deleted
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => restoreImage(imageUrl)}
                  className="absolute top-2 right-2 bg-blue-500 text-white p-1 rounded-full hover:bg-blue-600 text-xs"
                  title="Restore"
                  disabled={uploading}
                >
                  Restore
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload New Images */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Add New Images</h4>
        <div className="flex items-center justify-center w-full">
          <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-8 h-8 mb-2 text-gray-500" />
              <p className="mb-2 text-sm text-gray-500">
                <span className="font-semibold">Click to upload</span> new jewellery images
              </p>
              <p className="text-xs text-gray-500">PNG, JPG, JPEG (MAX. 10MB each)</p>
            </div>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
              disabled={uploading}
            />
          </label>
        </div>

        {/* Display selected new images */}
        {selectedImages.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">New Images to Upload:</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {selectedImages.map((file, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-green-200">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`New image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute top-2 right-2">
                    <button
                      type="button"
                      onClick={() => removeNewImage(index)}
                      className="bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                      disabled={uploading}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="absolute bottom-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
                    New
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white px-1 py-0.5 rounded text-xs">
                    {(file.size / 1024 / 1024).toFixed(1)}MB
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}