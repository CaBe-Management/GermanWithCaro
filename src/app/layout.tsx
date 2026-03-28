import type { Metadata } from "next";
import { Inter, Newsreader } from "next/font/google";
import "./globals.css";

// Inter — clean sans-serif for all UI text, buttons, labels
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// Newsreader — warm serif for lesson titles and German sentences
const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

// Site metadata — shows in browser tab and search results
export const metadata: Metadata = {
  title: "GermanWithCaro — Learn German with a Native Speaker",
  description:
    "Structured lessons and spaced repetition flashcards to help you learn German the right way.",
};

// Root layout wraps every page in the app
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${newsreader.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
