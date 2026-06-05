'use client'

import { useState, useRef, useCallback } from 'react'
import { useApp } from '@/lib/app-context'
import { supabase } from '@/lib/supabase'
import { Camera, Plus, X, ChevronLeft, ChevronRight, Trash2, SlidersHorizontal, ImageOff, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

// ─── Types ────────────────────────────────────────────────────────────────────

type PhotoAngle = 'front' | 'side' | 'back'

interface ProgressPhoto {
  id: string
  url: string
  angle: PhotoAngle
  date: string        // ISO date string YYYY-MM-DD
  note?: string
  weight?: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function groupByDate(photos: ProgressPhoto[]): Record<string, ProgressPhoto[]> {
  return photos.reduce((acc, p) => {
    acc[p.date] = acc[p.date] ? [...acc[p.date], p] : [p]
    return acc
  }, {} as Record<string, ProgressPhoto[]>)
}

const ANGLE_LABELS: Record<PhotoAngle, string> = { front: 'Front', side: 'Side', back: 'Back' }
const ANGLE_ORDER: PhotoAngle[] = ['front', 'side', 'back']

// ─── Compare Slider ───────────────────────────────────────────────────────────

function CompareSlider({ before, after }: { before: string; after: string }) {
  const [pos, setPos] = useState(50)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100))
    setPos(pct)
  }, [])

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden cursor-col-resize select-none touch-none"
      onMouseMove={e => handleMove(e.clientX)}
      onTouchMove={e => handleMove(e.touches[0].clientX)}
    >
      {/* After (right) */}
      <img src={after} alt="After" className="absolute inset-0 w-full h-full object-cover" />

      {/* Before (left, clipped) */}
      <div className="absolute inset-0 overflow-hidden" style={{ width: `${pos}%` }}>
        <img src={before} alt="Before" className="absolute inset-0 w-full h-full object-cover" style={{ width: `${100 / (pos / 100)}%` }} />
      </div>

      {/* Divider */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg"
        style={{ left: `${pos}%` }}
      >
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center">
          <SlidersHorizontal className="w-4 h-4 text-black" />
        </div>
      </div>

      {/* Labels */}
      <div className="absolute bottom-3 left-3 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded-lg">BEFORE</div>
      <div className="absolute bottom-3 right-3 bg-primary/80 text-white text-xs font-bold px-2 py-1 rounded-lg">AFTER</div>
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function ProgressPhotosPage() {
  const { user, settings } = useApp()

  const [photos, setPhotos] = useState<ProgressPhoto[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [view, setView] = useState<'gallery' | 'compare' | 'add'>('gallery')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  // Add photo form state
  const [newAngle, setNewAngle] = useState<PhotoAngle>('front')
  const [newNote, setNewNote] = useState('')
  const [newWeight, setNewWeight] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Compare state
  const [compareAngle, setCompareAngle] = useState<PhotoAngle>('front')

  // Lightbox
  const [lightbox, setLightbox] = useState<ProgressPhoto | null>(null)

  // ── Load photos from Supabase ────────────────────────────────────────────

  const loadPhotos = useCallback(async () => {
    if (!user || isLoaded) return
    const { data, error } = await supabase
      .from('progress_photos')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })

    if (!error && data) {
      setPhotos(data.map(row => ({
        id: row.id,
        url: row.url,
        angle: row.angle as PhotoAngle,
        date: row.date,
        note: row.note ?? undefined,
        weight: row.weight ?? undefined,
      })))
    }
    setIsLoaded(true)
  }, [user, isLoaded])

  // Load on first render
  if (!isLoaded && user) loadPhotos()

  // ── Upload handler ───────────────────────────────────────────────────────

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPendingFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    setUploadError(null)
  }

  const handleUpload = async () => {
    if (!pendingFile || !user) return
    setUploading(true)
    setUploadError(null)

    try {
      const ext = pendingFile.name.split('.').pop() ?? 'jpg'
      const path = `${user.id}/${Date.now()}.${ext}`

      const { error: storageError } = await supabase.storage
        .from('progress-photos')
        .upload(path, pendingFile, { upsert: false })

      if (storageError) throw storageError

      const { data: urlData } = supabase.storage.from('progress-photos').getPublicUrl(path)
      const publicUrl = urlData.publicUrl

      const today = new Date().toISOString().split('T')[0]
      const { data: row, error: dbError } = await supabase
        .from('progress_photos')
        .insert({
          user_id: user.id,
          url: publicUrl,
          angle: newAngle,
          date: today,
          note: newNote.trim() || null,
          weight: newWeight ? parseFloat(newWeight) : null,
        })
        .select()
        .single()

      if (dbError) throw dbError

      setPhotos(prev => [{
        id: row.id,
        url: row.url,
        angle: row.angle,
        date: row.date,
        note: row.note ?? undefined,
        weight: row.weight ?? undefined,
      }, ...prev])

      // Reset form
      setPendingFile(null)
      setPreviewUrl(null)
      setNewNote('')
      setNewWeight('')
      setView('gallery')
    } catch (err: any) {
      setUploadError(err.message ?? 'Upload failed. Try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (photo: ProgressPhoto) => {
    if (!user) return
    await supabase.from('progress_photos').delete().eq('id', photo.id)
    setPhotos(prev => prev.filter(p => p.id !== photo.id))
    if (lightbox?.id === photo.id) setLightbox(null)
  }

  // ── Derived data ─────────────────────────────────────────────────────────

  const grouped = groupByDate(photos)
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  const photosByAngle = (angle: PhotoAngle) =>
    photos.filter(p => p.angle === angle).sort((a, b) => a.date.localeCompare(b.date))

  const comparePhotos = photosByAngle(compareAngle)
  const beforePhoto = comparePhotos[0]
  const afterPhoto = comparePhotos[comparePhotos.length - 1]

  // ── Add Photo View ────────────────────────────────────────────────────────

  if (view === 'add') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-5 pb-24"
      >
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => { setView('gallery'); setPreviewUrl(null); setPendingFile(null) }}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-card border border-border">
            <ChevronLeft className="h-5 w-5 text-muted-foreground" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-foreground">Add Progress Photo</h2>
            <p className="text-xs text-muted-foreground">Track your transformation</p>
          </div>
        </div>

        {/* Photo picker */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'relative w-full aspect-[3/4] rounded-2xl border-2 border-dashed flex items-center justify-center cursor-pointer overflow-hidden transition-colors',
            previewUrl ? 'border-transparent' : 'border-border hover:border-primary/50 bg-card'
          )}
        >
          {previewUrl ? (
            <>
              <img src={previewUrl} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <Camera className="h-8 w-8 text-white" />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Camera className="h-7 w-7 text-primary" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-foreground text-sm">Tap to add photo</p>
                <p className="text-xs">Camera or gallery</p>
              </div>
            </div>
          )}
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" capture="environment"
          className="hidden" onChange={handleFileSelect} />

        {/* Angle selector */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Angle</p>
          <div className="flex gap-2">
            {ANGLE_ORDER.map(a => (
              <button key={a} type="button" onClick={() => setNewAngle(a)}
                className={cn(
                  'flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all',
                  newAngle === a
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card text-muted-foreground border-border hover:border-primary/50'
                )}>
                {ANGLE_LABELS[a]}
              </button>
            ))}
          </div>
        </div>

        {/* Weight */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Weight (optional)
          </p>
          <div className="flex items-center gap-2 rounded-xl bg-card border border-border px-4 py-3">
            <input
              type="number"
              placeholder={`e.g. ${settings.weight}`}
              value={newWeight}
              onChange={e => setNewWeight(e.target.value)}
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
            <span className="text-xs text-muted-foreground font-medium">
              {settings.gender === 'male' ? 'lbs' : 'lbs'}
            </span>
          </div>
        </div>

        {/* Note */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Note (optional)
          </p>
          <textarea
            placeholder="How are you feeling? Any milestones?"
            value={newNote}
            onChange={e => setNewNote(e.target.value)}
            rows={2}
            className="w-full rounded-xl bg-card border border-border px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none focus:border-primary/50"
          />
        </div>

        {uploadError && (
          <p className="text-sm text-red-500 text-center">{uploadError}</p>
        )}

        <button
          type="button"
          disabled={!pendingFile || uploading}
          onClick={handleUpload}
          className={cn(
            'w-full py-4 rounded-2xl font-bold text-sm transition-all',
            pendingFile && !uploading
              ? 'bg-primary text-primary-foreground active:scale-95'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          )}
        >
          {uploading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading…
            </span>
          ) : 'Save Photo'}
        </button>
      </motion.div>
    )
  }

  // ── Compare View ──────────────────────────────────────────────────────────

  if (view === 'compare') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-5 pb-24"
      >
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setView('gallery')}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-card border border-border">
            <ChevronLeft className="h-5 w-5 text-muted-foreground" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-foreground">Before & After</h2>
            <p className="text-xs text-muted-foreground">Drag the slider to compare</p>
          </div>
        </div>

        {/* Angle tabs */}
        <div className="flex gap-2">
          {ANGLE_ORDER.map(a => (
            <button key={a} type="button" onClick={() => setCompareAngle(a)}
              className={cn(
                'flex-1 py-2 rounded-xl text-xs font-semibold border transition-all',
                compareAngle === a
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card text-muted-foreground border-border'
              )}>
              {ANGLE_LABELS[a]}
            </button>
          ))}
        </div>

        {beforePhoto && afterPhoto && beforePhoto.id !== afterPhoto.id ? (
          <>
            <CompareSlider before={beforePhoto.url} after={afterPhoto.url} />
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-card border border-border p-3 text-center">
                <p className="text-xs text-muted-foreground">Start</p>
                <p className="font-bold text-sm text-foreground">{formatDate(beforePhoto.date)}</p>
                {beforePhoto.weight && <p className="text-xs text-primary font-semibold">{beforePhoto.weight} lbs</p>}
              </div>
              <div className="rounded-xl bg-card border border-border p-3 text-center">
                <p className="text-xs text-muted-foreground">Now</p>
                <p className="font-bold text-sm text-foreground">{formatDate(afterPhoto.date)}</p>
                {afterPhoto.weight && <p className="text-xs text-primary font-semibold">{afterPhoto.weight} lbs</p>}
              </div>
            </div>
            {beforePhoto.weight && afterPhoto.weight && (
              <div className="rounded-2xl bg-primary/10 border border-primary/20 p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Total Change</p>
                <p className={cn(
                  'text-2xl font-black',
                  afterPhoto.weight < beforePhoto.weight ? 'text-green-400' : 'text-red-400'
                )}>
                  {afterPhoto.weight < beforePhoto.weight ? '−' : '+'}
                  {Math.abs(afterPhoto.weight - beforePhoto.weight).toFixed(1)} lbs
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
            <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
              <ImageOff className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Not enough photos</p>
              <p className="text-sm text-muted-foreground mt-1">
                Add at least 2 {ANGLE_LABELS[compareAngle].toLowerCase()} photos to compare
              </p>
            </div>
            <button type="button" onClick={() => setView('add')}
              className="px-6 py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-bold">
              Add Photo
            </button>
          </div>
        )}
      </motion.div>
    )
  }

  // ── Gallery View ──────────────────────────────────────────────────────────

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-5 pb-24"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Progress Photos</h2>
          <p className="text-xs text-muted-foreground">
            {photos.length === 0 ? 'Start tracking your transformation' : `${photos.length} photo${photos.length !== 1 ? 's' : ''} logged`}
          </p>
        </div>
        <div className="flex gap-2">
          {photos.length >= 2 && (
            <button type="button" onClick={() => setView('compare')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-card border border-border text-xs font-semibold text-foreground">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Compare
            </button>
          )}
          <button type="button" onClick={() => setView('add')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold">
            <Plus className="h-3.5 w-3.5" />
            Add
          </button>
        </div>
      </div>

      {/* Empty state */}
      {!isLoaded && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading photos…</p>
        </div>
      )}

      {isLoaded && photos.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <div className="h-20 w-20 rounded-3xl bg-primary/10 flex items-center justify-center">
            <Camera className="h-10 w-10 text-primary" />
          </div>
          <div>
            <p className="font-bold text-foreground text-lg">No photos yet</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
              Progress photos are the most motivating thing you can do. Start today.
            </p>
          </div>
          <button type="button" onClick={() => setView('add')}
            className="px-8 py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm active:scale-95 transition-transform">
            Take First Photo
          </button>
        </div>
      )}

      {/* Gallery grouped by date */}
      {isLoaded && sortedDates.map(date => (
        <div key={date}>
          <div className="flex items-center gap-3 mb-3">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              {formatDate(date)}
            </p>
            {grouped[date][0]?.weight && (
              <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                {grouped[date][0].weight} lbs
              </span>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {ANGLE_ORDER.map(angle => {
              const photo = grouped[date].find(p => p.angle === angle)
              return (
                <div key={angle} className="relative">
                  {photo ? (
                    <button type="button" onClick={() => setLightbox(photo)}
                      className="w-full aspect-[3/4] rounded-xl overflow-hidden relative group">
                      <img src={photo.url} alt={angle} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                      <span className="absolute bottom-1.5 left-1.5 text-[10px] font-bold text-white bg-black/50 px-1.5 py-0.5 rounded-md">
                        {ANGLE_LABELS[angle]}
                      </span>
                    </button>
                  ) : (
                    <button type="button" onClick={() => { setNewAngle(angle); setView('add') }}
                      className="w-full aspect-[3/4] rounded-xl border-2 border-dashed border-border bg-card/50 flex flex-col items-center justify-center gap-1 hover:border-primary/50 transition-colors">
                      <Plus className="h-4 w-4 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground font-medium">{ANGLE_LABELS[angle]}</span>
                    </button>
                  )}
                </div>
              )
            })}
          </div>
          {grouped[date][0]?.note && (
            <p className="mt-2 text-xs text-muted-foreground italic px-1">
              "{grouped[date][0].note}"
            </p>
          )}
        </div>
      ))}

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4"
            onClick={() => setLightbox(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="relative w-full max-w-sm"
            >
              <img src={lightbox.url} alt="Progress" className="w-full rounded-2xl object-contain max-h-[70vh]" />

              {/* Header */}
              <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
                <div className="bg-black/60 rounded-xl px-3 py-1.5">
                  <p className="text-white text-xs font-bold">{formatDate(lightbox.date)}</p>
                  <p className="text-white/70 text-[10px]">{ANGLE_LABELS[lightbox.angle]}</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => { handleDelete(lightbox) }}
                    className="h-8 w-8 rounded-xl bg-red-500/80 flex items-center justify-center">
                    <Trash2 className="h-4 w-4 text-white" />
                  </button>
                  <button type="button" onClick={() => setLightbox(null)}
                    className="h-8 w-8 rounded-xl bg-black/60 flex items-center justify-center">
                    <X className="h-4 w-4 text-white" />
                  </button>
                </div>
              </div>

              {lightbox.weight && (
                <div className="absolute bottom-3 left-3 bg-black/60 rounded-xl px-3 py-1.5">
                  <p className="text-primary text-sm font-bold">{lightbox.weight} lbs</p>
                </div>
              )}
              {lightbox.note && (
                <div className="mt-3 bg-card rounded-xl px-4 py-3">
                  <p className="text-sm text-foreground italic">"{lightbox.note}"</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}