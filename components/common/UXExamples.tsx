// Exemplo de como usar os UX Improvements nos componentes existentes

import React from "react";
import {
  DashboardUXWrapper,
  ChartUXWrapper,
  APIDataWrapper,
  FormUXWrapper,
  TableUXWrapper,
  useUXState,
  withUXImprovements,
} from "../common/UXImprovements";

// Exemplo 1: Dashboard com UX melhorado
export function ExampleDashboardWithUX() {
  const { loading, stopLoading } = useUXState(true);

  React.useEffect(() => {
    // Simular carregamento
    const timer = setTimeout(() => {
      stopLoading();
    }, 2000);

    return () => clearTimeout(timer);
  }, [stopLoading]);

  return (
    <DashboardUXWrapper loading={loading} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Cards de estatísticas com UX */}
        <APIDataWrapper loading={loading} dataType="financeiro">
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="text-lg font-semibold mb-2">Receita Total</h3>
            <p className="text-3xl font-bold text-green-600">R$ 15.420</p>
            <p className="text-sm text-gray-500">↗ +12% este mês</p>
          </div>
        </APIDataWrapper>

        {/* Outros cards... */}
      </div>

      {/* Gráficos com UX melhorado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartUXWrapper loading={loading} chartType="bar">
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="text-lg font-semibold mb-4">
              Sessões por Terapeuta
            </h3>
            {/* Gráfico aqui */}
            <div className="h-64 bg-gray-100 rounded flex items-center justify-center">
              Gráfico de Barras
            </div>
          </div>
        </ChartUXWrapper>

        <ChartUXWrapper loading={loading} chartType="line">
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="text-lg font-semibold mb-4">Evolução Mensal</h3>
            {/* Gráfico aqui */}
            <div className="h-64 bg-gray-100 rounded flex items-center justify-center">
              Gráfico de Linha
            </div>
          </div>
        </ChartUXWrapper>
      </div>
    </DashboardUXWrapper>
  );
}

// Exemplo 2: Lista de Terapeutas com UX
export function ExampleTerapeutasListWithUX() {
  const { loading, startLoading, stopLoading } = useUXState();

  const handleRefresh = () => {
    startLoading();
    // Simular API call
    setTimeout(() => {
      stopLoading();
    }, 1500);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Terapeutas</h2>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Atualizar
        </button>
      </div>

      <APIDataWrapper loading={loading} dataType="terapeutas">
        <div className="bg-white rounded-lg border divide-y">
          {[1, 2, 3, 4].map((id) => (
            <div key={id} className="p-4 flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                T{id}
              </div>
              <div className="flex-1">
                <h3 className="font-medium">Terapeuta {id}</h3>
                <p className="text-sm text-gray-500">
                  terapeuta{id}@exemplo.com
                </p>
              </div>
              <div className="flex space-x-2">
                <button className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200">
                  Editar
                </button>
                <button className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200">
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      </APIDataWrapper>
    </div>
  );
}

// Exemplo 3: Formulário com UX melhorado
export function ExampleFormWithUX() {
  const { loading } = useUXState();
  const [saving, setSaving] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    // Simular salvamento
    setTimeout(() => {
      setSaving(false);
      alert("Dados salvos com sucesso!");
    }, 2000);
  };

  return (
    <FormUXWrapper loading={loading} saving={saving}>
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg border space-y-6"
      >
        <h2 className="text-xl font-semibold">Novo Terapeuta</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome completo
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Digite o nome completo"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Digite o email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Especialidade
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="">Selecione uma especialidade</option>
              <option value="psicologia">Psicologia</option>
              <option value="terapia">Terapia</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t">
          <button
            type="button"
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </form>
    </FormUXWrapper>
  );
}

// Exemplo 4: Tabela com UX melhorado
export function ExampleTableWithUX() {
  const { loading, stopLoading } = useUXState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => stopLoading(), 1500);
    return () => clearTimeout(timer);
  }, [stopLoading]);

  return (
    <TableUXWrapper loading={loading} rows={6} columns={4}>
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="bg-gray-50 px-6 py-3 border-b">
          <h3 className="text-lg font-semibold">Agendamentos Recentes</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Paciente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Terapeuta
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {[1, 2, 3, 4, 5].map((id) => (
                <tr key={id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      Paciente {id}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">Terapeuta {id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">2025-09-27</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      Confirmado
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </TableUXWrapper>
  );
}

// Exemplo 5: Componente com HOC
const SimpleCard = ({ title, content }: { title: string; content: string }) => (
  <div className="bg-white p-6 rounded-lg border">
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <p className="text-gray-600">{content}</p>
  </div>
);

// Aplicar UX improvements automaticamente
export const CardWithUX = withUXImprovements(SimpleCard, {
  errorBoundary: true,
  suspense: true,
  loadingType: "api",
  skeletonType: "list",
});

// Exemplo de uso do HOC
export function ExampleHOCUsage() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <CardWithUX
        title="Card Melhorado"
        content="Este card agora tem error boundary e skeleton loading automaticamente!"
      />
      <CardWithUX
        title="Outro Card"
        content="Todos os cards têm a mesma experiência consistente."
      />
    </div>
  );
}
