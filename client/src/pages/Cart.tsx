import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import CartItem from "@/components/CartItem";
import { useCart } from "@/context/CartContext";
import { formatCurrency } from "@/lib/utils";

export default function Cart() {
  const [, navigate] = useLocation();
  const { items, subtotal, shipping, tax, total, isLoading } = useCart();
  
  const handleCheckout = () => {
    navigate("/checkout");
  };
  
  const handleWhatsappCheckout = () => {
    // This will redirect to checkout where user can fill in details
    // before the WhatsApp integration happens
    navigate("/checkout?via=whatsapp");
  };
  
  return (
    <div className="h-full pb-32">
      <div className="bg-white px-4 py-4 shadow-sm">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon"
            className="mr-3 text-gray-700" 
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h2 className="text-xl font-display font-semibold">Shopping Bag</h2>
          <span className="ml-2 text-sm text-gray-500">({items.length})</span>
        </div>
      </div>

      <div className="px-4 py-6">
        {isLoading ? (
          // Loading state
          <>
            {[...Array(3)].map((_, index) => (
              <div key={index} className="flex border-b border-gray-200 pb-4 mb-4">
                <Skeleton className="h-24 w-20 rounded" />
                <div className="ml-4 flex-1">
                  <div className="flex justify-between">
                    <div>
                      <Skeleton className="h-5 w-32 mb-1" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-8 w-8 rounded-full" />
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <Skeleton className="h-8 w-24 rounded" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                </div>
              </div>
            ))}
          </>
        ) : items.length === 0 ? (
          // Empty cart
          <div className="text-center py-8">
            <div className="bg-gray-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-12 w-12 text-gray-400" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={1.5} 
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" 
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium mb-2">Your cart is empty</h3>
            <p className="text-gray-500 mb-6">Add items to your cart to continue shopping</p>
            <Button onClick={() => navigate("/")}>
              Continue Shopping
            </Button>
          </div>
        ) : (
          // Cart items
          items.map((item) => (
            <CartItem key={item.id} item={item} />
          ))
        )}
      </div>

      {/* Order Summary - Only show if cart has items */}
      {items.length > 0 && (
        <div className="bg-white border-t border-gray-200 px-4 py-4 fixed bottom-16 left-0 right-0">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">Shipping</span>
            <span className="font-medium">{formatCurrency(shipping)}</span>
          </div>
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-600">Tax</span>
            <span className="font-medium">{formatCurrency(tax)}</span>
          </div>
          <div className="flex justify-between items-center mb-6 pt-2 border-t border-gray-200">
            <span className="font-medium">Total</span>
            <span className="font-semibold text-lg">{formatCurrency(total)}</span>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={handleWhatsappCheckout}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white font-medium py-3 rounded-full flex items-center justify-center"
            >
              <svg 
                viewBox="0 0 24 24" 
                className="h-5 w-5 mr-2" 
                fill="currentColor"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp Order
            </Button>
            <Button 
              onClick={handleCheckout}
              className="flex-1 py-3 rounded-full"
            >
              Checkout
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
