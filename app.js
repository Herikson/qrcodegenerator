import QRCode from 'https://cdn.jsdelivr.net/npm/qrcode@1.5.3/+esm'

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

function updateIndicators() {
  sizeValue.textContent = `${sizeInput.value} px`
  marginValue.textContent = `${marginInput.value}`
}

function hasText() {
  return (textInput.value || '').trim().length > 0
}

function setActionState() {
  const enabled = hasText()
  downloadBtn.disabled = !enabled
  copyBtn.disabled = !enabled
}

function ensureCanvasSize() {
  const size = parseInt(sizeInput.value, 10) || 256
  canvas.width = size
  canvas.height = size
}

async function generate() {
  const value = textInput.value.trim()
  if (!value) {
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setActionState()
    return
  }
  ensureCanvasSize()
  updateIndicators()
  const margin = parseInt(marginInput.value, 10) || 0
  const errorCorrectionLevel = eclSelect.value
  await QRCode.toCanvas(canvas, value, {
    width: canvas.width,
    margin,
    errorCorrectionLevel,
    color: { dark: '#000000', light: '#ffffff' }
  })
  setActionState()
}

function downloadPng() {
  const value = textInput.value.trim()
  if (!value) return
  const url = canvas.toDataURL('image/png')
  const a = document.createElement('a')
  a.href = url
  a.download = 'qr.png'
  document.body.appendChild(a)
  a.click()
  a.remove()
}

function copyImage() {
  const value = textInput.value.trim()
  if (!value) return
  canvas.toBlob(async blob => {
    if (!blob) return
    if (navigator.clipboard && window.ClipboardItem) {
      const item = new ClipboardItem({ 'image/png': blob })
      try {
        await navigator.clipboard.write([item])
      } catch {}
    } else {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'qr.png'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    }
  }, 'image/png')
}

function clearAll() {
  textInput.value = ''
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  setActionState()
}

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
