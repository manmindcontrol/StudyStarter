"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import {
  FileText,
  Calendar,
  FileQuestion,
  StickyNote,
  ArrowLeft,
  Trash2,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import GenerateQuestionsButton from "@/components/buttons/GenerateQuestionsButton";
import GenerateNotesButton from "@/components/buttons/GenerateNotesButton";
import DeleteButton from "@/components/buttons/DeleteButton";
import OpenDocumentButton from "@/components/buttons/OpenDocumentButton";
import ConfirmDeleteModal from "@/components/modals/ConfirmDeleteModal";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "@/hooks/useTranslation";

type Material = {
  id: string;
  title: string;
  content: string | null;
  file_name: string | null;
  file_type: string | null;
  storage_path: string | null;
  created_at: string;
  dark_mode?: boolean;
};

type GeneratedQuestion = {
  question: string;
  type: "open" | "mcq";
  options: string[] | null;
  answer: string | null;
};

type KeyPoint = {
  title: string;
  description: string;
  importance: "high" | "medium" | "low";
};

type Concept = {
  concept: string;
  explanation: string;
  examples: string[];
};

type QuestionSet = {
  id: string;
  created_at: string;
  question_type: string;
  questions: GeneratedQuestion[];
};

type NoteSet = {
  id: string;
  created_at: string;
  summary: string;
  key_points: KeyPoint[];
  concepts: Concept[];
};

type Props = {
  materialId: string;
};

export default function MaterialViewPage({ materialId }: Props) {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [material, setMaterial] = useState<Material | null>(null);
  const [stats, setStats] = useState({
    questionsCount: 0,
    notesCount: 0,
  });
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([]);
  const [noteSets, setNoteSets] = useState<NoteSet[]>([]);

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    type: "question" | "note" | "all-questions" | "all-notes";
    id?: string;
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: "question",
    title: "",
    message: "",
  });
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const { user } = await getCurrentUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUser(user);

      // Load material
      const { data: materialData, error: materialError } = await supabase
        .from("materials")
        .select("*")
        .eq("id", materialId)
        .single();

      if (materialError || !materialData) {
        console.error("Material error:", materialError);
        setLoading(false);
        return;
      }

      setMaterial(materialData);

      // Load saved question sets and notes
      const [
        { data: questionsData, count: questionsCount },
        { data: notesData, count: notesCount },
      ] = await Promise.all([
        supabase
          .from("generated_questions")
          .select("*", { count: "exact" })
          .eq("material_id", materialId)
          .order("created_at", { ascending: false }),
        supabase
          .from("study_notes")
          .select("*", { count: "exact" })
          .eq("material_id", materialId)
          .order("created_at", { ascending: false }),
      ]);

      setStats({
        questionsCount: questionsCount || 0,
        notesCount: notesCount || 0,
      });

      setQuestionSets(questionsData || []);
      setNoteSets(notesData || []);

      setLoading(false);
    };

    loadData();
  }, [materialId, router]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  const { isDarkMode, toggleDarkMode } = useTheme();
  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      if (deleteModal.type === "all-questions") {
        // Delete all question sets
        const { error } = await supabase
          .from("generated_questions")
          .delete()
          .eq("material_id", materialId);

        if (!error) {
          setQuestionSets([]);
          setStats((prev) => ({ ...prev, questionsCount: 0 }));
        }
      } else if (deleteModal.type === "all-notes") {
        // Delete all note sets
        const { error } = await supabase
          .from("study_notes")
          .delete()
          .eq("material_id", materialId);

        if (!error) {
          setNoteSets([]);
          setStats((prev) => ({ ...prev, notesCount: 0 }));
        }
      } else if (deleteModal.type === "question" && deleteModal.id) {
        // Delete single question set
        const { error } = await supabase
          .from("generated_questions")
          .delete()
          .eq("id", deleteModal.id);

        if (!error) {
          setQuestionSets(questionSets.filter((q) => q.id !== deleteModal.id));
          setStats((prev) => ({
            ...prev,
            questionsCount: prev.questionsCount - 1,
          }));
        }
      } else if (deleteModal.type === "note" && deleteModal.id) {
        // Delete single note set
        const { error } = await supabase
          .from("study_notes")
          .delete()
          .eq("id", deleteModal.id);

        if (!error) {
          setNoteSets(noteSets.filter((n) => n.id !== deleteModal.id));
          setStats((prev) => ({
            ...prev,
            notesCount: prev.notesCount - 1,
          }));
        }
      }
    } catch (error) {
      console.error("Error deleting:", error);
    } finally {
      setIsDeleting(false);
      setDeleteModal({
        isOpen: false,
        type: "question",
        title: "",
        message: "",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 via-gray-100 to-cyan-50 dark:bg-linear-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  if (!material) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 via-gray-100 to-cyan-50 dark:bg-linear-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {t("materialView.materialNotFound")}
          </h2>
          <button
            onClick={() => router.push("/materials")}
            className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            {t("materialView.backToMaterials")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-gray-100 to-cyan-50 dark:bg-linear-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 overflow-hidden">
      {/* Header */}

      {/* Content */}
      <div className="container-custom py-3 sm:py-4 md:py-6 lg:py-8 px-3 sm:px-4">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => router.push("/dashboard")}
            className="mb-2 sm:mb-3 md:mb-4 flex items-center space-x-1.5 sm:space-x-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-500 transition-colors group cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm sm:text-base font-medium">
              {t("materialView.backToDashboard")}
            </span>
          </button>
          {/* Document Info Card */}
          <div className="bg-linear-to-r from-blue-600 to-cyan-500 dark:bg-linear-to-r dark:from-blue-700 dark:to-cyan-600 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 lg:p-8 mb-3 sm:mb-4 md:mb-6 lg:mb-8 shadow-sm">
            <div className="flex items-start space-x-2 sm:space-x-3 md:space-x-5">
              <div className="bg-white/20 backdrop-blur-sm p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl shrink-0">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-8 lg:h-8 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold text-white mb-1 sm:mb-1.5 md:mb-2 leading-tight wrap-break-word">
                  {material.title}
                </h2>
                <div className="flex items-center text-[10px] sm:text-xs md:text-sm text-white/80">
                  <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 mr-1 sm:mr-1.5 md:mr-2 shrink-0" />
                  <span className="truncate">
                    {t("materialView.uploaded")} {formatDate(material.created_at)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            {/* Left Column - Actions */}
            <div className="lg:col-span-2 space-y-2 sm:space-y-3 md:space-y-4">
              {/* Open Document */}
              <OpenDocumentButton
                className="cursor-pointer"
                materialId={materialId}
              />

              {/* Generate Study Notes */}
              <GenerateNotesButton
                className="cursor-pointer"
                materialId={materialId}
                lang={locale}
              />

              {/* Generate Exam Questions */}
              <GenerateQuestionsButton
                materialId={materialId}
                questionType="exam"
                lang={locale}
              />

              {/* Saved Question Sets */}
              {questionSets.length > 0 && (
                <div className="bg-white border dark:bg-slate-800/80 border-gray-200 dark:border-slate-700 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
                    <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 dark:text-gray-300 flex items-center min-w-0">
                      <FileQuestion className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 text-green-600 dark:text-green-400 shrink-0" />
                      <span className="truncate">
                        {t("materialView.savedQuestionSets")} ({questionSets.length})
                      </span>
                    </h3>
                    <button
                      onClick={() =>
                        setDeleteModal({
                          isOpen: true,
                          type: "all-questions",
                          title: t("materialView.deleteAllQuestionSets"),
                          message: t("materialView.deleteAllQuestionSetsMessage").replace("{count}", questionSets.length.toString()),
                        })
                      }
                      className="text-xs sm:text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-500 font-medium flex items-center gap-0.5 sm:gap-1 cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden xs:inline">{t("materialView.deleteAll")}</span>
                    </button>
                  </div>
                  <div className="space-y-2 sm:space-y-3">
                    {questionSets.map((set) => (
                      <div
                        key={set.id}
                        className="flex items-center gap-3 sm:gap-2"
                      >
                        <button
                          onClick={() =>
                            router.push(
                              `/materials/${materialId}/questions/${set.id}`
                            )
                          }
                          className="flex-1 text-left p-2.5 sm:p-3 md:p-4 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-800/30 rounded-lg transition-colors border border-green-200 hover:border-green-300 dark:border-none"
                        >
                          <div className="flex items-center justify-between gap-2 cursor-pointer">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs sm:text-sm md:text-base font-medium text-gray-900 dark:text-gray-300 truncate">
                                {set.question_type.charAt(0).toUpperCase() +
                                  set.question_type.slice(1)}{" "}
                                {t("materialView.questions")}
                              </p>
                              <p className="text-[10px] sm:text-xs md:text-sm text-gray-600 dark:text-gray-400 truncate">
                                {set.questions.length} {t("materialView.questions").toLowerCase()} •{" "}
                                {formatDate(set.created_at)}
                              </p>
                            </div>
                            <FileQuestion className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400 shrink-0" />
                          </div>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteModal({
                              isOpen: true,
                              type: "question",
                              id: set.id,
                              title: t("materialView.deleteQuestionSet"),
                              message: t("materialView.deleteQuestionSetMessage")
                                .replace("{type}", set.question_type)
                                .replace("{count}", set.questions.length.toString()),
                            });
                          }}
                          className="p-2 sm:p-2.5 md:p-3 bg-red-50 hover:bg-red-100 text-red-600 dark:text-red-400 dark:bg-slate-800 dark:hover:bg-slate-800 dark:hover:text-red-500 rounded-lg transition-colors shrink-0 cursor-pointer"
                          title={t("materialView.deleteQuestionSetTitle")}
                        >
                          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Saved Study Notes */}
              {noteSets.length > 0 && (
                <div className="bg-white border border-gray-200 dark:border-slate-700 dark:bg-slate-800/80 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
                    <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 dark:text-gray-300 flex items-center min-w-0">
                      <StickyNote className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 text-purple-600 dark:text-purple-400 shrink-0" />
                      <span className="truncate">
                        {t("materialView.savedStudyNotes")} ({noteSets.length})
                      </span>
                    </h3>
                    <button
                      onClick={() =>
                        setDeleteModal({
                          isOpen: true,
                          type: "all-notes",
                          title: t("materialView.deleteAllStudyNotes"),
                          message: t("materialView.deleteAllStudyNotesMessage").replace("{count}", noteSets.length.toString()),
                        })
                      }
                      className="text-xs sm:text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-500 font-medium flex items-center gap-0.5 sm:gap-1 cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden xs:inline">{t("materialView.deleteAll")}</span>
                    </button>
                  </div>
                  <div className="space-y-2 sm:space-y-3">
                    {noteSets.map((note) => (
                      <div
                        key={note.id}
                        className="flex items-center gap-2 sm:gap-2"
                      >
                        <button
                          onClick={() =>
                            router.push(
                              `/materials/${materialId}/notes/${note.id}`
                            )
                          }
                          className="flex-1 min-w-0 text-left p-2.5 sm:p-3 md:p-4 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-800/30 rounded-lg transition-colors border border-purple-200 hover:border-purple-300 dark:border-none"
                        >
                          <div className="flex items-center justify-between gap-2 cursor-pointer">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs sm:text-sm md:text-base font-medium text-gray-900 dark:text-gray-300 line-clamp-1">
                                {note.summary.substring(0, 60)}
                                {note.summary.length > 60 ? "..." : ""}
                              </p>
                              <p className="text-[10px] sm:text-xs md:text-sm text-gray-600 dark:text-gray-400 truncate">
                                {note.key_points.length} {t("materialView.keyPoints")} •{" "}
                                {note.concepts.length} {t("materialView.concepts")} •{" "}
                                {formatDate(note.created_at)}
                              </p>
                            </div>
                            <StickyNote className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400 shrink-0" />
                          </div>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteModal({
                              isOpen: true,
                              type: "note",
                              id: note.id,
                              title: t("materialView.deleteStudyNotes"),
                              message: t("materialView.deleteStudyNotesMessage")
                                .replace("{keyPoints}", note.key_points.length.toString())
                                .replace("{concepts}", note.concepts.length.toString()),
                            });
                          }}
                          className="p-2 sm:p-2.5 md:p-3 bg-red-50 hover:bg-red-100 text-red-600 dark:text-red-400 dark:bg-slate-800 dark:hover:bg-slate-800 dark:hover:text-red-500 rounded-lg transition-colors shrink-0 cursor-pointer"
                          title={t("materialView.deleteNoteSetTitle")}
                        >
                          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Delete Document */}
              <DeleteButton
                className="cursor-pointer"
                materialId={materialId}
                materialTitle={material.title}
              />
            </div>

            {/* Right Column - Statistics */}
            <div className="space-y-3 sm:space-y-4">
              <div className="bg-white border border-gray-200 dark:bg-slate-800/80 dark:border-slate-700 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 shadow-sm">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-300 mb-3 sm:mb-4">
                  {t("materialView.statistics")}
                </h3>

                <div className="space-y-3 sm:space-y-4">
                  {/* Questions Generated */}
                  <div className="flex items-center justify-between p-2.5 sm:p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div className="bg-green-100 dark:bg-green-900 p-1.5 sm:p-2 rounded-lg">
                        <FileQuestion className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                          {t("materialView.questionSets")}
                        </p>
                        <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-300">
                          {stats.questionsCount}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Notes Generated */}
                  <div className="flex items-center justify-between p-2.5 sm:p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div className="bg-purple-100 dark:bg-purple-900 p-1.5 sm:p-2 rounded-lg">
                        <StickyNote className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                          {t("materialView.studyNotes")}
                        </p>
                        <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-300">
                          {stats.notesCount}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* File Info */}
              <div className="bg-white border border-gray-200 dark:bg-slate-800/80 dark:border-slate-700 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 shadow-sm">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-300 mb-3 sm:mb-4">
                  {t("materialView.fileInfo")}
                </h3>
                <div className="space-y-2.5 sm:space-y-3">
                  <div>
                    <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1">
                      {t("materialView.fileType")}
                    </p>
                    <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-300">
                      {material.file_type || t("materialView.unknown")}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1">
                      {t("materialView.uploaded")}
                    </p>
                    <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-300">
                      {formatDate(material.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={deleteModal.isOpen}
        onClose={() =>
          setDeleteModal({
            isOpen: false,
            type: "question",
            title: "",
            message: "",
          })
        }
        onConfirm={handleDeleteConfirm}
        title={deleteModal.title}
        message={deleteModal.message}
        isDeleting={isDeleting}
      />
    </div>
  );
}
