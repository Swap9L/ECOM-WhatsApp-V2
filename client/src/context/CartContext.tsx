import { createContext, useContext, useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

type CartItem = {
  id: number;
  productId: number;
  quantity: number;
  color?: string | null;
  size?: string | null;
  product: {
    title: string;
    price: string;
    images: string[];
  };
};

type CartContextType = {
  items: CartItem[];
  count: number;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  isLoading: boolean;
  addToCart: (productId: number, quantity: number, color?: string, size?: string) => Promise<void>;
  updateQuantity: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const [count, setCount] = useState(0);
  
  // Fetch cart data
  const { data, isLoading, refetch } = useQuery<{
    items: CartItem[];
    subtotal: number;
    shipping: number;
    tax: number;
    total: number;
    count: number;
  }>({
    queryKey: ['/api/cart'],
    refetchOnWindowFocus: false,
  });
  
  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async (newItem: { 
      productId: number; 
      quantity: number; 
      color?: string; 
      size?: string;
    }) => {
      return apiRequest("POST", "/api/cart", newItem);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive",
      });
    }
  });
  
  // Update quantity mutation
  const updateQuantityMutation = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: number; quantity: number }) => {
      return apiRequest("PATCH", `/api/cart/${itemId}`, { quantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update cart item",
        variant: "destructive",
      });
    }
  });
  
  // Remove item mutation
  const removeItemMutation = useMutation({
    mutationFn: async (itemId: number) => {
      return apiRequest("DELETE", `/api/cart/${itemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to remove item from cart",
        variant: "destructive",
      });
    }
  });
  
  // Clear cart mutation
  const clearCartMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", "/api/cart");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to clear cart",
        variant: "destructive",
      });
    }
  });
  
  // Update cart badge count when data changes
  useEffect(() => {
    if (data) {
      setCount(data.count);
    }
  }, [data]);
  
  const addToCart = async (productId: number, quantity: number = 1, color?: string, size?: string) => {
    try {
      await addToCartMutation.mutateAsync({ productId, quantity, color, size });
      toast({
        title: "Success",
        description: "Item added to cart",
      });
    } catch (error) {
      console.error("Failed to add to cart:", error);
    }
  };
  
  const updateQuantity = async (itemId: number, quantity: number) => {
    try {
      await updateQuantityMutation.mutateAsync({ itemId, quantity });
    } catch (error) {
      console.error("Failed to update quantity:", error);
    }
  };
  
  const removeItem = async (itemId: number) => {
    try {
      await removeItemMutation.mutateAsync(itemId);
      toast({
        title: "Success",
        description: "Item removed from cart",
      });
    } catch (error) {
      console.error("Failed to remove item:", error);
    }
  };
  
  const clearCart = async () => {
    try {
      await clearCartMutation.mutateAsync();
    } catch (error) {
      console.error("Failed to clear cart:", error);
    }
  };
  
  return (
    <CartContext.Provider value={{
      items: data?.items || [],
      count: data?.count || 0,
      subtotal: data?.subtotal || 0,
      shipping: data?.shipping || 0,
      tax: data?.tax || 0,
      total: data?.total || 0,
      isLoading,
      addToCart,
      updateQuantity,
      removeItem,
      clearCart,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
