import LectureViewerPage from "@/components/LectureViewerPage";

type Props = {
  params: Promise<{
    lectureId: string;
  }>;
};

export default async function Page({ params }: Props) {
  const { lectureId } = await params;
  return <LectureViewerPage lectureId={lectureId} />;
}
