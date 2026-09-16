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
    expect(html).toContain('url=%2Fcustom-cover.jpg')
    expect(html).not.toContain('prototype-order-flow.mp4')
    expect(html).toContain('opacity:0')
  })

  it('keeps an image-only project image-only', () => {
    const html = renderToStaticMarkup(createElement(ProjectPreviewMedia, {
      slug: 'streetdance-learning-platform', active: true,
    }))
    expect(html).toContain('url=%2Fcase-studies%2Fdance%2Fcourse-platform.png')
    expect(html).not.toContain('<video')
  })

  it('does not load or play video while the preview is inactive', () => {
    const html = renderToStaticMarkup(createElement(ProjectPreviewMedia, {
      slug: 'group-buy-ops', active: false,
    }))
    expect(html).toContain('url=%2Fcase-studies%2Fgroup-buy%2Fcover.jpg')
    expect(html).not.toContain('<video')
  })

  it('does not borrow another project media for an unknown project', () => {
    expect(renderToStaticMarkup(createElement(ProjectPreviewMedia, {
      slug: 'new-project', active: true,
    }))).toBe('')
  })
})
