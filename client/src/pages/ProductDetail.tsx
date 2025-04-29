import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Heart, ShoppingBag, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import ProductGallery from "@/components/ProductGallery";
import { useCart } from "@/context/CartContext";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@shared/schema";

export default function ProductDetail() {
  const [, navigate] = useLocation();
  const [match, params] = useRoute("/product/:id");
  const productId = params?.id ? parseInt(params.id) : 0;
  
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  
  const { addToCart } = useCart();
  
  const { data: product, isLoading } = useQuery<Product>({
    queryKey: [`/api/products/${productId}`],
    enabled: productId > 0,
  });
  
  const handleAddToCart = async () => {
    if (!product) return;
    
    setIsAddingToCart(true);
    
    try {
      await addToCart(product.id, 1, selectedColor || undefined, selectedSize || undefined);
      setAddedToCart(true);
      
      // Reset the button after 2 seconds
      setTimeout(() => {
        setAddedToCart(false);
      }, 2000);
    } catch (error) {
      console.error("Failed to add to cart:", error);
    } finally {
      setIsAddingToCart(false);
    }
  };
  
  if (isLoading) {
    return (
      <div>
        <div className="relative h-96 bg-gray-100">
          <Skeleton className="w-full h-full" />
        </div>
        <div className="px-4 py-6">
          <Skeleton className="h-7 w-3/4 mb-2" />
          <Skeleton className="h-6 w-1/3 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4 mb-6" />
          <Skeleton className="h-12 w-full rounded-full" />
        </div>
      </div>
    );
  }
  
  if (!product) {
    return (
      <div className="px-4 py-20 text-center">
        <p className="text-gray-700 mb-4">Product not found</p>
        <Button variant="outline" onClick={() => navigate("/")}>
          Return to Home
        </Button>
      </div>
    );
  }
  
  return (
    <div>
      {/* Product Images Gallery with back button */}
      <div className="relative">
        <Button 
          variant="ghost" 
          size="icon"
          className="absolute top-4 left-4 z-10 bg-white/80 rounded-full p-2 shadow-sm"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon"
          className="absolute top-4 right-4 z-10 bg-white/80 rounded-full p-2 shadow-sm"
        >
          <Heart className="h-5 w-5" />
        </Button>
        
        <ProductGallery images={product.images} title={product.title} />
      </div>

      {/* Product Info */}
      <div className="px-4 py-6">
        <div className="flex justify-between items-start mb-2">
          <h2 className="text-xl font-semibold font-display">{product.title}</h2>
          <div className="flex items-center bg-green-100 px-2 py-1 rounded text-sm">
            <span className="text-yellow-500 mr-1">★</span>
            <span className="font-medium">{product.rating}</span>
          </div>
        </div>
        
        <div className="flex items-center mb-4">
          <p className="text-2xl font-semibold text-gray-900 mr-3">
            {formatCurrency(product.price)}
          </p>
          {product.originalPrice && (
            <>
              <p className="text-sm text-gray-500 line-through">
                {formatCurrency(product.originalPrice)}
              </p>
              <span className="ml-2 text-sm font-medium text-red-600">
                {Math.round((1 - parseFloat(product.price) / parseFloat(product.originalPrice)) * 100)}% OFF
              </span>
            </>
          )}
        </div>

        {/* Color Options */}
        {product.colors && product.colors.length > 0 && (
          <div className="mb-6">
            <p className="text-sm font-medium mb-2">
              Color: <span className="capitalize">{selectedColor || product.colors[0]}</span>
            </p>
            <div className="flex space-x-3">
              {product.colors.map((color) => {
                // Map color names to Tailwind classes
                const colorMap: Record<string, string> = {
                  'Pink': 'bg-pink-300',
                  'Blue': 'bg-blue-300',
                  'Yellow': 'bg-yellow-300',
                  'Gray': 'bg-gray-300',
                  'Black': 'bg-black',
                  'White': 'bg-white border border-gray-200',
                  'Red': 'bg-red-500',
                  'Green': 'bg-green-500',
                  'Brown': 'bg-amber-800',
                  'Beige': 'bg-amber-100',
                  'Navy': 'bg-indigo-900',
                  'Coral': 'bg-orange-300',
                  'Olive': 'bg-olive-500'
                };
                
                const bgColorClass = colorMap[color] || 'bg-gray-300';
                const isSelected = selectedColor === color || (!selectedColor && color === product.colors[0]);
                
                return (
                  <button
                    key={color}
                    className={`h-8 w-8 rounded-full ${bgColorClass} ${
                      isSelected ? 'ring-2 ring-offset-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedColor(color)}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Size Options */}
        {product.sizes && product.sizes.length > 0 && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-medium">
                Size: <span>{selectedSize || product.sizes[0]}</span>
              </p>
              <button className="text-sm text-primary">Size Guide</button>
            </div>
            <div className="flex space-x-3">
              {product.sizes.map((size) => {
                const isSelected = selectedSize === size || (!selectedSize && size === product.sizes[0]);
                
                return (
                  <button
                    key={size}
                    className={`h-10 w-10 rounded-full border ${
                      isSelected
                        ? 'border-2 border-primary bg-primary/10 font-medium'
                        : 'border-gray-300'
                    } flex items-center justify-center text-sm`}
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Product Description */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Description</h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Add to Cart Button */}
        <Button 
          className="w-full py-6 rounded-full flex items-center justify-center"
          disabled={isAddingToCart}
          onClick={handleAddToCart}
        >
          {addedToCart ? (
            <>
              <Check className="h-5 w-5 mr-2" />
              Added to Cart
            </>
          ) : (
            <>
              <ShoppingBag className="h-5 w-5 mr-2" />
              Add to Cart
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
