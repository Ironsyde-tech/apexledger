import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { GlobalSearch } from "@/components/GlobalSearch";

export const SiteLayout = () => (
  <div className="min-h-screen flex flex-col">
    <Navbar />
    <GlobalSearch />
    <main className="flex-1">
      <Outlet />
    </main>
    <Footer />
  </div>
);
