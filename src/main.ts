export {}

const canvas = document.createElement("canvas")

canvas.width = 400
canvas.height = 224

async function loadImage(url: string) {
  const response = await fetch(url)
  const blob = await response.blob()
  const image = await createImageBitmap(blob)
  return image
}

async function start() {
  const texture = await loadImage("/LevelTexture.png")
  const normal = await loadImage("/LevelNormal.png")

  document.body.appendChild(canvas)

  const ctx = canvas.getContext("2d")!
  ctx.drawImage(normal, 0, 0)
  const normalData = ctx.getImageData(0, 0, 400, 224)

  requestAnimationFrame(function loop() {
    ctx.drawImage(texture, 0, 0)

    const imageData = ctx.getImageData(0, 0, 400, 224)
    const pixels = imageData.data

    for (let i = 0; i < pixels.length; i += 4) {
      const x = (i / 4) % 400
      const y = Math.floor(i / 4 / 400)

      const r = pixels[i]
      const g = pixels[i + 1]
      const b = pixels[i + 2]
      // const a = pixels[i + 3]

      const hsl = rgbToHsl(r, g, b)
      const distance = Math.sqrt(
        (x - lightPos[0]) ** 2 + (y - lightPos[1]) ** 2
      )
      const globalDarkness = 0.2
      hsl[2] -= globalDarkness
      if (distance < 50) {
        // if (hsl[2] == 0) continue
        const normal = normalData.data.slice(i, i + 3)
        const normalVector = [256 - normal[0] - 128, normal[1] - 128]
        const lightVector = [x - lightPos[0], y - lightPos[1]]
        const dot =
          normalVector[0] * lightVector[0] + normalVector[1] * lightVector[1]
        if (dot >= -100) hsl[2] += globalDarkness
      }
      const newRgb = hslToRgb(hsl[0], hsl[1], hsl[2])
      pixels[i] = newRgb[0]
      pixels[i + 1] = newRgb[1]
      pixels[i + 2] = newRgb[2]
    }

    ctx.putImageData(imageData, 0, 0)

    requestAnimationFrame(loop)
  })

  function rgbToHsl(r: number, g: number, b: number) {
    r /= 255
    g /= 255
    b /= 255

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h = (max + min) / 2
    let s = h
    const l = h

    if (max === min) {
      h = s = 0 // achromatic
    } else {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0)
          break
        case g:
          h = (b - r) / d + 2
          break
        case b:
          h = (r - g) / d + 4
          break
      }

      h /= 6
    }

    return [h, s, l]
  }

  function hslToRgb(h: number, s: number, l: number) {
    let r: number, g: number, b: number
    if (s === 0) {
      r = g = b = l // achromatic
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1
        if (t > 1) t -= 1
        if (t < 1 / 6) return p + (q - p) * 6 * t
        if (t < 1 / 2) return q
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
        return p
      }
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s
      const p = 2 * l - q
      r = hue2rgb(p, q, h + 1 / 3)
      g = hue2rgb(p, q, h)
      b = hue2rgb(p, q, h - 1 / 3)
    }
    return [r * 255, g * 255, b * 255]
  }

  let lightPos = [0, 0]
  document.onmousemove = (e) => {
    const x = e.clientX
    const y = e.clientY
    lightPos = [x - canvas.offsetLeft, y - canvas.offsetTop]
  }
}

start()
