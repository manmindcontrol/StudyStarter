"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Upload, ArrowLeft, FileAudio, CheckCircle, XCircle } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { useTranslation } from "@/hooks/useTranslation";

type UploadRecordedLectureProps = {
  user: User;
};

export default function UploadRecordedLecture({ user }: UploadRecordedLectureProps) {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ["audio/mpeg", "audio/wav", "audio/x-m4a", "audio/mp4"];
      const validExtensions = [".mp3", ".wav", ".m4a", ".mp4"];

      const isValidType = validTypes.includes(file.type) ||
                          validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

      if (!isValidType) {
        setError(t("uploadRecordedLecture.invalidFileType"));
        return;
      }

      // Validate file size (max 25MB - Whisper API limit)
      if (file.size > 25 * 1024 * 1024) {
        setError(t("uploadRecordedLecture.fileTooLarge"));
        return;
      }

      setSelectedFile(file);
      setError(null);
      setSuccess(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      // Get session token for authorization
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error(t("uploadRecordedLecture.notAuthenticated"));
        return;
      }

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Send file as FormData to the API (handles storage + transcription + DB save)
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("fileName", selectedFile.name);
      formData.append("language", locale);

      setIsUploading(false);
      setIsProcessing(true);
      clearInterval(progressInterval);
      setUploadProgress(100);

      const response = await fetch("/api/transcribe-audio", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || t("uploadRecordedLecture.processingFailed"));
      }

      setIsProcessing(false);
      setSuccess(true);

      // Redirect to dashboard after success
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (err) {
      console.error("Error uploading lecture:", err);
      setError(err instanceof Error ? err.message : t("uploadRecordedLecture.uploadError"));
      setIsUploading(false);
      setIsProcessing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files[0];
    if (file) {
      const event = {
        target: { files: [file] },
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      handleFileSelect(event);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-gray-100 to-cyan-50 dark:bg-linear-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container-custom py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/upload-lecture")}
            className="mb-4 flex items-center space-x-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-400 transition-colors group cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">{t("uploadRecordedLecture.back")}</span>
          </button>

          <div className="flex items-center space-x-2 md:space-x-5 bg-linear-to-br from-blue-600 to-blue-400 p-6 rounded-2xl shadow-md">
            <div className="bg-blue-100 p-4 rounded-2xl shadow-lg">
              <Upload className="w-5 h-5 md:w-8 md:h-8 text-blue-500" />
            </div>
            <div>
              <h1 className="text-lg md:text-3xl font-bold text-white mb-1">
                {t("uploadRecordedLecture.title")}
              </h1>
              <p className="text-gray-100 text-l md:text-lg">
                {t("uploadRecordedLecture.subtitle")}
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-3xl mx-auto">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 dark:border-slate-700 p-8">
            {!success ? (
              <>
                {/* Upload Area */}
                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
                    selectedFile
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 bg-gray-50 dark:bg-slate-700/50"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/mpeg,audio/wav,audio/x-m4a,audio/mp4,.mp3,.wav,.m4a,.mp4"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  {!selectedFile ? (
                    <div>
                      <div className="bg-linear-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 p-6 rounded-full w-fit mx-auto mb-6">
                        <FileAudio className="w-16 h-16 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-3">
                        {t("uploadRecordedLecture.dragHere")}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 mb-6">
                        {t("uploadRecordedLecture.or")}
                      </p>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-linear-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-semibold py-3 px-8 rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-105 cursor-pointer"
                      >
                        {t("uploadRecordedLecture.selectFile")}
                      </button>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-6">
                        {t("uploadRecordedLecture.supportedFormats")}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div className="bg-green-100 dark:bg-green-900/50 p-6 rounded-full w-fit mx-auto mb-6">
                        <CheckCircle className="w-16 h-16 text-green-600 dark:text-green-400" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                        {selectedFile.name}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 mb-6">
                        {formatFileSize(selectedFile.size)}
                      </p>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                      >
                        {t("uploadRecordedLecture.selectDifferentFile")}
                      </button>
                    </div>
                  )}
                </div>

                {/* Error Message */}
                {error && (
                  <div className="mt-6 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start space-x-3">
                    <XCircle className="w-6 h-6 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-red-800 dark:text-red-400 mb-1">
                        {t("uploadRecordedLecture.error")}
                      </h4>
                      <p className="text-red-700 dark:text-red-300">{error}</p>
                    </div>
                  </div>
                )}

                {/* Upload Progress */}
                {(isUploading || isProcessing) && (
                  <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-6">
                    <div className="mb-4">
                      <div className="flex justify-between mb-2">
                        <span className="text-blue-800 dark:text-blue-400 font-semibold">
                          {isUploading ? t("uploadRecordedLecture.uploading") : t("uploadRecordedLecture.processingAudio")}
                        </span>
                        <span className="text-blue-600 dark:text-blue-300">
                          {isUploading ? `${uploadProgress}%` : ""}
                        </span>
                      </div>
                      {isUploading && (
                        <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-linear-to-r from-blue-600 to-cyan-500 h-full transition-all duration-300 rounded-full"
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                      )}
                      {isProcessing && (
                        <div className="flex items-center space-x-3">
                          <div className="animate-spin rounded-full h-6 w-6 border-3 border-blue-600 border-t-transparent"></div>
                          <span className="text-blue-700 dark:text-blue-300">
                            {t("uploadRecordedLecture.aiTranscribing")}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Upload Button */}
                {selectedFile && !isUploading && !isProcessing && (
                  <div className="mt-8 flex justify-center">
                    <button
                      onClick={handleUpload}
                      className="bg-linear-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-4 px-12 rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-105 cursor-pointer"
                    >
                      {t("uploadRecordedLecture.uploadAndProcess")}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <div className="bg-green-100 dark:bg-green-900/50 p-8 rounded-full w-fit mx-auto mb-6">
                  <CheckCircle className="w-24 h-24 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-3">
                  {t("uploadRecordedLecture.successTitle")}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  {t("uploadRecordedLecture.successMessage")}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t("uploadRecordedLecture.redirecting")}
                </p>
              </div>
            )}
          </div>

          {/* Info Card */}
          <div className="mt-6 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border border-white/50 dark:border-slate-700">
            <h4 className="font-bold text-slate-800 dark:text-white mb-3">
              {t("uploadRecordedLecture.howItWorks")}
            </h4>
            <ol className="space-y-2 text-gray-600 dark:text-gray-300 text-sm">
              <li className="flex items-start">
                <span className="font-bold text-blue-600 dark:text-blue-400 mr-2">1.</span>
                {t("uploadRecordedLecture.step1")}
              </li>
              <li className="flex items-start">
                <span className="font-bold text-blue-600 dark:text-blue-400 mr-2">2.</span>
                {t("uploadRecordedLecture.step2")}
              </li>
              <li className="flex items-start">
                <span className="font-bold text-blue-600 dark:text-blue-400 mr-2">3.</span>
                {t("uploadRecordedLecture.step3")}
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
