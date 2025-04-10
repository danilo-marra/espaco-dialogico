import * as fs from "fs";

export async function uploadToCloudinary(file) {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    console.error(
      "Cloudinary configuration missing. Check environment variables.",
    );
    throw new Error("Configuração do Cloudinary incompleta");
  }

  try {
    const fileBuffer = await fs.promises.readFile(file.filepath);
    const base64String = Buffer.from(fileBuffer).toString("base64");
    const dataURI = `data:${file.mimetype};base64,${base64String}`;

    const formData = new FormData();
    formData.append("file", dataURI);
    formData.append("upload_preset", uploadPreset);
    formData.append("folder", "terapeutas");
    formData.append("resource_type", "image");

    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/upload`;

    console.log(`Enviando para Cloudinary (cloud_name: ${cloudName})`);

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
    return data.secure_url;
  } catch (error) {
    console.error("Erro no upload para Cloudinary:", error);
    throw new Error("Falha ao fazer upload da imagem");
  }
}
