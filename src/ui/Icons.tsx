import type { ReactNode } from 'react'

interface IconProps {
  size?: number
  strokeWidth?: number
}

function Base({
  size = 24,
  strokeWidth = 2,
  children,
}: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

/* Icons ported verbatim from the prototype so the panel matches the preview. */

export function ChevronDestination({ size = 13 }: IconProps) {
  return (
    <Base size={size} strokeWidth={2.4}>
      <path d="M5 5l6 7-6 7M13 5l6 7-6 7" />
    </Base>
  )
}

export function ChevronExplore({ size = 13 }: IconProps) {
  return (
    <Base size={size} strokeWidth={2.4}>
      <path d="M19 5l-6 7 6 7M11 5l-6 7 6 7" />
    </Base>
  )
}

export function FilterIcon({ size = 13 }: IconProps) {
  return (
    <Base size={size} strokeWidth={2}>
      <path d="M3 5h18l-7 8v6l-4-2v-4z" />
    </Base>
  )
}

export function CloseIcon({ size = 12 }: IconProps) {
  return (
    <Base size={size} strokeWidth={2.4}>
      <path d="M6 6l12 12M18 6L6 18" />
    </Base>
  )
}

export function SunIcon({ size = 20 }: IconProps) {
  return (
    <Base size={size} strokeWidth={1.6}>
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M5 19l2-2" />
    </Base>
  )
}

export function PlanetIcon({ size = 20 }: IconProps) {
  return (
    <Base size={size} strokeWidth={1.6}>
      <circle cx="12" cy="12" r="2.6" fill="currentColor" stroke="none" />
      <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(-22 12 12)" />
    </Base>
  )
}

export function TargetIcon({ size = 20 }: IconProps) {
  return (
    <Base size={size} strokeWidth={1.6}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="2.6" fill="currentColor" stroke="none" />
    </Base>
  )
}

export function ThermometerIcon({ size = 20 }: IconProps) {
  return (
    <Base size={size} strokeWidth={1.6}>
      <rect x="9.5" y="3" width="5" height="11" rx="2.5" />
      <circle cx="12" cy="17.5" r="3.5" />
    </Base>
  )
}

export function CrosshairIcon({ size = 15 }: IconProps) {
  return (
    <Base size={size} strokeWidth={1.7}>
      <circle cx="12" cy="12" r="7" />
      <path d="M12 1v5M12 18v5M1 12h5M18 12h5" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
    </Base>
  )
}
