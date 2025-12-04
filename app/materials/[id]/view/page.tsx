import DocumentViewer from "@/components/DocumentViewer";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function Page({ params }: Props) {
  const { id } = await params;
  return <DocumentViewer materialId={id} />;
}
