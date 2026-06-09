import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { title, category, timeframeDays } = await req.json()

    if (!title || !timeframeDays) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const weeks = Math.max(1, Math.ceil(timeframeDays / 7))

    const categoryDescriptions: Record<string, string> = {
      fitness:       'physical fitness, exercise, and body transformation',
      wealth:        'making money, building income streams, and financial growth',
      relationships: 'dating, relationships, social skills, and meeting people',
      mindset:       'mental discipline, confidence, focus, and self-improvement',
      career:        'career growth, professional skills, and work success',
      custom:        'personal achievement and self-improvement',
    }
    const categoryDesc = categoryDescriptions[category] ?? 'personal achievement'

    const prompt = `You are a no-nonsense life coach who gives brutally practical, week-by-week action plans.

A user has set this goal: "${title}"
Category: ${categoryDesc}
Timeframe: ${timeframeDays} days (${weeks} weeks)

Generate exactly ${Math.min(weeks, 8)} weekly action items as a JSON array. Each item covers one week of the plan.

Rules:
- Be SPECIFIC and ACTIONABLE — not vague motivational fluff
- Each action should be something the person can actually DO, not just "think about" something
- Make each week build on the last
- Be direct and real — like advice from a successful mentor, not a self-help book
- For wealth/career goals: specific tactics (e.g. "Cold DM 10 potential clients per day using [specific method]")
- For relationship goals: real social skills and actions (e.g. "Approach 3 strangers this week and start a conversation")
- For fitness goals: exact exercises, reps, or habits
- For mindset goals: concrete practices, not platitudes

Respond ONLY with a JSON array. No markdown, no explanation, no backticks.
Example format:
[
  {
    "week": 1,
    "title": "Lay the foundation",
    "action": "Do X specific thing every single day this week. Measure Y. Do not skip."
  }
]`

    const contents = [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ]

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.85,
            maxOutputTokens: 1200,
          },
        }),
      }
    )

    const data = await geminiRes.json()

    if (!geminiRes.ok) {
      console.error('Gemini goals error:', data)
      return NextResponse.json({ error: 'AI error' }, { status: 500 })
    }

    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '[]'

    // Strip any markdown fences if model ignores instructions
    const cleaned = raw.replace(/```json|```/gi, '').trim()

    let tips = []
    try {
      tips = JSON.parse(cleaned)
    } catch {
      // If parse fails, return empty tips — UI handles this gracefully
      tips = []
    }

    return NextResponse.json({ tips })
  } catch (err) {
    console.error('Goals route error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
