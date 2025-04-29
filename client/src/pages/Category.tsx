import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { ArrowLeft, Filter, ArrowDownAZ, LayoutGrid } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@shared/schema";

export default function Category() {
  const [, navigate] = useLocation();
  const [match, params] = useRoute("/category/:category");
  const category = params?.category || "dresses";
  
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: [`/api/products/category/${category}`], 
    fallbackData: [],
  });
  
  useEffect(() => {
    // Fetch products from the API if not already fetched
    // This is handled by React Query
  }, [category]);
  
  return (
    <div className="px-4 pt-2">
      <div className="flex items-center mb-4">
        <Button 
          variant="ghost" 
          size="icon" 
          className="mr-3 text-gray-700" 
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h2 className="text-xl font-display font-semibold capitalize">{category}</h2>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg p-3 shadow-sm mb-4">
        <div className="flex justify-between items-center">
          <Button variant="outline" size="sm" className="text-sm space-x-1 py-1 px-3 bg-gray-100 rounded-full">
            <Filter className="h-4 w-4" />
            <span>Filters</span>
          </Button>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" className="text-sm space-x-1 py-1 px-3 bg-gray-100 rounded-full">
              <span>Sort</span>
              <ArrowDownAZ className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" className="p-1.5 bg-gray-100 rounded-full">
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Product Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 mb-4">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="bg-white rounded-lg overflow-hidden shadow-sm">
              <Skeleton className="w-full h-44" />
              <div className="p-3">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : products?.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No products found in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 mb-4">
          {products?.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
