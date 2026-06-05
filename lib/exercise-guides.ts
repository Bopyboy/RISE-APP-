// lib/exercise-guides.ts
// Drop this file into your lib/ folder

export interface ExerciseGuide {
    name: string
    category: string
    primaryMuscles: string[]
    secondaryMuscles: string[]
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
    equipment: string
    youtubeSearch: string // search query for YouTube
    formCues: string[]
    commonMistakes: string[]
    breathingTip: string
    proTip: string
  }
  
  export const EXERCISE_GUIDES: Record<string, ExerciseGuide> = {
    'Bench Press': {
      name: 'Bench Press',
      category: 'chest',
      primaryMuscles: ['Pectoralis Major'],
      secondaryMuscles: ['Anterior Deltoid', 'Triceps'],
      difficulty: 'Intermediate',
      equipment: 'Barbell, Bench',
      youtubeSearch: 'bench press form tutorial',
      formCues: [
        'Retract and depress your shoulder blades into the bench',
        'Grip slightly wider than shoulder-width, wrists straight',
        'Touch the bar to your lower chest (nipple line)',
        'Drive your feet into the floor for full-body tension',
        'Press in a slight arc — back toward the rack at lockout',
      ],
      commonMistakes: [
        'Flaring elbows out too wide (puts stress on shoulders)',
        'Bouncing the bar off your chest',
        'Losing upper back tightness mid-set',
        'Partial range of motion — not touching chest',
      ],
      breathingTip: 'Big breath before unracking. Hold (Valsalva) through the lift. Exhale at lockout.',
      proTip: 'Imagine trying to "bend the bar" outward with your hands — this engages lats and protects shoulders.',
    },
    'Squat': {
      name: 'Squat',
      category: 'legs',
      primaryMuscles: ['Quadriceps', 'Glutes'],
      secondaryMuscles: ['Hamstrings', 'Core', 'Spinal Erectors'],
      difficulty: 'Intermediate',
      equipment: 'Barbell, Squat Rack',
      youtubeSearch: 'barbell squat form tutorial',
      formCues: [
        'Bar sits on your traps (high bar) or rear delts (low bar)',
        'Stance shoulder-width or slightly wider, toes out 15–30°',
        'Brace core hard before descending — "big breath and hold"',
        'Push knees out in line with toes throughout',
        'Hit parallel or below — crease of hip below top of knee',
      ],
      commonMistakes: [
        'Knees caving inward (valgus collapse)',
        'Heels rising off the floor — ankle mobility issue',
        'Forward torso lean — usually means weak core or tight ankles',
        'Not hitting depth (just a quarter squat)',
      ],
      breathingTip: 'Take a big breath at the top, brace, squat down, stand up, then exhale. Re-brace every rep.',
      proTip: 'Think "chest up, elbows down" to keep a neutral spine. Screw your feet into the floor to create torque.',
    },
    'Deadlift': {
      name: 'Deadlift',
      category: 'back',
      primaryMuscles: ['Hamstrings', 'Glutes', 'Spinal Erectors'],
      secondaryMuscles: ['Lats', 'Traps', 'Core', 'Forearms'],
      difficulty: 'Advanced',
      equipment: 'Barbell',
      youtubeSearch: 'conventional deadlift form tutorial',
      formCues: [
        'Bar over mid-foot, about 1 inch from shins',
        'Hip-width stance, double overhand or mixed grip',
        'Hinge at hips to grab bar — shins nearly vertical',
        '"Lat spread" — think armpits over the bar, chest up',
        'Drive the floor away — don\'t think of it as a pull',
      ],
      commonMistakes: [
        'Rounding the lower back (most common — very dangerous)',
        'Bar drifting away from body during the lift',
        'Jerking the bar off the floor instead of smooth tension buildup',
        'Hyperextending at lockout — just stand tall',
      ],
      breathingTip: 'Deep breath, brace your core like you\'re about to get punched. Hold through the pull. Exhale at top.',
      proTip: 'Before pulling, take the slack out of the bar first. Push the bar into the floor before it breaks ground.',
    },
    'Overhead Press': {
      name: 'Overhead Press',
      category: 'shoulders',
      primaryMuscles: ['Anterior Deltoid', 'Lateral Deltoid'],
      secondaryMuscles: ['Triceps', 'Upper Traps', 'Core'],
      difficulty: 'Intermediate',
      equipment: 'Barbell',
      youtubeSearch: 'overhead press form tutorial',
      formCues: [
        'Grip just outside shoulders, bar resting on front delts',
        'Elbows slightly in front of bar (not directly under)',
        'Squeeze glutes and abs to prevent lumbar hyperextension',
        'Press straight up, head moves back to let bar pass',
        'At lockout, push head through and shrug slightly',
      ],
      commonMistakes: [
        'Excessive lower back arch — turns it into a standing incline press',
        'Bar path too far forward (should stay over mid-foot)',
        'Not locking out fully at the top',
        'Gripping too wide — reduces power and shoulder safety',
      ],
      breathingTip: 'Brace before the press, exhale near the top or after lockout.',
      proTip: '"Squeeze the bar like you\'re trying to break it" — this engages more upper body musculature.',
    },
    'Pull-ups': {
      name: 'Pull-ups',
      category: 'back',
      primaryMuscles: ['Latissimus Dorsi'],
      secondaryMuscles: ['Biceps', 'Rear Deltoid', 'Core'],
      difficulty: 'Intermediate',
      equipment: 'Pull-up Bar',
      youtubeSearch: 'pull up form tutorial',
      formCues: [
        'Grip slightly wider than shoulders, overhand (pronated)',
        'Start from a dead hang — full arm extension',
        'Depress and retract shoulder blades before pulling',
        'Drive elbows toward your hips, not just backward',
        'Chin clearly over the bar at the top',
      ],
      commonMistakes: [
        'Kipping or swinging to cheat reps',
        'Not reaching full dead hang at the bottom',
        'Using only arms — not engaging back muscles',
        'Short range of motion — barely moving',
      ],
      breathingTip: 'Exhale as you pull up, inhale as you lower down.',
      proTip: 'Think "elbows to back pockets" instead of "pull chin to bar" — this engages lats way more.',
    },
    'Barbell Curl': {
      name: 'Barbell Curl',
      category: 'arms',
      primaryMuscles: ['Biceps Brachii'],
      secondaryMuscles: ['Brachialis', 'Forearms'],
      difficulty: 'Beginner',
      equipment: 'Barbell',
      youtubeSearch: 'barbell curl form tutorial',
      formCues: [
        'Shoulder-width underhand grip, elbows pinned to sides',
        'Stand tall — don\'t lean back to swing the weight',
        'Curl until forearms are vertical, squeeze hard at top',
        'Lower slowly — 2-3 seconds down for max tension',
        'Full extension at the bottom, don\'t let elbows drift forward',
      ],
      commonMistakes: [
        'Swinging the body to use momentum',
        'Elbows drifting forward at the top (turns into a front raise)',
        'Short range of motion — not fully extending',
        'Going too heavy and losing form',
      ],
      breathingTip: 'Exhale as you curl up, inhale as you lower.',
      proTip: 'Supinate (rotate) your wrists slightly at the top for a stronger bicep contraction.',
    },
    'Lateral Raises': {
      name: 'Lateral Raises',
      category: 'shoulders',
      primaryMuscles: ['Lateral Deltoid'],
      secondaryMuscles: ['Anterior Deltoid', 'Traps'],
      difficulty: 'Beginner',
      equipment: 'Dumbbells',
      youtubeSearch: 'lateral raise form tutorial',
      formCues: [
        'Slight bend in elbows, dumbbells at your sides',
        'Lead with your elbows, not your hands',
        'Raise to shoulder height — no higher',
        'Tilt dumbbells slightly forward (pinky slightly higher than thumb)',
        'Control the descent — don\'t just drop them',
      ],
      commonMistakes: [
        'Using too much weight and swinging',
        'Shrugging traps at the top',
        'Raising above shoulder height (traps take over)',
        'Straight arms — removes elbow safety',
      ],
      breathingTip: 'Exhale as you raise, inhale as you lower.',
      proTip: 'Go lighter than you think. 10–15 kg is heavy for strict lateral raises. Slow and controlled beats heavy.',
    },
    'Tricep Pushdowns': {
      name: 'Tricep Pushdowns',
      category: 'arms',
      primaryMuscles: ['Triceps Brachii'],
      secondaryMuscles: [],
      difficulty: 'Beginner',
      equipment: 'Cable Machine',
      youtubeSearch: 'tricep pushdown form tutorial',
      formCues: [
        'Stand close to cable stack, slight forward lean',
        'Elbows pinned to sides — they don\'t move',
        'Push down until arms fully locked out',
        'Squeeze triceps hard at the bottom',
        'Control the return — don\'t let cable snap elbows up',
      ],
      commonMistakes: [
        'Elbows flaring out or swinging forward',
        'Leaning too far forward and turning it into a dip',
        'Not reaching full lockout at the bottom',
        'Going too heavy with sloppy form',
      ],
      breathingTip: 'Exhale on the push, inhale on the return.',
      proTip: 'Try the rope attachment for a stronger contraction — spread the rope slightly at the bottom.',
    },
    'Plank': {
      name: 'Plank',
      category: 'abs',
      primaryMuscles: ['Rectus Abdominis', 'Transverse Abdominis'],
      secondaryMuscles: ['Obliques', 'Glutes', 'Shoulders'],
      difficulty: 'Beginner',
      equipment: 'Bodyweight',
      youtubeSearch: 'plank form tutorial',
      formCues: [
        'Forearms on floor, elbows under shoulders',
        'Body in a straight line — don\'t let hips sag or pike up',
        'Squeeze glutes and quads — full body tension',
        'Tuck chin slightly — neutral neck',
        'Breathe normally — don\'t hold your breath',
      ],
      commonMistakes: [
        'Hips sagging down (most common)',
        'Hips too high — it\'s not a downward dog',
        'Holding breath the whole time',
        'Looking up — strains the neck',
      ],
      breathingTip: 'Breathe steadily and normally. Exhale every few seconds.',
      proTip: 'Imagine dragging your elbows toward your toes — this creates intense core activation without moving.',
    },
    'Romanian Deadlift': {
      name: 'Romanian Deadlift',
      category: 'legs',
      primaryMuscles: ['Hamstrings', 'Glutes'],
      secondaryMuscles: ['Spinal Erectors', 'Core'],
      difficulty: 'Intermediate',
      equipment: 'Barbell or Dumbbells',
      youtubeSearch: 'romanian deadlift form tutorial',
      formCues: [
        'Start standing, slight bend in knees (not a squat)',
        'Push hips back — the movement is a hip hinge, not a bend',
        'Bar stays close to your legs the entire way down',
        'Feel the hamstring stretch — go as low as form allows',
        'Drive hips forward to stand up, squeeze glutes at top',
      ],
      commonMistakes: [
        'Rounding the lower back at the bottom',
        'Bending the knees too much (turns it into a deadlift)',
        'Bar swinging away from legs',
        'Not going low enough — most people stop too early',
      ],
      breathingTip: 'Brace before hinging. Exhale as you return to standing.',
      proTip: 'Push the floor back with your heels as you stand up — this fires the hamstrings and glutes harder.',
    },
  }
  
  // Fallback for exercises not in the detailed guide
  export function getExerciseGuide(name: string): ExerciseGuide | null {
    return EXERCISE_GUIDES[name] ?? null
  }