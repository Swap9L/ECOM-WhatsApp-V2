import { ReactNode } from "react";
import Header from "./Header";
import BottomNavigation from "./BottomNavigation";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-1 pt-14 pb-20">
        {children}
      </main>
      <BottomNavigation />
    </div>
  );
}
