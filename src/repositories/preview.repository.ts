import type { RowDataPacket } from 'mysql2/promise'
import type { Bindings } from '../types/env'
import { getConnection } from '../utils/db'

type QueryParams = Array<string | number | null>

type SupportedLang = 'pt' | 'en' | 'es' | 'fr' | 'de'

export type PreviewMainRow = RowDataPacket & {
  id: number
  agencia_id: number
  colaborador_id: number | null
  ref: string | null
  refinterna: string | null
  ref_secundary: string | null
  imovnature_id: number | null
  imovsubnature_id: number | null
  imovdisp_id: number | null
  imovtn_id: number | null
  imovest_id: number | null
  imovce_id: number | null
  valor: string | null
  valor_site: number | null
  reserva_online: number | null
  valor_reserva: string | null
  quartos: number | null
  garagens: number | null
  wcs: number | null
  inic_construcao: string | null
  info_descricao: string | null
  titulo_publicacao: string | null
  video: string | null
  publicar_video: number | null
  link_3D: string | null
  destacar: number | null
  novidade: number | null
  baixapreco: number | null
  exclusivo: number | null
  distrito_id: number | null
  concelho_id: number | null
  freguesia_id: number | null
  coordenada_lat: string | null
  coordenada_lon: string | null
  images: string | null
  area_util_det: string | null
  area_bruta_det: string | null
  area_terreno_det: string | null
  distrito_name: string | null
  concelho_name: string | null
  freguesia_name: string | null
  imovsubnature_pt: string | null
  imovsubnature_en: string | null
  imovsubnature_es: string | null
  imovsubnature_fr: string | null
  imovsubnature_de: string | null
  imovtn_pt: string | null
  imovtn_en: string | null
  imovtn_es: string | null
  imovtn_fr: string | null
  imovtn_de: string | null
  imovest_pt: string | null
  imovest_en: string | null
  imovest_es: string | null
  imovest_fr: string | null
  imovest_de: string | null
  imovdisp_pt: string | null
  imovdisp_en: string | null
  imovdisp_es: string | null
  imovdisp_fr: string | null
  imovdisp_de: string | null
  ocultarDadosConsultor: number | null
  property_title: number | null
  contacto_telefone: string | null
  agencia_name: string | null
  agencia_email: string | null
  agencia_foto: string | null
  agencia_telemovel: string | null
  colaborador_name: string | null
  colaborador_email: string | null
  colaborador_foto: string | null
  colaborador_telemovel: string | null
  colaborador_telefone: string | null
  colaborador_whatsapp_number: string | null
  colaborador_agendar_visita_website: number | null
  colaborador_calendar_visita_website: string | null
  imovce_name: string | null
}

export type PreviewTranslationRow = RowDataPacket & {
  title: string | null
  description: string | null
}

export type PreviewDivisionRow = RowDataPacket & {
  piso: string | null
  division: string | null
  area: string | null
}

export type PreviewVirtualStagingRow = RowDataPacket & {
  name: string | null
  generated_image: string | null
}

type CountRow = RowDataPacket & {
  total: number
}

type PreviewIdRow = RowDataPacket & {
  id: number
}

type PreviewVideoRow = RowDataPacket & {
  video: string | null
}

type PreviewVirtualTourRow = RowDataPacket & {
  link_3D: string | null
}

async function queryRows<T extends RowDataPacket>(
  env: Bindings,
  sql: string,
  params: QueryParams
): Promise<T[]> {
  const connection = await getConnection(env)

  try {
    const client = connection as unknown as {
      execute?: (statement: string, values: QueryParams) => Promise<[T[]]>
      query?: (statement: string, values: QueryParams) => Promise<[T[]]>
    }

    const run = client.query ?? client.execute

    if (!run) {
      throw new Error('Unsupported MySQL connection client')
    }

    const [rows] = await run.call(client, sql, params)
    return rows
  } finally {
    await connection.end()
  }
}

function langColumn(base: string, lang: SupportedLang): string {
  if (lang === 'en') return `${base}.en`
  if (lang === 'es') return `${base}.es`
  if (lang === 'fr') return `${base}.fr`
  if (lang === 'de') return `${base}.de`
  return `${base}.pt`
}

export async function findPreviewMainByImovId(
  env: Bindings,
  imovId: number
): Promise<PreviewMainRow | null> {
  const sql = `
    SELECT
      i.id,
      i.agencia_id,
      i.colaborador_id,
      i.ref,
      i.refinterna,
      i.ref_secundary,
      i.imovnature_id,
      i.imovsubnature_id,
      i.imovdisp_id,
      i.imovtn_id,
      i.imovest_id,
      i.imovce_id,
      i.valor,
      i.valor_site,
      i.reserva_online,
      i.valor_reserva,
      i.quartos,
      i.garagens,
      i.wcs,
      i.inic_construcao,
      i.info_descricao,
      i.titulo_publicacao,
      i.video,
      i.publicar_video,
      i.link_3D,
      i.destacar,
      i.novidade,
      i.baixapreco,
      i.exclusivo,
      i.distrito_id,
      i.concelho_id,
      i.freguesia_id,
      i.coordenada_lat,
      i.coordenada_lon,
      i.images,
      ia.area_util_det,
      ia.area_bruta_det,
      ia.area_terreno_det,
      dis.name AS distrito_name,
      con.name AS concelho_name,
      fre.name AS freguesia_name,
      sn.pt AS imovsubnature_pt,
      sn.en AS imovsubnature_en,
      sn.es AS imovsubnature_es,
      sn.fr AS imovsubnature_fr,
      sn.de AS imovsubnature_de,
      tn.pt AS imovtn_pt,
      tn.en AS imovtn_en,
      tn.es AS imovtn_es,
      tn.fr AS imovtn_fr,
      tn.de AS imovtn_de,
      est.pt AS imovest_pt,
      est.en AS imovest_en,
      est.es AS imovest_es,
      est.fr AS imovest_fr,
      est.de AS imovest_de,
      disp.pt AS imovdisp_pt,
      disp.en AS imovdisp_en,
      disp.es AS imovdisp_es,
      disp.fr AS imovdisp_fr,
      disp.de AS imovdisp_de,
      w.ocultarDadosConsultor,
      w.property_title,
      w.contacto_telefone,
      ag.name AS agencia_name,
      ag.email AS agencia_email,
      ag.foto AS agencia_foto,
      ag.telemovel AS agencia_telemovel,
      col.name AS colaborador_name,
      col.email AS colaborador_email,
      col.foto AS colaborador_foto,
      col.telemovel AS colaborador_telemovel,
      col.telefone AS colaborador_telefone,
      col.whatsapp_number AS colaborador_whatsapp_number,
      up.agendar_visita_website AS colaborador_agendar_visita_website,
      col.imov_calendar_visita_website AS colaborador_calendar_visita_website,
      ce.name AS imovce_name
    FROM imovs i
    LEFT JOIN imovareas ia ON ia.imov_id = i.id
    LEFT JOIN distritos dis ON dis.id = i.distrito_id
    LEFT JOIN concelhos con ON con.id = i.concelho_id
    LEFT JOIN freguesias fre ON fre.id = i.freguesia_id
    LEFT JOIN imovsubnatures sn ON sn.id = i.imovsubnature_id
    LEFT JOIN imovtns tn ON tn.id = i.imovtn_id
    LEFT JOIN imovests est ON est.id = i.imovest_id
    LEFT JOIN imovdisps disp ON disp.id = i.imovdisp_id
    LEFT JOIN websites w ON w.agencia_id = i.agencia_id
    LEFT JOIN users ag ON ag.id = i.agencia_id
    LEFT JOIN users col ON col.id = i.colaborador_id
    LEFT JOIN userspermissoes up ON up.user_id = col.id
    LEFT JOIN imovces ce ON ce.id = i.imovce_id
    WHERE i.id = ?
      AND i.deleted_at IS NULL
    LIMIT 1
  `

  const rows = await queryRows<PreviewMainRow>(env, sql, [imovId])
  return rows[0] ?? null
}

export async function findPreviewMainBySlug(
  env: Bindings,
  slug: string
): Promise<PreviewMainRow | null> {
  const sql = `
    SELECT i.id
    FROM imovs i
    WHERE i.slug = ?
      AND i.deleted_at IS NULL
    LIMIT 1
  `

  const rows = await queryRows<PreviewIdRow>(env, sql, [slug])
  const imovId = rows[0]?.id

  if (!imovId) {
    return null
  }

  return findPreviewMainByImovId(env, imovId)
}

export async function findPreviewTranslation(
  env: Bindings,
  imovId: number,
  locale: SupportedLang
): Promise<PreviewTranslationRow | null> {
  if (locale === 'pt') {
    return null
  }

  const sql = `
    SELECT t.title, t.description
    FROM imov_translations t
    WHERE t.imov_id = ?
      AND t.locale = ?
    LIMIT 1
  `

  const rows = await queryRows<PreviewTranslationRow>(env, sql, [imovId, locale])
  return rows[0] ?? null
}

export async function findPreviewDivisions(
  env: Bindings,
  imovId: number
): Promise<PreviewDivisionRow[]> {
  const sql = `
    SELECT d.piso, d.division, d.area
    FROM imovdivisions d
    WHERE d.imov_id = ?
    ORDER BY d.piso ASC, d.id ASC
  `

  return queryRows<PreviewDivisionRow>(env, sql, [imovId])
}

export async function findPreviewFeatureLabels(
  env: Bindings,
  imovId: number,
  relation: 'equipamentos' | 'infraestruturas' | 'servicos' | 'segurancas' | 'zonaenvolventes',
  lang: SupportedLang
): Promise<string[]> {
  const config = {
    equipamentos: {
      pivotTable: 'imov_equipamento',
      refTable: 'equipamentos',
      pivotKey: 'equipamento_id'
    },
    infraestruturas: {
      pivotTable: 'imov_infraestrutura',
      refTable: 'infraestruturas',
      pivotKey: 'infraestrutura_id'
    },
    servicos: {
      pivotTable: 'imov_servico',
      refTable: 'servicos',
      pivotKey: 'servico_id'
    },
    segurancas: {
      pivotTable: 'imov_seguranca',
      refTable: 'segurancas',
      pivotKey: 'seguranca_id'
    },
    zonaenvolventes: {
      pivotTable: 'imov_zonaenvolvente',
      refTable: 'zonaenvolventes',
      pivotKey: 'zonaenvolvente_id'
    }
  }[relation]

  const sql = `
    SELECT ${langColumn('r', lang)} AS label
    FROM ${config.pivotTable} p
    INNER JOIN ${config.refTable} r ON r.id = p.${config.pivotKey}
    WHERE p.imov_id = ?
      AND p.value = 1
    ORDER BY r.id ASC
  `

  const rows = await queryRows<RowDataPacket & { label: string | null }>(env, sql, [imovId])

  return rows.map((row) => row.label).filter((item): item is string => Boolean(item))
}

export async function countPreviewVirtualStaging(env: Bindings, imovId: number): Promise<number> {
  const sql = `
    SELECT COUNT(*) AS total
    FROM imov_virtualstaging v
    WHERE v.imov_id = ?
  `

  const rows = await queryRows<CountRow>(env, sql, [imovId])
  return Number(rows[0]?.total || 0)
}

export async function incrementPreviewVisit(env: Bindings, imovId: number): Promise<void> {
  const now = new Date()
  const year = String(now.getUTCFullYear())
  const month = String(now.getUTCMonth() + 1).padStart(2, '0')

  const findSql = `
    SELECT v.id, v.views
    FROM visits v
    WHERE v.imov_id = ?
      AND v.year = ?
      AND v.month = ?
    LIMIT 1
  `

  const visitRows = await queryRows<RowDataPacket & { id: number; views: number }>(env, findSql, [
    imovId,
    year,
    month
  ])

  if (visitRows.length === 0) {
    const insertSql = `
      INSERT INTO visits (imov_id, year, month, views, created_at, updated_at)
      VALUES (?, ?, ?, 1, NOW(), NOW())
    `

    await queryRows<RowDataPacket>(env, insertSql, [imovId, year, month])
    return
  }

  const updateSql = `
    UPDATE visits
    SET views = views + 1,
        updated_at = NOW()
    WHERE id = ?
  `

  await queryRows<RowDataPacket>(env, updateSql, [visitRows[0].id])
}

export async function findPreviewVideoByImovId(
  env: Bindings,
  imovId: number
): Promise<string | null> {
  const sql = `
    SELECT i.video
    FROM imovs i
    WHERE i.id = ?
    LIMIT 1
  `

  const rows = await queryRows<PreviewVideoRow>(env, sql, [imovId])
  return rows[0]?.video ?? null
}

export async function findPreviewVirtualTourByImovId(
  env: Bindings,
  imovId: number
): Promise<string | null> {
  const sql = `
    SELECT i.link_3D
    FROM imovs i
    WHERE i.id = ?
    LIMIT 1
  `

  const rows = await queryRows<PreviewVirtualTourRow>(env, sql, [imovId])
  return rows[0]?.link_3D ?? null
}

export async function findPreviewVirtualStagingByImovId(
  env: Bindings,
  imovId: number
): Promise<PreviewVirtualStagingRow[]> {
  const sql = `
    SELECT vs.name, vs.generated_image
    FROM imov_virtualstaging iv
    INNER JOIN virtualstagings vs ON vs.id = iv.virtualstaging_id
    WHERE iv.imov_id = ?
    ORDER BY vs.id ASC
  `

  return queryRows<PreviewVirtualStagingRow>(env, sql, [imovId])
}
