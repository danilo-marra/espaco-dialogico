import React from "react";
import Menu from "./Menu";
import Header from "./Header";
import RouteGuard from "./RouteGuard";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <RouteGuard>
      <div className="flex flex-col md:flex-row min-h-screen w-full">
        <Menu />
        <div className="flex-1 flex flex-col w-full min-w-0">
          <Header />
          <main className="flex-1 p-4 overflow-x-auto">{children}</main>
        </div>
      </div>
    </RouteGuard>
  );
};

export default Layout;
