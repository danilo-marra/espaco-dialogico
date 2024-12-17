import React from "react";
import Link from "next/link";

function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            <div className="text-lg font-semibold">Dashboard</div>
            <div className="flex space-x-4">
              <Link href="/">
                <a className="text-gray-700 hover:text-gray-900">Home</a>
              </Link>
              <Link href="/agenda">
                <a className="text-gray-700 hover:text-gray-900">Agenda</a>
              </Link>
              <Link href="/transacoes">
                <a className="text-gray-700 hover:text-gray-900">Transações</a>
              </Link>
              <Link href="/pacientes">
                <a className="text-gray-700 hover:text-gray-900">Pacientes</a>
              </Link>
              <Link href="/sessoes">
                <a className="text-gray-700 hover:text-gray-900">Sessões</a>
              </Link>
              <Link href="/terapeutas">
                <a className="text-gray-700 hover:text-gray-900">Terapeutas</a>
              </Link>
            </div>
          </div>
        </div>
      </nav>
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
        {/* Add your dashboard content here */}
      </main>
    </div>
  );
}

export default Dashboard;
