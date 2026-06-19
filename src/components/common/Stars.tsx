import { Icon } from '@/components/common/Icon'

interface StarsProps {
  rating: number
}

// Five gold Material-Symbol stars: full / half (remainder >= 0.4) / empty.
// @needs-verify ABS provides a numeric rating; gate or omit where absent.
export function Stars({ rating }: StarsProps) {
  const full = Math.floor(rating)
  const half = rating - full >= 0.4
  return (
    <span className="stars">
      {[0, 1, 2, 3, 4].map((i) => {
        const isFull = i < full
        const isHalf = i === full && half
        return (
          <Icon
            key={i}
            name={isHalf ? 'star_half' : 'star'}
            fill={isFull || isHalf}
          />
        )
      })}
    </span>
  )
}
