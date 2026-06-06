import type { GlobalConfig } from 'payload'

export const SiteInfo: GlobalConfig = {
  slug: 'site-info',
  access: { read: () => true },
  fields: [
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'bio',
      type: 'richText',
      localized: true,
    },
    {
      name: 'photo',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'email',
      type: 'email',
    },
    {
      name: 'github',
      type: 'text',
    },
    {
      name: 'linkedin',
      type: 'text',
    },
    {
      name: 'cvFile',
      type: 'upload',
      relationTo: 'media',
    },
  ],
}
