import manifest from '../generated/images.json'

export type ImageId = keyof typeof manifest

interface PictureProps {
  id: ImageId
  /**
   * Describe what's happening in the shot. Pass "" only for images
   * that add nothing a screen reader user would miss.
   */
  alt: string
  /** Matches the CSS width of the slot — drives which source is picked. */
  sizes: string
  className?: string
  /** object-position, for shots whose subject isn't centred. */
  position?: string
  /** Set on the one image above the fold; everything else lazy-loads. */
  priority?: boolean
}

const srcSet = (id: ImageId, ext: string) =>
  manifest[id].widths.map((w) => `/img/${id}-${w}.${ext} ${w}w`).join(', ')

/**
 * Responsive <picture> over the build-generated derivatives.
 *
 * AVIF first, WebP next, JPEG last — browsers take the first format
 * they understand. width/height come from the manifest so the box is
 * reserved before the bytes arrive and nothing shifts on load.
 */
export function Picture({
  id,
  alt,
  sizes,
  className = '',
  position = 'center',
  priority = false,
}: PictureProps) {
  const meta = manifest[id]
  const fallbackWidth = meta.widths[meta.widths.length - 1]

  return (
    // <picture> is display:inline by default, which leaves the img's
    // h-full with no definite height to resolve against — the image
    // collapses in any slot sized by min-height. Make it fill.
    <picture className="block size-full">
      <source type="image/avif" srcSet={srcSet(id, 'avif')} sizes={sizes} />
      <source type="image/webp" srcSet={srcSet(id, 'webp')} sizes={sizes} />
      <img
        src={`/img/${id}-${fallbackWidth}.jpg`}
        srcSet={srcSet(id, 'jpg')}
        sizes={sizes}
        alt={alt}
        width={meta.width}
        height={meta.height}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding={priority ? 'sync' : 'async'}
        className={`size-full object-cover ${className}`}
        style={{ objectPosition: position }}
      />
    </picture>
  )
}
