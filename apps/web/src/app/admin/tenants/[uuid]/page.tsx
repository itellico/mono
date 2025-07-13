import { redirect } from 'next/navigation';

interface TenantPageProps {
  params: Promise<{
    uuid: string;
  }>;
}

export default async function TenantPage({ params }: TenantPageProps) {
  const { uuid } = await params;
  redirect(`/admin/tenants/${uuid}/edit`);
}