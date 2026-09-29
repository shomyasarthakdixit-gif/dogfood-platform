import { z } from 'zod';

const baseEventSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, { message: 'Slug can only contain lowercase letters, numbers, and hyphens.' }),
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

function validateDates(data: Record<string, string | null | undefined>, ctx: z.RefinementCtx) {
  const parse = (d?: string | null) => d ? new Date(d) : null;
  const start = parse(data.start_date);
  const end = parse(data.end_date);
  const rStart = parse(data.registration_start);
  const rEnd = parse(data.registration_end);
  const sStart = parse(data.submission_start);
  const sEnd = parse(data.submission_end);
  const jStart = parse(data.judging_start);
  const jEnd = parse(data.judging_end);
  const vStart = parse(data.voting_start);
  const vEnd = parse(data.voting_end);

  if (start && end && start >= end) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "end_date must be after start_date", path: ['end_date'] });
  }
  if (rStart && rEnd && rStart >= rEnd) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "registration_end must be after registration_start", path: ['registration_end'] });
  }
  if (rEnd && sStart && rEnd > sStart) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "submission_start must be after or equal to registration_end", path: ['submission_start'] });
  }
  if (sStart && sEnd && sStart >= sEnd) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "submission_end must be after submission_start", path: ['submission_end'] });
  }
  if (sEnd && jStart && sEnd > jStart) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "judging_start must be after or equal to submission_end", path: ['judging_start'] });
  }
  if (jStart && jEnd && jStart >= jEnd) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "judging_end must be after judging_start", path: ['judging_end'] });
  }
  if (jEnd && vStart && jEnd > vStart) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "voting_start must be after or equal to judging_end", path: ['voting_start'] });
  }
  if (vStart && vEnd && vStart >= vEnd) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "voting_end must be after voting_start", path: ['voting_end'] });
  }
  if (vEnd && end && vEnd > end) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "end_date must be after or equal to voting_end", path: ['end_date'] });
  }
}

export const eventSchema = baseEventSchema.superRefine(validateDates);
export const eventUpdateSchema = baseEventSchema.partial().superRefine(validateDates);

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
