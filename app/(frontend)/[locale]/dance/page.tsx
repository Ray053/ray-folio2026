import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { DancePage, type DanceVideoItem } from '@/components/sections/DancePage'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('dancePage')
  return { title: `${t('heading')} — Ray` }
}

type Upload = { url?: string | null } | string | number | null | undefined
const urlOf = (u: Upload): string =>
  u && typeof u === 'object' && 'url' in u && u.url ? u.url : ''

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params

  let videos: DanceVideoItem[] = []
  try {
    const payload = await getPayload({ config })
    const { docs } = await payload.find({
      collection: 'dance-videos',
      depth: 1,
      limit: 24,
      sort: 'order',
      locale: locale as 'zh' | 'en',
    })
    videos = docs.map((d) => ({
      id: String(d.id),
      title: typeof d.title === 'string' ? d.title : 'Untitled',
      year: typeof d.year === 'number' ? d.year : new Date().getFullYear(),
      videoSrc: urlOf(d.video as Upload),
      thumbnailSrc: urlOf(d.thumbnail as Upload),
    }))
  } catch (e) {
    console.error('Failed to load dance videos:', e)
  }

  return <DancePage videos={videos} />
}
