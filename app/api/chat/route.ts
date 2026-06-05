import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { history, userContext } = await req.json()

    const goalDescriptions: Record<string, string> = {
      lose_fat: 'lose fat (calorie deficit, high protein, cardio focus)',
      maintain: 'maintain weight and stay lean (balanced macros, strength focus)',
      build_muscle: 'build muscle (calorie surplus, progressive overload, high protein)',
    }
    const goalText = goalDescriptions[userContext.fitnessGoal] ?? userContext.fitnessGoal

    const prLines: string[] = []
    if (userContext.chestPR && userContext.chestPR > 0) prLines.push(`- Bench Press: ${Math.round(userContext.chestPR)} kg`)
    if (userContext.armsPR && userContext.armsPR > 0) prLines.push(`- Barbell Curl: ${Math.round(userContext.armsPR)} kg`)
    if (userContext.legsPR && userContext.legsPR > 0) prLines.push(`- Squat: ${Math.round(userContext.legsPR)} kg`)
    const prSection = prLines.length > 0
      ? `Current strength PRs:\n${prLines.join('\n')}`
      : 'Strength PRs: not yet recorded'

    const systemPrompt = `You are Rise Coach, a personal fitness and nutrition AI coach built into the Rise app. You are motivating, knowledgeable, and direct — like a real personal trainer who knows their client well.

Here is your client's current data:
- Name: ${userContext.name}
- Today's calories remaining: ${userContext.caloriesRemaining} kcal (goal: ${userContext.calorieGoal})
- Protein: ${userContext.protein}g logged of ${userContext.proteinGoal}g goal
- Carbs: ${userContext.carbs}g logged of ${userContext.carbGoal}g goal
- Fat: ${userContext.fats}g logged of ${userContext.fatGoal}g goal
- Today's workout: ${userContext.todayWorkout}
- Current streak: ${userContext.streak} days
- Rise rank: ${userContext.rank}
- Primary fitness goal: ${goalText}
- Activity level: ${userContext.activityLevel ?? 'moderate'}
- Experience level: ${userContext.experienceLevel ?? 'beginner'}
- Weight: ${userContext.weight} kg, Height: ${userContext.height} cm, Age: ${userContext.age}
${prSection}

Rules:
- Always tailor advice to their goal: "${goalText}". If they want to lose fat, lean into deficits and cardio. If they want to build muscle, push protein and progressive overload. If they want to maintain, balance both.
- Reference their PRs when discussing training — use them to set realistic targets and gauge progress.
- Use their real data when giving advice
- Be concise — 2–4 sentences unless they ask for detail
- Be encouraging but honest
- Focus on fitness, nutrition, recovery, and mindset`

    const contents = [
      {
        role: 'user',
        parts: [{ text: systemPrompt + '\n\nConversation starts now. Say a brief hello.' }],
      },
      {
        role: 'model',
        parts: [{ text: `Hey ${userContext.name}! 💪 I'm your Rise Coach. I can see your stats — let's get to work. What do you need?` }],
      },
      ...history.map((m: { role: string; content: string }) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      })),
    ]

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: { temperature: 0.8, maxOutputTokens: 500 },
        }),
      }
    )

    const data = await geminiRes.json()

    if (!geminiRes.ok) {
      console.error('Gemini error:', data)
      return NextResponse.json({ error: 'AI error' }, { status: 500 })
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    return NextResponse.json({ text })

  } catch (err) {
    console.error('Chat route error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}