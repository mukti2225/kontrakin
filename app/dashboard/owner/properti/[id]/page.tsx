import { notFound } from "next/navigation";
import { PropertiDetailClient } from "./detail-client";
import { getPropertiDetail, getPenghuniTersedia } from "./actions";

interface PropertiDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PropertiDetailPage({ params }: PropertiDetailPageProps) {
  const { id } = await params;
  let properti;
  try {
    properti = await getPropertiDetail(id);
  } catch {
    notFound();
  }

  const penghuniOptions = await getPenghuniTersedia();
  return <PropertiDetailClient properti={properti} penghuniOptions={penghuniOptions} />;
}
