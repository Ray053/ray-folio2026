/**
 * Points TourTaichung and ChuangHua at their Behance galleries instead of
 * the internal case-study page — these two don't have full write-ups here,
 * so send visitors straight to the source.
 * Run with:
 *   node --env-file=.env.local node_modules/tsx/dist/cli.mjs scripts/set-behance-links.ts
 */
import { getPayload } from 'payload'
import config from '../payload.config'

const LINKS: Record<string, string> = {
  TourTaichung2023: 'https://www.behance.net/gallery/200150923/app-Redesign',
  '3D-chuanghua': 'https://www.behance.net/gallery/245039419/Naked-eye-3DProjection-mapping',
}

async function run() {
  const payload = await getPayload({ config })

  for (const [slug, liveUrl] of Object.entries(LINKS)) {
    const { docs } = await payload.find({
      collection: 'projects' as any,
      limit: 1,
      depth: 0,
      where: { slug: { equals: slug } },
    })
    const doc = docs[0]
    if (!doc) {
      console.log(`Skipped ${slug} (not found)`)
      continue
    }
    await payload.update({ collection: 'projects' as any, id: doc.id, data: { liveUrl } })
    console.log(`Set liveUrl for ${slug} -> ${liveUrl}`)
  }

  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
