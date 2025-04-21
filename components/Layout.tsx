import React from "react";
import Menu from "./Menu";
import Header from "./Header";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex flex-col md:flex-row min-h-screen w-full">
      <Menu />
      <div className="flex-1 flex flex-col w-full overflow-x-hidden">
        <Header />
        <main className="flex-1 p-4">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
