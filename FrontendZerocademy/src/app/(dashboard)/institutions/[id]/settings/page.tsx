import { InstitutionSettingsPage } from "@/features/institution-settings";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function InstitutionSettingsRoutePage({
  params,
}: PageProps) {
  const { id } = await params;
  return <InstitutionSettingsPage institutionId={id} />;
}
