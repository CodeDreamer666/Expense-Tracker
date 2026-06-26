import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TRPCReactProvider } from "@/trpc/react";
import StatusMessageRouter from "@/components/shared/StatusMessageRouter";
import "./globals.css";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Pocket Plan - Expense Tracker",
    description: "A calm monthly view of your money.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html
            lang="en"
            className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
        >
            <body className="flex min-h-full flex-col bg-slate-50 text-slate-950">
                <StatusMessageRouter>
                    <TRPCReactProvider>
                        {children}
                    </TRPCReactProvider>
                </StatusMessageRouter>
            </body>
        </html>
    );
}
