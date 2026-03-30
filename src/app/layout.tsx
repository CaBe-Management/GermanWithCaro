import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GermanWithCaro — Learn German with a Native Speaker",
  description:
    "Structured A1 lessons, spaced repetition flashcards, and real conversations to help you learn German the right way.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
