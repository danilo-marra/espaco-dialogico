import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { UploadSimple, FilePdf, X, CheckCircle } from "@phosphor-icons/react";

interface PDFUploaderProps {
  onFileSelect: (_file: File | null) => void;
  currentFileUrl?: string | null;
  maxSize?: number;
  disabled?: boolean;
  label?: string;
}

export function PDFUploader({
  onFileSelect,
  currentFileUrl,
  maxSize = 5 * 1024 * 1024, // 5MB default
  disabled = false,
  label = "Clique aqui ou arraste um arquivo PDF",
}: PDFUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      setError(null);

      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];
        if (rejection.errors.some((e: any) => e.code === "file-too-large")) {
          setError(
            `Arquivo muito grande. Máximo permitido: ${(maxSize / 1024 / 1024).toFixed(1)}MB`,
          );
        } else if (
          rejection.errors.some((e: any) => e.code === "file-invalid-type")
        ) {
          setError("Apenas arquivos PDF são permitidos");
        } else {
          setError("Erro no upload do arquivo");
        }
        return;
      }

      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        setSelectedFile(file);
        onFileSelect(file);
      }
    },
    [maxSize, onFileSelect],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    maxSize,
    maxFiles: 1,
    disabled,
  });

  const removeFile = () => {
    setSelectedFile(null);
    onFileSelect(null);
    setError(null);
  };

  const openFile = (url: string) => {
    window.open(url, "_blank");
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="space-y-3">
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all
          ${
            isDragActive
              ? "border-azul bg-azul/5"
              : "border-gray-300 hover:border-azul hover:bg-gray-50"
          }
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          ${error ? "border-red-300 bg-red-50" : ""}
        `}
      >
        <input {...getInputProps()} />
        <UploadSimple
          size={32}
          className={`mx-auto mb-2 ${isDragActive ? "text-azul" : "text-gray-400"}`}
        />
        <p className="text-sm text-gray-600">
          {isDragActive ? "Solte o arquivo aqui..." : label}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Apenas arquivos PDF • Máximo {(maxSize / 1024 / 1024).toFixed(1)}MB
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
          {error}
        </div>
      )}

      {/* Selected File Preview */}
      {selectedFile && (
        <div className="bg-green-50 border border-green-200 rounded-md p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FilePdf size={24} className="text-red-600" />
              <div>
                <p className="text-sm font-medium text-green-800">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-green-600">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
              <CheckCircle size={20} className="text-green-600" />
            </div>
            <button
              type="button"
              onClick={removeFile}
              className="text-green-600 hover:text-green-800 p-1"
              title="Remover arquivo"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Current File (if exists and no new file selected) */}
      {currentFileUrl && !selectedFile && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FilePdf size={24} className="text-red-600" />
              <div>
                <p className="text-sm font-medium text-blue-800">
                  Currículo atual
                </p>
                <p className="text-xs text-blue-600">Arquivo PDF disponível</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => openFile(currentFileUrl)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Visualizar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
