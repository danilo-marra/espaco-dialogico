import Head from "next/head";
import useAuth from "../../hooks/useAuth";
import { useRouter } from "next/router";

export default function Dashboard() {
  const { loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-medium mb-2">Carregando...</h2>
          <div className="w-8 h-8 border-4 border-t-azul rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Dashboard - Espaço Dialógico</title>
      </Head>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4 text-azul">Dashboard</h1>
        <div className="bg-white rounded-md shadow p-4 mb-6">
          <p>Use o menu lateral para navegar pelo sistema.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-bold mb-2 text-azul">Terapeutas</h2>
            <p className="text-gray-600">Gerencie os terapeutas do sistema</p>
            <button
              onClick={() => router.push("/dashboard/terapeutas")}
              className="mt-4 px-4 py-2 bg-azul hover:bg-azul/75 text-white rounded-md"
            >
              Ver Terapeutas
            </button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-bold mb-2 text-azul">Pacientes</h2>
            <p className="text-gray-600">Gerencie os pacientes do sistema</p>
            <button
              onClick={() => router.push("/dashboard/pacientes")}
              className="mt-4 px-4 py-2 bg-azul hover:bg-azul/75 text-white rounded-md"
            >
              Ver Pacientes
            </button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-bold mb-2 text-azul">Agenda</h2>
            <p className="text-gray-600">Gerencie as sessões e compromissos</p>
            <button
              onClick={() => router.push("/dashboard/agenda")}
              className="mt-4 px-4 py-2 bg-azul hover:bg-azul/75 text-white rounded-md"
            >
              Ver Agenda
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
