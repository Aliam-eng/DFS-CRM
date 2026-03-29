import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/providers/session-provider";
import { ChakraUIProvider } from "@/providers/chakra-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DFS - CRM",
  description: "DFS Platform - Client Relationship Management",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ChakraUIProvider>
          <SessionProvider>{children}</SessionProvider>
        </ChakraUIProvider>
      </body>
    </html>
  );
}
