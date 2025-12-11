import { useState } from "react";
import { clsx } from "clsx";
import { Card } from "./Card.tsx";

interface ImageGalleryProps {
  images: Array<{ id: string; url: string; title?: string; description?: string }>;
  className?: string;
}

export const ImageGallery = ({ images, className }: ImageGalleryProps) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  if (images.length === 0) {
    return (
      <Card variant="glass" className={clsx("p-8 text-center", className)}>
        <div className="space-y-4">
          <div className="text-6xl opacity-30">📸</div>
          <p className="text-dark-400">Нет изображений</p>
        </div>
      </Card>
    );
  }

  return (
    <>
      <div className={clsx("grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4", className)}>
        {images.map((image, index) => (
          <Card
            key={image.id}
            variant="glass"
            hover
            className="p-0 overflow-hidden cursor-pointer group relative"
            onClick={() => setSelectedImage(image.url)}
          >
            <div className="aspect-square relative bg-dark-800">
              <img
                src={image.url}
                alt={image.title || `Изображение ${index + 1}`}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-dark-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {image.title && (
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-sm font-semibold text-white">{image.title}</p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Modal для просмотра изображения */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-dark-900/95 backdrop-blur-sm p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh] w-full">
            <button
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-dark-800/90 hover:bg-dark-700 flex items-center justify-center text-white text-xl transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImage(null);
              }}
            >
              ×
            </button>
            <img
              src={selectedImage}
              alt="Просмотр"
              className="w-full h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
};





