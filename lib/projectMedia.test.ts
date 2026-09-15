import { existsSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { getPlaceholderProjectBySlug } from './placeholderProjects'

describe('project preview assets when CMS is unavailable', () => {
  it.each(['group-buy-ops', 'streetdance-learning-platform'])('%s has a deployable cover', (slug) => {
    const project = getPlaceholderProjectBySlug(slug)!
    expect(project.coverSrc).toBeTruthy()
    expect(existsSync(path.join(process.cwd(), 'public', project.coverSrc!))).toBe(true)
  })

  it('uses the group-buy demo instead of an unrelated project clip', () => {
    expect(getPlaceholderProjectBySlug('group-buy-ops')?.videoSrc)
      .toBe('/case-studies/group-buy/prototype-order-flow.mp4')
  })

  it('does not invent a video for the dance research project', () => {
    expect(getPlaceholderProjectBySlug('streetdance-learning-platform')?.videoSrc).toBeFalsy()
  })
})
