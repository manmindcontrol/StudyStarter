"use client";

import { useState } from "react";
import { FileText, Upload, Download, Loader2, FileCheck } from "lucide-react";

export default function PdfConverterPage() {
  const [file, setFile] = useState<File | null>(null);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setError("");
    setSuccess(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === "application/pdf") {
        setFile(droppedFile);
      } else {
        setError("Please upload a PDF file");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    setSuccess(false);
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === "application/pdf") {
        setFile(selectedFile);
      } else {
        setError("Please upload a PDF file");
      }
    }
  };

  const handleConvert = async () => {
    if (!file) {
      setError("Please select a file first");
      return;
    }

    setConverting(true);
    setError("");
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/pdf-to-docx", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Conversion failed");
      }

      // Download the converted file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name.replace(".pdf", ".docx");
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSuccess(true);
      setFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to convert file");
    } finally {
      setConverting(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-cyan-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container-custom py-12">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-linear-to-br from-blue-600 to-cyan-500 rounded-2xl mb-6 shadow-lg shadow-blue-500/30">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-linear-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent mb-4">
              PDF to DOCX Converter
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              Convert your PDF files to editable DOCX documents
            </p>
          </div>

          {/* Main Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl shadow-blue-500/5 dark:shadow-slate-900/20 p-8 border border-gray-200/50 dark:border-slate-700/50">
            {/* Upload Area */}
            <div
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 ${
                dragActive
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
              <p className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-2">
                Drag and drop your PDF file here
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                or click to browse
              </p>
              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="inline-block bg-linear-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-105 cursor-pointer"
              >
                Choose File
              </label>
            </div>

            {/* Selected File */}
            {file && (
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {file.name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setFile(null)}
                    className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                <p className="text-red-600 dark:text-red-400 text-center">
                  {error}
                </p>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                <p className="text-green-600 dark:text-green-400 text-center font-medium">
                  File converted successfully! Download started.
                </p>
              </div>
            )}

            {/* Convert Button */}
            <button
              onClick={handleConvert}
              disabled={!file || converting}
              className={`w-full mt-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center justify-center space-x-2 ${
                !file || converting
                  ? "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  : "bg-linear-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-105"
              }`}
            >
              {converting ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>Converting...</span>
                </>
              ) : (
                <>
                  <Download className="w-6 h-6" />
                  <span>Convert to DOCX</span>
                </>
              )}
            </button>
          </div>

          {/* Info Section */}
          <div className="mt-8 p-6 bg-white dark:bg-slate-800 rounded-xl border border-gray-200/50 dark:border-slate-700/50">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Important Notes:
            </h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-start">
                <span className="text-blue-600 dark:text-blue-400 mr-2">•</span>
                <span>
                  This converter extracts text from PDFs and creates editable DOCX files
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 dark:text-blue-400 mr-2">•</span>
                <span>Images and complex formatting may not be preserved</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 dark:text-blue-400 mr-2">•</span>
                <span>Best results with text-based PDFs (not scanned documents)</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 dark:text-blue-400 mr-2">•</span>
                <span>Your files are processed securely and not stored on our servers</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
