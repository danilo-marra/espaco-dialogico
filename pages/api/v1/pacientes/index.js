import database from "infra/database";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ message: "Método não permitido" });
    return;
  }

  let client;
  try {
    client = await database.getNewClient();
    const query = `
      SELECT 
        p.id,
        p.nome_paciente AS "nomePaciente",
        p.dt_nascimento AS "dtNascimento",
        p.nome_responsavel AS "nomeResponsavel",
        p.telefone_responsavel AS "telefoneResponsavel",
        p.email_responsavel AS "emailResponsavel",
        p.cpf_responsavel AS "cpfResponsavel",
        p.endereco_responsavel AS "enderecoResponsavel",
        p.origem,
        p.dt_entrada_paciente AS "dtEntradaPaciente",
        t.id AS "terapeutaId",
        t."nomeTerapeuta" AS "nomeTerapeuta",
        t."telefoneTerapeuta" AS "telefoneTerapeuta",
        t."emailTerapeuta" AS "emailTerapeuta",
        t."enderecoTerapeuta" AS "enderecoTerapeuta",
        t."dtEntrada" AS "terapeutaDtEntrada",
        t."chavePix" AS "chavePix",
        t.foto
      FROM pacientes p
      LEFT JOIN terapeutas t ON p.terapeuta_id = t.id
    `;
    const result = await client.query(query);

    const pacientes = result.rows.map((row) => ({
      id: row.id,
      nomePaciente: row.nomePaciente,
      dtNascimento: row.dtNascimento,
      nomeResponsavel: row.nomeResponsavel,
      telefoneResponsavel: row.telefoneResponsavel,
      emailResponsavel: row.emailResponsavel,
      cpfResponsavel: row.cpfResponsavel,
      enderecoResponsavel: row.enderecoResponsavel,
      origem: row.origem,
      dtEntradaPaciente: row.dtEntradaPaciente,
      terapeutaInfo: {
        id: row.terapeutaId,
        nomeTerapeuta: row.nomeTerapeuta,
        telefoneTerapeuta: row.telefoneTerapeuta,
        emailTerapeuta: row.emailTerapeuta,
        enderecoTerapeuta: row.enderecoTerapeuta,
        dtEntrada: row.terapeutaDtEntrada,
        chavePix: row.chavePix,
        foto: row.foto,
      },
    }));

    return res.status(200).json(pacientes);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao buscar pacientes" });
  } finally {
    if (client) {
      await client.end();
    }
  }
}
