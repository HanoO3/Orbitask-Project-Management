'use server';

import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { sendPasswordResetEmail } from '@/lib/email';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export type ActionResponse = {
  success: boolean;
  message?: string;
  error?: string;
};

export async function requestPasswordReset(emailInput: string): Promise<ActionResponse> {
  const email = (emailInput || '').trim().toLowerCase();

  if (!email || !EMAIL_REGEX.test(email)) {
    return {
      success: false,
      error: 'Please enter a valid email address.',
    };
  }

  const genericResponse: ActionResponse = {
    success: true,
    message: 'If an account exists for this email, a password reset link has been sent.',
  };

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Do not reveal whether user exists
      return genericResponse;
    }

    // Delete previous reset tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    // Generate cryptographically secure random token (32 bytes = 64 hex chars)
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 60 minutes expiry

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/reset-password?token=${rawToken}`;

    await sendPasswordResetEmail({
      to: user.email,
      resetUrl,
    });

    return genericResponse;
  } catch (error) {
    console.error('Password reset request error:', error);
    return {
      success: false,
      error: 'An error occurred while processing your request. Please try again.',
    };
  }
}

export async function validateResetToken(rawToken: string): Promise<{ valid: boolean; error?: string }> {
  if (!rawToken || typeof rawToken !== 'string') {
    return {
      valid: false,
      error: 'Invalid or missing password reset token.',
    };
  }

  try {
    const tokenHash = hashToken(rawToken);
    const resetTokenRecord = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (!resetTokenRecord) {
      return {
        valid: false,
        error: 'This password reset token is invalid or has already been used.',
      };
    }

    if (new Date() > resetTokenRecord.expiresAt) {
      return {
        valid: false,
        error: 'This password reset token has expired. Please request a new link.',
      };
    }

    return { valid: true };
  } catch (error) {
    console.error('Token validation error:', error);
    return {
      valid: false,
      error: 'Failed to validate reset token.',
    };
  }
}

export async function resetPassword(rawToken: string, newPassword: string): Promise<ActionResponse> {
  if (!rawToken || typeof rawToken !== 'string') {
    return {
      success: false,
      error: 'Invalid or missing password reset token.',
    };
  }

  if (!newPassword || newPassword.length < 6) {
    return {
      success: false,
      error: 'Password must be at least 6 characters long.',
    };
  }

  try {
    const tokenHash = hashToken(rawToken);
    const resetTokenRecord = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (!resetTokenRecord) {
      return {
        success: false,
        error: 'This password reset token is invalid or has already been used.',
      };
    }

    if (new Date() > resetTokenRecord.expiresAt) {
      return {
        success: false,
        error: 'This password reset token has expired. Please request a new link.',
      };
    }

    // Hash new password using bcrypt 10 rounds
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password and remove all reset tokens for user
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetTokenRecord.userId },
        data: { password: hashedPassword },
      }),
      prisma.passwordResetToken.deleteMany({
        where: { userId: resetTokenRecord.userId },
      }),
    ]);

    return {
      success: true,
      message: 'Your password has been reset successfully. You can now sign in with your new password.',
    };
  } catch (error) {
    console.error('Reset password error:', error);
    return {
      success: false,
      error: 'Failed to reset password. Please try again.',
    };
  }
}
