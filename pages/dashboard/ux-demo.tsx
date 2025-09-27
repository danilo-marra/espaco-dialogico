import Head from "next/head";
import { useState } from "react";
import {
  ExampleDashboardWithUX,
  ExampleTerapeutasListWithUX,
  ExampleFormWithUX,
  ExampleTableWithUX,
  ExampleHOCUsage,
} from "../../components/common/UXExamples";

export default function UXDemo() {
  const [activeTab, setActiveTab] = useState("dashboard");

  const tabs = [
    {
      id: "dashboard",
      label: "🏠 Dashboard",
      component: <ExampleDashboardWithUX />,
    },
    {
      id: "list",
      label: "👥 Lista de Terapeutas",
      component: <ExampleTerapeutasListWithUX />,
    },
    { id: "form", label: "📝 Formulário", component: <ExampleFormWithUX /> },
    { id: "table", label: "📊 Tabela", component: <ExampleTableWithUX /> },
    { id: "hoc", label: "⚡ HOC Examples", component: <ExampleHOCUsage /> },
  ];

  return (
    <>
      <Head>
        <title>UX Improvements Demo - Espaço Dialógico</title>
        <meta
          name="description"
          content="Demonstração das melhorias de UX implementadas"
        />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-6">
              <h1 className="text-3xl font-bold text-gray-900">
                🎨 UX Improvements Demo
              </h1>
              <p className="mt-2 text-lg text-gray-600">
                Demonstração das melhorias de experiência do usuário
                implementadas
              </p>

              {/* Status Badge */}
              <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                ✅ Prioridade 3 - Implementada
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200
                    ${
                      activeTab === tab.id
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }
                  `}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Features Overview */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg border shadow-sm">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  🔄
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Loading States
                </h3>
              </div>
              <p className="text-gray-600 text-sm">
                Loading states específicos por seção com cores e ícones
                contextuais para melhor feedback visual.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg border shadow-sm">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  🚨
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Error Boundaries
                </h3>
              </div>
              <p className="text-gray-600 text-sm">
                Captura de erros com UI de recuperação, logging detalhado e
                experiência de fallback.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg border shadow-sm">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  🦴
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Skeleton Loading
                </h3>
              </div>
              <p className="text-gray-600 text-sm">
                Skeleton loading avançado com animações shimmer para melhor
                percepção de performance.
              </p>
            </div>
          </div>

          {/* Demo Content */}
          <div className="bg-white rounded-lg border shadow-sm">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                {tabs.find((tab) => tab.id === activeTab)?.label}
              </h2>

              {/* Active Demo Component */}
              {tabs.find((tab) => tab.id === activeTab)?.component}
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">
              💡 Como testar as melhorias:
            </h3>
            <ul className="list-disc list-inside space-y-2 text-blue-800 text-sm">
              <li>
                <strong>Loading States:</strong> Clique em
                &ldquo;Atualizar&rdquo; na aba de Terapeutas para ver o loading
                contextual
              </li>
              <li>
                <strong>Error Boundaries:</strong> Os componentes capturam erros
                automaticamente e mostram UI de recuperação
              </li>
              <li>
                <strong>Skeleton Loading:</strong> Observe a animação shimmer
                durante o carregamento inicial
              </li>
              <li>
                <strong>Performance:</strong> Note a percepção de carregamento
                mais rápida com skeleton
              </li>
              <li>
                <strong>Consistência:</strong> Todos os componentes seguem o
                mesmo padrão visual
              </li>
            </ul>
          </div>

          {/* Implementation Guide */}
          <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              🚀 Implementação nos componentes existentes:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">
                  Método 1: Wrapper Components
                </h4>
                <pre className="bg-white p-3 rounded border text-xs overflow-x-auto">
                  {`import { APIDataWrapper } from '@/components/common/UXImprovements';

<APIDataWrapper loading={loading} dataType="terapeutas">
  {/* Seu componente aqui */}
</APIDataWrapper>`}
                </pre>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">
                  Método 2: Higher Order Component
                </h4>
                <pre className="bg-white p-3 rounded border text-xs overflow-x-auto">
                  {`import { withUXImprovements } from '@/components/common/UXImprovements';

const ComponentWithUX = withUXImprovements(MyComponent, {
  errorBoundary: true,
  loadingType: 'api'
});`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
