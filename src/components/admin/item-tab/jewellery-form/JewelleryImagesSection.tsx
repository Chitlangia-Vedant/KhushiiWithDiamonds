import React, { useState, useEffect, useMemo } from 'react';
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
  // NEW: Callback to pass the mixed order back to the parent form
  setCombinedOrder?: (order: string[]) => void; 
}

const getFileId = (file: File) => `${file.name}-${file.size}`;

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
  selectedImages, setSelectedImages, currentImages, setCurrentImages, imagesToDelete, setImagesToDelete, uploading, setCombinedOrder
}: JewelleryImagesSectionProps) {

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // 1. Create a unified list of all active items (both old URLs and new Files)
  const allItems = useMemo(() => {
    const current = currentImages.map(url => ({ id: url, type: 'current', url, file: null }));
    const newImgs = selectedImages.map(file => ({ id: getFileId(file), type: 'new', url: '', file }));
    return [...current, ...newImgs];
  }, [currentImages, selectedImages]);

  // 2. Maintain the custom mixed drag-and-drop order locally
  const [order, setOrder] = useState<string[]>([]);

  useEffect(() => {
    const newIds = allItems.map(item => item.id);
    // Keep existing sorted items, add any new ones to the end
    let nextOrder = order.filter(id => newIds.includes(id));
    const missing = newIds.filter(id => !nextOrder.includes(id));
    nextOrder = [...nextOrder, ...missing];
    
    if (nextOrder.join(',') !== order.join(',')) {
      setOrder(nextOrder);
      if (setCombinedOrder) setCombinedOrder(nextOrder);
    }
  }, [allItems, order, setCombinedOrder]);

  const sortedItems = order.map(id => allItems.find(item => item.id === id)).filter(Boolean) as any[];

  // --- Handlers ---
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setSelectedImages([...selectedImages, ...Array.from(e.target.files)]);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = order.indexOf(active.id as string);
      const newIndex = order.indexOf(over.id as string);
      const newOrder = arrayMove(order, oldIndex, newIndex);
      setOrder(newOrder);
      if (setCombinedOrder) setCombinedOrder(newOrder); // Alert the parent!
    }
  };

  const removeItem = (id: string, type: string) => {
    if (type === 'current') {
      setCurrentImages(currentImages.filter(url => url !== id));
      setImagesToDelete([...imagesToDelete, id]);
    } else {
      setSelectedImages(selectedImages.filter(f => getFileId(f) !== id));
    }
  };

  const restoreImage = (imageUrl: string) => {
    setImagesToDelete(imagesToDelete.filter(url => url !== imageUrl));
    setCurrentImages([...currentImages, imageUrl]);
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-end mb-2">
        <label className="block text-sm font-semibold text-gray-800">Jewellery Images</label>
        <span className="text-xs text-gray-500 italic">Drag to reorder. The first image is the Cover.</span>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
          
          {/* 1. Static Upload Button */}
          <label className={`flex flex-col items-center justify-center aspect-square border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <Upload className="w-6 h-6 text-gray-400 mb-1" />
            <span className="text-xs text-gray-500 font-medium">Add Photo</span>
            <input type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" disabled={uploading} />
          </label>

          {/* 2. Unified Sortable Grid (Current + New mixed together) */}
          <SortableContext items={order} strategy={rectSortingStrategy}>
            {sortedItems.map((item, index) => (
              <SortableImageItem key={item.id} id={item.id} disabled={uploading} className={`relative group aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 ${item.type === 'new' ? 'border-green-200' : 'border-gray-200'}`}>
                
                {/* Image Display */}
                <img src={item.type === 'current' ? item.url : URL.createObjectURL(item.file)} alt={`Item ${index + 1}`} className="w-full h-full object-cover" />
                
                {/* Visual Badges */}
                {index === 0 && (
                  <div className="absolute top-1 left-1 bg-yellow-500 text-white px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide shadow-sm z-10">Cover</div>
                )}
                {item.type === 'new' && (
                  <div className="absolute bottom-1 left-1 bg-green-500/90 backdrop-blur-sm text-white px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide shadow-sm z-10">New</div>
                )}

                {/* Hover Actions */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 rounded-lg flex items-center justify-center">
                  <div className="absolute top-1 left-1/2 -translate-x-1/2 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripHorizontal className="h-4 w-4 drop-shadow-md" />
                  </div>
                  
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-2">
                    {item.type === 'current' && (
                      <button type="button" onPointerDown={(e) => e.stopPropagation()} onClick={() => window.open(item.url, '_blank')} className="bg-white text-gray-700 p-1.5 rounded-full hover:bg-gray-100 shadow-sm">
                        <ExternalLink className="h-3 w-3" />
                      </button>
                    )}
                    <button type="button" onPointerDown={(e) => e.stopPropagation()} onClick={() => removeItem(item.id, item.type)} className="bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 shadow-sm" disabled={uploading}>
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>

              </SortableImageItem>
            ))}
          </SortableContext>

          {/* 3. Images marked for deletion */}
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
      </DndContext>
    </div>
  );
}