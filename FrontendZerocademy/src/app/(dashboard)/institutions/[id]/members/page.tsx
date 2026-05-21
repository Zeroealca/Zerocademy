import { InstitutionMembersPage } from "@/features/institution-memberships";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function InstitutionMembersRoutePage({ params }: PageProps) {
  const { id } = await params;
  return <InstitutionMembersPage institutionId={id} />;
}
