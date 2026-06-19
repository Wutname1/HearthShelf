import { Icon } from '@/components/common/Icon'

interface SectionHeadProps {
  icon?: string
  title: string
  onMore?: () => void
}

// Heads every shelf/section: optional icon + title + optional "See all" link.
export function SectionHead({ icon, title, onMore }: SectionHeadProps) {
  return (
    <div className="section-head">
      {icon && <Icon name={icon} />}
      <h2>{title}</h2>
      {onMore && (
        <button className="more" onClick={onMore}>
          See all →
        </button>
      )}
    </div>
  )
}
