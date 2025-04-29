import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Shirt, User2, ShirtIcon, Footprints, ShoppingBag, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import CategoryItem from "@/components/CategoryItem";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@shared/schema";

export default function Home() {
  const [, navigate] = useLocation();
  
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ['/api/products'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Prepare data for rendering
  const newArrivals = products?.slice(0, 4);
  const popularProducts = products?.slice(2, 6);
  
  return (
    <div>
      {/* Hero Banner */}
      <div className="relative mb-6">
        <img 
          src="https://images.unsplash.com/photo-1483985988355-763728e1935b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
          alt="Fashion Sale" 
          className="w-full h-64 object-cover" 
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50 flex flex-col justify-end p-6">
          <h2 className="text-white text-3xl font-display font-bold mb-2">Summer Collection</h2>
          <p className="text-white text-sm mb-4">Discover our latest arrivals</p>
          <Link href="/category/dresses">
            <span className="bg-white text-gray-900 font-medium rounded-full px-6 py-2.5 inline-block cursor-pointer">
              Shop Now
            </span>
          </Link>
        </div>
      </div>

      {/* Categories */}
      <div className="px-4 mb-8">
        <h3 className="text-lg font-display font-semibold mb-4">Shop by Category</h3>
        <div className="flex overflow-x-auto hide-scrollbar space-x-4 pb-2">
          <CategoryItem
            icon={<Shirt className="h-6 w-6" />}
            label="Tops"
            bgColor="bg-primary/10"
            textColor="text-primary"
            href="/category/tops"
          />
          <CategoryItem
            icon={<ShirtIcon className="h-6 w-6" />}
            label="Dresses"
            bgColor="bg-blue-100"
            textColor="text-blue-600"
            href="/category/dresses"
          />
          <CategoryItem
            icon={<User2 className="h-6 w-6" />}
            label="Bottoms"
            bgColor="bg-purple-100"
            textColor="text-purple-600"
            href="/category/bottoms"
          />
          <CategoryItem
            icon={<Footprints className="h-6 w-6" />}
            label="Shoes"
            bgColor="bg-green-100"
            textColor="text-green-600"
            href="/category/shoes"
          />
          <CategoryItem
            icon={<ShoppingBag className="h-6 w-6" />}
            label="Bags"
            bgColor="bg-amber-100"
            textColor="text-amber-600"
            href="/category/bags"
          />
        </div>
      </div>

      {/* New Arrivals */}
      <div className="px-4 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-display font-semibold">New Arrivals</h3>
          <Link href="/category/dresses">
            <a className="text-sm text-primary font-medium flex items-center">
              See All
              <ChevronRight className="h-4 w-4 ml-1" />
            </a>
          </Link>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="bg-white rounded-lg overflow-hidden shadow-sm">
                <Skeleton className="w-full h-44" />
                <div className="p-3">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {newArrivals?.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>

      {/* Featured Collection */}
      <div className="px-4 mb-8">
        <h3 className="text-lg font-display font-semibold mb-4">Summer Dresses</h3>
        <div className="relative">
          <img 
            src="https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
            alt="Summer Dresses Collection" 
            className="w-full h-48 object-cover rounded-lg" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
            <div>
              <p className="text-white text-xs mb-1">30% OFF</p>
              <h4 className="text-white text-lg font-medium mb-2">Summer Dresses</h4>
              <button 
                onClick={() => navigate("/category/dresses")}
                className="bg-white text-gray-900 text-xs font-medium rounded-full px-4 py-2"
              >
                Shop Collection
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Popular This Week */}
      <div className="px-4 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-display font-semibold">Popular This Week</h3>
          <Link href="/category/dresses">
            <a className="text-sm text-primary font-medium flex items-center">
              See All
              <ChevronRight className="h-4 w-4 ml-1" />
            </a>
          </Link>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="bg-white rounded-lg overflow-hidden shadow-sm">
                <Skeleton className="w-full h-44" />
                <div className="p-3">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {popularProducts?.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
