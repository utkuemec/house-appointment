import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "ViewTO - Rental Scheduling",
  description: "Book viewings directly with landlords in Toronto",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased relative min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300">
        <ThemeProvider>
          {/* Global Background Image - Only visible in Light Mode via CSS logic or we toggle classes */}
          <div 
            className="fixed inset-0 z-[-1] dark:hidden"
            style={{
              backgroundImage: "url('/background.jpg')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundAttachment: 'fixed',
            }}
          >
            <div className="absolute inset-0 bg-white/90 backdrop-blur-[2px]"></div>
          </div>
          
          {/* Dark Mode Background */}
          <div className="fixed inset-0 z-[-1] hidden dark:block bg-gray-950"></div>

          <div className="relative z-10">
            <Navbar />
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
