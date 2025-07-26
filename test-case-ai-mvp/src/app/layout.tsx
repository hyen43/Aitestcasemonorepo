"use client";
import "@/styles/globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="bg-black text-gray-800" cz-shortcut-listen="true">
        {children}
      </body>
    </html>
  );
}
