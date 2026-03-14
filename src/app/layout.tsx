import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BTC Treasury Risk Simulator",
  description: "Real-time simulation platform for corporate Bitcoin treasury risk management",
};

// Inline script to prevent flash of unstyled content for dark mode
const themeScript = `
  try {
    const theme = localStorage.getItem('bts-theme');
    if (theme === 'dark') document.documentElement.classList.add('dark');
  } catch (e) {}
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen bg-bts-bg font-sans text-bts-primary antialiased">
        {children}
      </body>
    </html>
  );
}
