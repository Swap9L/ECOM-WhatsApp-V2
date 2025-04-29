import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string | null) {
  if (amount === null) return "";
  
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numAmount);
}

export function calculateDiscount(price: number | string, originalPrice: number | string | null) {
  if (!originalPrice) return null;
  
  const current = typeof price === "string" ? parseFloat(price) : price;
  const original = typeof originalPrice === "string" ? parseFloat(originalPrice) : originalPrice;
  
  if (current >= original) return null;
  
  const discount = Math.round(((original - current) / original) * 100);
  return `-${discount}%`;
}

export function generateWhatsAppUrl(order: any) {
  const phoneNumber = order.phoneNumber.replace(/\D/g, "");
  
  const items = order.items.map((item: any) => 
    `${item.quantity}x ${item.title} (${item.size}, ${item.color}) - ${formatCurrency(item.price)}`
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
  
  return `https://wa.me/${phoneNumber}?text=${message}`;
}
