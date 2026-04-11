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

// Helper component that makes a single image draggable
function SortableImageItem({ id, children, disabled = false }: { id: string, children: React.ReactNode, disabled?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="relative group outline-none touch-none cursor-grab active:cursor-grabbing">
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

  // Setup DND Sensors: Prevents drag from triggering when just clicking a button
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

  // Drag handers
  const handleCurrentDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = currentImages.indexOf(active.id as string);
      const newIndex = currentImages.indexOf(over.id as string);
      setCurrentImages(arrayMove(currentImages, oldIndex, newIndex));
    }
  };

  // Helper to get a unique ID for File objects
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
    <div>
      <div className="flex justify-between items-end mb-3">
        <label className="block text-sm font-medium text-gray-700">Jewellery Images</label>
        <span className="text-xs text-gray-500 italic">Drag to reorder. The first image is the Cover.</span>
      </div>
      
      {/* --- CURRENT IMAGES (DRAGGABLE) --- */}
      {(currentImages.length > 0 || imagesToDelete.length > 0) && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Current Images</h4>
          
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleCurrentDragEnd}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              
              <SortableContext items={currentImages} strategy={rectSortingStrategy}>
                {currentImages.map((imageUrl, index) => (
                  <SortableImageItem key={imageUrl} id={imageUrl} disabled={uploading}>
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200 group-hover:border-yellow-400 transition-colors">
                      <img src={imageUrl} alt={`Current image ${index + 1}`} className="w-full h-full object-cover" />
                    </div>
                    
                    {/* Cover Badge */}
                    {index === 0 && (
                      <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide shadow-sm">
                        Cover Image
                      </div>
                    )}
                    
                    {/* Drag Handle Indicator */}
                    <div className="absolute top-2 right-2 bg-black/40 text-white p-1 rounded backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                      <GripHorizontal className="h-3 w-3" />
                    </div>

                    {/* Actions Overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 rounded-lg flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-2">
                        <button
                          type="button"
                          onPointerDown={(e) => e.stopPropagation()} // Prevents drag when clicking
                          onClick={() => window.open(imageUrl, '_blank')}
                          className="bg-white text-gray-700 p-2 rounded-full hover:bg-gray-100 shadow-sm"
                          title="Open in new tab"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onPointerDown={(e) => e.stopPropagation()} // Prevents drag when clicking
                          onClick={() => removeCurrentImage(imageUrl)}
                          className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 shadow-sm"
                          title="Remove"
                          disabled={uploading}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </SortableImageItem>
                ))}
              </SortableContext>
              
              {/* Images marked for deletion (Not Sortable) */}
              {imagesToDelete.map((imageUrl, index) => (
                <div key={`deleted-${index}`} className="relative group">
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden opacity-50 border border-gray-200">
                    <img src={imageUrl} alt={`Deleted image ${index + 1}`} className="w-full h-full object-cover grayscale" />
                  </div>
                  <div className="absolute inset-0 bg-red-500/20 rounded-lg flex items-center justify-center">
                    <div className="bg-red-500 text-white px-2 py-1 rounded text-xs font-medium shadow-sm">
                      Will be deleted
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => restoreImage(imageUrl)}
                    className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 text-xs shadow-sm font-medium transition-colors"
                    disabled={uploading}
                  >
                    Restore
                  </button>
                </div>
              ))}
            </div>
          </DndContext>
        </div>
      )}

      {/* --- UPLOAD NEW IMAGES --- */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Add New Images</h4>
        <div className="flex items-center justify-center w-full">
          <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-6 h-6 mb-2 text-gray-500" />
              <p className="mb-1 text-sm text-gray-600">
                <span className="font-semibold text-yellow-600">Click to upload</span> or drag and drop files here
              </p>
              <p className="text-xs text-gray-400">PNG, JPG, JPEG (MAX. 10MB each)</p>
            </div>
            <input type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" disabled={uploading} />
          </label>
        </div>

        {/* --- NEW IMAGES (DRAGGABLE) --- */}
        {selectedImages.length > 0 && (
          <div className="space-y-2 mt-4">
            <p className="text-sm font-medium text-gray-700">Pending Uploads:</p>
            
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSelectedDragEnd}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <SortableContext items={selectedImages.map(getFileId)} strategy={rectSortingStrategy}>
                  
                  {selectedImages.map((file, index) => (
                    <SortableImageItem key={getFileId(file)} id={getFileId(file)} disabled={uploading}>
                      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-green-200 group-hover:border-green-400 transition-colors">
                        <img src={URL.createObjectURL(file)} alt={`New image ${index + 1}`} className="w-full h-full object-cover" />
                      </div>
                      
                      {/* Cover Badge for New Items (only if no existing images) */}
                      {index === 0 && currentImages.length === 0 && (
                        <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide shadow-sm">
                          Cover Image
                        </div>
                      )}

                      <div className="absolute top-2 right-8 bg-black/40 text-white p-1 rounded backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                        <GripHorizontal className="h-3 w-3" />
                      </div>

                      <div className="absolute top-2 right-2">
                        <button
                          type="button"
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={() => removeNewImage(index)}
                          className="bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 shadow-sm transition-colors"
                          disabled={uploading}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                      
                      <div className="absolute bottom-2 left-2 bg-green-500/90 backdrop-blur-sm text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide shadow-sm">
                        New
                      </div>
                      <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white px-1.5 py-0.5 rounded text-[10px] font-medium shadow-sm">
                        {(file.size / 1024 / 1024).toFixed(1)}MB
                      </div>
                    </SortableImageItem>
                  ))}

                </SortableContext>
              </div>
            </DndContext>
          </div>
        )}
      </div>
    </div>
  );
}