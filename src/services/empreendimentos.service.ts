import type { Bindings } from '../types/env'
import { decodeSingleHash, encodeId } from '../utils/hashid'
import {
  searchEmpreendimentosRows,
  type EmpreendimentoSearchRow
} from '../repositories/website.repository'

type SupportedLang = 'pt' | 'en' | 'es' | 'fr' | 'de'

type EmpreendimentoPayload = {
  external_id: string
  image: string
  title: string
  totalimovs: number
  concelho: string
  freguesia: string
}

type EmpreendimentosPaginated = {
  current_page: number
  data: EmpreendimentoPayload[]
  first_page_url: string
  from: number | null
  last_page: number
  last_page_url: string
  next_page_url: string | null
  path: string
  per_page: number
  prev_page_url: string | null
  to: number | null
  total: number
}

const SPECIAL_MULTI_AGENCY_HASH_ID = 397
const SPECIAL_MULTI_AGENCY_IDS = [350, 382, 534, 726, 2160]
const EMPREENDIMENTOS_PER_PAGE = 12

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

function parsePositiveInt(value: string | null): number | undefined {
  if (!value) {
    return undefined
  }

  const trimmed = value.trim()

  if (!/^\d+$/.test(trimmed)) {
    return undefined
  }

  const parsed = Number.parseInt(trimmed, 10)
  return parsed > 0 ? parsed : undefined
}

function parseSort(searchParams: URLSearchParams): number | undefined {
  if (!searchParams.has('sort')) {
    return undefined
  }

  const raw = searchParams.get('sort')

  if (raw === null) {
    return undefined
  }

  const trimmed = raw.trim()

  if (!/^-?\d+$/.test(trimmed)) {
    return undefined
  }

  return Number.parseInt(trimmed, 10)
}

function titleCase(value: string | null): string {
  if (!value) {
    return ''
  }

  const lower = value.toLocaleLowerCase('pt-PT')

  if (!lower) {
    return ''
  }

  return lower.charAt(0).toLocaleUpperCase('pt-PT') + lower.slice(1)
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
}

function resolveImageUrl(env: Bindings, row: EmpreendimentoSearchRow): string {
  const rawPath = row.imagepath || row.image

  if (!rawPath) {
    return `${normalizeBaseUrl(env.URL_IMO360)}/assets/images/nophoto.jpg`
  }

  if (/^https?:\/\//i.test(rawPath)) {
    return rawPath
  }

  const normalized = rawPath.replace(/^\/+/, '')

  if (env.USE_CLOUDFLARE_IMAGES && env.USE_CLOUDFLARE_IMAGES.toLowerCase() === 'true' && env.CF_IMAGES_BASE_URL) {
    return `${normalizeBaseUrl(env.CF_IMAGES_BASE_URL)}/${normalized}`
  }

  return `${normalizeBaseUrl(env.URL_IMO360)}/${normalized}`
}

function getLocalizedTitle(row: EmpreendimentoSearchRow, lang: SupportedLang): string {
  if (lang === 'en' && row.title_en) {
    return row.title_en
  }

  if (lang === 'es' && row.title_es) {
    return row.title_es
  }

  if (lang === 'fr' && row.title_fr) {
    return row.title_fr
  }

  if (lang === 'de' && row.title_de) {
    return row.title_de
  }

  return row.title_pt || ''
}

function withPage(searchParams: URLSearchParams, page: number): string {
  const clone = new URLSearchParams(searchParams)
  clone.set('page', String(page))
  return clone.toString()
}

function buildPaginator(
  requestUrl: URL,
  searchParams: URLSearchParams,
  page: number,
  perPage: number,
  total: number,
  data: EmpreendimentoPayload[]
): EmpreendimentosPaginated {
  const lastPage = Math.max(1, Math.ceil(total / perPage))
  const currentPage = Math.min(Math.max(page, 1), lastPage)
  const from = total === 0 ? null : (currentPage - 1) * perPage + 1
  const to = total === 0 ? null : Math.min(currentPage * perPage, total)
  const path = `${requestUrl.origin}${requestUrl.pathname}`

  const firstPageUrl = `${path}?${withPage(searchParams, 1)}`
  const lastPageUrl = `${path}?${withPage(searchParams, lastPage)}`
  const nextPageUrl = currentPage < lastPage ? `${path}?${withPage(searchParams, currentPage + 1)}` : null
  const prevPageUrl = currentPage > 1 ? `${path}?${withPage(searchParams, currentPage - 1)}` : null

  return {
    current_page: currentPage,
    data,
    first_page_url: firstPageUrl,
    from,
    last_page: lastPage,
    last_page_url: lastPageUrl,
    next_page_url: nextPageUrl,
    path,
    per_page: perPage,
    prev_page_url: prevPageUrl,
    to,
    total
  }
}

function mapRowToPayload(env: Bindings, row: EmpreendimentoSearchRow, lang: SupportedLang): EmpreendimentoPayload {
  return {
    external_id: encodeId(env, row.id),
    image: resolveImageUrl(env, row),
    title: getLocalizedTitle(row, lang),
    totalimovs: Number(row.imovs_count || 0),
    concelho: row.concelho_id ? titleCase(row.concelho_name) : '',
    freguesia: row.freguesia_id ? titleCase(row.freguesia_name) : ''
  }
}

export async function getEmpreendimentosByHash(
  env: Bindings,
  hash: string,
  searchParams: URLSearchParams,
  requestUrl: URL
): Promise<EmpreendimentosPaginated> {
  const lang = normalizeLang(searchParams.get('lang') || undefined)
  const decodedId = decodeSingleHash(env, hash)
  const scopeIds = resolveScopeIds(decodedId)
  const page = parsePositiveInt(searchParams.get('page')) ?? 1

  const { rows, total } = await searchEmpreendimentosRows(env, {
    scopeIds,
    distritoId: parsePositiveInt(searchParams.get('distrito_id')),
    concelhoId: parsePositiveInt(searchParams.get('concelho_id')),
    freguesiaId: parsePositiveInt(searchParams.get('freguesia_id')),
    text: searchParams.get('text') || undefined,
    sort: parseSort(searchParams),
    page,
    perPage: EMPREENDIMENTOS_PER_PAGE
  })

  const payload = rows.map((row) => mapRowToPayload(env, row, lang))

  return buildPaginator(requestUrl, searchParams, page, EMPREENDIMENTOS_PER_PAGE, total, payload)
}
