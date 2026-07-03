import type { ReactNode } from 'react'

type Tone = 'wine' | 'gold' | 'sage' | 'rust' | 'muted'

const toneClasses: Record<Tone, string> = {
  wine: 'bg-wine text-cream',
  gold: 'bg-gold text-wine-dark',
  sage: 'bg-sage text-cream',
  rust: 'bg-rust text-cream',
  muted: 'bg-sand text-muted',
}

export function StatusBadge({ tone, children }: { tone: Tone; children: ReactNode }) {
  return <span className={`ribbon ${toneClasses[tone]}`}>{children}</span>
}
