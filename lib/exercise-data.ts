import { Exercise } from './types'

export interface ExerciseCategory {
  id: string
  name: string
  icon: string
  color: string
  exercises: Omit<Exercise, 'id' | 'sets' | 'reps'>[]
}

export const EXERCISE_CATEGORIES: ExerciseCategory[] = [
  {
    id: 'chest',
    name: 'Chest',
    icon: '💪',
    color: '#ef4444',
    exercises: [
      { name: 'Bench Press', category: 'chest', imageUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=100&h=100&fit=crop' },
      { name: 'Incline Dumbbell Press', category: 'chest', imageUrl: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=100&h=100&fit=crop' },
      { name: 'Decline Bench Press', category: 'chest', imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=100&h=100&fit=crop' },
      { name: 'Cable Flyes', category: 'chest', imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=100&h=100&fit=crop' },
      { name: 'Dumbbell Flyes', category: 'chest', imageUrl: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=100&h=100&fit=crop' },
      { name: 'Push-ups', category: 'chest', imageUrl: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=100&h=100&fit=crop' },
      { name: 'Chest Dips', category: 'chest', imageUrl: 'https://images.unsplash.com/photo-1597452485669-2c7bb5fef90d?w=100&h=100&fit=crop' },
      { name: 'Pec Deck Machine', category: 'chest', imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=100&h=100&fit=crop' },
    ],
  },
  {
    id: 'back',
    name: 'Back',
    icon: '🦾',
    color: '#3b82f6',
    exercises: [
      { name: 'Deadlift', category: 'back', imageUrl: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=100&h=100&fit=crop' },
      { name: 'Lat Pulldown', category: 'back', imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=100&h=100&fit=crop' },
      { name: 'Barbell Row', category: 'back', imageUrl: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=100&h=100&fit=crop' },
      { name: 'Seated Cable Row', category: 'back', imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=100&h=100&fit=crop' },
      { name: 'Pull-ups', category: 'back', imageUrl: 'https://images.unsplash.com/photo-1597452485669-2c7bb5fef90d?w=100&h=100&fit=crop' },
      { name: 'T-Bar Row', category: 'back', imageUrl: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=100&h=100&fit=crop' },
      { name: 'Single Arm Dumbbell Row', category: 'back', imageUrl: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=100&h=100&fit=crop' },
      { name: 'Face Pulls', category: 'back', imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=100&h=100&fit=crop' },
    ],
  },
  {
    id: 'shoulders',
    name: 'Shoulders',
    icon: '🎯',
    color: '#f97316',
    exercises: [
      { name: 'Overhead Press', category: 'shoulders', imageUrl: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=100&h=100&fit=crop' },
      { name: 'Lateral Raises', category: 'shoulders', imageUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c149a?w=100&h=100&fit=crop' },
      { name: 'Front Raises', category: 'shoulders', imageUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c149a?w=100&h=100&fit=crop' },
      { name: 'Arnold Press', category: 'shoulders', imageUrl: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=100&h=100&fit=crop' },
      { name: 'Rear Delt Flyes', category: 'shoulders', imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=100&h=100&fit=crop' },
      { name: 'Shrugs', category: 'shoulders', imageUrl: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=100&h=100&fit=crop' },
      { name: 'Upright Rows', category: 'shoulders', imageUrl: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=100&h=100&fit=crop' },
      { name: 'Cable Lateral Raises', category: 'shoulders', imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=100&h=100&fit=crop' },
    ],
  },
  {
    id: 'arms',
    name: 'Arms',
    icon: '💪',
    color: '#8b5cf6',
    exercises: [
      { name: 'Barbell Curl', category: 'arms', imageUrl: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=100&h=100&fit=crop' },
      { name: 'Hammer Curls', category: 'arms', imageUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c149a?w=100&h=100&fit=crop' },
      { name: 'Tricep Pushdowns', category: 'arms', imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=100&h=100&fit=crop' },
      { name: 'Skull Crushers', category: 'arms', imageUrl: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=100&h=100&fit=crop' },
      { name: 'Preacher Curls', category: 'arms', imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=100&h=100&fit=crop' },
      { name: 'Overhead Tricep Extension', category: 'arms', imageUrl: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=100&h=100&fit=crop' },
      { name: 'Concentration Curls', category: 'arms', imageUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c149a?w=100&h=100&fit=crop' },
      { name: 'Dips', category: 'arms', imageUrl: 'https://images.unsplash.com/photo-1597452485669-2c7bb5fef90d?w=100&h=100&fit=crop' },
    ],
  },
  {
    id: 'legs',
    name: 'Legs',
    icon: '🦵',
    color: '#22c55e',
    exercises: [
      { name: 'Squat', category: 'legs', imageUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=100&h=100&fit=crop' },
      { name: 'Romanian Deadlift', category: 'legs', imageUrl: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=100&h=100&fit=crop' },
      { name: 'Leg Press', category: 'legs', imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=100&h=100&fit=crop' },
      { name: 'Leg Curl', category: 'legs', imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=100&h=100&fit=crop' },
      { name: 'Leg Extension', category: 'legs', imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=100&h=100&fit=crop' },
      { name: 'Lunges', category: 'legs', imageUrl: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=100&h=100&fit=crop' },
      { name: 'Calf Raises', category: 'legs', imageUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=100&h=100&fit=crop' },
      { name: 'Hip Thrust', category: 'legs', imageUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=100&h=100&fit=crop' },
    ],
  },
  {
    id: 'abs',
    name: 'Abs',
    icon: '🔥',
    color: '#eab308',
    exercises: [
      { name: 'Crunches', category: 'abs', imageUrl: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=100&h=100&fit=crop' },
      { name: 'Plank', category: 'abs', imageUrl: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=100&h=100&fit=crop' },
      { name: 'Hanging Leg Raise', category: 'abs', imageUrl: 'https://images.unsplash.com/photo-1597452485669-2c7bb5fef90d?w=100&h=100&fit=crop' },
      { name: 'Russian Twists', category: 'abs', imageUrl: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=100&h=100&fit=crop' },
      { name: 'Ab Wheel Rollout', category: 'abs', imageUrl: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=100&h=100&fit=crop' },
      { name: 'Cable Crunches', category: 'abs', imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=100&h=100&fit=crop' },
      { name: 'Mountain Climbers', category: 'abs', imageUrl: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=100&h=100&fit=crop' },
      { name: 'Dead Bug', category: 'abs', imageUrl: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=100&h=100&fit=crop' },
    ],
  },
  {
    id: 'cardio',
    name: 'Cardio',
    icon: '🏃',
    color: '#06b6d4',
    exercises: [
      { name: 'Treadmill Run', category: 'cardio', imageUrl: 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=100&h=100&fit=crop' },
      { name: 'Cycling', category: 'cardio', imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=100&h=100&fit=crop' },
      { name: 'Rowing Machine', category: 'cardio', imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=100&h=100&fit=crop' },
      { name: 'Jump Rope', category: 'cardio', imageUrl: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=100&h=100&fit=crop' },
      { name: 'Stair Climber', category: 'cardio', imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=100&h=100&fit=crop' },
      { name: 'Elliptical', category: 'cardio', imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=100&h=100&fit=crop' },
      { name: 'HIIT Circuit', category: 'cardio', imageUrl: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=100&h=100&fit=crop' },
      { name: 'Battle Ropes', category: 'cardio', imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=100&h=100&fit=crop' },
    ],
  },
]

export const DEFAULT_WORKOUT_SPLIT: import('./types').WorkoutDay[] = [
  {
    day: 'Monday',
    shortDay: 'Mon',
    name: 'Push - Chest & Triceps',
    color: '#ef4444',
    exercises: [
      { id: '1', name: 'Bench Press', category: 'chest', sets: 4, reps: '8-10', imageUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=100&h=100&fit=crop' },
      { id: '2', name: 'Incline Dumbbell Press', category: 'chest', sets: 3, reps: '10-12', imageUrl: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=100&h=100&fit=crop' },
      { id: '3', name: 'Cable Flyes', category: 'chest', sets: 3, reps: '12-15', imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=100&h=100&fit=crop' },
      { id: '4', name: 'Tricep Pushdowns', category: 'arms', sets: 3, reps: '12-15', imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=100&h=100&fit=crop' },
    ],
  },
  {
    day: 'Tuesday',
    shortDay: 'Tue',
    name: 'Pull - Back & Biceps',
    color: '#3b82f6',
    exercises: [
      { id: '5', name: 'Deadlift', category: 'back', sets: 4, reps: '6-8', imageUrl: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=100&h=100&fit=crop' },
      { id: '6', name: 'Lat Pulldown', category: 'back', sets: 4, reps: '10-12', imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=100&h=100&fit=crop' },
      { id: '7', name: 'Barbell Row', category: 'back', sets: 3, reps: '10-12', imageUrl: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=100&h=100&fit=crop' },
      { id: '8', name: 'Barbell Curl', category: 'arms', sets: 3, reps: '10-12', imageUrl: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=100&h=100&fit=crop' },
    ],
  },
  {
    day: 'Wednesday',
    shortDay: 'Wed',
    name: 'Legs',
    color: '#22c55e',
    exercises: [
      { id: '9', name: 'Squat', category: 'legs', sets: 4, reps: '8-10', imageUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=100&h=100&fit=crop' },
      { id: '10', name: 'Romanian Deadlift', category: 'legs', sets: 3, reps: '10-12', imageUrl: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=100&h=100&fit=crop' },
      { id: '11', name: 'Leg Press', category: 'legs', sets: 3, reps: '12-15', imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=100&h=100&fit=crop' },
      { id: '12', name: 'Calf Raises', category: 'legs', sets: 4, reps: '15-20', imageUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=100&h=100&fit=crop' },
    ],
  },
  {
    day: 'Thursday',
    shortDay: 'Thu',
    name: 'Shoulders & Arms',
    color: '#f97316',
    exercises: [
      { id: '13', name: 'Overhead Press', category: 'shoulders', sets: 4, reps: '8-10', imageUrl: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=100&h=100&fit=crop' },
      { id: '14', name: 'Lateral Raises', category: 'shoulders', sets: 4, reps: '12-15', imageUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c149a?w=100&h=100&fit=crop' },
      { id: '15', name: 'Hammer Curls', category: 'arms', sets: 3, reps: '10-12', imageUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c149a?w=100&h=100&fit=crop' },
      { id: '16', name: 'Skull Crushers', category: 'arms', sets: 3, reps: '10-12', imageUrl: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=100&h=100&fit=crop' },
    ],
  },
  {
    day: 'Friday',
    shortDay: 'Fri',
    name: 'Full Body',
    color: '#8b5cf6',
    exercises: [
      { id: '17', name: 'Barbell Row', category: 'back', sets: 4, reps: '8-10', imageUrl: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=100&h=100&fit=crop' },
      { id: '18', name: 'Bench Press', category: 'chest', sets: 3, reps: '10-12', imageUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=100&h=100&fit=crop' },
      { id: '19', name: 'Lunges', category: 'legs', sets: 3, reps: '12 each', imageUrl: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=100&h=100&fit=crop' },
      { id: '20', name: 'Plank', category: 'abs', sets: 3, reps: '60 sec', imageUrl: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=100&h=100&fit=crop' },
    ],
  },
  {
    day: 'Saturday',
    shortDay: 'Sat',
    name: 'Active Recovery',
    color: '#06b6d4',
    exercises: [
      { id: '21', name: 'Treadmill Run', category: 'cardio', sets: 1, reps: '20 min', imageUrl: 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=100&h=100&fit=crop' },
    ],
  },
  {
    day: 'Sunday',
    shortDay: 'Sun',
    name: 'Rest Day',
    color: '#6b7280',
    exercises: [],
  },
]
