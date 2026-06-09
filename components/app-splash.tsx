'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

export function AppSplash() {
  return (
    <div className="rise-gradient-bg flex min-h-screen flex-col items-center justify-center px-6">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center"
      >
        <Image
          src="/rise picture logo"
          alt="Rise Fitness"
          width={200}
          height={200}
          priority
          className="drop-shadow-2xl rounded-3xl"
        />
        <p className="mt-4 text-sm text-muted-foreground">Train smarter. Eat better. Rank up.</p>
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
