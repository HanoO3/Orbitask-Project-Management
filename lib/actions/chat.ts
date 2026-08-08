"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function sendChatMessage(channel: string, content: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  if (!content.trim()) {
    return { success: false, error: "Message content cannot be empty" };
  }

  try {
    if (!prisma.chatMessage) {
      return { success: false, error: "Chat service initializing" };
    }

    const message = await prisma.chatMessage.create({
      data: {
        content: content.trim(),
        channel,
        senderId: session.user.id,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatar: true,
          },
        },
      },
    });

    revalidatePath("/messages");
    return { success: true, message };
  } catch (err: unknown) {
    console.error("sendChatMessage error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message || "Failed to send message" };
  }
}

export async function getChannelMessages(channel: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return [];
  }

  try {
    if (!prisma.chatMessage) {
      return [];
    }

    const messages = await prisma.chatMessage.findMany({
      where: { channel },
      orderBy: { createdAt: "asc" },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatar: true,
          },
        },
      },
      take: 100,
    });

    return messages;
  } catch (err) {
    console.error("getChannelMessages error:", err);
    return [];
  }
}
