import { useState } from "react";
import { clsx } from "clsx";
import { Card } from "./Card.tsx";

interface FileItem {
  id: string;
  url: string;
  title?: string;
  description?: string;
  mimeType?: string;
}

interface FileGalleryProps {
  files: FileItem[];
  className?: string;
}

const getFileIcon = (mimeType?: string, fileName?: string): string => {
  if (!mimeType && fileName) {
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (ext === "pdf") return "📄";
    if (["doc", "docx"].includes(ext || "")) return "📝";
    if (["xls", "xlsx"].includes(ext || "")) return "📊";
    if (["ppt", "pptx"].includes(ext || "")) return "📽️";
    if (["zip", "rar", "7z"].includes(ext || "")) return "📦";
    if (["txt", "rtf"].includes(ext || "")) return "📃";
  }

  if (mimeType?.startsWith("image/")) return "🖼️";
  if (mimeType?.startsWith("video/")) return "🎥";
  if (mimeType?.startsWith("audio/")) return "🎵";
  if (mimeType === "application/pdf") return "📄";
  if (mimeType?.includes("word") || mimeType?.includes("document")) return "📝";
  if (mimeType?.includes("excel") || mimeType?.includes("spreadsheet")) return "📊";
  if (mimeType?.includes("powerpoint") || mimeType?.includes("presentation")) return "📽️";
  if (mimeType?.includes("zip") || mimeType?.includes("compressed")) return "📦";

  return "📎";
};

const isImage = (mimeType?: string, fileName?: string): boolean => {
  if (mimeType?.startsWith("image/")) return true;
  if (fileName) {
    const ext = fileName.split(".").pop()?.toLowerCase();
    return ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"].includes(ext || "");
  }
  return false;
};

export const FileGallery = ({ files, className }: FileGalleryProps) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  if (files.length === 0) {
    return (
      <Card variant="glass" className={clsx("p-8 text-center", className)}>
        <div className="space-y-4">
          <div className="text-6xl opacity-30">📎</div>
          <p className="text-dark-400">Нет файлов</p>
        </div>
      </Card>
    );
  }

  const images = files.filter((f) => isImage(f.mimeType, f.title));
  const documents = files.filter((f) => !isImage(f.mimeType, f.title));

  return (
    <>
      {/* Изображения */}
      {images.length > 0 && (
        <div className={clsx("grid grid-cols-2 md:grid-cols-3 gap-3", className)}>
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
                    <div className="absolute bottom-0 left-0 right-0 p-2">
                      <p className="text-xs font-medium text-white truncate">{image.title}</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Документы */}
      {documents.length > 0 && (
        <div className={clsx("space-y-2", images.length > 0 && "mt-4")}>
          {documents.map((file) => (
            <a
              key={file.id}
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              download={file.title}
              className="flex items-center gap-3 p-3 rounded-xl bg-dark-800/70 border border-dark-700 hover:border-primary-500/50 hover:bg-dark-800 transition-all group"
            >
              <span className="text-2xl">{getFileIcon(file.mimeType, file.title)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-dark-100 truncate group-hover:text-primary-400 transition-colors">
                  {file.title || "Файл"}
                </p>
                {file.description && (
                  <p className="text-xs text-dark-400 truncate">{file.description}</p>
                )}
              </div>
              <span className="text-xs text-dark-500 group-hover:text-primary-400 transition-colors shrink-0">
                Скачать ↓
              </span>
            </a>
          ))}
        </div>
      )}

      {/* Modal для просмотра изображения */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-dark-900/95 backdrop-blur-sm p-4"
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
