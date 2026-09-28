// Normalize and aggregate scores
// For each judge:
// 1. calculate the judge's submitted evaluation scores.
// 2. calculate that judge's mean across their submitted evaluations.
// 3. calculate that judge's standard deviation.
// 4. convert each evaluation to a z-score where possible.
// 5. aggregate normalized judge scores per submission.
// 6. transform the aggregate into a user-friendly bounded score.

export function calculateNormalizedResults(evaluations: { judge_id: string, submission_id: string, total_score: string | number }[]) {
  // evaluations should be an array of objects with:
  // judge_id, submission_id, total_score

  const judgeStats = new Map<string, { scores: number[], mean: number, stdDev: number }>();

  // Collect scores per judge
  evaluations.forEach(e => {
    const score = parseFloat(e.total_score as string);
    if (!judgeStats.has(e.judge_id)) {
      judgeStats.set(e.judge_id, { scores: [], mean: 0, stdDev: 0 });
    }
    judgeStats.get(e.judge_id)!.scores.push(score);
  });

  // Calculate Mean and StdDev
  judgeStats.forEach((stats, judge_id) => {
    const n = stats.scores.length;
    const mean = stats.scores.reduce((a, b) => a + b, 0) / n;
    
    // Population standard deviation (or sample, let's use sample stddev n-1, or population n. We use n for simplicity if n>=1)
    let variance = 0;
    if (n > 1) {
      variance = stats.scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (n - 1);
    }
    const stdDev = Math.sqrt(variance);

    stats.mean = mean;
    stats.stdDev = stdDev;
  });

  // Calculate Z-Scores and aggregate by submission
  const subStats = new Map<string, { rawSum: number, normSum: number, count: number }>();

  evaluations.forEach(e => {
    const score = parseFloat(e.total_score as string);
    const stats = judgeStats.get(e.judge_id)!;
    
    // Z-Score = (X - Mean) / StdDev
    // Fallback: If StdDev is 0 (judge gave same score for all, or only 1 eval), Z-score = 0.
    let zScore = 0;
    if (stats.stdDev > 0) {
      zScore = (score - stats.mean) / stats.stdDev;
    }

    if (!subStats.has(e.submission_id)) {
      subStats.set(e.submission_id, { rawSum: 0, normSum: 0, count: 0 });
    }
    const s = subStats.get(e.submission_id)!;
    s.rawSum += score;
    s.normSum += zScore;
    s.count++;
  });

  // Convert to user-friendly bounded score.
  // Z-scores usually range from -3 to 3.
  // We can map z-score 0 to 50, and each stdDev to 15 points (like IQ). So final = 50 + 15 * average_z.
  // Bounded between 0 and 100.
  const results: { submission_id: string; evaluationCount: number; rawScore: number; normalizedScore: number; rank?: number }[] = [];
  for (const [submission_id, s] of subStats.entries()) {
    const rawAvg = s.rawSum / s.count;
    const normAvg = s.normSum / s.count;
    
    let userFriendlyNorm = 50 + (15 * normAvg);
    // clamp to 0 - 100
    userFriendlyNorm = Math.max(0, Math.min(100, userFriendlyNorm));

    results.push({
      submission_id,
      evaluationCount: s.count,
      rawScore: Math.round(rawAvg * 100) / 100,
      normalizedScore: Math.round(userFriendlyNorm * 100) / 100,
    });
  }

  // Sort: score DESC, submission_id ASC
  results.sort((a, b) => {
    if (a.normalizedScore !== b.normalizedScore) {
      return b.normalizedScore - a.normalizedScore;
    }
    return a.submission_id.localeCompare(b.submission_id);
  });

  // Assign Rank
  results.forEach((r, idx) => {
    r.rank = idx + 1;
  });

  return results;
}
