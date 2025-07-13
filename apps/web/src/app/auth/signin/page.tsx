import { LoginForm } from "@/components/auth/LoginForm";

interface SignInPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;
  const callbackUrl = typeof params.callbackUrl === 'string' ? params.callbackUrl : '/';
  
  return <LoginForm callbackUrl={callbackUrl} />;
}