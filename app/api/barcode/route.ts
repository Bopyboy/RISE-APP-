import { NextRequest, NextResponse } from 'next/server'

// Do NOT use edge runtime — it blocks external fetch calls on Vercel
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const barcode = searchParams.get('barcode')

  if (!barcode) {
    return NextResponse.json({ error: 'Barcode required' }, { status: 400 })
  }

  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`,
      {
        headers: { 'User-Agent': 'RiseApp/1.0' },
        next: { revalidate: 86400 }, // cache for 24 hours
      }
    )

    if (!response.ok) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const data = await response.json()

    if (data.status !== 1 || !data.product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const p = data.product
    const nutriments = p.nutriments || {}
    const servingGrams = p.serving_quantity ? parseFloat(p.serving_quantity) : 100

    const result = {
      name: p.product_name || p.product_name_en || 'Unknown Product',
      brand: p.brands || '',
      servingSize: servingGrams,
      servingLabel: p.serving_size || `${servingGrams}g`,
      calories: Math.round((nutriments['energy-kcal_100g'] || 0) * (servingGrams / 100)),
      protein: Math.round(((nutriments.proteins_100g || 0) * (servingGrams / 100)) * 10) / 10,
      carbs: Math.round(((nutriments.carbohydrates_100g || 0) * (servingGrams / 100)) * 10) / 10,
      fats: Math.round(((nutriments.fat_100g || 0) * (servingGrams / 100)) * 10) / 10,
      imageUrl: p.image_front_small_url || p.image_url || null,
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error('Barcode lookup error:', err)
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 })
  }
}