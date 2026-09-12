import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "4M — 4Muse & 4Minds",
  description: "4Muse and 4Minds. Two perspectives, one creative world.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
