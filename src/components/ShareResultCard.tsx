'use client'

import { useCallback, useEffect, useRef } from 'react'
import { X, Download, Copy, Share2 } from 'lucide-react'

interface AnalysisResult {
  interestScore: number
  manipulationScore: number
  ghostingScore: number
  overallScore: number
  advice: string
  punchline: string
  highlights: { positive: string[]; negative: string[]; neutral: string[] }
  vibe: string
  badges: string[]
}

interface ShareResultCardProps {
  isOpen: boolean
  onClose: () => void
  analysis: AnalysisResult | null
  language: string
}

const LANG = {
  fr: {
    title: 'Partager les résultats',
    download: 'Télécharger',
    copy: 'Copier',
    share: 'Partager',
    copied: 'Copié !',
    copiedDesc: 'Image copiée dans le presse-papier',
    downloaded: 'Téléchargé !',
    downloadedDesc: 'Image sauvegardée',
    interest: 'Intérêt',
    manipulation: 'Manipulation',
    ghosting: 'Ghosting',
  },
  en: {
    title: 'Share results',
    download: 'Download',
    copy: 'Copy',
    share: 'Share',
    copied: 'Copied!',
    copiedDesc: 'Image copied to clipboard',
    downloaded: 'Downloaded!',
    downloadedDesc: 'Image saved',
    interest: 'Interest',
    manipulation: 'Manipulation',
    ghosting: 'Ghosting',
  },
  de: {
    title: 'Ergebnisse teilen',
    download: 'Herunterladen',
    copy: 'Kopieren',
    share: 'Teilen',
    copied: 'Kopiert!',
    copiedDesc: 'Bild in die Zwischenablage kopiert',
    downloaded: 'Heruntergeladen!',
    downloadedDesc: 'Bild gespeichert',
    interest: 'Interesse',
    manipulation: 'Manipulation',
    ghosting: 'Ghosting',
  },
  es: {
    title: 'Compartir resultados',
    download: 'Descargar',
    copy: 'Copiar',
    share: 'Compartir',
    copied: '¡Copiado!',
    copiedDesc: 'Imagen copiada al portapapeles',
    downloaded: '¡Descargado!',
    downloadedDesc: 'Imagen guardada',
    interest: 'Interés',
    manipulation: 'Manipulación',
    ghosting: 'Ghosting',
  },
} as const

const CANVAS_W = 1080
const CANVAS_H = 1350
const FONT = `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`

type LangKey = keyof typeof LANG

export default function ShareResultCard({
  isOpen,
  onClose,
  analysis,
  language,
}: ShareResultCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const t = (LANG[language as LangKey] || LANG.en) as (typeof LANG)[LangKey]

  const generateCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !analysis) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = CANVAS_W
    canvas.height = CANVAS_H

    const w = CANVAS_W
    const h = CANVAS_H

    // --- Background gradient ---
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h)
    bgGrad.addColorStop(0, '#0f0f23')
    bgGrad.addColorStop(0.5, '#2d1b69')
    bgGrad.addColorStop(1, '#0f0f23')
    ctx.fillStyle = bgGrad
    ctx.fillRect(0, 0, w, h)

    // Subtle radial glow in center
    const radGlow = ctx.createRadialGradient(w / 2, h * 0.45, 0, w / 2, h * 0.45, w * 0.7)
    radGlow.addColorStop(0, 'rgba(139, 92, 246, 0.12)')
    radGlow.addColorStop(1, 'rgba(0, 0, 0, 0)')
    ctx.fillStyle = radGlow
    ctx.fillRect(0, 0, w, h)

    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    // --- Ghost emoji ---
    ctx.font = `80px ${FONT}`
    ctx.fillText('👻', w / 2, 120)

    // --- App name with gradient text ---
    const titleGrad = ctx.createLinearGradient(w / 2 - 140, 0, w / 2 + 140, 0)
    titleGrad.addColorStop(0, '#a78bfa')
    titleGrad.addColorStop(1, '#f472b6')
    ctx.font = `bold 48px ${FONT}`
    ctx.fillStyle = titleGrad
    ctx.fillText('GhostMeter', w / 2, 200)

    // --- Decorative line ---
    const lineGrad = ctx.createLinearGradient(w / 2 - 120, 0, w / 2 + 120, 0)
    lineGrad.addColorStop(0, 'rgba(139, 92, 246, 0)')
    lineGrad.addColorStop(0.5, 'rgba(244, 114, 182, 0.6)')
    lineGrad.addColorStop(1, 'rgba(139, 92, 246, 0)')
    ctx.strokeStyle = lineGrad
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(w / 2 - 120, 240)
    ctx.lineTo(w / 2 + 120, 240)
    ctx.stroke()

    // --- Score circles ---
    const circles: {
      value: number
      emoji: string
      colors: [string, string]
      label: string
    }[] = [
      {
        value: analysis.interestScore,
        emoji: '❤️',
        colors: ['#f472b6', '#ef4444'],
        label: t.interest,
      },
      {
        value: analysis.manipulationScore,
        emoji: '⚠️',
        colors: ['#f59e0b', '#eab308'],
        label: t.manipulation,
      },
      {
        value: analysis.ghostingScore,
        emoji: '👻',
        colors: ['#94a3b8', '#6366f1'],
        label: t.ghosting,
      },
    ]

    const circleRadius = 80
    const circleGap = 200
    const circlesStartX = w / 2 - circleGap
    const circlesY = 400

    circles.forEach((circle, i) => {
      const cx = circlesStartX + i * circleGap
      const cy = circlesY
      const r = circleRadius

      // Background circle
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
      ctx.lineWidth = 8
      ctx.stroke()

      // Progress arc
      const startAngle = -Math.PI / 2
      const endAngle = startAngle + (Math.PI * 2 * circle.value) / 100
      const arcGrad = ctx.createLinearGradient(cx - r, cy, cx + r, cy)
      arcGrad.addColorStop(0, circle.colors[0])
      arcGrad.addColorStop(1, circle.colors[1])

      ctx.beginPath()
      ctx.arc(cx, cy, r, startAngle, endAngle)
      ctx.strokeStyle = arcGrad
      ctx.lineWidth = 10
      ctx.lineCap = 'round'
      ctx.stroke()
      ctx.lineCap = 'butt'

      // Percentage text
      ctx.font = `bold 36px ${FONT}`
      ctx.fillStyle = '#ffffff'
      ctx.fillText(`${circle.value}%`, cx, cy - 6)

      // Emoji below number
      ctx.font = `32px ${FONT}`
      ctx.fillText(circle.emoji, cx, cy + 34)

      // Label
      ctx.font = `20px ${FONT}`
      ctx.fillStyle = '#d1d5db'
      ctx.fillText(circle.label, cx, cy + r + 30)
    })

    // --- Overall score ---
    const overallY = 600

    // Glow behind score
    ctx.shadowColor = 'rgba(139, 92, 246, 0.6)'
    ctx.shadowBlur = 40
    ctx.font = `bold 96px ${FONT}`
    ctx.fillStyle = '#ffffff'
    ctx.fillText(`${analysis.overallScore}%`, w / 2, overallY)
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0

    // "Overall" label
    ctx.font = `24px ${FONT}`
    ctx.fillStyle = '#a78bfa'
    ctx.fillText('Overall Score', w / 2, overallY + 60)

    // --- Decorative line ---
    ctx.strokeStyle = lineGrad
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(w / 2 - 160, overallY + 100)
    ctx.lineTo(w / 2 + 160, overallY + 100)
    ctx.stroke()

    // --- Punchline ---
    const punchlineY = overallY + 170
    const maxPunchWidth = w - 160

    ctx.font = `italic 28px ${FONT}`
    ctx.fillStyle = '#d1d5db'

    // Word-wrap punchline
    const punchWords = analysis.punchline.split(' ')
    let punchLine = ''
    let punchLineY = punchlineY
    const punchLines: string[] = []
    for (const word of punchWords) {
      const test = punchLine + (punchLine ? ' ' : '') + word
      if (ctx.measureText(test).width > maxPunchWidth) {
        punchLines.push(punchLine)
        punchLine = word
      } else {
        punchLine = test
      }
    }
    punchLines.push(punchLine)

    // Draw quote marks
    ctx.font = `italic 48px ${FONT}`
    ctx.fillStyle = 'rgba(167, 139, 250, 0.4)'
    ctx.fillText('"', w / 2 - ctx.measureText(punchLines[0] || '"').width / 2 - 30, punchLineY)

    punchLines.forEach((line, idx) => {
      const ly = punchLineY + 30 + idx * 40
      ctx.font = `italic 28px ${FONT}`
      ctx.fillStyle = '#d1d5db'
      ctx.fillText(line, w / 2, ly)
    })

    // Closing quote
    const lastPunchLine = punchLines[punchLines.length - 1] || ''
    const closingQuoteY = punchLineY + 30 + (punchLines.length - 1) * 40
    ctx.font = `italic 48px ${FONT}`
    ctx.fillStyle = 'rgba(167, 139, 250, 0.4)'
    ctx.fillText(
      '"',
      w / 2 + ctx.measureText(lastPunchLine).width / 2 + 30,
      closingQuoteY
    )

    // --- Badges ---
    if (analysis.badges.length > 0) {
      const badgesY = closingQuoteY + 90
      const badgeFont = `22px ${FONT}`

      ctx.font = badgeFont
      const badgePadding = 16
      const badgeGap = 16
      const totalBadgesWidth = analysis.badges.reduce((acc, badge) => {
        return acc + ctx.measureText(badge).width + badgePadding * 2
      }, 0) + badgeGap * (analysis.badges.length - 1)
      let badgeX = (w - totalBadgesWidth) / 2

      analysis.badges.forEach((badge) => {
        const textW = ctx.measureText(badge).width
        const badgeW = textW + badgePadding * 2
        const badgeH = 42

        // Badge background
        const badgeGrad = ctx.createLinearGradient(badgeX, 0, badgeX + badgeW, 0)
        badgeGrad.addColorStop(0, 'rgba(139, 92, 246, 0.25)')
        badgeGrad.addColorStop(1, 'rgba(244, 114, 182, 0.25)')
        ctx.fillStyle = badgeGrad

        // Rounded rect
        const br = badgeH / 2
        ctx.beginPath()
        ctx.moveTo(badgeX + br, badgesY - badgeH / 2)
        ctx.lineTo(badgeX + badgeW - br, badgesY - badgeH / 2)
        ctx.arcTo(badgeX + badgeW, badgesY - badgeH / 2, badgeX + badgeW, badgesY, br)
        ctx.arcTo(badgeX + badgeW, badgesY + badgeH / 2, badgeX + badgeW - br, badgesY + badgeH / 2, br)
        ctx.lineTo(badgeX + br, badgesY + badgeH / 2)
        ctx.arcTo(badgeX, badgesY + badgeH / 2, badgeX, badgesY, br)
        ctx.arcTo(badgeX, badgesY - badgeH / 2, badgeX + br, badgesY - badgeH / 2, br)
        ctx.closePath()
        ctx.fill()

        // Badge border
        ctx.strokeStyle = 'rgba(139, 92, 246, 0.3)'
        ctx.lineWidth = 1.5
        ctx.stroke()

        // Badge text
        ctx.fillStyle = '#c4b5fd'
        ctx.font = badgeFont
        ctx.fillText(badge, badgeX + badgeW / 2, badgesY + 1)

        badgeX += badgeW + badgeGap
      })
    }

    // --- Branding ---
    ctx.font = `20px ${FONT}`
    ctx.fillStyle = '#6b7280'
    ctx.fillText('ghostmeter.app', w / 2, h - 50)
  }, [analysis, t])

  useEffect(() => {
    if (isOpen && analysis) {
      generateCanvas()
    }
  }, [isOpen, analysis, generateCanvas])

  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const link = document.createElement('a')
    link.download = `ghostmeter-result-${Date.now()}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }, [])

  const handleCopy = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas) return

    try {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/png')
      )
      if (!blob) return

      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ])
    } catch {
      // Clipboard API might not be available
    }
  }, [])

  const handleShare = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas || !analysis) return

    // Try Web Share API (mobile)
    if (navigator.share) {
      try {
        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, 'image/png')
        )
        if (!blob) return

        const file = new File([blob], 'ghostmeter-result.png', { type: 'image/png' })

        await navigator.share({
          title: 'GhostMeter Results',
          text: `${analysis.punchline} — Overall: ${analysis.overallScore}%`,
          files: [file],
        })
        return
      } catch {
        // User cancelled or not supported
      }
    }

    // Fallback: copy to clipboard
    await handleCopy()
  }, [analysis, handleCopy])

  if (!isOpen || !analysis) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative mx-4 w-full max-w-md rounded-2xl border border-white/10 bg-[#1a1a2e] p-6 shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Title */}
        <h2 className="mb-5 text-lg font-semibold text-white">{t.title}</h2>

        {/* Preview card */}
        <div className="mx-auto mb-6 w-full max-w-[300px] overflow-hidden rounded-xl">
          <div
            className="relative aspect-[1080/1350] w-full overflow-hidden rounded-xl"
            style={{
              background: 'linear-gradient(180deg, #0f0f23 0%, #2d1b69 50%, #0f0f23 100%)',
            }}
          >
            {/* Decorative radial glow */}
            <div
              className="absolute left-1/2 top-[45%] h-[70%] w-[140%] -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)' }}
            />

            <div className="relative flex h-full flex-col items-center px-4">
              {/* Ghost emoji */}
              <span className="mt-[6%] text-[38px] leading-none">👻</span>

              {/* App name */}
              <span
                className="mt-1 text-[20px] font-bold"
                style={{
                  background: 'linear-gradient(90deg, #a78bfa, #f472b6)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                GhostMeter
              </span>

              {/* Decorative line */}
              <div
                className="mt-2 h-[1px] w-[60%]"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(244,114,182,0.6), transparent)',
                }}
              />

              {/* Score circles */}
              <div className="mt-3 flex w-full items-start justify-around px-2">
                {/* Interest */}
                <div className="flex flex-col items-center">
                  <div className="relative flex h-[52px] w-[52px] items-center justify-center">
                    <svg className="absolute h-full w-full -rotate-90" viewBox="0 0 52 52">
                      <circle cx="26" cy="26" r="22" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
                      <circle
                        cx="26"
                        cy="26"
                        r="22"
                        fill="none"
                        stroke="url(#grad-interest)"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 22}`}
                        strokeDashoffset={2 * Math.PI * 22 * (1 - analysis.interestScore / 100)}
                      />
                      <defs>
                        <linearGradient id="grad-interest" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#f472b6" />
                          <stop offset="100%" stopColor="#ef4444" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <span className="text-[11px] font-bold text-white">
                      {analysis.interestScore}%
                    </span>
                  </div>
                  <span className="mt-0.5 text-[14px]">❤️</span>
                  <span className="mt-0.5 text-[8px] text-gray-300">{t.interest}</span>
                </div>

                {/* Manipulation */}
                <div className="flex flex-col items-center">
                  <div className="relative flex h-[52px] w-[52px] items-center justify-center">
                    <svg className="absolute h-full w-full -rotate-90" viewBox="0 0 52 52">
                      <circle cx="26" cy="26" r="22" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
                      <circle
                        cx="26"
                        cy="26"
                        r="22"
                        fill="none"
                        stroke="url(#grad-manip)"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 22}`}
                        strokeDashoffset={2 * Math.PI * 22 * (1 - analysis.manipulationScore / 100)}
                      />
                      <defs>
                        <linearGradient id="grad-manip" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#f59e0b" />
                          <stop offset="100%" stopColor="#eab308" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <span className="text-[11px] font-bold text-white">
                      {analysis.manipulationScore}%
                    </span>
                  </div>
                  <span className="mt-0.5 text-[14px]">⚠️</span>
                  <span className="mt-0.5 text-[8px] text-gray-300">{t.manipulation}</span>
                </div>

                {/* Ghosting */}
                <div className="flex flex-col items-center">
                  <div className="relative flex h-[52px] w-[52px] items-center justify-center">
                    <svg className="absolute h-full w-full -rotate-90" viewBox="0 0 52 52">
                      <circle cx="26" cy="26" r="22" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
                      <circle
                        cx="26"
                        cy="26"
                        r="22"
                        fill="none"
                        stroke="url(#grad-ghost)"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 22}`}
                        strokeDashoffset={2 * Math.PI * 22 * (1 - analysis.ghostingScore / 100)}
                      />
                      <defs>
                        <linearGradient id="grad-ghost" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#94a3b8" />
                          <stop offset="100%" stopColor="#6366f1" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <span className="text-[11px] font-bold text-white">
                      {analysis.ghostingScore}%
                    </span>
                  </div>
                  <span className="mt-0.5 text-[14px]">👻</span>
                  <span className="mt-0.5 text-[8px] text-gray-300">{t.ghosting}</span>
                </div>
              </div>

              {/* Overall score */}
              <div className="mt-4 text-center">
                <span
                  className="text-[40px] font-bold text-white"
                  style={{
                    textShadow: '0 0 30px rgba(139,92,246,0.6), 0 0 60px rgba(139,92,246,0.3)',
                  }}
                >
                  {analysis.overallScore}%
                </span>
                <p className="text-[9px] text-purple-400">Overall Score</p>
              </div>

              {/* Decorative line */}
              <div
                className="mt-2 h-[1px] w-[50%]"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(244,114,182,0.6), transparent)',
                }}
              />

              {/* Punchline */}
              <p className="mt-2 text-center text-[10px] italic leading-tight text-gray-300">
                &ldquo;{analysis.punchline}&rdquo;
              </p>

              {/* Badges */}
              <div className="mt-2 flex flex-wrap justify-center gap-1">
                {analysis.badges.map((badge) => (
                  <span
                    key={badge}
                    className="rounded-full px-2 py-0.5 text-[7px] font-medium"
                    style={{
                      background: 'linear-gradient(90deg, rgba(139,92,246,0.25), rgba(244,114,182,0.25))',
                      border: '1px solid rgba(139,92,246,0.3)',
                      color: '#c4b5fd',
                    }}
                  >
                    {badge}
                  </span>
                ))}
              </div>

              {/* Branding */}
              <p className="mt-auto pb-3 text-[8px] text-gray-500">ghostmeter.app</p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={handleDownload}
            className="flex flex-col items-center gap-1.5 rounded-xl bg-white/5 px-3 py-3 text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            <Download className="h-5 w-5" />
            <span className="text-[11px] font-medium">{t.download}</span>
          </button>
          <button
            onClick={handleCopy}
            className="flex flex-col items-center gap-1.5 rounded-xl bg-white/5 px-3 py-3 text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            <Copy className="h-5 w-5" />
            <span className="text-[11px] font-medium">{t.copy}</span>
          </button>
          <button
            onClick={handleShare}
            className="flex flex-col items-center gap-1.5 rounded-xl bg-white/5 px-3 py-3 text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            <Share2 className="h-5 w-5" />
            <span className="text-[11px] font-medium">{t.share}</span>
          </button>
        </div>
      </div>

      {/* Hidden canvas for image generation */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
