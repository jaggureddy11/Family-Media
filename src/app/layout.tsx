import type { Metadata } from "next";
import { notoSansTelugu, inter } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kutumbam · కుటుంబం",
  description: "Private Telugu & English family media archive and streaming",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${notoSansTelugu.variable} h-full`}
      data-text-scale="extra-large"
      data-theme="dark"
    >
      <head>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="googlebot" content="noindex, nofollow" />
      </head>
      <body className="min-h-full flex flex-col bg-[var(--bg-main)] text-[var(--text-primary)]">
        {children}
      </body>
    </html>
  );
}
