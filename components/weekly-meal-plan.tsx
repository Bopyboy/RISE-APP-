'use client'

import { useMemo, useState, useEffect, useRef } from 'react'
import { useApp } from '@/lib/app-context'
import { generateFitnessPlan } from '@/lib/fitness-plans'
import { DayMealPlan, MealPlanSlot } from '@/lib/fitness-plans'
import { MealEntry } from '@/lib/types'
import {
  Calendar, ChevronDown, ChevronUp, Copy, Sparkles,
  Utensils, X, Loader2, ChefHat, ShoppingBag, Clock,
  Play, Pause, ArrowRight, Check, Timer, ChevronLeft,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type MealKey = 'breakfast' | 'lunch' | 'dinner' | 'snacks'

interface CookStep {
  instruction: string
  detail: string
  timerSeconds: number
  timerLabel: string
}

interface RecipeData {
  ingredients: string[]
  steps: CookStep[]
  prepTime: string
  cookTime: string
}

function slotToEntry(slot: MealPlanSlot, meal: MealKey): MealEntry {
  return {
    id: crypto.randomUUID(),
    foodId: `plan-${meal}-${Date.now()}`,
    name: slot.name,
    servingSize: 1,
    calories: slot.calories,
    protein: slot.protein,
    carbs: slot.carbs,
    fats: slot.fats,
  }
}

// ─── Countdown Timer Ring ─────────────────────────────────────────────────────

function TimerRing({
  totalSeconds,
  secondsLeft,
  running,
  onToggle,
}: {
  totalSeconds: number
  secondsLeft: number
  running: boolean
  onToggle: () => void
}) {
  const radius = 54
  const circ = 2 * Math.PI * radius
  const progress = totalSeconds > 0 ? secondsLeft / totalSeconds : 0
  const offset = circ - progress * circ
  const mins = Math.floor(secondsLeft / 60)
  const secs = secondsLeft % 60

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative h-40 w-40">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 128 128">
          <circle cx="64" cy="64" r={radius} fill="none" stroke="currentColor"
            strokeWidth="8" className="text-secondary" />
          <circle cx="64" cy="64" r={radius} fill="none"
            stroke={secondsLeft <= 10 ? '#ef4444' : 'oklch(0.78 0.2 132)'}
            strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
          <span className={cn(
            'text-4xl font-black tabular-nums',
            secondsLeft <= 10 ? 'text-red-400' : 'text-foreground'
          )}>
            {mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : secs}
          </span>
          <span className="text-xs text-muted-foreground">{mins > 0 ? 'min' : 'sec'}</span>
        </div>
      </div>
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'flex items-center gap-2 rounded-2xl px-8 py-3 text-sm font-bold transition-all active:scale-[0.97]',
          running
            ? 'bg-secondary text-foreground'
            : 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
        )}
      >
        {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        {running ? 'Pause' : secondsLeft < totalSeconds ? 'Resume' : 'Start Timer'}
      </button>
    </div>
  )
}

// ─── Guided Cook Mode ─────────────────────────────────────────────────────────

function GuidedCookMode({ steps, onDone }: { steps: CookStep[]; onDone: () => void }) {
  const [stepIndex, setStepIndex] = useState(0)
  const [timerSeconds, setTimerSeconds] = useState(steps[0]?.timerSeconds ?? 0)
  const [running, setRunning] = useState(false)
  const [finished, setFinished] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const step = steps[stepIndex]
  const isLast = stepIndex === steps.length - 1
  const hasTimer = step.timerSeconds > 0

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setTimerSeconds(step.timerSeconds)
    setRunning(false)
    setFinished(false)
  }, [stepIndex, step.timerSeconds])

  useEffect(() => {
    if (running && timerSeconds > 0) {
      intervalRef.current = setInterval(() => {
        setTimerSeconds(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!)
            setRunning(false)
            setFinished(true)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else if (!running && intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running])

  const goNext = () => {
    if (isLast) { onDone(); return }
    setStepIndex(i => i + 1)
  }

  const canGoNext = !hasTimer || finished || timerSeconds === 0

  return (
    <div className="flex flex-col min-h-0 flex-1">
      <div className="flex items-center justify-center gap-1.5 py-4">
        {steps.map((_, i) => (
          <div key={i} className={cn(
            'rounded-full transition-all',
            i === stepIndex ? 'h-2 w-6 bg-primary' : i < stepIndex ? 'h-2 w-2 bg-primary/40' : 'h-2 w-2 bg-secondary'
          )} />
        ))}
      </div>

      <div className="px-5">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-black text-primary-foreground">
            {stepIndex + 1}
          </span>
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Step {stepIndex + 1} of {steps.length}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        <h2 className="text-2xl font-black leading-snug text-foreground">
          {step.instruction}
        </h2>

        {step.detail && (
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-primary mb-1">💡 How to do it</p>
            <p className="text-sm leading-relaxed text-foreground">{step.detail}</p>
          </div>
        )}

        {hasTimer && (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-1.5 mb-2">
              <Timer className="h-4 w-4 text-primary" />
              <p className="text-xs font-bold uppercase tracking-wider text-primary">{step.timerLabel}</p>
            </div>
            <TimerRing
              totalSeconds={step.timerSeconds}
              secondsLeft={timerSeconds}
              running={running}
              onToggle={() => setRunning(r => !r)}
            />
            {finished && (
              <div className="mt-2 flex items-center gap-2 rounded-xl bg-green-500/10 px-4 py-2.5">
                <Check className="h-4 w-4 text-green-500" />
                <p className="text-sm font-bold text-green-500">Time's up! Ready for next step.</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-border p-5 pb-8 shrink-0">
        {hasTimer && !canGoNext ? (
          <div className="rounded-2xl bg-secondary py-4 text-center">
            <p className="text-sm font-semibold text-muted-foreground">
              ⏳ Start the timer above, then tap Next when it finishes
            </p>
          </div>
        ) : (
          <button
            type="button"
            onClick={goNext}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-base font-black text-primary-foreground shadow-lg shadow-primary/30 transition-all active:scale-[0.98]"
          >
            {isLast ? (
              <><Check className="h-5 w-5" /> Done! Meal Complete 🎉</>
            ) : (
              <>Next Step <ArrowRight className="h-5 w-5" /></>
            )}
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Fallback Recipe Builder ──────────────────────────────────────────────────

type MealFlags = {
  isNoCook: boolean; isSmoothieOrShake: boolean; isYogurtParfait: boolean
  isOvernightOats: boolean; isColdSandwich: boolean; isColdSalad: boolean
  isEggs: boolean; isPancakeWaffle: boolean; isOatmeal: boolean
  isPasta: boolean; isStirFry: boolean; isChicken: boolean; isFish: boolean
  isBeef: boolean; isSoup: boolean; isRiceDish: boolean
  isGrilled: boolean; isBaked: boolean
}

function buildFallbackRecipe(name: string, f: MealFlags): RecipeData {
  if (f.isSmoothieOrShake) return {
    ingredients: ['1 scoop protein powder (whey or plant)', '1 cup whole milk or oat milk', '1 medium banana, frozen', '½ cup frozen berries', '1 tbsp peanut butter', '4–5 ice cubes'],
    prepTime: '3 min', cookTime: '0 min',
    steps: [
      { instruction: 'Add liquid to blender first', detail: 'Pour the milk into the blender before anything else — this protects the blade and helps everything blend smoothly.', timerSeconds: 0, timerLabel: '' },
      { instruction: 'Add fruit and protein powder', detail: 'Drop in the frozen banana, berries, peanut butter, and protein powder. Frozen fruit is better than fresh — it makes the shake thick and cold without watering it down with ice.', timerSeconds: 0, timerLabel: '' },
      { instruction: 'Blend on high until smooth', detail: 'Blend on the highest setting for 45–60 seconds. Stop and scrape down the sides halfway through if needed. The shake should be completely smooth with no chunks.', timerSeconds: 50, timerLabel: 'Blending' },
      { instruction: 'Pour and serve immediately', detail: 'Pour into a large glass or shaker bottle. Drink right away — protein shakes separate quickly and are best consumed fresh.', timerSeconds: 0, timerLabel: '' },
    ],
  }

  if (f.isYogurtParfait) return {
    ingredients: ['200g Greek yogurt (2% or full fat)', '¼ cup granola', '½ cup mixed berries (fresh or frozen/thawed)', '1 tbsp honey', '1 tbsp chia seeds', '1 tsp vanilla extract (optional)'],
    prepTime: '5 min', cookTime: '0 min',
    steps: [
      { instruction: 'Stir vanilla into yogurt', detail: 'Mix the vanilla extract into the Greek yogurt in a small bowl until combined. This is optional but adds a lot of flavour depth.', timerSeconds: 0, timerLabel: '' },
      { instruction: 'Layer yogurt in a glass or bowl', detail: 'Add half the yogurt as your base layer. Use a tall glass for a parfait look, or a wide bowl for easy eating.', timerSeconds: 0, timerLabel: '' },
      { instruction: 'Add granola and berries layer', detail: 'Sprinkle half the granola over the yogurt — add it right before eating so it stays crunchy. Top with half the berries.', timerSeconds: 0, timerLabel: '' },
      { instruction: 'Repeat layers and finish with honey', detail: 'Add the remaining yogurt, then granola, then berries. Drizzle honey over the top and sprinkle chia seeds. Serve immediately.', timerSeconds: 0, timerLabel: '' },
    ],
  }

  if (f.isOatmeal) return {
    ingredients: ['1 cup rolled oats (not instant)', '2 cups water or milk', '1 pinch salt', '1 tbsp honey or maple syrup', '1 tsp cinnamon', 'Toppings: banana slices, nut butter, or berries'],
    prepTime: '2 min', cookTime: '8 min',
    steps: [
      { instruction: 'Bring liquid and salt to a boil', detail: 'Pour water or milk into a medium saucepan with a pinch of salt. Set to medium-high heat. Milk gives creamier oatmeal; water is lighter. Watch it carefully — milk boils over quickly.', timerSeconds: 0, timerLabel: '' },
      { instruction: 'Stir in oats and reduce heat', detail: 'Once boiling, pour in the rolled oats and stir immediately. Reduce heat to medium-low. The oats will start absorbing the liquid right away.', timerSeconds: 0, timerLabel: '' },
      { instruction: 'Simmer, stirring often', detail: "Cook for 5–7 minutes, stirring every minute or so to prevent sticking. The oatmeal is ready when it's thick and creamy and pulls away slightly from the sides of the pan.", timerSeconds: 360, timerLabel: 'Simmer oats' },
      { instruction: 'Season and add toppings', detail: 'Remove from heat. Stir in cinnamon and honey. Transfer to a bowl. Add your toppings — banana slices, a spoonful of nut butter, or fresh berries. Eat immediately while hot.', timerSeconds: 0, timerLabel: '' },
    ],
  }

  if (f.isEggs) return {
    ingredients: ['3 large eggs', '1 tbsp butter', '2 tbsp milk or cream', 'Salt and black pepper', 'Optional: cheese, chives, or hot sauce'],
    prepTime: '3 min', cookTime: '5 min',
    steps: [
      { instruction: 'Crack and whisk eggs with milk', detail: 'Crack eggs into a bowl. Add milk, a pinch of salt, and a grind of black pepper. Whisk vigorously until the yolks and whites are fully combined and slightly frothy — about 30 seconds.', timerSeconds: 0, timerLabel: '' },
      { instruction: 'Melt butter over medium-low heat', detail: "Set a non-stick pan to medium-low heat (lower than you think). Add butter and let it melt and foam — but don't let it brown. Low heat is the secret to creamy eggs.", timerSeconds: 60, timerLabel: 'Heat pan' },
      { instruction: 'Pour eggs and cook gently', detail: 'Pour the egg mixture into the pan. Leave it for 10–15 seconds until you see the edges just starting to set. Then use a spatula to gently push the eggs from the edges to the center in slow, wide strokes.', timerSeconds: 180, timerLabel: 'Scramble eggs' },
      { instruction: 'Remove while still slightly wet', detail: "Pull the pan off the heat when the eggs look 80% set — they'll finish cooking from residual heat. Slightly underdone in the pan = perfectly done on the plate. Add cheese now if using.", timerSeconds: 0, timerLabel: '' },
      { instruction: 'Plate and season', detail: "Slide the eggs onto a warm plate. Taste and adjust salt. Garnish with chives or a dash of hot sauce. Serve immediately — scrambled eggs don't wait.", timerSeconds: 0, timerLabel: '' },
    ],
  }

  if (f.isPasta) return {
    ingredients: ['200g pasta (spaghetti, penne, or rigatoni)', '250g ground beef or protein of choice', '1 can (400g) crushed tomatoes', '3 garlic cloves, minced', '1 small onion, diced', '2 tbsp olive oil', 'Salt, black pepper, Italian herbs', 'Parmesan to serve'],
    prepTime: '10 min', cookTime: '25 min',
    steps: [
      { instruction: 'Boil large pot of salted water', detail: "Fill your biggest pot with water and bring to a rolling boil over high heat. Season aggressively — it should taste like the sea. This is your only chance to season the pasta itself.", timerSeconds: 0, timerLabel: '' },
      { instruction: 'Brown protein in olive oil', detail: "Heat olive oil in a large pan over medium-high heat. Add the protein and break it apart. Don't stir too much — let it sit and brown. Browning = flavour. Drain excess fat if using beef.", timerSeconds: 300, timerLabel: 'Brown protein' },
      { instruction: 'Sauté onion and garlic', detail: "Push protein to the side. Add onion and cook 3 minutes until soft. Add garlic and cook 60 seconds more until fragrant — don't let it burn or it turns bitter.", timerSeconds: 240, timerLabel: 'Sauté aromatics' },
      { instruction: 'Add tomatoes and simmer sauce', detail: 'Pour in crushed tomatoes. Season with salt, pepper, and Italian herbs. Stir to combine everything. Reduce heat to low and let it simmer — the longer, the deeper the flavour.', timerSeconds: 900, timerLabel: 'Simmer sauce' },
      { instruction: 'Cook pasta al dente', detail: "Drop pasta into the boiling water. Stir immediately so it doesn't stick. Cook 1–2 minutes LESS than the package says — it finishes cooking in the sauce.", timerSeconds: 600, timerLabel: 'Cook pasta' },
      { instruction: 'Combine pasta with sauce', detail: 'Use tongs to transfer pasta directly into the sauce (bring some pasta water with it). Toss over medium heat for 1–2 minutes — the starchy pasta water helps the sauce cling to every strand.', timerSeconds: 90, timerLabel: 'Toss together' },
      { instruction: 'Plate and top with parmesan', detail: 'Twist pasta into a bowl using tongs. Spoon extra sauce over. Finish with a generous grating of parmesan and a crack of black pepper. Serve hot.', timerSeconds: 0, timerLabel: '' },
    ],
  }

  if (f.isStirFry) return {
    ingredients: ['300g chicken breast or protein, sliced thin', '2 cups mixed vegetables (broccoli, bell pepper, snap peas)', '3 tbsp soy sauce', '1 tbsp sesame oil', '2 garlic cloves, minced', '1 tsp fresh ginger', '1 tbsp cornstarch', '2 tbsp vegetable oil', 'Cooked rice to serve'],
    prepTime: '15 min', cookTime: '10 min',
    steps: [
      { instruction: 'Prep everything before you start', detail: "Slice protein thin (3–4mm), chop all vegetables, mix soy sauce + sesame oil + cornstarch in a bowl. Stir-fry moves FAST — if you're still chopping when the pan is hot, you'll burn everything.", timerSeconds: 0, timerLabel: '' },
      { instruction: 'Heat wok or pan until smoking', detail: 'Set heat to maximum. Add vegetable oil and wait until it shimmers and just starts to smoke — 1–2 minutes. High heat is non-negotiable for stir-fry; medium heat steams instead of sears.', timerSeconds: 90, timerLabel: 'Heat wok' },
      { instruction: 'Sear protein and remove', detail: "Add protein in a single layer. Do NOT stir for 60 seconds — let it sear. Then toss briefly until just cooked through. Remove to a plate. It finishes cooking when you add it back.", timerSeconds: 180, timerLabel: 'Sear protein' },
      { instruction: 'Stir-fry aromatics and vegetables', detail: 'Add a splash more oil if needed. Add garlic and ginger — stir constantly for 30 seconds. Add harder vegetables (broccoli, carrots) first, then softer ones (peppers, snap peas) 1 minute later.', timerSeconds: 180, timerLabel: 'Cook vegetables' },
      { instruction: 'Return protein and add sauce', detail: 'Add protein back to the wok. Pour sauce over everything. Toss constantly for 60–90 seconds until the sauce thickens and coats everything with a glossy finish.', timerSeconds: 90, timerLabel: 'Sauce and toss' },
      { instruction: 'Serve over rice immediately', detail: "Stir-fry waits for no one — serve it straight onto cooked rice. Finish with extra sesame oil or chilli flakes if desired.", timerSeconds: 0, timerLabel: '' },
    ],
  }

  if (f.isFish) return {
    ingredients: ['200g salmon fillet, skin-on', '1 tbsp olive oil', 'Salt, black pepper', '1 lemon', '2 garlic cloves', '1 tbsp butter', 'Fresh dill or parsley'],
    prepTime: '5 min', cookTime: '10 min',
    steps: [
      { instruction: 'Pat salmon completely dry', detail: 'Use paper towels to dry the salmon thoroughly on all sides — especially the skin. Moisture is the enemy of a crispy skin. Any water left on the fish will steam it instead of searing it.', timerSeconds: 0, timerLabel: '' },
      { instruction: 'Season generously', detail: 'Season both sides with salt and black pepper. Season the skin side more aggressively. Let it sit for 2 minutes so the salt begins to draw out any remaining moisture.', timerSeconds: 120, timerLabel: 'Season and rest' },
      { instruction: 'Heat oil in pan until shimmering', detail: 'Set a heavy-bottomed or cast iron pan over medium-high heat. Add olive oil and heat until it shimmers and you see faint wisps of smoke — about 2 minutes. This temperature is crucial for crispy skin.', timerSeconds: 120, timerLabel: 'Heat pan' },
      { instruction: 'Place skin-side down — do not move', detail: "Lay salmon skin-side down, away from you to avoid splatter. Press gently with a spatula for 10 seconds so the whole skin makes contact. Then LEAVE IT — do not move it for the full cooking time. You'll see the salmon cooking up the sides.", timerSeconds: 240, timerLabel: 'Sear skin side' },
      { instruction: 'Flip and add butter and garlic', detail: 'Flip the salmon once — only when the skin is golden and crispy. Add butter and garlic to the pan. Tilt the pan and spoon the foaming butter over the salmon repeatedly — this is called basting and keeps it moist.', timerSeconds: 120, timerLabel: 'Finish top side' },
      { instruction: 'Rest and plate with lemon', detail: 'Remove from heat. Let rest on the plate for 1 minute. Squeeze fresh lemon over the top and garnish with dill or parsley. The salmon should flake easily and be just opaque in the centre.', timerSeconds: 0, timerLabel: '' },
    ],
  }

  // Generic cooked meal fallback
  return {
    ingredients: [
      `300g main protein for ${name}`,
      '2 tbsp olive oil',
      '3 garlic cloves, minced',
      '1 tsp paprika',
      'Salt and black pepper',
      '2 cups vegetables of choice',
      'Fresh lemon or herbs to finish',
    ],
    prepTime: '10 min',
    cookTime: '20 min',
    steps: [
      { instruction: 'Prep and season everything', detail: 'Pat protein dry with paper towels — this is essential for browning. Season all sides with paprika, garlic, salt, and pepper. Chop any vegetables into similar-sized pieces so they cook evenly.', timerSeconds: 0, timerLabel: '' },
      { instruction: 'Heat pan to medium-high with oil', detail: "Add olive oil to a heavy pan over medium-high heat. Wait until the oil shimmers — you'll see it ripple slightly. If you add food to a cold pan, it steams instead of sears.", timerSeconds: 90, timerLabel: 'Heat pan' },
      { instruction: 'Sear protein — do not move it', detail: "Place protein in the pan. Don't move it for at least 3–4 minutes. A good sear = flavour. You'll know it's ready to flip when it releases naturally from the pan and has a deep golden colour.", timerSeconds: 240, timerLabel: 'Sear first side' },
      { instruction: 'Flip and cook through', detail: 'Flip once. Add garlic to the pan around the protein. Cook until the internal temperature reaches 165°F/74°C for chicken or 145°F/63°C for pork or fish.', timerSeconds: 240, timerLabel: 'Cook second side' },
      { instruction: 'Cook vegetables in same pan', detail: 'Remove protein and rest it. Add vegetables to the same pan — all the browned bits add flavour. Toss for 3–5 minutes until tender but still with a slight bite.', timerSeconds: 240, timerLabel: 'Cook vegetables' },
      { instruction: 'Rest protein, then plate', detail: 'Let the protein rest for 3–5 minutes before slicing — this lets the juices redistribute so it stays moist. Slice against the grain. Plate with vegetables and a squeeze of lemon.', timerSeconds: 180, timerLabel: 'Rest' },
    ],
  }
}

// ─── Recipe Modal ─────────────────────────────────────────────────────────────

function RecipeModal({ slot, onClose, onLog }: {
  slot: MealPlanSlot
  onClose: () => void
  onLog: () => void
}) {
  const [recipe, setRecipe] = useState<RecipeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<'overview' | 'cook'>('overview')
  const [logged, setLogged] = useState(false)

  useMemo(() => {
    const fetchRecipe = async () => {
      setLoading(true)

      const nameLower = slot.name.toLowerCase()

      const isSmoothieOrShake = /shake|smoothie/.test(nameLower)
      const isYogurtParfait = /yogurt|parfait/.test(nameLower)
      const isOvernightOats = /overnight oat|chia pudding/.test(nameLower)
      const isGranolaCereal = /granola bowl|cereal/.test(nameLower) && !/pancake|waffle/.test(nameLower)
      const isColdSandwich = /sandwich|sub|wrap|burrito/.test(nameLower) && !/hot|grilled|pressed|melt|quesadilla/.test(nameLower)
      const isColdSalad = /salad/.test(nameLower) && !/warm|hot/.test(nameLower)
      const isFruitBowl = /fruit bowl|acai bowl/.test(nameLower)
      const isNoCook = isSmoothieOrShake || isYogurtParfait || isOvernightOats || isGranolaCereal || isFruitBowl

      const isEggs = /egg|omelette|omelet|frittata|scrambled|poached/.test(nameLower)
      const isPancakeWaffle = /pancake|waffle/.test(nameLower)
      const isOatmeal = /oatmeal|porridge|hot oat/.test(nameLower)
      const isPasta = /pasta|spaghetti|bolognese|penne|linguine|fettuccine|lo mein|noodle/.test(nameLower)
      const isRiceDish = /fried rice|risotto/.test(nameLower) || (/rice/.test(nameLower) && !/pudding/.test(nameLower))
      const isChicken = /chicken/.test(nameLower)
      const isFish = /salmon|fish|tuna melt|cod|tilapia|trout/.test(nameLower)
      const isBeef = /beef|steak|burger|mince|bolognese/.test(nameLower)
      const isSoup = /soup|stew|chili/.test(nameLower)
      const isStirFry = /stir.?fry|stir fry/.test(nameLower)
      const isGrilled = /grilled|bbq/.test(nameLower)
      const isBaked = /baked|roasted|oven/.test(nameLower)

      let cookingMethodHint = ''
      if (isNoCook) {
        cookingMethodHint = 'THIS IS A NO-COOK MEAL. Zero heat. Steps: measure, layer/pour, mix or blend, top and serve. Never mention a pan, stove, or oven.'
      } else if (isSmoothieOrShake) {
        cookingMethodHint = 'Blended drink. Steps: gather, add liquid first to blender, add fruit/protein, blend until smooth, pour, serve. No heat.'
      } else if (isColdSandwich) {
        cookingMethodHint = 'Cold-assembled sandwich or wrap. Steps: lay out bread/wrap, spread condiments, layer protein then veggies, wrap or close, slice, serve. No heat.'
      } else if (isColdSalad) {
        cookingMethodHint = 'Cold salad. Steps: wash and chop produce, prepare dressing, combine in bowl, toss. No cooking.'
      } else if (isEggs) {
        cookingMethodHint = 'Egg dish requiring careful heat. Include: heat pan, add butter/oil, cooking technique (fold for omelette / stir for scramble), exact timing, seasoning, plating.'
      } else if (isPancakeWaffle) {
        cookingMethodHint = 'Pancakes/waffles. Include: mix dry then wet ingredients separately, combine without over-mixing, preheat griddle/waffle iron, portion, cook until bubbles form then flip, serve stacked.'
      } else if (isOatmeal) {
        cookingMethodHint = 'Stovetop oatmeal. Steps: measure liquid, bring to boil, stir in oats, reduce heat and simmer (timer), stir occasionally until creamy, add toppings, serve.'
      } else if (isStirFry) {
        cookingMethodHint = 'High-heat stir-fry. Steps: prep all ingredients first (mise en place is critical), heat wok/pan until smoking, cook protein first then remove, cook aromatics, cook vegetables, return protein, add sauce, toss and serve over rice/noodles.'
      } else if (isPasta) {
        cookingMethodHint = 'Pasta dish. Steps: boil large salted pot of water, cook pasta al dente (timer per package), prepare sauce separately in another pan, drain pasta (reserve some pasta water), combine with sauce, toss, plate, garnish.'
      } else if (isFish) {
        cookingMethodHint = 'Fish cooking. Steps: pat fish completely dry, season, heat pan with oil until shimmering, place skin-side down first, press gently to stop curling, cook until skin is crispy (timer), flip carefully, cook through (timer), rest briefly, plate.'
      } else if (isChicken && isGrilled) {
        cookingMethodHint = 'Grilled chicken. Steps: pound to even thickness, season/marinate, preheat grill to high (timer), oil grill grates, place chicken and do not move (timer), flip once when it releases easily, cook second side (timer), check internal temp 165°F/74°C, rest 5 min before slicing.'
      } else if (isChicken && isBaked) {
        cookingMethodHint = 'Oven-baked chicken. Steps: preheat oven to 425°F/220°C (timer), season chicken, sear in oven-safe pan 3 min per side, transfer pan to oven and bake (timer), check internal temp 165°F/74°C, rest before serving.'
      } else if (isChicken) {
        cookingMethodHint = 'Pan-cooked chicken. Identify the specific method from the meal name and apply it correctly with accurate timers.'
      } else if (isBeef && isSoup) {
        cookingMethodHint = 'Beef stew/chili. Steps: brown beef in batches (critical for flavor), remove, sauté aromatics, add liquid, return beef, bring to boil then reduce to simmer (long timer), adjust seasoning, serve.'
      } else if (isBeef) {
        cookingMethodHint = 'Beef dish. Use the method implied by the name — pan-sear, grill, or slow-cook. Include doneness temps (medium-rare 135°F, medium 145°F) and mandatory resting time.'
      } else if (isSoup) {
        cookingMethodHint = 'Soup or stew. Steps: sauté aromatics in pot, add liquid, bring to boil (timer), add main ingredients in order of cook time, simmer (timer), season and adjust, ladle and serve.'
      } else if (isRiceDish) {
        cookingMethodHint = 'Rice dish. If cooking rice: rinse until clear, use 1:1.75 water ratio, bring to boil, reduce heat and cover tight (do not lift lid), steam (timer), fluff with fork. Combine with other cooked components.'
      } else if (isBaked) {
        cookingMethodHint = 'Oven-baked dish. Steps: preheat to correct temp, prep and season, bake (timer with temp), check doneness with thermometer or visual cue, rest before serving.'
      } else {
        cookingMethodHint = 'Study the exact meal name. Identify the real cooking method and write steps specific to that dish — never use a generic template.'
      }

      const prompt = `You are a professional chef writing a step-by-step cooking guide for the Rise fitness app.

MEAL: "${slot.name}"
NUTRITION TARGET: ${slot.calories} kcal | ${slot.protein}g protein | ${slot.carbs}g carbs | ${slot.fats}g fat

COOKING METHOD ANALYSIS FOR THIS MEAL:
${cookingMethodHint}

Write a SPECIFIC, PROFESSIONAL recipe for THIS EXACT MEAL. Name the real ingredients, use real chef techniques, give real timers. Not a template.

Respond ONLY with a valid JSON object — absolutely no markdown, no backticks, no text before or after. Exact schema:
{
  "ingredients": ["250g chicken breast", "2 tbsp olive oil", "..."],
  "prepTime": "10 min",
  "cookTime": "20 min",
  "steps": [
    {
      "instruction": "Short action verb phrase (5-8 words)",
      "detail": "Detailed, beginner-friendly explanation of exactly how to do this step. Name the actual ingredients. Give sensory cues: what to look for, smell, sound. Include common mistakes to avoid.",
      "timerSeconds": 0,
      "timerLabel": ""
    }
  ]
}

RULES:
- INGREDIENTS: 6-10 items, exact quantities in grams/tbsp/cups. Scale to match the macro targets.
- STEPS: 5-8 steps, each one meaningful and specific to THIS dish.
- INSTRUCTION: Short (5-8 words). Examples: "Sear salmon skin-side down", "Fold eggs from the edges", "Boil pasta until al dente".
- DETAIL: 2-4 sentences. Mention actual ingredient names from the recipe. Include what to look for ("golden brown", "oil shimmering", "internal temp 165°F", "pasta floats"). Explain WHY the step matters. Warn about common mistakes.
- TIMERS: timerSeconds > 0 ONLY when you physically wait (searing, boiling, simmering, baking, resting). Zero for active steps (chopping, seasoning, stirring batter, plating).
- NO-COOK RULE: If this meal requires no heat, DO NOT write ANY step involving a pan, stove, oven, or heat. Assemble-only steps only.
- BE SPECIFIC: "Grilled salmon with roasted potatoes & asparagus" gets salmon steps + asparagus steps + potato steps. "Pasta bolognese" gets the actual bolognese technique. Never be generic.`

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            history: [{ role: 'user', content: prompt }],
            userContext: {
              name: 'User', caloriesRemaining: 500, calorieGoal: 2000, protein: 0, proteinGoal: 150,
              carbs: 0, carbGoal: 200, fats: 0, fatGoal: 65, todayWorkout: '', streak: 0,
              rank: '', fitnessGoal: 'build_muscle', weight: 75, height: 175, age: 25,
            },
          }),
        })
        const data = await res.json()
        const text: string = data.text ?? ''
        const jsonMatch = text.replace(/```json|```/g, '').match(/\{[\s\S]*\}/)
        const parsed: RecipeData = JSON.parse(jsonMatch ? jsonMatch[0] : text.trim())
        setRecipe(parsed)
      } catch {
        const fb = buildFallbackRecipe(slot.name, {
          isNoCook, isSmoothieOrShake, isYogurtParfait, isOvernightOats,
          isColdSandwich, isColdSalad, isEggs, isPancakeWaffle, isOatmeal,
          isPasta, isStirFry, isChicken, isFish, isBeef, isSoup, isRiceDish,
          isGrilled, isBaked,
        })
        setRecipe(fb)
      }
      setLoading(false)
    }
    fetchRecipe()
  }, [slot.name])

  const handleLog = () => {
    onLog()
    setLogged(true)
    setTimeout(onClose, 1400)
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-background">
      <div className="flex items-center justify-between border-b border-border px-4 py-3 shrink-0">
        <div className="flex items-center gap-2">
          {mode === 'cook' ? (
            <button
              type="button"
              onClick={() => setMode('overview')}
              className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-secondary"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
              <ChefHat className="h-4 w-4 text-primary" />
            </div>
          )}
          <div>
            <h2 className="font-bold text-foreground leading-none">
              {mode === 'cook' ? 'Cooking Mode' : 'Recipe'}
            </h2>
            <p className="text-xs text-muted-foreground truncate max-w-[200px]">{slot.name}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-secondary"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {loading && (
        <div className="flex flex-1 flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Building your recipe…</p>
        </div>
      )}

      {!loading && recipe && mode === 'cook' && (
        <GuidedCookMode
          steps={recipe.steps}
          onDone={() => { handleLog(); setMode('overview') }}
        />
      )}

      {!loading && recipe && mode === 'overview' && (
        <>
          <div className="flex-1 overflow-y-auto">
            <div className="border-b border-border bg-gradient-to-br from-primary/10 via-card to-card p-5">
              <h1 className="text-xl font-black text-foreground">{slot.name}</h1>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-secondary px-2.5 py-1 font-semibold">{slot.calories} kcal</span>
                <span className="rounded-full bg-green-500/10 px-2.5 py-1 font-semibold text-green-500">{slot.protein}g protein</span>
                <span className="rounded-full bg-amber-500/10 px-2.5 py-1 font-semibold text-amber-500">{slot.carbs}g carbs</span>
                <span className="rounded-full bg-rose-500/10 px-2.5 py-1 font-semibold text-rose-500">{slot.fats}g fat</span>
              </div>
              <div className="mt-3 flex gap-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />Prep: {recipe.prepTime}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Timer className="h-3.5 w-3.5" />Cook: {recipe.cookTime}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <ChefHat className="h-3.5 w-3.5" />{recipe.steps.length} steps
                </div>
              </div>
            </div>

            <div className="space-y-6 p-5">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <ShoppingBag className="h-4 w-4 text-primary" />
                  <h3 className="font-bold text-foreground">Ingredients</h3>
                </div>
                <div className="space-y-2">
                  {recipe.ingredients.map((ing, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-xl bg-secondary/40 px-3 py-2.5">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
                        {i + 1}
                      </span>
                      <p className="text-sm text-foreground">{ing}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <ChefHat className="h-4 w-4 text-primary" />
                  <h3 className="font-bold text-foreground">Steps overview</h3>
                  <span className="ml-auto text-xs text-muted-foreground">{recipe.steps.length} steps</span>
                </div>
                <div className="space-y-2">
                  {recipe.steps.map((step, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-xl bg-secondary/40 px-3 py-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground mt-0.5">
                        {i + 1}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground">{step.instruction}</p>
                        {step.timerSeconds > 0 && (
                          <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-medium text-primary">
                            <Timer className="h-3 w-3" />
                            {step.timerSeconds >= 60
                              ? `${Math.floor(step.timerSeconds / 60)}:${(step.timerSeconds % 60).toString().padStart(2, '0')} min timer`
                              : `${step.timerSeconds}s timer`}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="shrink-0 space-y-2 border-t border-border p-4">
            <button
              type="button"
              onClick={() => setMode('cook')}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-base font-black text-primary-foreground shadow-lg shadow-primary/30 active:scale-[0.98]"
            >
              <Play className="h-5 w-5" />
              Start Cooking — Step by Step
            </button>
            <button
              type="button"
              onClick={handleLog}
              className={cn(
                'flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold transition-all',
                logged
                  ? 'bg-green-500/20 text-green-500'
                  : 'bg-secondary text-foreground active:scale-[0.98]'
              )}
            >
              <Copy className="h-4 w-4" />
              {logged ? '✓ Logged to diary' : 'Just log it to diary'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ─── WeeklyMealPlan ───────────────────────────────────────────────────────────

export function WeeklyMealPlan() {
  const { settings, bodyPRs, workoutSplit, addMealEntry, getTodayTotals } = useApp()
  const [expandedDay, setExpandedDay] = useState<string | null>(null)
  const [appliedToast, setAppliedToast] = useState<string | null>(null)
  const [recipeModal, setRecipeModal] = useState<{ slot: MealPlanSlot; meal: MealKey } | null>(null)

  const plan = useMemo(
    () => generateFitnessPlan(
      settings.weight, settings.height, settings.age, settings.gender,
      settings.fitnessGoal, bodyPRs, workoutSplit
    ),
    [settings, bodyPRs, workoutSplit]
  )

  const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' })
  const todayPlan = plan.weeklyMeals.find(d => d.day === todayName) ?? plan.weeklyMeals[0]
  const totals = getTodayTotals()

  const showToast = (msg: string) => {
    setAppliedToast(msg)
    setTimeout(() => setAppliedToast(null), 2800)
  }

  const applyDay = (day: DayMealPlan, onlyToday = false) => {
    const meals: MealKey[] = ['breakfast', 'lunch', 'dinner', 'snacks']
    meals.forEach(meal => addMealEntry(meal, slotToEntry(day[meal], meal)))
    showToast(onlyToday ? "Today's plan added to your diary" : `${day.day} plan added to diary`)
  }

  return (
    <div className="space-y-4">
      {appliedToast && (
        <div className="rounded-2xl border border-primary/40 bg-primary/10 px-4 py-3 text-sm font-medium text-primary">
          {appliedToast}
        </div>
      )}

      <div className="relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/15 via-card to-card p-5">
        <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-primary/20 blur-2xl" />
        <div className="relative flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <p className="text-xs font-bold uppercase tracking-wider text-primary">AI meal plan</p>
            </div>
            <h2 className="mt-1 text-lg font-bold text-foreground">Your weekly nutrition</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Built for {settings.fitnessGoal.replace('_', ' ')} · {plan.macros.calorieGoal} kcal ·{' '}
              {plan.macros.proteinGoal}g protein / day
            </p>
          </div>
          <div className="rounded-xl bg-card/80 px-3 py-2 text-center backdrop-blur">
            <p className="text-lg font-bold text-foreground">{totals.calories}</p>
            <p className="text-[10px] text-muted-foreground">logged today</p>
          </div>
        </div>
        <div className="relative mt-4 grid grid-cols-4 gap-2">
          {[
            { label: 'Cal', value: plan.macros.calorieGoal },
            { label: 'Protein', value: `${plan.macros.proteinGoal}g` },
            { label: 'Carbs', value: `${plan.macros.carbGoal}g` },
            { label: 'Fat', value: `${plan.macros.fatGoal}g` },
          ].map(m => (
            <div key={m.label} className="rounded-xl bg-background/50 py-2 text-center">
              <p className="text-sm font-bold text-foreground">{m.value}</p>
              <p className="text-[10px] text-muted-foreground">{m.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border-2 border-primary/40 bg-card p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs font-medium text-primary">Today · {todayName}</p>
            <p className="font-semibold text-foreground">{todayPlan.totals.calories} kcal planned</p>
          </div>
          <button type="button" onClick={() => applyDay(todayPlan, true)}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 active:scale-[0.98]">
            <Copy className="h-4 w-4" />Log today
          </button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {(['breakfast', 'lunch', 'dinner', 'snacks'] as MealKey[]).map(meal => (
            <button key={meal} type="button"
              onClick={() => setRecipeModal({ slot: todayPlan[meal], meal })}
              className="rounded-xl bg-secondary/50 p-2.5 text-left transition-colors hover:bg-secondary active:scale-[0.98]">
              <p className="text-xs font-semibold capitalize text-muted-foreground">{meal}</p>
              <p className="mt-0.5 line-clamp-2 text-xs font-medium text-foreground">{todayPlan[meal].name}</p>
              <div className="mt-1.5 flex items-center justify-between">
                <p className="text-xs font-bold text-primary">{todayPlan[meal].calories} kcal</p>
                <p className="text-[10px] text-muted-foreground">Tap for recipe →</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <h3 className="font-semibold text-foreground">Full week</h3>
      </div>

      <div className="space-y-2">
        {plan.weeklyMeals.map(day => {
          const isToday = day.day === todayName
          const isOpen = expandedDay === day.day
          return (
            <div key={day.day} className={cn(
              'overflow-hidden rounded-2xl border bg-card',
              isToday ? 'border-primary/50' : 'border-border'
            )}>
              <button type="button" className="flex w-full items-center justify-between p-4 text-left"
                onClick={() => setExpandedDay(isOpen ? null : day.day)}>
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold',
                    isToday ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'
                  )}>
                    {day.day.slice(0, 3)}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      {day.day}{isToday && <span className="ml-2 text-xs font-medium text-primary">Today</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">{day.totals.calories} kcal · {day.totals.protein}g protein</p>
                  </div>
                </div>
                {isOpen ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
              </button>
              {isOpen && (
                <div className="space-y-2 border-t border-border px-4 pb-4 pt-2">
                  {(['breakfast', 'lunch', 'dinner', 'snacks'] as MealKey[]).map(meal => (
                    <MealPlanRow key={meal} label={meal} slot={day[meal]}
                      onTapRecipe={() => setRecipeModal({ slot: day[meal], meal })} />
                  ))}
                  <button type="button" onClick={() => applyDay(day)}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-sm font-medium text-foreground hover:bg-secondary">
                    <Utensils className="h-4 w-4" />Add {day.day}&apos;s meals to diary
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {recipeModal && (
        <RecipeModal
          slot={recipeModal.slot}
          onClose={() => setRecipeModal(null)}
          onLog={() => {
            addMealEntry(recipeModal.meal, slotToEntry(recipeModal.slot, recipeModal.meal))
            showToast(`${recipeModal.slot.name} logged to diary`)
          }}
        />
      )}
    </div>
  )
}

function MealPlanRow({ label, slot, onTapRecipe }: {
  label: string; slot: MealPlanSlot; onTapRecipe: () => void
}) {
  return (
    <button type="button" onClick={onTapRecipe}
      className="w-full rounded-xl bg-secondary/40 px-3 py-2.5 text-left transition-colors hover:bg-secondary active:scale-[0.98]">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
          <p className="text-sm font-medium text-foreground">{slot.name}</p>
        </div>
        <div className="shrink-0 text-right text-xs">
          <p className="font-semibold text-foreground">{slot.calories} kcal</p>
          <p className="text-muted-foreground">{slot.protein}g P · {slot.carbs}g C · {slot.fats}g F</p>
        </div>
      </div>
      <p className="mt-1 text-[10px] text-primary">Tap for recipe & cook mode →</p>
    </button>
  )
}