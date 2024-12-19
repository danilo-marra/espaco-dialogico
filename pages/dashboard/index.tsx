import React from "react";
import { Menu } from "./components/Menu";
import { Header } from "./components/Header";

export default function Dashboard() {
  return (
    <div className="flex min-h-screen">
      <Menu />

      <div className="flex-1">
        <Header />
      </div>
    </div>
  );
}
