/**
 * Shortens the streetdance-learning-platform title — the "— Immersive
 * Learning Research" / "— 沉浸式學習研究" suffix made it wrap onto 3 lines
 * in the homepage accordion heading. The subtitle content already lives in
 * the tags/description, so it's safe to drop from the title itself.
 * Run with:
 *   node --env-file=.env.local node_modules/tsx/dist/cli.mjs scripts/shorten-streetdance-title.ts
 */
import { getPayload } from 'payload'
import config from '../payload.config'

async function run() {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'projects' as any,
    limit: 1,
    depth: 0,
    where: { slug: { equals: 'streetdance-learning-platform' } },
  })
  const doc = docs[0]
  if (!doc) {
    console.log('streetdance-learning-platform not found')
    process.exit(1)
  }

  await payload.update({
    collection: 'projects' as any,
    id: doc.id,
    locale: 'zh' as any,
    data: { title: '街舞學習平台' },
  })
  await payload.update({
    collection: 'projects' as any,
    id: doc.id,
    locale: 'en' as any,
    data: { title: 'Street Dance Learning Platform' },
  })

  console.log('Shortened title for streetdance-learning-platform')
  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
