import { useState } from "react";
import { Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { useCart } from "@/context/CartContext";

interface CartItemProps {
  item: {
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
}

export default function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeItem } = useCart();
  const [isDeleting, setIsDeleting] = useState(false);
  
  const handleUpdateQuantity = (newQuantity: number) => {
    if (newQuantity < 1) newQuantity = 1;
    updateQuantity(item.id, newQuantity);
  };
  
  const handleRemove = async () => {
    setIsDeleting(true);
    await removeItem(item.id);
    setIsDeleting(false);
  };
  
  const itemTotal = parseFloat(item.product.price) * item.quantity;
  
  return (
    <div className="flex border-b border-gray-200 pb-4 mb-4">
      <img 
        src={item.product.images[0]} 
        className="h-24 w-20 object-cover rounded" 
        alt={item.product.title} 
      />
      <div className="ml-4 flex-1">
        <div className="flex justify-between">
          <div>
            <h4 className="font-medium">{item.product.title}</h4>
            <p className="text-sm text-gray-500">
              {item.size && `Size: ${item.size}`} 
              {item.color && item.size && ' | '} 
              {item.color && `Color: ${item.color}`}
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-gray-400 h-8 w-8"
            disabled={isDeleting}
            onClick={handleRemove}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex justify-between items-center mt-2">
          <div className="flex items-center border border-gray-300 rounded">
            <Button 
              variant="ghost" 
              size="sm" 
              className="px-2 py-1 h-8 text-gray-600"
              onClick={() => handleUpdateQuantity(item.quantity - 1)}
              disabled={item.quantity <= 1}
            >
              −
            </Button>
            <span className="px-2 text-sm">{item.quantity}</span>
            <Button 
              variant="ghost" 
              size="sm" 
              className="px-2 py-1 h-8 text-gray-600"
              onClick={() => handleUpdateQuantity(item.quantity + 1)}
            >
              +
            </Button>
          </div>
          <p className="font-medium">{formatCurrency(itemTotal)}</p>
        </div>
      </div>
    </div>
  );
}
