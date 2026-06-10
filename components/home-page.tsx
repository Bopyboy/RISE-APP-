'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useApp } from '@/lib/app-context'
import { formatRankProgress } from '@/lib/types'
import {
  getRankByPerformance,
  getNextPerformanceRank,
  getPointsToNextRank,
  getRankProgressPercent,
  getPerformanceLabel,
} from '@/lib/performance-rank'
import {
  Flame,
  TrendingUp,
  Zap,
  Clock,
  Target,
  Check,
  Plus,
  Dumbbell,
  Camera,
  X,
  ShieldCheck,
  AlertCircle,
  MessageCircle,
  Settings,
  ChevronRight,
  Activity,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { RankBadge } from '@/components/rank-badge'

const PUSHUP_GOAL = 100

function getTodayKey() {
  return new Date().toISOString().split('T')[0]
}

// ─── Streak Calendar ──────────────────────────────────────────────────────────

function StreakCalendar() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayKey = today.toISOString().split('T')[0]
  const days: Date[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    days.push(d)
  }
  const getActivity = (date: Date): 'workout' | 'nutrition' | 'both' | 'none' => {
    const key = date.toISOString().split('T')[0]
    let workout = false, nutrition = false
    try {
      if (localStorage.getItem(`rise-workout-${key}`)) workout = true
      const pushup = localStorage.getItem('rise-pushup-challenge')
      if (pushup) { const p = JSON.parse(pushup); if (p.date === key && p.completed) workout = true }
      const nLog = localStorage.getItem(`rise-nutrition-${key}`)
      if (nLog) {
        const n = JSON.parse(nLog)
        const total = (n.breakfast?.length ?? 0) + (n.lunch?.length ?? 0) + (n.dinner?.length ?? 0) + (n.snacks?.length ?? 0)
        if (total > 0) nutrition = true
      }
    } catch {}
    if (workout && nutrition) return 'both'
    if (workout) return 'workout'
    if (nutrition) return 'nutrition'
    return 'none'
  }
  const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

  return (
    <div className="flex items-center justify-between gap-1 rounded-2xl border border-border bg-card px-5 py-4">
      {days.map((date) => {
        const key = date.toISOString().split('T')[0]
        const isToday = key === todayKey
        const activity = getActivity(date)
        const active = activity !== 'none'
        return (
          <div key={key} className="flex flex-col items-center gap-2">
            <span className={cn(
              'text-[10px] font-bold uppercase tracking-wide',
              isToday ? 'text-primary' : 'text-muted-foreground/50'
            )}>
              {dayNames[date.getDay()]}
            </span>
            <div className={cn(
              'flex h-8 w-8 items-center justify-center rounded-xl transition-all',
              isToday && active ? 'bg-primary shadow-[0_0_12px] shadow-primary/40' :
              isToday ? 'border-2 border-primary/40 bg-transparent' :
              active ? 'bg-primary/20' : 'bg-secondary/50'
            )}>
              {active && (
                <div className={cn(
                  'h-2 w-2 rounded-full',
                  activity === 'both' ? 'bg-primary' :
                  activity === 'workout' ? 'bg-orange-400' : 'bg-emerald-400',
                  isToday && active && 'bg-primary-foreground'
                )} />
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Pushup Challenge ─────────────────────────────────────────────────────────

function PushupChallengeCard() {
  const [completed, setCompleted] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const [count, setCount] = useState(0)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('rise-pushup-challenge')
      if (saved) {
        const data = JSON.parse(saved)
        if (data.date === getTodayKey()) { setCompleted(data.completed); setCount(data.count ?? 0) }
      }
    } catch {}
  }, [])

  const handleComplete = (finalCount: number) => {
    setCount(finalCount); setCompleted(true); setShowCamera(false)
    localStorage.setItem('rise-pushup-challenge', JSON.stringify({ date: getTodayKey(), completed: true, count: finalCount }))
  }

  const pct = Math.min((count / PUSHUP_GOAL) * 100, 100)

  return (
    <>
      <div className={cn(
        'card-hover relative overflow-hidden rounded-2xl border p-5',
        completed ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-orange-500/20 bg-card'
      )}>
        <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="relative">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Daily Challenge</p>
              <h3 className="mt-0.5 text-lg font-black tracking-tight text-foreground">100 Push-ups</h3>
              <p className="mt-1 text-xs text-muted-foreground leading-snug max-w-[200px]">
                AI camera counts every rep automatically
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-1 rounded-full bg-orange-500/15 px-2.5 py-1">
                <Zap className="h-3 w-3 text-orange-400" />
                <span className="text-xs font-bold text-orange-400">+200 XP</span>
              </div>
              <span className="text-3xl font-black tabular-nums tracking-tighter text-foreground">
                {count}<span className="text-sm font-medium text-muted-foreground">/{PUSHUP_GOAL}</span>
              </span>
            </div>
          </div>

          <div className="mt-4">
            <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className={cn('h-full rounded-full shadow-[0_0_8px]', completed ? 'bg-emerald-500 shadow-emerald-500/40' : 'bg-orange-500 shadow-orange-500/40')}
              />
            </div>
          </div>

          <div className="mt-4">
            {completed ? (
              <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500/10 py-3 border border-emerald-500/20">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <span className="text-sm font-bold text-emerald-500">Verified — {count} reps done</span>
              </div>
            ) : (
              <button type="button" onClick={() => setShowCamera(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition-all hover:opacity-90 active:scale-[0.98]">
                <Camera className="h-4 w-4" /> Start with AI Camera
              </button>
            )}
          </div>
        </div>
      </div>
      {showCamera && <PushupCameraModal onClose={() => setShowCamera(false)} onComplete={handleComplete} />}
    </>
  )
}

// ─── AI Camera Modal ──────────────────────────────────────────────────────────

function PushupCameraModal({ onClose, onComplete }: { onClose: () => void; onComplete: (count: number) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const poseRef = useRef<any>(null)
  const cameraRef = useRef<any>(null)
  const [status, setStatus] = useState<'loading' | 'counting' | 'error'>('loading')
  const [pushupCount, setPushupCount] = useState(0)
  const [phase, setPhase] = useState<'up' | 'down'>('up')
  const [feedback, setFeedback] = useState('Loading AI…')
  const [errorMsg, setErrorMsg] = useState('')
  const pushupCountRef = useRef(0)
  const phaseRef = useRef<'up' | 'down'>('up')

  const getAngle = (a: {x:number,y:number}, b: {x:number,y:number}, c: {x:number,y:number}) => {
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x)
    let angle = Math.abs(radians * 180 / Math.PI)
    if (angle > 180) angle = 360 - angle
    return angle
  }

  const onResults = useCallback((results: any) => {
    const canvas = canvasRef.current, video = videoRef.current
    if (!canvas || !video) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    canvas.width = video.videoWidth || 640; canvas.height = video.videoHeight || 480
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    if (!results.poseLandmarks) { setFeedback('No body detected — step back'); return }
    const lm = results.poseLandmarks
    ctx.strokeStyle = '#f97316'; ctx.lineWidth = 3
    const connections = [[11,13],[13,15],[12,14],[14,16],[11,12],[23,24],[11,23],[12,24],[23,25],[24,26]]
    connections.forEach(([a, b]) => {
      if (lm[a] && lm[b]) { ctx.beginPath(); ctx.moveTo(lm[a].x*canvas.width,lm[a].y*canvas.height); ctx.lineTo(lm[b].x*canvas.width,lm[b].y*canvas.height); ctx.stroke() }
    })
    ctx.fillStyle = '#ffffff'
    ;[11,12,13,14,15,16,23,24].forEach(i => {
      if (lm[i]) { ctx.beginPath(); ctx.arc(lm[i].x*canvas.width,lm[i].y*canvas.height,5,0,2*Math.PI); ctx.fill() }
    })
    const leftElbow = lm[11]&&lm[13]&&lm[15] ? getAngle(lm[11],lm[13],lm[15]) : 180
    const rightElbow = lm[12]&&lm[14]&&lm[16] ? getAngle(lm[12],lm[14],lm[16]) : 180
    const avgElbow = (leftElbow+rightElbow)/2
    if (avgElbow < 100) {
      if (phaseRef.current==='up') { phaseRef.current='down'; setPhase('down'); setFeedback('Good — now push UP!') }
    } else if (avgElbow > 155) {
      if (phaseRef.current==='down') {
        phaseRef.current='up'; setPhase('up'); pushupCountRef.current+=1; setPushupCount(pushupCountRef.current)
        if (pushupCountRef.current>=PUSHUP_GOAL) { setFeedback('100 reps! Incredible!'); setTimeout(()=>onComplete(pushupCountRef.current),1500) }
        else { setFeedback(`Rep ${pushupCountRef.current} — keep going!`) }
      } else { setFeedback('Lower your chest toward the ground') }
    }
    setStatus('counting')
  }, [onComplete])

  useEffect(() => {
    const loadAndStart = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: 640, height: 480 } })
        streamRef.current = stream
        if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play() }
        const loadScript = (src: string) => new Promise<void>((res, rej) => {
          if (document.querySelector(`script[src="${src}"]`)) { res(); return }
          const s = document.createElement('script'); s.src = src; s.crossOrigin = 'anonymous'
          s.onload = ()=>res(); s.onerror = ()=>rej(new Error(`Failed: ${src}`)); document.head.appendChild(s)
        })
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js')
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js')
        const Pose = (window as any).Pose, Camera = (window as any).Camera
        const pose = new Pose({ locateFile: (f: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${f}` })
        pose.setOptions({ modelComplexity: 1, smoothLandmarks: true, minDetectionConfidence: 0.6, minTrackingConfidence: 0.6 })
        pose.onResults(onResults); poseRef.current = pose
        const camera = new Camera(videoRef.current, { onFrame: async () => { if (poseRef.current&&videoRef.current) await poseRef.current.send({image:videoRef.current}) }, width: 640, height: 480 })
        camera.start(); cameraRef.current = camera
        setFeedback('Get in push-up position')
      } catch (err: any) {
        setStatus('error')
        setErrorMsg(err?.name==='NotAllowedError' ? 'Camera permission denied' : `Camera error: ${err?.message??'unknown'}`)
      }
    }
    loadAndStart()
    return () => { try { cameraRef.current?.stop() } catch {}; streamRef.current?.getTracks().forEach(t=>t.stop()) }
  }, [onResults])

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-orange-400">AI Rep Counter</p>
          <p className="text-sm font-semibold text-white">100 Push-up Challenge</p>
        </div>
        <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
          <X className="h-5 w-5 text-white" />
        </button>
      </div>
      <div className="relative flex-1 overflow-hidden">
        <video ref={videoRef} className="absolute inset-0 h-full w-full object-cover" playsInline muted />
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full object-cover" />
        {status==='loading' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
            <p className="text-sm font-medium text-white">Loading AI...</p>
          </div>
        )}
        {status==='error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/90 p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-400" />
            <p className="font-semibold text-white">{errorMsg}</p>
            <button type="button" onClick={onClose} className="rounded-xl bg-white/10 px-6 py-2.5 text-sm font-medium text-white">Close</button>
          </div>
        )}
      </div>
      <div className="bg-black/90 px-4 pb-10 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-5xl font-black tabular-nums tracking-tighter text-orange-400">{pushupCount}</p>
            <p className="text-sm text-white/40">of {PUSHUP_GOAL} reps</p>
          </div>
          <div className={cn('rounded-xl px-3 py-1.5 text-xs font-bold', phase==='down' ? 'bg-orange-500/20 text-orange-400' : 'bg-white/10 text-white/60')}>
            {phase==='down' ? 'Hold down' : 'Push up'}
          </div>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-orange-500 transition-all duration-300" style={{ width: `${Math.min((pushupCount/PUSHUP_GOAL)*100,100)}%` }} />
        </div>
        <p className="mt-3 text-center text-sm font-medium text-white/70">{feedback}</p>
      </div>
    </div>
  )
}

// ─── Daily Quest ──────────────────────────────────────────────────────────────

function DailyQuestCard() {
  const { questState, updateQuestProgress, completeQuest } = useApp()
  const [timeToReset, setTimeToReset] = useState('')
  const [inputValue, setInputValue] = useState('')

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date(), midnight = new Date(now)
      midnight.setHours(24,0,0,0)
      const diff = midnight.getTime()-now.getTime()
      const h = Math.floor(diff/(1000*60*60))
      const m = Math.floor((diff%(1000*60*60))/(1000*60))
      const s = Math.floor((diff%(1000*60))/1000)
      setTimeToReset(`${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`)
    }
    updateTimer()
    const interval = setInterval(updateTimer,1000)
    return ()=>clearInterval(interval)
  }, [])

  if (!questState) return null
  const { quest, progress, completed } = questState
  const progressPercent = Math.min((progress/quest.target)*100,100)

  const handleProgressUpdate = () => {
    const value = parseFloat(inputValue)
    if (!isNaN(value)&&value>=0) { updateQuestProgress(value); setInputValue('') }
  }

  return (
    <div className={cn('card-hover relative overflow-hidden rounded-2xl border bg-card p-5', completed ? 'border-emerald-500/30' : 'border-primary/20')}>
      <div className={cn('pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full blur-3xl', completed ? 'bg-emerald-500/10' : 'bg-primary/10')} />
      <div className="relative">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Daily Quest</p>
            <h3 className="mt-0.5 text-lg font-black tracking-tight text-foreground">{quest.title}</h3>
            <p className="mt-1 text-xs text-muted-foreground leading-snug">{quest.description}</p>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 shrink-0 ml-2">
            <Zap className="h-3 w-3 text-primary" />
            <span className="text-xs font-bold text-primary">+{quest.xpReward} XP</span>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-muted-foreground font-medium">Progress</span>
            <span className="font-bold text-foreground tabular-nums">{progress} / {quest.target} {quest.unit}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className={cn('h-full rounded-full shadow-[0_0_8px]', completed ? 'bg-emerald-500 shadow-emerald-500/40' : 'bg-primary shadow-primary/40')}
            />
          </div>
        </div>

        {!completed ? (
          <div className="mt-4 flex gap-2">
            <input type="number" value={inputValue} onChange={e=>setInputValue(e.target.value)}
              placeholder="Add progress..."
              className="flex-1 rounded-xl bg-secondary px-3 py-2.5 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50" />
            <button onClick={handleProgressUpdate} disabled={!inputValue}
              className="rounded-xl bg-secondary px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary/70 disabled:opacity-40">
              Add
            </button>
            <button onClick={completeQuest}
              className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 transition-opacity">
              <Check className="h-4 w-4" /> Done
            </button>
          </div>
        ) : (
          <div className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 py-3">
            <Check className="h-4 w-4 text-emerald-500" />
            <span className="text-sm font-bold text-emerald-500">Quest complete</span>
          </div>
        )}

        <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground/60">
          <Clock className="h-3 w-3" />
          <span className="tabular-nums">Resets in {timeToReset}</span>
        </div>
      </div>
    </div>
  )
}

// ─── Macro stat ───────────────────────────────────────────────────────────────

function MacroStat({ label, value, percent, color }: { label: string; value: string; percent: number; color: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className="text-xs font-bold text-foreground">{value}</p>
      </div>
      <div className="h-1 w-full rounded-full bg-secondary">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(percent, 100)}%` }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
          className={cn('h-full rounded-full', color)}
        />
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

interface HomePageProps {
  onTabChange?: (tab: string) => void
  onGoToFood?: (view?: 'diary' | 'plan') => void
  onOpenSettings?: () => void
  onOpenCoach?: () => void
}

export function HomePage({ onTabChange, onGoToFood, onOpenSettings, onOpenCoach }: HomePageProps) {
  const { settings, getPerformanceScore, streak, getTodayTotals, workoutSplit } = useApp()
  const totals = getTodayTotals()
  const performanceScore = getPerformanceScore()
  const currentRank = getRankByPerformance(performanceScore)
  const nextRank = getNextPerformanceRank(performanceScore)
  const pointsToNext = getPointsToNextRank(performanceScore)
  const rankProgress = getRankProgressPercent(performanceScore)
  const performanceLabel = getPerformanceLabel(performanceScore)

  const calPercent = Math.min((totals.calories / settings.calorieGoal) * 100, 100)
  const proteinPercent = Math.min((totals.protein / settings.proteinGoal) * 100, 100)
  const carbsPercent = Math.min((totals.carbs / settings.carbGoal) * 100, 100)
  const fatPercent = Math.min((totals.fats / settings.fatGoal) * 100, 100)
  const caloriesRemaining = Math.max(settings.calorieGoal - totals.calories, 0)

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' })
  const todayWorkout = workoutSplit.find(d => d.day === today)
  const initials = settings.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
      className="space-y-3 pb-24">

      {/* ── Header ── */}
      <section className="flex items-center justify-between pt-1">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{greeting}</p>
          <h1 className="text-[1.75rem] font-black tracking-tight text-foreground leading-none mt-0.5">
            {settings.name.split(' ')[0]}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-xl border border-orange-500/20 bg-orange-500/10 px-3 py-1.5">
            <Flame className="h-3.5 w-3.5 text-orange-400" />
            <span className="text-xs font-black text-orange-400 tabular-nums">{streak}d</span>
          </div>
          <button type="button" onClick={() => onOpenSettings?.()}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:text-foreground">
            <Settings className="h-4 w-4" />
          </button>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-sm font-black text-primary-foreground shadow-lg shadow-primary/20">
            {initials}
          </div>
        </div>
      </section>

      {/* ── Streak row ── */}
      <StreakCalendar />

      {/* ── Calorie hero card ── */}
      <section className="relative overflow-hidden rounded-2xl border border-border bg-card p-5">
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-8 bottom-0 h-24 w-24 rounded-full bg-primary/8 blur-2xl" />
        <div className="relative">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Calories remaining</p>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-5xl font-black tracking-tighter text-foreground tabular-nums">{caloriesRemaining}</span>
                <span className="text-sm font-semibold text-muted-foreground">kcal</span>
              </div>
            </div>
            <button type="button" onClick={() => (onGoToFood ? onGoToFood('diary') : onTabChange?.('food'))}
              className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground shadow-md shadow-primary/25 hover:opacity-90 transition-opacity active:scale-95">
              <Plus className="h-3.5 w-3.5" /> Log meal
            </button>
          </div>

          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-secondary">
            <motion.div initial={{ width: 0 }} animate={{ width: `${calPercent}%` }} transition={{ duration: 0.7, ease: 'easeOut' }}
              className="h-full rounded-full bg-primary shadow-[0_0_10px] shadow-primary/50" />
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <MacroStat label="Protein" value={`${Math.round(totals.protein)}g`} percent={proteinPercent} color="bg-emerald-500" />
            <MacroStat label="Carbs" value={`${Math.round(totals.carbs)}g`} percent={carbsPercent} color="bg-amber-500" />
            <MacroStat label="Fat" value={`${Math.round(totals.fats)}g`} percent={fatPercent} color="bg-rose-500" />
          </div>
        </div>
      </section>

      {/* ── Quick actions ── */}
      <section className="grid grid-cols-2 gap-3">
        <button type="button" onClick={() => onTabChange?.('train')}
          className="card-hover flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Dumbbell className="h-5 w-5 text-primary" />
          </div>
          <div className="text-left">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Today</p>
            <p className="text-sm font-black text-foreground">{todayWorkout?.name ?? 'Rest day'}</p>
          </div>
        </button>
        <button type="button" onClick={() => onTabChange?.('ranks')}
          className="card-hover flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Activity className="h-5 w-5 text-primary" />
          </div>
          <div className="text-left">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Score</p>
            <p className="text-sm font-black text-foreground tabular-nums">{performanceScore} pts</p>
          </div>
        </button>
      </section>

      {/* ── Rank card ── */}
      <div className={cn('card-hover relative overflow-hidden rounded-2xl border border-border bg-card p-5', currentRank.glowClass)}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Rise Rank</p>
            <div className="mt-1.5 flex items-center gap-2.5">
              <RankBadge symbol={currentRank.symbol} size={36} />
              <span className={cn('text-2xl font-black tracking-tight', currentRank.name === 'Elite' ? 'elite-text' : '')}
                style={{ color: currentRank.name !== 'Elite' ? currentRank.color : undefined }}>
                {currentRank.name}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-black tabular-nums tracking-tighter text-foreground">{performanceScore}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Strength score</p>
          </div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{performanceLabel}</p>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary">
          <motion.div initial={{ width: 0 }} animate={{ width: `${rankProgress}%` }} transition={{ duration: 0.7, ease: 'easeOut' }}
            className="h-full rounded-full bg-primary shadow-[0_0_8px] shadow-primary/40" />
        </div>
        {nextRank && (
          <div className="mt-3 flex items-center justify-between rounded-xl bg-secondary/60 px-3 py-2.5">
            <div className="flex items-center gap-2">
              <RankBadge symbol={nextRank.symbol} size={20} />
              <span className="text-sm font-bold" style={{ color: nextRank.color }}>{nextRank.name}</span>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              <span className="tabular-nums">+{pointsToNext} pts needed</span>
            </div>
          </div>
        )}
      </div>

      <PushupChallengeCard />
      <DailyQuestCard />

      {/* ── Floating Coach ── */}
      <motion.button
        type="button"
        onClick={() => onOpenCoach?.()}
        whileTap={{ scale: 0.93 }}
        className="fixed bottom-24 right-4 z-40 flex items-center gap-2 rounded-2xl bg-primary px-4 py-3 shadow-xl shadow-primary/30 transition-all hover:opacity-90"
      >
        <MessageCircle className="h-4 w-4 text-primary-foreground" />
        <span className="text-xs font-black text-primary-foreground">Coach</span>
      </motion.button>
    </motion.div>
  )
}
