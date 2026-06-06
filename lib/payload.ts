import { getPayload } from 'payload'
import config from '@payload-config'

/* eslint-disable @typescript-eslint/no-explicit-any */

type Upload = { url?: string | null } | string | number | null | undefined
export const urlOf = (u: Upload): string =>
  u && typeof u === 'object' && 'url' in u && u.url ? u.url : ''

/** Flatten a Lexical richText value into plain text. */
export function lexicalToText(data: any): string {
  if (!data || typeof data !== 'object' || !data.root?.children) return ''
  const walk = (nodes: any[]): string =>
    nodes
      .map((n) => (typeof n.text === 'string' ? n.text : n.children ? walk(n.children) : ''))
      .join('')
  return data.root.children
    .map((c: any) => walk(c.children ?? []))
    .filter(Boolean)
    .join('\n')
    .trim()
}

const COLORS = ['#1B3550', '#122333', '#254A64', '#0D1B2A']

export type CMSProject = {
  id: string
  slug: string
  title: string
  description: string
  tags: string[]
  year: number
  coverColor: string
  coverSrc: string
  videoSrc: string
  liveUrl: string
}

function mapProject(d: any, i = 0): CMSProject {
  return {
    id: String(d.id),
    slug: typeof d.slug === 'string' && d.slug ? d.slug : String(d.id),
    title: typeof d.title === 'string' ? d.title : 'Untitled',
    description: lexicalToText(d.description),
    tags: Array.isArray(d.tags) ? d.tags.map((t: any) => t?.tag).filter(Boolean) : [],
    year: typeof d.year === 'number' ? d.year : new Date().getFullYear(),
    coverColor: COLORS[i % COLORS.length],
    coverSrc: urlOf(d.coverImage),
    videoSrc: urlOf(d.video),
    liveUrl: typeof d.liveUrl === 'string' ? d.liveUrl : '',
  }
}

export async function getProjects(locale: string, opts?: { featured?: boolean }): Promise<CMSProject[]> {
  try {
    const payload = await getPayload({ config })
    const { docs } = await payload.find({
      collection: 'projects' as any,
      depth: 1,
      limit: 50,
      sort: 'order',
      locale: locale as any,
      ...(opts?.featured ? { where: { featured: { equals: true } } } : {}),
    })
    return docs.map((d, i) => mapProject(d, i))
  } catch (e) {
    console.error('getProjects failed:', e)
    return []
  }
}

export async function getProjectBySlug(slug: string, locale: string): Promise<CMSProject | null> {
  try {
    const payload = await getPayload({ config })
    const { docs } = await payload.find({
      collection: 'projects' as any,
      depth: 1,
      limit: 1,
      locale: locale as any,
      where: { slug: { equals: slug } },
    })
    return docs[0] ? mapProject(docs[0]) : null
  } catch (e) {
    console.error('getProjectBySlug failed:', e)
    return null
  }
}

export async function getProjectSlugs(): Promise<string[]> {
  try {
    const payload = await getPayload({ config })
    const { docs } = await payload.find({ collection: 'projects' as any, depth: 0, limit: 100 })
    return docs.map((d: any) => d.slug).filter(Boolean)
  } catch {
    return []
  }
}

export type CMSSiteInfo = {
  name: string
  bio: string
  photoSrc: string
  email: string
  github: string
  linkedin: string
  cvSrc: string
}

export async function getSiteInfo(locale: string): Promise<CMSSiteInfo | null> {
  try {
    const payload = await getPayload({ config })
    const g: any = await payload.findGlobal({ slug: 'site-info' as any, depth: 1, locale: locale as any })
    return {
      name: typeof g.name === 'string' ? g.name : '',
      bio: lexicalToText(g.bio),
      photoSrc: urlOf(g.photo),
      email: typeof g.email === 'string' ? g.email : '',
      github: typeof g.github === 'string' ? g.github : '',
      linkedin: typeof g.linkedin === 'string' ? g.linkedin : '',
      cvSrc: urlOf(g.cvFile),
    }
  } catch (e) {
    console.error('getSiteInfo failed:', e)
    return null
  }
}
