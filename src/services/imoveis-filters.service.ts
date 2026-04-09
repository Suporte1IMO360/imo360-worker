import type { Bindings } from '../types/env'
import { decodeSingleHash } from '../utils/hashid'
import {
  findCeRows,
  findConcelhoDistritoById,
  findConcelhoRowsByScope,
  findConcelhosRowsOnlineOnly,
  findConcelhosRows,
  findDisponibilidadeRows,
  findDistritoRowsByScope,
  findDistritosRowsOnlineOnly,
  findDistritosRows,
  findFreguesiaConcelhoById,
  findFreguesiaRowsByScope,
  findFreguesiasRowsOnlineOnly,
  findFreguesiasRows,
  findEstadoRows,
  findImovelDealTypeRows,
  findImovelNatureRows,
  findZonaRows
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

function parseOptionalPositiveInt(value: string | undefined): number | undefined {
  if (!value) {
    return undefined
  }

  const trimmed = value.trim()

  if (!/^\d+$/.test(trimmed)) {
    return undefined
  }

  return Number.parseInt(trimmed, 10)
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

function toTitleCase(text: string | null): string {
  if (!text) {
    return ''
  }

  return text
    .toLocaleLowerCase('pt-PT')
    .replace(/\b([a-z\u00c0-\u017f])/g, (match) => match.toLocaleUpperCase('pt-PT'))
}

function paginateLikeLaravel<T>(items: T[], perPage: number) {
  const currentPage = 1
  const total = items.length
  const data = items.slice(0, perPage)

  return {
    current_page: currentPage,
    data,
    from: total > 0 ? 1 : null,
    last_page: Math.max(1, Math.ceil(total / perPage)),
    per_page: perPage,
    to: data.length > 0 ? data.length : null,
    total
  }
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

export async function getPlacesByHash(
  env: Bindings,
  hash: string,
  options: { qry?: string; type?: string }
) {
  const queryText = options.qry ?? ''

  if (/^\d+$/.test(queryText.trim())) {
    return paginateLikeLaravel([], 5)
  }

  const decodedId = decodeSingleHash(env, hash)
  const byColaborador = isFilled(options.type)
  const scopeIds = resolveScopeIds(decodedId)
  const term = queryText.trim()

  const [distritos, concelhos, freguesias] = await Promise.all([
    findDistritosRows(env, term, scopeIds, byColaborador),
    findConcelhosRows(env, term, scopeIds, byColaborador),
    findFreguesiasRows(env, term, scopeIds, byColaborador)
  ])

  const results: Array<{
    text: string
    children: Array<{ id: string; text: string }>
  }> = []

  const distritoChildren = distritos.map((row) => ({
    id: `distrito_${row.id}`,
    text: toTitleCase(row.name)
  }))

  if (distritoChildren.length > 0) {
    results.push({ text: 'Distritos', children: distritoChildren })
  }

  const concelhoChildren = concelhos.map((row) => ({
    id: `concelho_${row.id}`,
    text: toTitleCase(row.name)
  }))

  if (concelhoChildren.length > 0) {
    results.push({ text: 'Concelhos', children: concelhoChildren })
  }

  const freguesiaChildren = freguesias.map((row) => ({
    id: `freguesia_${row.id}`,
    text: toTitleCase(row.name)
  }))

  if (freguesiaChildren.length > 0) {
    results.push({ text: 'Freguesias', children: freguesiaChildren })
  }

  return paginateLikeLaravel(results, 5)
}

export async function getOtherPlacesByHash(
  env: Bindings,
  hash: string,
  options: { qry?: string; type?: string }
): Promise<
  | []
  | {
      results: Array<{
        text: string
        children: Array<{ id: string; text: string }>
      }>
    }
> {
  const queryText = options.qry ?? ''

  if (/^\d+$/.test(queryText.trim())) {
    return []
  }

  const decodedId = decodeSingleHash(env, hash)
  const byColaborador = isFilled(options.type)
  const scopeIds = resolveScopeIds(decodedId)
  const term = queryText.trim()

  const [distritos, concelhos, freguesias] = await Promise.all([
    findDistritosRowsOnlineOnly(env, term, scopeIds, byColaborador),
    findConcelhosRowsOnlineOnly(env, term, scopeIds, byColaborador),
    findFreguesiasRowsOnlineOnly(env, term, scopeIds, byColaborador)
  ])

  return {
    results: [
      {
        text: 'Distritos',
        children: distritos.map((row) => ({
          id: `distrito_${row.id}`,
          text: row.name ?? ''
        }))
      },
      {
        text: 'Concelhos',
        children: concelhos.map((row) => ({
          id: `concelho_${row.id}`,
          text: row.name ?? ''
        }))
      },
      {
        text: 'Freguesias',
        children: freguesias.map((row) => ({
          id: `freguesia_${row.id}`,
          text: `${row.name ?? ''} (freguesia)`
        }))
      }
    ]
  }
}

export async function getDisponibilidadesByHash(
  env: Bindings,
  hash: string,
  options: { lang?: string; type?: string }
): Promise<Record<string, string | null>> {
  const decodedId = decodeSingleHash(env, hash)
  const lang = normalizeLang(options.lang)
  const byColaborador = isFilled(options.type)
  const scopeIds = resolveScopeIds(decodedId)

  const rows = await findDisponibilidadeRows(env, scopeIds, byColaborador)

  return toPluckMap(rows, (row) => row[lang])
}

export async function getEstadosByHash(
  env: Bindings,
  hash: string,
  options: { lang?: string; type?: string }
): Promise<Record<string, string | null>> {
  const decodedId = decodeSingleHash(env, hash)
  const lang = normalizeLang(options.lang)
  const byColaborador = isFilled(options.type)
  const scopeIds = resolveScopeIds(decodedId)

  const rows = await findEstadoRows(env, scopeIds, byColaborador)

  return toPluckMap(rows, (row) => row[lang])
}

export async function getZonasByHash(
  env: Bindings,
  hash: string,
  options: { type?: string; id?: string }
): Promise<Record<string, string | null>> {
  const decodedId = decodeSingleHash(env, hash)
  const byColaborador = isFilled(options.type)
  const scopeIds = resolveScopeIds(decodedId)
  const zonaIdFilter = parseOptionalPositiveInt(options.id)

  const rows = await findZonaRows(env, scopeIds, byColaborador, zonaIdFilter)

  return toPluckMap(rows, (row) => row.name)
}

export async function getCesByHash(
  env: Bindings,
  hash: string,
  options: { type?: string; id?: string }
): Promise<Record<string, string | null>> {
  const decodedId = decodeSingleHash(env, hash)
  const byColaborador = isFilled(options.type)
  const scopeIds = resolveScopeIds(decodedId)
  const ceIdFilter = parseOptionalPositiveInt(options.id)

  const rows = await findCeRows(env, scopeIds, byColaborador, ceIdFilter)

  return toPluckMap(rows, (row) => row.name)
}

export async function getDistritosByHash(
  env: Bindings,
  hash: string,
  options: { type?: string }
): Promise<Record<string, string | null>> {
  const decodedId = decodeSingleHash(env, hash)
  const byColaborador = isFilled(options.type)
  const scopeIds = resolveScopeIds(decodedId)

  const rows = await findDistritoRowsByScope(env, scopeIds, byColaborador)

  return toPluckMap(rows, (row) => row.name)
}

export async function getConcelhosByHash(
  env: Bindings,
  hash: string,
  options: { type?: string; distrito_id?: string }
): Promise<Record<string, string | null>> {
  const decodedId = decodeSingleHash(env, hash)
  const byColaborador = isFilled(options.type)
  const scopeIds = resolveScopeIds(decodedId)
  const distritoIdFilter = parseOptionalPositiveInt(options.distrito_id)

  const rows = await findConcelhoRowsByScope(
    env,
    scopeIds,
    byColaborador,
    distritoIdFilter
  )

  return toPluckMap(rows, (row) => toTitleCase(row.name))
}

export async function getConcelhoDistritoById(
  env: Bindings,
  concelhoid: string
): Promise<{ distrito_id: number | null } | null> {
  const concelhoId = parseOptionalPositiveInt(concelhoid)

  if (!concelhoId) {
    return null
  }

  return findConcelhoDistritoById(env, concelhoId)
}

export async function getFreguesiasByHash(
  env: Bindings,
  hash: string,
  options: { type?: string; concelho_id?: string }
): Promise<Array<{ id: number; name: string | null; concelho_id: number | null }>> {
  const decodedId = decodeSingleHash(env, hash)
  const byColaborador = isFilled(options.type)
  const scopeIds = resolveScopeIds(decodedId)
  const concelhoIdFilter = parseOptionalPositiveInt(options.concelho_id)

  const rows = await findFreguesiaRowsByScope(
    env,
    scopeIds,
    byColaborador,
    concelhoIdFilter
  )

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    concelho_id: row.concelho_id
  }))
}

export async function getFreguesiaConcelhoById(
  env: Bindings,
  id: string
): Promise<{ concelho_id: number | null } | null> {
  const freguesiaId = parseOptionalPositiveInt(id)

  if (!freguesiaId) {
    return null
  }

  return findFreguesiaConcelhoById(env, freguesiaId)
}
