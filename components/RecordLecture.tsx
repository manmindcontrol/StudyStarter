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
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { saveAs } from "file-saver";
import { Document, Paragraph, TextRun, Packer } from "docx";
import jsPDF from "jspdf";
import LoadingSpinner from "./LoadingSpinner";

// Web Speech API type definitions
interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: ISpeechRecognitionEvent) => void) | null;
  onerror: ((event: ISpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

interface ISpeechRecognitionEvent {
  resultIndex: number;
  results: ISpeechRecognitionResultList;
}

interface ISpeechRecognitionResultList {
  length: number;
  item(index: number): ISpeechRecognitionResult;
  [index: number]: ISpeechRecognitionResult;
}

interface ISpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): ISpeechRecognitionAlternative;
  [index: number]: ISpeechRecognitionAlternative;
}

interface ISpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface ISpeechRecognitionErrorEvent {
  error: string;
  message: string;
}

interface ISpeechRecognitionConstructor {
  new (): ISpeechRecognition;
}

interface WindowWithSpeechRecognition extends Window {
  SpeechRecognition?: ISpeechRecognitionConstructor;
  webkitSpeechRecognition?: ISpeechRecognitionConstructor;
}

type RecordLectureProps = {
  user: User;
};

export default function RecordLecture({ user }: RecordLectureProps) {
  const router = useRouter();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadingFormat, setDownloadingFormat] = useState<
    "txt" | "docx" | "pdf" | "save" | null
  >(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Setup MediaRecorder for audio recording
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();

      // Setup Web Speech API for real-time transcription
      const windowWithSpeech = window as WindowWithSpeechRecognition;
      const SpeechRecognitionAPI =
        windowWithSpeech.SpeechRecognition ||
        windowWithSpeech.webkitSpeechRecognition;

      if (SpeechRecognitionAPI) {
        const recognition = new SpeechRecognitionAPI();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "sk-SK";

        recognition.onresult = (event: ISpeechRecognitionEvent) => {
          let interimTranscript = "";
          let finalText = "";

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcriptPiece = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalText += transcriptPiece + " ";
            } else {
              interimTranscript += transcriptPiece;
            }
          }

          if (finalText) {
            setFinalTranscript((prev) => prev + finalText);
          }
          setTranscript(interimTranscript);
        };

        recognition.onerror = (event: ISpeechRecognitionErrorEvent) => {
          console.error("Speech recognition error:", event.error);

          // Don't restart on abort error (user stopped intentionally)
          if (event.error === "aborted" || event.error === "no-speech") {
            return;
          }

          // For other errors, log but continue recording
          console.warn("Recognition error occurred, but continuing...");
        };

        recognition.onend = () => {
          // Auto-restart recognition if still recording
          // This handles cases where recognition stops due to silence or timeout
          if (mediaRecorderRef.current?.state === "recording") {
            try {
              recognition.start();
            } catch (error) {
              console.error("Failed to restart recognition:", error);
            }
          }
        };

        recognition.start();
        recognitionRef.current = recognition;
      }

      setIsRecording(true);
      setRecordingTime(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error starting recording:", error);
      alert("Failed to start recording. Please check microphone permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());

      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }

      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }

      setIsRecording(false);

      // Format transcript in background - don't block UI
      const rawTranscript = finalTranscript + transcript;
      if (rawTranscript.trim().length > 0) {
        setIsProcessing(true);

        // Run formatting async without blocking
        fetch("/api/format-transcript", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ transcript: rawTranscript }),
        })
          .then((response) => response.json())
          .then((data) => {
            if (data.formattedTranscript) {
              setFinalTranscript(data.formattedTranscript);
              setTranscript("");
            }
          })
          .catch((error) => {
            console.error("Error formatting transcript:", error);
            // Keep original transcript if formatting fails
          })
          .finally(() => {
            setIsProcessing(false);
          });
      }
    }
  };

  const downloadAsText = async () => {
    setDownloadingFormat("txt");
    try {
      const fullText = finalTranscript + transcript;
      const blob = new Blob([fullText], { type: "text/plain;charset=utf-8" });
      saveAs(blob, `lecture-transcript-${new Date().getTime()}.txt`);
      await new Promise((resolve) => setTimeout(resolve, 500));
    } finally {
      setDownloadingFormat(null);
    }
  };

  const downloadAsWord = async () => {
    setDownloadingFormat("docx");
    try {
      const fullText = finalTranscript + transcript;
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Lecture Transcript",
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
                    text: fullText,
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
      const fullText = finalTranscript + transcript;
      const doc = new jsPDF();

      doc.setFontSize(16);
      doc.text("Lecture Transcript", 20, 20);

      doc.setFontSize(10);
      doc.text(new Date().toLocaleString(), 20, 30);

      doc.setFontSize(12);
      const lines = doc.splitTextToSize(fullText, 170);
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
      const fullText = finalTranscript + transcript;

      // Validate transcript is not empty before saving
      if (!fullText || fullText.trim().length === 0) {
        alert("Cannot save empty transcript");
        return;
      }

      const { error } = await supabase.from("lectures").insert({
        user_id: user.id,
        title: `Lecture ${new Date().toLocaleDateString()}`,
        transcript: fullText,
        duration: recordingTime,
      });

      if (error) throw error;

      alert("Lecture saved successfully!");
      router.push("/dashboard");
    } catch (error) {
      console.error("Error saving lecture:", error);
      alert("Failed to save lecture.");
    } finally {
      setDownloadingFormat(null);
    }
  };

  const reformatTranscript = async () => {
    setIsProcessing(true);
    try {
      const currentText = finalTranscript + transcript;

      if (currentText.trim().length === 0) {
        alert("No transcript to format");
        return;
      }

      const response = await fetch("/api/format-transcript", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ transcript: currentText }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.formattedTranscript) {
          setFinalTranscript(data.formattedTranscript);
          setTranscript("");
        }
      } else {
        alert("Failed to format transcript");
      }
    } catch (error) {
      console.error("Error reformatting transcript:", error);
      alert("Failed to format transcript");
    } finally {
      setIsProcessing(false);
    }
  };

  const discardRecording = () => {
    if (
      confirm(
        "Are you sure you want to discard this recording? This action cannot be undone."
      )
    ) {
      setRecordingTime(0);
      setTranscript("");
      setFinalTranscript("");
      if (isRecording) {
        stopRecording();
      }
    }
  };

  const fullText = finalTranscript + transcript;
  const hasTranscript = fullText.trim().length > 0;

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
            <span className="font-medium">Back to Dashboard</span>
          </button>
          <div className="flex items-center space-x-2 md:space-x-5 bg-linear-to-br from-emerald-600 to-green-400 p-6 rounded-2xl shadow-md">
            <div className="bg-green-100  p-4 rounded-2xl shadow-lg">
              <Mic className="w-5 h-5 md:w-8 md:h-8 text-green-500" />
            </div>
            <div>
              <h1 className="text-lg md:text-3xl font-bold text-white mb-1">
                Record Lecture
              </h1>
              <p className="text-gray-100 text-l md:text-lg">
                Capture audio with AI-powered real-time transcription
              </p>
            </div>
          </div>
        </div>

        {/* Main Content - Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Left Side - Recording Controls */}
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 dark:border-slate-700 p-8 hover:shadow-2xl transition-shadow">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-gray-200 flex items-center">
                <div className="w-2 h-8 bg-linear-to-b from-green-500 to-green-600 rounded-full mr-3"></div>
                Recording Studio
              </h2>
              {isRecording && (
                <div className="flex items-center space-x-2 bg-red-50 px-3 py-1.5 rounded-full">
                  <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                  <span className="text-red-600 text-sm font-medium">LIVE</span>
                </div>
              )}
            </div>

            {/* Timer Display */}
            <div className="mb-10 text-center bg-white dark:bg-slate-700/70 rounded-2xl p-8 border border-slate-200 dark:border-slate-700">
              <div className="text-4xl md:text-7xl font-bold bg-linear-to-r from-slate-700 to-slate-900 dark:from-gray-300 dark:to-gray-200 bg-clip-text text-transparent mb-3 font-mono tracking-tight">
                {formatTime(recordingTime)}
              </div>
              <p className="text-gray-600 font-medium">
                {isRecording ? "Recording in progress..." : "Ready to record"}
              </p>
            </div>

            {/* Recording Button */}
            <div className="flex flex-col items-center mb-8">
              {!isRecording ? (
                <div className="flex flex-col items-center">
                  <button
                    onClick={startRecording}
                    className="cursor-pointer group relative w-20 h-20 md:w-32 md:h-32 bg-linear-to-br from-green-400 to-emerald-600 hover:from-green-500 hover:to-emeral-700 rounded-full shadow-2xl hover:shadow-3xl transition-all hover:scale-110 flex items-center justify-center mb-4"
                  >
                    <div className="absolute inset-0 rounded-full bg-white/20 group-hover:animate-ping"></div>
                    <Play
                      className="w-9 h-9 md:w-12 md:h-12 text-white relative z-10 ml-1"
                      fill="white"
                    />
                  </button>
                  <span className="text-slate-800 dark:text-gray-300 text-lg font-semibold">
                    Start Recording
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <button
                    onClick={stopRecording}
                    className="group relative w-32 h-32 bg-linear-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-full shadow-2xl hover:shadow-3xl transition-all hover:scale-110 flex items-center justify-center mb-4 animate-pulse"
                  >
                    <div className="absolute inset-0 rounded-full bg-white/20 animate-ping"></div>
                    <Square
                      className="w-10 h-10 text-white relative z-10"
                      fill="white"
                    />
                  </button>
                  <span className="text-slate-800 dark:text-gray-300 text-lg font-semibold">
                    Stop Recording
                  </span>
                </div>
              )}
            </div>

            {/* Action Buttons - Show if there's a transcript */}
            {hasTranscript && (
              <div className="flex justify-center gap-3 mb-6">
                <button
                  onClick={reformatTranscript}
                  disabled={isProcessing}
                  className="flex items-center space-x-2 px-6 py-3 bg-blue-50 hover:bg-blue-100 text-blue-600 dark:text-blue-300 dark:bg-blue-300/20 dark:hover:bg-blue-600/20 font-medium rounded-lg transition-colors border border-blue-200 dark:border-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>Reformat Text</span>
                </button>
                <button
                  onClick={discardRecording}
                  className="flex items-center space-x-2 px-6 py-3 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-600/20 font-medium rounded-lg transition-colors border border-red-200 dark:border-red-900/20 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Discard Recording</span>
                </button>
              </div>
            )}

            {/* Recording Status */}
            {isRecording && (
              <div className="bg-linear-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-xl p-5 flex items-center space-x-4 shadow-sm">
                <div className="relative">
                  <div className="w-4 h-4 bg-red-600 rounded-full animate-pulse"></div>
                  <div className="absolute inset-0 w-4 h-4 bg-red-600 rounded-full animate-ping"></div>
                </div>
                <div>
                  <span className="text-red-800 font-bold text-lg block">
                    Recording Active
                  </span>
                  <span className="text-red-600 text-sm">
                    Speak clearly into your microphone
                  </span>
                </div>
              </div>
            )}

            {isProcessing && (
              <div className="bg-linear-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-5 flex items-center space-x-4 shadow-sm">
                <div className="animate-spin rounded-full h-6 w-6 border-3 border-blue-600 border-t-transparent"></div>
                <div>
                  <span className="text-blue-800 font-bold text-lg block">
                    Processing
                  </span>
                  <span className="text-blue-600 text-sm">
                    Adding punctuation and formatting text...
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Right Side - Live Transcription */}
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 dark:border-slate-700 p-8 hover:shadow-2xl transition-shadow">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-gray-200 flex items-center">
                <div className="w-2 h-8 bg-linear-to-b from-blue-500 to-cyan-500 rounded-full mr-3"></div>
                Live Transcription
              </h2>
              {hasTranscript && (
                <div className="bg-green-50 px-3 py-1.5 rounded-full">
                  <span className="text-green-600 text-sm font-medium">
                    {finalTranscript.split(" ").length} words
                  </span>
                </div>
              )}
            </div>

            <div className="bg-gray-50 dark:bg-slate-700/70 rounded-2xl p-6 min-h-[500px] max-h-[600px] overflow-y-auto border border-gray-200 dark:border-slate-700 shadow-inner">
              {hasTranscript ? (
                <div className="space-y-2">
                  <p className="text-gray-800 dark:text-gray-200 text-lg leading-relaxed whitespace-pre-wrap">
                    {finalTranscript}
                    <span className="text-blue-600 dark:text-blue-400 italic font-medium">
                      {transcript}
                    </span>
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-400">
                    <div className="bg-linear-to-br from-gray-100 to-gray-200 dark:bg-linear-to-br dark:from-gray-700 dark:to-gray-600 p-6 rounded-full mx-auto mb-6 w-fit">
                      <FileText className="w-16 h-16 opacity-50" />
                    </div>
                    <p className="text-lg font-medium mb-2">
                      Waiting for audio...
                    </p>
                    <p className="text-sm">
                      Your transcription will appear here in real-time
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Download Section */}
        {!isRecording && hasTranscript && (
          <div className="bg-white/80 dark:bg-slate-700 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 dark:border-slate-700 p-8 hover:shadow-2xl transition-shadow">
            <div className="flex items-center mb-8">
              <div className="w-2 h-8 bg-linear-to-b from-purple-500 to-pink-600 rounded-full mr-3"></div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-gray-200">
                Export Your Transcript
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <button
                onClick={downloadAsText}
                disabled={downloadingFormat !== null}
                className="relative group flex items-center justify-center space-x-3 bg-linear-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 dark:bg-blue-900/20 text-white px-6 py-4 rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {downloadingFormat === "txt" ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <Download className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
                )}
                <div className="text-left">
                  <div className="font-bold">TXT</div>
                  <div className="text-xs opacity-90">Plain Text</div>
                </div>
              </button>

              <button
                onClick={downloadAsWord}
                disabled={downloadingFormat !== null}
                className="relative group flex items-center justify-center space-x-3 bg-linear-to-br from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white px-6 py-4 rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {downloadingFormat === "docx" ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <FileDown className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
                )}
                <div className="text-left">
                  <div className="font-bold">DOCX</div>
                  <div className="text-xs opacity-90">Word Doc</div>
                </div>
              </button>

              <button
                onClick={downloadAsPDF}
                disabled={downloadingFormat !== null}
                className="relative group flex items-center justify-center space-x-3 bg-linear-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-6 py-4 rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {downloadingFormat === "pdf" ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <FileText className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
                )}
                <div className="text-left">
                  <div className="font-bold">PDF</div>
                  <div className="text-xs opacity-90">Document</div>
                </div>
              </button>

              <button
                onClick={saveToDatabase}
                disabled={downloadingFormat !== null}
                className="relative group flex items-center justify-center space-x-3 bg-linear-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-4 rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {downloadingFormat === "save" ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <FileText className="w-5 h-5 group-hover:scale-110 transition-transform" />
                )}
                <div className="text-left">
                  <div className="font-bold">Save</div>
                  <div className="text-xs opacity-90">To Library</div>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
