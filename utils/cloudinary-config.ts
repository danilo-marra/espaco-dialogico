import * as fs from "fs";

export async function uploadToCloudinary(file) {
  try {
    const fileBuffer = await fs.promises.readFile(file.filepath);
    const base64String = Buffer.from(fileBuffer).toString("base64");
    const dataURI = `data:${file.mimetype};base64,${base64String}`;

    const formData = new FormData();
    formData.append("file", dataURI);
    formData.append(
      "upload_preset",
      process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "terapeutas",
    );
    formData.append("folder", "terapeutas");
    formData.append("resource_type", "image");

    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/upload`;

    const response = await fetch(cloudinaryUrl, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Erro ao fazer upload");
    }

    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error("Erro no upload para Cloudinary:", error);
    throw new Error("Falha ao fazer upload da imagem");
  }
}
