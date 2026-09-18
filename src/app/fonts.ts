import localFont from "next/font/local";

export const notoSansTelugu = localFont({
  src: "./fonts/NotoSansTelugu.ttf",
  variable: "--font-telugu",
  display: "swap",
  fallback: ["Kohinoor Telugu", "Telugu Sangam MN", "sans-serif"],
});

export const inter = localFont({
  src: "./fonts/Inter.ttf",
  variable: "--font-inter",
  display: "swap",
  fallback: ["system-ui", "-apple-system", "sans-serif"],
});
