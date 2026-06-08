'use client'

import { motion } from 'framer-motion'

export function AppSplash() {
  return (
    <div className="rise-gradient-bg flex min-h-screen flex-col items-center justify-center px-6">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center"
      >
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary shadow-[0_0_40px] shadow-primary/40">
          <span className="text-3xl font-black text-primary-foreground">R</span>
        </div>
        <h1 className="mt-6 text-3xl font-black tracking-tight text-foreground">Rise</h1>
        <p className="mt-2 text-sm text-muted-foreground">Train smarter. Eat better. Rank up.</p>
        <div className="mt-8 flex gap-1">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="h-2 w-2 rounded-full bg-primary"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  )
}
