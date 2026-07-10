import type { Metadata } from "next";
import { Playfair_Display, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { AuthPromptProvider } from "@/context/AuthPromptContext";
import { ToastProvider } from "@/context/ToastContext";
import { LikeProvider } from "@/context/LikeContext";
import FeedbackButton from "@/components/FeedbackButton";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600"],
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["300", "400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "FYTD — Find Your 'Fit Daily",
  description: "Discover outfits, shop every piece.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable} ${ibmPlexMono.variable} ${inter.className} antialiased bg-[#FAFAFA] text-[#0A0A0A] selection:bg-neutral-900 selection:text-white`} suppressHydrationWarning={true}>
        <AuthPromptProvider>
          <ToastProvider>
            <LikeProvider>
              {children}
              <FeedbackButton />
            </LikeProvider>
          </ToastProvider>
        </AuthPromptProvider>
      </body>
    </html>
  );
}
