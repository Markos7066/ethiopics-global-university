// app/layout.tsx
import type { Metadata } from "next";
import { AppProvider } from "@/context/AppContext";
import { Suspense } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "v0 App",
  description: "Created with v0",
  generator: "v0.app",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="font-sans">
        <AppProvider>
          <Suspense fallback={null}>{children}</Suspense>
        </AppProvider>
      </body>
    </html>
  );
}