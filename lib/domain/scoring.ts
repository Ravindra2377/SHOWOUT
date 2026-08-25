export interface DimensionScores { originality: number; execution: number; entertainment: number }

export function validateScores(scores: DimensionScores) {
  return Object.values(scores).every((value) => Number.isInteger(value) && value >= 1 && value <= 5);
}

export function normalizedScore(votes: DimensionScores[], minimumVotes = 3) {
  if (votes.length < minimumVotes) return null;
  const means = votes.reduce((sum, vote) => ({ originality: sum.originality + vote.originality, execution: sum.execution + vote.execution, entertainment: sum.entertainment + vote.entertainment }), { originality: 0, execution: 0, entertainment: 0 });
  const composite = (means.originality + means.execution + means.entertainment) / (votes.length * 3);
  // Light Bayesian shrinkage toward 3 prevents tiny samples dominating the pilot.
  return Number(((composite * votes.length + 3 * minimumVotes) / (votes.length + minimumVotes)).toFixed(3));
}
