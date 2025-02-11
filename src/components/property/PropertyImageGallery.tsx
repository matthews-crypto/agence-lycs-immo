
import { Plus } from "lucide-react";

interface PropertyImageGalleryProps {
  images: string[];
  title: string;
  onImageClick: (imageUrl: string, index: number) => void;
}

export default function PropertyImageGallery({ 
  images, 
  title, 
  onImageClick 
}: PropertyImageGalleryProps) {
  if (!images || images.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
      <div className="col-span-full relative">
        <img
          src={images[0]}
          alt={title}
          className="w-full aspect-[16/9] object-cover rounded-lg cursor-pointer"
          onClick={() => onImageClick(images[0], 0)}
        />
        {images.length > 1 && (
          <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full flex items-center">
            <Plus className="h-4 w-4 mr-1" />
            {images.length - 1}
          </div>
        )}
      </div>
    </div>
  );
}
