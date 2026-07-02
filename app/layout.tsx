import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "数据分析看板",
  description: "销售、广告、利润、目标与数据状态看板",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
