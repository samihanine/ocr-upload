import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OCR Server",
  description: "OCR Server",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
