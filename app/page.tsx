import LoginButton from '@/components/LoginButton';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export const revalidate = 0;

export default async function Home() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If logged in, redirect to Browse
  if (user) {
    redirect('/browse');
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col items-center justify-center px-4">
      <div className="max-w-3xl w-full text-center space-y-8">
        <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tight">
          Rentals made <span className="text-blue-600">simple</span>.
        </h1>
        <p className="text-xl md:text-2xl text-gray-600 max-w-2xl mx-auto">
          Skip the back-and-forth. Book viewings directly with landlords in Toronto.
        </p>
        
        <div className="w-full max-w-sm mx-auto pt-8">
          <LoginButton />
        </div>
      </div>
    </main>
  );
}
