import { Icon } from '@/components/common/Icon'

interface ComingSoonPageProps {
  title: string
  eyebrow?: string
  icon?: string
}

// Placeholder for nav destinations whose full page lands in a later build
// phase. Keeps the complete sidebar nav graceful instead of throwing the
// router's default error boundary on an unbuilt route.
export function ComingSoonPage({
  title,
  eyebrow = 'Coming soon',
  icon = 'construction',
}: ComingSoonPageProps) {
  return (
    <div className="page fade-in">
      <div className="page-head">
        <div className="eyebrow">{eyebrow}</div>
        <h1 className="title-xl">{title}</h1>
      </div>
      <div className="empty-state">
        <Icon name={icon} />
        <h3>{title} is on the way</h3>
        <p>This part of HearthShelf is still being built.</p>
      </div>
    </div>
  )
}
