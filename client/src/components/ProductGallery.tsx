import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductGalleryProps {
  images: string[];
  title: string;
}

export default function ProductGallery({ images, title }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const galleryRef = useRef<HTMLDivElement>(null);
  
  const handleDotClick = (index: number) => {
    setActiveIndex(index);
    scrollToImage(index);
  };

  const scrollToImage = (index: number) => {
    if (galleryRef.current) {
      const scrollPosition = index * galleryRef.current.offsetWidth;
      galleryRef.current.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
      });
    }
  };
  
  // Touch support for swiping
  useEffect(() => {
    const gallery = galleryRef.current;
    if (!gallery) return;
    
    let startX: number;
    let isDragging = false;
    
    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      isDragging = true;
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      e.preventDefault();
    };
    
    const handleTouchEnd = (e: TouchEvent) => {
      if (!isDragging) return;
      
      const endX = e.changedTouches[0].clientX;
      const diffX = startX - endX;
      
      // Determine swipe direction (left or right)
      if (Math.abs(diffX) > 50) { // Minimum swipe distance
        if (diffX > 0 && activeIndex < images.length - 1) {
          // Swiped left, go to next image
          setActiveIndex(activeIndex + 1);
          scrollToImage(activeIndex + 1);
        } else if (diffX < 0 && activeIndex > 0) {
          // Swiped right, go to previous image
          setActiveIndex(activeIndex - 1);
          scrollToImage(activeIndex - 1);
        }
      }
      
      isDragging = false;
    };
    
    // Handle scroll events for pagination dots
    const handleScroll = () => {
      if (gallery) {
        const scrollPosition = gallery.scrollLeft;
        const imageWidth = gallery.offsetWidth;
        const newIndex = Math.round(scrollPosition / imageWidth);
        
        if (newIndex !== activeIndex) {
          setActiveIndex(newIndex);
        }
      }
    };
    
    gallery.addEventListener('touchstart', handleTouchStart, { passive: false });
    gallery.addEventListener('touchmove', handleTouchMove, { passive: false });
    gallery.addEventListener('touchend', handleTouchEnd);
    gallery.addEventListener('scroll', handleScroll);
    
    return () => {
      gallery.removeEventListener('touchstart', handleTouchStart);
      gallery.removeEventListener('touchmove', handleTouchMove);
      gallery.removeEventListener('touchend', handleTouchEnd);
      gallery.removeEventListener('scroll', handleScroll);
    };
  }, [activeIndex, images.length]);
  
  const goToNext = () => {
    if (activeIndex < images.length - 1) {
      setActiveIndex(activeIndex + 1);
      scrollToImage(activeIndex + 1);
    }
  };
  
  const goToPrevious = () => {
    if (activeIndex > 0) {
      setActiveIndex(activeIndex - 1);
      scrollToImage(activeIndex - 1);
    }
  };

  return (
    <div className="relative">
      {/* Navigation buttons */}
      {activeIndex > 0 && (
        <button 
          className="absolute left-4 top-1/2 z-10 bg-white/80 rounded-full p-2 shadow-sm transform -translate-y-1/2"
          onClick={goToPrevious}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}
      
      {activeIndex < images.length - 1 && (
        <button 
          className="absolute right-4 top-1/2 z-10 bg-white/80 rounded-full p-2 shadow-sm transform -translate-y-1/2"
          onClick={goToNext}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}
      
      {/* Gallery */}
      <div 
        ref={galleryRef}
        className="flex overflow-x-auto snap-x hide-scrollbar scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {images.map((src, index) => (
          <div key={index} className="flex-none w-full snap-start">
            <div className="w-full h-96 flex items-center justify-center bg-gray-100">
              <img 
                src={src} 
                alt={`${title} - image ${index + 1}`} 
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        ))}
      </div>
      
      {/* Pagination dots */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
        {images.map((_, index) => (
          <button 
            key={index} 
            className={cn(
              "h-2 w-2 rounded-full",
              index === activeIndex ? "bg-white" : "bg-white/60"
            )}
            onClick={() => handleDotClick(index)}
          />
        ))}
      </div>
    </div>
  );
}
