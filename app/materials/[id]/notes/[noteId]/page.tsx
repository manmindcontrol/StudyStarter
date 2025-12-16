import NotesViewPage from "@/components/NotesViewPage";

type Props = {
  params: Promise<{
    id: string;
    noteId: string;
  }>;
};

export default async function Page({ params }: Props) {
  const { id, noteId } = await params;
  return <NotesViewPage materialId={id} noteId={noteId} />;
}
