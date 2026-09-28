-- 005_judging_engine.sql
-- Add updated_at columns and any necessary constraints/indexes for judging engine

ALTER TABLE rubrics ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE rubric_criteria ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE judge_profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE judge_assignments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE evaluation_scores ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE normalized_scores ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Create an index to quickly find a judge's assignments
CREATE INDEX IF NOT EXISTS idx_judge_assignments_judge_id ON judge_assignments(judge_id);

-- Create an index to quickly find an assignment's evaluation
CREATE INDEX IF NOT EXISTS idx_evaluations_assignment_id ON evaluations(assignment_id);

-- Create an index for scores by evaluation
CREATE INDEX IF NOT EXISTS idx_evaluation_scores_evaluation_id ON evaluation_scores(evaluation_id);

-- Create an index for submissions by event for easier assignment lookup
CREATE INDEX IF NOT EXISTS idx_submissions_event_id ON submissions(event_id);
