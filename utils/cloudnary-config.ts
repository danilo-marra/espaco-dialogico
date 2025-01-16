import * as fs from "fs";

export async function uploadToCloudinary(file: any) {
  const formData = new FormData();

  const fileBuffer = await fs.promises.readFile(file.filepath);
  const base64String = Buffer.from(fileBuffer).toString("base64");
  const dataURI = `data:${file.mimetype};base64,${base64String}`;

  // Add these parameters for better upload control
  formData.append("file", dataURI);
  formData.append("upload_preset", "terapeutas");
  formData.append("folder", "terapeutas");
  formData.append("resource_type", "image");

  const uploadUrl = `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/upload`;

  try {
    const response = await fetch(uploadUrl, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Upload failed:", errorData);
      throw new Error(errorData.error?.message || response.statusText);
    }

    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error("Upload error:", error);
    throw error;
  }
}
