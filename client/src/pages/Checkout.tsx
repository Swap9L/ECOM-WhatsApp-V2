import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useCart } from "@/context/CartContext";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const formSchema = z.object({
  customerName: z.string().min(3, "Name must be at least 3 characters"),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
  address: z.string().min(10, "Address must be at least 10 characters"),
  paymentMethod: z.enum(["cashOnDelivery", "bankTransfer", "whatsapp"])
});

type FormValues = z.infer<typeof formSchema>;

export default function Checkout() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const { toast } = useToast();
  const { items, subtotal, shipping, tax, total, clearCart } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Check if coming from WhatsApp button
  const isViaWhatsapp = new URLSearchParams(search).get('via') === 'whatsapp';
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerName: "",
      phoneNumber: "",
      address: "",
      paymentMethod: isViaWhatsapp ? "whatsapp" : "cashOnDelivery"
    }
  });
  
  const createOrderMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      return apiRequest("POST", "/api/orders", data);
    },
    onSuccess: async (response) => {
      const order = await response.json();
      
      // Clear the cart
      await clearCart();
      
      // If payment method is WhatsApp, open WhatsApp with order details
      if (order.paymentMethod === 'whatsapp') {
        // The WhatsApp integration happens on the server
        // But we can also provide a direct link as a backup
        const phoneNumber = order.phoneNumber.replace(/\D/g, "");
        
        // Create WhatsApp message with order details
        const items = order.items.map((item: any) => 
          `${item.quantity}x ${item.title} (${item.size || 'N/A'}, ${item.color || 'N/A'}) - ${formatCurrency(item.price)}`
        ).join("\n");
        
        const message = encodeURIComponent(
          `*Order #${order.orderNumber}*\n\n` +
          `*Items:*\n${items}\n\n` +
          `*Subtotal:* ${formatCurrency(order.subtotal)}\n` +
          `*Shipping:* ${formatCurrency(order.shipping)}\n` +
          `*Tax:* ${formatCurrency(order.tax)}\n` +
          `*Total:* ${formatCurrency(order.total)}\n\n` +
          `*Shipping Address:*\n${order.address}\n\n` +
          `*Payment Method:* ${order.paymentMethod}\n\n` +
          `Thank you for shopping with Chic Boutique!`
        );
        
        // Open WhatsApp in a new tab
        window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
      }
      
      // Navigate to confirmation page
      navigate(`/confirmation/${order.orderNumber}`);
    },
    onError: (error) => {
      console.error("Order error:", error);
      toast({
        title: "Error",
        description: "There was a problem placing your order. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  });
  
  const onSubmit = async (data: FormValues) => {
    if (items.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Your cart is empty. Add items before checking out.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await createOrderMutation.mutateAsync(data);
    } catch (error) {
      console.error("Checkout error:", error);
      setIsSubmitting(false);
    }
  };
  
  return (
    <div>
      <div className="bg-white px-4 py-4 shadow-sm">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon"
            className="mr-3 text-gray-700" 
            onClick={() => navigate("/cart")}
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h2 className="text-xl font-display font-semibold">Checkout</h2>
        </div>
      </div>

      <div className="px-4 py-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Delivery Information */}
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-4">Delivery Information</h3>
              
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="customerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter your full name" 
                          {...field} 
                          className="px-3 py-3"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter your phone number" 
                          type="tel"
                          {...field} 
                          className="px-3 py-3"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter your address" 
                          rows={3}
                          {...field} 
                          className="px-3 py-3"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Payment Method */}
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-4">Payment Method</h3>
              
              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <RadioGroup 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        className="space-y-3"
                      >
                        <div className="flex items-center border border-gray-300 p-3 rounded-lg">
                          <RadioGroupItem value="cashOnDelivery" id="cashOnDelivery" className="text-primary" />
                          <Label htmlFor="cashOnDelivery" className="ml-3 font-medium cursor-pointer flex-1">
                            Cash on Delivery
                          </Label>
                        </div>
                        
                        <div className="flex items-center border border-gray-300 p-3 rounded-lg">
                          <RadioGroupItem value="bankTransfer" id="bankTransfer" className="text-primary" />
                          <Label htmlFor="bankTransfer" className="ml-3 font-medium cursor-pointer flex-1">
                            Bank Transfer
                          </Label>
                        </div>
                        
                        <div className="flex items-center border border-gray-300 p-3 rounded-lg">
                          <RadioGroupItem value="whatsapp" id="whatsapp" className="text-primary" />
                          <Label htmlFor="whatsapp" className="ml-3 font-medium cursor-pointer flex-1 flex items-center">
                            <svg 
                              viewBox="0 0 24 24" 
                              className="h-5 w-5 mr-2 text-green-500" 
                              fill="currentColor"
                            >
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                            WhatsApp Payment
                          </Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Order Summary */}
            <div className="bg-gray-50 p-4 rounded-lg mb-10">
              <h3 className="text-lg font-medium mb-3">Order Summary</h3>
              
              <div className="text-sm">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Subtotal ({items.length} items)</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Shipping</span>
                  <span>{formatCurrency(shipping)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Tax</span>
                  <span>{formatCurrency(tax)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-300 mt-2">
                  <span className="font-medium">Total</span>
                  <span className="font-semibold">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full py-3.5 rounded-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Processing..." : "Place Order"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
