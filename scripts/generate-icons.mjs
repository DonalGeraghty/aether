import sharp from 'sharp'
import { fileURLToPath } from 'node:url'

const filePath = (relativePath) => fileURLToPath(new URL(relativePath, import.meta.url))
const source = filePath('../artwork/Aether-icon-source.png')

await Promise.all([
  sharp(source)
    .resize(32, 32, { fit: 'cover' })
    .png({ compressionLevel: 9, palette: true })
    .toFile(filePath('../public/favicon-32.png')),
  sharp(source)
    .resize(180, 180, { fit: 'cover' })
    .png({ compressionLevel: 9 })
    .toFile(filePath('../public/apple-touch-icon.png')),
  sharp(source)
    .resize(128, 128, { fit: 'cover' })
    .webp({ quality: 84, smartSubsample: true })
    .toFile(filePath('../public/aether-icon-128.webp')),
])

console.log('Generated optimized Aether icons')
