import type { Metadata } from "next";
import { AppNav } from "@/components/AppNav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Explorer Grid",
  description: "将现实城市 RPG 化的地点探索与个人图鉴",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        <AppNav />
        <main className="relative h-[100dvh] overflow-hidden">{children}</main>
      </body>
    </html>
  );
}
