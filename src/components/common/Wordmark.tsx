interface WordmarkProps {
  className?: string
}

// Libre Baskerville lockup: "Hearth" in gold, "Shelf" in cream (design tokens
// --brand-hearth / --brand-shelf via the .wordmark classes).
export function Wordmark({ className }: WordmarkProps) {
  return (
    <span className={'wordmark' + (className ? ' ' + className : '')}>
      <span className="lt">Hearth</span>
      <span className="bd">Shelf</span>
    </span>
  )
}
