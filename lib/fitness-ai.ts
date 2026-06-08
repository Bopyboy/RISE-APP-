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