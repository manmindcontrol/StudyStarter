import MaterialViewPage from "@/components/MaterialViewPage";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function Page({ params }: Props) {
  const { id } = await params;
  return <MaterialViewPage materialId={id} />;
}
