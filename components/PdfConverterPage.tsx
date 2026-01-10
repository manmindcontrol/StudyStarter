"use client";

import { useState, useEffect } from "react";
import { FileText, Upload, Download, Loader2, FileCheck, Shield, CreditCard, Zap } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export default function PdfConverterPage() {
  const [file, setFile] = useState<File | null>(null);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [hasBypass, setHasBypass] = useState(false);
  const [checkingBypass, setCheckingBypass] = useState(true);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [usageInfo, setUsageInfo] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Skontroluj používateľa a jeho usage
  useEffect(() => {
    const loadData = async () => {
      try {
        // Získaj aktuálneho používateľa
        const { user: currentUser } = await getCurrentUser();
        setUser(currentUser);

        // Ak je prihlásený, načítaj usage info
        if (currentUser) {
          const usageResponse = await fetch('/api/usage');
          if (usageResponse.ok) {
            const usageData = await usageResponse.json();
            setUsageInfo(usageData);
          }
        }

        // Skontroluj bypass status
        const bypassResponse = await fetch('/api/check-pdf-bypass');
        const bypassData = await bypassResponse.json();
        setHasBypass(bypassData.hasBypass);
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        setCheckingBypass(false);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Handle payment success from Stripe redirect
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const sessionId = urlParams.get('session_id');

    if (success === 'true' && sessionId) {
      // Payment was successful
      setPaymentSuccess(true);

      // Try to restore file from sessionStorage
      const savedFileData = sessionStorage.getItem('pendingPdfFile');
      if (savedFileData) {
        try {
          const { fileName, fileData } = JSON.parse(savedFileData);

          // Convert base64 back to File object with proper MIME type
          fetch(fileData)
            .then(res => res.blob())
            .then(blob => {
              // Ensure proper MIME type for PDF
              const pdfBlob = new Blob([blob], { type: 'application/pdf' });
              const restoredFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

              console.log('Restored file:', restoredFile.name, restoredFile.type, restoredFile.size);
              setFile(restoredFile);

              // Clear sessionStorage
              sessionStorage.removeItem('pendingPdfFile');

              // Show success message with info
              setSuccess(false); // Don't show success yet
              setError('');

              // Auto-convert immediately with the restored file
              setTimeout(() => {
                performConversion(restoredFile);
              }, 1000);
            })
            .catch(err => {
              console.error('Failed to restore file blob:', err);
              setError('Payment successful! Please upload your file again to convert it.');
            });
        } catch (err) {
          console.error('Failed to parse saved file:', err);
          setError('Payment successful! Please upload your file again to convert it.');
        }
      } else {
        setError('Payment successful! Please upload your file again to convert it.');
      }

      // Clean URL
      window.history.replaceState({}, '', '/pdf-converter');
    }

    const canceled = urlParams.get('canceled');
    if (canceled === 'true') {
      setError('Payment was canceled. You can try again when ready.');
      window.history.replaceState({}, '', '/pdf-converter');
    }
  }, []);

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
      // Accept if MIME type is correct OR if file extension is .pdf
      const isPdf = droppedFile.type === "application/pdf" ||
                    droppedFile.name.toLowerCase().endsWith('.pdf');

      if (isPdf) {
        console.log('File accepted:', droppedFile.name, droppedFile.type);
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
      // Accept if MIME type is correct OR if file extension is .pdf
      const isPdf = selectedFile.type === "application/pdf" ||
                    selectedFile.name.toLowerCase().endsWith('.pdf');

      if (isPdf) {
        console.log('File accepted:', selectedFile.name, selectedFile.type);
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

    // Ak má bypass, konvertuj priamo
    if (hasBypass) {
      await performConversion();
      return;
    }

    // Ak je prihlásený používateľ
    if (user && usageInfo) {
      // Skontroluj či má unlimited alebo ešte má kredity
      const pdfUsage = usageInfo.usage.pdf_conversions;

      if (pdfUsage.unlimited) {
        // Premium používateľ - konvertuj priamo
        await performConversion();
        return;
      }

      if (pdfUsage.limit === 0) {
        // Free tier - musí zaplatiť
        setShowPaymentModal(true);
        return;
      }

      if (pdfUsage.used >= pdfUsage.limit) {
        // Dosiahol limit
        setError(`You've reached your monthly limit of ${pdfUsage.limit} PDF conversions. Please upgrade your plan or wait until next month.`);
        return;
      }

      // Má ešte kredity - konvertuj
      await performConversion();
      return;
    }

    // Neprihlásený používateľ - musí zaplatiť
    setShowPaymentModal(true);
  };

  const performConversion = async (fileToConvert?: File) => {
    setConverting(true);
    setError("");
    setSuccess(false);

    try {
      // Use passed file or fall back to state file
      const targetFile = fileToConvert || file;

      console.log('Starting conversion for file:', targetFile?.name, targetFile?.type, targetFile?.size);

      if (!targetFile) {
        throw new Error("No file selected");
      }

      const formData = new FormData();
      formData.append("file", targetFile);

      console.log('FormData created, sending request...');

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
      a.download = targetFile.name.replace(".pdf", ".docx");
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSuccess(true);
      setFile(null);

      // Refresh usage info ak je prihlásený
      if (user) {
        const usageResponse = await fetch('/api/usage');
        if (usageResponse.ok) {
          const usageData = await usageResponse.json();
          setUsageInfo(usageData);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to convert file");
    } finally {
      setConverting(false);
    }
  };

  const handlePayment = async () => {
    if (!file) {
      setError("Please select a file first");
      return;
    }

    try {
      // Save file to sessionStorage before redirecting to Stripe
      const reader = new FileReader();
      reader.onloadend = async () => {
        const fileData = reader.result as string;
        sessionStorage.setItem('pendingPdfFile', JSON.stringify({
          fileName: file.name,
          fileData: fileData,
        }));

        // Now create checkout session
        const response = await fetch("/api/stripe/create-pdf-checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fileName: file.name,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to create checkout session");
        }

        // Presmeruj na Stripe Checkout
        if (data.url) {
          window.location.href = data.url;
        }
      };

      reader.onerror = () => {
        setError("Failed to read file. Please try again.");
      };

      reader.readAsDataURL(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to initiate payment");
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

          {/* Bypass Status Banner */}
          {!checkingBypass && hasBypass && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
              <div className="flex items-center space-x-3">
                <Shield className="w-6 h-6 text-green-600 dark:text-green-400" />
                <div>
                  <p className="font-semibold text-green-800 dark:text-green-300">
                    Test Account Active
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-400">
                    You can convert PDFs for free without Stripe payment
                  </p>
                </div>
              </div>
            </div>
          )}

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

          {/* Usage Info for logged in users */}
          {user && usageInfo && !hasBypass && (
            <div className="mt-8 p-6 bg-white dark:bg-slate-800 rounded-xl border border-gray-200/50 dark:border-slate-700/50">
              <div className="flex items-center space-x-3 mb-4">
                <Zap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  Your Usage This Month
                </h3>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  PDF Conversions
                </span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {usageInfo.usage.pdf_conversions.unlimited
                    ? "Unlimited"
                    : `${usageInfo.usage.pdf_conversions.used} / ${usageInfo.usage.pdf_conversions.limit}`}
                </span>
              </div>
              {!usageInfo.usage.pdf_conversions.unlimited && usageInfo.usage.pdf_conversions.limit > 0 && (
                <div className="mt-3">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 dark:bg-blue-400 rounded-full h-2 transition-all duration-300"
                      style={{
                        width: `${Math.min(
                          (usageInfo.usage.pdf_conversions.used / usageInfo.usage.pdf_conversions.limit) * 100,
                          100
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>
              )}
              {usageInfo.tierId === "free" && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    💡 Upgrade to get monthly PDF conversions!{" "}
                    <a href="/pricing" className="underline font-semibold">
                      View Plans
                    </a>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Payment Modal */}
        {showPaymentModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-8 animate-fade-in">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-linear-to-br from-blue-600 to-cyan-500 rounded-full mb-4">
                  <CreditCard className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Payment Required
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Convert your PDF to DOCX for just €0.50
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 mb-6 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-700 dark:text-gray-300">
                    PDF Conversion
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    €0.50
                  </span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  One-time payment • Secure checkout
                </div>
              </div>

              {!user && (
                <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
                  <p className="text-sm text-yellow-800 dark:text-yellow-300">
                    💡 <strong>Tip:</strong> Create a free account to get monthly PDF conversions included!{" "}
                    <a href="/register" className="underline font-semibold">
                      Sign up
                    </a>
                  </p>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold py-3 px-6 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePayment}
                  className="flex-1 bg-linear-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40"
                >
                  Pay €0.50
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
