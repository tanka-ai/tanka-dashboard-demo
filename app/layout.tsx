import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "积分运营看板",
  description: "面向企业团队的积分总览、排行、任务和兑换工作台。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
