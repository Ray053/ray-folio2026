import { buildConfig } from 'payload'
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import path from 'path'
import { fileURLToPath } from 'url'

import { Users } from './payload/collections/Users'
import { Media } from './payload/collections/Media'
import { Projects } from './payload/collections/Projects'
import { DanceVideos } from './payload/collections/DanceVideos'
import { SiteInfo } from './payload/globals/SiteInfo'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, Projects, DanceVideos],
  globals: [SiteInfo],
  editor: lexicalEditor(),
  db: mongooseAdapter({
    url: process.env.DATABASE_URI || '',
  }),
  secret: process.env.PAYLOAD_SECRET || '',
  localization: {
    locales: [
      { label: '繁體中文', code: 'zh' },
      { label: 'English', code: 'en' },
    ],
    defaultLocale: 'zh',
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  plugins: [
    // Cloud media storage on Vercel. Falls back to local disk in dev when the
    // BLOB token isn't set, so nothing changes locally.
    ...(process.env.BLOB_READ_WRITE_TOKEN
      ? [
          vercelBlobStorage({
            enabled: true,
            collections: { media: true },
            token: process.env.BLOB_READ_WRITE_TOKEN,
            // Upload straight from the browser to Blob, bypassing Vercel's
            // ~4.5MB serverless body limit. The client handler is registered
            // in app/(payload)/importMap.ts so the admin still renders.
            clientUploads: true,
          }),
        ]
      : []),
  ],
})
