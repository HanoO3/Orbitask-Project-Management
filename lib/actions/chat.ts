"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function sendChatMessage(
  channel: string,
  content: string,
  replyToId?: string,
  attachment?: { fileName: string; fileUrl: string; fileType: string; fileSize: number }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  if (!content.trim() && !attachment) {
    return { success: false, error: "Message or attachment is required" };
  }

  try {
    const message = await prisma.chatMessage.create({
      data: {
        content: content.trim(),
        channel,
        senderId: session.user.id,
        replyToId: replyToId || null,
        attachments: attachment
          ? {
              create: {
                fileName: attachment.fileName,
                fileUrl: attachment.fileUrl,
                fileType: attachment.fileType,
                fileSize: attachment.fileSize,
                userId: session.user.id,
              },
            }
          : undefined,
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
        attachments: true,
        replyTo: {
          include: {
            sender: { select: { id: true, name: true } },
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
        reactions: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
        attachments: true,
        replyTo: {
          include: {
            sender: { select: { id: true, name: true } },
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

export async function getUnreadCountsForChannels(
  channelKeys: string[],
  lastReadMap: Record<string, string>
) {
  const session = await auth();
  if (!session?.user?.id || !channelKeys.length) {
    return {};
  }

  const userId = session.user.id;
  const counts: Record<string, number> = {};

  try {
    // Single aggregated query to fetch all unread messages for all channels at once
    const unreadMsgs = await prisma.chatMessage.findMany({
      where: {
        channel: { in: channelKeys },
        isDeleted: false,
        senderId: { not: userId },
      },
      select: {
        channel: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 300,
    });

    for (const msg of unreadMsgs) {
      const lastReadIso = lastReadMap[msg.channel];
      const lastRead = lastReadIso ? new Date(lastReadIso) : new Date(0);

      if (msg.createdAt > lastRead) {
        counts[msg.channel] = (counts[msg.channel] || 0) + 1;
      }
    }

    return counts;
  } catch (err) {
    console.error("getUnreadCountsForChannels error:", err);
    return {};
  }
}

export async function deleteChatMessage(messageId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const message = await prisma.chatMessage.findUnique({
    where: { id: messageId },
  });

  if (!message) {
    return { success: false, error: "Message not found" };
  }

  if (message.senderId !== session.user.id && session.user.role !== "ADMIN") {
    return { success: false, error: "Unauthorized: You can only delete your own messages" };
  }

  try {
    await prisma.chatMessage.update({
      where: { id: messageId },
      data: {
        isDeleted: true,
        content: "This message was deleted.",
      },
    });

    revalidatePath("/messages");
    return { success: true };
  } catch (err) {
    console.error("deleteChatMessage error:", err);
    return { success: false, error: "Failed to delete message" };
  }
}

export async function toggleMessageReaction(messageId: string, emoji: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const userId = session.user.id;

  try {
    const existing = await prisma.messageReaction.findUnique({
      where: {
        messageId_userId_emoji: {
          messageId,
          userId,
          emoji,
        },
      },
    });

    if (existing) {
      await prisma.messageReaction.delete({
        where: { id: existing.id },
      });
    } else {
      await prisma.messageReaction.create({
        data: {
          messageId,
          userId,
          emoji,
        },
      });
    }

    revalidatePath("/messages");
    return { success: true };
  } catch (err) {
    console.error("toggleMessageReaction error:", err);
    return { success: false, error: "Failed to toggle reaction" };
  }
}
