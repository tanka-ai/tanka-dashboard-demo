import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "客户跟进 CRM",
  description: "面向销售与客户成功团队的客户跟进工作台。",
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
