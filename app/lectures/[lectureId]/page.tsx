import LectureViewPage from "@/components/LectureViewPage";

type Props = {
  params: Promise<{
    lectureId: string;
  }>;
};

export default async function LecturePage({ params }: Props) {
  const { lectureId } = await params;
  return <LectureViewPage lectureId={lectureId} />;
}
