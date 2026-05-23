import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { DashboardPendencias } from "components/Dashboard/DashboardPendencias";

jest.mock("hooks/useDashboardPendencias", () => ({
  useDashboardPendencias: jest.fn(),
}));

const mockedUseDashboardPendencias = jest.requireMock(
  "hooks/useDashboardPendencias",
).useDashboardPendencias as jest.Mock;

describe("DashboardPendencias", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renderiza loading enquanto carrega dados", () => {
    mockedUseDashboardPendencias.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });

    const { container } = render(
      <DashboardPendencias selectedPeriod="2026-05" />,
    );

    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(
      0,
    );
  });

  test("renderiza cards de pendências e links com período", () => {
    mockedUseDashboardPendencias.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        periodo: "2026-05",
        resumo: {
          pacientesACobrar: 1,
          notasFiscaisPendentes: 1,
          marcacoesPendentes: 1,
          repassesPendentes: 1,
        },
        pacientesACobrar: [
          {
            id: "pac-1",
            nome: "Paciente 1",
            terapeutaNome: "Terapeuta 1",
            totalSessoes: 2,
            dataReferencia: "2026-05-10",
          },
        ],
        notasFiscaisPendentes: [
          {
            id: "pac-2",
            nome: "Paciente 2",
            terapeutaNome: "Terapeuta 2",
            totalSessoes: 1,
            dataReferencia: "2026-05-11",
          },
        ],
        marcacoesPendentes: [
          {
            id: "pac-3",
            nome: "Paciente 3",
            terapeutaNome: "Terapeuta 3",
            dataReferencia: "2026-04-30",
          },
        ],
        repassesPendentes: [
          {
            id: "ter-1",
            nome: "Terapeuta 1",
            totalSessoes: 3,
            totalRepasse: 1200,
          },
        ],
      },
    });

    render(<DashboardPendencias selectedPeriod="2026-05" />);

    expect(screen.getByText("Pendências do mês")).toBeInTheDocument();
    expect(screen.getByText("Paciente 1")).toBeInTheDocument();
    expect(screen.getByText("Paciente 2")).toBeInTheDocument();
    expect(screen.getByText("Paciente 3")).toBeInTheDocument();
    expect(screen.getByText("Terapeuta 1")).toBeInTheDocument();

    const links = screen.getAllByRole("link", { name: "Ver todos" });
    expect(links).toHaveLength(4);
    expect(links[0]).toHaveAttribute(
      "href",
      "/dashboard/sessoes?status=Pagamento%20Pendente&periodo=2026-05",
    );
  });
});
