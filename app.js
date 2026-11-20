import QRCode from 'https://cdn.jsdelivr.net/npm/qrcode@1.5.3/+esm'
import jsQR from 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/+esm'

const textInput = document.getElementById('textInput')
const sizeInput = document.getElementById('sizeInput')
const marginInput = document.getElementById('marginInput')
const eclSelect = document.getElementById('eclSelect')
const sizeValue = document.getElementById('sizeValue')
const marginValue = document.getElementById('marginValue')
const generateBtn = document.getElementById('generateBtn')
const downloadBtn = document.getElementById('downloadBtn')
const copyBtn = document.getElementById('copyBtn')
const clearBtn = document.getElementById('clearBtn')
const canvas = document.getElementById('qrCanvas')
const statusEl = document.getElementById('status')
const fileInput = document.getElementById('fileInput')
const dropZone = document.getElementById('dropZone')
const uploadPreview = document.getElementById('uploadPreview')

// Maximum dimension used when decoding uploaded images (keeps jsQR fast).
const DECODE_MAX_DIM = 1600

let hasValidQr = false

function setStatus(message, type = 'info') {
  statusEl.textContent = message
  statusEl.dataset.type = message ? type : ''
}

function updateIndicators() {
  sizeValue.textContent = `${sizeInput.value} px`
  marginValue.textContent = `${marginInput.value}`
}

function setActionState() {
  downloadBtn.disabled = !hasValidQr
  copyBtn.disabled = !hasValidQr
}

function clearCanvas() {
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  hasValidQr = false
  canvas.setAttribute('aria-label', 'No QR code generated')
}

async function generate() {
  updateIndicators()
  const value = textInput.value.trim()
  if (!value) {
    clearCanvas()
    setActionState()
    return
  }
  const size = parseInt(sizeInput.value, 10) || 256
  const margin = parseInt(marginInput.value, 10) || 0
  try {
    await QRCode.toCanvas(canvas, value, {
      width: size,
      margin,
      errorCorrectionLevel: eclSelect.value,
      color: { dark: '#000000', light: '#ffffff' }
    })
    hasValidQr = true
    canvas.setAttribute('aria-label', `QR code for: ${value}`)
    if (statusEl.dataset.type === 'error') setStatus('')
  } catch (err) {
    clearCanvas()
    setStatus(
      `Could not generate QR: ${err?.message || err}. Try shorter text or a lower error correction level.`,
      'error'
    )
  }
  setActionState()
}

function downloadPng() {
  if (!hasValidQr) return
  const a = document.createElement('a')
  a.href = canvas.toDataURL('image/png')
  a.download = 'qr.png'
  document.body.appendChild(a)
  a.click()
  a.remove()
}

function copyImage() {
  if (!hasValidQr) return
  if (!navigator.clipboard || !window.ClipboardItem) {
    setStatus('Copying images is not supported in this browser. Use Download PNG.', 'error')
    return
  }
  canvas.toBlob(async blob => {
    if (!blob) return
    try {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
      setStatus('Image copied to clipboard.', 'success')
    } catch (err) {
      setStatus(`Copy failed: ${err?.message || err}`, 'error')
    }
  }, 'image/png')
}

function clearAll() {
  textInput.value = ''
  clearCanvas()
  setActionState()
  setStatus('')
  uploadPreview.hidden = true
  uploadPreview.removeAttribute('src')
  fileInput.value = ''
  textInput.focus()
}

// ---------- Reading QR codes from images ----------

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => resolve({ img, url })
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not read the image file.'))
    }
    img.src = url
  })
}

function decodeFromImage(img, maxDim) {
  const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight))
  const w = Math.max(1, Math.round(img.naturalWidth * scale))
  const h = Math.max(1, Math.round(img.naturalHeight * scale))
  const work = document.createElement('canvas')
  work.width = w
  work.height = h
  const ctx = work.getContext('2d', { willReadFrequently: true })
  // White background so transparent PNGs decode correctly.
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, w, h)
  ctx.drawImage(img, 0, 0, w, h)
  const { data } = ctx.getImageData(0, 0, w, h)
  return jsQR(data, w, h, { inversionAttempts: 'attemptBoth' })
}

async function decodeWithNativeDetector(img) {
  if (!('BarcodeDetector' in window)) return null
  try {
    const detector = new window.BarcodeDetector({ formats: ['qr_code'] })
    const codes = await detector.detect(img)
    return codes[0]?.rawValue ?? null
  } catch {
    return null
  }
}

async function readQrFromFile(file) {
  if (!file) return
  if (!file.type.startsWith('image/')) {
    setStatus('Please choose an image file (PNG, JPG, WEBP, ...).', 'error')
    return
  }
  setStatus('Reading QR code...', 'info')
  let loaded
  try {
    loaded = await loadImage(file)
  } catch (err) {
    setStatus(err.message, 'error')
    return
  }
  const { img, url } = loaded
  uploadPreview.src = url
  uploadPreview.hidden = false
  uploadPreview.onload = () => URL.revokeObjectURL(url)

  let text = null
  // Try a downscaled pass first (fast), then full resolution for small/dense codes.
  const result = decodeFromImage(img, DECODE_MAX_DIM) || decodeFromImage(img, 4096)
  if (result) text = result.data
  if (text == null) text = await decodeWithNativeDetector(img)

  if (text == null || text === '') {
    setStatus('No QR code found in this image. Try a sharper or more cropped picture.', 'error')
    return
  }

  textInput.value = text
  await generate()
  if (hasValidQr) {
    setStatus('QR code read. Edit the text and adjust options to regenerate.', 'success')
  }
  textInput.focus()
  textInput.select()
}

fileInput.addEventListener('change', () => readQrFromFile(fileInput.files?.[0]))

dropZone.addEventListener('click', () => fileInput.click())
dropZone.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    fileInput.click()
  }
})
;['dragenter', 'dragover'].forEach(evt =>
  dropZone.addEventListener(evt, e => {
    e.preventDefault()
    dropZone.classList.add('dragging')
  })
)
;['dragleave', 'drop'].forEach(evt =>
  dropZone.addEventListener(evt, e => {
    e.preventDefault()
    dropZone.classList.remove('dragging')
  })
)
dropZone.addEventListener('drop', e => readQrFromFile(e.dataTransfer?.files?.[0]))

// Paste an image anywhere on the page (Ctrl+V).
document.addEventListener('paste', e => {
  const item = [...(e.clipboardData?.items || [])].find(i => i.type.startsWith('image/'))
  if (!item) return
  e.preventDefault()
  readQrFromFile(item.getAsFile())
})

// ---------- Generator events ----------

textInput.addEventListener('input', generate)
sizeInput.addEventListener('input', generate)
marginInput.addEventListener('input', generate)
eclSelect.addEventListener('change', generate)
generateBtn.addEventListener('click', generate)
downloadBtn.addEventListener('click', downloadPng)
copyBtn.addEventListener('click', copyImage)
clearBtn.addEventListener('click', clearAll)

updateIndicators()
setActionState()
