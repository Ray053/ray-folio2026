'use client'
import React, { useState } from 'react'
import Image from 'next/image'
import { getPlaceholderProjectBySlug } from '../../lib/placeholderProjects'

const mediaStyle: React.CSSProperties = {
  position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain',
}

/** Only mount a clip while previewing; keep the cover visible until it plays. */
function PreviewVideo({ src, poster }: { src: string; poster?: string }) {
  const [playing, setPlaying] = useState(false)
  const [failed, setFailed] = useState(false)
  if (failed) return null
  return (
    <video
      src={src} poster={poster} muted loop autoPlay playsInline
      onPlaying={() => setPlaying(true)}
      onError={() => setFailed(true)}
      style={{ ...mediaStyle, opacity: playing ? 1 : 0, transition: 'opacity 0.3s ease' }}
    />
  )
}

export function ProjectPreviewMedia({ slug, coverSrc, videoSrc, active }: {
  slug: string
  coverSrc?: string
  videoSrc?: string
  active: boolean
}) {
  const fallback = getPlaceholderProjectBySlug(slug)
  const [failedCover, setFailedCover] = useState<string>()
  const primaryCover = coverSrc || fallback?.coverSrc
  const cover = primaryCover === failedCover ? fallback?.coverSrc : primaryCover
  const video = videoSrc || fallback?.videoSrc
  return (
    <>
      {cover && (
        <Image src={cover} alt="" fill sizes="(max-width: 768px) 100vw, 50vw"
          style={{ objectFit: 'contain' }} onError={() => setFailedCover(cover)} />
      )}
      {active && video && <PreviewVideo key={video} src={video} poster={cover} />}
    </>
  )
}
