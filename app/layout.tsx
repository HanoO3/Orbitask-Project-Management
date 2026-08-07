import type { Metadata } from "next";
import { Space_Grotesk, DM_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { AppLayout } from "@/components/app-layout";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Orbitask — Project Management & Team Collaboration",
    template: "%s · Orbitask",
  },
  description:
    "Plan projects, assign tasks and track progress in one place. Orbitask keeps your team aligned from kickoff to delivery.",
  applicationName: "Orbitask",
  openGraph: {
    title: "Orbitask — Project Management & Team Collaboration",
    description:
      "Plan projects, assign tasks and track progress in one place. Keep your team aligned from kickoff to delivery.",
    siteName: "Orbitask",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Orbitask — Project Management & Team Collaboration",
    description:
      "Plan projects, assign tasks and track progress in one place.",
  },
  icons: {
    icon: "/orbitask-logo.png",
    apple: "/orbitask-logo.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${dmSans.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Providers>
          <AppLayout>{children}</AppLayout>
        </Providers>
      </body>
    </html>
  );
}
