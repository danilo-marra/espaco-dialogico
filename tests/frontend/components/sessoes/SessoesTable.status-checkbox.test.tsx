import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, jest } from "@jest/globals";
import { SessoesTable } from "components/Sessoes/SessoesTable";
import type { Sessao } from "tipos";

const baseDate = new Date("2026-05-21T10:00:00.000Z");

function createSessao(overrides: Partial<Sessao> = {}): Sessao {
  return {
    id: "sessao-1",
    terapeuta_id: "terapeuta-1",
    paciente_id: "paciente-1",
    agendamento_id: "agendamento-1",
    tipoSessao: "Atendimento",
    valorSessao: 150,
    pagamentoRealizado: false,
    repasseRealizado: false,
    notaFiscal: "Não Emitida",
    created_at: baseDate.toISOString(),
    updated_at: baseDate.toISOString(),
    terapeutaInfo: {
      id: "terapeuta-1",
      nome: "Terapeuta Teste",
      telefone: "11999999999",
      email: "terapeuta@test.com",
      dt_entrada: baseDate.toISOString(),
      chave_pix: "pix-teste",
    },
    pacienteInfo: {
      id: "paciente-1",
      nome: "Paciente Teste",
      terapeuta_id: "terapeuta-1",
      nome_responsavel: "Responsável Teste",
      telefone_responsavel: "11988887777",
      nf_nome_completo: "Paciente Teste",
      nf_telefone: "11988887777",
      nf_cpf: "12345678901",
      nf_email: "nf@test.com",
      nf_endereco: "Rua Teste, 123",
      nf_dt_entrada: baseDate.toISOString(),
      dt_entrada: baseDate.toISOString(),
    },
    agendamentoInfo: {
      id: "agendamento-1",
      paciente_id: "paciente-1",
      terapeuta_id: "terapeuta-1",
      dataAgendamento: baseDate.toISOString(),
      horarioAgendamento: "10:00",
      localAgendamento: "Sala Azul",
      modalidadeAgendamento: "Presencial",
      tipoAgendamento: "Sessão",
      valorAgendamento: 150,
      statusAgendamento: "Confirmado",
      observacoesAgendamento: "",
      created_at: baseDate.toISOString(),
      updated_at: baseDate.toISOString(),
    },
    ...overrides,
  };
}

describe("SessoesTable status checkbox", () => {
  afterEach(() => {
    cleanup();
  });

  test("deve renderizar checkbox individual e acionar o handler ao alternar pagamento", async () => {
    const user = userEvent.setup();
    const handleUpdatePagamento = jest.fn();

    render(
      <SessoesTable
        groupedSessoes={{ "terapeuta-1": [createSessao()] }}
        canEdit={true}
        handleEditSessao={jest.fn()}
        handleUpdatePagamento={handleUpdatePagamento}
        handleBulkUpdateRepasse={jest.fn()}
        loadingBulkUpdate={null}
        expandedTherapists={["terapeuta-1"]}
        toggleAccordion={jest.fn()}
        handleBulkUpdatePagamento={jest.fn()}
        loadingBulkPagamento={null}
        loadingPagamentoSessaoId={null}
        expandedPatients={["terapeuta-1-paciente-1"]}
      />,
    );

    const checkbox = screen.getByLabelText(
      /Marcar pagamento da sessão de Paciente Teste/i,
    );

    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();

    await user.click(checkbox);

    expect(handleUpdatePagamento).toHaveBeenCalledWith(
      expect.objectContaining({ id: "sessao-1" }),
      true,
    );
  });

  test("deve desabilitar o checkbox enquanto a sessão estiver em processamento", async () => {
    const user = userEvent.setup();
    const handleUpdatePagamento = jest.fn();

    render(
      <SessoesTable
        groupedSessoes={{ "terapeuta-1": [createSessao()] }}
        canEdit={true}
        handleEditSessao={jest.fn()}
        handleUpdatePagamento={handleUpdatePagamento}
        handleBulkUpdateRepasse={jest.fn()}
        loadingBulkUpdate={null}
        expandedTherapists={["terapeuta-1"]}
        toggleAccordion={jest.fn()}
        handleBulkUpdatePagamento={jest.fn()}
        loadingBulkPagamento={null}
        loadingPagamentoSessaoId={"sessao-1"}
        expandedPatients={["terapeuta-1-paciente-1"]}
      />,
    );

    const checkbox = screen.getByLabelText(
      /Marcar pagamento da sessão de Paciente Teste/i,
    );

    expect(checkbox).toBeDisabled();

    await user.click(checkbox);

    expect(handleUpdatePagamento).not.toHaveBeenCalled();
  });

  test("deve manter rollback visual e nao repetir tentativa automaticamente", async () => {
    const user = userEvent.setup();
    const handleUpdatePagamento = jest.fn();

    const { rerender } = render(
      <SessoesTable
        groupedSessoes={{ "terapeuta-1": [createSessao()] }}
        canEdit={true}
        handleEditSessao={jest.fn()}
        handleUpdatePagamento={handleUpdatePagamento}
        handleBulkUpdateRepasse={jest.fn()}
        loadingBulkUpdate={null}
        expandedTherapists={["terapeuta-1"]}
        toggleAccordion={jest.fn()}
        handleBulkUpdatePagamento={jest.fn()}
        loadingBulkPagamento={null}
        loadingPagamentoSessaoId={null}
        expandedPatients={["terapeuta-1-paciente-1"]}
      />,
    );

    const checkbox = screen.getByLabelText(
      /Marcar pagamento da sessão de Paciente Teste/i,
    );

    await user.click(checkbox);
    expect(handleUpdatePagamento).toHaveBeenCalledTimes(1);

    // Simula estado pendente da tentativa: UI bloqueada e sem novas chamadas.
    rerender(
      <SessoesTable
        groupedSessoes={{ "terapeuta-1": [createSessao()] }}
        canEdit={true}
        handleEditSessao={jest.fn()}
        handleUpdatePagamento={handleUpdatePagamento}
        handleBulkUpdateRepasse={jest.fn()}
        loadingBulkUpdate={null}
        expandedTherapists={["terapeuta-1"]}
        toggleAccordion={jest.fn()}
        handleBulkUpdatePagamento={jest.fn()}
        loadingBulkPagamento={null}
        loadingPagamentoSessaoId={"sessao-1"}
        expandedPatients={["terapeuta-1-paciente-1"]}
      />,
    );

    const pendingCheckbox = screen.getByLabelText(
      /Marcar pagamento da sessão de Paciente Teste/i,
    );
    expect(pendingCheckbox).toBeDisabled();
    expect(pendingCheckbox).not.toBeChecked();

    await user.click(pendingCheckbox);
    expect(handleUpdatePagamento).toHaveBeenCalledTimes(1);

    // Simula resposta de erro com rollback para valor anterior e sem retry automatico.
    rerender(
      <SessoesTable
        groupedSessoes={{ "terapeuta-1": [createSessao()] }}
        canEdit={true}
        handleEditSessao={jest.fn()}
        handleUpdatePagamento={handleUpdatePagamento}
        handleBulkUpdateRepasse={jest.fn()}
        loadingBulkUpdate={null}
        expandedTherapists={["terapeuta-1"]}
        toggleAccordion={jest.fn()}
        handleBulkUpdatePagamento={jest.fn()}
        loadingBulkPagamento={null}
        loadingPagamentoSessaoId={null}
        expandedPatients={["terapeuta-1-paciente-1"]}
      />,
    );

    const rollbackCheckbox = screen.getByLabelText(
      /Marcar pagamento da sessão de Paciente Teste/i,
    );
    expect(rollbackCheckbox).not.toBeChecked();
    expect(handleUpdatePagamento).toHaveBeenCalledTimes(1);
  });
});
