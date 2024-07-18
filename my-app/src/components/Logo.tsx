import React from 'react'

export const Logo = () => (
  <div className="inline-block">
    <h1 className="text-7xl font-black tracking-tight leading-none">
      <span className="bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-400 bg-clip-text text-transparent drop-shadow-sm">
        Health
      </span>
      <span className="bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-500 bg-clip-text text-transparent drop-shadow-sm">
        sync
      </span>
    </h1>
    <p className="mt-2 text-right text-sm font-medium text-gray-500 dark:text-gray-400">
      Your personal health dashboard
    </p>
  </div>
)