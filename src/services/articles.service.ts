import type { Bindings } from '../types/env'
import { decodeSingleHash, encodeId } from '../utils/hashid'
import { searchArticlesByAgencyIds, type ArticleSearchRow } from '../repositories/website.repository'

type SupportedLang = 'pt' | 'en' | 'es' | 'fr' | 'de'

type ArticlePayload = {
  external_id: string
  title: string
  content: string
  subcontent: string
  seotitle: string
  seolink: string
  seodescription: string
  image: string
  created: string
}

type ArticlesPaginated = {
  current_page: number
  data: ArticlePayload[]
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
const ARTICLES_PER_PAGE = 9

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

function decodeOptionalHash(env: Bindings, value: string | null): number | undefined {
  if (!value) {
    return undefined
  }

  try {
    return decodeSingleHash(env, value)
  } catch {
    return undefined
  }
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
}

function resolveImageUrl(env: Bindings, row: ArticleSearchRow): string {
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

function formatCreatedDate(value: string | null): string {
  if (!value) {
    return ''
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const dd = String(date.getDate()).padStart(2, '0')
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const yyyy = date.getFullYear()

  return `${dd}/${mm}/${yyyy}`
}

function localizeField(row: ArticleSearchRow, lang: SupportedLang, base: 'title' | 'content' | 'subcontent' | 'seotitle' | 'seolink' | 'seodescription'): string {
  const map = {
    title: {
      pt: row.title_pt,
      en: row.title_en,
      es: row.title_es,
      fr: row.title_fr,
      de: row.title_de
    },
    content: {
      pt: row.content_pt,
      en: row.content_en,
      es: row.content_es,
      fr: row.content_fr,
      de: row.content_de
    },
    subcontent: {
      pt: row.subcontent_pt,
      en: row.subcontent_en,
      es: row.subcontent_es,
      fr: row.subcontent_fr,
      de: row.subcontent_de
    },
    seotitle: {
      pt: row.seotitle_pt,
      en: row.seotitle_en,
      es: row.seotitle_es,
      fr: row.seotitle_fr,
      de: row.seotitle_de
    },
    seolink: {
      pt: row.seolink_pt,
      en: row.seolink_en,
      es: row.seolink_es,
      fr: row.seolink_fr,
      de: row.seolink_de
    },
    seodescription: {
      pt: row.seodescription_pt,
      en: row.seodescription_en,
      es: row.seodescription_es,
      fr: row.seodescription_fr,
      de: row.seodescription_de
    }
  }[base]

  if (lang === 'en' && map.en) {
    return map.en
  }

  if (lang === 'es' && map.es) {
    return map.es
  }

  if (lang === 'fr' && map.fr) {
    return map.fr
  }

  if (lang === 'de' && map.de) {
    return map.de
  }

  return map.pt || ''
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
  data: ArticlePayload[]
): ArticlesPaginated {
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

function mapRowToPayload(env: Bindings, row: ArticleSearchRow, lang: SupportedLang): ArticlePayload {
  return {
    external_id: encodeId(env, row.id),
    title: localizeField(row, lang, 'title'),
    content: localizeField(row, lang, 'content'),
    subcontent: localizeField(row, lang, 'subcontent'),
    seotitle: localizeField(row, lang, 'seotitle'),
    seolink: localizeField(row, lang, 'seolink'),
    seodescription: localizeField(row, lang, 'seodescription'),
    image: resolveImageUrl(env, row),
    created: formatCreatedDate(row.created_at)
  }
}

export async function getArticlesByHash(
  env: Bindings,
  hash: string,
  searchParams: URLSearchParams,
  requestUrl: URL
): Promise<ArticlesPaginated> {
  const lang = normalizeLang(searchParams.get('lang') || undefined)
  const decodedId = decodeSingleHash(env, hash)
  const scopeIds = resolveScopeIds(decodedId)
  const page = parsePositiveInt(searchParams.get('page')) ?? 1

  const { rows, total } = await searchArticlesByAgencyIds(env, {
    scopeIds,
    categoryId: decodeOptionalHash(env, searchParams.get('category')),
    page,
    perPage: ARTICLES_PER_PAGE
  })

  const data = rows.map((row) => mapRowToPayload(env, row, lang))

  return buildPaginator(requestUrl, searchParams, page, ARTICLES_PER_PAGE, total, data)
}
