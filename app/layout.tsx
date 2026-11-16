import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RUMLE — Новоград",
  description: "Оригинальная браузерная open-world игра. Не связана с Rockstar Games.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
