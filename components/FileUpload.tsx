"use client";

import { useCallback, useState } from "react";
import {
  Upload,
  File,
  X,
  CheckCircle,
  AlertCircle,
  Link as LinkIcon,
  FileText,
} from "lucide-react";

type FileUploadProps = {
  onUpload: (file: File) => Promise<void>;
  onUrlUpload?: (url: string, title: string) => Promise<void>;
  onTextUpload?: (text: string, title: string) => Promise<void>;
  acceptedFileTypes?: string[];
  maxSizeMB?: number;
};

type UploadMode = "file" | "url" | "text";

export default function FileUpload({
  onUpload,
  onUrlUpload,
  onTextUpload,
  acceptedFileTypes = [".pdf", ".docx", ".doc", ".txt"],
  maxSizeMB = 10,
}: FileUploadProps) {
  const [mode, setMode] = useState<UploadMode>("file");
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [urlTitle, setUrlTitle] = useState("");
  const [text, setText] = useState("");
  const [textTitle, setTextTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const validateFile = (file: File): string | null => {
    // Check file type
    const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
    if (!acceptedFileTypes.includes(fileExtension)) {
      return `Unsupported file type. Supported: ${acceptedFileTypes.join(
        ", ",
      )}`;
    }

    // Check size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      return `File is too large. Maximum: ${maxSizeMB}MB`;
    }

    return null;
  };

  const validateUrl = (urlString: string): string | null => {
    try {
      const urlObj = new URL(urlString);
      if (!urlObj.protocol.startsWith("http")) {
        return "URL must start with http:// or https://";
      }
      return null;
    } catch {
      return "Invalid URL format";
    }
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
    [handleFile],
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError("");

    try {
      await onUpload(selectedFile);
      setSuccess(true);
      setSelectedFile(null);

      // Reset success after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload error");
    } finally {
      setUploading(false);
    }
  };

  const handleUrlSubmit = async () => {
    if (!url.trim()) {
      setError("Please enter a URL");
      return;
    }

    if (!urlTitle.trim()) {
      setError("Please enter a title for this material");
      return;
    }

    const urlError = validateUrl(url);
    if (urlError) {
      setError(urlError);
      return;
    }

    if (!onUrlUpload) {
      setError("URL upload is not supported");
      return;
    }

    setUploading(true);
    setError("");

    try {
      await onUrlUpload(url, urlTitle);
      setSuccess(true);
      setUrl("");
      setUrlTitle("");

      // Reset success after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload error");
    } finally {
      setUploading(false);
    }
  };

  const handleTextSubmit = async () => {
    if (!text.trim()) {
      setError("Please enter some text");
      return;
    }

    if (!textTitle.trim()) {
      setError("Please enter a title for this material");
      return;
    }

    if (text.trim().length < 50) {
      setError("Text is too short. Please enter at least 50 characters.");
      return;
    }

    if (!onTextUpload) {
      setError("Text upload is not supported");
      return;
    }

    setUploading(true);
    setError("");

    try {
      await onTextUpload(text, textTitle);
      setSuccess(true);
      setText("");
      setTextTitle("");

      // Reset success after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload error");
    } finally {
      setUploading(false);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setError("");
    setSuccess(false);
  };

  const clearUrl = () => {
    setUrl("");
    setUrlTitle("");
    setError("");
    setSuccess(false);
  };

  const clearText = () => {
    setText("");
    setTextTitle("");
    setError("");
    setSuccess(false);
  };

  return (
    <div className="w-full">
      {/* Mode Toggle - Horizontal tabs */}
      <div className="flex gap-2 mb-5 p-1 bg-gray-100 dark:bg-slate-700/50 rounded-xl">
        <button
          onClick={() => {
            setMode("file");
            clearUrl();
            clearText();
          }}
          className={`flex-1 py-2.5 px-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 text-sm ${
            mode === "file"
              ? "bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
          }`}
        >
          <Upload className="w-4 h-4" />
          File
        </button>
        <button
          onClick={() => {
            setMode("url");
            clearFile();
            clearText();
          }}
          className={`flex-1 py-2.5 px-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 text-sm ${
            mode === "url"
              ? "bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
          }`}
        >
          <LinkIcon className="w-4 h-4" />
          URL
        </button>
        <button
          onClick={() => {
            setMode("text");
            clearFile();
            clearUrl();
          }}
          className={`flex-1 py-2.5 px-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 text-sm ${
            mode === "text"
              ? "bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
          }`}
        >
          <FileText className="w-4 h-4" />
          Text
        </button>
      </div>

      {mode === "file" && (
        <>
          {/* Drag & Drop zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer
              ${
                isDragging
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10"
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
              <div className={`w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center ${
                isDragging ? "bg-blue-100 dark:bg-blue-900/30" : "bg-gray-100 dark:bg-slate-700"
              }`}>
                <Upload
                  className={`w-6 h-6 ${isDragging ? "text-blue-600" : "text-gray-500 dark:text-gray-400"}`}
                />
              </div>

              <p className="font-semibold text-gray-900 dark:text-gray-200 mb-1">
                {isDragging ? "Drop file here" : "Drop your file here"}
              </p>

              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                or <span className="text-blue-600 dark:text-blue-400 font-medium">browse</span> to upload
              </p>

              <p className="text-xs text-gray-400 dark:text-gray-500">
                PDF, Word, TXT (max {maxSizeMB}MB)
              </p>
            </label>
          </div>

          {/* Selected file */}
          {selectedFile && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-slate-700 border border-blue-200 dark:border-slate-600 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 dark:bg-slate-600 p-2 rounded-lg">
                    <File className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-200 text-sm">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>

                {!uploading && (
                  <button
                    onClick={clearFile}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Upload button */}
              <button
                onClick={handleFileUpload}
                disabled={uploading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer"
              >
                {uploading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                    Uploading...
                  </>
                ) : (
                  "Upload"
                )}
              </button>
            </div>
          )}
        </>
      )}

      {mode === "url" && (
        <>
          {/* URL Input Form */}
          <div className="space-y-4">
            <div>
              <label
                htmlFor="url-input"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >
                URL
              </label>
              <input
                id="url-input"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/article"
                disabled={uploading}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>

            <div>
              <label
                htmlFor="title-input"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >
                Title
              </label>
              <input
                id="title-input"
                type="text"
                value={urlTitle}
                onChange={(e) => setUrlTitle(e.target.value)}
                placeholder="Enter a title for this material"
                disabled={uploading}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>

            {/* Compact info */}
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Works with Wikipedia, Medium, blogs, docs. For paywalled sites, download PDF and use File tab.
            </p>

            <button
              onClick={handleUrlSubmit}
              disabled={uploading || !url.trim() || !urlTitle.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer"
            >
              {uploading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                  Processing...
                </>
              ) : (
                "Add from URL"
              )}
            </button>
          </div>
        </>
      )}

      {mode === "text" && (
        <>
          {/* Text Input Form */}
          <div className="space-y-4">
            <div>
              <label
                htmlFor="title-input-text"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >
                Title
              </label>
              <input
                id="title-input-text"
                type="text"
                value={textTitle}
                onChange={(e) => setTextTitle(e.target.value)}
                placeholder="Enter a title for this material"
                disabled={uploading}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>

            <div>
              <label
                htmlFor="text-input"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >
                Content
              </label>
              <textarea
                id="text-input"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste or type your text here..."
                disabled={uploading}
                rows={8}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 resize-vertical"
              />
              <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                Min 50 characters ({text.length} entered)
              </p>
            </div>

            <button
              onClick={handleTextSubmit}
              disabled={
                uploading ||
                !text.trim() ||
                !textTitle.trim() ||
                text.trim().length < 50
              }
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer"
            >
              {uploading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                  Processing...
                </>
              ) : (
                "Add from Text"
              )}
            </button>
          </div>
        </>
      )}

      {/* Error message */}
      {error && (
        <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Success message */}
      {success && (
        <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />
          <p className="text-sm text-green-700 dark:text-green-300">
            Upload successful!
          </p>
        </div>
      )}
    </div>
  );
}
