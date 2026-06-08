'use client'

import { useState, useMemo } from 'react'
import { Search, X, ChevronDown, ChevronUp, Dumbbell } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ExerciseEntry {
  id: string
  name: string
  category: string
  muscle: string        // broad group label
  specificMuscle: string // e.g. "Biceps Long Head", "Upper Pec"
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  equipment: string
  unit: 'lbs' | 'reps' | 'sec' | 'miles'
  youtubeId: string
  cues: string[]
  description: string
}

// ─── Filter Definitions ───────────────────────────────────────────────────────

const EQUIPMENT_FILTERS = [
  { id: 'all',        label: 'All' },
  { id: 'Barbell',    label: 'Barbell' },
  { id: 'Dumbbell',   label: 'Dumbbell' },
  { id: 'Cable',      label: 'Cable' },
  { id: 'Machine',    label: 'Machine' },
  { id: 'Bodyweight', label: 'Bodyweight' },
  { id: 'Other',      label: 'Other' },
]

const MUSCLE_GROUP_FILTERS = [
  { id: 'all',          label: 'All',          emoji: '🏋️' },
  { id: 'chest',        label: 'Chest',        emoji: '💪' },
  { id: 'back',         label: 'Back',         emoji: '🏋️' },
  { id: 'shoulders',    label: 'Shoulders',    emoji: '🔱' },
  { id: 'arms',         label: 'Arms',         emoji: '💪' },
  { id: 'legs',         label: 'Legs',         emoji: '🦵' },
  { id: 'core',         label: 'Core',         emoji: '🎯' },
  { id: 'cardio',       label: 'Cardio',       emoji: '🏃' },
  { id: 'olympic',      label: 'Olympic',      emoji: '🥇' },
  { id: 'calisthenics', label: 'Calisthenics', emoji: '🤸' },
]

const SPECIFIC_MUSCLE_FILTERS = [
  { id: 'all', label: 'All' },
  // Chest
  { id: 'Upper Pec',               label: 'Upper Pec' },
  { id: 'Mid Pec',                 label: 'Mid Pec' },
  { id: 'Lower Pec',               label: 'Lower Pec' },
  // Back
  { id: 'Lats',                    label: 'Lats' },
  { id: 'Rhomboids',               label: 'Rhomboids' },
  { id: 'Mid Traps',               label: 'Mid Traps' },
  { id: 'Lower Back',              label: 'Lower Back' },
  // Shoulders
  { id: 'Front Delt',              label: 'Front Delt' },
  { id: 'Side Delt',               label: 'Side Delt' },
  { id: 'Rear Delt',               label: 'Rear Delt' },
  { id: 'Traps',                   label: 'Traps' },
  // Arms
  { id: 'Biceps Long Head',        label: 'Biceps Long Head' },
  { id: 'Biceps Short Head',       label: 'Biceps Short Head' },
  { id: 'Brachialis',              label: 'Brachialis' },
  { id: 'Triceps Long Head',       label: 'Triceps Long Head' },
  { id: 'Triceps Lateral Head',    label: 'Triceps Lateral Head' },
  { id: 'Triceps Medial Head',     label: 'Triceps Medial Head' },
  // Legs
  { id: 'Quads',                   label: 'Quads' },
  { id: 'Hamstrings',              label: 'Hamstrings' },
  { id: 'Glutes',                  label: 'Glutes' },
  { id: 'Calves',                  label: 'Calves' },
  { id: 'Hip Flexors',             label: 'Hip Flexors' },
  // Core
  { id: 'Upper Abs',               label: 'Upper Abs' },
  { id: 'Lower Abs',               label: 'Lower Abs' },
  { id: 'Obliques',                label: 'Obliques' },
  { id: 'Transverse Abdominis',    label: 'Transverse Abdominis' },
]

// ─── Exercise Database ────────────────────────────────────────────────────────

const ALL_EXERCISES: ExerciseEntry[] = [
  // ── CHEST ──
  { id: 'bench',              name: 'Bench Press',            category: 'chest',        muscle: 'Chest',     specificMuscle: 'Mid Pec',             difficulty: 'Intermediate', equipment: 'Barbell',   unit: 'lbs',   youtubeId: 'vcBig73ojpE', cues: ['Retract scapula', 'Arch back slightly', 'Bar to lower chest', 'Drive feet into floor'],      description: 'The king of chest exercises. Build mass and strength across the entire pec.' },
  { id: 'incline_bench',      name: 'Incline Bench Press',    category: 'chest',        muscle: 'Chest',     specificMuscle: 'Upper Pec',            difficulty: 'Intermediate', equipment: 'Barbell',   unit: 'lbs',   youtubeId: 'jPLdzuHckI8', cues: ['Set bench 30–45°', 'Bar to upper chest', 'Elbows at 45°', 'Control descent'],                description: 'Targets the clavicular head for a full, rounded chest development.' },
  { id: 'decline_bench',      name: 'Decline Bench Press',    category: 'chest',        muscle: 'Chest',     specificMuscle: 'Lower Pec',            difficulty: 'Intermediate', equipment: 'Barbell',   unit: 'lbs',   youtubeId: 'LfyQTbGxHcE', cues: ['Feet secured', 'Bar to lower chest', 'Control descent', 'Full lockout'],                   description: 'Hits the lower chest hard. Great for a complete, well-defined pec.' },
  { id: 'incline_db_press',   name: 'Incline DB Press',       category: 'chest',        muscle: 'Chest',     specificMuscle: 'Upper Pec',            difficulty: 'Beginner',     equipment: 'Dumbbell',  unit: 'lbs',   youtubeId: '8iPEnn-ltC8', cues: ['30–45° incline', 'Neutral to pronated grip', 'Full stretch at bottom', 'Squeeze at top'],   description: 'Dumbbell freedom allows deeper stretch and independent arm movement for upper pec.' },
  { id: 'dbfly',              name: 'Dumbbell Fly',           category: 'chest',        muscle: 'Chest',     specificMuscle: 'Mid Pec',             difficulty: 'Beginner',     equipment: 'Dumbbell',  unit: 'lbs',   youtubeId: 'eozdVDA78K0', cues: ['Slight elbow bend', 'Open arms wide', 'Feel stretch at bottom', 'Squeeze at top'],        description: 'Isolates the chest with a wide range of motion for maximum stretch and contraction.' },
  { id: 'pushup',             name: 'Push-Ups',               category: 'chest',        muscle: 'Chest',     specificMuscle: 'Mid Pec',             difficulty: 'Beginner',     equipment: 'Bodyweight',unit: 'reps',  youtubeId: '0pkjOk0EiAk', cues: ['Hands shoulder-width', 'Core tight', 'Full ROM', 'Elbows 45°'],                              description: 'The fundamental chest builder. Perfect form builds real strength.' },
  { id: 'dips',               name: 'Dips',                   category: 'chest',        muscle: 'Chest',     specificMuscle: 'Lower Pec',            difficulty: 'Intermediate', equipment: 'Bodyweight',unit: 'reps',  youtubeId: '2z8JmcrW-As', cues: ['Lean forward for chest', 'Lower until shoulders dip', 'Control descent', 'Full lockout'],    description: 'Compound movement that loads lower chest and triceps through deep range of motion.' },
  { id: 'cable_fly',          name: 'Cable Fly',              category: 'chest',        muscle: 'Chest',     specificMuscle: 'Mid Pec',             difficulty: 'Beginner',     equipment: 'Cable',     unit: 'lbs',   youtubeId: 'taI4XduLpTk', cues: ['Constant tension', 'Slight elbow bend', 'Hinge at hips', 'Squeeze hands together'],          description: 'Constant cable tension maximizes the stretch and squeeze throughout the movement.' },
  { id: 'high_cable_fly',     name: 'High Cable Fly',         category: 'chest',        muscle: 'Chest',     specificMuscle: 'Lower Pec',            difficulty: 'Beginner',     equipment: 'Cable',     unit: 'lbs',   youtubeId: 'taI4XduLpTk', cues: ['Cables above head', 'Pull down and in', 'Squeeze lower pec', 'Control return'],            description: 'Targets the lower pec with a downward cable fly motion.' },
  { id: 'chest_press_machine',name: 'Chest Press Machine',    category: 'chest',        muscle: 'Chest',     specificMuscle: 'Mid Pec',             difficulty: 'Beginner',     equipment: 'Machine',   unit: 'lbs',   youtubeId: 'xUm0BiZCWlQ', cues: ['Seat height matters', 'Push straight forward', "Don't lock out hard", 'Slow negatives'],   description: 'Perfect for beginners or finishing sets to failure safely.' },

  // ── BACK ──
  { id: 'deadlift',           name: 'Deadlift',               category: 'back',         muscle: 'Back',      specificMuscle: 'Lower Back',           difficulty: 'Advanced',     equipment: 'Barbell',   unit: 'lbs',   youtubeId: 'op9kVnSso6Q', cues: ['Neutral spine', 'Bar over mid-foot', 'Hinge at hips', 'Drive floor away'],                   description: 'The most fundamental strength lift. Builds total-body power and posterior chain mass.' },
  { id: 'pullup',             name: 'Pull-Ups',               category: 'back',         muscle: 'Back',      specificMuscle: 'Lats',                 difficulty: 'Intermediate', equipment: 'Bodyweight',unit: 'reps',  youtubeId: 'eGo4IYlbE5g', cues: ['Dead hang start', 'Depress scapula', 'Pull elbows to hips', 'Chin over bar'],                description: 'The ultimate upper body pulling test. Nothing builds lats like pull-ups.' },
  { id: 'chinup',             name: 'Chin-Ups',               category: 'back',         muscle: 'Back',      specificMuscle: 'Lats',                 difficulty: 'Intermediate', equipment: 'Bodyweight',unit: 'reps',  youtubeId: 'brhRXlOhsAM', cues: ['Supinated grip', 'Pull chest to bar', 'Squeeze lats and biceps', 'Full hang'],               description: 'Underhand grip recruits more bicep. Great for lat and arm combo development.' },
  { id: 'row',                name: 'Barbell Row',            category: 'back',         muscle: 'Back',      specificMuscle: 'Rhomboids',            difficulty: 'Intermediate', equipment: 'Barbell',   unit: 'lbs',   youtubeId: 'FWJR5Ve8bnQ', cues: ['Hinge 45°', 'Pull to lower chest', 'Drive elbows back', 'Squeeze at top'],                  description: 'A mass-building row that hits mid and upper back with heavy loading.' },
  { id: 'latpull',            name: 'Lat Pulldown',           category: 'back',         muscle: 'Back',      specificMuscle: 'Lats',                 difficulty: 'Beginner',     equipment: 'Cable',     unit: 'lbs',   youtubeId: 'CAwf7n6Luuc', cues: ['Lean back slightly', 'Pull to upper chest', 'Elbows down', 'Stretch at top'],                  description: 'The go-to exercise for building wide lats and V-taper width.' },
  { id: 'seated_row',         name: 'Seated Cable Row',       category: 'back',         muscle: 'Back',      specificMuscle: 'Mid Traps',            difficulty: 'Beginner',     equipment: 'Cable',     unit: 'lbs',   youtubeId: 'GZbfZ033f74', cues: ['Sit tall', 'Row to navel', 'Squeeze rhomboids', 'Full stretch forward'],                    description: 'Develops thickness through the mid-back and rhomboids.' },
  { id: 'db_row',             name: 'Dumbbell Row',           category: 'back',         muscle: 'Back',      specificMuscle: 'Lats',                 difficulty: 'Beginner',     equipment: 'Dumbbell',  unit: 'lbs',   youtubeId: 'pYcpY20QaE8', cues: ['Brace on bench', 'Pull elbow high', 'Neutral spine', 'Full ROM'],                          description: 'Single-arm variation for balanced development and deep stretch.' },
  { id: 'rdl',                name: 'Romanian Deadlift',      category: 'back',         muscle: 'Back',      specificMuscle: 'Hamstrings',           difficulty: 'Intermediate', equipment: 'Barbell',   unit: 'lbs',   youtubeId: '2SHsk9AzdjA', cues: ["Hinge don't squat", 'Bar close to legs', 'Feel hamstring stretch', 'Neutral spine'],        description: 'Best exercise for hamstring length and posterior chain development.' },
  { id: 'goodmorning',        name: 'Good Morning',           category: 'back',         muscle: 'Back',      specificMuscle: 'Lower Back',           difficulty: 'Advanced',     equipment: 'Barbell',   unit: 'lbs',   youtubeId: '6TwPgHE1mFw', cues: ['Bar on traps', 'Hinge forward', 'Soft knee bend', 'Neutral spine always'],                  description: 'Strengthens the entire posterior chain with a powerful hip hinge.' },
  { id: 'tbar_row',           name: 'T-Bar Row',              category: 'back',         muscle: 'Back',      specificMuscle: 'Rhomboids',            difficulty: 'Intermediate', equipment: 'Barbell',   unit: 'lbs',   youtubeId: 'j3ZDDJRoMIE', cues: ['Neutral spine', 'Chest on pad', 'Pull elbows back', 'Squeeze hard at top'],                 description: 'Allows heavy loading with a neutral spine for serious back thickness.' },
  { id: 'face_pull_rear',     name: 'Straight-Arm Pulldown',  category: 'back',         muscle: 'Back',      specificMuscle: 'Lats',                 difficulty: 'Beginner',     equipment: 'Cable',     unit: 'lbs',   youtubeId: 'G_1xFGCGxEk', cues: ['Arms straight', 'Pull to hips', 'Squeeze lats', 'Slow eccentric'],                            description: 'Pure lat isolation keeping the arms straight throughout the movement.' },

  // ── SHOULDERS ──
  { id: 'ohp',                name: 'Overhead Press',         category: 'shoulders',    muscle: 'Shoulders', specificMuscle: 'Front Delt',           difficulty: 'Intermediate', equipment: 'Barbell',   unit: 'lbs',   youtubeId: '2yjwXTZQDDI', cues: ['Bar in front of face', 'Tuck chin', 'Lock out at top', 'Core braced'],                         description: 'The definitive shoulder strength test. Builds width and pressing power.' },
  { id: 'lateral',            name: 'Lateral Raise',          category: 'shoulders',    muscle: 'Shoulders', specificMuscle: 'Side Delt',            difficulty: 'Beginner',     equipment: 'Dumbbell',  unit: 'lbs',   youtubeId: 'yzJ5a4rMb1Q', cues: ['Lead with elbow', 'Slight forward lean', "Don't swing", 'Pour water at top'],               description: 'Isolates the medial delt for that boulder shoulder look and width.' },
  { id: 'cable_lateral',      name: 'Cable Lateral Raise',    category: 'shoulders',    muscle: 'Shoulders', specificMuscle: 'Side Delt',            difficulty: 'Beginner',     equipment: 'Cable',     unit: 'lbs',   youtubeId: '3VcKaXpzqRo', cues: ['Cable at hip', 'Raise across body', 'Lead with elbow', 'Control return'],                    description: 'Constant tension version of lateral raise — better muscle activation throughout.' },
  { id: 'front_raise',        name: 'Front Raise',            category: 'shoulders',    muscle: 'Shoulders', specificMuscle: 'Front Delt',           difficulty: 'Beginner',     equipment: 'Dumbbell',  unit: 'lbs',   youtubeId: 'gkMFyd-bFJM', cues: ['Neutral or pronated grip', 'Raise to shoulder height', 'Control descent', 'No swinging'],    description: 'Targets the anterior deltoid for balanced front delt development.' },
  { id: 'facepull',           name: 'Face Pull',              category: 'shoulders',    muscle: 'Shoulders', specificMuscle: 'Rear Delt',            difficulty: 'Beginner',     equipment: 'Cable',     unit: 'lbs',   youtubeId: 'rep-qVOkqgk', cues: ['Cable at eye level', 'Pull to face', 'External rotation', 'Slow & controlled'],             description: 'Crucial for shoulder health and posterior delt thickness. A must-do.' },
  { id: 'reverse_fly',        name: 'Reverse Dumbbell Fly',   category: 'shoulders',    muscle: 'Shoulders', specificMuscle: 'Rear Delt',            difficulty: 'Beginner',     equipment: 'Dumbbell',  unit: 'lbs',   youtubeId: 'ttvfGg9d76c', cues: ['Hinge forward', 'Arms slightly bent', 'Raise to shoulder height', 'Squeeze rear delt'],     description: 'Best rear delt isolation with dumbbells. Essential for balanced shoulders.' },
  { id: 'shrug',              name: 'Barbell Shrug',          category: 'shoulders',    muscle: 'Shoulders', specificMuscle: 'Traps',                difficulty: 'Beginner',     equipment: 'Barbell',   unit: 'lbs',   youtubeId: 'cJRVVxmytaM', cues: ['Straight up motion', 'No rolling', 'Full elevation', 'Pause at top'],                        description: 'Builds the traps for a powerful, thick upper back look.' },
  { id: 'arnold_press',       name: 'Arnold Press',           category: 'shoulders',    muscle: 'Shoulders', specificMuscle: 'Front Delt',           difficulty: 'Intermediate', equipment: 'Dumbbell',  unit: 'lbs',   youtubeId: 'vj2w851ZHRM', cues: ['Start palms facing you', 'Rotate while pressing', 'Full ROM', 'Control rotation'],           description: 'Created by the GOAT. Hits all three deltoid heads in one movement.' },
  { id: 'upright_row',        name: 'Upright Row',            category: 'shoulders',    muscle: 'Shoulders', specificMuscle: 'Side Delt',            difficulty: 'Intermediate', equipment: 'Barbell',   unit: 'lbs',   youtubeId: 'um3LNfH3vBs', cues: ['Elbows above hands', 'Pull to chin', 'Elbows flare out', 'Control down'],                    description: 'Compound shoulder movement that also recruits the traps and upper back.' },

  // ── ARMS ──
  { id: 'curl',               name: 'Barbell Curl',           category: 'arms',         muscle: 'Arms',      specificMuscle: 'Biceps Short Head',    difficulty: 'Beginner',     equipment: 'Barbell',   unit: 'lbs',   youtubeId: 'kwG2ipFRgfo', cues: ['Elbows fixed', 'Full ROM', 'Squeeze at top', 'No swinging'],                               description: 'The most efficient bicep builder for peak and overall size.' },
  { id: 'incline_curl',       name: 'Incline Dumbbell Curl',  category: 'arms',         muscle: 'Arms',      specificMuscle: 'Biceps Long Head',     difficulty: 'Beginner',     equipment: 'Dumbbell',  unit: 'lbs',   youtubeId: 'MKqbJKgkHFc', cues: ['Sit on incline bench', 'Arms hang back', 'Curl without swinging', 'Supinate at top'],      description: 'The incline position stretches the long head of the bicep for peak development.' },
  { id: 'hammer',             name: 'Hammer Curl',            category: 'arms',         muscle: 'Arms',      specificMuscle: 'Brachialis',           difficulty: 'Beginner',     equipment: 'Dumbbell',  unit: 'lbs',   youtubeId: 'zC3nLlEvin4', cues: ['Neutral grip', 'Elbows fixed', 'Squeeze brachialis', 'Both sides equal'],                    description: 'Builds the brachialis for thick, peaked arms from all angles.' },
  { id: 'preacher_curl',      name: 'Preacher Curl',          category: 'arms',         muscle: 'Arms',      specificMuscle: 'Biceps Short Head',    difficulty: 'Beginner',     equipment: 'Barbell',   unit: 'lbs',   youtubeId: 'fIWP-FRFNU0', cues: ['Arms on pad', 'Full stretch bottom', 'Squeeze at top', 'No momentum'],                      description: 'Eliminates cheating and isolates the biceps for pure peak development.' },
  { id: 'concentration_curl', name: 'Concentration Curl',     category: 'arms',         muscle: 'Arms',      specificMuscle: 'Biceps Long Head',     difficulty: 'Beginner',     equipment: 'Dumbbell',  unit: 'lbs',   youtubeId: 'Jvj2wV0vOYU', cues: ['Elbow on inner thigh', 'Full ROM', 'Supinate at top', 'Squeeze hard'],                      description: "The best isolation move for bicep peak — Arnold's secret weapon." },
  { id: 'cable_curl',         name: 'Cable Curl',             category: 'arms',         muscle: 'Arms',      specificMuscle: 'Biceps Short Head',    difficulty: 'Beginner',     equipment: 'Cable',     unit: 'lbs',   youtubeId: 'NFzTWp4gERM', cues: ['Constant tension', 'Elbows fixed', 'Squeeze at top', 'Slow eccentric'],                       description: 'Cable maintains tension at both ends of the ROM unlike dumbbells.' },
  { id: 'pushdown',           name: 'Tricep Pushdown',        category: 'arms',         muscle: 'Arms',      specificMuscle: 'Triceps Lateral Head', difficulty: 'Beginner',     equipment: 'Cable',     unit: 'lbs',   youtubeId: '2-LAMcpzODU', cues: ['Elbows at sides', 'Push straight down', 'Lockout fully', 'Control return'],                  description: 'The most popular tricep isolation for adding mass to the back of the arms.' },
  { id: 'closebench',         name: 'Close-Grip Bench',       category: 'arms',         muscle: 'Arms',      specificMuscle: 'Triceps Medial Head',  difficulty: 'Intermediate', equipment: 'Barbell',   unit: 'lbs',   youtubeId: 'nEF0bv2FW04', cues: ['Hands shoulder-width', 'Elbows tucked', 'Full ROM', "Don't flare elbows"],                   description: 'A compound tricep movement that also hits chest and builds serious size.' },
  { id: 'skull_crusher',      name: 'Skull Crusher',          category: 'arms',         muscle: 'Arms',      specificMuscle: 'Triceps Long Head',    difficulty: 'Intermediate', equipment: 'Barbell',   unit: 'lbs',   youtubeId: 'NIvZczqo0Ck', cues: ['Bar toward forehead', 'Elbows fixed', 'Full extension', 'Slow controlled'],                   description: 'Maximum stretch on the long head for thick, full tricep development.' },
  { id: 'overhead_tricep',    name: 'Overhead Tricep Ext',    category: 'arms',         muscle: 'Arms',      specificMuscle: 'Triceps Long Head',    difficulty: 'Beginner',     equipment: 'Dumbbell',  unit: 'lbs',   youtubeId: 'YbX7Wd8jQ-Q', cues: ['Arms behind head', 'Keep elbows in', 'Full stretch', 'Squeeze at top'],                     description: 'Long head stretch creates maximum tricep mass in the stretched position.' },
  { id: 'tricep_dips',        name: 'Tricep Dips',            category: 'arms',         muscle: 'Arms',      specificMuscle: 'Triceps Medial Head',  difficulty: 'Beginner',     equipment: 'Bodyweight',unit: 'reps',  youtubeId: 'HcMRbAFAXzQ', cues: ['Hands on bench', 'Body upright', 'Lower 90°', 'Push back up'],                                  description: 'Bodyweight tricep builder you can do anywhere with a bench or chair.' },

  // ── LEGS ──
  { id: 'squat',              name: 'Back Squat',             category: 'legs',         muscle: 'Legs',      specificMuscle: 'Quads',                difficulty: 'Advanced',     equipment: 'Barbell',   unit: 'lbs',   youtubeId: 'ultWZbUMPL8', cues: ['Bar on traps', 'Knees out', 'Depth below parallel', 'Drive through heels'],                  description: 'The king of all exercises. Nothing compares for building leg mass and total strength.' },
  { id: 'front_squat',        name: 'Front Squat',            category: 'legs',         muscle: 'Legs',      specificMuscle: 'Quads',                difficulty: 'Advanced',     equipment: 'Barbell',   unit: 'lbs',   youtubeId: 'm4ytaCJZpl0', cues: ['Bar on front delts', 'Elbows high', 'Upright torso', 'Deep depth'],                           description: 'Quad-dominant squat variation that builds incredible anterior chain strength.' },
  { id: 'legpress',           name: 'Leg Press',              category: 'legs',         muscle: 'Legs',      specificMuscle: 'Quads',                difficulty: 'Beginner',     equipment: 'Machine',   unit: 'lbs',   youtubeId: 'IZxyjW7MPJQ', cues: ['Feet shoulder-width', "Don't lock knees", 'Full ROM', 'Push through heels'],                   description: 'Allows heavy loading for quad mass without the spinal load of squats.' },
  { id: 'lunge',              name: 'Lunges',                 category: 'legs',         muscle: 'Legs',      specificMuscle: 'Quads',                difficulty: 'Beginner',     equipment: 'Bodyweight',unit: 'reps',  youtubeId: 'QOVaHwm-Q6U', cues: ['Step forward', 'Back knee near floor', 'Upright torso', 'Push back to start'],                description: 'Unilateral movement that corrects imbalances and builds functional leg strength.' },
  { id: 'leg_curl',           name: 'Leg Curl',               category: 'legs',         muscle: 'Legs',      specificMuscle: 'Hamstrings',           difficulty: 'Beginner',     equipment: 'Machine',   unit: 'lbs',   youtubeId: '1Tq3QdYUuHs', cues: ['Toes pointed', 'Full contraction', 'Slow eccentric', 'Hips down'],                             description: 'Isolates the hamstrings through full range of motion for complete development.' },
  { id: 'nordics',            name: 'Nordic Curl',            category: 'legs',         muscle: 'Legs',      specificMuscle: 'Hamstrings',           difficulty: 'Advanced',     equipment: 'Bodyweight',unit: 'reps',  youtubeId: 'd4K_pDQCBGs', cues: ['Feet anchored', 'Lower slow', 'Use hands to assist', 'Hamstrings engaged throughout'],        description: 'The most brutal hamstring exercise. Builds injury-resistant hamstring strength.' },
  { id: 'leg_extension',      name: 'Leg Extension',          category: 'legs',         muscle: 'Legs',      specificMuscle: 'Quads',                difficulty: 'Beginner',     equipment: 'Machine',   unit: 'lbs',   youtubeId: 'YyvSfVjQeL0', cues: ['Toes back', 'Full extension', 'Squeeze at top', 'Control descent'],                            description: 'Pure quad isolation for teardrop development and knee joint strength.' },
  { id: 'hip_thrust',         name: 'Hip Thrust',             category: 'legs',         muscle: 'Legs',      specificMuscle: 'Glutes',               difficulty: 'Intermediate', equipment: 'Barbell',   unit: 'lbs',   youtubeId: '8bbE64NuDTU', cues: ['Shoulders on bench', 'Drive hips up', 'Squeeze glutes hard', 'Level pelvis'],                  description: 'The best glute builder, period. Produces more glute activation than any other movement.' },
  { id: 'glute_kickback',     name: 'Cable Glute Kickback',   category: 'legs',         muscle: 'Legs',      specificMuscle: 'Glutes',               difficulty: 'Beginner',     equipment: 'Cable',     unit: 'lbs',   youtubeId: 'LpDJN0KVuaA', cues: ['Ankle strap', 'Slight forward lean', 'Kick back and squeeze', 'Control return'],          description: 'Isolates the glutes without loading the lower back.' },
  { id: 'calf_raise',         name: 'Calf Raise',             category: 'legs',         muscle: 'Legs',      specificMuscle: 'Calves',               difficulty: 'Beginner',     equipment: 'Machine',   unit: 'lbs',   youtubeId: 'gwLzBJYoWlI', cues: ['Full stretch bottom', 'Pause at top', 'Slow tempo', 'Toes forward/out/in'],                   description: 'Building calves requires full range of motion and high volume over time.' },
  { id: 'seated_calf',        name: 'Seated Calf Raise',      category: 'legs',         muscle: 'Legs',      specificMuscle: 'Calves',               difficulty: 'Beginner',     equipment: 'Machine',   unit: 'lbs',   youtubeId: 'JbyjNymZOt0', cues: ['Weight on knees', 'Full bottom stretch', 'Rise onto toes', 'Pause at top'],                  description: 'Targets the soleus — the deeper calf muscle — with a bent knee angle.' },
  { id: 'sumo_deadlift',      name: 'Sumo Deadlift',          category: 'legs',         muscle: 'Legs',      specificMuscle: 'Glutes',               difficulty: 'Advanced',     equipment: 'Barbell',   unit: 'lbs',   youtubeId: 'Qk4P9lh5NwA', cues: ['Wide stance', 'Toes flared', 'Hips hinge to bar', 'Drive knees out'],                          description: 'Wide stance deadlift variation that emphasizes glutes and inner thighs.' },

  // ── CORE ──
  { id: 'plank',              name: 'Plank',                  category: 'core',         muscle: 'Core',      specificMuscle: 'Transverse Abdominis', difficulty: 'Beginner',     equipment: 'Bodyweight',unit: 'sec',   youtubeId: 'ASdvSqZQDkI', cues: ['Straight line', 'Squeeze glutes', 'Pull navel in', "Don't hold breath"],                      description: 'The fundamental core stability exercise. The foundation of all strength.' },
  { id: 'situp',              name: 'Sit-Ups',                category: 'core',         muscle: 'Core',      specificMuscle: 'Upper Abs',            difficulty: 'Beginner',     equipment: 'Bodyweight',unit: 'reps',  youtubeId: 'jDwoBqPH0jk', cues: ['Hands behind head', "Don't pull neck", 'Touch elbows to knees', 'Slow down'],               description: 'Classic ab builder for anterior core strength and definition.' },
  { id: 'hangleg',            name: 'Hanging Leg Raise',      category: 'core',         muscle: 'Core',      specificMuscle: 'Lower Abs',            difficulty: 'Advanced',     equipment: 'Bodyweight',unit: 'reps',  youtubeId: 'Pr1ieGZ5atk', cues: ['Dead hang start', "Don't swing", 'Tuck pelvis', 'Squeeze abs at top'],                    description: 'The best lower ab movement. Requires serious core strength and control.' },
  { id: 'abwheel',            name: 'Ab Wheel',               category: 'core',         muscle: 'Core',      specificMuscle: 'Transverse Abdominis', difficulty: 'Advanced',     equipment: 'Bodyweight',unit: 'reps',  youtubeId: 'j7FTWLs70Bg', cues: ['Start on knees', 'Arms straight', 'Lower slow', 'Pull back with core'],                     description: 'Brutal full-core movement that also hits lats and shoulders.' },
  { id: 'russian_twist',      name: 'Russian Twist',          category: 'core',         muscle: 'Core',      specificMuscle: 'Obliques',             difficulty: 'Beginner',     equipment: 'Bodyweight',unit: 'reps',  youtubeId: 'wkD8rjkodUI', cues: ['Lean back 45°', 'Lift feet', 'Rotate fully', 'Touch floor each side'],                    description: 'Oblique builder for rotational strength and a defined waist.' },
  { id: 'cable_crunch',       name: 'Cable Crunch',           category: 'core',         muscle: 'Core',      specificMuscle: 'Upper Abs',            difficulty: 'Beginner',     equipment: 'Cable',     unit: 'lbs',   youtubeId: 'GtW9HSVUDaI', cues: ['Kneel down', 'Rope at head', 'Crunch down', 'Round spine'],                                  description: 'Allows weighted progression for abs — the key to getting strong, visible abs.' },
  { id: 'side_plank',         name: 'Side Plank',             category: 'core',         muscle: 'Core',      specificMuscle: 'Obliques',             difficulty: 'Beginner',     equipment: 'Bodyweight',unit: 'sec',   youtubeId: 'K2EcGDPNnbU', cues: ['Forearm on ground', 'Hips up', 'Body straight', 'Hold and breathe'],                        description: 'Targets the obliques and lateral core for a strong, stable trunk.' },
  { id: 'dead_bug',           name: 'Dead Bug',               category: 'core',         muscle: 'Core',      specificMuscle: 'Transverse Abdominis', difficulty: 'Beginner',     equipment: 'Bodyweight',unit: 'reps',  youtubeId: 'g_BYB0R-4Ws', cues: ['Lower back pressed down', 'Opposite arm and leg', 'Move slow', 'Breathe out on extend'], description: 'Best exercise for deep core stability and lower back health.' },
  { id: 'leg_raise',          name: 'Lying Leg Raise',        category: 'core',         muscle: 'Core',      specificMuscle: 'Lower Abs',            difficulty: 'Beginner',     equipment: 'Bodyweight',unit: 'reps',  youtubeId: 'l4kQd9eWclE', cues: ['Lower back flat', 'Legs together', 'Lower slow', "Don't touch floor"],                       description: 'Isolated lower ab movement accessible to any fitness level.' },

  // ── CARDIO ──
  { id: 'run',                name: 'Running',                category: 'cardio',       muscle: 'Cardio',    specificMuscle: 'Quads',                difficulty: 'Beginner',     equipment: 'Bodyweight',unit: 'miles', youtubeId: 'kVnyY17VS9Y', cues: ['Midfoot strike', 'Upright posture', 'Relax arms', 'Breathe rhythmically'],                   description: 'The most natural human movement. Builds cardiovascular base and mental toughness.' },
  { id: 'rowing',             name: 'Rowing Machine',         category: 'cardio',       muscle: 'Cardio',    specificMuscle: 'Lats',                 difficulty: 'Intermediate', equipment: 'Machine',   unit: 'miles', youtubeId: 'H0r_SSLL31M', cues: ['Legs first', 'Then lean back', 'Then arms pull', 'Reverse to return'],                        description: 'The ultimate full-body cardio — 86% muscle activation in one machine.' },
  { id: 'jump_rope',          name: 'Jump Rope',              category: 'cardio',       muscle: 'Cardio',    specificMuscle: 'Calves',               difficulty: 'Beginner',     equipment: 'Bodyweight',unit: 'reps',  youtubeId: 'u3zgHI8QnqE', cues: ['Wrists rotate', 'Land on balls of feet', 'Jump low', 'Relax shoulders'],                   description: 'The most efficient cardio tool. Burns more calories than running per minute.' },
  { id: 'burpee',             name: 'Burpees',                category: 'cardio',       muscle: 'Cardio',    specificMuscle: 'Quads',                difficulty: 'Intermediate', equipment: 'Bodyweight',unit: 'reps',  youtubeId: 'qLBImHhCXSw', cues: ['Hands to floor', 'Jump back', 'Push-up optional', 'Jump up with clap'],                     description: 'The complete conditioning exercise. Total body endurance and strength.' },
  { id: 'bike',               name: 'Stationary Bike',        category: 'cardio',       muscle: 'Cardio',    specificMuscle: 'Quads',                difficulty: 'Beginner',     equipment: 'Machine',   unit: 'miles', youtubeId: 'i2caBMBJAAo', cues: ['Seat at hip height', 'Slight knee bend', 'Keep cadence up', 'Core tight'],                   description: 'Low-impact cardio that spares the joints while building serious aerobic capacity.' },
  { id: 'hiit_sprint',        name: 'Sprint Intervals',       category: 'cardio',       muscle: 'Cardio',    specificMuscle: 'Hamstrings',           difficulty: 'Advanced',     equipment: 'Bodyweight',unit: 'reps',  youtubeId: 'Pu7j6KsXm4o', cues: ['Drive knees up', 'Pump arms hard', 'Full effort sprint', 'Walk recovery'],                   description: 'High-intensity intervals for maximum fat burn and conditioning.' },

  // ── OLYMPIC ──
  { id: 'clean',              name: 'Power Clean',            category: 'olympic',      muscle: 'Olympic',   specificMuscle: 'Glutes',               difficulty: 'Advanced',     equipment: 'Barbell',   unit: 'lbs',   youtubeId: 'GwdnBKpNkj8', cues: ['Start like deadlift', 'Triple extension', 'Shrug and pull under', 'Receive in quarter squat'],  description: 'The most explosive barbell movement. Develops total body power and athleticism.' },
  { id: 'snatch',             name: 'Snatch',                 category: 'olympic',      muscle: 'Olympic',   specificMuscle: 'Traps',                difficulty: 'Advanced',     equipment: 'Barbell',   unit: 'lbs',   youtubeId: '9xQp2sldaps', cues: ['Wide grip', 'Bar close throughout', 'Punch under fast', 'Overhead squat catch'],            description: 'The most technical lift in existence. The pinnacle of strength, speed and coordination.' },
  { id: 'clean_jerk',         name: 'Clean & Jerk',           category: 'olympic',      muscle: 'Olympic',   specificMuscle: 'Front Delt',           difficulty: 'Advanced',     equipment: 'Barbell',   unit: 'lbs',   youtubeId: 'iVZRBDInkDE', cues: ['Clean first', 'Reset in front rack', 'Dip and drive', 'Split or push jerk'],                description: "The world's heaviest overhead press, combining strength, technique and explosiveness." },
  { id: 'hang_clean',         name: 'Hang Clean',             category: 'olympic',      muscle: 'Olympic',   specificMuscle: 'Hamstrings',           difficulty: 'Intermediate', equipment: 'Barbell',   unit: 'lbs',   youtubeId: 'lV-8SIOUI6E', cues: ['Start at hips', 'Violent hip extension', 'Shrug and pull under', 'Quarter squat catch'],    description: 'Hang position variation that emphasizes the second pull and hip drive.' },

  // ── CALISTHENICS ──
  { id: 'muscle_up',          name: 'Muscle-Up',              category: 'calisthenics', muscle: 'Calisthenics', specificMuscle: 'Lats',              difficulty: 'Advanced',     equipment: 'Bodyweight',unit: 'reps',  youtubeId: 'abb9AhWzbcQ', cues: ['Explosive pull', 'Lean forward', 'Transition above bar', 'Dip to finish'],                  description: 'The ultimate display of upper body control. Pull-up meets dip in one flow.' },
  { id: 'handstand',          name: 'Handstand Push-Up',      category: 'calisthenics', muscle: 'Calisthenics', specificMuscle: 'Front Delt',        difficulty: 'Advanced',     equipment: 'Bodyweight',unit: 'reps',  youtubeId: 'dBqHBEzQRAA', cues: ['Wall for stability', 'Lock core', 'Head between hands', 'Lower controlled'],                 description: 'Inverted pressing builds elite overhead strength with bodyweight only.' },
  { id: 'pistol',             name: 'Pistol Squat',           category: 'calisthenics', muscle: 'Calisthenics', specificMuscle: 'Quads',             difficulty: 'Advanced',     equipment: 'Bodyweight',unit: 'reps',  youtubeId: 'qDcniqddTeE', cues: ['One leg extended', 'Sit back', 'Knee tracks toe', 'Drive up explosively'],                    description: 'The single-leg squat tests leg strength, balance and mobility simultaneously.' },
  { id: 'dragon_flag',        name: 'Dragon Flag',            category: 'calisthenics', muscle: 'Calisthenics', specificMuscle: 'Lower Abs',         difficulty: 'Advanced',     equipment: 'Bodyweight',unit: 'reps',  youtubeId: 'VoR9zNJ9fT8', cues: ['Hold bench behind head', 'Body straight', 'Lower slow', "Don't touch floor"],                description: "Bruce Lee's signature move. The most demanding core exercise known." },
  { id: 'l_sit',              name: 'L-Sit',                  category: 'calisthenics', muscle: 'Calisthenics', specificMuscle: 'Hip Flexors',       difficulty: 'Advanced',     equipment: 'Bodyweight',unit: 'sec',   youtubeId: '16a529mtX68', cues: ['Press into ground', 'Legs straight out', 'Compress hip flexors', 'Hold position'],           description: 'Brutal combination of core strength and hip flexor compression.' },
  { id: 'ring_dip',           name: 'Ring Dips',              category: 'calisthenics', muscle: 'Calisthenics', specificMuscle: 'Lower Pec',         difficulty: 'Advanced',     equipment: 'Bodyweight',unit: 'reps',  youtubeId: 'nMQHes-mTvc', cues: ['Turn rings out at top', 'Lean forward for chest', 'Control descent', 'Full ROM'],             description: 'Ring instability makes this a serious chest and tricep builder.' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DIFFICULTY_STYLES: Record<string, string> = {
  Beginner:     'bg-green-500/15 text-green-400 border-green-500/20',
  Intermediate: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
  Advanced:     'bg-red-500/15 text-red-400 border-red-500/20',
}

const EQUIPMENT_BODYWEIGHT_IDS = new Set(['Bodyweight', 'None', 'Pull-Up Bar', 'Ab Wheel', 'Jump Rope', 'Bench'])

function matchesEquipment(ex: ExerciseEntry, filter: string) {
  if (filter === 'all') return true
  if (filter === 'Bodyweight') return EQUIPMENT_BODYWEIGHT_IDS.has(ex.equipment) || ex.equipment.includes('Bodyweight')
  if (filter === 'Other') return !['Barbell','Dumbbell','Cable','Machine'].includes(ex.equipment) && !EQUIPMENT_BODYWEIGHT_IDS.has(ex.equipment) && !ex.equipment.includes('Bodyweight')
  return ex.equipment === filter
}

// ─── Filter Pill Row ──────────────────────────────────────────────────────────

function FilterRow<T extends { id: string; label: string }>({
  options, active, onChange,
}: { options: T[]; active: string; onChange: (id: string) => void }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      {options.map(opt => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className={cn(
            'flex-shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
            active === opt.id
              ? 'border-primary/40 bg-primary/10 text-primary'
              : 'border-border bg-secondary/40 text-muted-foreground hover:text-foreground'
          )}
        >
          {'emoji' in opt ? `${(opt as { emoji: string } & T).emoji} ` : ''}{opt.label}
        </button>
      ))}
    </div>
  )
}

// ─── Exercise Card ────────────────────────────────────────────────────────────

function ExerciseCard({ exercise }: { exercise: ExerciseEntry }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className="flex w-full items-center gap-3 p-4 text-left"
      >
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <Dumbbell className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground truncate">{exercise.name}</p>
          <p className="text-xs text-muted-foreground">{exercise.specificMuscle} · {exercise.equipment}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={cn('rounded-full border px-2 py-0.5 text-[10px] font-semibold', DIFFICULTY_STYLES[exercise.difficulty])}>
            {exercise.difficulty}
          </span>
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border px-4 pb-4 pt-3 space-y-3">
          <p className="text-sm text-muted-foreground">{exercise.description}</p>
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase text-muted-foreground">Form Cues</p>
            <div className="flex flex-wrap gap-1.5">
              {exercise.cues.map((cue, i) => (
                <span key={i} className="rounded-lg bg-secondary px-2.5 py-1 text-xs font-medium text-foreground">
                  {cue}
                </span>
              ))}
            </div>
          </div>
          <a
            href={`https://www.youtube.com/watch?v=${exercise.youtubeId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 py-2.5 text-sm font-semibold text-red-400 transition-colors hover:bg-red-500/20"
          >
            ▶ Watch Tutorial
          </a>
        </div>
      )}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

type FilterMode = 'equipment' | 'muscle' | 'specific'

export function ExercisesPage() {
  const [search, setSearch]               = useState('')
  const [filterMode, setFilterMode]       = useState<FilterMode>('muscle')
  const [equipFilter, setEquipFilter]     = useState('all')
  const [muscleFilter, setMuscleFilter]   = useState('all')
  const [specificFilter, setSpecificFilter] = useState('all')

  const filtered = useMemo(() => {
    return ALL_EXERCISES.filter(ex => {
      const matchSearch =
        !search ||
        ex.name.toLowerCase().includes(search.toLowerCase()) ||
        ex.specificMuscle.toLowerCase().includes(search.toLowerCase()) ||
        ex.muscle.toLowerCase().includes(search.toLowerCase()) ||
        ex.equipment.toLowerCase().includes(search.toLowerCase())

      const matchEquip   = filterMode === 'equipment' ? matchesEquipment(ex, equipFilter)                               : true
      const matchMuscle  = filterMode === 'muscle'    ? (muscleFilter   === 'all' || ex.category === muscleFilter)      : true
      const matchSpecific = filterMode === 'specific' ? (specificFilter === 'all' || ex.specificMuscle === specificFilter) : true

      return matchSearch && matchEquip && matchMuscle && matchSpecific
    })
  }, [search, filterMode, equipFilter, muscleFilter, specificFilter])

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search exercises, muscles, equipment..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="h-11 w-full rounded-xl border border-border bg-secondary/60 pl-9 pr-9 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        {search && (
          <button type="button" onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Filter mode tabs */}
      <div className="flex gap-2 rounded-2xl bg-secondary/60 p-1">
        {(['equipment', 'muscle', 'specific'] as FilterMode[]).map(mode => (
          <button
            key={mode}
            type="button"
            onClick={() => setFilterMode(mode)}
            className={cn(
              'flex-1 rounded-xl py-2 text-xs font-semibold capitalize transition-colors',
              filterMode === mode ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
            )}
          >
            {mode === 'specific' ? 'Specific' : mode === 'muscle' ? 'Muscle Group' : 'Equipment'}
          </button>
        ))}
      </div>

      {/* Filter chips */}
      {filterMode === 'equipment' && (
        <FilterRow options={EQUIPMENT_FILTERS} active={equipFilter} onChange={setEquipFilter} />
      )}
      {filterMode === 'muscle' && (
        <FilterRow options={MUSCLE_GROUP_FILTERS} active={muscleFilter} onChange={setMuscleFilter} />
      )}
      {filterMode === 'specific' && (
        <FilterRow options={SPECIFIC_MUSCLE_FILTERS} active={specificFilter} onChange={setSpecificFilter} />
      )}

      {/* Count */}
      <p className="text-xs text-muted-foreground">
        {filtered.length} exercise{filtered.length !== 1 ? 's' : ''}
      </p>

      {/* List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            <p className="font-semibold text-foreground">No exercises found</p>
            <p className="mt-1 text-sm text-muted-foreground">Try a different search or filter</p>
          </div>
        ) : (
          filtered.map(ex => <ExerciseCard key={ex.id} exercise={ex} />)
        )}
      </div>
    </div>
  )
}