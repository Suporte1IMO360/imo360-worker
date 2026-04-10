import type { Bindings } from '../types/env'
import { decodeSingleHash } from '../utils/hashid'
import { findCategoriesByUserIdsAndLang } from '../repositories/website.repository'

type SupportedLang = 'pt' | 'en' | 'es' | 'fr' | 'de'

type CategoryPayload = {
  id: number
  title: string
}

const SPECIAL_MULTI_AGENCY_HASH_ID = 397
const SPECIAL_MULTI_AGENCY_IDS = [350, 382, 534, 726, 2160]

function normalizeLang(lang: string | undefined): SupportedLang {
  const value = (lang || 'pt').toLowerCase()

  if (value === 'en' || value === 'es' || value === 'fr' || value === 'de') {
    return value
  }

  return 'pt'
}

function resolveScopeIds(decodedId: number): number[] {
  if (decodedId === SPECIAL_MULTI_AGENCY_HASH_ID) {
    return SPECIAL_MULTI_AGENCY_IDS
  }

  return [decodedId]
}

export async function getCategoriesByHash(
  env: Bindings,
  hash: string,
  langInput?: string
): Promise<CategoryPayload[]> {
  const lang = normalizeLang(langInput)
  const decodedId = decodeSingleHash(env, hash)
  const scopeIds = resolveScopeIds(decodedId)

  const rows = await findCategoriesByUserIdsAndLang(env, scopeIds, lang)

  return rows.map((row) => ({
    id: row.id,
    title: row.title || ''
  }))
}
