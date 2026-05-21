import { InstitutionTransitionsPage } from "@/features/academic-period-transitions";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function InstitutionTransitionsRoutePage({
  params,
}: PageProps) {
  const { id } = await params;
  return <InstitutionTransitionsPage institutionId={id} />;
}
