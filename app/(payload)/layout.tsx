import { RootLayout } from '@payloadcms/next/layouts'
import config from '@payload-config'
import { importMap } from './importMap'
import { serverFunction } from './actions'
import '@payloadcms/next/css'
import React from 'react'

export default function PayloadLayout({ children }: { children: React.ReactNode }) {
  return (
    <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
      {children}
    </RootLayout>
  )
}
