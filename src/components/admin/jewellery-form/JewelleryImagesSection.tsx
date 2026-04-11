import React from 'react';
import { Upload, X, ExternalLink, GripHorizontal } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface JewelleryImagesSectionProps {
  selectedImages: File[];
  setSelectedImages: (images: File[]) => void;
  currentImages: string[];
  setCurrentImages: (images: string[]) => void;
  imagesToDelete: string[];
  setImagesToDelete: (images: string[]) => void;
  uploading: boolean;
}

// Helper component for the draggable grid items
function SortableImageItem({ id, children, disabled = false, className = '' }: { id: string, children: React.ReactNode, disabled?: boolean, className?: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={`outline-none touch-none cursor-grab active:cursor-grabbing ${className}`}>
      {children}
    </div>
  );
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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileArray = Array.from(files);
      setSelectedImages([...selectedImages, ...fileArray]);
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

  const handleCurrentDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = currentImages.indexOf(active.id as string);
      const newIndex = currentImages.indexOf(over.id as string);
      setCurrentImages(arrayMove(currentImages, oldIndex, newIndex));
    }
  };

  const getFileId = (file: File) => `${file.name}-${file.size}`;

  const handleSelectedDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = selectedImages.findIndex(f => getFileId(f) === active.id);
      const newIndex = selectedImages.findIndex(f => getFileId(f) === over.id);
      setSelectedImages(arrayMove(selectedImages, oldIndex, newIndex));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end">
        <label className="block text-sm font-semibold text-gray-800">
          Jewellery Images
        </label>
        <span className="text-xs text-gray-500 italic">Drag to reorder. The first image is the Cover.</span>
      </div>
      
      {/* Current Images Gallery */}
      {(currentImages.length > 0 || imagesToDelete.length > 0) && (
        <div className="mb-2">
          <h4 className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">Current Images</h4>
          
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleCurrentDragEnd}>
              <SortableContext items={currentImages} strategy={rectSortingStrategy}>
                
                {/* Active current images */}
                {currentImages.map((imageUrl, index) => (
                  <SortableImageItem key={imageUrl} id={imageUrl} disabled={uploading} className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                    <img src={imageUrl} alt={`Current ${index + 1}`} className="w-full h-full object-cover" />
                    
                    {index === 0 && (
                      <div className="absolute top-1 left-1 bg-yellow-500 text-white px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide">
                        Cover
                      </div>
                    )}
                    
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center">
                      <div className="absolute top-1 right-1 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <GripHorizontal className="h-4 w-4 drop-shadow-md" />
                      </div>
                      
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-2">
                        <button type="button" onPointerDown={(e) => e.stopPropagation()} onClick={() => window.open(imageUrl, '_blank')} className="bg-white text-gray-700 p-1.5 rounded-full hover:bg-gray-100">
                          <ExternalLink className="h-4 w-4" />
                        </button>
                        <button type="button" onPointerDown={(e) => e.stopPropagation()} onClick={() => removeCurrentImage(imageUrl)} className="bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600" disabled={uploading}>
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </SortableImageItem>
                ))}

              </SortableContext>
            </DndContext>
            
            {/* Images marked for deletion */}
            {imagesToDelete.map((imageUrl, index) => (
              <div key={`deleted-${index}`} className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden opacity-40 border border-red-200">
                <img src={imageUrl} alt={`Deleted ${index + 1}`} className="w-full h-full object-cover grayscale" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <button type="button" onClick={() => restoreImage(imageUrl)} className="bg-blue-500 text-white px-2 py-1 rounded-full hover:bg-blue-600 text-xs shadow-md" disabled={uploading}>
                    Restore
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload + New Images Combined Grid */}
      <div>
        <h4 className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">New Images</h4>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
          
          {/* 1. Upload Button (Acts as a static grid item) */}
          <label className={`flex flex-col items-center justify-center aspect-square border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <Upload className="w-6 h-6 text-gray-400 mb-1" />
            <span className="text-xs text-gray-500 font-medium">Add Photo</span>
            <input type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" disabled={uploading} />
          </label>

          {/* 2. New Images Previews (Sortable) */}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSelectedDragEnd}>
            <SortableContext items={selectedImages.map(getFileId)} strategy={rectSortingStrategy}>
              
              {selectedImages.map((file, index) => (
                <SortableImageItem key={getFileId(file)} id={getFileId(file)} disabled={uploading} className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-green-200">
                  <img src={URL.createObjectURL(file)} alt={`New ${index + 1}`} className="w-full h-full object-cover" />
                  
                  {index === 0 && currentImages.length === 0 && (
                    <div className="absolute top-1 left-1 bg-yellow-500 text-white px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide">
                      Cover
                    </div>
                  )}

                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg">
                    <div className="absolute top-1 left-1/2 -translate-x-1/2 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      <GripHorizontal className="h-4 w-4 drop-shadow-md" />
                    </div>
                  </div>

                  <button type="button" onPointerDown={(e) => e.stopPropagation()} onClick={() => removeNewImage(index)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 shadow-md opacity-100 transition-opacity" disabled={uploading}>
                    <X className="h-3 w-3" />
                  </button>
                </SortableImageItem>
              ))}

            </SortableContext>
          </DndContext>
          
        </div>
      </div>
    </div>
  );
}