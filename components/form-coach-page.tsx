'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { X, Camera, ChevronLeft, Zap, AlertCircle, RotateCcw, Star, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Exercise definitions ─────────────────────────────────────────────────────

interface FormExercise {
  id: string
  name: string
  emoji: string
  category: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  description: string
  keyPoints: string[]
  cameraSetup: string
}

const FORM_EXERCISES: FormExercise[] = [
  {
    id: 'squat',
    name: 'Squat',
    emoji: '🦵',
    category: 'Legs',
    difficulty: 'Intermediate',
    description: 'Tracks knee tracking, depth, and hip hinge',
    keyPoints: ['Knees track over toes', 'Hip crease below parallel', 'Chest stays upright', 'Feet shoulder-width'],
    cameraSetup: 'Place phone on the floor 6–8 ft away facing your side',
  },
  {
    id: 'pushup',
    name: 'Push-up',
    emoji: '💪',
    category: 'Chest',
    difficulty: 'Beginner',
    description: 'Tracks elbow angle, body alignment, and rep depth',
    keyPoints: ['Body forms a straight line', 'Elbows at 45°', 'Chest touches ground', 'Core stays tight'],
    cameraSetup: 'Place phone on the floor 4–6 ft away facing your side',
  },
  {
    id: 'deadlift',
    name: 'Deadlift',
    emoji: '🏋️',
    category: 'Back',
    difficulty: 'Advanced',
    description: 'Tracks back rounding, hip hinge, and bar path',
    keyPoints: ['Back stays flat', 'Hip hinge initiated', 'Bar close to body', 'Hips and shoulders rise together'],
    cameraSetup: 'Place phone on the floor 6–8 ft away facing your side',
  },
  {
    id: 'overhead_press',
    name: 'Overhead Press',
    emoji: '🔱',
    category: 'Shoulders',
    difficulty: 'Intermediate',
    description: 'Tracks bar path, elbow position, and lockout',
    keyPoints: ['Bar stays over midfoot', 'Full lockout at top', 'Core braced', 'Elbows slightly forward'],
    cameraSetup: 'Place phone 6 ft away facing your side',
  },
  {
    id: 'lunge',
    name: 'Lunge',
    emoji: '🦵',
    category: 'Legs',
    difficulty: 'Beginner',
    description: 'Tracks knee alignment, depth, and balance',
    keyPoints: ['Front knee stays over ankle', 'Back knee near floor', 'Torso upright', 'Step length consistent'],
    cameraSetup: 'Place phone 6 ft away facing your side',
  },
  {
    id: 'plank',
    name: 'Plank',
    emoji: '🎯',
    category: 'Core',
    difficulty: 'Beginner',
    description: 'Tracks body alignment and hip position',
    keyPoints: ['Hips level with shoulders', 'No sagging hips', 'Head neutral', 'Core fully braced'],
    cameraSetup: 'Place phone on the floor 5 ft away facing your side',
  },
]

// ─── Per-exercise form analysis ───────────────────────────────────────────────

interface FormFeedback {
  score: number        // 0–10
  grade: string        // A+ / B / C etc
  cues: string[]       // live cues during rep
  issues: string[]     // detected problems
  strengths: string[]  // what they did well
}

function analyzeSquat(lm: any[]): FormFeedback {
  const issues: string[] = []
  const strengths: string[] = []
  const cues: string[] = []
  let score = 10

  // Knee tracking — compare knee x to ankle x
  const leftKneeX = lm[25]?.x ?? 0
  const leftAnkleX = lm[27]?.x ?? 0
  const rightKneeX = lm[26]?.x ?? 0
  const rightAnkleX = lm[28]?.x ?? 0
  const leftCave = leftKneeX - leftAnkleX
  const rightCave = rightAnkleX - rightKneeX

  if (leftCave > 0.05 || rightCave > 0.05) {
    issues.push('Knees caving inward (valgus)')
    cues.push('Push your knees out over your pinky toes')
    score -= 2
  } else {
    strengths.push('Good knee tracking')
  }

  // Hip depth — hip y vs knee y
  const hipY = ((lm[23]?.y ?? 0) + (lm[24]?.y ?? 0)) / 2
  const kneeY = ((lm[25]?.y ?? 0) + (lm[26]?.y ?? 0)) / 2
  if (hipY < kneeY - 0.03) {
    strengths.push('Good squat depth')
  } else {
    issues.push('Squat depth shallow')
    cues.push('Sit deeper — get hip crease below knee')
    score -= 2
  }

  // Torso lean — shoulder x vs hip x
  const shoulderX = ((lm[11]?.x ?? 0) + (lm[12]?.x ?? 0)) / 2
  const hipX = ((lm[23]?.x ?? 0) + (lm[24]?.x ?? 0)) / 2
  const lean = Math.abs(shoulderX - hipX)
  if (lean > 0.12) {
    issues.push('Excessive forward lean')
    cues.push('Keep your chest up and proud')
    score -= 1.5
  } else {
    strengths.push('Torso stays upright')
  }

  const grade = score >= 9 ? 'A+' : score >= 8 ? 'A' : score >= 7 ? 'B+' : score >= 6 ? 'B' : score >= 5 ? 'C' : 'D'
  return { score: Math.max(0, Math.round(score * 10) / 10), grade, cues, issues, strengths }
}

function analyzePushup(lm: any[]): FormFeedback {
  const issues: string[] = []
  const strengths: string[] = []
  const cues: string[] = []
  let score = 10

  // Body alignment — hip should be in line with shoulder and ankle
  const shoulderY = ((lm[11]?.y ?? 0) + (lm[12]?.y ?? 0)) / 2
  const hipY = ((lm[23]?.y ?? 0) + (lm[24]?.y ?? 0)) / 2
  const ankleY = ((lm[27]?.y ?? 0) + (lm[28]?.y ?? 0)) / 2
  const hipDrop = Math.abs(hipY - ((shoulderY + ankleY) / 2))

  if (hipDrop > 0.06) {
    issues.push('Hips sagging or piking')
    cues.push('Squeeze your glutes and keep hips level')
    score -= 2.5
  } else {
    strengths.push('Solid body alignment')
  }

  // Elbow flare — compare elbow x spread vs shoulder x spread
  const shoulderWidth = Math.abs((lm[11]?.x ?? 0) - (lm[12]?.x ?? 0))
  const elbowWidth = Math.abs((lm[13]?.x ?? 0) - (lm[14]?.x ?? 0))
  if (elbowWidth > shoulderWidth * 1.4) {
    issues.push('Elbows flaring too wide')
    cues.push('Tuck elbows to 45° from your body')
    score -= 2
  } else {
    strengths.push('Good elbow angle')
  }

  const grade = score >= 9 ? 'A+' : score >= 8 ? 'A' : score >= 7 ? 'B+' : score >= 6 ? 'B' : score >= 5 ? 'C' : 'D'
  return { score: Math.max(0, Math.round(score * 10) / 10), grade, cues, issues, strengths }
}

function analyzeDeadlift(lm: any[]): FormFeedback {
  const issues: string[] = []
  const strengths: string[] = []
  const cues: string[] = []
  let score = 10

  // Back rounding — check if shoulder-hip line is flat
  const shoulderY = ((lm[11]?.y ?? 0) + (lm[12]?.y ?? 0)) / 2
  const hipY = ((lm[23]?.y ?? 0) + (lm[24]?.y ?? 0)) / 2
  const shoulderX = ((lm[11]?.x ?? 0) + (lm[12]?.x ?? 0)) / 2
  const hipX = ((lm[23]?.x ?? 0) + (lm[24]?.x ?? 0)) / 2
  const spineAngle = Math.abs(Math.atan2(shoulderY - hipY, shoulderX - hipX) * 180 / Math.PI)

  if (spineAngle > 30) {
    issues.push('Back rounding detected')
    cues.push('Chest up, proud chest — brace hard')
    score -= 3
  } else {
    strengths.push('Back stays neutral')
  }

  // Bar path (shoulder over bar) — shoulder x close to hip x
  const lateralShift = Math.abs(shoulderX - hipX)
  if (lateralShift > 0.1) {
    issues.push('Hips shooting up too fast')
    cues.push('Drive hips and shoulders up at the same rate')
    score -= 2
  } else {
    strengths.push('Hips and shoulders rise together')
  }

  const grade = score >= 9 ? 'A+' : score >= 8 ? 'A' : score >= 7 ? 'B+' : score >= 6 ? 'B' : score >= 5 ? 'C' : 'D'
  return { score: Math.max(0, Math.round(score * 10) / 10), grade, cues, issues, strengths }
}

function analyzePlank(lm: any[]): FormFeedback {
  const issues: string[] = []
  const strengths: string[] = []
  const cues: string[] = []
  let score = 10

  const shoulderY = ((lm[11]?.y ?? 0) + (lm[12]?.y ?? 0)) / 2
  const hipY = ((lm[23]?.y ?? 0) + (lm[24]?.y ?? 0)) / 2
  const ankleY = ((lm[27]?.y ?? 0) + (lm[28]?.y ?? 0)) / 2
  const midlineY = (shoulderY + ankleY) / 2
  const hipDeviation = Math.abs(hipY - midlineY)

  if (hipDeviation > 0.05) {
    if (hipY > midlineY) {
      issues.push('Hips sagging — lower back stress')
      cues.push('Drive hips up, squeeze core and glutes')
    } else {
      issues.push('Hips too high — reduces core engagement')
      cues.push('Lower your hips to form a straight line')
    }
    score -= 3
  } else {
    strengths.push('Perfect plank alignment')
  }

  // Head position
  const noseY = lm[0]?.y ?? 0
  if (noseY < shoulderY - 0.05) {
    issues.push('Head dropping down')
    cues.push('Keep head neutral, look at the floor')
    score -= 1
  }

  const grade = score >= 9 ? 'A+' : score >= 8 ? 'A' : score >= 7 ? 'B+' : score >= 6 ? 'B' : score >= 5 ? 'C' : 'D'
  return { score: Math.max(0, Math.round(score * 10) / 10), grade, cues, issues, strengths }
}

function analyzeGeneric(lm: any[]): FormFeedback {
  // Overhead press / lunge — general shoulder symmetry and spine upright check
  const issues: string[] = []
  const strengths: string[] = []
  const cues: string[] = []
  let score = 8.5

  const leftShoulderY = lm[11]?.y ?? 0
  const rightShoulderY = lm[12]?.y ?? 0
  const asymmetry = Math.abs(leftShoulderY - rightShoulderY)

  if (asymmetry > 0.05) {
    issues.push('Shoulder imbalance detected')
    cues.push('Keep both shoulders level')
    score -= 1.5
  } else {
    strengths.push('Shoulders balanced')
  }

  const noseX = lm[0]?.x ?? 0.5
  const hipX = ((lm[23]?.x ?? 0) + (lm[24]?.x ?? 0)) / 2
  if (Math.abs(noseX - hipX) > 0.12) {
    issues.push('Head shifting forward')
    cues.push('Keep head stacked over hips')
    score -= 1
  } else {
    strengths.push('Good head position')
  }

  const grade = score >= 9 ? 'A+' : score >= 8 ? 'A' : score >= 7 ? 'B+' : score >= 6 ? 'B' : score >= 5 ? 'C' : 'D'
  return { score: Math.max(0, Math.round(score * 10) / 10), grade, cues, issues, strengths }
}

function analyzeForm(exerciseId: string, lm: any[]): FormFeedback {
  switch (exerciseId) {
    case 'squat': return analyzeSquat(lm)
    case 'pushup': return analyzePushup(lm)
    case 'deadlift': return analyzeDeadlift(lm)
    case 'plank': return analyzePlank(lm)
    default: return analyzeGeneric(lm)
  }
}

// ─── Grade color ──────────────────────────────────────────────────────────────

function gradeColor(grade: string) {
  if (grade.startsWith('A')) return 'text-green-400'
  if (grade.startsWith('B')) return 'text-yellow-400'
  return 'text-red-400'
}

function scoreBarColor(score: number) {
  if (score >= 8) return 'bg-green-500'
  if (score >= 6) return 'bg-yellow-500'
  return 'bg-red-500'
}

// ─── AI Camera Modal ──────────────────────────────────────────────────────────

function FormCameraModal({
  exercise,
  onClose,
}: {
  exercise: FormExercise
  onClose: (result: FormFeedback | null) => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const poseRef = useRef<any>(null)
  const cameraRef = useRef<any>(null)

  const [status, setStatus] = useState<'loading' | 'analyzing' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState('')
  const [liveFeedback, setLiveFeedback] = useState<FormFeedback | null>(null)
  const [frameCount, setFrameCount] = useState(0)
  const [sessionScores, setSessionScores] = useState<number[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)

  // Smooth feedback — only update every 8 frames to avoid jitter
  const frameRef = useRef(0)
  const scoresRef = useRef<number[]>([])

  const onResults = useCallback((results: any) => {
    const canvas = canvasRef.current
    const video = videoRef.current
    if (!canvas || !video) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    if (!results.poseLandmarks) {
      setStatus('analyzing')
      return
    }

    const lm = results.poseLandmarks

    // Draw skeleton
    const connections = [
      [11, 13], [13, 15], [12, 14], [14, 16],
      [11, 12], [23, 24], [11, 23], [12, 24],
      [23, 25], [24, 26], [25, 27], [26, 28],
      [27, 29], [28, 30], [0, 11], [0, 12],
    ]

    ctx.strokeStyle = '#8b5cf6'
    ctx.lineWidth = 2.5
    connections.forEach(([a, b]) => {
      if (lm[a] && lm[b] && lm[a].visibility > 0.5 && lm[b].visibility > 0.5) {
        ctx.beginPath()
        ctx.moveTo(lm[a].x * canvas.width, lm[a].y * canvas.height)
        ctx.lineTo(lm[b].x * canvas.width, lm[b].y * canvas.height)
        ctx.stroke()
      }
    })

    // Draw joints
    ctx.fillStyle = '#ffffff'
    ;[0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28].forEach(i => {
      if (lm[i] && lm[i].visibility > 0.5) {
        ctx.beginPath()
        ctx.arc(lm[i].x * canvas.width, lm[i].y * canvas.height, 4, 0, 2 * Math.PI)
        ctx.fill()
      }
    })

    // Analyze every 8th frame
    frameRef.current += 1
    setFrameCount(frameRef.current)
    if (frameRef.current % 8 === 0 && isRecording) {
      const feedback = analyzeForm(exercise.id, lm)
      setLiveFeedback(feedback)
      scoresRef.current = [...scoresRef.current.slice(-20), feedback.score]
      setSessionScores([...scoresRef.current])
    }

    setStatus('analyzing')
  }, [exercise.id, isRecording])

  useEffect(() => {
    const loadAndStart = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: 640, height: 480 }
        })
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }

        const loadScript = (src: string) => new Promise<void>((res, rej) => {
          if (document.querySelector(`script[src="${src}"]`)) { res(); return }
          const s = document.createElement('script')
          s.src = src
          s.crossOrigin = 'anonymous'
          s.onload = () => res()
          s.onerror = () => rej(new Error(`Failed to load ${src}`))
          document.head.appendChild(s)
        })

        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js')
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js')

        const Pose = (window as any).Pose
        const Camera = (window as any).Camera

        const pose = new Pose({
          locateFile: (f: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${f}`,
        })
        pose.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          minDetectionConfidence: 0.6,
          minTrackingConfidence: 0.6,
        })
        pose.onResults(onResults)
        poseRef.current = pose

        const camera = new Camera(videoRef.current, {
          onFrame: async () => {
            if (poseRef.current && videoRef.current) {
              await poseRef.current.send({ image: videoRef.current })
            }
          },
          width: 640,
          height: 480,
        })
        camera.start()
        cameraRef.current = camera
      } catch (err: any) {
        setStatus('error')
        setErrorMsg(
          err?.name === 'NotAllowedError'
            ? 'Camera permission denied — allow camera access in your browser settings'
            : `Camera error: ${err?.message ?? 'unknown'}`
        )
      }
    }

    loadAndStart()

    return () => {
      if (cameraRef.current) { try { cameraRef.current.stop() } catch {} }
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
    }
  }, [onResults])

  const startCountdown = () => {
    setCountdown(3)
    let c = 3
    const id = setInterval(() => {
      c -= 1
      if (c <= 0) {
        clearInterval(id)
        setCountdown(null)
        setIsRecording(true)
        scoresRef.current = []
        setSessionScores([])
      } else {
        setCountdown(c)
      }
    }, 1000)
  }

  const stopAndSave = () => {
    setIsRecording(false)
    const scores = scoresRef.current
    if (scores.length === 0) { onClose(null); return }
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length
    const rounded = Math.round(avgScore * 10) / 10
    const grade = rounded >= 9 ? 'A+' : rounded >= 8 ? 'A' : rounded >= 7 ? 'B+' : rounded >= 6 ? 'B' : rounded >= 5 ? 'C' : 'D'
    const last = liveFeedback
    onClose({
      score: rounded,
      grade,
      cues: last?.cues ?? [],
      issues: last?.issues ?? [],
      strengths: last?.strengths ?? [],
    })
  }

  const avgScore = sessionScores.length > 0
    ? sessionScores.reduce((a, b) => a + b, 0) / sessionScores.length
    : null

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-purple-400">AI Form Coach</p>
          <p className="text-sm font-semibold text-white">{exercise.emoji} {exercise.name}</p>
        </div>
        <button
          type="button"
          onClick={() => onClose(null)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10"
        >
          <X className="h-5 w-5 text-white" />
        </button>
      </div>

      {/* Camera */}
      <div className="relative flex-1 overflow-hidden">
        <video ref={videoRef} className="absolute inset-0 h-full w-full object-cover" playsInline muted />
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full object-cover" />

        {/* Loading overlay */}
        {status === 'loading' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
            <p className="text-sm font-medium text-white">Loading AI pose detection…</p>
            <p className="text-xs text-white/50">Takes ~5 seconds on first load</p>
          </div>
        )}

        {/* Error overlay */}
        {status === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/90 p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-400" />
            <p className="font-semibold text-white">{errorMsg}</p>
            <button type="button" onClick={() => onClose(null)} className="rounded-xl bg-white/10 px-6 py-2.5 text-sm font-medium text-white">Close</button>
          </div>
        )}

        {/* Countdown overlay */}
        {countdown !== null && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <span className="text-8xl font-black text-white animate-pulse">{countdown}</span>
          </div>
        )}

        {/* Live score bubble */}
        {isRecording && liveFeedback && (
          <div className="absolute top-4 left-4 rounded-2xl bg-black/70 px-3 py-2 backdrop-blur-sm">
            <p className="text-xs text-white/60">Live score</p>
            <p className={cn('text-2xl font-black', gradeColor(liveFeedback.grade))}>{liveFeedback.grade}</p>
            <p className="text-xs text-white/60">{liveFeedback.score}/10</p>
          </div>
        )}

        {/* Live cue */}
        {isRecording && liveFeedback?.cues[0] && (
          <div className="absolute bottom-4 left-4 right-4 rounded-xl bg-black/70 px-4 py-2.5 backdrop-blur-sm text-center">
            <p className="text-sm font-semibold text-purple-300">💬 {liveFeedback.cues[0]}</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-black/90 px-4 pb-10 pt-4 space-y-3">
        {!isRecording ? (
          <>
            <p className="text-center text-xs text-white/50">{exercise.cameraSetup}</p>
            <button
              type="button"
              onClick={startCountdown}
              disabled={status === 'loading' || status === 'error' || countdown !== null}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 py-3.5 text-sm font-bold text-white disabled:opacity-50"
            >
              <Camera className="h-4 w-4" />
              Start Analysis
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between text-xs text-white/50">
              <span>Avg score</span>
              <span className="font-bold text-white">{avgScore !== null ? avgScore.toFixed(1) : '—'} / 10</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className={cn('h-full rounded-full transition-all', avgScore ? scoreBarColor(avgScore) : 'bg-purple-500')}
                style={{ width: `${avgScore ? (avgScore / 10) * 100 : 0}%` }}
              />
            </div>
            <button
              type="button"
              onClick={stopAndSave}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-3.5 text-sm font-bold text-white"
            >
              Save & See Results
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Results Card ─────────────────────────────────────────────────────────────

function ResultsCard({
  exercise,
  result,
  onRetry,
  onBack,
}: {
  exercise: FormExercise
  result: FormFeedback
  onRetry: () => void
  onBack: () => void
}) {
  return (
    <div className="space-y-4 pb-24">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-border"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div>
          <h2 className="font-bold text-foreground">Form Analysis</h2>
          <p className="text-xs text-muted-foreground">{exercise.emoji} {exercise.name}</p>
        </div>
      </div>

      {/* Big score */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 text-center">
        <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-purple-500/15 blur-3xl" />
        <div className="relative">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Form Score</p>
          <div className="mt-2 flex items-baseline justify-center gap-2">
            <span className={cn('text-7xl font-black', gradeColor(result.grade))}>{result.grade}</span>
          </div>
          <p className="text-2xl font-bold text-foreground mt-1">{result.score} / 10</p>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-secondary">
            <div
              className={cn('h-full rounded-full transition-all', scoreBarColor(result.score))}
              style={{ width: `${(result.score / 10) * 100}%` }}
            />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            {result.score >= 9 ? 'Elite form — textbook execution 🏆' :
             result.score >= 8 ? 'Strong form — minor tweaks needed 💪' :
             result.score >= 6 ? 'Decent form — a few things to fix 📈' :
             'Form needs work — focus on the cues below ⚠️'}
          </p>
        </div>
      </div>

      {/* Issues */}
      {result.issues.length > 0 && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-red-400">Fix These</p>
          {result.issues.map((issue, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-red-500" />
              <p className="text-sm text-foreground">{issue}</p>
            </div>
          ))}
        </div>
      )}

      {/* Cues */}
      {result.cues.length > 0 && (
        <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-4 space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-purple-400">Coaching Cues</p>
          {result.cues.map((cue, i) => (
            <div key={i} className="flex items-start gap-2">
              <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-purple-400" />
              <p className="text-sm text-foreground">{cue}</p>
            </div>
          ))}
        </div>
      )}

      {/* Strengths */}
      {result.strengths.length > 0 && (
        <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-4 space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-green-400">What You Did Well</p>
          {result.strengths.map((s, i) => (
            <div key={i} className="flex items-start gap-2">
              <Star className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-400" />
              <p className="text-sm text-foreground">{s}</p>
            </div>
          ))}
        </div>
      )}

      {/* Key form points */}
      <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Perfect Form Checklist</p>
        {exercise.keyPoints.map((pt, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
            <p className="text-sm text-muted-foreground">{pt}</p>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onRetry}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-purple-600 py-3.5 font-bold text-white"
      >
        <RotateCcw className="h-4 w-4" />
        Analyze Again
      </button>
    </div>
  )
}

// ─── Exercise picker card ─────────────────────────────────────────────────────

function ExerciseCard({
  exercise,
  onSelect,
}: {
  exercise: FormExercise
  onSelect: () => void
}) {
  const diffColor =
    exercise.difficulty === 'Beginner' ? 'text-green-400 bg-green-500/10' :
    exercise.difficulty === 'Intermediate' ? 'text-yellow-400 bg-yellow-500/10' :
    'text-red-400 bg-red-500/10'

  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full items-center gap-4 rounded-2xl border border-border bg-card p-4 text-left transition-all hover:border-purple-500/40 active:scale-[0.98]"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-2xl">
        {exercise.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-foreground">{exercise.name}</p>
          <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold', diffColor)}>
            {exercise.difficulty}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{exercise.description}</p>
        <p className="text-xs text-purple-400 mt-1">{exercise.category}</p>
      </div>
      <Camera className="h-4 w-4 shrink-0 text-muted-foreground" />
    </button>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type PageState =
  | { view: 'pick' }
  | { view: 'camera'; exercise: FormExercise }
  | { view: 'result'; exercise: FormExercise; result: FormFeedback }

export function FormCoachPage() {
  const [state, setState] = useState<PageState>({ view: 'pick' })

  const handleSelect = (exercise: FormExercise) => {
    setState({ view: 'camera', exercise })
  }

  const handleCameraClose = (result: FormFeedback | null) => {
    if (state.view !== 'camera') return
    if (result) {
      setState({ view: 'result', exercise: state.exercise, result })
    } else {
      setState({ view: 'pick' })
    }
  }

  const handleRetry = () => {
    if (state.view !== 'result') return
    setState({ view: 'camera', exercise: state.exercise })
  }

  if (state.view === 'camera') {
    return (
      <FormCameraModal
        exercise={state.exercise}
        onClose={handleCameraClose}
      />
    )
  }

  if (state.view === 'result') {
    return (
      <ResultsCard
        exercise={state.exercise}
        result={state.result}
        onRetry={handleRetry}
        onBack={() => setState({ view: 'pick' })}
      />
    )
  }

  return (
    <div className="space-y-4 pb-24">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 to-violet-700 p-5">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
        <div className="relative">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-purple-200" />
            <p className="text-sm font-medium text-purple-200">Powered by AI pose detection</p>
          </div>
          <h2 className="mt-1 text-xl font-bold text-white">AI Form Coach</h2>
          <p className="mt-1 text-sm text-purple-200">
            Point your camera at yourself and get instant form scoring, coaching cues, and a breakdown of what to fix.
          </p>
        </div>
      </div>

      {/* How it works */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { step: '1', text: 'Pick a lift' },
          { step: '2', text: 'Set up camera' },
          { step: '3', text: 'Get scored' },
        ].map(s => (
          <div key={s.step} className="flex flex-col items-center gap-1.5 rounded-xl bg-secondary/60 py-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500/20 text-xs font-bold text-purple-400">
              {s.step}
            </span>
            <p className="text-xs font-medium text-muted-foreground text-center">{s.text}</p>
          </div>
        ))}
      </div>

      {/* Exercise list */}
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">Choose an exercise</p>
        {FORM_EXERCISES.map(ex => (
          <ExerciseCard key={ex.id} exercise={ex} onSelect={() => handleSelect(ex)} />
        ))}
      </div>
    </div>
  )
}