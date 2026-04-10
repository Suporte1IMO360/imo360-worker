import type { Bindings } from '../types/env'
import { decodeSingleHash } from '../utils/hashid'
import { findWebsiteServicesByAgencyIdAndLang } from '../repositories/website.repository'

type SupportedLang = 'pt' | 'en' | 'es' | 'fr' | 'de'

function normalizeLang(lang: string | undefined): SupportedLang {
  const value = (lang || 'pt').toLowerCase()

  if (value === 'en' || value === 'es' || value === 'fr' || value === 'de') {
    return value
  }

  return 'pt'
}

export async function getServicesByHash(
  env: Bindings,
  hash: string,
  langInput?: string
): Promise<Array<{ title: string | null; description: string | null }>> {
  const agencyId = decodeSingleHash(env, hash)
  const lang = normalizeLang(langInput)

  return findWebsiteServicesByAgencyIdAndLang(env, agencyId, lang)
}
