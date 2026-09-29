import { z } from 'zod';

export const createJudgeSchema = z.object({
  user_id: z.string().min(1),
  background: z.string().optional(),
});

export const updateJudgeSchema = z.object({
  background: z.string().optional(),
});

export const createRubricSchema = z.object({
  name: z.string().min(2),
});

export const updateRubricSchema = z.object({
  name: z.string().min(2),
});

export const createCriterionSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  max_score: z.number().int().min(1).max(1000),
  weight: z.number().positive(),
});

export const updateCriterionSchema = createCriterionSchema.partial();

export const autoAssignSchema = z.object({
  judgesPerSubmission: z.number().int().min(1).max(20),
});

export const manualAssignSchema = z.object({
  judge_id: z.string().uuid(),
  submission_id: z.string().uuid(),
});

export const scoreSchema = z.object({
  criterion_id: z.string().uuid(),
  score: z.number().min(0), // Can't validate max_score dynamically in Zod, we'll check it in the route
});

export const submitEvaluationSchema = z.object({
  scores: z.array(scoreSchema).min(1),
  submit: z.boolean().optional(),
});
