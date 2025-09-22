import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navigation from "./components/Layout/Navigation";
import NotificationProvider from "./components/UI/NotificationProvider";
import ErrorBoundary from "./components/ErrorHandling/ErrorBoundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "PurpleMerit Delivery System",
  description: "Delivery management system for efficient order assignment",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 min-h-screen`}
      >
        <NotificationProvider>
          <ErrorBoundary
            title="Application Error"
            message="The application encountered an unexpected error. Please try refreshing the page."
            showReportButton={true}
          >
            <Navigation />
            <main className="flex-1">
              <ErrorBoundary
                title="Page Error"
                message="This page encountered an error while loading."
              >
                {children}
              </ErrorBoundary>
            </main>
          </ErrorBoundary>
        </NotificationProvider>
      </body>
    </html>
  );
}
