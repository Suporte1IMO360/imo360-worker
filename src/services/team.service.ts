import type { Bindings } from '../types/env'
import { decodeSingleHash, encodeId } from '../utils/hashid'
import {
  findConsultantRealestateTranslation,
  findTeamHomepageMembersByAgencyIds,
  findTeamMembersByAgencyIds,
  type TeamMemberRow
} from '../repositories/website.repository'
import { resolveWebsiteFileUrl } from './website.service'

type SupportedLang = 'pt' | 'en' | 'es' | 'fr' | 'de'

type TeamMemberPayload = {
  external_id: string
  id: number
  title: string
  name: string
  consultant: boolean
  whatsapp_number: string
  facebook: string
  instagram: string
  linkedin: string
  phone: string
  email: string | null
  photo: string
  totalimovs: number | ''
}

type TeamPaginatedResponse = {
  current_page: number
  data: TeamMemberPayload[]
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
const TEAM_PER_PAGE = 8

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

function parseSort(value: string | undefined): 0 | 1 | undefined {
  if (value === undefined) {
    return undefined
  }

  if (value === '0') {
    return 0
  }

  if (value === '1') {
    return 1
  }

  return undefined
}

function parsePage(value: string | undefined): number {
  if (!value) {
    return 1
  }

  const parsed = Number.parseInt(value, 10)

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 1
  }

  return parsed
}

function asString(value: unknown): string {
  if (value === null || value === undefined) {
    return ''
  }

  return String(value)
}

function hasValue(value: unknown): boolean {
  if (value === null || value === undefined) {
    return false
  }

  return String(value).trim() !== ''
}

function toBool(value: unknown): boolean {
  return Number(value) === 1 || value === true
}

function isConsultant(row: TeamMemberRow): boolean {
  const name = asString(row.group_name).toLocaleLowerCase('pt-PT')

  if (name.includes('consult')) {
    return true
  }

  return false
}

function isCoordinator(row: TeamMemberRow): boolean {
  const name = asString(row.group_name).toLocaleLowerCase('pt-PT')

  if (name.includes('coorden')) {
    return true
  }

  return false
}

function hideContactData(row: TeamMemberRow): boolean {
  return Number(row.ocultarDadosConsultor) === 1
}

function getPublicContact(value: unknown, shouldHide: boolean): string {
  if (shouldHide || !hasValue(value)) {
    return ''
  }

  return String(value)
}

function profileFallback(env: Bindings): string {
  return `${env.URL_IMO360.replace(/\/+$/, '')}/assets/images/profile.png`
}

function resolvePhoto(env: Bindings, row: TeamMemberRow): string {
  const canShow = hasValue(row.foto) && toBool(row.public_image)

  if (!canShow) {
    return profileFallback(env)
  }

  const agencyHash = encodeId(env, row.agencia_id)
  return resolveWebsiteFileUrl(env, row.foto, row.agencia_id, agencyHash) || profileFallback(env)
}

function resolveTitle(row: TeamMemberRow, consultantTitle: string): string {
  if (hasValue(row.user_website_title)) {
    return String(row.user_website_title)
  }

  if (isCoordinator(row) && hasValue(row.group_name)) {
    return String(row.group_name)
  }

  return consultantTitle
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
  data: TeamMemberPayload[]
): TeamPaginatedResponse {
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

function mapTeamRowToPayload(
  env: Bindings,
  row: TeamMemberRow,
  consultantTitle: string
): TeamMemberPayload {
  const hidden = hideContactData(row)

  return {
    external_id: encodeId(env, row.id),
    id: row.id,
    title: resolveTitle(row, consultantTitle),
    name: asString(row.name),
    consultant: isConsultant(row),
    whatsapp_number: getPublicContact(row.whatsapp_number, hidden),
    facebook: getPublicContact(row.facebook, hidden),
    instagram: getPublicContact(row.instagram, hidden),
    linkedin: getPublicContact(row.linkedin, hidden),
    phone: getPublicContact(row.telemovel, hidden),
    email: row.email,
    photo: resolvePhoto(env, row),
    totalimovs: row.id !== row.agencia_id ? Number(row.imovelcolaboradores_count || 0) : ''
  }
}

export async function getTeamByHash(
  env: Bindings,
  hash: string,
  searchParams: URLSearchParams,
  requestUrl: URL
): Promise<TeamPaginatedResponse> {
  const lang = normalizeLang(searchParams.get('lang') || undefined)
  const decodedId = decodeSingleHash(env, hash)
  const scopeIds = resolveScopeIds(decodedId)
  const text = searchParams.get('text') || undefined
  const sort = parseSort(searchParams.get('sort') || undefined)
  const page = parsePage(searchParams.get('page') || undefined)

  const consultantTitle =
    (await findConsultantRealestateTranslation(env, lang)) || 'Consultant Real Estate'

  const { rows, total } = await findTeamMembersByAgencyIds(env, scopeIds, {
    text,
    sort,
    page,
    perPage: TEAM_PER_PAGE
  })

  const payload = rows.map((row) => mapTeamRowToPayload(env, row, consultantTitle))

  return buildPaginator(requestUrl, searchParams, page, TEAM_PER_PAGE, total, payload)
}

export async function getTeamHomepageByHash(
  env: Bindings,
  hash: string,
  searchParams: URLSearchParams
): Promise<TeamMemberPayload[]> {
  const lang = normalizeLang(searchParams.get('lang') || undefined)
  const decodedId = decodeSingleHash(env, hash)
  const scopeIds = resolveScopeIds(decodedId)
  const text = searchParams.get('text') || undefined
  const sort = parseSort(searchParams.get('sort') || undefined)

  const consultantTitle =
    (await findConsultantRealestateTranslation(env, lang)) || 'Consultant Real Estate'

  const rows = await findTeamHomepageMembersByAgencyIds(env, scopeIds, {
    text,
    sort
  })

  return rows.map((row) => mapTeamRowToPayload(env, row, consultantTitle))
}
