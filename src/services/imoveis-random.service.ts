import type { Bindings } from '../types/env'
import { encodeId, decodeSingleHash } from '../utils/hashid'
import {
  findImoveisExclusiveRows,
  findImoveisRandomRows,
  findImoveisVirtualTourRows,
  findUserReferencePreferenceByAgencyId,
  type ImovelRandomRow
} from '../repositories/imoveis.repository'
import { resolveWebsiteFileUrl } from './website.service'

type SupportedLang = 'pt' | 'en' | 'es' | 'fr' | 'de'

type ImovelRandomPayload = {
  external_id: string
  slug: string | null
  reference: string | null
  imovids_id: number
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
      ? resolveWebsiteFileUrl(env, imageFile, row.agencia_id, agencyHash)
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
      imovids_id: row.id,
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
