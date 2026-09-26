import { z } from 'zod';

export const teamSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
});

export const teamUpdateSchema = teamSchema.partial();

export const invitationRequestSchema = z.object({
  expires_in_hours: z.number().int().min(1).max(168).default(24),
});

export const invitationAcceptSchema = z.object({
  token: z.string().min(1),
});
