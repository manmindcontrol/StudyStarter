"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Upload,
  Download,
  Loader2,
  FileCheck,
  Shield,
  CreditCard,
  Zap,
  Trash2,
} from "lucide-react";
import { getCurrentUser, getSession } from "@/lib/auth";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { useTranslation } from "@/hooks/useTranslation";

export default function PdfConverterPage() {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [hasBypass, setHasBypass] = useState(false);
  const [checkingBypass, setCheckingBypass] = useState(true);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [usageInfo, setUsageInfo] = useState<{
    tierId: string;
    tierName: string;
    usage: {
      pdf_conversions: {
        used: number;
        limit: number | null;
        unlimited: boolean;
      };
      materials: { used: number; limit: number | null; unlimited: boolean };
      notes_generations: {
        used: number;
        limit: number | null;
        unlimited: boolean;
      };
      questions_generations: {
        used: number;
        limit: number | null;
        unlimited: boolean;
      };
    };
    periodStart: string;
    periodEnd: string;
  } | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [_paymentSuccess, setPaymentSuccess] = useState(false);

  // Skontroluj používateľa a jeho usage
  useEffect(() => {
    const loadData = async () => {
      try {
        // Získaj aktuálneho používateľa
        const { user: currentUser } = await getCurrentUser();
        setUser(currentUser);

        // Ak je prihlásený, načítaj usage info
        if (currentUser) {
          const { session } = await getSession();
          if (session?.access_token) {
            const usageResponse = await fetch("/api/usage", {
              headers: {
                Authorization: `Bearer ${session.access_token}`,
              },
            });
            if (usageResponse.ok) {
              const usageData = await usageResponse.json();
              setUsageInfo(usageData);
            }
          }
        }

        // Skontroluj bypass status
        const bypassResponse = await fetch("/api/check-pdf-bypass");
        const bypassData = await bypassResponse.json();
        setHasBypass(bypassData.hasBypass);
      } catch (err) {
        console.error("Failed to load data:", err);
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
    const success = urlParams.get("success");
    const sessionId = urlParams.get("session_id");

    if (success === "true" && sessionId) {
      // Payment was successful
      setPaymentSuccess(true);

      // Try to restore file from sessionStorage
      const savedFileData = sessionStorage.getItem("pendingPdfFile");
      if (savedFileData) {
        try {
          const { fileName, fileData } = JSON.parse(savedFileData);

          // Convert base64 back to File object with proper MIME type
          fetch(fileData)
            .then((res) => res.blob())
            .then((blob) => {
              // Ensure proper MIME type for PDF
              const pdfBlob = new Blob([blob], { type: "application/pdf" });
              const restoredFile = new File([pdfBlob], fileName, {
                type: "application/pdf",
              });

              setFile(restoredFile);

              // Clear sessionStorage
              sessionStorage.removeItem("pendingPdfFile");

              // Show success message with info
              setSuccess(false); // Don't show success yet
              setError("");

              // Auto-convert immediately with the restored file + paid session id
              setTimeout(() => {
                performConversion(restoredFile, sessionId);
              }, 1000);
            })
            .catch((err) => {
              console.error("Failed to restore file blob:", err);
              setError(t("pdfConverter.errors.paymentSuccessUploadAgain"));
            });
        } catch (err) {
          console.error("Failed to parse saved file:", err);
          setError(t("pdfConverter.errors.paymentSuccessUploadAgain"));
        }
      } else {
        setError(t("pdfConverter.errors.paymentSuccessUploadAgain"));
      }

      // Clean URL
      window.history.replaceState({}, "", "/pdf-converter");
    }

    const canceled = urlParams.get("canceled");
    if (canceled === "true") {
      setError(t("pdfConverter.errors.paymentCanceled"));
      window.history.replaceState({}, "", "/pdf-converter");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      const isPdf =
        droppedFile.type === "application/pdf" ||
        droppedFile.name.toLowerCase().endsWith(".pdf");

      if (isPdf) {
        setFile(droppedFile);
      } else {
        setError(t("pdfConverter.errors.pleaseUploadPdf"));
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    setSuccess(false);
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      // Accept if MIME type is correct OR if file extension is .pdf
      const isPdf =
        selectedFile.type === "application/pdf" ||
        selectedFile.name.toLowerCase().endsWith(".pdf");

      if (isPdf) {
        setFile(selectedFile);
      } else {
        setError(t("pdfConverter.errors.pleaseUploadPdf"));
      }
    }
  };

  const handleConvert = async () => {
    if (!file) {
      setError(t("pdfConverter.errors.pleaseSelectFile"));
      return;
    }

    // Ak má bypass, konvertuj priamo
    if (hasBypass) {
      await performConversion();
      return;
    }

    // Ak je prihlásený používateľ
    if (user && loading) {
      // Ešte sa načítavajú údaje - počkaj
      setError(
        t("pdfConverter.errors.pleaseSelectFile").includes("Please")
          ? "Loading your account info, please try again in a moment."
          : "Načítavam údaje o účte, skúste to znova o chvíľu.",
      );
      return;
    }

    if (user && usageInfo) {
      const pdfUsage = usageInfo.usage.pdf_conversions;

      if (pdfUsage.unlimited) {
        // Premium používateľ - konvertuj priamo
        await performConversion();
        return;
      }

      // Platený plán (basic/premium) - skontroluj limit
      if (usageInfo.tierId !== "free") {
        if (pdfUsage.limit !== null && pdfUsage.used >= pdfUsage.limit) {
          // Dosiahol mesačný limit
          setError(
            t("pdfConverter.errors.limitReached").replace(
              "{limit}",
              pdfUsage.limit.toString(),
            ),
          );
          return;
        }
        // Má ešte kredity - konvertuj
        await performConversion();
        return;
      }

      // Free tier - musí zaplatiť
      setShowPaymentModal(true);
      return;
    }

    // Prihlásený ale usage info sa nepodarilo načítať - skús konverziu aj tak
    if (user && !usageInfo) {
      await performConversion();
      return;
    }

    // Neprihlásený používateľ - musí zaplatiť
    setShowPaymentModal(true);
  };

  const performConversion = async (
    fileToConvert?: File,
    stripeSessionId?: string,
  ) => {
    setConverting(true);
    setError("");
    setSuccess(false);

    try {
      // Use passed file or fall back to state file
      const targetFile = fileToConvert || file;

      if (!targetFile) {
        throw new Error(t("pdfConverter.errors.noFileSelected"));
      }

      const formData = new FormData();
      formData.append("file", targetFile);

      const { session: convSession } = await getSession();
      const headers: Record<string, string> = {};
      if (convSession?.access_token) {
        headers["Authorization"] = `Bearer ${convSession.access_token}`;
      } else if (stripeSessionId) {
        headers["x-stripe-session-id"] = stripeSessionId;
      }

      const response = await fetch("/api/pdf-to-docx", {
        method: "POST",
        body: formData,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || t("pdfConverter.errors.conversionFailed"),
        );
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
        const { session } = await getSession();
        const usageResponse = await fetch("/api/usage", {
          headers: session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : {},
        });
        if (usageResponse.ok) {
          const usageData = await usageResponse.json();
          setUsageInfo(usageData);
        }
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t("pdfConverter.errors.failedToConvert"),
      );
    } finally {
      setConverting(false);
    }
  };

  const handlePayment = async () => {
    if (!file) {
      setError(t("pdfConverter.errors.pleaseSelectFile"));
      return;
    }

    try {
      // Save file to sessionStorage before redirecting to Stripe
      const reader = new FileReader();
      reader.onloadend = async () => {
        const fileData = reader.result as string;
        sessionStorage.setItem(
          "pendingPdfFile",
          JSON.stringify({
            fileName: file.name,
            fileData: fileData,
          }),
        );

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
          throw new Error(
            data.error || t("pdfConverter.errors.failedToCreateCheckout"),
          );
        }

        // Presmeruj na Stripe Checkout
        if (data.url) {
          window.location.href = data.url;
        }
      };

      reader.onerror = () => {
        setError(t("pdfConverter.errors.failedToRead"));
      };

      reader.readAsDataURL(file);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t("pdfConverter.errors.failedToInitiatePayment"),
      );
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-blue-900 to-slate-900 overflow-hidden relative">
      <div className="container-custom py-12">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12 ">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-linear-to-br from-blue-600 to-cyan-500 rounded-2xl mb-6 shadow-lg shadow-blue-500/30">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">
              {t("pdfConverter.title")}
            </h1>
            <p className="text-gray-300 dark:text-gray-300 text-lg">
              {t("pdfConverter.subtitle")}
            </p>
          </div>

          {/* Bypass Status Banner */}
          {!checkingBypass && hasBypass && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
              <div className="flex items-center space-x-3">
                <Shield className="w-6 h-6 text-green-600 dark:text-green-400" />
                <div>
                  <p className="font-semibold text-green-800 dark:text-green-300">
                    {t("pdfConverter.testAccountActive")}
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-400">
                    {t("pdfConverter.testAccountDesc")}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Main Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl shadow-blue-500/5 dark:shadow-slate-900/20 p-5 sm:p-6 border border-gray-200/50 dark:border-slate-700/50">
            {/* Upload Area */}
            <div
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
                dragActive
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <div
                  className={`w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center ${
                    dragActive
                      ? "bg-blue-100 dark:bg-blue-900/30"
                      : "bg-gray-100 dark:bg-slate-700"
                  }`}
                >
                  <Upload
                    className={`w-6 h-6 ${dragActive ? "text-blue-600" : "text-gray-500 dark:text-gray-400"}`}
                  />
                </div>
                <p className="font-semibold text-gray-900 dark:text-gray-200 mb-1">
                  {t("pdfConverter.dragAndDrop")}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  {t("pdfConverter.orClickBrowse")}
                </p>
                <span className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors text-sm">
                  {t("pdfConverter.chooseFile")}
                </span>
              </label>
            </div>

            {/* Selected File */}
            {file && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-slate-700 rounded-lg border border-blue-200 dark:border-slate-600">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 dark:bg-slate-600 p-2 rounded-lg">
                      <FileCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-200 text-sm">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setFile(null)}
                    className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors text-sm font-medium"
                  >
                    <span className="hidden sm:inline">
                      {t("pdfConverter.remove")}
                    </span>
                    <Trash2 className="w-4 h-4 sm:hidden" />
                  </button>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <p className="text-red-600 dark:text-red-400 text-sm text-center">
                  {error}
                </p>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-green-600 dark:text-green-400 text-sm text-center font-medium">
                  {t("pdfConverter.successMessage")}
                </p>
              </div>
            )}

            {/* Convert Button */}
            <button
              onClick={handleConvert}
              disabled={!file || converting}
              className={`w-full mt-4 py-3 rounded-xl font-semibold transition-all cursor-pointer flex items-center justify-center space-x-2 ${
                !file || converting
                  ? "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              {converting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{t("pdfConverter.converting")}</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  <span>{t("pdfConverter.convertToDocx")}</span>
                </>
              )}
            </button>
          </div>

          {/* Info Section */}
          <div className="mt-8 p-6 bg-white dark:bg-slate-800 rounded-xl border border-gray-200/50 dark:border-slate-700/50">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
              {t("pdfConverter.importantNotes")}
            </h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-start">
                <span className="text-blue-600 dark:text-blue-400 mr-2">•</span>
                <span>{t("pdfConverter.note1")}</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 dark:text-blue-400 mr-2">•</span>
                <span>{t("pdfConverter.note2")}</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 dark:text-blue-400 mr-2">•</span>
                <span>{t("pdfConverter.note3")}</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 dark:text-blue-400 mr-2">•</span>
                <span>{t("pdfConverter.note4")}</span>
              </li>
            </ul>
          </div>

          {/* Usage Info for logged in users */}
          {user && usageInfo && !hasBypass && (
            <div className="mt-8 p-6 bg-white dark:bg-slate-800 rounded-xl border border-gray-200/50 dark:border-slate-700/50">
              <div className="flex items-center space-x-3 mb-4">
                <Zap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  {t("pdfConverter.yourUsageThisMonth")}
                </h3>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  {t("pdfConverter.pdfConversions")}
                </span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {usageInfo.usage.pdf_conversions.unlimited
                    ? t("pdfConverter.unlimited")
                    : `${usageInfo.usage.pdf_conversions.used} / ${usageInfo.usage.pdf_conversions.limit}`}
                </span>
              </div>
              {!usageInfo.usage.pdf_conversions.unlimited &&
                usageInfo.usage.pdf_conversions.limit !== null &&
                usageInfo.usage.pdf_conversions.limit > 0 && (
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-600 dark:bg-blue-400 rounded-full h-2 transition-all duration-300"
                        style={{
                          width: `${Math.min(
                            (usageInfo.usage.pdf_conversions.used /
                              usageInfo.usage.pdf_conversions.limit) *
                              100,
                            100,
                          )}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                )}
              {usageInfo.tierId === "free" && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    {t("pdfConverter.upgradeTip")}{" "}
                    <a href="/pricing" className="underline font-semibold">
                      {t("pdfConverter.viewPlans")}
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
                  {t("pdfConverter.paymentRequired")}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {t("pdfConverter.paymentDescription")}
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 mb-6 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-700 dark:text-gray-300">
                    {t("pdfConverter.pdfConversion")}
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    €0.50
                  </span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
                  {t("pdfConverter.oneTimePayment")}
                </div>
              </div>

              {!user && (
                <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
                  <p className="text-sm text-yellow-800 dark:text-yellow-300">
                    <span
                      dangerouslySetInnerHTML={{
                        __html: t("pdfConverter.signupTip"),
                      }}
                    />{" "}
                    <a href="/register" className="underline font-semibold">
                      {t("pdfConverter.signUp")}
                    </a>
                  </p>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold py-3 px-6 rounded-xl transition-colors"
                >
                  {t("pdfConverter.cancel")}
                </button>
                <button
                  onClick={handlePayment}
                  className="flex-1 bg-linear-to-r cursor-pointer from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40"
                >
                  {t("pdfConverter.pay")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
