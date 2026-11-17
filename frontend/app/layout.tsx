import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "CineMatch — AI Powered Movie Discovery & Recommendations",
  description:
    "Explore movies and find content-similar recommendations powered by TF-IDF and cosine similarity on MovieLens dataset.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans bg-charcoal-950 text-slate-100 flex flex-col min-h-screen antialiased selection:bg-amber-500/20 selection:text-amber-400">
        <Header />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {children}
        </main>
        <footer className="border-t border-charcoal-800 bg-charcoal-900/50 py-6 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p>
              CineMatch · Built with Next.js App Router, FastAPI &amp; Scikit-learn.
            </p>
            <p>
              Dataset: <span className="text-slate-400">MovieLens Latest Small (GroupLens)</span>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
