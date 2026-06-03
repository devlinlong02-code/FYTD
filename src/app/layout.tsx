import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { AuthPromptProvider } from "@/context/AuthPromptContext";
import { ToastProvider } from "@/context/ToastContext";

const geist = Geist({ subsets: ["latin"] });

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
      <body className={`${geist.className} antialiased bg-white text-neutral-900 selection:bg-neutral-900 selection:text-white`} suppressHydrationWarning={true}>
        <AuthPromptProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthPromptProvider>
      </body>
    </html>
  );
}
