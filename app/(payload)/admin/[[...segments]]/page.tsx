import type { Metadata } from 'next'
import { RootPage, generatePageMetadata } from '@payloadcms/next/views'
import config from '@payload-config'
import { importMap } from '../../importMap'
import '@payloadcms/next/css'

type Args = {
  params: Promise<{ segments: string[] }>
  searchParams: Promise<{ [key: string]: string | string[] }>
}

export const generateMetadata = async ({ params, searchParams }: Args): Promise<Metadata> => {
  return generatePageMetadata({ config, params, searchParams })
}

export default async function Page({ params, searchParams }: Args) {
  return RootPage({ config, importMap, params, searchParams })
}
