import { useEffect } from "react";
import { useRoute } from "wouter";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useCart } from "@/context/CartContext";

export default function Confirmation() {
  const [match, params] = useRoute("/confirmation/:orderNumber");
  const orderNumber = params?.orderNumber || "";
  const [, navigate] = useLocation();
  const { clearCart } = useCart();
  
  const { data: order, isLoading } = useQuery({
    queryKey: [`/api/orders/${orderNumber}`],
    enabled: orderNumber !== "",
  });
  
  // Clear cart on component mount to ensure it's empty
  useEffect(() => {
    clearCart();
  }, [clearCart]);
  
  const handleContinueShopping = () => {
    navigate("/");
  };
  
  const handleTrackOrder = () => {
    // In a real app, this would navigate to an order tracking page
    // For now, just go back to home
    navigate("/");
  };
  
  return (
    <div className="h-screen flex flex-col items-center justify-center px-4 text-center">
      <div className="bg-primary/10 w-24 h-24 rounded-full flex items-center justify-center mb-6">
        <Check className="h-12 w-12 text-primary" />
      </div>
      <h2 className="text-2xl font-display font-bold mb-2">Order Placed!</h2>
      <p className="text-gray-600 mb-6">
        Your order has been placed successfully. 
        {order?.paymentMethod === 'whatsapp' && " We've sent the details to your WhatsApp."}
      </p>
      <p className="text-sm text-gray-500 mb-10">Order #: {orderNumber}</p>
      <Button 
        className="w-full bg-primary text-white font-medium py-3.5 rounded-full mb-3"
        onClick={handleContinueShopping}
      >
        Continue Shopping
      </Button>
      <Button 
        variant="outline"
        className="w-full border border-primary text-primary font-medium py-3.5 rounded-full"
        onClick={handleTrackOrder}
      >
        Track Order
      </Button>
    </div>
  );
}
