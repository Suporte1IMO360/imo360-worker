import type { Bindings } from '../types/env'
import { decodeSingleHash, encodeId } from '../utils/hashid'
import {
  createEmpreendimentoLead,
  findEmpreendimentoDetailById,
  findEmpreendimentoAgencyById,
  findEmpreendimentoImovsByEmpreendimentoId,
  findEmpreendimentosConcelhosByAgencyIds,
  findEmpreendimentosDistritosByAgencyIds,
  findEmpreendimentosFreguesiasByAgencyIds,
  findMaxLeadNumByAgencyId,
  type EmpreendimentoDetailImovRow,
  type EmpreendimentoDetailRow,
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

type EmpreendimentoDetailImovPayload = {
  external_id: string
  slug: string | null
  ref: string | null
  floor: string | null
  fraccao: string | null
  fraction: string | null
  title: string
  disponibilidade: string
  area_util: string
  valor: string
  sobconsulta: boolean
  online: boolean
}

type EmpreendimentoDetailPayload = {
  external: string
  image: string
  title: string
  description: string
  street: string
  show_street: boolean
  distrito: string
  concelho: string
  freguesia: string
  longitude: string | null
  latitude: string | null
  imoveis: EmpreendimentoDetailImovPayload[]
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

  return value
    .toLocaleLowerCase('pt-PT')
    .replace(/(^|\s)\p{L}/gu, (match) => match.toLocaleUpperCase('pt-PT'))
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
}

function normalizePath(path: string): string {
  return path.replace(/^\/+|\/+$/g, '')
}

function applyPathTemplate(template: string, values: Record<string, string>): string {
  let resolved = template

  for (const [key, value] of Object.entries(values)) {
    const regex = new RegExp(`\\{${key}\\}`, 'gi')
    resolved = resolved.replace(regex, value)
  }

  return resolved
}

function buildEmpreendimentoImagePath(
  env: Bindings,
  row: { id: number; agencia_id: number; image: string | null }
): string | null {
  const imageFile = row.image ? row.image.trim() : ''

  if (!imageFile) {
    return null
  }

  const agencyHash = encodeId(env, row.agencia_id)
  const empreendimentoHash = encodeId(env, row.id)
  const template =
    env.EMPREENDIMENTO_IMAGE_PATH_TEMPLATE || 'users/{agency_hash}/empreendimento/{empreendimento_hash}/{file}'

  return normalizePath(
    applyPathTemplate(template, {
      hash: empreendimentoHash,
      empreendimento_hash: empreendimentoHash,
      agency_hash: agencyHash,
      user_hash: agencyHash,
      agency_id: String(row.agencia_id),
      file: normalizePath(imageFile)
    })
  )
}

function resolveImageUrl(
  env: Bindings,
  row: { id: number; agencia_id: number; image: string | null; imagepath: string | null }
): string {
  const rawPath = row.imagepath || row.image

  if (!rawPath) {
    return `${normalizeBaseUrl(env.URL_IMO360)}/assets/images/nophoto.jpg`
  }

  if (/^https?:\/\//i.test(rawPath)) {
    return rawPath
  }

  let normalized = rawPath.replace(/^\/+/, '')

  if (!normalized.includes('/') || !/empreendimento\//i.test(normalized)) {
    const built = buildEmpreendimentoImagePath(env, row)

    if (built) {
      normalized = built
    }
  }

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

function getLocalizedEmpreendimentoTitle(row: EmpreendimentoDetailRow, lang: SupportedLang): string {
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

function getLocalizedEmpreendimentoDescription(row: EmpreendimentoDetailRow, lang: SupportedLang): string {
  if (lang === 'en' && row.description_en) {
    return row.description_en
  }

  if (lang === 'es' && row.description_es) {
    return row.description_es
  }

  if (lang === 'fr' && row.description_fr) {
    return row.description_fr
  }

  if (lang === 'de' && row.description_de) {
    return row.description_de
  }

  return row.description_pt || ''
}

function langValueFromImov(row: EmpreendimentoDetailImovRow, lang: SupportedLang, kind: 'disp' | 'nature' | 'tn'): string {
  const fields = {
    disp: {
      pt: row.imovdisp_pt || row.imovdisp_name,
      en: row.imovdisp_en,
      es: row.imovdisp_es,
      fr: row.imovdisp_fr,
      de: row.imovdisp_de
    },
    nature: {
      pt: row.imovnature_pt,
      en: row.imovnature_en,
      es: row.imovnature_es,
      fr: row.imovnature_fr,
      de: row.imovnature_de
    },
    tn: {
      pt: row.imovtn_pt,
      en: row.imovtn_en,
      es: row.imovtn_es,
      fr: row.imovtn_fr,
      de: row.imovtn_de
    }
  }[kind]

  if (lang === 'en' && fields.en) {
    return fields.en
  }

  if (lang === 'es' && fields.es) {
    return fields.es
  }

  if (lang === 'fr' && fields.fr) {
    return fields.fr
  }

  if (lang === 'de' && fields.de) {
    return fields.de
  }

  return fields.pt || ''
}

function formatMoney(value: string | null): string {
  const parsed = Number(value || 0)

  return `${new Intl.NumberFormat('pt-PT', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Number.isFinite(parsed) ? parsed : 0)} €`
}

function formatAreaCompact(value: string | null): string {
  if (value === null || value === undefined) {
    return '0'
  }

  const parsed = Number(value)

  if (!Number.isFinite(parsed)) {
    return '0'
  }

  return new Intl.NumberFormat('pt-PT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(parsed)
}

function resolveReference(row: EmpreendimentoDetailImovRow, typeReference: number | null): string | null {
  if (typeReference === 3) {
    return row.ref
  }

  if (typeReference === 2) {
    return row.refinterna
  }

  return row.ref_secundary || row.ref || row.refinterna
}

function asNullableTrimmedString(value: string | null | undefined): string | null {
  if (value === null || value === undefined) {
    return null
  }

  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

function formatFloorLikeLaravel(value: string | null | undefined): string | null {
  const floor = asNullableTrimmedString(value)

  if (!floor) {
    return null
  }

  switch (floor.toLowerCase()) {
    case 'ss':
      return 'Semi-cave'
    case 'st':
      return 'Cave'
    case '-2':
      return '-2'
    case '-1':
      return '-1'
    case 'r/c':
    case 'rc':
    case '0':
      return 'R/C'
    case 'outro':
      return 'Outro'
    default:
      return floor
  }
}

function mapEmpreendimentoImovRow(
  env: Bindings,
  row: EmpreendimentoDetailImovRow,
  lang: SupportedLang,
  typeReference: number | null
): EmpreendimentoDetailImovPayload {
  const title = `${langValueFromImov(row, lang, 'tn')} ${langValueFromImov(row, lang, 'nature')}`.trim()

  return {
    external_id: encodeId(env, row.id),
    slug: row.slug,
    ref: resolveReference(row, typeReference),
    floor: formatFloorLikeLaravel(row.floor_raw),
    fraccao: asNullableTrimmedString(row.fraction_raw),
    fraction: asNullableTrimmedString(row.fraction_raw),
    title,
    disponibilidade: langValueFromImov(row, lang, 'disp').toLocaleLowerCase('pt-PT'),
    area_util: formatAreaCompact(row.area_util_det),
    valor: formatMoney(row.valor),
    sobconsulta: Number(row.valor_site || 0) !== 0,
    online: Number(row.online || 0) === 1
  }
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

export async function getEmpreendimentosDistritosByHash(
  env: Bindings,
  hash: string
): Promise<Record<string, string>> {
  const decodedId = decodeSingleHash(env, hash)
  const scopeIds = resolveScopeIds(decodedId)
  const rows = await findEmpreendimentosDistritosByAgencyIds(env, scopeIds)

  return rows.reduce<Record<string, string>>((acc, row) => {
    if (row.name !== null && row.name !== undefined) {
      acc[String(row.id)] = row.name
    }

    return acc
  }, {})
}

export async function getEmpreendimentosConcelhosByHash(
  env: Bindings,
  hash: string,
  searchParams: URLSearchParams
): Promise<Record<string, string>> {
  const decodedId = decodeSingleHash(env, hash)
  const scopeIds = resolveScopeIds(decodedId)
  const distritoId = parsePositiveInt(searchParams.get('distrito_id'))
  const rows = await findEmpreendimentosConcelhosByAgencyIds(env, scopeIds, distritoId)

  return rows.reduce<Record<string, string>>((acc, row) => {
    if (row.name !== null && row.name !== undefined) {
      acc[String(row.id)] = titleCase(row.name)
    }

    return acc
  }, {})
}

export async function getEmpreendimentosFreguesiasByHash(
  env: Bindings,
  hash: string,
  searchParams: URLSearchParams
): Promise<Record<string, string>> {
  const decodedId = decodeSingleHash(env, hash)
  const scopeIds = resolveScopeIds(decodedId)
  const concelhoId = parsePositiveInt(searchParams.get('concelho_id'))
  const rows = await findEmpreendimentosFreguesiasByAgencyIds(env, scopeIds, concelhoId)

  return rows.reduce<Record<string, string>>((acc, row) => {
    if (row.name !== null && row.name !== undefined) {
      acc[String(row.id)] = titleCase(row.name)
    }

    return acc
  }, {})
}

export async function getEmpreendimentoDetailByHashes(
  env: Bindings,
  agencyHash: string,
  empreendimentoHash: string,
  searchParams: URLSearchParams
): Promise<EmpreendimentoDetailPayload | null> {
  const lang = normalizeLang(searchParams.get('lang') || undefined)
  const decodedAgencyId = decodeSingleHash(env, agencyHash)
  const scopeIds = resolveScopeIds(decodedAgencyId)
  const empreendimentoId = decodeSingleHash(env, empreendimentoHash)

  const empreendimento = await findEmpreendimentoDetailById(env, empreendimentoId)

  if (!empreendimento) {
    return null
  }

  if (!scopeIds.includes(empreendimento.agencia_id)) {
    return null
  }

  const imovs = await findEmpreendimentoImovsByEmpreendimentoId(env, empreendimentoId)

  return {
    external: empreendimentoHash,
    image: resolveImageUrl(env, empreendimento),
    title: getLocalizedEmpreendimentoTitle(empreendimento, lang),
    description: getLocalizedEmpreendimentoDescription(empreendimento, lang),
    street: empreendimento.morada || '',
    show_street: Number(empreendimento.online_street) === 1,
    distrito: empreendimento.distrito_id ? titleCase(empreendimento.distrito_name) : '',
    concelho: empreendimento.concelho_id ? titleCase(empreendimento.concelho_name) : '',
    freguesia: empreendimento.freguesia_id ? titleCase(empreendimento.freguesia_name) : '',
    longitude: empreendimento.longitude,
    latitude: empreendimento.latitude,
    imoveis: imovs.map((row) => mapEmpreendimentoImovRow(env, row, lang, empreendimento.typereferenceimovs))
  }
}

function asNullableString(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null
  }

  const text = String(value).trim()
  return text === '' ? null : text
}

function isFilled(value: unknown): boolean {
  if (value === null || value === undefined) {
    return false
  }

  return String(value).trim() !== ''
}

function toNormalizedString(value: unknown, maxLength: number): string | null {
  if (value === null || value === undefined) {
    return null
  }

  const text = String(value).replace(/\s+/g, ' ').trim()

  if (text === '') {
    return null
  }

  return text.slice(0, maxLength)
}

function isTruthyDeclaration(value: unknown): boolean {
  if (typeof value === 'boolean') {
    return value
  }

  if (typeof value === 'number') {
    return value === 1
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    return normalized === '1' || normalized === 'true' || normalized === 'on' || normalized === 'yes'
  }

  return false
}

function isValidEmail(value: string | null): boolean {
  if (!value) {
    return false
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function isValidPhone(value: string | null): boolean {
  if (!value) {
    return false
  }

  const compact = value.replace(/\s+/g, '')
  return /^[+]?[-()\d]{6,20}$/.test(compact)
}

function nowDateAndHour(): { date: string; hour: string } {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const hh = String(now.getHours()).padStart(2, '0')
  const min = String(now.getMinutes()).padStart(2, '0')

  return {
    date: `${yyyy}-${mm}-${dd}`,
    hour: `${hh}:${min}`
  }
}

export async function submitEmpreendimentoContactByHash(
  env: Bindings,
  empreendimentoHash: string,
  payload: Record<string, unknown>
): Promise<{ status: number; body: Record<string, unknown> }> {
  try {
    if (!isTruthyDeclaration(payload.declaration)) {
      return {
        status: 400,
        body: { status: 400, message: 'Declaracao obrigatoria.' }
      }
    }

    const nome = toNormalizedString(payload.name, 120)
    const email = toNormalizedString(payload.email, 200)
    const phone = toNormalizedString(payload.phone, 30)
    const mensagem = toNormalizedString(payload.mensagem, 3000)

    if (!nome) {
      return {
        status: 400,
        body: { status: 400, message: 'Nome obrigatorio.' }
      }
    }

    if (!email && !phone) {
      return {
        status: 400,
        body: { status: 400, message: 'Email ou telefone obrigatorio.' }
      }
    }

    if (email && !isValidEmail(email)) {
      return {
        status: 400,
        body: { status: 400, message: 'Email invalido.' }
      }
    }

    if (phone && !isValidPhone(phone)) {
      return {
        status: 400,
        body: { status: 400, message: 'Telefone invalido.' }
      }
    }

    const empreendimentoId = decodeSingleHash(env, empreendimentoHash)
    const empreendimento = await findEmpreendimentoAgencyById(env, empreendimentoId)

    if (!empreendimento) {
      return {
        status: 400,
        body: { status: 400 }
      }
    }

    const ultimoNumLead = await findMaxLeadNumByAgencyId(env, empreendimento.agencia_id)
    const { date, hour } = nowDateAndHour()

    await createEmpreendimentoLead(env, {
      numLead: ultimoNumLead + 1,
      data_inicio: date,
      hora_inicio: hour,
      mensagem_lead: mensagem,
      email_lead: email,
      contacto_lead: phone,
      pessoa_lead: nome,
      agencia_id: empreendimento.agencia_id
    })

    return {
      status: 200,
      body: {
        message: 'Formulário enviado com sucesso',
        status: 200
      }
    }
  } catch {
    return {
      status: 400,
      body: { status: 400 }
    }
  }
}
