import { useState } from 'react'
import { submitCongestionReport } from '../../services/feedbackService.js'

export default function CongestionFeedback({ zoneId, className = '' }) {
  const [open, setOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [rating, setRating] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    if (!rating) return
    await submitCongestionReport({
      zoneId,
      hour: new Date().getHours(),
      rating,
    })
    setSubmitted(true)
    setOpen(false)
  }

  if (submitted) {
    return (
      <p className={`text-xs font-bold text-muted ${className}`}>
        Thanks for the report.
      </p>
    )
  }

  return (
    <div className={className} onClick={(event) => event.stopPropagation()}>
      {!open ? (
        <button
          type="button"
          className="text-xs font-extrabold underline decoration-dashed underline-offset-2"
          onClick={() => setOpen(true)}
        >
          Was this busy?
        </button>
      ) : (
        <form className="flex flex-wrap items-center gap-1.5" onSubmit={handleSubmit}>
          <span className="mr-1 text-xs font-bold">Rate it:</span>
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              aria-label={`Rate congestion ${value} out of 5`}
              className={`h-7 w-7 rounded-full border border-ink text-xs font-black ${rating === value ? 'bg-ink text-panel' : 'bg-panel'}`}
              onClick={() => setRating(value)}
            >
              {value}
            </button>
          ))}
          <button
            type="submit"
            className="ml-1 rounded-full border border-ink px-2 py-1 text-xs font-black"
            disabled={!rating}
          >
            Send
          </button>
          <button
            type="button"
            className="px-1 text-xs font-bold underline underline-offset-2"
            onClick={() => setOpen(false)}
          >
            Skip
          </button>
        </form>
      )}
    </div>
  )
}
