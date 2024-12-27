import React from "react";
import Menu from "./Menu";
import Header from "./Header";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex min-h-screen">
      <Menu />
      <div className="flex-1">
        <Header />
        {children}
      </div>
    </div>
  );
};

export default Layout;
