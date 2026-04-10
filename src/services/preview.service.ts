import type { Bindings } from '../types/env'
import { decodeSingleHash, encodeId } from '../utils/hashid'
import {
  countPreviewVirtualStaging,
  findPreviewVideoByImovId,
  findPreviewDivisions,
  findPreviewFeatureLabels,
  findPreviewMainByImovId,
  findPreviewMainBySlug,
  findPreviewTranslation,
  incrementPreviewVisit,
  type PreviewDivisionRow,
  type PreviewMainRow
} from '../repositories/preview.repository'
import { resolveWebsiteFileUrl } from './website.service'

type SupportedLang = 'pt' | 'en' | 'es' | 'fr' | 'de'

type ParsedImage = {
  file: string
  online?: number
}

function normalizeLang(input: string | undefined): SupportedLang {
  const value = (input || 'pt').toLowerCase()

  if (value === 'en' || value === 'es' || value === 'fr' || value === 'de') {
    return value
  }

  return 'pt'
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

function asNumber(value: unknown): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function toBool(value: unknown): boolean {
  return Number(value) === 1 || value === true
}

function lowerText(value: string | null): string {
  return (value || '').toLocaleLowerCase('pt-PT')
}

function titleCase(value: string): string {
  return value
    .toLocaleLowerCase('pt-PT')
    .replace(/(^|\s)\p{L}/gu, (match) => match.toLocaleUpperCase('pt-PT'))
}

function formatArea(value: string | null): string {
  const parsed = Number(value)

  if (!Number.isFinite(parsed) || parsed === 0) {
    return '0,00 m²'
  }

  return `${parsed.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m²`
}

function normalizeRooms(value: number | null): number | string {
  if (value === 15) return 'NA'
  if (value === 11) return '10+'
  return value ?? 0
}

function normalizeGarage(value: number | null): number | string {
  if (value === 15) return 'NA'
  return value ?? 0
}

function normalizeWc(value: number | null): number | string {
  if (value === 15) return 'NA'
  if ((value ?? 0) === 0) return '0'
  return value ?? 0
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

function resolveFirstImage(images: ParsedImage[]): string | null {
  const online = images.find((item) => Number(item.online) === 1)
  return online?.file ?? images[0]?.file ?? null
}

function countOnlineImages(images: ParsedImage[]): number {
  return images.filter((item) => Number(item.online) === 1).length
}

function resolveDescription(raw: string | null): string {
  return asString(raw).replace(/\r\n|\r|\n/g, '<br />')
}

function langValue(
  lang: SupportedLang,
  values: { pt: string | null; en: string | null; es: string | null; fr: string | null; de: string | null }
): string {
  if (lang === 'en' && values.en) return values.en
  if (lang === 'es' && values.es) return values.es
  if (lang === 'fr' && values.fr) return values.fr
  if (lang === 'de' && values.de) return values.de
  return values.pt ?? ''
}

function buildImovTitle(row: PreviewMainRow, lang: SupportedLang): string {
  const negocio = langValue(lang, {
    pt: row.imovtn_pt,
    en: row.imovtn_en,
    es: row.imovtn_es,
    fr: row.imovtn_fr,
    de: row.imovtn_de
  })

  const natureza = langValue(lang, {
    pt: row.imovsubnature_pt,
    en: row.imovsubnature_en,
    es: row.imovsubnature_es,
    fr: row.imovsubnature_fr,
    de: row.imovsubnature_de
  })

  return `${negocio} ${natureza}`.trim()
}

function resolveReference(row: PreviewMainRow): string | null {
  return row.ref_secundary ?? row.ref ?? row.refinterna
}

function resolveYear(dateValue: unknown): string {
  if (!dateValue) {
    return '...'
  }

  if (typeof dateValue === 'string' && dateValue.startsWith('0000-00-00')) {
    return '...'
  }

  const date = dateValue instanceof Date ? dateValue : new Date(String(dateValue))

  if (Number.isNaN(date.getTime())) {
    return '...'
  }

  if (date.getUTCFullYear() <= 1900) {
    return '...'
  }

  return String(date.getUTCFullYear())
}

function resolveVideo(row: PreviewMainRow): string {
  const video = asNullableString(row.video)

  if (!toBool(row.publicar_video) || !video) {
    return ''
  }

  return video.startsWith('https://') ? video : ''
}

function resolveConsultantPhone(row: PreviewMainRow, hideConsultantInfo: boolean): string {
  const collaboratorNumber =
    asNullableString(row.colaborador_telemovel) || asNullableString(row.colaborador_telefone) || ''

  if (!hideConsultantInfo) {
    return collaboratorNumber
  }

  return asNullableString(row.contacto_telefone) || asNullableString(row.agencia_telemovel) || ''
}

function resolveEnergyCertification(row: PreviewMainRow): string {
  return asString(row.imovce_name)
}

function mapDivisions(rows: PreviewDivisionRow[]): Record<string, Array<{ division: string; area: string }>> {
  const grouped: Record<string, Array<{ division: string; area: string }>> = {}

  for (const division of rows) {
    const floor = asString(division.piso)

    if (!grouped[floor]) {
      grouped[floor] = []
    }

    const areaNumber = Number(division.area)
    const area =
      Number.isFinite(areaNumber) && areaNumber > 0
        ? `${areaNumber.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}m²`
        : '-'

    grouped[floor].push({
      division: asString(division.division),
      area
    })
  }

  return grouped
}

export async function getPreviewByHash(
  env: Bindings,
  hash: string,
  url: URL
): Promise<Record<string, unknown> | null> {
  const imovId = decodeSingleHash(env, hash)
  const lang = normalizeLang(url.searchParams.get('lang') || undefined)

  const row = await findPreviewMainByImovId(env, imovId)

  if (!row) {
    return null
  }

  await incrementPreviewVisit(env, row.id)

  const translation = await findPreviewTranslation(env, row.id, lang)
  const title = lang === 'pt' ? asString(row.titulo_publicacao) : asString(translation?.title || row.titulo_publicacao)
  const descriptionSource =
    lang === 'pt' ? asNullableString(row.info_descricao) : asNullableString(translation?.description || row.info_descricao)

  const images = parseImages(row.images)
  const firstImageFile = resolveFirstImage(images)
  const agencyHash = encodeId(env, row.agencia_id)

  const image = firstImageFile
    ? resolveWebsiteFileUrl(env, firstImageFile, row.agencia_id, agencyHash)
    : `${env.URL_IMO360.replace(/\/+$/, '')}/assets/images/nophoto.jpg`

  const thumbnail = image
  const hideConsultantInfo = toBool(row.ocultarDadosConsultor)
  const consultantId = row.colaborador_id ?? row.agencia_id

  const divisoes = mapDivisions(await findPreviewDivisions(env, row.id))

  const [equipamentos, infraestruturas, servicos, segurancas, zonaenvolventes, virtualstaging] =
    await Promise.all([
      findPreviewFeatureLabels(env, row.id, 'equipamentos', lang),
      findPreviewFeatureLabels(env, row.id, 'infraestruturas', lang),
      findPreviewFeatureLabels(env, row.id, 'servicos', lang),
      findPreviewFeatureLabels(env, row.id, 'segurancas', lang),
      findPreviewFeatureLabels(env, row.id, 'zonaenvolventes', lang),
      countPreviewVirtualStaging(env, row.id)
    ])

  const title2 = buildImovTitle(row, lang)

  return {
    external: encodeId(env, row.id),
    reference: resolveReference(row),
    imovnature_id: row.imovnature_id,
    propertytype: row.imovsubnature_id,
    natureza: langValue(lang, {
      pt: row.imovsubnature_pt,
      en: row.imovsubnature_en,
      es: row.imovsubnature_es,
      fr: row.imovsubnature_fr,
      de: row.imovsubnature_de
    }),
    negocio: langValue(lang, {
      pt: row.imovtn_pt,
      en: row.imovtn_en,
      es: row.imovtn_es,
      fr: row.imovtn_fr,
      de: row.imovtn_de
    }),
    estado: langValue(lang, {
      pt: row.imovest_pt,
      en: row.imovest_en,
      es: row.imovest_es,
      fr: row.imovest_fr,
      de: row.imovest_de
    }),
    imovdisp_id: row.imovdisp_id,
    imovtn_id: row.imovtn_id,
    disponibilidade: langValue(lang, {
      pt: row.imovdisp_pt,
      en: row.imovdisp_en,
      es: row.imovdisp_es,
      fr: row.imovdisp_fr,
      de: row.imovdisp_de
    }),
    title1: Number(row.property_title) === 1 ? title : title2,
    title2,
    price: asNumber(row.valor),
    banner_reserva: toBool(row.reserva_online),
    valorreservadireta: row.valor_reserva,
    area_util: formatArea(row.area_util_det),
    area_bruta_privativa: formatArea(row.area_bruta_det),
    area_terreno: formatArea(row.area_terreno_det),
    rooms: normalizeRooms(row.quartos),
    garage: normalizeGarage(row.garagens),
    wc: normalizeWc(row.wcs),
    year: resolveYear(row.inic_construcao),
    description: resolveDescription(descriptionSource),
    destaque: toBool(row.destacar),
    novidade: toBool(row.novidade),
    baixapreco: toBool(row.baixapreco),
    exclusivo: toBool(row.exclusivo),
    distrito_id: row.distrito_id,
    distrito: asString(row.distrito_name),
    concelho_id: row.concelho_id,
    concelho: titleCase(asString(row.concelho_name)),
    freguesia_id: row.freguesia_id,
    freguesia: titleCase(asString(row.freguesia_name)),
    latitude: row.coordenada_lat,
    longitude: row.coordenada_lon,
    sob_consulta: row.valor_site,
    checkvideo: toBool(row.publicar_video) && Boolean(asNullableString(row.video)),
    video: resolveVideo(row),
    checkvirtualtour: (asNullableString(row.link_3D) || '').startsWith('https://')
      ? row.link_3D
      : '',
    virtualtour: row.link_3D,
    energy_certification: resolveEnergyCertification(row),
    consultant_external: encodeId(env, consultantId),
    consultant_name: hideConsultantInfo ? row.agencia_name : row.colaborador_name,
    consultant_email: hideConsultantInfo ? row.agencia_email : row.colaborador_email,
    consultant_photo:
      resolveWebsiteFileUrl(
        env,
        hideConsultantInfo ? row.agencia_foto : row.colaborador_foto,
        row.agencia_id,
        agencyHash
      ) || `${env.URL_IMO360.replace(/\/+$/, '')}/assets/images/profile.png`,
    consultant_phone: resolveConsultantPhone(row, hideConsultantInfo),
    consultant_whatsapp: hideConsultantInfo ? null : row.colaborador_whatsapp_number,
    images: [image],
    thumbnail,
    totalimages: countOnlineImages(images),
    divisoes,
    equipamentos,
    infraestruturas,
    servicos,
    segurancas,
    zonaenvolventes,
    virtualstaging,
    fichapdf: `${env.URL_IMO360.replace(/\/+$/, '')}/api/getImov/`,
    images_link: `${url.origin}/api/preview/${encodeId(env, row.id)}/images`,
    link_agendamento_visita:
      toBool(row.colaborador_agendar_visita_website) && asNullableString(row.colaborador_calendar_visita_website)
        ? row.colaborador_calendar_visita_website
        : null
  }
}

export async function getPreviewBySlug(
  env: Bindings,
  slug: string,
  url: URL
): Promise<Record<string, unknown> | null> {
  const lang = normalizeLang(url.searchParams.get('lang') || undefined)

  const row = await findPreviewMainBySlug(env, slug)

  if (!row) {
    return null
  }

  await incrementPreviewVisit(env, row.id)

  const translation = await findPreviewTranslation(env, row.id, lang)
  const title = lang === 'pt' ? asString(row.titulo_publicacao) : asString(translation?.title || row.titulo_publicacao)
  const descriptionSource =
    lang === 'pt' ? asNullableString(row.info_descricao) : asNullableString(translation?.description || row.info_descricao)

  const images = parseImages(row.images)
  const firstImageFile = resolveFirstImage(images)
  const agencyHash = encodeId(env, row.agencia_id)

  const image = firstImageFile
    ? resolveWebsiteFileUrl(env, firstImageFile, row.agencia_id, agencyHash)
    : `${env.URL_IMO360.replace(/\/+$/, '')}/assets/images/nophoto.jpg`

  const thumbnail = image
  const hideConsultantInfo = toBool(row.ocultarDadosConsultor)
  const consultantId = row.colaborador_id ?? row.agencia_id

  const divisoes = mapDivisions(await findPreviewDivisions(env, row.id))

  const [equipamentos, infraestruturas, servicos, segurancas, zonaenvolventes, virtualstaging] =
    await Promise.all([
      findPreviewFeatureLabels(env, row.id, 'equipamentos', lang),
      findPreviewFeatureLabels(env, row.id, 'infraestruturas', lang),
      findPreviewFeatureLabels(env, row.id, 'servicos', lang),
      findPreviewFeatureLabels(env, row.id, 'segurancas', lang),
      findPreviewFeatureLabels(env, row.id, 'zonaenvolventes', lang),
      countPreviewVirtualStaging(env, row.id)
    ])

  const title2 = buildImovTitle(row, lang)

  return {
    external: encodeId(env, row.id),
    reference: resolveReference(row),
    imovnature_id: row.imovnature_id,
    propertytype: row.imovsubnature_id,
    natureza: langValue(lang, {
      pt: row.imovsubnature_pt,
      en: row.imovsubnature_en,
      es: row.imovsubnature_es,
      fr: row.imovsubnature_fr,
      de: row.imovsubnature_de
    }),
    negocio: langValue(lang, {
      pt: row.imovtn_pt,
      en: row.imovtn_en,
      es: row.imovtn_es,
      fr: row.imovtn_fr,
      de: row.imovtn_de
    }),
    estado: langValue(lang, {
      pt: row.imovest_pt,
      en: row.imovest_en,
      es: row.imovest_es,
      fr: row.imovest_fr,
      de: row.imovest_de
    }),
    imovdisp_id: row.imovdisp_id,
    imovtn_id: row.imovtn_id,
    disponibilidade: langValue(lang, {
      pt: row.imovdisp_pt,
      en: row.imovdisp_en,
      es: row.imovdisp_es,
      fr: row.imovdisp_fr,
      de: row.imovdisp_de
    }),
    title1: Number(row.property_title) === 1 ? title : title2,
    title2,
    price: asNumber(row.valor),
    banner_reserva: toBool(row.reserva_online),
    valorreservadireta: row.valor_reserva,
    area_util: formatArea(row.area_util_det),
    area_bruta_privativa: formatArea(row.area_bruta_det),
    area_terreno: formatArea(row.area_terreno_det),
    rooms: normalizeRooms(row.quartos),
    garage: normalizeGarage(row.garagens),
    wc: normalizeWc(row.wcs),
    year: resolveYear(row.inic_construcao),
    description: resolveDescription(descriptionSource),
    destaque: toBool(row.destacar),
    novidade: toBool(row.novidade),
    baixapreco: toBool(row.baixapreco),
    exclusivo: toBool(row.exclusivo),
    distrito_id: row.distrito_id,
    distrito: asString(row.distrito_name),
    concelho_id: row.concelho_id,
    concelho: titleCase(asString(row.concelho_name)),
    freguesia_id: row.freguesia_id,
    freguesia: titleCase(asString(row.freguesia_name)),
    latitude: row.coordenada_lat,
    longitude: row.coordenada_lon,
    sob_consulta: row.valor_site,
    checkvideo: toBool(row.publicar_video) && Boolean(asNullableString(row.video)),
    video: resolveVideo(row),
    checkvirtualtour: (asNullableString(row.link_3D) || '').startsWith('https://')
      ? row.link_3D
      : '',
    virtualtour: row.link_3D,
    energy_certification: resolveEnergyCertification(row),
    consultant_external: encodeId(env, consultantId),
    consultant_name: hideConsultantInfo ? row.agencia_name : row.colaborador_name,
    consultant_email: hideConsultantInfo ? row.agencia_email : row.colaborador_email,
    consultant_photo:
      resolveWebsiteFileUrl(
        env,
        hideConsultantInfo ? row.agencia_foto : row.colaborador_foto,
        row.agencia_id,
        agencyHash
      ) || `${env.URL_IMO360.replace(/\/+$/, '')}/assets/images/profile.png`,
    consultant_phone: resolveConsultantPhone(row, hideConsultantInfo),
    consultant_whatsapp: hideConsultantInfo ? null : row.colaborador_whatsapp_number,
    images: [image],
    thumbnail,
    totalimages: countOnlineImages(images),
    divisoes,
    equipamentos,
    infraestruturas,
    servicos,
    segurancas,
    zonaenvolventes,
    virtualstaging,
    fichapdf: `${env.URL_IMO360.replace(/\/+$/, '')}/api/getImov/`,
    images_link: `${url.origin}/api/preview/${encodeId(env, row.id)}/images`,
    link_agendamento_visita:
      toBool(row.colaborador_agendar_visita_website) && asNullableString(row.colaborador_calendar_visita_website)
        ? row.colaborador_calendar_visita_website
        : null
  }
}

export async function getPreviewImagesByHash(env: Bindings, hash: string): Promise<string[]> {
  const imovId = decodeSingleHash(env, hash)
  const row = await findPreviewMainByImovId(env, imovId)

  if (!row) {
    return []
  }

  const agencyHash = encodeId(env, row.agencia_id)
  const images = parseImages(row.images)

  return images
    .filter((item) => Number(item.online) === 1)
    .map((item) => resolveWebsiteFileUrl(env, item.file, row.agencia_id, agencyHash))
    .filter((item): item is string => Boolean(item))
}

export async function getPreviewVideoByHash(env: Bindings, hash: string): Promise<string> {
  const imovId = decodeSingleHash(env, hash)
  const video = await findPreviewVideoByImovId(env, imovId)

  return video || ''
}
