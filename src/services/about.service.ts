import type { Bindings } from '../types/env'
import { decodeSingleHash } from '../utils/hashid'
import { findAboutBlockByAgencyIdAndLang } from '../repositories/website.repository'
import { resolveWebsiteFileUrl } from './website.service'

type SupportedLang = 'pt' | 'en' | 'es' | 'fr' | 'de'

function normalizeLang(lang: string | undefined): SupportedLang {
  const value = (lang || 'pt').toLowerCase()

  if (value === 'en' || value === 'es' || value === 'fr' || value === 'de') {
    return value
  }

  return 'pt'
}

export async function getAboutByHash(
  env: Bindings,
  hash: string,
  langInput?: string
): Promise<Record<string, string>> {
  const agencyId = decodeSingleHash(env, hash)
  const lang = normalizeLang(langInput)

  const aboutBlock = await findAboutBlockByAgencyIdAndLang(env, agencyId, lang)

  if (!aboutBlock) {
    return {}
  }

  return {
    video: aboutBlock.video_url || '',
    description: aboutBlock.description || '',
    foto: aboutBlock.image ? (resolveWebsiteFileUrl(env, aboutBlock.image, agencyId, hash) || '') : ''
  }
}
