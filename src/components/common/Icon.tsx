interface IconProps {
  name: string
  fill?: boolean
  className?: string
  style?: React.CSSProperties
}

// Material Symbols Rounded - ligature-based icon font. The glyph name is the
// text content; `fill` swaps to the filled variant via font-variation-settings.
export function Icon({ name, fill, className, style }: IconProps) {
  return (
    <span
      className={'ms' + (fill ? ' fill' : '') + (className ? ' ' + className : '')}
      style={style}
      aria-hidden
    >
      {name}
    </span>
  )
}
