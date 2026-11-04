// Modo del Activity Report (AR) de un usuario a partir de los dos flags de su perfil.
// "NIO + AR" y "AR VOUT" son excluyentes y ambos son modos vinculados: AR VOUT = activity_linked + use_external_ar.
// NIO | AR VOUT (external sin vínculo) solo aparece en datos antiguos sin normalizar.
//   NIO + AR       → vinculado al AR del NIO                (activity_linked)
//   NIO + AR VOUT  → vinculado al AR externo de Vout        (activity_linked + use_external_ar)
//   NIO | AR       → independiente, AR del NIO
//   NIO | AR VOUT  → independiente, AR externo de Vout      (use_external_ar)
export type ArMode = 'NIO_AR' | 'NIO_AR_VOUT' | 'NIO_INDEPENDENT' | 'NIO_VOUT_INDEPENDENT'

export interface ArModeFlags {
  activity_linked?: boolean | null
  use_external_ar?: boolean | null
}

export function arModeOf(p?: ArModeFlags | null): ArMode {
  const linked = p?.activity_linked === true
  const external = p?.use_external_ar === true
  if (linked && external) return 'NIO_AR_VOUT'
  if (linked) return 'NIO_AR'
  if (external) return 'NIO_VOUT_INDEPENDENT'
  return 'NIO_INDEPENDENT'
}

export const AR_MODE_LABEL: Record<ArMode, string> = {
  NIO_AR: 'NIO + AR',
  NIO_AR_VOUT: 'NIO + AR VOUT',
  NIO_INDEPENDENT: 'NIO', // sin AR propio del NIO: solo queda el NIO (y, si aplica, Vout)
  NIO_VOUT_INDEPENDENT: 'NIO | AR VOUT',
}

export const arModeLabel = (p?: ArModeFlags | null): string => AR_MODE_LABEL[arModeOf(p)]

/** true si el NIO comanda el AR (el reloj de la app NIO se bloquea). */
export const isArLinked = (p?: ArModeFlags | null): boolean => p?.activity_linked === true

/** Flags del perfil que corresponden a un modo elegido (NIO + AR y NIO + AR VOUT son los modos vinculados). */
export function arFlagsOf(mode: ArMode): { activity_linked: boolean; use_external_ar: boolean } {
  if (mode === 'NIO_AR') return { activity_linked: true, use_external_ar: false }
  if (mode === 'NIO_AR_VOUT') return { activity_linked: true, use_external_ar: true }
  return { activity_linked: false, use_external_ar: false }
}
