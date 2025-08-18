const fs = require("fs");
const path = require("path");
const xlsx = require("xlsx");

function makeSheet(headers, exampleRow) {
  const ws = xlsx.utils.aoa_to_sheet([headers, exampleRow]);
  return ws;
}

function main() {
  const wb = xlsx.utils.book_new();

  const terapeutaHeaders = [
    "nome",
    "telefone",
    "email", // chave única
    "crp",
    "dt_nascimento", // DD/MM/AAAA
    "dt_entrada", // DD/MM/AAAA
    "chave_pix",
    "foto",
    "curriculo_arquivo",
  ];
  const terapeutaExample = [
    "Maria Silva",
    "11999999999",
    "maria.silva@espacodialogico.com.br",
    "CRP 06/12345",
    "10/05/1988",
    "01/03/2023",
    "chave-pix-exemplo@banco.com",
    "",
    "",
  ];
  const terapeutasSheet = makeSheet(terapeutaHeaders, terapeutaExample);
  // Comentários e larguras
  addHeaderComment(terapeutasSheet, 4, "Data no formato DD/MM/AAAA"); // dt_nascimento (col E)
  addHeaderComment(terapeutasSheet, 5, "Data no formato DD/MM/AAAA"); // dt_entrada (col F)
  terapeutasSheet["!cols"] = [
    { wch: 25 }, // nome
    { wch: 14 }, // telefone
    { wch: 35 }, // email
    { wch: 14 }, // crp
    { wch: 12 }, // dt_nascimento
    { wch: 12 }, // dt_entrada
    { wch: 26 }, // chave_pix
    { wch: 10 }, // foto
    { wch: 26 }, // curriculo_arquivo
  ];
  xlsx.utils.book_append_sheet(wb, terapeutasSheet, "Terapeutas");

  const pacienteHeaders = [
    "nome",
    "dt_nascimento", // DD/MM/AAAA
    "terapeuta_email", // recomendado
    "terapeuta_id", // alternativo
    "nome_responsavel",
    "telefone_responsavel",
    "email_responsavel",
    "cpf_responsavel", // chave única do responsável
    "endereco_responsavel",
    "origem", // Indicação | Instagram | Busca no Google | Outros
    "dt_entrada", // DD/MM/AAAA
  ];
  const pacienteExample = [
    "João Souza",
    "12/09/2015",
    "maria.silva@espacodialogico.com.br",
    "",
    "Ana Souza",
    "11988887777",
    "ana.souza@example.com",
    "12345678901",
    "Rua Exemplo, 123 - São Paulo",
    "Indicação",
    "01/02/2024",
  ];
  const pacientesSheet = makeSheet(pacienteHeaders, pacienteExample);
  addHeaderComment(pacientesSheet, 1, "Data no formato DD/MM/AAAA"); // dt_nascimento (col B)
  addHeaderComment(pacientesSheet, 10, "Data no formato DD/MM/AAAA"); // dt_entrada (col K)
  pacientesSheet["!cols"] = [
    { wch: 22 }, // nome
    { wch: 12 }, // dt_nascimento
    { wch: 35 }, // terapeuta_email
    { wch: 38 }, // terapeuta_id
    { wch: 24 }, // nome_responsavel
    { wch: 14 }, // telefone_responsavel
    { wch: 30 }, // email_responsavel
    { wch: 14 }, // cpf_responsavel
    { wch: 32 }, // endereco_responsavel
    { wch: 18 }, // origem
    { wch: 12 }, // dt_entrada
  ];
  xlsx.utils.book_append_sheet(wb, pacientesSheet, "Pacientes");

  // Adicionar aba de instruções
  const instr = xlsx.utils.aoa_to_sheet([
    ["Instruções"],
    ["1) Preencha as datas no formato brasileiro DD/MM/AAAA. Ex.: 31/12/2024."],
    [
      "2) Se o Excel converter automaticamente, está tudo bem: o import aceita datas reais do Excel e também esse formato.",
    ],
    [
      "3) Para vincular pacientes a terapeutas use o terapeuta_email. A coluna terapeuta_id é opcional (UUID).",
    ],
    ["4) Não altere os cabeçalhos das colunas."],
  ]);
  instr["!cols"] = [{ wch: 120 }];
  xlsx.utils.book_append_sheet(wb, instr, "Instruções");

  const outDir = path.resolve(process.cwd(), "infra", "data");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "import-template.xlsx");
  xlsx.writeFile(wb, outPath);
  console.log(`✅ Template criado em: ${outPath}`);
}

main();

// Helpers
function addHeaderComment(ws, colIndex, text) {
  const addr = xlsx.utils.encode_cell({ c: colIndex, r: 0 });
  const cell = ws[addr] || (ws[addr] = { t: "s", v: "" });
  const author = "Espaço Dialógico";
  cell.c = cell.c || [];
  cell.c.push({ t: "s", a: author, v: text });
}
