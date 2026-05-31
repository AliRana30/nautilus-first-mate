import type { Metadata } from "next";
import { Cinzel, Poppins, JetBrains_Mono } from "next/font/google";
import StarfieldVoyage from "@/components/StarfieldVoyage";
import "@/styles/globals.css";

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nautilus First Mate — Coral SQL Reasoning Agent",
  description: "A naval-themed, data-first personal assistant powered by the Coral SQL intelligence layer and Groq reasoning engine.",
  keywords: ["Coral SQL", "AI Agent", "Naval theme", "Data-first", "Groq Reasoning Engine"],
  authors: [{ name: "Nautilus Crew" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
 }) {
  return (
    <html
      lang="en"
      className={`${cinzel.variable} ${poppins.variable} ${jetbrainsMono.variable} h-full`}
    >
      <body className="h-full bg-navy text-parchment font-sans flex flex-col antialiased selection:bg-gold selection:text-navy-deep">
        {/* Starfield & Animated Voyage Backdrop */}
        <StarfieldVoyage />

        {/* Decorative subtle header line */}
        <div className="h-1 w-full bg-gradient-to-r from-rust via-gold to-rust" />
        
        {/* Ocean Grid background pattern overlay */}
        <div className="absolute inset-0 ocean-grid pointer-events-none opacity-50 z-0" />
        
        {/* Main Content Area */}
        <div className="relative z-10 flex-1 flex flex-col h-full overflow-hidden">
          {children}
        </div>
      </body>
    </html>
  );
}
