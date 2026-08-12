"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/components/theme-provider";
import { ChatUnreadProvider } from "@/components/providers/chat-unread-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <SessionProvider>
        <ChatUnreadProvider>{children}</ChatUnreadProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}