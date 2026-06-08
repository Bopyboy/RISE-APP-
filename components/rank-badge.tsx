export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface UserContext {
  name: string
  caloriesRemaining: number
  calorieGoal: number
  protein: number
  proteinGoal: number
  carbs: number
  carbGoal: number
  fats: number
  fatGoal: number
  todayWorkout: string
  streak: number
  rank: string
  fitnessGoal: string
  activityLevel?: string
  experienceLevel?: string
  weight: number
  height: number
  age: number
  chestPR?: number
  armsPR?: number
  legsPR?: number
}

interface StreamRequest {
  history: { role: 'user' | 'assistant'; content: string }[]
  userContext: UserContext
}

export async function streamAIResponse(
  req: StreamRequest,
  onChunk: (text: string) => void,
  signal?: AbortSignal
): Promise<void> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ history: req.history, userContext: req.userContext }),
    signal,
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err?.error || `API error ${response.status}`)
  }

  const data = await response.json()
  if (data.text) onChunk(data.text)
}

export function getAIResponse(_text: string): string {
  return "Please use the real AI chat."
}

interface RankBadgeProps {
  symbol: string
  size?: number
}

function IronIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <circle cx="18" cy="18" r="17" fill="#1f2937" stroke="#9ca3af" strokeWidth="1.5" />
      {/* Dumbbell */}
      <rect x="7" y="16" width="22" height="4" rx="2" fill="#9ca3af" />
      <rect x="5" y="13" width="5" height="10" rx="2" fill="#6b7280" />
      <rect x="26" y="13" width="5" height="10" rx="2" fill="#6b7280" />
    </svg>
  )
}

function BronzeIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <circle cx="18" cy="18" r="17" fill="#1c1007" stroke="#cd7f32" strokeWidth="1.5" />
      {/* Shield */}
      <path d="M18 7 L27 11 L27 20 Q27 27 18 30 Q9 27 9 20 L9 11 Z" fill="#92400e" stroke="#cd7f32" strokeWidth="1.2" />
      <path d="M18 11 L23 14 L23 20 Q23 24 18 26 Q13 24 13 20 L13 14 Z" fill="#b45309" />
    </svg>
  )
}

function SilverIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <circle cx="18" cy="18" r="17" fill="#111827" stroke="#c0c0c0" strokeWidth="1.5" />
      {/* Star */}
      <polygon
        points="18,8 20.9,15.5 29,15.5 22.5,20.5 24.9,28 18,23.5 11.1,28 13.5,20.5 7,15.5 15.1,15.5"
        fill="#9ca3af" stroke="#e5e7eb" strokeWidth="0.8"
      />
    </svg>
  )
}

function GoldIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <circle cx="18" cy="18" r="17" fill="#1c1400" stroke="#fbbf24" strokeWidth="1.5" />
      {/* Gold bar */}
      <rect x="8" y="14" width="20" height="9" rx="2" fill="#d97706" stroke="#fbbf24" strokeWidth="1" />
      <rect x="10" y="16" width="16" height="5" rx="1" fill="#fbbf24" opacity="0.4" />
      <line x1="13" y1="14" x2="13" y2="23" stroke="#fbbf24" strokeWidth="0.8" opacity="0.5" />
      <line x1="18" y1="14" x2="18" y2="23" stroke="#fbbf24" strokeWidth="0.8" opacity="0.5" />
      <line x1="23" y1="14" x2="23" y2="23" stroke="#fbbf24" strokeWidth="0.8" opacity="0.5" />
    </svg>
  )
}

function PlatinumIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <circle cx="18" cy="18" r="17" fill="#082030" stroke="#67e8f9" strokeWidth="1.5" />
      {/* Crown */}
      <path d="M8 24 L8 14 L13 19 L18 11 L23 19 L28 14 L28 24 Z" fill="#0e7490" stroke="#67e8f9" strokeWidth="1" />
      <rect x="8" y="24" width="20" height="3" rx="1" fill="#0e7490" stroke="#67e8f9" strokeWidth="0.8" />
      <circle cx="13" cy="19" r="1.5" fill="#67e8f9" />
      <circle cx="18" cy="11" r="1.5" fill="#67e8f9" />
      <circle cx="23" cy="19" r="1.5" fill="#67e8f9" />
    </svg>
  )
}

function DiamondIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <circle cx="18" cy="18" r="17" fill="#0c1a2e" stroke="#38bdf8" strokeWidth="1.5" />
      {/* Diamond gem */}
      <polygon points="18,8 28,16 18,29 8,16" fill="#0369a1" stroke="#38bdf8" strokeWidth="1" />
      <polygon points="18,8 28,16 18,16" fill="#38bdf8" opacity="0.6" />
      <polygon points="8,16 18,16 18,29" fill="#0284c7" opacity="0.8" />
      <polygon points="28,16 18,16 18,29" fill="#0ea5e9" opacity="0.5" />
    </svg>
  )
}

function MasterIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <circle cx="18" cy="18" r="17" fill="#1a0a0a" stroke="#f87171" strokeWidth="1.5" />
      {/* Flame */}
      <path d="M18 29 C12 29 9 25 9 21 C9 17 12 15 14 12 C14 15 16 16 16 16 C16 13 17 10 20 8 C20 12 22 13 23 16 C24 14 24 12 23 10 C26 13 27 17 27 21 C27 25 24 29 18 29 Z"
        fill="#b91c1c" stroke="#f87171" strokeWidth="0.8" />
      <path d="M18 27 C15 27 13 25 13 22 C13 20 15 18 16 17 C16 19 17.5 20 17.5 20 C17.5 18 18 16 20 15 C20 17 21 18 22 20 C22 18 21.5 17 21 16 C23 18 23 21 23 22 C23 25 21 27 18 27 Z"
        fill="#f87171" opacity="0.7" />
    </svg>
  )
}

function GrandmasterIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <circle cx="18" cy="18" r="17" fill="#120a1f" stroke="#c084fc" strokeWidth="1.5" />
      {/* Orb with ring */}
      <circle cx="18" cy="18" r="8" fill="#7e22ce" stroke="#c084fc" strokeWidth="1" />
      <ellipse cx="18" cy="18" rx="13" ry="5" fill="none" stroke="#c084fc" strokeWidth="1.2" opacity="0.7" transform="rotate(-20 18 18)" />
      <circle cx="18" cy="18" r="4" fill="#c084fc" opacity="0.5" />
      <circle cx="15" cy="15" r="1.5" fill="white" opacity="0.4" />
    </svg>
  )
}

function EliteIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <defs>
        <radialGradient id="eliteGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="100%" stopColor="#d97706" />
        </radialGradient>
      </defs>
      <circle cx="18" cy="18" r="17" fill="#1a1000" stroke="#fbbf24" strokeWidth="2" />
      {/* Wings + crown combo */}
      {/* Left wing */}
      <path d="M18 20 C14 18 9 20 7 16 C10 16 12 14 14 17 C12 13 11 10 13 9 C14 13 15 15 17 17 Z"
        fill="#d97706" opacity="0.9" />
      {/* Right wing */}
      <path d="M18 20 C22 18 27 20 29 16 C26 16 24 14 22 17 C24 13 25 10 23 9 C22 13 21 15 19 17 Z"
        fill="#d97706" opacity="0.9" />
      {/* Crown */}
      <path d="M11 24 L11 17 L14.5 20.5 L18 14 L21.5 20.5 L25 17 L25 24 Z" fill="url(#eliteGlow)" stroke="#fbbf24" strokeWidth="0.8" />
      <rect x="11" y="24" width="14" height="2.5" rx="1" fill="#fbbf24" />
      <circle cx="14.5" cy="20.5" r="1" fill="white" />
      <circle cx="18" cy="14" r="1" fill="white" />
      <circle cx="21.5" cy="20.5" r="1" fill="white" />
    </svg>
  )
}

const RANK_ICONS: Record<string, (size: number) => JSX.Element> = {
  iron: (size) => <IronIcon size={size} />,
  bronze: (size) => <BronzeIcon size={size} />,
  silver: (size) => <SilverIcon size={size} />,
  gold: (size) => <GoldIcon size={size} />,
  platinum: (size) => <PlatinumIcon size={size} />,
  diamond: (size) => <DiamondIcon size={size} />,
  master: (size) => <MasterIcon size={size} />,
  grandmaster: (size) => <GrandmasterIcon size={size} />,
  elite: (size) => <EliteIcon size={size} />,
}

export function RankBadge({ symbol, size = 36 }: RankBadgeProps) {
  const icon = RANK_ICONS[symbol]
  if (icon) return icon(size)

  // Fallback
  return (
    <span
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      className="inline-flex items-center justify-center rounded-full bg-secondary text-foreground font-bold"
    >
      {symbol[0]?.toUpperCase()}
    </span>
  )
}