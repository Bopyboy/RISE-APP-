'use client'

import { useState, useEffect } from 'react'
import { useApp } from '@/lib/app-context'
import { FOOD_DATABASE, FOOD_CATEGORIES, searchFoods, getFoodCount } from '@/lib/food-data'
import { FoodItem, MealEntry } from '@/lib/types'
import { WeeklyMealPlan } from '@/components/weekly-meal-plan'
import {
  Plus, Search, X, ArrowLeft, Minus, BookOpen,
  CalendarDays, Camera, Sparkles, ChevronRight,
  Flame, Zap, Loader2,
} from 'lucide-react'
import { FoodScanner } from '@/components/food-scanner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snacks'
type FoodView = 'diary' | 'plan'

interface AISuggestion {
  name: string
  calories: number
  protein: number
  carbs: number
  fats: number
  why: string
  emoji: string
}

interface NutritionPageProps {
  initialView?: FoodView
}

// ─── AI Suggestions Banner ────────────────────────────────────────────────────

function AISuggestionsBanner({
  caloriesRemaining,
  proteinRemaining,
  onAddSuggestion,
}: {
  caloriesRemaining: number
  proteinRemaining: number
  onAddSuggestion: (meal: MealType, entry: MealEntry) => void
}) {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [addedIndex, setAddedIndex] = useState<number | null>(null)

  const fetchSuggestions = async () => {
    if (suggestions.length > 0) { setExpanded(true); return }
    setLoading(true)
    setExpanded(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          history: [{
            role: 'user',
            content: `I have ${caloriesRemaining} calories and ${Math.round(proteinRemaining)}g of protein remaining today. Give me exactly 4 meal or snack suggestions to help me hit my goals. Respond ONLY with a JSON array, no markdown, no extra text. Each item must have: name (string), calories (number), protein (number), carbs (number), fats (number), why (1 short sentence, max 8 words), emoji (single emoji). Example: [{"name":"Greek Yogurt Bowl","calories":320,"protein":28,"carbs":30,"fats":8,"why":"High protein, quick to make","emoji":"🥣"}]`,
          }],
          userContext: {
            name: 'User',
            caloriesRemaining,
            calorieGoal: 2000,
            protein: 0,
            proteinGoal: proteinRemaining + 10,
            carbs: 0,
            carbGoal: 200,
            fats: 0,
            fatGoal: 65,
            todayWorkout: '',
            streak: 0,
            rank: '',
            fitnessGoal: 'build_muscle',
            weight: 75,
            height: 175,
            age: 25,
          },
        }),
      })
      const data = await res.json()
      const text: string = data.text ?? ''
      const clean = text.replace(/```json|```/g, '').trim()
      const parsed: AISuggestion[] = JSON.parse(clean)
      setSuggestions(parsed.slice(0, 4))
    } catch {
      setSuggestions([
        { name: 'Greek Yogurt + Berries', calories: 180, protein: 15, carbs: 22, fats: 3, why: 'High protein, low calorie', emoji: '🥣' },
        { name: 'Chicken Rice Bowl', calories: 420, protein: 38, carbs: 45, fats: 8, why: 'Balanced macro powerhouse', emoji: '🍚' },
        { name: 'Protein Shake + Banana', calories: 280, protein: 25, carbs: 35, fats: 4, why: 'Fast protein hit post-workout', emoji: '🥤' },
        { name: 'Eggs & Avocado Toast', calories: 340, protein: 18, carbs: 28, fats: 16, why: 'Healthy fats with protein', emoji: '🥑' },
      ])
    }
    setLoading(false)
  }

  const handleAdd = (s: AISuggestion, i: number) => {
    const entry: MealEntry = {
      id: crypto.randomUUID(),
      foodId: 'ai-' + crypto.randomUUID(),
      name: s.name,
      servingSize: 1,
      calories: s.calories,
      protein: s.protein,
      carbs: s.carbs,
      fats: s.fats,
    }
    // pick the most appropriate meal based on time
    const hour = new Date().getHours()
    const meal: MealType = hour < 10 ? 'breakfast' : hour < 14 ? 'lunch' : hour < 18 ? 'dinner' : 'snacks'
    onAddSuggestion(meal, entry)
    setAddedIndex(i)
    setTimeout(() => setAddedIndex(null), 2000)
  }

  if (caloriesRemaining <= 0) return null

  return (
    <div className="overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card">
      <button
        type="button"
        onClick={fetchSuggestions}
        className="flex w-full items-center justify-between p-4"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-foreground">AI Food Suggestions</p>
            <p className="text-xs text-muted-foreground">
              {caloriesRemaining} kcal · {Math.round(proteinRemaining)}g protein left
            </p>
          </div>
        </div>
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        ) : (
          <ChevronRight className={cn('h-4 w-4 text-muted-foreground transition-transform', expanded && 'rotate-90')} />
        )}
      </button>

      {expanded && !loading && suggestions.length > 0 && (
        <div className="space-y-2 border-t border-border px-4 pb-4">
          <p className="pt-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Suggested to hit your goals
          </p>
          {suggestions.map((s, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl bg-secondary/50 p-3"
            >
              <span className="text-2xl">{s.emoji}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{s.name}</p>
                <p className="text-xs text-muted-foreground">{s.why}</p>
                <div className="mt-1 flex items-center gap-2 text-[10px] font-medium">
                  <span className="flex items-center gap-0.5 text-orange-400">
                    <Flame className="h-2.5 w-2.5" />{s.calories}
                  </span>
                  <span className="text-green-400">{s.protein}g P</span>
                  <span className="text-amber-400">{s.carbs}g C</span>
                  <span className="text-rose-400">{s.fats}g F</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleAdd(s, i)}
                className={cn(
                  'shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold transition-all',
                  addedIndex === i
                    ? 'bg-green-500/20 text-green-500'
                    : 'bg-primary text-primary-foreground hover:opacity-90'
                )}
              >
                {addedIndex === i ? '✓ Added' : 'Add'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main NutritionPage ───────────────────────────────────────────────────────

export function NutritionPage({ initialView = 'diary' }: NutritionPageProps) {
  const { settings, nutrition, getTodayTotals, addMealEntry, removeMealEntry } = useApp()
  const totals = getTodayTotals()
  const [view, setView] = useState<FoodView>(initialView)
  const [addFoodModal, setAddFoodModal] = useState<{ open: boolean; meal: MealType | null }>({ open: false, meal: null })
  const [scannerModal, setScannerModal] = useState<{ open: boolean; meal: MealType | null }>({ open: false, meal: null })
  const foodCount = getFoodCount()

  const caloriePercent = Math.min(100, (totals.calories / settings.calorieGoal) * 100)
  const proteinPercent = Math.min(100, (totals.protein / settings.proteinGoal) * 100)
  const carbPercent = Math.min(100, (totals.carbs / settings.carbGoal) * 100)
  const fatPercent = Math.min(100, (totals.fats / settings.fatGoal) * 100)
  const caloriesRemaining = Math.max(settings.calorieGoal - totals.calories, 0)
  const proteinRemaining = Math.max(settings.proteinGoal - totals.protein, 0)

  const getMealTotals = (entries: MealEntry[]) => ({
    calories: entries.reduce((sum, e) => sum + e.calories, 0),
    protein: entries.reduce((sum, e) => sum + e.protein, 0),
  })

  return (
    <>
      <div className="space-y-4 pb-20">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            <span className="rise-shimmer-text">Food</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            {foodCount}+ foods · AI meal plans · macro tracking
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-2 rounded-2xl bg-secondary/60 p-1">
          {([
            { id: 'diary', icon: BookOpen, label: 'Diary' },
            { id: 'plan', icon: CalendarDays, label: 'Meal plan' },
          ] as const).map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setView(id)}
              className={cn(
                'flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold transition-colors',
                view === id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {view === 'plan' ? (
          <WeeklyMealPlan />
        ) : (
          <>
            {/* Calorie card */}
            <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-5">
              <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/15 blur-2xl" />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Daily calories</p>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-foreground">{totals.calories}</span>
                      <span className="text-lg text-muted-foreground">/ {settings.calorieGoal}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">{caloriesRemaining}</p>
                    <p className="text-xs text-muted-foreground">kcal left</p>
                  </div>
                </div>
                <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${caloriePercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Macro rings */}
            <div className="grid grid-cols-3 gap-3">
              <MacroRing label="Protein" current={Math.round(totals.protein)} goal={settings.proteinGoal} percent={proteinPercent} color="green" />
              <MacroRing label="Carbs" current={Math.round(totals.carbs)} goal={settings.carbGoal} percent={carbPercent} color="amber" />
              <MacroRing label="Fats" current={Math.round(totals.fats)} goal={settings.fatGoal} percent={fatPercent} color="rose" />
            </div>

            {/* AI Suggestions */}
            <AISuggestionsBanner
              caloriesRemaining={caloriesRemaining}
              proteinRemaining={proteinRemaining}
              onAddSuggestion={(meal, entry) => addMealEntry(meal, entry)}
            />

            {/* Meal sections */}
            {(['breakfast', 'lunch', 'dinner', 'snacks'] as MealType[]).map(mealType => {
              const entries = nutrition.meals[mealType]
              const mealTotals = getMealTotals(entries)
              const icons: Record<MealType, string> = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snacks: '🍿' }
              const labels: Record<MealType, string> = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snacks: 'Snacks' }

              return (
                <div key={mealType} className="overflow-hidden rounded-2xl border border-border bg-card">
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-xl">
                        {icons[mealType]}
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{labels[mealType]}</h3>
                        {entries.length > 0 ? (
                          <p className="text-xs text-muted-foreground">
                            {mealTotals.calories} cal · {Math.round(mealTotals.protein)}g protein
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground">Nothing logged yet</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setScannerModal({ open: true, meal: mealType })}
                        className="flex h-9 w-9 items-center justify-center rounded-xl text-emerald-500 hover:bg-emerald-500/10"
                        title="Scan food"
                      >
                        <Camera className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setAddFoodModal({ open: true, meal: mealType })}
                        className="flex items-center gap-1.5 rounded-xl bg-primary/10 px-3 py-2 text-xs font-bold text-primary hover:bg-primary/20"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add
                      </button>
                    </div>
                  </div>

                  {entries.length > 0 && (
                    <div className="space-y-1 border-t border-border px-4 pb-4 pt-2">
                      {entries.map(entry => (
                        <div
                          key={entry.id}
                          className="flex items-center justify-between rounded-xl bg-secondary/40 px-3 py-2.5"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-foreground">{entry.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {entry.servingSize}g · {entry.calories} cal · {Math.round(entry.protein)}g P
                            </p>
                          </div>
                          <button
                            onClick={() => removeMealEntry(mealType, entry.id)}
                            className="ml-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </>
        )}
      </div>

      {addFoodModal.open && addFoodModal.meal && (
        <AddFoodModal
          meal={addFoodModal.meal}
          onClose={() => setAddFoodModal({ open: false, meal: null })}
          onAdd={(entry) => {
            if (addFoodModal.meal) addMealEntry(addFoodModal.meal, entry)
          }}
        />
      )}

      {scannerModal.open && scannerModal.meal && (
        <FoodScanner
          meal={scannerModal.meal}
          onClose={() => setScannerModal({ open: false, meal: null })}
          onAdd={(entry) => {
            if (scannerModal.meal) addMealEntry(scannerModal.meal, entry)
          }}
        />
      )}
    </>
  )
}

// ─── Macro Ring ───────────────────────────────────────────────────────────────

function MacroRing({ label, current, goal, percent, color }: {
  label: string; current: number; goal: number; percent: number; color: 'green' | 'amber' | 'rose'
}) {
  const strokeColors = { green: '#22c55e', amber: '#f59e0b', rose: '#f43f5e' }
  const textColors = { green: 'text-green-500', amber: 'text-amber-500', rose: 'text-rose-500' }
  const radius = 32
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percent / 100) * circumference

  return (
    <div className="flex flex-col items-center rounded-2xl border border-border bg-card p-3">
      <div className="relative h-20 w-20">
        <svg className="h-full w-full -rotate-90">
          <circle cx="40" cy="40" r={radius} fill="none" stroke="currentColor" strokeWidth="6" className="text-secondary" />
          <circle cx="40" cy="40" r={radius} fill="none" stroke={strokeColors[color]} strokeWidth="6"
            strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
            className="transition-all duration-500" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('text-base font-bold leading-none', textColors[color])}>{current}g</span>
        </div>
      </div>
      <p className="mt-1 text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-[10px] text-muted-foreground/70">of {goal}g</p>
    </div>
  )
}

// ─── Add Food Modal ───────────────────────────────────────────────────────────

function AddFoodModal({ meal, onClose, onAdd }: {
  meal: MealType; onClose: () => void; onAdd: (entry: MealEntry) => void
}) {
  const [view, setView] = useState<'categories' | 'list' | 'detail' | 'manual'>('categories')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [servingSize, setServingSize] = useState(100)
  const [manualFood, setManualFood] = useState({ name: '', calories: '', protein: '', carbs: '', fats: '', serving: '' })

  const mealLabels: Record<MealType, string> = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snacks: 'Snacks' }
  const searchResults = searchQuery.length >= 2 ? searchFoods(searchQuery) : []

  const handleFoodClick = (food: FoodItem) => {
    setSelectedFood(food)
    setServingSize(food.servingGrams)
    setView('detail')
  }

  const handleAddToMeal = () => {
    if (!selectedFood) return
    const multiplier = servingSize / selectedFood.servingGrams
    onAdd({
      id: crypto.randomUUID(),
      foodId: selectedFood.id,
      name: selectedFood.name,
      servingSize,
      calories: Math.round(selectedFood.calories * multiplier),
      protein: Math.round(selectedFood.protein * multiplier * 10) / 10,
      carbs: Math.round(selectedFood.carbs * multiplier * 10) / 10,
      fats: Math.round(selectedFood.fats * multiplier * 10) / 10,
    })
    onClose()
  }

  const handleManualAdd = () => {
    if (!manualFood.name || !manualFood.calories) return
    onAdd({
      id: crypto.randomUUID(),
      foodId: 'manual-' + crypto.randomUUID(),
      name: manualFood.name,
      servingSize: parseInt(manualFood.serving) || 100,
      calories: parseInt(manualFood.calories) || 0,
      protein: parseFloat(manualFood.protein) || 0,
      carbs: parseFloat(manualFood.carbs) || 0,
      fats: parseFloat(manualFood.fats) || 0,
    })
    onClose()
  }

  const goBack = () => {
    if (view === 'detail') { setView(selectedCategory ? 'list' : 'categories'); setSelectedFood(null) }
    else if (view === 'list') { setView('categories'); setSelectedCategory(null) }
    else if (view === 'manual') setView('categories')
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <button onClick={view === 'categories' ? onClose : goBack}
          className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-secondary">
          {view === 'categories' ? <X className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
        </button>
        <h2 className="text-lg font-semibold">Add to {mealLabels[meal]}</h2>
      </div>

      {view !== 'detail' && view !== 'manual' && (
        <div className="border-b border-border p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search foods..." value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4">
        {searchQuery.length >= 2 && view !== 'detail' && view !== 'manual' && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{searchResults.length} results for &quot;{searchQuery}&quot;</p>
            {searchResults.map(food => <FoodListItem key={food.id} food={food} onClick={() => handleFoodClick(food)} />)}
          </div>
        )}

        {view === 'categories' && searchQuery.length < 2 && (
          <>
            <p className="mb-3 text-xs text-muted-foreground">{getFoodCount()} foods in database</p>
            <div className="grid grid-cols-2 gap-3">
              {FOOD_CATEGORIES.map(category => (
                <button key={category.id} onClick={() => { setSelectedCategory(category.id); setView('list') }}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:bg-secondary">
                  <span className="text-2xl">{category.icon}</span>
                  <span className="font-medium text-foreground">{category.name}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setView('manual')}
              className="mt-4 w-full rounded-2xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary">
              Enter Manually
            </button>
          </>
        )}

        {view === 'list' && selectedCategory && (
          <div className="space-y-2">
            {FOOD_DATABASE[selectedCategory]?.map(food => (
              <FoodListItem key={food.id} food={food} onClick={() => handleFoodClick(food)} />
            ))}
          </div>
        )}

        {view === 'detail' && selectedFood && (
          <div className="space-y-5">
            <div className="text-center">
              <h3 className="text-xl font-bold text-foreground">{selectedFood.name}</h3>
              <p className="text-sm text-muted-foreground">{selectedFood.servingSize}</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="mb-3 text-sm font-medium text-muted-foreground">Serving Size (grams)</p>
              <div className="flex items-center justify-center gap-4">
                <button onClick={() => setServingSize(Math.max(10, servingSize - 10))}
                  className="flex h-12 w-12 items-center justify-center rounded-full border border-border hover:bg-secondary">
                  <Minus className="h-5 w-5" />
                </button>
                <Input type="number" value={servingSize}
                  onChange={e => setServingSize(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-24 text-center text-lg font-semibold" />
                <button onClick={() => setServingSize(servingSize + 10)}
                  className="flex h-12 w-12 items-center justify-center rounded-full border border-border hover:bg-secondary">
                  <Plus className="h-5 w-5" />
                </button>
              </div>
            </div>
            {(() => {
              const m = servingSize / selectedFood.servingGrams
              return (
                <div className="grid grid-cols-2 gap-3">
                  <MacroDisplayCard label="Calories" value={Math.round(selectedFood.calories * m)} unit="cal" color="blue" />
                  <MacroDisplayCard label="Protein" value={Math.round(selectedFood.protein * m * 10) / 10} unit="g" color="green" />
                  <MacroDisplayCard label="Carbs" value={Math.round(selectedFood.carbs * m * 10) / 10} unit="g" color="amber" />
                  <MacroDisplayCard label="Fats" value={Math.round(selectedFood.fats * m * 10) / 10} unit="g" color="rose" />
                </div>
              )
            })()}
            <Button onClick={handleAddToMeal} className="w-full" size="lg">Add to {mealLabels[meal]}</Button>
          </div>
        )}

        {view === 'manual' && (
          <div className="space-y-4">
            {[
              { label: 'Food Name', key: 'name', type: 'text', placeholder: 'e.g. Homemade Smoothie' },
              { label: 'Serving Size (g)', key: 'serving', type: 'number', placeholder: '100' },
              { label: 'Calories', key: 'calories', type: 'number', placeholder: '0' },
            ].map(({ label, key, type, placeholder }) => (
              <div key={key}>
                <label className="mb-1.5 block text-sm font-medium text-foreground">{label}</label>
                <Input type={type} value={manualFood[key as keyof typeof manualFood]}
                  onChange={e => setManualFood(prev => ({ ...prev, [key]: e.target.value }))}
                  placeholder={placeholder} />
              </div>
            ))}
            <div className="grid grid-cols-3 gap-3">
              {(['protein', 'carbs', 'fats'] as const).map(k => (
                <div key={k}>
                  <label className="mb-1.5 block text-sm font-medium text-foreground capitalize">{k} (g)</label>
                  <Input type="number" value={manualFood[k]}
                    onChange={e => setManualFood(prev => ({ ...prev, [k]: e.target.value }))} placeholder="0" />
                </div>
              ))}
            </div>
            <Button onClick={handleManualAdd} disabled={!manualFood.name || !manualFood.calories} className="w-full" size="lg">
              Add to {mealLabels[meal]}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

function FoodListItem({ food, onClick }: { food: FoodItem; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="flex w-full items-center justify-between rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:bg-secondary">
      <div>
        <p className="font-medium text-foreground">{food.name}</p>
        <p className="text-sm text-muted-foreground">{food.servingSize}</p>
      </div>
      <div className="text-right">
        <p className="font-semibold text-foreground">{food.calories} cal</p>
        <p className="text-xs text-muted-foreground">P: {food.protein}g | C: {food.carbs}g | F: {food.fats}g</p>
      </div>
    </button>
  )
}

function MacroDisplayCard({ label, value, unit, color }: {
  label: string; value: number; unit: string; color: 'blue' | 'green' | 'amber' | 'rose'
}) {
  const colorClasses = { blue: 'text-blue-500', green: 'text-green-500', amber: 'text-amber-500', rose: 'text-rose-500' }
  return (
    <div className="rounded-2xl border border-border bg-card p-4 text-center">
      <p className={cn('text-2xl font-bold', colorClasses[color])}>
        {value}<span className="text-sm font-normal text-muted-foreground">{unit}</span>
      </p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}