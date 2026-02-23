import { Answer, DomainScore, ReadinessScore, DOMAIN_QUESTIONS } from "@/lib/types/readiness";
import { Domain } from "@/components/DomainProgress";

/**
 * Calculate readiness score from questionnaire answers
 */
export function calculateScoreFromAnswers(answers: Answer[]): ReadinessScore {
  const domainScores: DomainScore[] = [];

  for (const domainData of DOMAIN_QUESTIONS) {
    const domainAnswers = answers.filter((a) =>
      domainData.questions.some((q) => q.id === a.questionId)
    );

    const score = calculateDomainScore(domainData.domain, domainAnswers, domainData.questions.length);
    domainScores.push(score);
  }

  // Calculate overall score (average of domain scores)
  const overall = Math.round(
    domainScores.reduce((sum, d) => sum + d.score, 0) / domainScores.length
  );

  return {
    overall,
    domains: domainScores,
    completedAt: new Date().toISOString(),
  };
}

function calculateDomainScore(
  domain: Domain,
  answers: Answer[],
  totalQuestions: number
): DomainScore {
  let score = 0;
  const gaps: string[] = [];
  const strengths: string[] = [];

  // Scoring logic based on domain
  for (const answer of answers) {
    if (answer.isUncertain) {
      gaps.push(`Uncertain about: ${getQuestionText(answer.questionId)}`);
      // No points for uncertain answers
      continue;
    }

    if (!answer.selectedOption) continue;

    // Score based on option selected (domain-specific logic)
    const points = scoreAnswer(domain, answer.questionId, answer.selectedOption);
    score += points;

    if (points === 0) {
      gaps.push(getQuestionText(answer.questionId));
    } else if (points >= 8) {
      strengths.push(getQuestionText(answer.questionId));
    }
  }

  // Normalize score to 0-100
  const maxPossibleScore = totalQuestions * 10;
  const normalizedScore = Math.round((score / maxPossibleScore) * 100);

  return {
    domain,
    score: normalizedScore,
    gaps,
    strengths,
  };
}

function scoreAnswer(domain: Domain, questionId: string, selectedOption: string): number {
  // Scoring matrix: 10 = excellent, 7 = good, 4 = partial, 0 = gap

  // Medical domain scoring
  if (domain === "medical") {
    if (questionId === "med-1") {
      if (selectedOption.includes("regular visits")) return 10;
      if (selectedOption.includes("rarely")) return 4;
      return 0;
    }
    if (questionId === "med-2") {
      if (selectedOption.includes("complete list")) return 10;
      if (selectedOption.includes("Partially")) return 5;
      return 0;
    }
    if (questionId === "med-3") {
      if (selectedOption.includes("well-managed")) return 10;
      if (selectedOption.includes("No conditions")) return 10;
      if (selectedOption.includes("inconsistent")) return 4;
      if (selectedOption.includes("declining")) return 2;
      return 5;
    }
    if (questionId === "med-4") {
      if (selectedOption.includes("full access")) return 10;
      if (selectedOption.includes("Limited")) return 5;
      return 0;
    }
    if (questionId === "med-5") {
      if (selectedOption.includes("both")) return 10;
      if (selectedOption.includes("Medicare") || selectedOption.includes("private")) return 8;
      return 0;
    }
    if (questionId === "med-6") {
      if (selectedOption.includes("documented")) return 10;
      if (selectedOption.includes("In progress")) return 5;
      return 0;
    }
  }

  // Legal domain scoring
  if (domain === "legal") {
    if (questionId === "legal-1") {
      if (selectedOption.includes("recent")) return 10;
      if (selectedOption.includes("In progress")) return 5;
      if (selectedOption.includes("outdated")) return 4;
      return 0;
    }
    if (questionId === "legal-2" || questionId === "legal-3") {
      if (selectedOption.includes("documented")) return 10;
      if (selectedOption.includes("Discussed") || selectedOption.includes("In progress")) return 5;
      return 0;
    }
    if (questionId === "legal-4") {
      if (selectedOption.includes("I have access")) return 10;
      if (selectedOption.includes("I know where")) return 7;
      return 0;
    }
    if (questionId === "legal-5") {
      if (selectedOption.includes("in detail")) return 10;
      if (selectedOption.includes("Briefly")) return 5;
      return 0;
    }
  }

  // Financial domain scoring
  if (domain === "financial") {
    if (questionId === "fin-1" || questionId === "fin-2") {
      if (selectedOption.includes("complete") || selectedOption.includes("detailed")) return 10;
      if (selectedOption.includes("Partially") || selectedOption.includes("General")) return 5;
      return 0;
    }
    if (questionId === "fin-3") {
      if (selectedOption === "Yes") return 10;
      if (selectedOption.includes("lapsed")) return 2;
      return 0;
    }
    if (questionId === "fin-4") {
      if (selectedOption.includes("joint") || selectedOption.includes("POA")) return 10;
      if (selectedOption.includes("Limited")) return 5;
      return 0;
    }
    if (questionId === "fin-5") {
      if (selectedOption.includes("up to date")) return 10;
      if (selectedOption.includes("needs review")) return 6;
      return 0;
    }
    if (questionId === "fin-6") {
      if (selectedOption.includes("easily")) return 10;
      if (selectedOption.includes("with adjustments")) return 6;
      if (selectedOption.includes("Medicaid")) return 3;
      return 0;
    }
  }

  // Housing domain scoring
  if (domain === "housing") {
    if (questionId === "house-1") {
      // All options are neutral, no scoring impact
      return 5;
    }
    if (questionId === "house-2") {
      if (selectedOption.includes("fully accessible")) return 10;
      if (selectedOption.includes("Needs modifications")) return 5;
      if (selectedOption.includes("Haven't assessed")) return 2;
      return 0;
    }
    if (questionId === "house-3") {
      if (selectedOption.includes("comprehensive")) return 10;
      if (selectedOption.includes("Some")) return 6;
      return 0;
    }
    if (questionId === "house-4") {
      if (selectedOption.includes("clear preferences") || selectedOption.includes("planning a move")) return 10;
      if (selectedOption.includes("Briefly")) return 5;
      return 0;
    }
    if (questionId === "house-5") {
      if (selectedOption.includes("researched")) return 10;
      if (selectedOption.includes("General ideas")) return 5;
      return 0;
    }
    if (questionId === "house-6") {
      if (selectedOption.includes("adequate")) return 10;
      if (selectedOption.includes("Some support")) return 6;
      if (selectedOption.includes("Managing alone")) return 4;
      if (selectedOption.includes("Struggling")) return 0;
      return 5;
    }
  }

  // Transportation domain scoring
  if (domain === "transportation") {
    if (questionId === "trans-1") {
      if (selectedOption.includes("drive themselves")) return 10;
      if (selectedOption.includes("public transit") || selectedOption.includes("ride service")) return 8;
      if (selectedOption.includes("someone takes them")) return 4;
      if (selectedOption.includes("homebound")) return 0;
      return 5;
    }
    if (questionId === "trans-2") {
      if (selectedOption.includes("drive")) return 10;
      if (selectedOption.includes("Family member")) return 7;
      if (selectedOption.includes("ride service")) return 7;
      if (selectedOption.includes("medical transport")) return 8;
      return 0;
    }
    if (questionId === "trans-3") {
      if (selectedOption.includes("driving safely")) return 10;
      if (selectedOption.includes("Voluntarily stopped")) return 7;
      if (selectedOption.includes("concerns")) return 3;
      if (selectedOption.includes("Not applicable")) return 7;
      return 0;
    }
    if (questionId === "trans-4") {
      if (selectedOption.includes("reliable")) return 10;
      if (selectedOption.includes("not consistent")) return 5;
      return 0;
    }
    if (questionId === "trans-5") {
      if (selectedOption.includes("we use them")) return 10;
      if (selectedOption.includes("haven't set them up")) return 4;
      return 0;
    }
  }

  return 5; // Default middle score
}

function getQuestionText(questionId: string): string {
  for (const domainData of DOMAIN_QUESTIONS) {
    const question = domainData.questions.find((q) => q.id === questionId);
    if (question) return question.text;
  }
  return questionId;
}

/**
 * Generate readiness score interpretation
 */
export function getScoreInterpretation(score: number): {
  level: "Excellent" | "Good" | "Fair" | "Needs Attention";
  color: string;
  message: string;
} {
  if (score >= 80) {
    return {
      level: "Excellent",
      color: "sage",
      message: "You're well-prepared! You have most key elements in place.",
    };
  }
  if (score >= 60) {
    return {
      level: "Good",
      color: "ocean",
      message: "You're on the right track with solid foundations in place.",
    };
  }
  if (score >= 40) {
    return {
      level: "Fair",
      color: "amber",
      message: "You have some preparation, but important gaps remain.",
    };
  }
  return {
    level: "Needs Attention",
    color: "coral",
    message: "There are significant gaps that should be addressed soon.",
  };
}
