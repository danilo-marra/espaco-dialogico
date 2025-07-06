import * as fs from "fs";
import crypto from "crypto";

// Função para gerar assinatura de upload signed
function generateSignature(params: any, apiSecret: string): string {
  // Remove campos que não devem ser assinados
  const paramsToSign = { ...params };
  delete paramsToSign.file;
  delete paramsToSign.api_key;

  // Ordena os parâmetros alfabeticamente e cria a string
  const sortedParams = Object.keys(paramsToSign)
    .sort()
    .map((key) => `${key}=${paramsToSign[key]}`)
    .join("&");

  // Adiciona o API secret ao final
  const stringToSign = sortedParams + apiSecret;

  console.log("String para assinar:", stringToSign);

  // Gera o hash SHA1
  const signature = crypto
    .createHash("sha1")
    .update(stringToSign)
    .digest("hex");
  console.log("Assinatura gerada:", signature);

  return signature;
}

export async function uploadToCloudinary(file) {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    console.error(
      "Cloudinary configuration missing. Check environment variables.",
    );
    throw new Error("Configuração do Cloudinary incompleta");
  }

  try {
    const fileBuffer = await fs.promises.readFile(file.filepath);
    const base64String = Buffer.from(fileBuffer).toString("base64");
    const dataURI = `data:${file.mimetype};base64,${base64String}`;

    // Determinar o resource_type baseado no mimetype
    let resourceType = "auto";

    if (file.mimetype?.startsWith("image/")) {
      resourceType = "image";
    } else if (file.mimetype?.startsWith("video/")) {
      resourceType = "video";
    } else if (file.mimetype === "application/pdf") {
      resourceType = "raw"; // PDFs precisam ser raw
    } else {
      resourceType = "raw";
    }

    // Gerar timestamp único
    const timestamp = Math.round(new Date().getTime() / 1000);

    // Parâmetros para o upload signed - apenas os que são assinados
    const uploadParams: any = {
      folder: "terapeutas",
      timestamp: timestamp,
    };

    // Gerar assinatura
    const signature = generateSignature(uploadParams, apiSecret);

    const formData = new FormData();
    formData.append("file", dataURI);
    formData.append("api_key", apiKey);
    formData.append("timestamp", timestamp.toString());
    formData.append("signature", signature);
    formData.append("folder", "terapeutas");
    // resource_type é enviado mas não assinado
    formData.append("resource_type", resourceType);

    console.log("Parâmetros para assinatura:", uploadParams);
    console.log(
      "String para assinar:",
      Object.keys(uploadParams)
        .sort()
        .map((key) => `${key}=${uploadParams[key]}`)
        .join("&"),
    );
    console.log("Timestamp:", timestamp);
    console.log("Assinatura:", signature);
    console.log("Resource type:", resourceType);

    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

    console.log(
      `Enviando para Cloudinary (SIGNED) (cloud_name: ${cloudName}, resource_type: ${resourceType}, mimetype: ${file.mimetype})`,
    );

    const response = await fetch(cloudinaryUrl, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Resposta de erro do Cloudinary:", errorData);
      throw new Error(errorData.error?.message || "Erro ao fazer upload");
    }

    const data = await response.json();

    // Para arquivos raw (incluindo PDFs), usar a URL direta do Cloudinary
    // A transformação fl_attachment não é suportada para arquivos raw
    const finalUrl = data.secure_url;

    console.log("Upload realizado com sucesso:", finalUrl);
    return finalUrl;
  } catch (error) {
    console.error("Erro no upload para Cloudinary:", error);
    throw new Error("Falha ao fazer upload da imagem");
  }
}
