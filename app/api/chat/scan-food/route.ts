import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mediaType } = await req.json()

    if (!imageBase64) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType || 'image/jpeg', data: imageBase64 },
            },
            {
              type: 'text',
              text: `You are a nutrition analysis AI. Look carefully at this food image and identify exactly what you see.

Be SPECIFIC and ACCURATE. A cashew is a cashew. A meat stick is a meat stick. Do not guess wrong.

Return ONLY valid JSON, no extra text:
{
  "foods": [
    {
      "name": "Exact food name",
      "servingSize": 28,
      "servingLabel": "small handful (~28g)",
      "calories": 160,
      "protein": 5.2,
      "carbs": 9.3,
      "fats": 13.0,
      "confidence": "high"
    }
  ],
  "description": "Brief description of what you see"
}

Rules:
- Identify exact shape, color, texture before naming
- If unsure, set confidence to "low"
- Estimate portion size from visual cues
- servingSize in grams, macros in grams to 1 decimal
- confidence: "high", "medium", or "low"
- List each food item separately
- If no food return {"foods": [], "description": "No food detected"}
- Sanity check: calories ≈ (protein × 4) + (carbs × 4) + (fats × 9)`,
            },
          ],
        }],
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Claude error:', JSON.stringify(data))
      return NextResponse.json({ error: data?.error?.message || 'API error' }, { status: 500 })
    }

    const text = data.content?.[0]?.text || ''
    const cleaned = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(cleaned)

    return NextResponse.json(parsed)
  } catch (err) {
    console.error('scan-food error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}