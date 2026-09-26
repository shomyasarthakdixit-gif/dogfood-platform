import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dogfood Platform",
  description: "An open-source, self-hostable hackathon submission and judging platform.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
