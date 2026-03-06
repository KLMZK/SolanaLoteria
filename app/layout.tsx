import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Providers } from "./components/providers";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
  title: "Solana Lotería Mexicana",
  description: "Juega a la lotería mexicana tradicional con tus amigos en Solana Devnet.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <Providers>
        <body
          suppressHydrationWarning
          className={`${spaceGrotesk.variable} antialiased`}
          style={{ fontFamily: "var(--font-space-grotesk), system-ui, sans-serif" }}
        >
          {children}
        </body>
      </Providers>
    </html>
  );
}
