import "./globals.css";
import type { Metadata } from "next";
import { Sora } from "next/font/google";

const font = Sora({ subsets: ["latin"], weight: ["300","400","600","700","800"] });

export const metadata: Metadata = {
  title: "PooPr",
  description: "Track your daily poop patterns with a simple calendar.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={font.className}>{children}</body>
    </html>
  );
}


