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
        max_tokens: 50,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType || 'image/jpeg', data: imageBase64 },
            },
            {
              type: 'text',
              text: 'Read the barcode or UPC number in this image. Reply with ONLY the digits, nothing else. No spaces, no dashes. If you cannot find a barcode, reply with NONE.',
            },
          ],
        }],
      }),
    })

    const data = await response.json()
    const text = data.content?.[0]?.text?.trim() || ''
    const barcode = text.replace(/\D/g, '')

    if (!barcode || barcode.length < 6) {
      return NextResponse.json({ error: 'No barcode found' }, { status: 404 })
    }

    return NextResponse.json({ barcode })
  } catch (err) {
    console.error('read-barcode error:', err)
    return NextResponse.json({ error: 'Failed to read barcode' }, { status: 500 })
  }
}