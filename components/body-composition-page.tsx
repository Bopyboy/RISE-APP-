'use client'

import { useState } from 'react'
import { useApp } from '@/lib/app-context'
import { cn } from '@/lib/utils'
import { Scale, Ruler, TrendingDown, TrendingUp, Info, ChevronDown, ChevronUp } from 'lucide-react'

function navyBodyFat(
  gender: 'male' | 'female',
  waistCm: number,
  neckCm: number,
  hipCm: number | null,
  heightCm: number
): number {
  if (gender === 'male') {
    return (
      495 /
        (1.0324 -
          0.19077 * Math.log10(waistCm - neckCm) +
          0.15456 * Math.log10(heightCm)) -
      450
    )
  } else {
    const hip = hipCm ?? 90
    return (
      495 /
        (1.29579 -
          0.35004 * Math.log10(waistCm + hip - neckCm) +
          0.221 * Math.log10(heightCm)) -
      450
    )
  }
}

function bmiFatEstimate(bmi: number, age: number, gender: 'male' | 'female'): number {
  const sexFactor = gender === 'male' ? 1 : 0
  return 1.2 * bmi + 0.23 * age - 10.8 * sexFactor - 5.4
}

function getCategory(bf: number, gender: 'male' | 'female') {
  if (gender === 'male') {
    if (bf < 6) return { label: 'Essential Fat', color: 'text-blue-400', description: 'Below healthy minimum — athlete/competition level' }
    if (bf < 14) return { label: 'Athletic', color: 'text-green-400', description: 'Visible abs, lean and muscular appearance' }
    if (bf < 18) return { label: 'Fit', color: 'text-green-500', description: 'Healthy, some muscle definition visible' }
    if (bf < 25) return { label: 'Average', color: 'text-yellow-400', description: 'Healthy range, minimal visible definition' }
    if (bf < 32) return { label: 'Overweight', color: 'text-orange-400', description: 'Above healthy range' }
    return { label: 'Obese', color: 'text-red-400', description: 'Significantly above healthy range' }
  } else {
    if (bf < 14) return { label: 'Essential Fat', color: 'text-blue-400', description: 'Below healthy minimum for women' }
    if (bf < 21) return { label: 'Athletic', color: 'text-green-400', description: 'Very lean, athletic physique' }
    if (bf < 25) return { label: 'Fit', color: 'text-green-500', description: 'Healthy and fit' }
    if (bf < 32) return { label: 'Average', color: 'text-yellow-400', description: 'Healthy range' }
    if (bf < 39) return { label: 'Overweight', color: 'text-orange-400', description: 'Above healthy range' }
    return { label: 'Obese', color: 'text-red-400', description: 'Significantly above healthy range' }
  }
}

function idealRange(goal: string, gender: 'male' | 'female'): [number, number] {
  if (gender === 'male') {
    if (goal === 'lose_fat') return [10, 15]
    if (goal === 'build_muscle') return [12, 18]
    return [12, 18]
  } else {
    if (goal === 'lose_fat') return [18, 24]
    if (goal === 'build_muscle') return [20, 26]
    return [20, 26]
  }
}

export function BodyCompositionPage() {
  const app = useApp()
  const settings = app?.settings
  const weight = settings?.weight ?? 70
  const height = settings?.height ?? 175
  const gender = settings?.gender ?? 'male'
  const fitnessGoal = settings?.fitnessGoal ?? 'build_muscle'
  const age = settings?.age ?? 25

  const [waist, setWaist] = useState('')
  const [neck, setNeck] = useState('')
  const [hip, setHip] = useState('')
  const [showInfo, setShowInfo] = useState(false)
  const [result, setResult] = useState<number | null>(null)
  const [method, setMethod] = useState<'navy' | 'bmi'>('navy')

  const canCalculate = waist && neck && (gender === 'male' || hip)

  const calculate = () => {
    const w = parseFloat(waist)
    const n = parseFloat(neck)
    const h = hip ? parseFloat(hip) : null
    if (!w || !n) return
    let bf: number
    if (canCalculate) {
      bf = navyBodyFat(gender, w, n, h, height)
      setMethod('navy')
    } else {
      const bmi = weight / Math.pow(height / 100, 2)
      bf = bmiFatEstimate(bmi, age, gender)
      setMethod('bmi')
    }
    setResult(Math.max(3, Math.min(60, Math.round(bf * 10) / 10)))
  }

  const category = result !== null ? getCategory(result, gender) : null
  const lean = result !== null ? weight * (1 - result / 100) : null
  const fat = result !== null ? weight * (result / 100) : null
  const [idealMin, idealMax] = idealRange(fitnessGoal, gender)
  const toIdeal = result !== null ? Math.max(0, result - idealMax) : null
  const fatToLose = result !== null && toIdeal !== null && toIdeal > 0 ? (toIdeal / 100) * weight : null
  const bfBarPosition = result !== null ? Math.min(100, Math.max(0, (result / 40) * 100)) : 0

  return (
    <div className="space-y-4 pb-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">Body Composition</h2>
        <p className="text-sm text-muted-foreground">Estimate your body fat % using measurements</p>
      </div>

      <button
        onClick={() => setShowInfo(v => !v)}
        className="flex w-full items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-left"
      >
        <Info className="h-4 w-4 text-primary flex-shrink-0" />
        <span className="flex-1 text-sm text-muted-foreground">How to measure correctly</span>
        {showInfo ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {showInfo && (
        <div className="rounded-2xl border border-border bg-card px-4 py-3 space-y-2 text-sm text-muted-foreground">
          <p><strong className="text-foreground">Waist:</strong> Measure at your navel, relaxed (don't suck in)</p>
          <p><strong className="text-foreground">Neck:</strong> Measure just below the larynx (Adam's apple)</p>
          {gender === 'female' && (
            <p><strong className="text-foreground">Hips:</strong> Widest part of your hips/buttocks</p>
          )}
          <p className="text-xs">Uses the US Navy circumference method — accurate to ±3–4%</p>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Waist (cm)</label>
            <div className="flex items-center gap-2 rounded-xl bg-secondary px-3 py-2.5">
              <Ruler className="h-4 w-4 text-muted-foreground" />
              <input
                type="number"
                value={waist}
                onChange={e => setWaist(e.target.value)}
                placeholder="e.g. 85"
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none w-full"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Neck (cm)</label>
            <div className="flex items-center gap-2 rounded-xl bg-secondary px-3 py-2.5">
              <Ruler className="h-4 w-4 text-muted-foreground" />
              <input
                type="number"
                value={neck}
                onChange={e => setNeck(e.target.value)}
                placeholder="e.g. 38"
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none w-full"
              />
            </div>
          </div>
          {gender === 'female' && (
            <div className="col-span-2">
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Hips (cm)</label>
              <div className="flex items-center gap-2 rounded-xl bg-secondary px-3 py-2.5">
                <Ruler className="h-4 w-4 text-muted-foreground" />
                <input
                  type="number"
                  value={hip}
                  onChange={e => setHip(e.target.value)}
                  placeholder="e.g. 95"
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none w-full"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Scale className="h-3.5 w-3.5" />
            <span>Weight: <strong className="text-foreground">{weight}kg</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <Ruler className="h-3.5 w-3.5" />
            <span>Height: <strong className="text-foreground">{height}cm</strong></span>
          </div>
        </div>

        <button
          onClick={calculate}
          disabled={!waist || !neck}
          className={cn(
            'w-full rounded-2xl py-3 text-sm font-bold transition-all',
            waist && neck
              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          )}
        >
          Calculate Body Fat %
        </button>
      </div>

      {result !== null && category && lean !== null && fat !== null && (
        <div className="space-y-3">
          <div className="rounded-2xl border border-border bg-card p-5 text-center">
            <p className="text-xs text-muted-foreground mb-1">
              Estimated Body Fat ({method === 'navy' ? 'US Navy Method' : 'BMI Estimate'})
            </p>
            <p className="text-5xl font-black text-foreground">{result}%</p>
            <p className={cn('text-sm font-semibold mt-1', category.color)}>{category.label}</p>
            <p className="text-xs text-muted-foreground mt-1">{category.description}</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-2">
              <span>Essential</span>
              <span>Athletic</span>
              <span>Fit</span>
              <span>Average</span>
              <span>High</span>
            </div>
            <div className="relative h-3 rounded-full overflow-hidden bg-gradient-to-r from-blue-500 via-green-500 via-yellow-400 via-orange-400 to-red-500">
              <div
                className="absolute top-0 bottom-0 w-3 rounded-full bg-white shadow-lg border-2 border-foreground transition-all"
                style={{ left: `calc(${bfBarPosition}% - 6px)` }}
              />
            </div>
            <div className="flex justify-between text-xs mt-2">
              <span className="text-muted-foreground">
                Goal range: <strong className="text-primary">{idealMin}–{idealMax}%</strong>
              </span>
              {toIdeal !== null && toIdeal > 0 ? (
                <span className="text-orange-400 flex items-center gap-1">
                  <TrendingDown className="h-3 w-3" />
                  {toIdeal.toFixed(1)}% to goal
                </span>
              ) : (
                <span className="text-green-400 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  In ideal range!
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-border bg-card p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Lean Mass</p>
              <p className="text-2xl font-bold text-foreground">{lean.toFixed(1)}<span className="text-sm font-normal text-muted-foreground">kg</span></p>
              <p className="text-xs text-muted-foreground mt-0.5">muscle, bone, water</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Fat Mass</p>
              <p className="text-2xl font-bold text-foreground">{fat.toFixed(1)}<span className="text-sm font-normal text-muted-foreground">kg</span></p>
              <p className="text-xs text-muted-foreground mt-0.5">stored body fat</p>
            </div>
          </div>

          {fatToLose !== null && fatToLose > 0 ? (
            <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4">
              <p className="text-sm font-semibold text-orange-400 mb-1">To hit your ideal range</p>
              <p className="text-sm text-foreground">
                Lose approximately <strong>{fatToLose.toFixed(1)}kg</strong> of fat.
                At 0.5kg/week that's about <strong>{Math.ceil(fatToLose / 0.5)} weeks</strong>.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-4">
              <p className="text-sm font-semibold text-green-400 mb-1">You're in your ideal range 🎯</p>
              <p className="text-sm text-foreground">
                {fitnessGoal === 'build_muscle'
                  ? 'Great base to build from. Focus on progressive overload and hitting your protein goal.'
                  : 'Keep it up. Stay consistent with your calorie target and training.'}
              </p>
            </div>
          )}

          <p className="text-xs text-muted-foreground text-center px-4">
            Estimates only — accuracy ±3–4%. For precise results use DEXA scan or hydrostatic weighing.
          </p>
        </div>
      )}
    </div>
  )
}