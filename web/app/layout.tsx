import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Lora, Roboto_Mono } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/navigation";
import { QueryProvider } from "@/components/providers/query-provider";
import { AuthProvider } from "@/contexts/auth-context";
import AnimatedShaderBackground from "@/components/animated-shader-background";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const lora = Lora({
  variable: "--font-serif",
  subsets: ["latin"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Statify - Music Analytics Dashboard",
  description: "Comprehensive music analytics and insights dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${plusJakartaSans.variable} ${lora.variable} ${robotoMono.variable} font-sans antialiased dark`}
      >
        <AnimatedShaderBackground />
        <QueryProvider>
          <AuthProvider>
            <Navigation />
            <main className="container mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
              {children}
            </main>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
