import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { AboutSection } from '@/components/sections/AboutSection'
import { getSiteInfo } from '@/lib/payload'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('about')
  return { title: `${t('eyebrow')} — Ray` }
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const site = await getSiteInfo(locale)

  return (
    <AboutSection
      info={site ? {
        name: site.name,
        bio: site.bio,
        photoSrc: site.photoSrc,
        email: site.email,
        github: site.github,
        linkedin: site.linkedin,
        cvSrc: site.cvSrc,
      } : undefined}
    />
  )
}
