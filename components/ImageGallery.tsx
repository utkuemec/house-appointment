'use client';

import { useState } from 'react';

export default function ImageGallery({ images, title }: { images: string[], title: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setIsOpen(true);
  };

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="space-y-4">
      {images.length > 0 ? (
        <>
          {/* Main Hero Image */}
          <div 
            className="aspect-video bg-gray-100 rounded-xl overflow-hidden shadow-sm relative cursor-pointer group"
            onClick={() => openLightbox(0)}
          >
            <img 
              src={images[0]} 
              alt={title} 
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
              <span className="opacity-0 group-hover:opacity-100 text-white bg-black/50 px-4 py-2 rounded-full text-sm font-medium transition-opacity">
                View All Photos
              </span>
            </div>
          </div>
          
          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {images.slice(1, 5).map((img, idx) => (
                <div 
                  key={idx} 
                  className="aspect-square bg-gray-100 rounded-lg overflow-hidden shadow-sm cursor-pointer relative"
                  onClick={() => openLightbox(idx + 1)}
                >
                  <img 
                    src={img} 
                    alt={`View ${idx + 2}`} 
                    className="object-cover w-full h-full hover:opacity-90 transition-opacity"
                  />
                  {/* Show "+X" on the last thumbnail if there are more images */}
                  {idx === 3 && images.length > 5 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold text-lg">
                      +{images.length - 5}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="aspect-video bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
          No Images Available
        </div>
      )}

      {/* Lightbox Modal */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
          onClick={() => setIsOpen(false)}
        >
          <button 
            className="absolute top-4 right-4 text-white/70 hover:text-white text-4xl font-light z-50"
            onClick={() => setIsOpen(false)}
          >
            &times;
          </button>

          <button 
            className="absolute left-4 text-white/70 hover:text-white text-6xl font-light z-50 p-4"
            onClick={prevImage}
          >
            &#8249;
          </button>

          <div className="relative max-w-5xl max-h-[90vh] w-full h-full flex items-center justify-center p-4">
            <img 
              src={images[currentIndex]} 
              alt={`${title} - Photo ${currentIndex + 1}`} 
              className="max-w-full max-h-full object-contain rounded shadow-2xl"
            />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-1 rounded-full text-sm">
              {currentIndex + 1} / {images.length}
            </div>
          </div>

          <button 
            className="absolute right-4 text-white/70 hover:text-white text-6xl font-light z-50 p-4"
            onClick={nextImage}
          >
            &#8250;
          </button>
        </div>
      )}
    </div>
  );
}

