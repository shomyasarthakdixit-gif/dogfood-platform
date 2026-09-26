import { z } from 'zod';

export const submissionSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  url: z.string().url().optional().nullable(),
});

export const submissionUpdateSchema = submissionSchema.partial();
