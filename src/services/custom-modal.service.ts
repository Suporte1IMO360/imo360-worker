import type { Bindings } from '../types/env'
import { decodeSingleHash } from '../utils/hashid'
import { findWebsiteCustomModalByAgencyIdAndLang } from '../repositories/website.repository'
import { resolveWebsiteFileUrl } from './website.service'

type SupportedLang = 'pt' | 'en' | 'es' | 'fr' | 'de'

function normalizeLang(lang: string | undefined): SupportedLang {
  const value = (lang || 'pt').toLowerCase()

  if (value === 'en' || value === 'es' || value === 'fr' || value === 'de') {
    return value
  }

  return 'pt'
}

export async function getCustomModalByHash(
  env: Bindings,
  hash: string,
  langInput?: string
): Promise<Record<string, string>> {
  const agencyId = decodeSingleHash(env, hash)
  const lang = normalizeLang(langInput)

  const modal = await findWebsiteCustomModalByAgencyIdAndLang(env, agencyId, lang)

  if (!modal) {
    return {}
  }

  const image = modal.image ? (resolveWebsiteFileUrl(env, modal.image, agencyId, hash) || '') : ''

  return {
    title: modal.title || '',
    description: modal.description || '',
    image,
    button_text: modal.text_button || '',
    button_link: modal.url || ''
  }
}
