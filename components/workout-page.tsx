'use client'

import { useState } from 'react'
import { Plus, Trash2, X, Search, ChevronLeft, Edit3, Check, Play, BookOpen } from 'lucide-react'
import { useApp } from '@/lib/app-context'
import { EXERCISE_CATEGORIES } from '@/lib/exercise-data'
import { ExerciseGuideModal } from '@/components/exercise-guide-modal'
import { cn } from '@/lib/utils'

export function WorkoutPage({ embedded = false, onStartSession }: { embedded?: boolean; onStartSession?: (day: import('@/lib/types').WorkoutDay) => void }) {
  const { workoutSplit, addExerciseToDay, removeExerciseFromDay, updateExercise } = useApp()
  const [showLibrary, setShowLibrary] = useState(false)
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showManualEntry, setShowManualEntry] = useState(false)
  const [manualName, setManualName] = useState('')
  const [editingExercise, setEditingExercise] = useState<{ dayIndex: number; exerciseId: string } | null>(null)
  const [editSets, setEditSets] = useState('')
  const [editReps, setEditReps] = useState('')
  const [guideExercise, setGuideExercise] = useState<string | null>(null)

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' })

  const openLibrary = (dayIndex: number) => {
    setSelectedDayIndex(dayIndex)
    setShowLibrary(true)
    setSelectedCategory(null)
    setSearchQuery('')
  }

  const closeLibrary = () => {
    setShowLibrary(false)
    setSelectedDayIndex(null)
    setSelectedCategory(null)
    setSearchQuery('')
    setShowManualEntry(false)
    setManualName('')
  }

  const addExercise = (name: string, category: string, imageUrl: string) => {
    if (selectedDayIndex === null) return
    const newExercise = {
      id: Date.now().toString(),
      name,
      category,
      sets: 3,
      reps: '10-12',
      imageUrl,
    }
    addExerciseToDay(selectedDayIndex, newExercise)
    closeLibrary()
  }

  const addManualExercise = () => {
    if (selectedDayIndex === null || !manualName.trim()) return
    addExercise(
      manualName.trim(),
      'custom',
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=100&h=100&fit=crop'
    )
  }

  const startEditing = (dayIndex: number, exerciseId: string, sets: number, reps: string) => {
    setEditingExercise({ dayIndex, exerciseId })
    setEditSets(sets.toString())
    setEditReps(reps)
  }

  const saveEdit = () => {
    if (!editingExercise) return
    updateExercise(editingExercise.dayIndex, editingExercise.exerciseId, {
      sets: parseInt(editSets) || 3,
      reps: editReps || '10-12',
    })
    setEditingExercise(null)
  }

  const filteredExercises = selectedCategory
    ? EXERCISE_CATEGORIES.find(c => c.id === selectedCategory)?.exercises.filter(e =>
        e.name.toLowerCase().includes(searchQuery.toLowerCase())
      ) || []
    : []

  if (showLibrary) {
    return (
      <div className="fixed inset-0 z-50 bg-background">
        <div className="flex h-full flex-col">
          <div className="flex items-center gap-3 border-b border-border px-4 py-4">
            <button
              onClick={selectedCategory ? () => setSelectedCategory(null) : closeLibrary}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-bold">
              {selectedCategory
                ? EXERCISE_CATEGORIES.find(c => c.id === selectedCategory)?.name
                : 'Exercise Library'}
            </h1>
          </div>

          {selectedCategory && (
            <div className="border-b border-border px-4 py-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search exercises..."
                  className="w-full rounded-xl bg-secondary py-3 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4">
            {!selectedCategory ? (
              <div className="grid grid-cols-2 gap-3">
                {EXERCISE_CATEGORIES.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-card p-6 transition-colors hover:bg-secondary"
                  >
                    <span className="text-3xl">{category.icon}</span>
                    <span className="font-semibold text-foreground">{category.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {category.exercises.length} exercises
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredExercises.map((exercise) => (
                  <div
                    key={exercise.name}
                    className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-3"
                  >
                    <img
                      src={exercise.imageUrl}
                      alt={exercise.name}
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                    <span className="flex-1 text-left font-medium text-foreground">
                      {exercise.name}
                    </span>
                    <button
                      onClick={() => setGuideExercise(exercise.name)}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-muted-foreground hover:text-primary"
                    >
                      <BookOpen className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => addExercise(exercise.name, exercise.category, exercise.imageUrl)}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500"
                    >
                      <Plus className="h-4 w-4 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedCategory && (
            <div className="border-t border-border p-4">
              {showManualEntry ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualName}
                    onChange={e => setManualName(e.target.value)}
                    placeholder="Exercise name..."
                    className="flex-1 rounded-xl bg-secondary px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    autoFocus
                  />
                  <button
                    onClick={addManualExercise}
                    disabled={!manualName.trim()}
                    className="rounded-xl bg-green-500 px-4 py-3 font-medium text-white disabled:opacity-50"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => { setShowManualEntry(false); setManualName('') }}
                    className="rounded-xl bg-secondary px-4 py-3"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowManualEntry(true)}
                  className="w-full rounded-xl border border-dashed border-border py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary"
                >
                  + Enter Manually
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', embedded ? 'pb-4' : 'pb-20')}>
      {!embedded && (
        <>
          <h1 className="text-2xl font-bold text-foreground">Workout Split</h1>
          <p className="text-sm text-muted-foreground">Your weekly training schedule</p>
        </>
      )}

      <div className="space-y-4">
        {workoutSplit.map((day, dayIndex) => {
          const isToday = day.day === today

          return (
            <div
              key={day.day}
              className={cn(
                'overflow-hidden rounded-2xl border bg-card',
                isToday ? 'border-primary' : 'border-border'
              )}
            >
              <div className="flex items-center gap-3 p-4">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl text-sm font-bold text-white"
                  style={{ backgroundColor: day.color }}
                >
                  {day.shortDay}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground">{day.day}</p>
                    {isToday && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        Today
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{day.name}</p>
                </div>
              </div>

              {day.exercises.length > 0 && (
                <div className="border-t border-border px-4 pb-3">
                  <div className="divide-y divide-border">
                    {day.exercises.map(exercise => {
                      const isEditing =
                        editingExercise?.dayIndex === dayIndex &&
                        editingExercise?.exerciseId === exercise.id

                      return (
                        <div key={exercise.id} className="flex items-center gap-3 py-3">
                          <img
                            src={exercise.imageUrl}
                            alt={exercise.name}
                            className="h-10 w-10 rounded-lg object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">{exercise.name}</p>
                            {isEditing ? (
                              <div className="flex items-center gap-2 mt-1">
                                <input
                                  type="number"
                                  value={editSets}
                                  onChange={e => setEditSets(e.target.value)}
                                  className="w-12 rounded bg-secondary px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                                  placeholder="Sets"
                                />
                                <span className="text-xs text-muted-foreground">x</span>
                                <input
                                  type="text"
                                  value={editReps}
                                  onChange={e => setEditReps(e.target.value)}
                                  className="w-16 rounded bg-secondary px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                                  placeholder="Reps"
                                />
                                <button
                                  onClick={saveEdit}
                                  className="flex h-6 w-6 items-center justify-center rounded bg-green-500 text-white"
                                >
                                  <Check className="h-3 w-3" />
                                </button>
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground">
                                {exercise.sets} sets x {exercise.reps}
                              </p>
                            )}
                          </div>
                          {!isEditing && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => setGuideExercise(exercise.name)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
                              >
                                <BookOpen className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => startEditing(dayIndex, exercise.id, exercise.sets, exercise.reps)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => removeExerciseFromDay(dayIndex, exercise.id)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {day.exercises.length === 0 && day.name !== 'Rest Day' && (
                <div className="border-t border-border px-4 py-4">
                  <p className="text-center text-sm text-muted-foreground">No exercises yet</p>
                </div>
              )}

              {day.name === 'Rest Day' && (
                <div className="border-t border-border px-4 py-4">
                  <p className="text-center text-sm text-muted-foreground">Take a well-deserved rest!</p>
                </div>
              )}

              {day.name !== 'Rest Day' && (
                <div className="flex gap-2 px-4 pb-4">
                  {onStartSession && (
                    <button
                      onClick={() => onStartSession(day)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                      <Play className="h-4 w-4 fill-primary-foreground" />
                      Start
                    </button>
                  )}
                  <button
                    onClick={() => openLibrary(dayIndex)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-500 py-3 font-medium text-white transition-colors hover:bg-green-600"
                  >
                    <Plus className="h-4 w-4" />
                    Add Exercise
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Form Guide Modal */}
      <ExerciseGuideModal
        exerciseName={guideExercise ?? ''}
        open={guideExercise !== null}
        onClose={() => setGuideExercise(null)}
      />
    </div>
  )
}