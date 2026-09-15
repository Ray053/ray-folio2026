import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ProjectPreviewMedia } from './ProjectPreviewMedia'

describe('project preview rendering', () => {
  it('renders the assigned CMS video, not a sample chosen by list order', () => {
    const html = renderToStaticMarkup(createElement(ProjectPreviewMedia, {
      slug: 'group-buy-ops', coverSrc: '/custom-cover.jpg', videoSrc: '/custom-demo.mp4', active: true,
    }))
    expect(html).toContain('src="/custom-demo.mp4"')
    expect(html).toContain('src="/custom-cover.jpg"')
    expect(html).not.toContain('prototype-order-flow.mp4')
    expect(html).toContain('opacity:0')
  })

  it('keeps an image-only project image-only', () => {
    const html = renderToStaticMarkup(createElement(ProjectPreviewMedia, {
      slug: 'streetdance-learning-platform', active: true,
    }))
    expect(html).toContain('src="/case-studies/dance/course-platform.png"')
    expect(html).not.toContain('<video')
  })

  it('does not load or play video while the preview is inactive', () => {
    const html = renderToStaticMarkup(createElement(ProjectPreviewMedia, {
      slug: 'group-buy-ops', active: false,
    }))
    expect(html).toContain('src="/case-studies/group-buy/cover.jpg"')
    expect(html).not.toContain('<video')
  })

  it('does not borrow another project media for an unknown project', () => {
    expect(renderToStaticMarkup(createElement(ProjectPreviewMedia, {
      slug: 'new-project', active: true,
    }))).toBe('')
  })
})
