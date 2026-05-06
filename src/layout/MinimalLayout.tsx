import { Outlet } from "react-router";
import AppHeader from "./AppHeader";
import { SidebarProvider } from "../context/SidebarContext";

const LayoutContent: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <div className="flex-1 p-4 mx-auto max-w-screen-2xl md:p-6 w-full">
        <Outlet />
      </div>
    </div>
  );
};

const MinimalLayout: React.FC = () => {
  return (
    <SidebarProvider>
      <LayoutContent />
    </SidebarProvider>
  );
};

export default MinimalLayout;
