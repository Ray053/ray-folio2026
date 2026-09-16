/**
 * Sets the `order` field on all Projects so ChuangHua (a 3D/Blender demo,
 * not a UX case study) sorts last on the /work page, ahead of the other
 * three UX projects.
 * Run with:
 *   node --env-file=.env.local node_modules/tsx/dist/cli.mjs scripts/reorder-projects.ts
 */
import { getPayload } from 'payload'
import config from '../payload.config'

const ORDER = ['TourTaichung2023', 'group-buy-ops', 'streetdance-learning-platform', '3D-chuanghua']

async function run() {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({ collection: 'projects' as any, limit: 100, depth: 0 })

  for (const doc of docs as any[]) {
    const index = ORDER.indexOf(doc.slug)
    if (index === -1) {
      console.log(`Skipping unrecognized slug: ${doc.slug}`)
      continue
    }
    await payload.update({ collection: 'projects' as any, id: doc.id, data: { order: index } })
    console.log(`Set order=${index} for ${doc.slug}`)
  }

  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
