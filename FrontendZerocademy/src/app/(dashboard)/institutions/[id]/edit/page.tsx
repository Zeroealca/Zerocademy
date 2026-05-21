import { EditInstitutionPage } from "@/features/institutions";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function InstitutionEditPage({ params }: PageProps) {
  const { id } = await params;
  return <EditInstitutionPage institutionId={id} />;
}
