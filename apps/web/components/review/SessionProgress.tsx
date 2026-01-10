'use client'

interface SessionProgressProps {
  current: number
  total: number
}

export function SessionProgress({ current, total }: SessionProgressProps) {
  const progress = total > 0 ? (current / total) * 100 : 0

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm text-gray-600">
        <span>Progress</span>
        <span>
          {current} / {total}
        </span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
