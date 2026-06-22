import { redirect } from 'next/navigation';

export default function RootPage() {
  // Middleware will intercept, but as a fallback, server redirect to dashboard
  redirect('/dashboard');
}
