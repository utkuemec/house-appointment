import LoginButton from '@/components/LoginButton';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export const revalidate = 0;

export default async function Home() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect('/browse');
  }

  return (
    <main className="min-h-screen relative flex flex-col items-center justify-center px-4 overflow-hidden dark:bg-gray-950">
      {/* Background Image with Overlay - Only visible in Light Mode via ThemeProvider logic or CSS if we prefer specific handling */}
      <div 
        className="absolute inset-0 z-0 dark:hidden"
        style={{
          backgroundImage: "url('/background.jpg')", 
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
      </div>

      <div className="max-w-3xl w-full text-center space-y-8 relative z-10">
        <h1 className="text-5xl md:text-7xl font-extrabold text-white dark:text-gray-100 tracking-tight drop-shadow-lg">
          Rentals made <span className="text-blue-400">simple</span>.
        </h1>
        <p className="text-xl md:text-2xl text-gray-200 dark:text-gray-400 max-w-2xl mx-auto drop-shadow-md">
          Skip the back-and-forth. Book viewings directly with landlords in Toronto.
        </p>
        
        <div className="w-full max-w-sm mx-auto pt-8">
          <LoginButton />
        </div>
      </div>
    </main>
  );
}
