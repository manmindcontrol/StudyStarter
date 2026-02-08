import { Suspense } from "react";
import NotesViewPage from "@/components/NotesViewPage";

type Props = {
  params: Promise<{
    id: string;
    noteId: string;
  }>;
};

export default async function Page({ params }: Props) {
  const { id, noteId } = await params;
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}>
      <NotesViewPage materialId={id} noteId={noteId} />
    </Suspense>
  );
}
