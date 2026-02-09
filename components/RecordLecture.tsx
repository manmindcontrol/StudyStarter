"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Mic,
  Download,
  ArrowLeft,
  FileText,
  FileDown,
  Play,
  Square,
  Trash2,
  Check,
  Loader2,
} from "lucide-react";
import { saveAs } from "file-saver";
import { Document, Paragraph, TextRun, Packer } from "docx";
import jsPDF from "jspdf";
import LoadingSpinner from "./LoadingSpinner";
import { useTranslation } from "@/hooks/useTranslation";

// Web Speech API types
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export default function RecordLecture() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [pendingText, setPendingText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadingFormat, setDownloadingFormat] = useState<
    "txt" | "docx" | "pdf" | "save" | null
  >(null);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs for recording
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isRecordingRef = useRef<boolean>(false);
  const finalTranscriptRef = useRef<string>("");

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Get language code for Speech Recognition
  const getSpeechLang = () => {
    const langMap: Record<string, string> = {
      sk: "sk-SK",
      en: "en-US",
      de: "de-DE",
    };
    return langMap[locale] || "sk-SK";
  };

  // Get language code for Whisper
  const getWhisperLanguage = () => {
    const langMap: Record<string, string> = {
      sk: "sk",
      en: "en",
      de: "de",
    };
    return langMap[locale] || "sk";
  };

  // Setup Web Speech API for real-time transcription
  const setupSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Speech Recognition not supported");
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = getSpeechLang();

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript + " ";
        } else {
          interim += result[0].transcript;
        }
      }

      if (final) {
        finalTranscriptRef.current += final;
        setTranscript(finalTranscriptRef.current);
      }
      setInterimTranscript(interim);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error);
      // Restart on error if still recording
      if (isRecordingRef.current && recognitionRef.current) {
        setTimeout(() => {
          try {
            recognitionRef.current?.start();
          } catch {
            // Ignore if already started
          }
        }, 100);
      }
    };

    recognition.onend = () => {
      // Restart if still recording
      if (isRecordingRef.current && recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch {
          // Ignore if already started
        }
      }
    };

    return recognition;
  };

  const startRecording = async () => {
    try {
      setError(null);
      setTranscript("");
      setInterimTranscript("");
      finalTranscriptRef.current = "";

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;

      // Setup MediaRecorder for audio capture (for Whisper later)
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000,
      });

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000); // Get chunks every second

      // Setup and start Speech Recognition for real-time display
      const recognition = setupSpeechRecognition();
      if (recognition) {
        recognitionRef.current = recognition;
        recognition.start();
      }

      isRecordingRef.current = true;
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

    } catch (err) {
      console.error("Error starting recording:", err);
      setError(t("recordLecture.failedToStart"));
    }
  };

  const stopRecording = async () => {
    isRecordingRef.current = false;

    // Stop speech recognition
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    // Stop timer
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    setIsRecording(false);
    setInterimTranscript("");

    // Stop media recorder and get final audio
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      setIsProcessing(true);
      setPendingText("Spracúvam audio s Whisper AI...");

      await new Promise<void>((resolve) => {
        mediaRecorderRef.current!.onstop = () => resolve();
        mediaRecorderRef.current!.stop();
      });

      // Stop stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      // Transcribe with Whisper for accuracy
      if (audioChunksRef.current.length > 0) {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });

        if (audioBlob.size > 1000) {
          try {
            const formData = new FormData();
            const audioFile = new File([audioBlob], "recording.webm", { type: "audio/webm" });
            formData.append("audio", audioFile);
            formData.append("language", getWhisperLanguage());

            const response = await fetch("/api/transcribe-realtime", {
              method: "POST",
              body: formData,
            });

            if (response.ok) {
              const data = await response.json();
              if (data.text && data.text.trim()) {
                // Replace with Whisper transcription (more accurate)
                setTranscript(data.text.trim());
                finalTranscriptRef.current = data.text.trim();
              }
            }
          } catch (err) {
            console.error("Whisper transcription error:", err);
            // Keep the Web Speech transcript if Whisper fails
          }
        }
      }

      // Format transcript if we have content
      const currentTranscript = finalTranscriptRef.current;
      if (currentTranscript && currentTranscript.trim().length > 0) {
        setPendingText("Formátujem prepis...");

        try {
          const response = await fetch("/api/format-transcript", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ transcript: currentTranscript }),
          });

          if (response.ok) {
            const data = await response.json();
            if (data.formattedTranscript) {
              setTranscript(data.formattedTranscript);
            }
          }
        } catch (err) {
          console.error("Formatting error:", err);
        }
      }

      setIsProcessing(false);
      setPendingText("");
    } else {
      // Stop stream if recorder wasn't active
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    }
  };

  const downloadAsText = async () => {
    setDownloadingFormat("txt");
    try {
      const blob = new Blob([transcript], { type: "text/plain;charset=utf-8" });
      saveAs(blob, `lecture-transcript-${new Date().getTime()}.txt`);
      await new Promise((resolve) => setTimeout(resolve, 500));
    } finally {
      setDownloadingFormat(null);
    }
  };

  const downloadAsWord = async () => {
    setDownloadingFormat("docx");
    try {
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: t("recordLecture.lectureTranscript"),
                    bold: true,
                    size: 32,
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: new Date().toLocaleString(),
                    italics: true,
                  }),
                ],
              }),
              new Paragraph({ text: "" }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: transcript,
                  }),
                ],
              }),
            ],
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `lecture-transcript-${new Date().getTime()}.docx`);
      await new Promise((resolve) => setTimeout(resolve, 500));
    } finally {
      setDownloadingFormat(null);
    }
  };

  const downloadAsPDF = async () => {
    setDownloadingFormat("pdf");
    try {
      const doc = new jsPDF();

      doc.setFontSize(16);
      doc.text(t("recordLecture.lectureTranscript"), 20, 20);

      doc.setFontSize(10);
      doc.text(new Date().toLocaleString(), 20, 30);

      doc.setFontSize(12);
      const lines = doc.splitTextToSize(transcript, 170);
      doc.text(lines, 20, 45);

      doc.save(`lecture-transcript-${new Date().getTime()}.pdf`);
      await new Promise((resolve) => setTimeout(resolve, 500));
    } finally {
      setDownloadingFormat(null);
    }
  };

  const saveToDatabase = async () => {
    setDownloadingFormat("save");
    try {
      if (!transcript || transcript.trim().length === 0) {
        alert(t("recordLecture.cannotSaveEmpty"));
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        alert("Not authenticated");
        return;
      }

      const response = await fetch("/api/lectures", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          title: `Lecture ${new Date().toLocaleDateString()}`,
          transcript: transcript,
          duration: recordingTime,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save lecture");
      }

      setIsSaved(true);
    } catch (err) {
      console.error("Error saving lecture:", err);
      alert(t("recordLecture.failedToSave"));
    } finally {
      setDownloadingFormat(null);
    }
  };

  const reformatTranscript = async () => {
    if (transcript.trim().length === 0) {
      alert(t("recordLecture.noTranscriptToFormat"));
      return;
    }

    setIsProcessing(true);
    setPendingText("Formátujem prepis...");

    try {
      const response = await fetch("/api/format-transcript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.formattedTranscript) {
          setTranscript(data.formattedTranscript);
        }
      } else {
        alert(t("recordLecture.failedToFormat"));
      }
    } catch (err) {
      console.error("Error reformatting:", err);
      alert(t("recordLecture.failedToFormat"));
    } finally {
      setIsProcessing(false);
      setPendingText("");
    }
  };

  const discardRecording = () => {
    if (confirm(t("recordLecture.discardConfirm"))) {
      cleanup();
      setRecordingTime(0);
      setTranscript("");
      setInterimTranscript("");
      finalTranscriptRef.current = "";
      setPendingText("");
      setIsRecording(false);
      setIsProcessing(false);
      setIsSaved(false);
    }
  };

  const hasTranscript = transcript.trim().length > 0;
  const displayText = transcript + (interimTranscript ? " " + interimTranscript : "");

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-linear-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 overflow-hidden">
      <div className="container-custom py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/dashboard")}
            className="mb-4 flex items-center space-x-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-400 transition-colors group cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">
              {t("recordLecture.backToDashboard")}
            </span>
          </button>
          <div className="flex items-center space-x-2 md:space-x-5 bg-linear-to-br from-emerald-600 to-green-500 p-4 md:p-6 rounded-2xl shadow-md">
            <div className="bg-green-100 p-2 md:p-4 rounded-xl md:rounded-2xl shadow-lg">
              <Mic className="w-5 h-5 md:w-8 md:h-8 text-green-500" />
            </div>
            <div>
              <h1 className="text-lg md:text-3xl font-bold text-white mb-1">
                {t("recordLecture.title")}
              </h1>
              <p className="text-gray-100 text-sm md:text-lg">
                {t("recordLecture.description")}
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
          {/* Left Side - Recording Controls */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700 p-5 sm:p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-slate-800 dark:text-gray-200 flex items-center">
                <div className="w-1 h-6 bg-green-500 rounded-full mr-3"></div>
                {t("recordLecture.recordingStudio")}
              </h2>
              {isRecording && (
                <div className="flex items-center space-x-2 bg-red-50 dark:bg-red-900/20 px-2.5 py-1 rounded-full">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-red-600 dark:text-red-400 text-xs font-medium">
                    {t("recordLecture.live")}
                  </span>
                </div>
              )}
            </div>

            {/* Timer Display */}
            <div className="mb-6 text-center bg-gray-50 dark:bg-slate-700/50 rounded-xl p-5 border border-gray-200 dark:border-slate-600">
              <div className="text-4xl md:text-5xl font-bold text-slate-800 dark:text-gray-200 mb-1 font-mono tracking-tight">
                {formatTime(recordingTime)}
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {isRecording
                  ? t("recordLecture.recordingInProgress")
                  : t("recordLecture.readyToRecord")}
              </p>
            </div>

            {/* Recording Button */}
            <div className="flex flex-col items-center mb-5">
              {!isRecording ? (
                <div className="flex flex-col items-center">
                  <button
                    onClick={startRecording}
                    disabled={isProcessing}
                    className="cursor-pointer group relative w-16 h-16 md:w-20 md:h-20 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 disabled:hover:scale-100 flex items-center justify-center mb-3"
                  >
                    <Play
                      className="w-7 h-7 md:w-8 md:h-8 text-white relative z-10 ml-0.5"
                      fill="white"
                    />
                  </button>
                  <span className="text-slate-700 dark:text-gray-300 font-medium">
                    {t("recordLecture.startRecording")}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <button
                    onClick={stopRecording}
                    className="cursor-pointer group relative w-16 h-16 md:w-20 md:h-20 bg-red-500 hover:bg-red-600 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center mb-3"
                  >
                    <div className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-30"></div>
                    <Square
                      className="w-6 h-6 md:w-7 md:h-7 text-white relative z-10"
                      fill="white"
                    />
                  </button>
                  <span className="text-slate-700 dark:text-gray-300 font-medium">
                    {t("recordLecture.stopRecording")}
                  </span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {hasTranscript && !isRecording && (
              <div className="flex justify-center gap-2 mb-4">
                <button
                  onClick={reformatTranscript}
                  disabled={isProcessing}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 dark:text-blue-300 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>{t("recordLecture.reformatText")}</span>
                </button>
                <button
                  onClick={discardRecording}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 text-sm font-medium rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{t("recordLecture.discardRecording")}</span>
                </button>
              </div>
            )}

            {/* Status Messages */}
            {isRecording && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-center space-x-3">
                <div className="relative">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                </div>
                <div>
                  <span className="text-red-700 dark:text-red-300 font-medium text-sm block">
                    {t("recordLecture.recordingActive")}
                  </span>
                  <span className="text-red-600 dark:text-red-400 text-xs">
                    {t("recordLecture.speakClearly")}
                  </span>
                </div>
              </div>
            )}

            {isProcessing && (
              <div className="mt-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3 flex items-center space-x-3">
                <Loader2 className="w-4 h-4 text-purple-600 animate-spin" />
                <div>
                  <span className="text-purple-700 dark:text-purple-300 font-medium text-sm block">
                    {t("recordLecture.processing")}
                  </span>
                  {pendingText && (
                    <span className="text-purple-600 dark:text-purple-400 text-xs">
                      {pendingText}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Side - Live Transcription */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700 p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-800 dark:text-gray-200 flex items-center">
                <div className="w-1 h-6 bg-blue-500 rounded-full mr-3"></div>
                {t("recordLecture.liveTranscription")}
              </h2>
              {(hasTranscript || interimTranscript) && (
                <div className="bg-green-50 dark:bg-green-900/20 px-2.5 py-1 rounded-full">
                  <span className="text-green-600 dark:text-green-400 text-xs font-medium">
                    {displayText.split(/\s+/).filter(Boolean).length} {t("recordLecture.words")}
                  </span>
                </div>
              )}
            </div>

            <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4 min-h-[400px] max-h-[400px] overflow-y-auto border border-gray-200 dark:border-slate-600">
              {displayText.trim() ? (
                <p className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">
                  {transcript}
                  {interimTranscript && (
                    <span className="text-gray-400 dark:text-gray-500 italic">
                      {" "}{interimTranscript}
                    </span>
                  )}
                </p>
              ) : (
                <div className="flex items-center justify-center h-full min-h-[250px]">
                  <div className="text-center text-gray-400">
                    <div className="bg-gray-100 dark:bg-slate-600 p-4 rounded-full mx-auto mb-4 w-fit">
                      <FileText className="w-10 h-10 opacity-50" />
                    </div>
                    <p className="font-medium mb-1">
                      {t("recordLecture.waitingForAudio")}
                    </p>
                    <p className="text-sm text-gray-400 dark:text-gray-500">
                      {t("recordLecture.transcriptionAppears")}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Download Section */}
        {!isRecording && hasTranscript && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700 p-5 sm:p-6">
            <div className="flex items-center mb-4">
              <div className="w-1 h-6 bg-purple-500 rounded-full mr-3"></div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-gray-200">
                {t("recordLecture.exportTranscript")}
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button
                onClick={downloadAsText}
                disabled={downloadingFormat !== null}
                className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {downloadingFormat === "txt" ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span className="font-medium text-sm">TXT</span>
              </button>

              <button
                onClick={downloadAsWord}
                disabled={downloadingFormat !== null}
                className="flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {downloadingFormat === "docx" ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <FileDown className="w-4 h-4" />
                )}
                <span className="font-medium text-sm">DOCX</span>
              </button>

              <button
                onClick={downloadAsPDF}
                disabled={downloadingFormat !== null}
                className="flex items-center justify-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {downloadingFormat === "pdf" ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
                <span className="font-medium text-sm">PDF</span>
              </button>

              {!isSaved ? (
                <button
                  onClick={saveToDatabase}
                  disabled={downloadingFormat !== null}
                  className="flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {downloadingFormat === "save" ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <FileText className="w-4 h-4" />
                  )}
                  <span className="font-medium text-sm">
                    {t("recordLecture.saveToLibrary")}
                  </span>
                </button>
              ) : (
                <button
                  disabled
                  className="flex items-center justify-center space-x-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-4 py-3 rounded-lg cursor-default"
                >
                  <Check className="w-4 h-4" />
                  <span className="font-medium text-sm">
                    {t("recordLecture.lectureSaved")}
                  </span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
