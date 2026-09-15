/**
 * Adds the missing cover image to the group-buy-ops project, using the
 * promo poster (browser + phone mockup of the ops dashboard and customer
 * app) from D:\PersonalFile\Edit\group-buy-portfolio\website\renders.
 * Run with:
 *   node --env-file=.env.local node_modules/tsx/dist/cli.mjs scripts/add-group-buy-cover.ts
 */
import { getPayload } from 'payload'
import config from '../payload.config'

async function run() {
  const payload = await getPayload({ config })

  const { docs } = await payload.find({ collection: 'projects' as any, limit: 100, depth: 0, where: { slug: { equals: 'group-buy-ops' } } })
  const doc = docs[0]
  if (!doc) {
    console.log('group-buy-ops not found — run seed-new-projects.ts first')
    process.exit(1)
  }

  const media = await payload.create({
    collection: 'media' as any,
    data: { alt: '代購營運管理系統 Banner：左為客戶前台訂單查詢頁的手機畫面，右為後台 Dashboard 瀏覽器畫面' },
    filePath: 'D:\\PersonalFile\\Edit\\group-buy-portfolio\\website\\renders\\group-buy-poster.jpg',
  })

  await payload.update({
    collection: 'projects' as any,
    id: doc.id,
    data: { coverImage: media.id },
  })

  console.log('Set group-buy-ops coverImage to media', media.id)
  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
