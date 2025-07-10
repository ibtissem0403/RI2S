import type { ReactNode } from "react";
import "./globals1.css";
interface LoginLayoutProps {
  children: ReactNode;
}
import { Suspense } from "react";
export default function LoginLayout({ children }: LoginLayoutProps) {
  return (
    <html lang="en">
      <body>
        <section className="login-container">
          {children}
        </section>
      </body>
    </html>
  );
}
