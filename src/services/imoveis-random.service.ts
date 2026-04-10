import type { Bindings } from '../types/env'
import { encodeId, decodeSingleHash } from '../utils/hashid'
import {
  findImoveisExclusiveRows,
  findImoveisRandomRows,
  searchImoveisRows,
  type ImoveisSearchRow,
  findImoveisSimilarRows,
  findImoveisVirtualTourRows,
  findUserReferencePreferenceByAgencyId,
  type ImovelRandomRow
} from '../repositories/imoveis.repository'
import { resolveImovelFileUrl, resolveWebsiteFileUrl } from './website.service'

type SupportedLang = 'pt' | 'en' | 'es' | 'fr' | 'de'

type ImovelRandomPayload = {
  external_id: string
  slug: string | null
  reference: string | null
  imovdisp_id: number | null
  negocio: string
  disponibilidade: string
  title1: string
  title2: string
  sob_consulta: boolean
  destaque: boolean
  novidade: boolean
  baixapreco: boolean
  exclusivo: boolean
  price: string
  area: string
  rooms: number | string
  garage: number | string
  wc: number | string
  consultant_externalid: string
  consultant_name: string | null
  consultant_email: string | null
  consultant_photo: string
  imagem: string | null
  totalimages: number
  video: string
  virtualtour: string
  concelho: string
  freguesia: string
}

type ParsedImage = {
  file: string
  online?: number
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

function toBool(value: unknown): boolean {
  return Number(value) === 1 || value === true
}

function asNumber(value: unknown): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function asString(value: unknown): string {
  if (value === null || value === undefined) {
    return ''
  }

  return String(value)
}

function asNullableString(value: unknown): string | null {
  if (value === null || value === undefined || value === '') {
    return null
  }

  return String(value)
}

function parseImages(raw: string | null): ParsedImage[] {
  if (!raw) {
    return []
  }

  try {
    const parsed = JSON.parse(raw)

    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.filter((item) => typeof item?.file === 'string') as ParsedImage[]
  } catch {
    return []
  }
}

function resolveImageFile(images: ParsedImage[]): string | null {
  const online = images.find((item) => Number(item.online) === 1)

  if (online?.file) {
    return online.file
  }

  return images[0]?.file ?? null
}

function countOnlineImages(images: ParsedImage[]): number {
  return images.filter((item) => Number(item.online) === 1).length
}

function formatPrice(value: string | null): string {
  const number = asNumber(value)

  return `${new Intl.NumberFormat('pt-PT', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(number)} €`
}

function formatArea(row: ImovelRandomRow): string {
  const areaRaw =
    asNullableString(row.cad_area_bruta_privativa) ??
    asNullableString(row.cad_area_bruta_dependente) ??
    asNullableString(row.cad_area_terreno)

  if (!areaRaw) {
    return '0.00'
  }

  const value = asNumber(areaRaw)

  return `${new Intl.NumberFormat('pt-PT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)} m²`
}

function normalizeRooms(value: number | null): number | string {
  if (value === 15) {
    return 'N/A'
  }

  if (value === 11) {
    return '10+'
  }

  return value ?? 0
}

function normalizeGarage(value: number | null): number | string {
  if (value === 15) {
    return 'N/A'
  }

  return value ?? 0
}

function normalizeWc(row: ImovelRandomRow): number | string {
  if (row.imovnature_id !== 1 && row.imovnature_id !== 7) {
    return 'N/A'
  }

  if (row.wcs === 15) {
    return 'N/A'
  }

  if ((row.wcs ?? 0) === 0) {
    return 'N/A'
  }

  return row.wcs ?? 0
}

function langValue(
  lang: SupportedLang,
  values: {
    pt: string | null
    en: string | null
    es: string | null
    fr: string | null
    de: string | null
  }
): string {
  if (lang === 'en' && values.en) {
    return values.en
  }

  if (lang === 'es' && values.es) {
    return values.es
  }

  if (lang === 'fr' && values.fr) {
    return values.fr
  }

  if (lang === 'de' && values.de) {
    return values.de
  }

  return values.pt ?? ''
}

function resolveTitle(row: ImovelRandomRow, lang: SupportedLang): string {
  const localizedTitle = langValue(lang, {
    pt: row.titulo_publicacao,
    en: row.titulo_publicacao_en,
    es: row.titulo_publicacao_es,
    fr: row.titulo_publicacao_fr,
    de: row.titulo_publicacao_de
  })

  if (localizedTitle) {
    return localizedTitle
  }

  return langValue(lang, {
    pt: row.info_descricao,
    en: row.info_descricao_en,
    es: row.info_descricao_es,
    fr: row.info_descricao_fr,
    de: row.info_descricao_de
  })
}

function lowerText(value: string | null): string {
  return (value || '').toLocaleLowerCase('pt-PT')
}

function resolveReference(row: ImovelRandomRow, typeReference: number | null): string | null {
  if (typeReference === 3) {
    return row.ref
  }

  if (typeReference === 2) {
    return row.refinterna
  }

  return row.ref_secundary ?? row.ref ?? row.refinterna
}

function ensureHttps(url: string): string {
  if (url.startsWith('https://')) {
    return url
  }

  if (url.startsWith('http://')) {
    return `https://${url.slice(7)}`
  }

  if (url.startsWith('//')) {
    return `https:${url}`
  }

  return `https://${url.replace(/^\/+/, '')}`
}

function resolveVideo(row: ImovelRandomRow): string {
  const video = asNullableString(row.video)

  if (!toBool(row.publicar_video) || !video) {
    return ''
  }

  return video.startsWith('https://') ? video : ''
}

function resolveVirtualTour(row: ImovelRandomRow): string {
  const value = asNullableString(row.link_3D)

  if (!value) {
    return ''
  }

  return ensureHttps(value)
}

function profileFallback(env: Bindings): string {
  return `${env.URL_IMO360.replace(/\/+$/, '')}/assets/images/profile.png`
}

export async function getImoveisRandomByHash(
  env: Bindings,
  hash: string,
  langInput?: string
): Promise<ImovelRandomPayload[]> {
  const lang = normalizeLang(langInput)
  const decodedId = decodeSingleHash(env, hash)
  const scopeIds = resolveScopeIds(decodedId)
  const rows = await findImoveisRandomRows(env, scopeIds)

  return mapRowsToPayload(env, rows, lang, decodedId)
}

function mapRowsToPayload(
  env: Bindings,
  rows: ImovelRandomRow[],
  lang: SupportedLang,
  decodedId: number
): Promise<ImovelRandomPayload[]> {
  return (async () => {
  const typeReference = await findUserReferencePreferenceByAgencyId(env, decodedId)

  return rows.map((row) => {
    const imovHash = encodeId(env, row.id)
    const agencyHash = encodeId(env, row.agencia_id)
    const title = resolveTitle(row, lang)
    const hideConsultantInfo = toBool(row.ocultarDadosConsultor)
    const consultantId = hideConsultantInfo ? row.agencia_id : (row.colaborador_id ?? row.agencia_id)
    const consultantName = hideConsultantInfo ? row.agencia_name : row.colaborador_name
    const consultantEmail = hideConsultantInfo ? row.agencia_email : row.colaborador_email
    const consultantPhotoRaw = hideConsultantInfo ? row.agencia_foto : row.colaborador_foto
    const consultantPhoto =
      resolveWebsiteFileUrl(env, consultantPhotoRaw, row.agencia_id, agencyHash) || profileFallback(env)

    const images = parseImages(row.images)
    const imageFile = resolveImageFile(images)
    const imageUrl = imageFile
      ? resolveImovelFileUrl(env, imageFile, row.agencia_id, imovHash, 'foto_marca_agua')
      : `${env.URL_IMO360.replace(/\/+$/, '')}/assets/images/nophoto.jpg`

    const natureza = lowerText(row.imovnature_name)
    const disponibilidade = lowerText(
      langValue(lang, {
        pt: row.imovdisp_pt,
        en: row.imovdisp_en,
        es: row.imovdisp_es,
        fr: row.imovdisp_fr,
        de: row.imovdisp_de
      })
    )

    const negocioLabel = langValue(lang, {
      pt: row.imovtn_pt,
      en: row.imovtn_en,
      es: row.imovtn_es,
      fr: row.imovtn_fr,
      de: row.imovtn_de
    })

    return {
      external_id: encodeId(env, row.id),
      slug: row.slug,
      reference: resolveReference(row, typeReference),
      imovdisp_id: row.imovdisp_id,
      negocio: natureza,
      disponibilidade,
      title1: title,
      title2: Number(row.property_title) === 1 ? title : `${negocioLabel} ${natureza}`.trim(),
      sob_consulta: !row.valor || asNumber(row.valor) <= 0,
      destaque: toBool(row.destacar),
      novidade: toBool(row.novidade),
      baixapreco: toBool(row.baixapreco),
      exclusivo: toBool(row.exclusivo),
      price: formatPrice(row.valor),
      area: formatArea(row),
      rooms: normalizeRooms(row.quartos),
      garage: normalizeGarage(row.garagens),
      wc: normalizeWc(row),
      consultant_externalid: encodeId(env, consultantId),
      consultant_name: consultantName,
      consultant_email: consultantEmail,
      consultant_photo: consultantPhoto,
      imagem: imageUrl,
      totalimages: countOnlineImages(images),
      video: resolveVideo(row),
      virtualtour: resolveVirtualTour(row),
      concelho: asString(row.concelho_name),
      freguesia: asString(row.freguesia_name)
    }
  })
  })()
}

export async function getImoveisVirtualTourByHash(
  env: Bindings,
  hash: string,
  langInput?: string
): Promise<ImovelRandomPayload[]> {
  const lang = normalizeLang(langInput)
  const decodedId = decodeSingleHash(env, hash)
  const scopeIds = resolveScopeIds(decodedId)
  const rows = await findImoveisVirtualTourRows(env, scopeIds)

  return mapRowsToPayload(env, rows, lang, decodedId)
}

export async function getImoveisExclusiveByHash(
  env: Bindings,
  hash: string,
  langInput?: string
): Promise<ImovelRandomPayload[]> {
  const lang = normalizeLang(langInput)
  const decodedId = decodeSingleHash(env, hash)
  const scopeIds = resolveScopeIds(decodedId)
  const rows = await findImoveisExclusiveRows(env, scopeIds)

  return mapRowsToPayload(env, rows, lang, decodedId)
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

function decodeOptionalImovHash(env: Bindings, hash: string | undefined): number | undefined {
  if (!hash) {
    return undefined
  }

  try {
    return decodeSingleHash(env, hash)
  } catch {
    return undefined
  }
}

export async function getImoveisSimilarByHash(
  env: Bindings,
  hash: string,
  options: {
    lang?: string
    imov_id?: string
    imovsubnature_id?: string
    distrito_id?: string
    concelho_id?: string
  }
): Promise<ImovelRandomPayload[]> {
  const lang = normalizeLang(options.lang)
  const decodedId = decodeSingleHash(env, hash)
  const scopeIds = resolveScopeIds(decodedId)

  const rows = await findImoveisSimilarRows(env, scopeIds, {
    excludeImovId: decodeOptionalImovHash(env, options.imov_id),
    imovsubnatureId: parseOptionalPositiveInt(options.imovsubnature_id),
    distritoId: parseOptionalPositiveInt(options.distrito_id),
    concelhoId: parseOptionalPositiveInt(options.concelho_id)
  })

  return mapRowsToPayload(env, rows, lang, decodedId)
}

type ImoveisSearchPayload = {
  external_id: string
  slug: string | null
  reference: string | null
  imovdisp_id: number | null
  negocio: string
  disponibilidade: string
  title1: string
  title2: string
  sob_consulta: number
  destaque: boolean
  novidade: boolean
  baixapreco: boolean
  exclusivo: boolean
  price: string
  area: string
  rooms: number | string
  garage: number | string
  wc: number | string
  concelho: string
  freguesia: string
  consultant_externalid: string
  consultant_name: string | null
  consultant_email: string | null
  consultant_photo: string
  imagem: string | null
  totalimages: number
  video: string
  virtualtour: string
  detail_link: string
  imagens_link: string
}

type ImoveisSearchPaginated = {
  current_page: number
  data: ImoveisSearchPayload[]
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

function parseNumberValue(value: string | null): number | undefined {
  if (!value) {
    return undefined
  }

  const normalized = value.replace(/\s+/g, '').replace(',', '.')
  const parsed = Number(normalized)

  return Number.isFinite(parsed) ? parsed : undefined
}

function hasFilledParam(searchParams: URLSearchParams, key: string): boolean {
  const value = searchParams.get(key)

  if (value !== null) {
    return value.trim() !== ''
  }

  const valueWithBrackets = searchParams.get(`${key}[]`)
  return valueWithBrackets !== null && valueWithBrackets.trim() !== ''
}

function readArrayValues(searchParams: URLSearchParams, key: string): string[] {
  const direct = searchParams.getAll(key)
  const bracket = searchParams.getAll(`${key}[]`)
  const values = [...direct, ...bracket]

  return values
    .flatMap((item) => item.split(','))
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
}

function readNumberArray(searchParams: URLSearchParams, key: string): number[] {
  const values = readArrayValues(searchParams, key)
  const parsed = values
    .map((item) => Number.parseInt(item, 10))
    .filter((item) => Number.isFinite(item) && item > 0)

  return Array.from(new Set(parsed))
}

function parseSort(searchParams: URLSearchParams): number | undefined {
  if (!searchParams.has('sort')) {
    return undefined
  }

  const raw = searchParams.get('sort')

  if (raw === null) {
    return Number.NaN
  }

  const trimmed = raw.trim()

  if (!/^-?\d+$/.test(trimmed)) {
    return Number.NaN
  }

  return Number.parseInt(trimmed, 10)
}

function parsePlace(searchParams: URLSearchParams):
  | { field: 'distrito' | 'concelho' | 'freguesia'; id: number }
  | undefined {
  const raw = searchParams.get('place')

  if (!raw) {
    return undefined
  }

  const [field, idRaw] = raw.split('_')
  const id = parsePositiveInt(idRaw || null)

  if (!id) {
    return undefined
  }

  if (field === 'distrito' || field === 'concelho' || field === 'freguesia') {
    return { field, id }
  }

  return undefined
}

function titleCase(value: string): string {
  return value
    .toLocaleLowerCase('pt-PT')
    .replace(/(^|\s)\p{L}/gu, (match) => match.toLocaleUpperCase('pt-PT'))
}

function formatAreaForSearch(value: string | null): string {
  if (!value) {
    return '0.00'
  }

  const num = Number(value)

  if (!Number.isFinite(num) || num === 0) {
    return '0.00'
  }

  return `${num.toLocaleString('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })} m²`
}

function getApiPath(url: URL): string {
  return `${url.origin}${url.pathname}`
}

function withPage(searchParams: URLSearchParams, page: number): string {
  const clone = new URLSearchParams(searchParams)
  clone.set('page', String(page))
  const query = clone.toString()

  return query
}

function buildPaginator(
  url: URL,
  searchParams: URLSearchParams,
  page: number,
  perPage: number,
  total: number,
  data: ImoveisSearchPayload[]
): ImoveisSearchPaginated {
  const lastPage = Math.max(1, Math.ceil(total / perPage))
  const currentPage = Math.min(Math.max(page, 1), lastPage)
  const from = total === 0 ? null : (currentPage - 1) * perPage + 1
  const to = total === 0 ? null : Math.min(currentPage * perPage, total)
  const path = getApiPath(url)

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

function mapSearchRowToPayload(
  env: Bindings,
  row: ImoveisSearchRow,
  lang: SupportedLang,
  typeReference: number | null,
  apiOrigin: string
): ImoveisSearchPayload {
  const agencyHash = encodeId(env, row.agencia_id)
  const imovHash = encodeId(env, row.id)
  const title = resolveTitle(row, lang)
  const hideConsultantInfo = toBool(row.ocultarDadosConsultor)
  const consultantId = hideConsultantInfo ? row.agencia_id : (row.colaborador_id ?? row.agencia_id)
  const consultantName = hideConsultantInfo ? row.agencia_name : row.colaborador_name
  const consultantEmail = hideConsultantInfo ? row.agencia_email : row.colaborador_email
  const consultantPhotoRaw = hideConsultantInfo ? row.agencia_foto : row.colaborador_foto
  const consultantPhoto =
    resolveWebsiteFileUrl(env, consultantPhotoRaw, row.agencia_id, agencyHash) || profileFallback(env)

  const images = parseImages(row.images)
  const imageFile = resolveImageFile(images)
  const imageUrl = imageFile
    ? resolveImovelFileUrl(env, imageFile, row.agencia_id, imovHash, 'foto_marca_agua')
    : `${env.URL_IMO360.replace(/\/+$/, '')}/assets/images/nophoto.jpg`

  const naturezaLabel = langValue(lang, {
    pt: row.imovnature_pt,
    en: row.imovnature_en,
    es: row.imovnature_es,
    fr: row.imovnature_fr,
    de: row.imovnature_de
  })

  const negocioLabel = langValue(lang, {
    pt: row.imovtn_pt,
    en: row.imovtn_en,
    es: row.imovtn_es,
    fr: row.imovtn_fr,
    de: row.imovtn_de
  })

  const computedTitle = `${negocioLabel} ${naturezaLabel}`.trim()
  const title1 = Number(row.property_title) === 1 ? title : computedTitle
  const title2 = computedTitle

  const externalId = encodeId(env, row.id)

  return {
    external_id: externalId,
    slug: row.slug,
    reference: resolveReference(row, typeReference),
    imovdisp_id: row.imovdisp_id,
    negocio: lowerText(row.imovtn_name),
    disponibilidade: lowerText(row.imovdisp_name),
    title1,
    title2,
    sob_consulta: asNumber(row.valor_site),
    destaque: toBool(row.destacar),
    novidade: toBool(row.novidade),
    baixapreco: toBool(row.baixapreco),
    exclusivo: toBool(row.exclusivo),
    price: formatPrice(row.valor),
    area: formatAreaForSearch(row.area_util_det),
    rooms: normalizeRooms(row.quartos),
    garage: normalizeGarage(row.garagens),
    wc: normalizeWc(row),
    concelho: titleCase(asString(row.concelho_name)),
    freguesia: titleCase(asString(row.freguesia_name)),
    consultant_externalid: encodeId(env, consultantId),
    consultant_name: consultantName,
    consultant_email: consultantEmail,
    consultant_photo: consultantPhoto,
    imagem: imageUrl,
    totalimages: countOnlineImages(images),
    video: resolveVideo(row),
    virtualtour: resolveVirtualTour(row),
    detail_link: `${apiOrigin}/api/preview/${externalId}`,
    imagens_link: `${apiOrigin}/api/preview/${externalId}/images`
  }
}

export async function getImoveisByHash(
  env: Bindings,
  hash: string,
  searchParams: URLSearchParams,
  requestUrl: URL
): Promise<ImoveisSearchPaginated> {
  const lang = normalizeLang(searchParams.get('lang') || undefined)
  const decodedId = decodeSingleHash(env, hash)
  const scopeIds = resolveScopeIds(decodedId)
  const place = parsePlace(searchParams)

  const page = parsePositiveInt(searchParams.get('page')) ?? 1
  const perPage = 12
  const sort = parseSort(searchParams)

  const agenciaHash = searchParams.get('agencias_id')
  const agenciasId = agenciaHash ? decodeOptionalImovHash(env, agenciaHash) : undefined

  const hasImovDispFilter = hasFilledParam(searchParams, 'imovdisp_id')
  const shouldExcludeSold = hash === '3o1gvj' && !hasImovDispFilter

  const { rows, total } = await searchImoveisRows(env, {
    scopeIds,
    placeField: place?.field,
    placeId: place?.id,
    distritoId: parsePositiveInt(searchParams.get('distrito_id')),
    concelhoId: parsePositiveInt(searchParams.get('concelho_id')),
    freguesiaId: parsePositiveInt(searchParams.get('freguesia_id')),
    reference: searchParams.get('reference') || undefined,
    imovnatureIds: readNumberArray(searchParams, 'imovnature_id'),
    agenciasId,
    imovtnIds: readNumberArray(searchParams, 'imovtn_id'),
    imovceId: parsePositiveInt(searchParams.get('imovce_id')),
    imovestId: parsePositiveInt(searchParams.get('imovest_id')),
    zonaId: parsePositiveInt(searchParams.get('zona_id')),
    imovdispId: parsePositiveInt(searchParams.get('imovdisp_id')),
    precoMin: parseNumberValue(searchParams.get('precomin')),
    precoMax: parseNumberValue(searchParams.get('precomax')),
    baixapreco: hasFilledParam(searchParams, 'baixapreco'),
    imovelBanca: hasFilledParam(searchParams, 'imovelbanca'),
    exclusivo: hasFilledParam(searchParams, 'exclusivo'),
    negociavel: hasFilledParam(searchParams, 'negociavel'),
    permuta: hasFilledParam(searchParams, 'permuta'),
    destaque: hasFilledParam(searchParams, 'destaque'),
    novidade: hasFilledParam(searchParams, 'novidade'),
    virtual: hasFilledParam(searchParams, 'virtual'),
    rooms: readNumberArray(searchParams, 'rooms'),
    minroom: parsePositiveInt(searchParams.get('minroom')),
    maxroom: parsePositiveInt(searchParams.get('maxroom')),
    areaMin: parseNumberValue(searchParams.get('areamin')),
    areaMax: parseNumberValue(searchParams.get('areamax')),
    equipamentos: readNumberArray(searchParams, 'equipamentos'),
    infraestruturas: readNumberArray(searchParams, 'infraestruturas'),
    zonaenvolventes: readNumberArray(searchParams, 'zonaenvolventes'),
    excludeSold: shouldExcludeSold,
    sort,
    page,
    perPage
  })

  const typeReference = await findUserReferencePreferenceByAgencyId(env, decodedId)
  const payload = rows.map((row) => mapSearchRowToPayload(env, row, lang, typeReference, requestUrl.origin))

  return buildPaginator(requestUrl, searchParams, page, perPage, total, payload)
}
