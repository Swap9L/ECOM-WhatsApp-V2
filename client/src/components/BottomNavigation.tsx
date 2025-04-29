import { Link, useLocation } from "wouter";
import { Home, Grid, Heart, User } from "lucide-react";

export default function BottomNavigation() {
  const [location] = useLocation();
  
  // Don't show navigation on confirmation page
  if (location.startsWith("/confirmation")) {
    return null;
  }
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-2 z-50">
      <div className="flex justify-around items-center">
        <Link href="/">
          <a className={`flex flex-col items-center p-2 ${location === "/" ? "text-primary" : "text-gray-500"}`}>
            <Home className="h-5 w-5" />
            <span className="text-xs mt-1">Home</span>
          </a>
        </Link>
        <Link href="/category/dresses">
          <a className={`flex flex-col items-center p-2 ${location.startsWith("/category") ? "text-primary" : "text-gray-500"}`}>
            <Grid className="h-5 w-5" />
            <span className="text-xs mt-1">Categories</span>
          </a>
        </Link>
        <button className="flex flex-col items-center p-2 text-gray-500">
          <Heart className="h-5 w-5" />
          <span className="text-xs mt-1">Wishlist</span>
        </button>
        <button className="flex flex-col items-center p-2 text-gray-500">
          <User className="h-5 w-5" />
          <span className="text-xs mt-1">Account</span>
        </button>
      </div>
    </nav>
  );
}
