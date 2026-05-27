import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gestao Empresa",
  description: "Portal de gestao interna com MySQL e integracao GitHub Projects",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt">
      <body>{children}</body>
    </html>
  );
}
