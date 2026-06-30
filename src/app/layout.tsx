import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { ShellProvider } from "@/components/providers/shell-provider";
import { CartProvider } from "@/components/providers/cart-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nexus Compras",
  description: "Decisão de compra, precificação e custo real",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${ibmPlexSans.variable} ${ibmPlexMono.variable} h-full`}
      data-topbar="dark"
      data-theme="light"
      suppressHydrationWarning
    >
      <body className="min-h-full">
        <ShellProvider>
          <CartProvider>{children}</CartProvider>
        </ShellProvider>
        <Toaster />
      </body>
    </html>
  );
}
