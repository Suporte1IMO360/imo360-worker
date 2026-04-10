import type { Bindings } from '../types/env'
import { decodeSingleHash } from '../utils/hashid'
import { findTestimonialsByAgencyIds, type TestimonialRow } from '../repositories/website.repository'

type SupportedLang = 'pt' | 'en' | 'es' | 'fr' | 'de'

type TestimonialPayload = {
  name: string
  content: string
  type: string
  date: string
}

type TestimonialInfoLang = {
  name?: string
  content?: string
  customer_type?: string
  date?: string
}

type TestimonialInfo = {
  pt?: TestimonialInfoLang
  en?: TestimonialInfoLang
  es?: TestimonialInfoLang
  fr?: TestimonialInfoLang
  de?: TestimonialInfoLang
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

function asString(value: unknown): string {
  if (value === null || value === undefined) {
    return ''
  }

  return String(value)
}

function parseInfo(raw: string | null): TestimonialInfo | null {
  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw)

    if (!parsed || typeof parsed !== 'object') {
      return null
    }

    return parsed as TestimonialInfo
  } catch {
    return null
  }
}

function getLocalizedInfo(info: TestimonialInfo, lang: SupportedLang): TestimonialInfoLang {
  if (lang === 'en' && info.en) {
    return info.en
  }

  if (lang === 'es' && info.es) {
    return info.es
  }

  if (lang === 'fr' && info.fr) {
    return info.fr
  }

  if (lang === 'de' && info.de) {
    return info.de
  }

  return info.pt || {}
}

function mapRow(row: TestimonialRow, lang: SupportedLang): TestimonialPayload | null {
  const info = parseInfo(row.information)

  if (!info) {
    return null
  }

  const localized = getLocalizedInfo(info, lang)

  return {
    name: asString(localized.name),
    content: asString(localized.content),
    type: asString(localized.customer_type),
    date: asString(localized.date)
  }
}

export async function getTestimonialsByHash(
  env: Bindings,
  hash: string,
  langInput?: string
): Promise<TestimonialPayload[]> {
  const lang = normalizeLang(langInput)
  const decodedId = decodeSingleHash(env, hash)
  const scopeIds = resolveScopeIds(decodedId)
  const rows = await findTestimonialsByAgencyIds(env, scopeIds)

  return rows
    .map((row) => mapRow(row, lang))
    .filter((item): item is TestimonialPayload => item !== null)
}
