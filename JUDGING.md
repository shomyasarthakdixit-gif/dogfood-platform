# Judging Engine Architecture & Normalization Proof

## Core Components
The Judging Engine is responsible for accurately scoring and ranking hackathon submissions while mitigating common human biases (harsh vs. lenient judges).

The primary entities involved are:
- **Judges (`judge_profiles`)**: Event-specific judge records corresponding to authenticated users.
- **Rubrics (`rubrics`)**: The unified grading standard for an event.
- **Criteria (`rubric_criteria`)**: Specific items being evaluated (e.g., Innovation, Complexity).
- **Assignments (`judge_assignments`)**: Connections mapping a judge to a submission.
- **Evaluations (`evaluations`, `evaluation_scores`)**: The actual scoring instances.

## Evaluation Lifecycle
1. **Assignment**: Judges are assigned submissions (manually or auto-assigned). A judge cannot be assigned to their own team (`CONFLICT_OF_INTEREST`).
2. **Start Evaluation**: Initiates a `DRAFT` evaluation record for the assignment.
3. **Score Draft**: The judge updates scores for specific criteria.
4. **Submit**: All criteria must be scored. Once submitted, the server mathematically calculates the final weighted raw score, marks the evaluation as `SUBMITTED`, and updates the assignment to `COMPLETED`. Immutable thereafter.

## Scoring Math and Normalization Proof

### 1. Weighted Raw Score
When a judge submits an evaluation, the total score is computed via a weighted average format bounded between 0 and 100.
For each criterion $i$:
$$ NormalizedCriterion_i = \frac{Score_i}{MaxScore_i} $$
$$ TotalScore = \left( \frac{\sum (NormalizedCriterion_i \times Weight_i)}{\sum Weight_i} \right) \times 100 $$
This provides a safe and mathematically defensible score out of 100, regardless of differing max points per criterion.

### 2. Normalization Strategy (Z-Score)
Different judges have different baselines (lenient vs. harsh) and spreads (using the full scale vs. sticking to the middle). Averaging raw scores often penalizes teams reviewed by harsh judges.

To resolve this, we normalize scores using standard Z-Scores.

**Step 1: Judge Baseline ($Mean_j$) & Spread ($StdDev_j$)**
For every judge $j$, we calculate their mean score $\mu_j$ and standard deviation $\sigma_j$ across all the evaluations they have submitted:
$$ \mu_j = \frac{\sum X_{ij}}{N_j} $$
$$ \sigma_j = \sqrt{ \frac{\sum (X_{ij} - \mu_j)^2}{N_j - 1} } $$

**Step 2: Z-Score Transformation**
Every evaluation $X_{ij}$ (Judge $j$, Submission $i$) is transformed into a Z-Score $Z_{ij}$, representing how many standard deviations the score is above or below that judge's own average:
$$ Z_{ij} = \frac{X_{ij} - \mu_j}{\sigma_j} $$
*(If $\sigma_j = 0$, $Z_{ij}$ defaults to 0).*

**Step 3: Aggregation & Final Bounded Score**
For a given submission, we compute the average Z-score from all its assigned judges. 
To present a user-friendly score, we rescale the Z-score back to a standard 0-100 range, centering the event average at 50 with a standard deviation of 15 (similar to standardized IQ tests):
$$ FinalScore = 50 + (15 \times \text{AvgZScore}) $$
*(The final score is clamped between 0 and 100).*

### Conclusion
By relying on Z-score normalization:
1. **Mean Shift Bias** (harsh judges who average 40 vs lenient who average 80) is mathematically mitigated.
2. **Variance Bias** (judges who score everything 70-80 vs judges who use 20-100) is reduced.
Teams are ranked on how much better or worse they were compared to the *other* submissions reviewed by the *same* judges, reducing the impact of individual judge leniency or harshness. However, this normalization requires a sufficient sample size of evaluations per judge to be statistically robust.

*Note: The normalization logic and its mathematical correctness are verified by automated proofs located in `tests/integration/judging.test.ts`.*
