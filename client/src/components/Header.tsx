import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useCart } from "@/context/CartContext";
import { Menu, Search, ShoppingBag } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Header() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { count } = useCart();
  const [location] = useLocation();
  
  // Don't show header on confirmation page
  if (location.startsWith("/confirmation")) {
    return null;
  }
  
  return (
    <header className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="p-2 text-gray-700">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <div className="py-6">
                <h2 className="text-xl font-display font-semibold mb-6">Chic Boutique</h2>
                <nav className="space-y-4">
                  <Link href="/">
                    <span className="block py-2 text-lg cursor-pointer">Home</span>
                  </Link>
                  <Link href="/category/dresses">
                    <span className="block py-2 text-lg cursor-pointer">Dresses</span>
                  </Link>
                  <Link href="/cart">
                    <span className="block py-2 text-lg cursor-pointer">Shopping Bag</span>
                  </Link>
                  <Link href="#">
                    <span className="block py-2 text-lg cursor-pointer">New Arrivals</span>
                  </Link>
                  <Link href="#">
                    <span className="block py-2 text-lg cursor-pointer">Sale</span>
                  </Link>
                  <Link href="#">
                    <span className="block py-2 text-lg cursor-pointer">About Us</span>
                  </Link>
                  <Link href="#">
                    <span className="block py-2 text-lg cursor-pointer">Contact</span>
                  </Link>
                  <Link href="/admin">
                    <span className="block py-2 text-lg cursor-pointer">Admin Panel</span>
                  </Link>
                </nav>
              </div>
            </SheetContent>
          </Sheet>
          <Link href="/">
            <span className="text-lg font-display font-semibold cursor-pointer">Chic Boutique</span>
          </Link>
        </div>
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="p-2 text-gray-700" 
            onClick={() => setIsSearchOpen(!isSearchOpen)}
          >
            <Search className="h-5 w-5" />
            <span className="sr-only">Search</span>
          </Button>
          <Link href="/cart">
            <span className="p-2 text-gray-700 relative cursor-pointer inline-block">
              <ShoppingBag className="h-5 w-5" />
              {count > 0 && (
                <span className={cn(
                  "absolute -top-2 -right-2 bg-primary text-white text-xs font-bold rounded-full h-5 w-5",
                  "flex items-center justify-center"
                )}>
                  {count}
                </span>
              )}
            </span>
          </Link>
        </div>
      </div>
      
      {/* Search input - show/hide based on isSearchOpen */}
      <div className={`${isSearchOpen ? 'block' : 'hidden'} px-4 py-3 border-t border-gray-100`}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search for products..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            autoFocus
          />
        </div>
      </div>
    </header>
  );
}
