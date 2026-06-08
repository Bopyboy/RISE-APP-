'use client'

import { useState } from 'react'
import { useApp } from '@/lib/app-context'
import { getRankByPerformance, getNextPerformanceRank, getRankProgressPercent } from '@/lib/performance-rank'
import { RANKS } from '@/lib/types'
import { UserPlus, Copy, Check, Users, Search, X, Trophy, Flame, ChevronRight, Link } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Friend } from '@/lib/types'

export function FriendsPage() {
  const { friends, friendCode, addFriend, removeFriend } = useApp()
  const [addInput, setAddInput] = useState('')
  const [addResult, setAddResult] = useState<'success' | 'not_found' | 'already_added' | 'self' | null>(null)
  const [codeCopied, setCodeCopied] = useState(false)
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const copyCode = async () => {
    await navigator.clipboard.writeText(friendCode).catch(() => {})
    setCodeCopied(true)
    setTimeout(() => setCodeCopied(false), 2000)
  }

  const handleAddFriend = () => {
    if (!addInput.trim()) return
    const result = addFriend(addInput.trim().toUpperCase())
    setAddResult(result)
    if (result === 'success') setAddInput('')
    setTimeout(() => setAddResult(null), 3000)
  }

  const connectedFriends = friends.filter(f => f.status === 'accepted')
  const pendingFriends = friends.filter(f => f.status === 'pending')
  const filtered = connectedFriends.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (selectedFriend) {
    return <FriendProfileView friend={selectedFriend} onBack={() => setSelectedFriend(null)} />
  }

  return (
    <div className="space-y-5 pb-24 pt-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Friends</h1>
        <p className="text-sm text-muted-foreground">Connect and compete with friends</p>
      </div>

      {/* My Friend Code */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 p-5 text-white">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
        <div className="relative">
          <div className="flex items-center gap-2">
            <Link className="h-4 w-4 text-indigo-200" />
            <p className="text-sm font-medium text-indigo-200">My Friend Code</p>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <span className="text-3xl font-bold tracking-widest">{friendCode}</span>
            <button
              onClick={copyCode}
              className="flex items-center gap-1.5 rounded-xl bg-white/20 px-3 py-2 text-sm font-medium transition-colors hover:bg-white/30"
            >
              {codeCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {codeCopied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <p className="mt-2 text-xs text-indigo-200">
            Share this code so friends can add you
          </p>
        </div>
      </div>

      {/* Add Friend */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="mb-3 font-semibold text-foreground">Add a Friend</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={addInput}
            onChange={e => setAddInput(e.target.value.toUpperCase().slice(0, 8))}
            onKeyDown={e => e.key === 'Enter' && handleAddFriend()}
            placeholder="Enter friend code..."
            className="flex-1 rounded-xl bg-secondary px-4 py-2.5 text-sm font-mono uppercase tracking-widest placeholder:normal-case placeholder:tracking-normal placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={handleAddFriend}
            disabled={!addInput.trim()}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            <UserPlus className="h-4 w-4" />
            Add
          </button>
        </div>

        {addResult && (
          <div className={cn(
            'mt-2 rounded-lg px-3 py-2 text-sm font-medium',
            addResult === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
          )}>
            {addResult === 'success' && '✅ Friend added successfully!'}
            {addResult === 'not_found' && '❌ Friend code not found. Check the code and try again.'}
            {addResult === 'already_added' && '⚠️ You already added this friend.'}
            {addResult === 'self' && '😅 That\'s your own friend code!'}
          </div>
        )}
      </div>

      {/* Pending Requests */}
      {pendingFriends.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Pending ({pendingFriends.length})
          </h3>
          <div className="space-y-2">
            {pendingFriends.map(friend => (
              <FriendRow
                key={friend.id}
                friend={friend}
                onView={() => setSelectedFriend(friend)}
                onRemove={() => removeFriend(friend.id)}
                pending
              />
            ))}
          </div>
        </div>
      )}

      {/* Connected Friends */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Friends ({connectedFriends.length})
          </h3>
          {connectedFriends.length > 3 && (
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="rounded-xl bg-secondary py-1.5 pl-8 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          )}
        </div>

        {filtered.length === 0 && connectedFriends.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-10">
            <Users className="h-12 w-12 text-muted-foreground/30" />
            <p className="mt-3 font-medium text-muted-foreground">No friends yet</p>
            <p className="mt-1 text-center text-sm text-muted-foreground/70">
              Share your code or add a friend&apos;s code to get started
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(friend => (
              <FriendRow
                key={friend.id}
                friend={friend}
                onView={() => setSelectedFriend(friend)}
                onRemove={() => removeFriend(friend.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function FriendRow({
  friend,
  onView,
  onRemove,
  pending = false,
}: {
  friend: Friend
  onView: () => void
  onRemove: () => void
  pending?: boolean
}) {
  const rank = getRankByPerformance(friend.riseScore)

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
      {/* Avatar */}
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 text-lg font-bold text-primary">
        {friend.name.charAt(0).toUpperCase()}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="font-semibold text-foreground truncate">{friend.name}</p>
          {pending && (
            <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-500">
              Pending
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>{rank.symbol}</span>
            <span style={{ color: rank.color }}>{rank.name}</span>
          </span>
          {!pending && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Flame className="h-3 w-3 text-orange-500" />
              {friend.streak}d
            </span>
          )}
        </div>
      </div>

      {/* Score */}
      {!pending && (
        <div className="text-right">
          <p className="text-sm font-bold text-foreground">{friend.riseScore}</p>
          <p className="text-[10px] text-muted-foreground">Rise Score</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1">
        {!pending && (
          <button
            onClick={onView}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={onRemove}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

function FriendProfileView({ friend, onBack }: { friend: Friend; onBack: () => void }) {
  const rank = getRankByPerformance(friend.riseScore)
  const nextRank = getNextPerformanceRank(friend.riseScore)
  const progressToNext = getRankProgressPercent(friend.riseScore)
  const pointsToNext = nextRank ? nextRank.minScore - friend.riseScore : 0

  return (
    <div className="space-y-4 pb-24 pt-4">
      {/* Back button */}
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-medium text-primary">
        ← Back to Friends
      </button>

      {/* Profile header */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 text-2xl font-bold text-primary">
            {friend.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">{friend.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xl">{rank.symbol}</span>
              <span className="text-lg font-bold" style={{ color: rank.color }}>{rank.name}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-card p-3 text-center">
          <p className="text-xl font-bold text-foreground">{friend.riseScore}</p>
          <p className="text-xs text-muted-foreground">Strength</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 text-center">
          <p className="flex items-center justify-center gap-1 text-xl font-bold text-orange-500">
            <Flame className="h-4 w-4" />
            {friend.streak}
          </p>
          <p className="text-xs text-muted-foreground">Day Streak</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 text-center">
          <p className="text-xl font-bold text-foreground">{friend.workoutsCompleted ?? 0}</p>
          <p className="text-xs text-muted-foreground">Workouts</p>
        </div>
      </div>

      {/* Rank progress */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-foreground">Rank Progress</h3>
          <span className="text-xs text-muted-foreground">
            {pointsToNext > 0 ? `${pointsToNext} pts to ${nextRank?.name}` : 'Max rank'}
          </span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${progressToNext}%`, backgroundColor: rank.color }}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
          <span>{rank.name}</span>
          <span>{progressToNext.toFixed(0)}%</span>
        </div>
      </div>

      {/* Achievements */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="mb-3 font-semibold text-foreground">Achievements</h3>
        <div className="grid grid-cols-3 gap-2">
          {friend.riseScore >= RANKS[1].minScore && (
            <AchievementBadge icon="🥉" label="Bronze Rank" />
          )}
          {friend.riseScore >= RANKS[2].minScore && (
            <AchievementBadge icon="🥈" label="Silver Rank" />
          )}
          {friend.riseScore >= RANKS[3].minScore && (
            <AchievementBadge icon="🥇" label="Gold Rank" />
          )}
          {friend.streak >= 7 && (
            <AchievementBadge icon="🔥" label="7-Day Streak" />
          )}
          {friend.streak >= 30 && (
            <AchievementBadge icon="💪" label="30-Day Streak" />
          )}
          {(friend.workoutsCompleted ?? 0) >= 10 && (
            <AchievementBadge icon="🏋️" label="10 Workouts" />
          )}
          {friend.riseScore === 0 && friend.streak === 0 && (
            <p className="col-span-3 text-center text-sm text-muted-foreground">No achievements yet</p>
          )}
        </div>
      </div>
    </div>
  )
}

function AchievementBadge({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex flex-col items-center rounded-lg bg-amber-500/10 p-2 text-center">
      <span className="text-2xl">{icon}</span>
      <p className="mt-1 text-[10px] font-medium text-foreground">{label}</p>
    </div>
  )
}
