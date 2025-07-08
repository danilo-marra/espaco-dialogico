// Teste para verificar se o cálculo de recorrências está correto
// Replicando exatamente a lógica corrigida no NovoAgendamentoModal

function calcularNumeroRecorrencias(
  dataInicio,
  dataFim,
  diasDaSemana,
  periodicidade,
) {
  if (!dataInicio || !dataFim || !diasDaSemana || diasDaSemana.length === 0) {
    return { recorrencias: 0, limitado: false };
  }

  const inicio = new Date(dataInicio);
  const fim = new Date(dataFim);

  if (inicio >= fim) return { recorrencias: 0, limitado: false };

  // Mapear dias da semana para números
  const diasDaSemanaMap = {
    Domingo: 0,
    "Segunda-feira": 1,
    "Terça-feira": 2,
    "Quarta-feira": 3,
    "Quinta-feira": 4,
    "Sexta-feira": 5,
    Sábado: 6,
  };

  const diasDaSemanaNumeros = diasDaSemana.map((dia) => diasDaSemanaMap[dia]);

  // Determinar o intervalo da periodicidade (igual à API)
  const intervaloDias = periodicidade === "Semanal" ? 7 : 14;

  // Contar agendamentos usando a mesma lógica da API
  const dataAgendamentos = [];
  let currentDate = new Date(inicio);

  while (currentDate <= fim) {
    const diaDaSemana = currentDate.getDay();

    if (diasDaSemanaNumeros.includes(diaDaSemana)) {
      dataAgendamentos.push(new Date(currentDate));
    }

    // CORREÇÃO CRÍTICA: Usar a mesma lógica da API para avançar datas
    // Se adicionamos um agendamento, avançar pelo intervalo da periodicidade
    // Se não adicionamos, avançar apenas 1 dia
    if (
      dataAgendamentos.length > 0 &&
      dataAgendamentos[dataAgendamentos.length - 1].getTime() ===
        currentDate.getTime()
    ) {
      // Adicionar o intervalo completo quando encontramos um dia válido
      currentDate = new Date(currentDate);
      currentDate.setDate(currentDate.getDate() + intervaloDias);
    } else {
      // Caso contrário, avançar apenas um dia para verificar o próximo
      currentDate = new Date(currentDate);
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  const numeroRecorrencias = dataAgendamentos.length;

  // Limite máximo de 35 agendamentos
  const LIMITE_MAXIMO = 35;
  const limitado = numeroRecorrencias > LIMITE_MAXIMO;
  const numeroFinal = limitado ? LIMITE_MAXIMO : numeroRecorrencias;

  return {
    recorrencias: numeroFinal,
    original: numeroRecorrencias,
    limitado,
    datas: dataAgendamentos.slice(0, numeroFinal),
  };
}

// Teste do cenário reportado pelo usuário
console.log("=== TESTE: Cenário que deveria retornar 5 agendamentos ===");

// Exemplo: Segunda a Sexta, semanal, por 5 semanas
const dataInicio = new Date(2024, 0, 1); // 1º janeiro 2024 (segunda-feira)
const dataFim = new Date(2024, 1, 2); // 2 fevereiro 2024 (mais de 5 semanas)
const diasSelecionados = ["Segunda-feira"];
const periodicidade = "Semanal";

const resultado = calcularNumeroRecorrencias(
  dataInicio,
  dataFim,
  diasSelecionados,
  periodicidade,
);

console.log("Data início:", dataInicio.toLocaleDateString("pt-BR"));
console.log("Data fim:", dataFim.toLocaleDateString("pt-BR"));
console.log("Dias selecionados:", diasSelecionados);
console.log("Periodicidade:", periodicidade);
console.log("Número de recorrências calculado:", resultado.recorrencias);
console.log("Datas geradas:");
resultado.datas.forEach((data, index) => {
  console.log(
    `  ${index + 1}. ${data.toLocaleDateString("pt-BR")} (${["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][data.getDay()]})`,
  );
});

console.log("\n=== TESTE: Múltiplos dias da semana ===");

// Teste com múltiplos dias
const resultadoMultiplo = calcularNumeroRecorrencias(
  new Date(2024, 0, 1), // 1º janeiro 2024 (segunda-feira)
  new Date(2024, 0, 21), // 21 janeiro 2024 (3 semanas)
  ["Segunda-feira", "Quarta-feira", "Sexta-feira"],
  "Semanal",
);

console.log("Data início:", new Date(2024, 0, 1).toLocaleDateString("pt-BR"));
console.log("Data fim:", new Date(2024, 0, 21).toLocaleDateString("pt-BR"));
console.log("Dias selecionados:", [
  "Segunda-feira",
  "Quarta-feira",
  "Sexta-feira",
]);
console.log("Múltiplos dias - Recorrências:", resultadoMultiplo.recorrencias);
console.log("Datas geradas:");
resultadoMultiplo.datas.forEach((data, index) => {
  console.log(
    `  ${index + 1}. ${data.toLocaleDateString("pt-BR")} (${["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][data.getDay()]})`,
  );
});

console.log("\n=== TESTE FINAL: Cenários importantes ===");

// Teste 1: Segunda-feira semanal por 5 semanas (deve dar 5)
console.log("\n1. Segunda-feira, semanal, 5 semanas:");
const teste1 = calcularNumeroRecorrencias(
  new Date(2024, 0, 1), // 1º janeiro 2024 (segunda-feira)
  new Date(2024, 0, 29), // 29 janeiro 2024 (ainda na 5ª semana)
  ["Segunda-feira"],
  "Semanal",
);
console.log(`Resultado: ${teste1.recorrencias} agendamentos`);

// Teste 2: Segunda e Quarta, semanal, 2 semanas (deve dar 4)
console.log("\n2. Segunda e Quarta, semanal, 2 semanas:");
const teste2 = calcularNumeroRecorrencias(
  new Date(2024, 0, 1), // 1º janeiro 2024 (segunda-feira)
  new Date(2024, 0, 14), // 14 janeiro 2024 (2 semanas completas)
  ["Segunda-feira", "Quarta-feira"],
  "Semanal",
);
console.log(`Resultado: ${teste2.recorrencias} agendamentos`);
console.log("Datas geradas:");
teste2.datas.forEach((data, index) => {
  console.log(
    `  ${index + 1}. ${data.toLocaleDateString("pt-BR")} (${["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][data.getDay()]})`,
  );
});

// Teste 3: Sexta-feira quinzenal por 1 mês (deve dar 2)
console.log("\n3. Sexta-feira, quinzenal, 1 mês:");
const teste3 = calcularNumeroRecorrencias(
  new Date(2024, 0, 5), // 5 janeiro 2024 (sexta-feira)
  new Date(2024, 1, 5), // 5 fevereiro 2024 (1 mês depois)
  ["Sexta-feira"],
  "Quinzenal",
);
console.log(`Resultado: ${teste3.recorrencias} agendamentos`);
console.log("Datas geradas:");
teste3.datas.forEach((data, index) => {
  console.log(
    `  ${index + 1}. ${data.toLocaleDateString("pt-BR")} (${["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][data.getDay()]})`,
  );
});

console.log("\n=== CONCLUSÃO ===");
console.log("A lógica corrigida agora:");
console.log("- Usa o mesmo algoritmo da API");
console.log("- Avança pela periodicidade quando encontra dia válido");
console.log("- Avança 1 dia quando não encontra");
console.log("- Deveria retornar exatamente o mesmo número que a API criará");
