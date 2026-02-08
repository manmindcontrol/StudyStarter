import { Suspense } from "react";
import QuestionsViewPage from "@/components/QuestionsViewPage";

type Props = {
  params: Promise<{
    id: string;
    questionId: string;
  }>;
};

export default async function Page({ params }: Props) {
  const { id, questionId } = await params;
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}>
      <QuestionsViewPage materialId={id} questionRecordId={questionId} />
    </Suspense>
  );
}
