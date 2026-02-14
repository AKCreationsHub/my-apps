export type ResearchTopic = {
  id: string;
  title: string;
  source: 'YouTube' | 'Google Trends' | 'Reddit' | 'Twitter' | 'News';
  viralScore: number;
  description: string;
};

const SOURCES: ResearchTopic['source'][] = ['YouTube', 'Google Trends', 'Reddit', 'Twitter', 'News'];

const randomTopicSet = (category: string): ResearchTopic[] => {
  const base = category || 'AI content';
  return Array.from({ length: 30 })
    .map((_, i) => ({
      id: `topic-${Date.now()}-${i + 1}`,
      title: `${base} topic idea #${i + 1}`,
      source: SOURCES[i % SOURCES.length],
      viralScore: Math.floor(60 + Math.random() * 36),
      description: `Angle for ${base}: audience pain point + trend hook + monetization CTA.`,
    }))
    .sort((a, b) => b.viralScore - a.viralScore);
};

export const researchTopics = async (category: string, audience: string): Promise<ResearchTopic[]> => {
  const serpApiKey = import.meta.env.VITE_SERPAPI_KEY;

  if (!serpApiKey) {
    return randomTopicSet(`${category} (${audience})`);
  }

  try {
    const query = encodeURIComponent(`${category} trends for ${audience}`);
    const response = await fetch(`https://serpapi.com/search.json?q=${query}&engine=google_trends&api_key=${serpApiKey}`);

    if (!response.ok) {
      throw new Error(`SerpAPI request failed: ${response.status}`);
    }

    const data = await response.json();
    const relatedQueries = Array.isArray(data?.related_queries?.rising)
      ? data.related_queries.rising.slice(0, 30)
      : [];

    if (!relatedQueries.length) {
      return randomTopicSet(`${category} (${audience})`);
    }

    return relatedQueries.map((item: { query?: string }, i: number) => ({
      id: `topic-serp-${i + 1}`,
      title: item.query || `${category} trend #${i + 1}`,
      source: SOURCES[i % SOURCES.length],
      viralScore: Math.floor(68 + Math.random() * 28),
      description: `Trend-backed idea for ${audience} creators derived from Google Trends data.`,
    }));
  } catch (error) {
    console.error(error);
    return randomTopicSet(`${category} (${audience})`);
  }
};

export const generateScript = async (topicTitle: string, source: string, audience: string) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    return `# ${topicTitle}\n\nHook:\nLead with a bold promise for ${audience} creators.\n\nBody:\n1) Explain why ${source} signals demand now.\n2) Share a repeatable content workflow.\n3) Show monetization examples.\n\nCTA:\nInvite viewers to comment their niche.`;
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `Create a 10-25 minute YouTube script for topic: "${topicTitle}" using source context: ${source}. Target audience: ${audience}. Include hook, outline, segments, CTA.`,
                },
              ],
            },
          ],
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Gemini request failed: ${response.status}`);
    }

    const data = await response.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || `# ${topicTitle}\n\nNo generated content returned.`;
  } catch (error) {
    console.error(error);
    return `# ${topicTitle}\n\nGeneration failed; fallback script template returned for ${audience}.`;
  }
};
