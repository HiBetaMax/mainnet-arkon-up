/**
 * services/share.ts — Share engine
 *
 * Replaces the share functions from ui.js.
 * Uses Zustand store for share state instead of globals.
 */

import useStore from '../store'
import type { ShareType } from '../store'

export function shareContent(title: string, value: string, type: ShareType): void {
  useStore.getState().setShareData({ title, value, type })
}

function getShareLabel(type: ShareType): string {
  switch (type) {
    case 'ark':
      return 'Ark Address'
    case 'lightning':
      return 'Lightning Invoice'
    case 'onchain':
      return 'On-chain Address'
    case 'invoice':
      return 'Invoice'
    case 'address':
      return 'Address'
    default:
      return 'Content'
  }
}

export function doShareCopy(): void {
  const data = useStore.getState().shareData
  if (!data) return
  navigator.clipboard.writeText(data.value).then(
    () => useStore.getState().showToast('Copied to clipboard'),
    () => useStore.getState().showToast('Copy failed')
  )
  useStore.getState().closeSheet('share')
}

export function doShareWhatsApp(): void {
  const data = useStore.getState().shareData
  if (!data) return
  window.open(
    `https://wa.me/?text=${encodeURIComponent(data.title + '\n' + data.value)}`,
    '_blank'
  )
}

export function doShareTelegram(): void {
  const data = useStore.getState().shareData
  if (!data) return
  window.open(
    `https://t.me/share/url?url=${encodeURIComponent(data.value)}`,
    '_blank'
  )
}

export function doShareEmail(): void {
  const data = useStore.getState().shareData
  if (!data) return
  window.open(
    `mailto:?subject=${encodeURIComponent(data.title)}&body=${encodeURIComponent(data.value)}`,
    '_blank'
  )
}

export function doShareSMS(): void {
  const data = useStore.getState().shareData
  if (!data) return
  window.open(`sms:?body=${encodeURIComponent(data.value)}`, '_blank')
}

export function doShareTwitter(): void {
  const data = useStore.getState().shareData
  if (!data) return
  const label = getShareLabel(data.type)
  window.open(
    `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${label}: ${data.value}`)}`,
    '_blank'
  )
}

export async function doShareNative(): Promise<void> {
  const data = useStore.getState().shareData
  if (!data || !navigator.share) return
  try {
    await navigator.share({ title: data.title, text: data.value })
    useStore.getState().closeSheet('share')
  } catch {
    // User cancelled or share failed
  }
}

export function doShareDownloadQR(canvasOrImg: HTMLCanvasElement | HTMLImageElement | null): void {
  if (!canvasOrImg) return

  let canvas: HTMLCanvasElement
  if (canvasOrImg instanceof HTMLCanvasElement) {
    canvas = canvasOrImg
  } else {
    canvas = document.createElement('canvas')
    canvas.width = canvasOrImg.naturalWidth || canvasOrImg.width
    canvas.height = canvasOrImg.naturalHeight || canvasOrImg.height
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(canvasOrImg, 0, 0)
  }

  const url = canvas.toDataURL('image/png')
  const a = document.createElement('a')
  a.href = url
  a.download = 'arkon-qr.png'
  a.click()
}
