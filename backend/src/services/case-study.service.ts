import { env } from '../config/env';

interface Evidence {
  project: { name: string; websiteUrl: string | null; githubUrl: string | null };
  website: unknown | null;
  github: unknown | null;
}

function evidenceText(evidence: Evidence): string {
  return JSON.stringify(evidence, null, 2).slice(0, 30_000);
}

export async function synthesizeCaseStudy(evidence: Evidence): Promise<Record<string, unknown>> {
  const fallback = {
    executiveSummary: 'Analysis is based on the collected website and repository evidence. Review the evidence sections for source-backed conclusions.',
    projectOverview: evidence.project,
    websiteAnalysis: evidence.website,
    technicalArchitecture: evidence.github,
    businessModel: 'Not determined until evidence indicates pricing, sales, and monetization channels.',
    targetAudience: 'Requires explicit product and audience evidence from the source website.',
    marketAnalysis: 'No independent market research was available.',
    competitorAnalysis: 'Competitor evidence was not collected; validation is required before commercial decisions.',
    competitorComparison: [],
    businessScope: 'Scope should be limited to observed functionality and technology.',
    marketOpportunities: ['Validate unmet customer needs', 'Measure the strongest source traffic channels', 'Compare similar products in the same category'],
    revenueModel: ['No revenue model is asserted without evidence'],
    profitabilityAnalysis: { status: 'insufficient_data', assumptions: 'No financial records or pricing evidence were collected.', estimate: null },
    risksAndLimitations: ['External sources may change', 'No financial statements were provided', 'Repository activity is not proof of adoption', 'AI and crawler output must be verified'],
    swotAnalysis: { strengths: [], weaknesses: [], opportunities: [], threats: [] },
    recommendations: ['Document verified customer demand', 'Improve onboarding and conversion measurement', 'Resolve detected technical issues', 'Add automated tests and monitoring'],
    growthStrategy: ['Phase 1: validate users', 'Phase 2: improve core workflows', 'Phase 3: expand distribution'],
    implementationRoadmap: ['Collect baseline metrics', 'Prioritize evidence-backed improvements', 'Ship and measure experiments'],
    conclusion: 'Further conclusions should not be presented as facts until additional verified evidence is collected.',
  };

  if (!env.GROQ_API_KEY) return fallback;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      signal: AbortSignal.timeout(60_000),
      headers: {
        Authorization: `Bearer ${env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: env.GROQ_MODEL,
        temperature: env.GROQ_TEMPERATURE,
        max_tokens: env.GROQ_MAX_TOKENS,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: 'You are a technical business analyst. Use only the supplied evidence. Never invent facts or revenue numbers. Clearly mark unknown values. Return one valid JSON object with executiveSummary, projectOverview, businessBackground, problemStatement, objectives, websiteAnalysis, technicalArchitecture, technologyStack, repositoryAnalysis, businessModel, targetAudience, marketAnalysis, competitorAnalysis, competitorComparison, businessScope, marketOpportunities, revenueModel, profitabilityAnalysis, risksAndLimitations, swotAnalysis, recommendations, growthStrategy, implementationRoadmap, conclusion.' },
          { role: 'user', content: evidenceText(evidence) },
        ],
      }),
    });
    if (!response.ok) return fallback;
    const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) return fallback;
    const parsed = JSON.parse(content) as Record<string, unknown>;
    return { ...fallback, ...parsed, evidenceStatus: 'AI synthesis completed from collected evidence' };
  } catch {
    return fallback;
  }
}
