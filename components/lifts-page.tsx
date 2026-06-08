'use client'

import { useState } from 'react'
import { useApp } from '@/lib/app-context'
import { RankBadge } from '@/components/rank-badge'
import { RANKS } from '@/lib/types'
import { ChevronRight, Play, X, Trophy, Target, Info, CheckCircle2, ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Comprehensive exercise database ─────────────────────────────────────────

const EXERCISE_CATEGORIES = [
  { id: 'chest', label: 'Chest', emoji: '💪' },
  { id: 'back', label: 'Back', emoji: '🏋️' },
  { id: 'shoulders', label: 'Shoulders', emoji: '🔱' },
  { id: 'arms', label: 'Arms', emoji: '💪' },
  { id: 'legs', label: 'Legs', emoji: '🦵' },
  { id: 'core', label: 'Core', emoji: '🎯' },
  { id: 'cardio', label: 'Cardio', emoji: '🏃' },
  { id: 'olympic', label: 'Olympic', emoji: '🥇' },
  { id: 'calisthenics', label: 'Calisthenics', emoji: '🤸' },
]

interface ExerciseEntry {
  id: string
  name: string
  category: string
  muscle: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  equipment: string
  unit: 'lbs' | 'reps' | 'sec' | 'miles'
  youtubeId: string
  cues: string[]
  description: string
}

const ALL_EXERCISES: ExerciseEntry[] = [
  // CHEST
  { id: 'bench', name: 'Bench Press', category: 'chest', muscle: 'Pectorals', difficulty: 'Intermediate', equipment: 'Barbell', unit: 'lbs', youtubeId: 'vcBig73ojpE', cues: ['Retract scapula', 'Arch back slightly', 'Bar to lower chest', 'Drive feet into floor'], description: 'The king of chest exercises. Build mass and strength across the entire pec.' },
  { id: 'incline_bench', name: 'Incline Bench Press', category: 'chest', muscle: 'Upper Chest', difficulty: 'Intermediate', equipment: 'Barbell', unit: 'lbs', youtubeId: 'jPLdzuHckI8', cues: ['Set bench 30–45°', 'Bar to upper chest', 'Elbows at 45°', 'Control descent'], description: 'Targets the clavicular head for a full, rounded chest development.' },
  { id: 'dbfly', name: 'Dumbbell Fly', category: 'chest', muscle: 'Pectorals', difficulty: 'Beginner', equipment: 'Dumbbell', unit: 'lbs', youtubeId: 'eozdVDA78K0', cues: ['Slight elbow bend', 'Open arms wide', 'Feel stretch at bottom', 'Squeeze at top'], description: 'Isolates the chest with a wide range of motion for maximum stretch and contraction.' },
  { id: 'pushup', name: 'Push-Ups', category: 'chest', muscle: 'Pectorals', difficulty: 'Beginner', equipment: 'Bodyweight', unit: 'reps', youtubeId: '0pkjOk0EiAk', cues: ['Hands shoulder-width', 'Core tight', 'Full ROM', 'Elbows 45°'], description: 'The fundamental chest builder. Perfect form builds real strength.' },
  { id: 'dips', name: 'Dips', category: 'chest', muscle: 'Chest & Triceps', difficulty: 'Intermediate', equipment: 'Bodyweight', unit: 'reps', youtubeId: '2z8JmcrW-As', cues: ['Lean forward for chest', 'Lower until shoulders dip', 'Control descent', 'Full lockout'], description: 'Compound movement that loads chest and triceps through deep range of motion.' },
  { id: 'cable_fly', name: 'Cable Fly', category: 'chest', muscle: 'Pectorals', difficulty: 'Beginner', equipment: 'Cable', unit: 'lbs', youtubeId: 'taI4XduLpTk', cues: ['Constant tension', 'Slight elbow bend', 'Hinge at hips', 'Squeeze hands together'], description: 'Constant cable tension maximizes the stretch and squeeze throughout the movement.' },
  { id: 'chest_press_machine', name: 'Chest Press Machine', category: 'chest', muscle: 'Pectorals', difficulty: 'Beginner', equipment: 'Machine', unit: 'lbs', youtubeId: 'xUm0BiZCWlQ', cues: ['Seat height matters', 'Push straight forward', 'Don\'t lock out hard', 'Slow negatives'], description: 'Perfect for beginners or finishing sets to failure safely.' },

  // BACK
  { id: 'deadlift', name: 'Deadlift', category: 'back', muscle: 'Full Posterior Chain', difficulty: 'Advanced', equipment: 'Barbell', unit: 'lbs', youtubeId: 'op9kVnSso6Q', cues: ['Neutral spine', 'Bar over mid-foot', 'Hinge at hips', 'Drive floor away'], description: 'The most fundamental strength lift. Builds total-body power and posterior chain mass.' },
  { id: 'pullup', name: 'Pull-Ups', category: 'back', muscle: 'Lats & Biceps', difficulty: 'Intermediate', equipment: 'Bodyweight', unit: 'reps', youtubeId: 'eGo4IYlbE5g', cues: ['Dead hang start', 'Depress scapula', 'Pull elbows to hips', 'Chin over bar'], description: 'The ultimate upper body pulling test. Nothing builds lats like pull-ups.' },
  { id: 'row', name: 'Barbell Row', category: 'back', muscle: 'Lats & Rhomboids', difficulty: 'Intermediate', equipment: 'Barbell', unit: 'lbs', youtubeId: 'FWJR5Ve8bnQ', cues: ['Hinge 45°', 'Pull to lower chest', 'Drive elbows back', 'Squeeze at top'], description: 'A mass-building row that hits mid and upper back with heavy loading.' },
  { id: 'latpull', name: 'Lat Pulldown', category: 'back', muscle: 'Lats', difficulty: 'Beginner', equipment: 'Cable', unit: 'lbs', youtubeId: 'CAwf7n6Luuc', cues: ['Lean back slightly', 'Pull to upper chest', 'Elbows down', 'Stretch at top'], description: 'The go-to exercise for building wide lats and V-taper width.' },
  { id: 'seated_row', name: 'Seated Cable Row', category: 'back', muscle: 'Mid Back', difficulty: 'Beginner', equipment: 'Cable', unit: 'lbs', youtubeId: 'GZbfZ033f74', cues: ['Sit tall', 'Row to navel', 'Squeeze rhomboids', 'Full stretch forward'], description: 'Develops thickness through the mid-back and rhomboids.' },
  { id: 'db_row', name: 'Dumbbell Row', category: 'back', muscle: 'Lats & Rhomboids', difficulty: 'Beginner', equipment: 'Dumbbell', unit: 'lbs', youtubeId: 'pYcpY20QaE8', cues: ['Brace on bench', 'Pull elbow high', 'Neutral spine', 'Full ROM'], description: 'Single-arm variation for balanced development and deep stretch.' },
  { id: 'rdl', name: 'Romanian Deadlift', category: 'back', muscle: 'Hamstrings & Glutes', difficulty: 'Intermediate', equipment: 'Barbell', unit: 'lbs', youtubeId: '2SHsk9AzdjA', cues: ['Hinge don\'t squat', 'Bar close to legs', 'Feel hamstring stretch', 'Neutral spine'], description: 'Best exercise for hamstring length and posterior chain development.' },
  { id: 'goodmorning', name: 'Good Morning', category: 'back', muscle: 'Lower Back & Hamstrings', difficulty: 'Advanced', equipment: 'Barbell', unit: 'lbs', youtubeId: '6TwPgHE1mFw', cues: ['Bar on traps', 'Hinge forward', 'Soft knee bend', 'Neutral spine always'], description: 'Strengthens the entire posterior chain with a powerful hip hinge.' },

  // SHOULDERS
  { id: 'ohp', name: 'Overhead Press', category: 'shoulders', muscle: 'Deltoids', difficulty: 'Intermediate', equipment: 'Barbell', unit: 'lbs', youtubeId: '2yjwXTZQDDI', cues: ['Bar in front of face', 'Tuck chin', 'Lock out at top', 'Core braced'], description: 'The definitive shoulder strength test. Builds width and pressing power.' },
  { id: 'lateral', name: 'Lateral Raise', category: 'shoulders', muscle: 'Side Deltoid', difficulty: 'Beginner', equipment: 'Dumbbell', unit: 'lbs', youtubeId: 'yzJ5a4rMb1Q', cues: ['Lead with elbow', 'Slight forward lean', 'Don\'t swing', 'Pour water at top'], description: 'Isolates the medial delt for that boulder shoulder look and width.' },
  { id: 'front_raise', name: 'Front Raise', category: 'shoulders', muscle: 'Front Deltoid', difficulty: 'Beginner', equipment: 'Dumbbell', unit: 'lbs', youtubeId: 'gkMFyd-bFJM', cues: ['Neutral or pronated grip', 'Raise to shoulder height', 'Control descent', 'No swinging'], description: 'Targets the anterior deltoid for balanced front delt development.' },
  { id: 'shrug', name: 'Barbell Shrug', category: 'shoulders', muscle: 'Trapezius', difficulty: 'Beginner', equipment: 'Barbell', unit: 'lbs', youtubeId: 'cJRVVxmytaM', cues: ['Straight up motion', 'No rolling', 'Full elevation', 'Pause at top'], description: 'Builds the traps for a powerful, thick upper back look.' },
  { id: 'facepull', name: 'Face Pull', category: 'shoulders', muscle: 'Rear Deltoid', difficulty: 'Beginner', equipment: 'Cable', unit: 'lbs', youtubeId: 'rep-qVOkqgk', cues: ['Cable at eye level', 'Pull to face', 'External rotation', 'Slow & controlled'], description: 'Crucial for shoulder health and posterior delt thickness. A must-do.' },
  { id: 'arnold_press', name: 'Arnold Press', category: 'shoulders', muscle: 'All Three Deltoid Heads', difficulty: 'Intermediate', equipment: 'Dumbbell', unit: 'lbs', youtubeId: 'vj2w851ZHRM', cues: ['Start palms facing you', 'Rotate while pressing', 'Full ROM', 'Control rotation'], description: 'Created by the GOAT. Hits all three deltoid heads in one movement.' },
  { id: 'upright_row', name: 'Upright Row', category: 'shoulders', muscle: 'Deltoids & Traps', difficulty: 'Intermediate', equipment: 'Barbell', unit: 'lbs', youtubeId: 'um3LNfH3vBs', cues: ['Elbows above hands', 'Pull to chin', 'Elbows flare out', 'Control down'], description: 'Compound shoulder movement that also recruits the traps and upper back.' },

  // ARMS
  { id: 'curl', name: 'Barbell Curl', category: 'arms', muscle: 'Biceps', difficulty: 'Beginner', equipment: 'Barbell', unit: 'lbs', youtubeId: 'kwG2ipFRgfo', cues: ['Elbows fixed', 'Full ROM', 'Squeeze at top', 'No swinging'], description: 'The most efficient bicep builder for peak and overall size.' },
  { id: 'hammer', name: 'Hammer Curl', category: 'arms', muscle: 'Biceps & Brachialis', difficulty: 'Beginner', equipment: 'Dumbbell', unit: 'lbs', youtubeId: 'zC3nLlEvin4', cues: ['Neutral grip', 'Elbows fixed', 'Squeeze brachialis', 'Both sides equal'], description: 'Builds the brachialis for thick, peaked arms from all angles.' },
  { id: 'preacher_curl', name: 'Preacher Curl', category: 'arms', muscle: 'Biceps', difficulty: 'Beginner', equipment: 'Barbell', unit: 'lbs', youtubeId: 'fIWP-FRFNU0', cues: ['Arms on pad', 'Full stretch bottom', 'Squeeze at top', 'No momentum'], description: 'Eliminates cheating and isolates the biceps for pure peak development.' },
  { id: 'pushdown', name: 'Tricep Pushdown', category: 'arms', muscle: 'Triceps', difficulty: 'Beginner', equipment: 'Cable', unit: 'lbs', youtubeId: '2-LAMcpzODU', cues: ['Elbows at sides', 'Push straight down', 'Lockout fully', 'Control return'], description: 'The most popular tricep isolation for adding mass to the back of the arms.' },
  { id: 'closebench', name: 'Close-Grip Bench', category: 'arms', muscle: 'Triceps', difficulty: 'Intermediate', equipment: 'Barbell', unit: 'lbs', youtubeId: 'nEF0bv2FW04', cues: ['Hands shoulder-width', 'Elbows tucked', 'Full ROM', 'Don\'t flare elbows'], description: 'A compound tricep movement that also hits chest and builds serious size.' },
  { id: 'skull_crusher', name: 'Skull Crusher', category: 'arms', muscle: 'Triceps Long Head', difficulty: 'Intermediate', equipment: 'Barbell', unit: 'lbs', youtubeId: 'NIvZczqo0Ck', cues: ['Bar toward forehead', 'Elbows fixed', 'Full extension', 'Slow controlled'], description: 'Maximum stretch on the long head for thick, full tricep development.' },
  { id: 'concentration_curl', name: 'Concentration Curl', category: 'arms', muscle: 'Biceps Peak', difficulty: 'Beginner', equipment: 'Dumbbell', unit: 'lbs', youtubeId: 'Jvj2wV0vOYU', cues: ['Elbow on inner thigh', 'Full ROM', 'Supinate at top', 'Squeeze hard'], description: 'The best isolation move for bicep peak — Arnold\'s secret weapon.' },
  { id: 'overhead_tricep', name: 'Overhead Tricep Extension', category: 'arms', muscle: 'Triceps Long Head', difficulty: 'Beginner', equipment: 'Dumbbell', unit: 'lbs', youtubeId: 'YbX7Wd8jQ-Q', cues: ['Arms behind head', 'Keep elbows in', 'Full stretch', 'Squeeze at top'], description: 'Long head stretch creates maximum tricep mass in the stretched position.' },

  // LEGS
  { id: 'squat', name: 'Back Squat', category: 'legs', muscle: 'Quads, Glutes & Hamstrings', difficulty: 'Advanced', equipment: 'Barbell', unit: 'lbs', youtubeId: 'ultWZbUMPL8', cues: ['Bar on traps', 'Knees out', 'Depth below parallel', 'Drive through heels'], description: 'The king of all exercises. Nothing compares for building leg mass and total strength.' },
  { id: 'legpress', name: 'Leg Press', category: 'legs', muscle: 'Quads & Glutes', difficulty: 'Beginner', equipment: 'Machine', unit: 'lbs', youtubeId: 'IZxyjW7MPJQ', cues: ['Feet shoulder-width', 'Don\'t lock knees', 'Full ROM', 'Push through heels'], description: 'Allows heavy loading for quad mass without the spinal load of squats.' },
  { id: 'lunge', name: 'Lunges', category: 'legs', muscle: 'Quads & Glutes', difficulty: 'Beginner', equipment: 'Bodyweight/Dumbbell', unit: 'reps', youtubeId: 'QOVaHwm-Q6U', cues: ['Step forward', 'Back knee near floor', 'Upright torso', 'Push back to start'], description: 'Unilateral movement that corrects imbalances and builds functional leg strength.' },
  { id: 'leg_curl', name: 'Leg Curl', category: 'legs', muscle: 'Hamstrings', difficulty: 'Beginner', equipment: 'Machine', unit: 'lbs', youtubeId: '1Tq3QdYUuHs', cues: ['Toes pointed', 'Full contraction', 'Slow eccentric', 'Hips down'], description: 'Isolates the hamstrings through full range of motion for complete development.' },
  { id: 'leg_extension', name: 'Leg Extension', category: 'legs', muscle: 'Quads', difficulty: 'Beginner', equipment: 'Machine', unit: 'lbs', youtubeId: 'YyvSfVjQeL0', cues: ['Toes back', 'Full extension', 'Squeeze at top', 'Control descent'], description: 'Pure quad isolation for teardrop development and knee joint strength.' },
  { id: 'hip_thrust', name: 'Hip Thrust', category: 'legs', muscle: 'Glutes', difficulty: 'Intermediate', equipment: 'Barbell', unit: 'lbs', youtubeId: '8bbE64NuDTU', cues: ['Shoulders on bench', 'Drive hips up', 'Squeeze glutes hard', 'Level pelvis'], description: 'The best glute builder, period. Produces more glute activation than any other movement.' },
  { id: 'calf_raise', name: 'Calf Raise', category: 'legs', muscle: 'Gastrocnemius & Soleus', difficulty: 'Beginner', equipment: 'Machine/Bodyweight', unit: 'lbs', youtubeId: 'gwLzBJYoWlI', cues: ['Full stretch bottom', 'Pause at top', 'Slow tempo', 'Toes forward/out/in'], description: 'Building calves requires full range of motion and high volume over time.' },
  { id: 'front_squat', name: 'Front Squat', category: 'legs', muscle: 'Quads', difficulty: 'Advanced', equipment: 'Barbell', unit: 'lbs', youtubeId: 'm4ytaCJZpl0', cues: ['Bar on front delts', 'Elbows high', 'Upright torso', 'Deep depth'], description: 'Quad-dominant squat variation that builds incredible anterior chain strength.' },

  // CORE
  { id: 'plank', name: 'Plank', category: 'core', muscle: 'Core', difficulty: 'Beginner', equipment: 'Bodyweight', unit: 'sec', youtubeId: 'ASdvSqZQDkI', cues: ['Straight line', 'Squeeze glutes', 'Pull navel in', 'Don\'t hold breath'], description: 'The fundamental core stability exercise. The foundation of all strength.' },
  { id: 'situp', name: 'Sit-Ups', category: 'core', muscle: 'Rectus Abdominis', difficulty: 'Beginner', equipment: 'Bodyweight', unit: 'reps', youtubeId: 'jDwoBqPH0jk', cues: ['Hands behind head', 'Don\'t pull neck', 'Touch elbows to knees', 'Slow down'], description: 'Classic ab builder for anterior core strength and definition.' },
  { id: 'hangleg', name: 'Hanging Leg Raise', category: 'core', muscle: 'Lower Abs', difficulty: 'Advanced', equipment: 'Bodyweight', unit: 'reps', youtubeId: 'Pr1ieGZ5atk', cues: ['Dead hang start', 'Don\'t swing', 'Tuck pelvis', 'Squeeze abs at top'], description: 'The best lower ab movement. Requires serious core strength and control.' },
  { id: 'abwheel', name: 'Ab Wheel', category: 'core', muscle: 'Full Core', difficulty: 'Advanced', equipment: 'Ab Wheel', unit: 'reps', youtubeId: 'j7FTWLs70Bg', cues: ['Start on knees', 'Arms straight', 'Lower slow', 'Pull back with core'], description: 'Brutal full-core movement that also hits lats and shoulders.' },
  { id: 'russian_twist', name: 'Russian Twist', category: 'core', muscle: 'Obliques', difficulty: 'Beginner', equipment: 'Bodyweight/Plate', unit: 'reps', youtubeId: 'wkD8rjkodUI', cues: ['Lean back 45°', 'Lift feet', 'Rotate fully', 'Touch floor each side'], description: 'Oblique builder for rotational strength and a defined waist.' },
  { id: 'cable_crunch', name: 'Cable Crunch', category: 'core', muscle: 'Upper Abs', difficulty: 'Beginner', equipment: 'Cable', unit: 'lbs', youtubeId: 'GtW9HSVUDaI', cues: ['Kneel down', 'Rope at head', 'Crunch down', 'Round spine'], description: 'Allows weighted progression for abs — the key to getting strong, visible abs.' },

  // CARDIO
  { id: 'run', name: 'Running', category: 'cardio', muscle: 'Full Body', difficulty: 'Beginner', equipment: 'None', unit: 'miles', youtubeId: 'kVnyY17VS9Y', cues: ['Midfoot strike', 'Upright posture', 'Relax arms', 'Breathe rhythmically'], description: 'The most natural human movement. Builds cardiovascular base and mental toughness.' },
  { id: 'rowing', name: 'Rowing Machine', category: 'cardio', muscle: 'Full Body', difficulty: 'Intermediate', equipment: 'Machine', unit: 'miles', youtubeId: 'H0r_SSLL31M', cues: ['Legs first', 'Then lean back', 'Then arms pull', 'Reverse to return'], description: 'The ultimate full-body cardio — 86% muscle activation in one machine.' },
  { id: 'jump_rope', name: 'Jump Rope', category: 'cardio', muscle: 'Calves & Cardio', difficulty: 'Beginner', equipment: 'Jump Rope', unit: 'reps', youtubeId: 'u3zgHI8QnqE', cues: ['Wrists rotate', 'Land on balls of feet', 'Jump low', 'Relax shoulders'], description: 'The most efficient cardio tool. Burns more calories than running per minute.' },
  { id: 'burpee', name: 'Burpees', category: 'cardio', muscle: 'Full Body', difficulty: 'Intermediate', equipment: 'Bodyweight', unit: 'reps', youtubeId: 'qLBImHhCXSw', cues: ['Hands to floor', 'Jump back', 'Push-up optional', 'Jump up with clap'], description: 'The complete conditioning exercise. Total body endurance and strength.' },
  { id: 'bike', name: 'Stationary Bike', category: 'cardio', muscle: 'Legs & Cardio', difficulty: 'Beginner', equipment: 'Machine', unit: 'miles', youtubeId: 'i2caBMBJAAo', cues: ['Seat at hip height', 'Slight knee bend', 'Keep cadence up', 'Core tight'], description: 'Low-impact cardio that spares the joints while building serious aerobic capacity.' },

  // OLYMPIC
  { id: 'clean', name: 'Power Clean', category: 'olympic', muscle: 'Full Body', difficulty: 'Advanced', equipment: 'Barbell', unit: 'lbs', youtubeId: 'GwdnBKpNkj8', cues: ['Start like deadlift', 'Triple extension', 'Shrug and pull under', 'Receive in quarter squat'], description: 'The most explosive barbell movement. Develops total body power and athleticism.' },
  { id: 'snatch', name: 'Snatch', category: 'olympic', muscle: 'Full Body', difficulty: 'Advanced', equipment: 'Barbell', unit: 'lbs', youtubeId: '9xQp2sldaps', cues: ['Wide grip', 'Bar close throughout', 'Punch under fast', 'Overhead squat catch'], description: 'The most technical lift in existence. The pinnacle of strength, speed and coordination.' },
  { id: 'clean_jerk', name: 'Clean & Jerk', category: 'olympic', muscle: 'Full Body', difficulty: 'Advanced', equipment: 'Barbell', unit: 'lbs', youtubeId: 'iVZRBDInkDE', cues: ['Clean first', 'Reset in front rack', 'Dip and drive', 'Split or push jerk'], description: 'The world\'s heaviest overhead press, combining strength, technique and explosiveness.' },

  // CALISTHENICS
  { id: 'muscle_up', name: 'Muscle-Up', category: 'calisthenics', muscle: 'Back, Chest & Arms', difficulty: 'Advanced', equipment: 'Pull-Up Bar', unit: 'reps', youtubeId: 'abb9AhWzbcQ', cues: ['Explosive pull', 'Lean forward', 'Transition above bar', 'Dip to finish'], description: 'The ultimate display of upper body control. Pull-up meets dip in one flow.' },
  { id: 'handstand', name: 'Handstand Push-Up', category: 'calisthenics', muscle: 'Shoulders & Triceps', difficulty: 'Advanced', equipment: 'Bodyweight', unit: 'reps', youtubeId: 'dBqHBEzQRAA', cues: ['Wall for stability', 'Lock core', 'Head between hands', 'Lower controlled'], description: 'Inverted pressing builds elite overhead strength with bodyweight only.' },
  { id: 'pistol', name: 'Pistol Squat', category: 'calisthenics', muscle: 'Quads & Balance', difficulty: 'Advanced', equipment: 'Bodyweight', unit: 'reps', youtubeId: 'qDcniqddTeE', cues: ['One leg extended', 'Sit back', 'Knee tracks toe', 'Drive up explosively'], description: 'The single-leg squat tests leg strength, balance and mobility simultaneously.' },
  { id: 'dragon_flag', name: 'Dragon Flag', category: 'calisthenics', muscle: 'Full Core', difficulty: 'Advanced', equipment: 'Bench', unit: 'reps', youtubeId: 'VoR9zNJ9fT8', cues: ['Hold bench behind head', 'Body straight', 'Lower slow', 'Don\'t touch floor'], description: 'Bruce Lee\'s signature move. The most demanding core exercise known.' },
]

// ── Rank system per exercise ─────────────────────────────────────────────────

const EXERCISE_RANK_STANDARDS: Record<string, { beginner: number; intermediate: number; advanced: number; elite: number; unit: string }> = {
  bench: { beginner: 95, intermediate: 135, advanced: 185, elite: 225, unit: 'lbs' },
  incline_bench: { beginner: 75, intermediate: 115, advanced: 155, elite: 195, unit: 'lbs' },
  ohp: { beginner: 55, intermediate: 95, advanced: 135, elite: 175, unit: 'lbs' },
  squat: { beginner: 115, intermediate: 185, advanced: 245, elite: 315, unit: 'lbs' },
  deadlift: { beginner: 135, intermediate: 225, advanced: 315, elite: 405, unit: 'lbs' },
  rdl: { beginner: 95, intermediate: 155, advanced: 225, elite: 295, unit: 'lbs' },
  curl: { beginner: 55, intermediate: 85, advanced: 115, elite: 145, unit: 'lbs' },
  pushdown: { beginner: 40, intermediate: 70, advanced: 100, elite: 130, unit: 'lbs' },
  closebench: { beginner: 75, intermediate: 115, advanced: 155, elite: 195, unit: 'lbs' },
  skull_crusher: { beginner: 45, intermediate: 75, advanced: 105, elite: 135, unit: 'lbs' },
  row: { beginner: 95, intermediate: 135, advanced: 185, elite: 225, unit: 'lbs' },
  latpull: { beginner: 70, intermediate: 110, advanced: 150, elite: 190, unit: 'lbs' },
  seated_row: { beginner: 70, intermediate: 110, advanced: 150, elite: 190, unit: 'lbs' },
  legpress: { beginner: 185, intermediate: 315, advanced: 405, elite: 495, unit: 'lbs' },
  hip_thrust: { beginner: 95, intermediate: 185, advanced: 275, elite: 365, unit: 'lbs' },
  shrug: { beginner: 115, intermediate: 185, advanced: 275, elite: 365, unit: 'lbs' },
  lateral: { beginner: 10, intermediate: 20, advanced: 35, elite: 50, unit: 'lbs' },
  hammer: { beginner: 25, intermediate: 40, advanced: 55, elite: 70, unit: 'lbs' },
  preacher_curl: { beginner: 40, intermediate: 65, advanced: 90, elite: 115, unit: 'lbs' },
  cable_fly: { beginner: 25, intermediate: 40, advanced: 60, elite: 80, unit: 'lbs' },
  front_squat: { beginner: 75, intermediate: 135, advanced: 185, elite: 245, unit: 'lbs' },
  good_morning: { beginner: 65, intermediate: 115, advanced: 165, elite: 215, unit: 'lbs' },
  arnold_press: { beginner: 20, intermediate: 35, advanced: 50, elite: 70, unit: 'lbs' },
  clean: { beginner: 95, intermediate: 155, advanced: 215, elite: 275, unit: 'lbs' },
  snatch: { beginner: 65, intermediate: 115, advanced: 175, elite: 225, unit: 'lbs' },
  clean_jerk: { beginner: 95, intermediate: 165, advanced: 225, elite: 295, unit: 'lbs' },
  // Bodyweight
  pushup: { beginner: 10, intermediate: 25, advanced: 40, elite: 60, unit: 'reps' },
  pullup: { beginner: 3, intermediate: 8, advanced: 15, elite: 25, unit: 'reps' },
  dips: { beginner: 5, intermediate: 12, advanced: 20, elite: 30, unit: 'reps' },
  situp: { beginner: 15, intermediate: 30, advanced: 50, elite: 75, unit: 'reps' },
  hangleg: { beginner: 5, intermediate: 12, advanced: 20, elite: 30, unit: 'reps' },
  abwheel: { beginner: 5, intermediate: 12, advanced: 20, elite: 30, unit: 'reps' },
  lunge: { beginner: 10, intermediate: 20, advanced: 35, elite: 50, unit: 'reps' },
  burpee: { beginner: 10, intermediate: 25, advanced: 40, elite: 60, unit: 'reps' },
  muscle_up: { beginner: 1, intermediate: 5, advanced: 10, elite: 20, unit: 'reps' },
  handstand: { beginner: 1, intermediate: 5, advanced: 10, elite: 20, unit: 'reps' },
  pistol: { beginner: 1, intermediate: 5, advanced: 10, elite: 20, unit: 'reps' },
  dragon_flag: { beginner: 1, intermediate: 5, advanced: 10, elite: 15, unit: 'reps' },
  // Timed
  plank: { beginner: 30, intermediate: 60, advanced: 120, elite: 180, unit: 'sec' },
  // Cardio
  run: { beginner: 1, intermediate: 3, advanced: 6, elite: 13.1, unit: 'miles' },
}

function getRankForValue(exerciseId: string, value: number, age: number, weight: number): {
  rank: string; symbol: string; color: string; score: number
} {
  const std = EXERCISE_RANK_STANDARDS[exerciseId]
  if (!std || value <= 0) return { rank: 'Unranked', symbol: 'iron', color: '#6b7280', score: 0 }

  // Age and weight adjustment factor
  const ageFactor = age < 18 ? 1.1 : age > 35 ? Math.max(0.85, 1 - (age - 35) * 0.01) : 1
  const weightFactor = std.unit === 'lbs' ? Math.sqrt(weight / 170) : 1
  const adjusted = value * ageFactor * weightFactor

  let score = 0
  if (adjusted >= std.elite) score = 90 + Math.min(10, ((adjusted - std.elite) / std.elite) * 30)
  else if (adjusted >= std.advanced) score = 70 + ((adjusted - std.advanced) / (std.elite - std.advanced)) * 20
  else if (adjusted >= std.intermediate) score = 40 + ((adjusted - std.intermediate) / (std.advanced - std.intermediate)) * 30
  else if (adjusted >= std.beginner) score = 12 + ((adjusted - std.beginner) / (std.intermediate - std.beginner)) * 28
  else score = Math.max(0, (adjusted / std.beginner) * 12)

  score = Math.round(Math.min(100, score))
  const rankInfo = RANKS.reduce((best, r) => score >= r.minScore ? r : best, RANKS[0])
  return { rank: rankInfo.name, symbol: rankInfo.symbol, color: rankInfo.color, score }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ExerciseVideoModal({ exercise, onClose, age, weight }: {
  exercise: ExerciseEntry
  onClose: () => void
  age: number
  weight: number
}) {
  const [inputValue, setInputValue] = useState('')
  const [inputReps, setInputReps] = useState('')
  const [result, setResult] = useState<{ rank: string; symbol: string; color: string; score: number } | null>(null)

  const std = EXERCISE_RANK_STANDARDS[exercise.id]
  const isWeighted = exercise.unit === 'lbs'

  const handleCalc = () => {
    const val = isWeighted
      ? parseFloat(inputValue)
      : exercise.unit === 'sec'
        ? parseFloat(inputValue)
        : parseInt(inputValue)
    if (!val || val <= 0) return
    setResult(getRankForValue(exercise.id, val, age, weight))
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-md" onClick={onClose}>
      <div className="flex flex-col h-full max-w-md mx-auto w-full" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-safe pt-4 pb-3">
          <button onClick={onClose} className="flex items-center gap-1.5 text-white/70 hover:text-white">
            <ChevronLeft className="h-5 w-5" />
            <span className="text-sm font-medium">Back</span>
          </button>
          <span className={cn(
            'rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider',
            exercise.difficulty === 'Beginner' ? 'bg-green-500/20 text-green-400' :
            exercise.difficulty === 'Intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-red-500/20 text-red-400'
          )}>
            {exercise.difficulty}
          </span>
        </div>

        {/* Video embed */}
        <div className="relative w-full aspect-video bg-zinc-900 overflow-hidden">
          <iframe
            src={`https://www.youtube.com/embed/${exercise.youtubeId}?autoplay=1&mute=1&rel=0&modestbranding=1`}
            title={exercise.name}
            allow="autoplay; encrypted-media"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 pb-8 pt-4 space-y-4">
          <div>
            <h2 className="text-xl font-black text-white">{exercise.name}</h2>
            <p className="text-sm text-zinc-400 mt-1">{exercise.muscle} · {exercise.equipment}</p>
            <p className="text-sm text-zinc-300 mt-2">{exercise.description}</p>
          </div>

          {/* Form cues */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
            <p className="text-xs font-bold text-white/50 uppercase tracking-wider mb-3">Form Cues</p>
            <div className="space-y-2">
              {exercise.cues.map((cue, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="mt-0.5 h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-bold text-primary">{i + 1}</span>
                  </div>
                  <span className="text-sm text-zinc-200">{cue}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Rank calculator */}
          {std && (
            <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
              <p className="text-xs font-bold text-white/50 uppercase tracking-wider mb-3">
                🏆 Get Your Rank
              </p>
              <div className="flex gap-2 mb-3">
                <div className="flex-1">
                  <label className="text-xs text-zinc-500 mb-1 block">
                    {exercise.unit === 'lbs' ? 'Weight (lbs)' : exercise.unit === 'sec' ? 'Time (seconds)' : exercise.unit === 'miles' ? 'Distance (miles)' : 'Reps'}
                  </label>
                  <input
                    type="number"
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    placeholder={exercise.unit === 'lbs' ? '135' : exercise.unit === 'sec' ? '60' : '10'}
                    className="w-full rounded-xl bg-white/10 border border-white/20 px-3 py-2.5 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-primary"
                  />
                </div>
                {isWeighted && (
                  <div className="flex-1">
                    <label className="text-xs text-zinc-500 mb-1 block">Reps</label>
                    <input
                      type="number"
                      value={inputReps}
                      onChange={e => setInputReps(e.target.value)}
                      placeholder="5"
                      className="w-full rounded-xl bg-white/10 border border-white/20 px-3 py-2.5 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-primary"
                    />
                  </div>
                )}
              </div>
              <button
                onClick={handleCalc}
                className="w-full rounded-xl bg-primary py-2.5 text-sm font-bold text-primary-foreground"
              >
                Calculate Rank
              </button>

              {result && (
                <div className="mt-4 rounded-xl bg-white/5 border border-white/10 p-4 flex items-center gap-4">
                  <RankBadge symbol={result.symbol} size={52} />
                  <div>
                    <p className="text-white font-black text-lg">{result.rank}</p>
                    <p className="text-zinc-400 text-sm">Score: {result.score}/100</p>
                    <div className="mt-1.5 h-1.5 w-32 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${result.score}%`, background: result.color }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Standards table */}
              <div className="mt-4 grid grid-cols-4 gap-1 text-center">
                {[
                  { label: 'Beginner', val: std.beginner, color: '#22c55e' },
                  { label: 'Intermediate', val: std.intermediate, color: '#f59e0b' },
                  { label: 'Advanced', val: std.advanced, color: '#3b82f6' },
                  { label: 'Elite', val: std.elite, color: '#a855f7' },
                ].map(s => (
                  <div key={s.label} className="rounded-xl bg-white/5 p-2">
                    <p className="text-[9px] font-bold uppercase" style={{ color: s.color }}>{s.label}</p>
                    <p className="text-white font-bold text-sm mt-0.5">{s.val}</p>
                    <p className="text-zinc-500 text-[9px]">{std.unit}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main LiftsPage ───────────────────────────────────────────────────────────

export function LiftsPage() {
  const { settings } = useApp()
  const [activeCategory, setActiveCategory] = useState('chest')
  const [selectedExercise, setSelectedExercise] = useState<ExerciseEntry | null>(null)
  const [search, setSearch] = useState('')

  const filtered = ALL_EXERCISES.filter(e =>
    (activeCategory === 'all' || e.category === activeCategory) &&
    (search === '' || e.name.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <>
      <div className="space-y-4">
        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search exercises..."
          className="w-full rounded-2xl bg-secondary/60 border border-border px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
        />

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {EXERCISE_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                'flex-shrink-0 flex items-center gap-1.5 rounded-2xl px-3 py-2 text-xs font-semibold transition-all',
                activeCategory === cat.id
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-secondary/60 text-muted-foreground'
              )}
            >
              <span>{cat.emoji}</span>
              {cat.label}
            </button>
          ))}
        </div>

        {/* Exercise list */}
        <div className="space-y-2">
          {filtered.map(ex => (
            <button
              key={ex.id}
              onClick={() => setSelectedExercise(ex)}
              className="w-full flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5 text-left hover:border-primary/40 transition-all group"
            >
              {/* Play icon */}
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Play className="h-5 w-5 text-primary fill-primary/40" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-sm">{ex.name}</p>
                <p className="text-xs text-muted-foreground truncate">{ex.muscle}</p>
              </div>

              <div className="flex flex-col items-end gap-1">
                <span className={cn(
                  'rounded-full px-2 py-0.5 text-[10px] font-bold',
                  ex.difficulty === 'Beginner' ? 'bg-green-500/15 text-green-500' :
                  ex.difficulty === 'Intermediate' ? 'bg-yellow-500/15 text-yellow-500' :
                  'bg-red-500/15 text-red-500'
                )}>
                  {ex.difficulty}
                </span>
                <span className="text-[10px] text-muted-foreground">{ex.equipment}</span>
              </div>

              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </button>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-4xl mb-3">🔍</p>
              <p className="font-semibold">No exercises found</p>
              <p className="text-sm">Try a different search or category</p>
            </div>
          )}
        </div>
      </div>

      {selectedExercise && (
        <ExerciseVideoModal
          exercise={selectedExercise}
          onClose={() => setSelectedExercise(null)}
          age={settings.age}
          weight={settings.weight * 2.20462}
        />
      )}
    </>
  )
}
