'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Camera, Barcode, X, ArrowLeft, Zap, CheckCircle, AlertCircle, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MealEntry } from '@/lib/types'
import { cn } from '@/lib/utils'

type ScanMode = 'choose' | 'camera-photo' | 'barcode-scan' | 'result-photo' | 'result-barcode' | 'error'
type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snacks'

interface ScannedFood {
  name: string
  brand?: string
  servingSize: number
  servingLabel?: string
  calories: number
  protein: number
  carbs: number
  fats: number
  imageUrl?: string
  confidence?: string
}

interface FoodScannerProps {
  meal: MealType
  onClose: () => void
  onAdd: (entry: MealEntry) => void
}

export function FoodScanner({ meal, onClose, onAdd }: FoodScannerProps) {
  const [mode, setMode] = useState<ScanMode>('choose')
  const [isLoading, setIsLoading] = useState(false)
  const [scannedFoods, setScannedFoods] = useState<ScannedFood[]>([])
  const [selectedFood, setSelectedFood] = useState<ScannedFood | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [barcodeValue, setBarcodeValue] = useState('')
  const [servingMultiplier, setServingMultiplier] = useState(1)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [scanLine, setScanLine] = useState(0)
  const [barcodeInput, setBarcodeInput] = useState('')

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const barcodeFileInputRef = useRef<HTMLInputElement>(null)

  const mealLabels: Record<MealType, string> = {
    breakfast: 'Breakfast',
    lunch: 'Lunch',
    dinner: 'Dinner',
    snacks: 'Snacks',
  }

  useEffect(() => {
    if (mode !== 'barcode-scan') return
    const interval = setInterval(() => {
      setScanLine(prev => (prev >= 100 ? 0 : prev + 2))
    }, 16)
    return () => clearInterval(interval)
  }, [mode])

  const startPhotoCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      setCameraStream(stream)
      if (videoRef.current) videoRef.current.srcObject = stream
    } catch {
      setErrorMsg('Could not access camera. Please allow camera access or upload a photo instead.')
      setMode('error')
    }
  }, [])

  useEffect(() => {
    if (mode === 'camera-photo') startPhotoCamera()
  }, [mode, startPhotoCamera])

  useEffect(() => {
    return () => { cameraStream?.getTracks().forEach(t => t.stop()) }
  }, [cameraStream])

  const stopCamera = () => {
    cameraStream?.getTracks().forEach(t => t.stop())
    setCameraStream(null)
  }

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
    setCapturedImage(dataUrl)
    stopCamera()
    analyzePhoto(dataUrl)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const dataUrl = ev.target?.result as string
      setCapturedImage(dataUrl)
      setMode('camera-photo')
      analyzePhoto(dataUrl)
    }
    reader.readAsDataURL(file)
  }

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve((reader.result as string).split(',')[1])
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

  const handleBarcodeImageCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setIsLoading(true)

    try {
      const base64 = await fileToBase64(file)

      const res = await fetch('/api/read-barcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mediaType: file.type || 'image/jpeg' }),
      })

      const data = await res.json()

      if (!data.barcode) throw new Error('No barcode found')

      await lookupBarcode(data.barcode)
    } catch {
      setIsLoading(false)
      setErrorMsg("Couldn't read the barcode. Make sure the barcode fills the frame and is in focus. Or type the number below.")
      setMode('error')
    }
  }

  const analyzePhoto = async (dataUrl: string) => {
    setIsLoading(true)
    try {
      const base64 = dataUrl.split(',')[1]
      const mediaType = dataUrl.split(';')[0].split(':')[1]

      const res = await fetch('/api/scan-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mediaType }),
      })

      const data = await res.json()

      if (data.error || !data.foods || data.foods.length === 0) {
        setErrorMsg("Couldn't identify any food in this image. Try a clearer photo.")
        setMode('error')
        return
      }

      setScannedFoods(data.foods)
      if (data.foods.length === 1) {
        setSelectedFood(data.foods[0])
        setServingMultiplier(1)
      }
      setMode('result-photo')
    } catch {
      setErrorMsg('Something went wrong. Please try again.')
      setMode('error')
    } finally {
      setIsLoading(false)
    }
  }

  const lookupBarcode = async (code: string) => {
    setBarcodeValue(code)
    setIsLoading(true)
    try {
      const res = await fetch(`/api/barcode?barcode=${encodeURIComponent(code)}`)
      const data = await res.json()

      if (data.error) {
        setErrorMsg(`Product not found for barcode ${code}. Try again or enter manually.`)
        setMode('error')
        return
      }

      setSelectedFood(data)
      setServingMultiplier(1)
      setMode('result-barcode')
    } catch {
      setErrorMsg('Failed to look up product. Check your connection and try again.')
      setMode('error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleManualBarcode = () => {
    if (barcodeInput.trim().length >= 6) {
      lookupBarcode(barcodeInput.trim())
    }
  }

  const handleAddFood = (food: ScannedFood) => {
    const entry: MealEntry = {
      id: crypto.randomUUID(),
      foodId: 'scanned-' + crypto.randomUUID(),
      name: food.brand ? `${food.name} (${food.brand})` : food.name,
      servingSize: Math.round(food.servingSize * servingMultiplier),
      calories: Math.round(food.calories * servingMultiplier),
      protein: Math.round(food.protein * servingMultiplier * 10) / 10,
      carbs: Math.round(food.carbs * servingMultiplier * 10) / 10,
      fats: Math.round(food.fats * servingMultiplier * 10) / 10,
    }
    onAdd(entry)
    onClose()
  }

  const goBack = () => {
    stopCamera()
    setCapturedImage(null)
    setScannedFoods([])
    setSelectedFood(null)
    setBarcodeInput('')
    setIsLoading(false)
    setMode('choose')
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <button
          onClick={mode === 'choose' ? onClose : goBack}
          className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-secondary"
        >
          {mode === 'choose' ? <X className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
        </button>
        <div>
          <h2 className="text-lg font-semibold">Scan Food</h2>
          <p className="text-xs text-muted-foreground">Add to {mealLabels[meal]}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {mode === 'choose' && (
          <div className="flex flex-col gap-4 p-6">
            <p className="text-center text-sm text-muted-foreground">How would you like to add food?</p>
            <button
              onClick={() => setMode('camera-photo')}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 text-left transition-all hover:border-primary hover:shadow-lg"
            >
              <div className="pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full bg-primary/10 blur-xl" />
              <div className="relative flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15">
                  <Camera className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground">AI Photo Scan</p>
                    <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">AI</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Take a photo, AI identifies & logs it</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setMode('barcode-scan')}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 text-left transition-all hover:border-primary hover:shadow-lg"
            >
              <div className="pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full bg-emerald-500/10 blur-xl" />
              <div className="relative flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15">
                  <Barcode className="h-7 w-7 text-emerald-500" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Barcode Scanner</p>
                  <p className="text-sm text-muted-foreground">Scan a product for exact nutrition</p>
                </div>
              </div>
            </button>

            <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileUpload} />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="rounded-xl border border-dashed border-border py-3 text-center text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              Upload from gallery
            </button>
          </div>
        )}

        {mode === 'camera-photo' && (
          <div className="relative flex h-full flex-col">
            {isLoading ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
                {capturedImage && <img src={capturedImage} alt="Captured" className="mb-2 h-48 w-48 rounded-2xl object-cover" />}
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-center font-medium">Analyzing food...</p>
                <p className="text-center text-sm text-muted-foreground">AI is identifying ingredients and estimating macros</p>
              </div>
            ) : (
              <>
                <div className="relative flex-1 bg-black">
                  <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
                  <canvas ref={canvasRef} className="hidden" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-64 w-64 rounded-2xl border-2 border-white/60 shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]" />
                  </div>
                  <p className="absolute bottom-24 left-0 right-0 text-center text-sm text-white/80">Center food in frame</p>
                </div>
                <div className="flex items-center justify-center gap-6 bg-black p-6">
                  <div className="h-12 w-12" />
                  <button onClick={capturePhoto} className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-white/20 transition-transform active:scale-95">
                    <div className="h-14 w-14 rounded-full bg-white" />
                  </button>
                  <div className="h-12 w-12" />
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
              </>
            )}
          </div>
        )}

        {mode === 'barcode-scan' && (
          <div className="flex flex-col gap-4 p-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center gap-4 py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="font-medium">Reading barcode...</p>
                {barcodeValue && <p className="font-mono text-sm text-muted-foreground">{barcodeValue}</p>}
              </div>
            ) : (
              <>
                <button
                  onClick={() => barcodeFileInputRef.current?.click()}
                  className="relative flex flex-col items-center gap-4 overflow-hidden rounded-2xl border-2 border-dashed border-emerald-400 bg-emerald-500/5 p-8 transition-all active:scale-95"
                >
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-500/15">
                    <Barcode className="h-10 w-10 text-emerald-500" />
                    <div
                      className="absolute left-2 right-2 h-0.5 bg-emerald-400 shadow-[0_0_6px_2px_rgba(52,211,153,0.7)]"
                      style={{ top: `${scanLine}%`, transition: 'none' }}
                    />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-foreground">Tap to scan barcode</p>
                    <p className="mt-1 text-sm text-muted-foreground">Point camera at barcode and snap a photo</p>
                  </div>
                </button>

                <input
                  ref={barcodeFileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleBarcodeImageCapture}
                />

                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted-foreground">or enter manually</span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                <div className="flex gap-2">
                  <input
                    type="number"
                    inputMode="numeric"
                    value={barcodeInput}
                    onChange={e => setBarcodeInput(e.target.value)}
                    placeholder="e.g. 0049000000443"
                    className="flex-1 rounded-xl border border-border bg-card px-4 py-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    onKeyDown={e => e.key === 'Enter' && handleManualBarcode()}
                  />
                  <Button onClick={handleManualBarcode} disabled={barcodeInput.length < 6} className="shrink-0">
                    Search
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {mode === 'result-photo' && (
          <div className="space-y-4 p-4">
            {capturedImage && <img src={capturedImage} alt="Scanned food" className="h-48 w-full rounded-2xl object-cover" />}
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium">AI detected {scannedFoods.length} food{scannedFoods.length !== 1 ? 's' : ''}</p>
            </div>
            {scannedFoods.length > 1 && (
              <div className="space-y-2">
                {scannedFoods.map((food, i) => (
                  <button
                    key={i}
                    onClick={() => { setSelectedFood(food); setServingMultiplier(1) }}
                    className={cn('w-full rounded-xl border p-4 text-left transition-colors', selectedFood === food ? 'border-primary bg-primary/10' : 'border-border bg-card hover:bg-secondary')}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{food.name}</p>
                      <ConfidenceBadge confidence={food.confidence} />
                    </div>
                    <p className="text-sm text-muted-foreground">~{food.calories} cal | {food.servingSize}g</p>
                  </button>
                ))}
              </div>
            )}
            {selectedFood && (
              <FoodResultCard food={selectedFood} servingMultiplier={servingMultiplier} onMultiplierChange={setServingMultiplier} showConfidence onAdd={() => handleAddFood(selectedFood)} mealLabel={mealLabels[meal]} />
            )}
          </div>
        )}

        {mode === 'result-barcode' && selectedFood && (
          <div className="space-y-4 p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              <p className="text-sm font-medium">Product found!</p>
            </div>
            {selectedFood.imageUrl && (
              <img src={selectedFood.imageUrl} alt={selectedFood.name} className="mx-auto h-40 w-40 rounded-2xl object-contain" />
            )}
            <FoodResultCard food={selectedFood} servingMultiplier={servingMultiplier} onMultiplierChange={setServingMultiplier} onAdd={() => handleAddFood(selectedFood)} mealLabel={mealLabels[meal]} />
          </div>
        )}

        {mode === 'error' && (
          <div className="flex flex-col items-center gap-4 p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/15">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <p className="font-medium">Scan failed</p>
            <p className="text-sm text-muted-foreground">{errorMsg}</p>
            <div className="w-full space-y-2">
              <p className="text-sm font-medium">Enter barcode manually</p>
              <div className="flex gap-2">
                <input
                  type="number"
                  inputMode="numeric"
                  value={barcodeInput}
                  onChange={e => setBarcodeInput(e.target.value)}
                  placeholder="Barcode number"
                  className="flex-1 rounded-xl border border-border bg-card px-4 py-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  onKeyDown={e => e.key === 'Enter' && handleManualBarcode()}
                />
                <Button onClick={handleManualBarcode} disabled={barcodeInput.length < 6} className="shrink-0">
                  Search
                </Button>
              </div>
            </div>
            <Button onClick={goBack} variant="outline" className="w-full gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

function ConfidenceBadge({ confidence }: { confidence?: string }) {
  if (!confidence) return null
  const colors = { high: 'bg-emerald-500/15 text-emerald-600', medium: 'bg-amber-500/15 text-amber-600', low: 'bg-rose-500/15 text-rose-600' }
  return <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', colors[confidence as keyof typeof colors] || colors.medium)}>{confidence} confidence</span>
}

function FoodResultCard({ food, servingMultiplier, onMultiplierChange, showConfidence, onAdd, mealLabel }: {
  food: ScannedFood; servingMultiplier: number; onMultiplierChange: (v: number) => void; showConfidence?: boolean; onAdd: () => void; mealLabel: string
}) {
  const servings = [0.5, 1, 1.5, 2, 3]
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-semibold">{food.name}</p>
            {food.brand && <p className="text-xs text-muted-foreground">{food.brand}</p>}
            <p className="mt-0.5 text-xs text-muted-foreground">Per {food.servingLabel || `${food.servingSize}g`}</p>
          </div>
          {showConfidence && <ConfidenceBadge confidence={food.confidence} />}
        </div>
        <div className="mt-4">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Servings</p>
          <div className="flex gap-2">
            {servings.map(s => (
              <button key={s} onClick={() => onMultiplierChange(s)} className={cn('flex-1 rounded-lg py-2 text-xs font-semibold transition-colors', servingMultiplier === s ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:bg-secondary/80')}>
                {s}x
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 grid grid-cols-4 gap-2">
          <MacroChip label="Cal" value={Math.round(food.calories * servingMultiplier)} color="blue" />
          <MacroChip label="Protein" value={`${(food.protein * servingMultiplier).toFixed(1)}g`} color="green" />
          <MacroChip label="Carbs" value={`${(food.carbs * servingMultiplier).toFixed(1)}g`} color="amber" />
          <MacroChip label="Fats" value={`${(food.fats * servingMultiplier).toFixed(1)}g`} color="rose" />
        </div>
      </div>
      <Button onClick={onAdd} className="w-full" size="lg">Add to {mealLabel}</Button>
    </div>
  )
}

function MacroChip({ label, value, color }: { label: string; value: string | number; color: string }) {
  const colors: Record<string, string> = { blue: 'text-blue-500', green: 'text-green-500', amber: 'text-amber-500', rose: 'text-rose-500' }
  return (
    <div className="flex flex-col items-center rounded-xl bg-secondary/60 py-2">
      <span className={cn('text-sm font-bold', colors[color])}>{value}</span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  )
}