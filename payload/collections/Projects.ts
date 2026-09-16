import type { CollectionConfig } from 'payload'

export const Projects: CollectionConfig = {
  slug: 'projects',
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
      name: 'slug',
      type: 'text',
      unique: true,
      required: true,
    },
    {
      name: 'description',
      type: 'richText',
      localized: true,
    },
    {
      name: 'tags',
      type: 'array',
      fields: [
        {
          name: 'tag',
          type: 'text',
        },
      ],
    },
    {
      name: 'coverImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'video',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'orientation',
      type: 'select',
      defaultValue: 'landscape',
      options: [
        { label: 'Landscape (wide screen recording)', value: 'landscape' },
        { label: 'Portrait (phone/vertical video)', value: 'portrait' },
        { label: 'Square', value: 'square' },
      ],
      admin: {
        description: 'Shape of the cover image/video, used to size this project\'s card on the /work bento grid so it matches the media instead of stretching or cropping it.',
      },
    },
    {
      name: 'gallery',
      type: 'array',
      labels: { singular: 'Image', plural: 'Gallery' },
      admin: {
        description: 'Extra project images/screenshots (Behance/Webflow-style), shown as a gallery on the case-study page — separate from the single Cover Image above.',
      },
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
        {
          name: 'caption',
          type: 'text',
          localized: true,
        },
      ],
    },
    {
      name: 'liveUrl',
      type: 'text',
    },
    {
      name: 'role',
      type: 'text',
    },
    {
      name: 'duration',
      type: 'text',
    },
    {
      name: 'outcome',
      type: 'textarea',
      localized: true,
    },
    {
      name: 'caseStudy',
      type: 'textarea',
      localized: true,
      admin: {
        description: 'Long-form case study body. Separate paragraphs with a blank line.',
      },
    },
    {
      name: 'year',
      type: 'number',
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'order',
      type: 'number',
    },
  ],
}
