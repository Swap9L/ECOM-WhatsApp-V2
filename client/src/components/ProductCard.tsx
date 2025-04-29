import { Link } from "wouter";
import { Heart } from "lucide-react";
import { formatCurrency, calculateDiscount } from "@/lib/utils";

interface ProductCardProps {
  product: {
    id: number;
    title: string;
    price: string;
    originalPrice: string | null;
    images: string[];
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const discount = calculateDiscount(product.price, product.originalPrice);
  
  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-sm product-card">
      <Link href={`/product/${product.id}`}>
        <a className="block">
          <div className="relative">
            <div className="w-full h-44 flex items-center justify-center bg-gray-100">
              <img 
                src={product.images[0]} 
                alt={product.title} 
                className="w-full h-full object-contain"
                loading="lazy"
              />
            </div>
            {discount && (
              <span className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                {discount}
              </span>
            )}
            <button 
              className="absolute top-2 right-2 text-gray-700 bg-white/80 p-1.5 rounded-full"
              onClick={(e) => {
                e.preventDefault();
                // Add to wishlist functionality would go here
              }}
            >
              <Heart className="h-4 w-4" />
            </button>
          </div>
          <div className="p-3">
            <h3 className="font-medium text-sm line-clamp-1">{product.title}</h3>
            <div className="flex items-center mt-1">
              <span className="font-semibold text-sm">{formatCurrency(product.price)}</span>
              {product.originalPrice && (
                <span className="text-xs text-gray-500 line-through ml-2">
                  {formatCurrency(product.originalPrice)}
                </span>
              )}
            </div>
          </div>
        </a>
      </Link>
    </div>
  );
}
