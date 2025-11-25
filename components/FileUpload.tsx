"use client";

import { useCallback, useState } from "react";
import { Upload, File, X, CheckCircle, AlertCircle } from "lucide-react";

type FileUploadProps = {
  onUpload: (file: File) => Promise<void>;
  acceptedFileTypes?: string[];
  maxSizeMB?: number;
};

export default function FileUpload({
  onUpload,
  acceptedFileTypes = [".pdf", ".docx", ".doc", ".txt"],
  maxSizeMB = 10,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const validateFile = (file: File): string | null => {
    // Kontrola typu súboru
    const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
    if (!acceptedFileTypes.includes(fileExtension)) {
      return `Nepodporovaný typ súboru. Podporované: ${acceptedFileTypes.join(
        ", "
      )}`;
    }

    // Kontrola veľkosti
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      return `Súbor je príliš veľký. Maximum: ${maxSizeMB}MB`;
    }

    return null;
  };

  const handleFile = useCallback((file: File) => {
    setError("");
    setSuccess(false);

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSelectedFile(file);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFile(files[0]);
      }
    },
    [handleFile]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError("");

    try {
      await onUpload(selectedFile);
      setSuccess(true);
      setSelectedFile(null);

      // Reset success po 3 sekundách
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chyba pri nahrávaní");
    } finally {
      setUploading(false);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setError("");
    setSuccess(false);
  };

  return (
    <div className="w-full">
      {/* Drag & Drop zóna */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-xl p-8 text-center transition-all
          ${
            isDragging
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 bg-gray-50 hover:border-gray-400"
          }
        `}
      >
        <input
          type="file"
          id="file-upload"
          className="hidden"
          accept={acceptedFileTypes.join(",")}
          onChange={handleFileInput}
          disabled={uploading}
        />

        <label htmlFor="file-upload" className="cursor-pointer">
          <Upload
            className={`
            w-12 h-12 mx-auto mb-4 
            ${isDragging ? "text-blue-600" : "text-gray-400"}
          `}
          />

          <p className="text-lg font-semibold text-gray-900 mb-2">
            {isDragging ? "Pusť súbor sem" : "Nahraj materiál"}
          </p>

          <p className="text-sm text-gray-600 mb-4">
            Potiahni sem súbor alebo klikni na nahratie
          </p>

          <p className="text-xs text-gray-500">
            Podporované: PDF, Word, TXT (max {maxSizeMB}MB)
          </p>
        </label>
      </div>

      {/* Vybraný súbor */}
      {selectedFile && (
        <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <File className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            </div>

            {!uploading && (
              <button
                onClick={clearFile}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Upload tlačidlo */}
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {uploading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Nahrávam...
              </>
            ) : (
              "Nahrať materiál"
            )}
          </button>
        </div>
      )}

      {/* Error správa */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Success správa */}
      {success && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start space-x-3">
          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
          <p className="text-sm text-green-700">Materiál úspešne nahraný!</p>
        </div>
      )}
    </div>
  );
}
