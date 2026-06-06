import type { CollectionConfig } from 'payload'

export const DanceVideos: CollectionConfig = {
  slug: 'dance-videos',
  access: { read: () => true },
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      localized: true,
      required: true,
    },
    {
      name: 'video',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'thumbnail',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'description',
      type: 'textarea',
      localized: true,
    },
    {
      name: 'year',
      type: 'number',
    },
    {
      name: 'order',
      type: 'number',
    },
  ],
}
