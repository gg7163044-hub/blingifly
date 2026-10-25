import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Blingifly — Make something unreal",
  description: "Generate images from your imagination and transform photos with AI.",
  applicationName: "Blingifly",
  openGraph: {
    title: "Blingifly — Make something unreal",
    description: "Your imagination, upgraded.",
    type: "website"
  }
};

export const viewport: Viewport = {
  themeColor: "#0b0b12",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}