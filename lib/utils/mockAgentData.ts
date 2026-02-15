// Mock agent data for development/demo
import { AgentRun, AgentDetection } from "@/lib/types/agents";
import { saveAgentRun, saveDetection } from "./agentStorage";

export function generateMockAgentData() {
  const now = new Date();

  // Mock runs from the past few days - External Intelligence Agents
  const runs: AgentRun[] = [
    // Policy Monitor - ran 3 hours ago
    {
      id: `run-${Date.now()}-1`,
      agentType: "policy_monitor",
      startedAt: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
      completedAt: new Date(now.getTime() - 3 * 60 * 60 * 1000 + 8000).toISOString(),
      status: "completed",
      detectionsCount: 2,
      dataSource: "Medicare.gov, Medicaid.gov",
    },
    // Provider Monitor - ran 5 hours ago
    {
      id: `run-${Date.now()}-2`,
      agentType: "provider_monitor",
      startedAt: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
      completedAt: new Date(now.getTime() - 5 * 60 * 60 * 1000 + 6500).toISOString(),
      status: "completed",
      detectionsCount: 1,
      dataSource: "CMS.gov",
    },
    // Financial Monitor - ran yesterday
    {
      id: `run-${Date.now()}-3`,
      agentType: "financial_monitor",
      startedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      completedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000 + 4000).toISOString(),
      status: "completed",
      detectionsCount: 1,
      dataSource: "Internal calculations",
    },
    // News Monitor - ran 8 hours ago
    {
      id: `run-${Date.now()}-4`,
      agentType: "news_monitor",
      startedAt: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(),
      completedAt: new Date(now.getTime() - 8 * 60 * 60 * 1000 + 5500).toISOString(),
      status: "completed",
      detectionsCount: 2,
      dataSource: "FDA, CDC APIs",
    },
  ];

  // Mock detections - External Intelligence Agent findings
  const detections: AgentDetection[] = [
    // High priority - Medicare policy change detected by Policy Monitor
    {
      id: `det-${Date.now()}-1`,
      agentType: "policy_monitor",
      runId: runs[0].id,
      detectedAt: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
      title: "Medicare Part D Premium Increase Announced",
      description:
        "CMS announced 2026 Medicare Part D premiums will increase by average 8.7% nationally. Your parent's current plan (SilverScript) will increase from $42/month to $46/month starting January 1. Open enrollment begins October 15 - consider comparing plans.",
      relevanceScore: "high",
      domain: "medical",
      actionable: true,
      dueDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      handled: false,
      convertedToTask: false,
      sourceUrl: "https://www.medicare.gov/drug-coverage-part-d/costs-for-medicare-drug-coverage",
      dataSource: "Medicare.gov",
    },
    // High priority - State Medicaid eligibility change detected by Policy Monitor
    {
      id: `det-${Date.now()}-2`,
      agentType: "policy_monitor",
      runId: runs[0].id,
      detectedAt: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
      title: "State Medicaid Asset Limit Increased",
      description:
        "Florida raised Medicaid asset limit from $2,000 to $2,500 for individuals effective January 1, 2026. Based on your parent's financial profile, this may affect eligibility timeline. Consider reviewing spend-down projections.",
      relevanceScore: "high",
      domain: "financial",
      actionable: true,
      handled: false,
      convertedToTask: false,
      sourceUrl: "https://www.myflfamilies.com/service-programs/access-florida/",
      dataSource: "Florida DSHS",
    },
    // Medium priority - Provider rating change detected by Provider Monitor
    {
      id: `det-${Date.now()}-3`,
      agentType: "provider_monitor",
      runId: runs[1].id,
      detectedAt: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
      title: "Nearby Nursing Home Rating Downgraded",
      description:
        "Sunrise Assisted Living (1.2 miles from your parent) was downgraded from 4-star to 2-star rating by CMS due to recent inspection findings. Health inspection score dropped from 'Above Average' to 'Below Average' in December 2025.",
      relevanceScore: "medium",
      domain: "housing",
      actionable: false,
      handled: false,
      convertedToTask: false,
      sourceUrl: "https://www.medicare.gov/care-compare/",
      dataSource: "CMS.gov",
    },
    // Medium priority - Financial spend-down projection from Financial Monitor
    {
      id: `det-${Date.now()}-4`,
      agentType: "financial_monitor",
      runId: runs[2].id,
      detectedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      title: "Medicaid Eligibility Projected in 7 Months",
      description:
        "Based on current monthly expenses ($4,200) and remaining assets ($31,500), your parent will likely qualify for Medicaid by August 2026. Consider consulting with elder law attorney now to optimize spend-down strategy and protect assets.",
      relevanceScore: "medium",
      domain: "financial",
      actionable: true,
      handled: false,
      convertedToTask: false,
      dataSource: "Internal calculations",
    },
    // Low priority - Safety recall detected by News Monitor
    {
      id: `det-${Date.now()}-5`,
      agentType: "news_monitor",
      runId: runs[3].id,
      detectedAt: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(),
      title: "Blood Pressure Medication Recall Issued",
      description:
        "FDA issued recall for certain batches of Lisinopril (10mg tablets) manufactured by Lupin Pharmaceuticals due to potential contamination. Check if your parent's prescription is affected: lot numbers LP2024-8832 through LP2024-8891.",
      relevanceScore: "medium",
      domain: "medical",
      actionable: true,
      handled: false,
      convertedToTask: false,
      sourceUrl: "https://www.fda.gov/safety/recalls-market-withdrawals-safety-alerts",
      dataSource: "FDA.gov",
    },
    // Low priority - General elder care news from News Monitor
    {
      id: `det-${Date.now()}-6`,
      agentType: "news_monitor",
      runId: runs[3].id,
      detectedAt: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(),
      title: "New Fall Prevention Guidelines Released",
      description:
        "CDC released updated fall prevention guidelines for seniors living independently. Includes new home safety checklist and recommended screening questions for primary care visits. May be useful for upcoming doctor appointments.",
      relevanceScore: "low",
      domain: "medical",
      actionable: false,
      handled: false,
      convertedToTask: false,
      sourceUrl: "https://www.cdc.gov/falls/index.html",
      dataSource: "CDC.gov",
    },
  ];

  // Save to localStorage
  runs.forEach((run) => saveAgentRun(run));
  detections.forEach((detection) => saveDetection(detection));

  console.log("✅ Mock agent data generated");
  return { runs: runs.length, detections: detections.length };
}
