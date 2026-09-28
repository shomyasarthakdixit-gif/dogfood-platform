import { z } from 'zod';

const baseEventSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  status: z.enum(['DRAFT', 'REGISTRATION', 'SUBMISSION', 'JUDGING', 'VOTING', 'RESULTS', 'ARCHIVED']).default('DRAFT'),
  start_date: z.string().datetime(),
  end_date: z.string().datetime(),
  registration_start: z.string().datetime().optional().nullable(),
  registration_end: z.string().datetime().optional().nullable(),
  submission_start: z.string().datetime().optional().nullable(),
  submission_end: z.string().datetime().optional().nullable(),
  judging_start: z.string().datetime().optional().nullable(),
  judging_end: z.string().datetime().optional().nullable(),
  voting_start: z.string().datetime().optional().nullable(),
  voting_end: z.string().datetime().optional().nullable(),
});

export const eventSchema = baseEventSchema.refine(data => new Date(data.start_date) < new Date(data.end_date), {
  message: "end_date must be after start_date",
});

export const eventUpdateSchema = baseEventSchema.partial().refine(data => {
  if (data.start_date && data.end_date) return new Date(data.start_date) < new Date(data.end_date);
  return true;
}, {
  message: "end_date must be after start_date",
});

export const trackSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
});

export const trackUpdateSchema = trackSchema.partial();

export const prizeSchema = z.object({
  track_id: z.string().uuid().optional().nullable(),
  name: z.string().min(2),
  description: z.string().optional(),
  amount: z.string().optional(),
});

export const prizeUpdateSchema = prizeSchema.partial();
