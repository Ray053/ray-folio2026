import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ProjectDetailPage } from '@/components/sections/ProjectDetailPage'
import { getProjectBySlug, getProjectSlugs } from '@/lib/payload'

type Props = { params: Promise<{ slug: string; locale: string }> }

export async function generateStaticParams() {
  const slugs = await getProjectSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params
  const project = await getProjectBySlug(slug, locale)
  if (!project) return {}
  return { title: `${project.title} — Ray` }
}

export default async function Page({ params }: Props) {
  const { slug, locale } = await params
  const project = await getProjectBySlug(slug, locale)
  if (!project) notFound()

  return (
    <ProjectDetailPage
      project={{
        slug: project.slug,
        title: project.title,
        description: project.description,
        tags: project.tags,
        year: project.year,
        coverColor: project.coverColor,
        coverSrc: project.coverSrc,
        liveUrl: project.liveUrl,
      }}
    />
  )
}
