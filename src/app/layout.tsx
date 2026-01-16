import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DevHub - Portal de Desarrollo Gamificado",
  description: "El ecosistema todo-en-uno para desarrolladores de videojuegos. Ideacion con IA, gestion de scope y herramientas de produccion.",
  keywords: ["game development", "game jam", "ai tools", "game design"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
