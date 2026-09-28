import { z } from 'zod';

export const submissionSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  url: z.string().url().optional().nullable(),
  track_id: z.string().uuid().optional().nullable(),
});

export const submissionUpdateSchema = submissionSchema.partial();

export const commentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(10000, "Comment is too long").transform(val => val.replace(/</g, "&lt;").replace(/>/g, "&gt;"))
});
