'use server'
import { handleServerFunctions } from '@payloadcms/next/layouts'
import config from '@payload-config'
import { importMap } from './importMap'
import type { ServerFunctionClient } from 'payload'

export const serverFunction: ServerFunctionClient = async (args) =>
  handleServerFunctions({ ...args, config, importMap })
