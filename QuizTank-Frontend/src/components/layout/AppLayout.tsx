import { ReactNode } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface AppLayoutProps {
  children: ReactNode;
  isLoggedIn?: boolean;
  username?: string;
}

const AppLayout = ({ children, isLoggedIn = false, username = "" }: AppLayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar isLoggedIn={isLoggedIn} username={username} />
      <main className="flex-1 pt-16">{children}</main>
      <Footer />
    </div>
  );
};

export default AppLayout;
