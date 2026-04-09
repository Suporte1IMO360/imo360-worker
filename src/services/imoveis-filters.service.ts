import type { Bindings } from '../types/env'
import { decodeSingleHash } from '../utils/hashid'
import {
  findImovelDealTypeRows,
  findImovelNatureRows
} from '../repositories/imoveis.repository'

type SupportedLang = 'pt' | 'en' | 'es' | 'fr' | 'de'

const SPECIAL_MULTI_AGENCY_HASH_ID = 397
const SPECIAL_MULTI_AGENCY_IDS = [350, 382, 534, 726, 2160]

function normalizeLang(lang: string | undefined): SupportedLang {
  const value = (lang || 'pt').toLowerCase()

  if (value === 'en' || value === 'es' || value === 'fr' || value === 'de') {
    return value
  }

  return 'pt'
}

function isFilled(value: string | undefined): boolean {
  return Boolean(value && value.trim() !== '')
}

function resolveScopeIds(decodedId: number): number[] {
  if (decodedId === SPECIAL_MULTI_AGENCY_HASH_ID) {
    return SPECIAL_MULTI_AGENCY_IDS
  }

  return [decodedId]
}

function toPluckMap<T extends { id: number }>(
  rows: T[],
  valueGetter: (row: T) => string | null
): Record<string, string | null> {
  const result: Record<string, string | null> = {}

  for (const row of rows) {
    result[String(row.id)] = valueGetter(row)
  }

  return result
}

export async function getTipoImovelByHash(
  env: Bindings,
  hash: string,
  options: { lang?: string; type?: string }
): Promise<Record<string, string | null>> {
  const decodedId = decodeSingleHash(env, hash)
  const lang = normalizeLang(options.lang)
  const byColaborador = isFilled(options.type)
  const scopeIds = resolveScopeIds(decodedId)

  const rows = await findImovelNatureRows(env, scopeIds, byColaborador)

  return toPluckMap(rows, (row) => row[lang])
}

export async function getTipoNegocioByHash(
  env: Bindings,
  hash: string,
  options: { lang?: string; type?: string }
): Promise<Record<string, string | null>> {
  const decodedId = decodeSingleHash(env, hash)
  const lang = normalizeLang(options.lang)
  const byColaborador = isFilled(options.type)
  const scopeIds = resolveScopeIds(decodedId)

  const rows = await findImovelDealTypeRows(env, scopeIds, byColaborador)

  return toPluckMap(rows, (row) => row[lang])
}
