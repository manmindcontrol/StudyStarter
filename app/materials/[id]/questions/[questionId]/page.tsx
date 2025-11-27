import QuestionsViewPage from "@/components/QuestionsViewPage";

type Props = {
  params: Promise<{
    id: string;
    questionId: string;
  }>;
};

export default async function Page({ params }: Props) {
  const { id, questionId } = await params;
  return <QuestionsViewPage materialId={id} questionRecordId={questionId} />;
}
