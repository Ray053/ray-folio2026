import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { WorkPage, type WorkItem } from '@/components/sections/WorkPage'
import { getProjects } from '@/lib/payload'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('workPage')
  return { title: `${t('heading')} — Ray` }
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const cms = await getProjects(locale)
  const projects: WorkItem[] = cms.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    description: p.description,
    tags: p.tags,
    year: p.year,
    coverColor: p.coverColor,
  }))
  return <WorkPage projects={projects} />
}
