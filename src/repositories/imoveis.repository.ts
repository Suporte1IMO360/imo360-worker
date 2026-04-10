import type { RowDataPacket } from 'mysql2/promise'
import type { Bindings } from '../types/env'
import { getConnection } from '../utils/db'

type QueryParams = Array<string | number | null>

type NatureRow = RowDataPacket & {
  id: number
  name: string | null
  pt: string | null
  en: string | null
  es: string | null
  fr: string | null
  de: string | null
}

type DealTypeRow = RowDataPacket & {
  id: number
  name: string | null
  pt: string | null
  en: string | null
  es: string | null
  fr: string | null
  de: string | null
}

type DisponibilidadeRow = RowDataPacket & {
  id: number
  name: string | null
  pt: string | null
  en: string | null
  es: string | null
  fr: string | null
  de: string | null
}

type EstadoRow = RowDataPacket & {
  id: number
  name: string | null
  pt: string | null
  en: string | null
  es: string | null
  fr: string | null
  de: string | null
}

type ZonaRow = RowDataPacket & {
  id: number
  name: string | null
}

type CeRow = RowDataPacket & {
  id: number
  name: string | null
}

type PlaceNameRow = RowDataPacket & {
  id: number
  name: string | null
}

type DistritoRow = RowDataPacket & {
  id: number
  name: string | null
}

type ConcelhoRow = RowDataPacket & {
  id: number
  name: string | null
}

type ConcelhoDistritoRow = RowDataPacket & {
  distrito_id: number | null
}

type FreguesiaRow = RowDataPacket & {
  id: number
  name: string | null
  concelho_id: number | null
}

type FreguesiaConcelhoRow = RowDataPacket & {
  concelho_id: number | null
}

export type ImovelRandomRow = RowDataPacket & {
  id: number
  agencia_id: number
  colaborador_id: number | null
  imovdisp_id: number | null
  ref: string | null
  refinterna: string | null
  ref_secundary: string | null
  slug: string | null
  valor: string | null
  destacar: number | null
  novidade: number | null
  baixapreco: number | null
  exclusivo: number | null
  wcs: number | null
  quartos: number | null
  garagens: number | null
  cad_area_bruta_privativa: string | null
  cad_area_bruta_dependente: string | null
  cad_area_terreno: string | null
  info_descricao: string | null
  info_descricao_en: string | null
  info_descricao_es: string | null
  info_descricao_fr: string | null
  info_descricao_de: string | null
  titulo_publicacao: string | null
  titulo_publicacao_en: string | null
  titulo_publicacao_es: string | null
  titulo_publicacao_fr: string | null
  titulo_publicacao_de: string | null
  video: string | null
  publicar_video: number | null
  link_3D: string | null
  online_link_vt: number | null
  images: string | null
  imovnature_id: number | null
  imovnature_name: string | null
  imovnature_pt: string | null
  imovnature_en: string | null
  imovnature_es: string | null
  imovnature_fr: string | null
  imovnature_de: string | null
  imovdisp_pt: string | null
  imovdisp_en: string | null
  imovdisp_es: string | null
  imovdisp_fr: string | null
  imovdisp_de: string | null
  imovtn_pt: string | null
  imovtn_en: string | null
  imovtn_es: string | null
  imovtn_fr: string | null
  imovtn_de: string | null
  concelho_name: string | null
  freguesia_name: string | null
  ocultarDadosConsultor: number | null
  property_title: number | null
  agencia_name: string | null
  agencia_email: string | null
  agencia_foto: string | null
  colaborador_name: string | null
  colaborador_email: string | null
  colaborador_foto: string | null
}

type UserReferencePreferenceRow = RowDataPacket & {
  typereferenceimovs: number | null
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

function placeholders(values: unknown[]): string {
  return values.map(() => '?').join(', ')
}

async function findPlaceRows(
  env: Bindings,
  options: {
    table: 'distritos' | 'concelhos' | 'freguesias'
    placeColumnOnImov: 'distrito_id' | 'concelho_id' | 'freguesia_id'
    term: string
    userIds: number[]
    byColaborador: boolean
    excludeDeleted: boolean
  }
): Promise<PlaceNameRow[]> {
  if (options.userIds.length === 0) {
    return []
  }

  const scopeColumn = options.byColaborador ? 'colaborador_id' : 'agencia_id'
  const userPlaceholders = placeholders(options.userIds)
  const deletedFilter = options.excludeDeleted ? 'AND i.deleted_at IS NULL' : ''

  const sql = `
    SELECT p.id, p.name
    FROM ${options.table} p
    WHERE p.name LIKE ?
      AND p.id IN (
        SELECT DISTINCT i.${options.placeColumnOnImov}
        FROM imovs i
        WHERE i.${scopeColumn} IN (${userPlaceholders})
          AND i.online = 1
          ${deletedFilter}
      )
    ORDER BY p.name ASC
  `

  return queryRows<PlaceNameRow>(env, sql, [`%${options.term}%`, ...options.userIds])
}

export async function findImovelNatureRows(
  env: Bindings,
  userIds: number[],
  byColaborador: boolean
): Promise<NatureRow[]> {
  if (userIds.length === 0) {
    return []
  }

  const scopeColumn = byColaborador ? 'colaborador_id' : 'agencia_id'
  const userPlaceholders = placeholders(userIds)

  const sql = `
    SELECT n.id, n.name, n.pt, n.en, n.es, n.fr, n.de
    FROM imovnatures n
    WHERE n.deleted_at IS NULL
      AND n.id IN (
        SELECT DISTINCT i.imovnature_id
        FROM imovs i
        WHERE i.${scopeColumn} IN (${userPlaceholders})
          AND i.online = 1
          AND i.deleted_at IS NULL
          AND i.imovnature_id IS NOT NULL
      )
    ORDER BY n.name ASC
  `

  return queryRows<NatureRow>(env, sql, userIds)
}

export async function findImovelDealTypeRows(
  env: Bindings,
  userIds: number[],
  byColaborador: boolean
): Promise<DealTypeRow[]> {
  if (userIds.length === 0) {
    return []
  }

  const scopeColumn = byColaborador ? 'colaborador_id' : 'agencia_id'
  const userPlaceholders = placeholders(userIds)

  const sql = `
    SELECT t.id, t.name, t.pt, t.en, t.es, t.fr, t.de
    FROM imovtns t
    WHERE t.deleted_at IS NULL
      AND t.id IN (1, 2, 3, 5)
      AND t.id IN (
        SELECT DISTINCT i.imovtn_id
        FROM imovs i
        WHERE i.${scopeColumn} IN (${userPlaceholders})
          AND i.online = 1
          AND i.deleted_at IS NULL
          AND i.imovtn_id IS NOT NULL
      )
    ORDER BY t.name ASC
  `

  return queryRows<DealTypeRow>(env, sql, userIds)
}

export async function findDisponibilidadeRows(
  env: Bindings,
  userIds: number[],
  byColaborador: boolean
): Promise<DisponibilidadeRow[]> {
  if (userIds.length === 0) {
    return []
  }

  const scopeColumn = byColaborador ? 'colaborador_id' : 'agencia_id'
  const userPlaceholders = placeholders(userIds)

  const sql = `
    SELECT d.id, d.name, d.pt, d.en, d.es, d.fr, d.de
    FROM imovdisps d
    WHERE d.deleted_at IS NULL
      AND d.id IN (
        SELECT DISTINCT i.imovest_id
        FROM imovs i
        WHERE i.${scopeColumn} IN (${userPlaceholders})
          AND i.online = 1
          AND i.deleted_at IS NULL
          AND i.imovest_id IS NOT NULL
      )
    ORDER BY d.name ASC
  `

  return queryRows<DisponibilidadeRow>(env, sql, userIds)
}

export async function findEstadoRows(
  env: Bindings,
  userIds: number[],
  byColaborador: boolean
): Promise<EstadoRow[]> {
  if (userIds.length === 0) {
    return []
  }

  const scopeColumn = byColaborador ? 'colaborador_id' : 'agencia_id'
  const userPlaceholders = placeholders(userIds)

  const sql = `
    SELECT e.id, e.name, e.pt, e.en, e.es, e.fr, e.de
    FROM imovests e
    WHERE e.deleted_at IS NULL
      AND e.id IN (
        SELECT DISTINCT i.imovest_id
        FROM imovs i
        WHERE i.${scopeColumn} IN (${userPlaceholders})
          AND i.online = 1
          AND i.deleted_at IS NULL
          AND i.imovest_id IS NOT NULL
      )
    ORDER BY e.name ASC
  `

  return queryRows<EstadoRow>(env, sql, userIds)
}

export async function findZonaRows(
  env: Bindings,
  userIds: number[],
  byColaborador: boolean,
  zonaIdFilter?: number
): Promise<ZonaRow[]> {
  if (userIds.length === 0) {
    return []
  }

  const scopeColumn = byColaborador ? 'colaborador_id' : 'agencia_id'
  const userPlaceholders = placeholders(userIds)
  const zonaFilterSql = zonaIdFilter ? 'AND z.id = ?' : ''

  const sql = `
    SELECT z.id, z.name
    FROM zonas z
    WHERE z.id IN (
      SELECT DISTINCT i.zona_id
      FROM imovs i
      WHERE i.${scopeColumn} IN (${userPlaceholders})
        AND i.online = 1
        AND i.zona_id IS NOT NULL
    )
    ${zonaFilterSql}
    ORDER BY z.name ASC
  `

  const params = zonaIdFilter ? [...userIds, zonaIdFilter] : userIds

  return queryRows<ZonaRow>(env, sql, params)
}

export async function findCeRows(
  env: Bindings,
  userIds: number[],
  byColaborador: boolean,
  ceIdFilter?: number
): Promise<CeRow[]> {
  if (userIds.length === 0) {
    return []
  }

  const scopeColumn = byColaborador ? 'colaborador_id' : 'agencia_id'
  const userPlaceholders = placeholders(userIds)
  const ceFilterSql = ceIdFilter ? 'AND ce.id = ?' : ''

  const sql = `
    SELECT ce.id, ce.name
    FROM imovces ce
    WHERE ce.id IN (
      SELECT DISTINCT i.imovce_id
      FROM imovs i
      WHERE i.${scopeColumn} IN (${userPlaceholders})
        AND i.online = 1
        AND i.imovce_id IS NOT NULL
    )
    ${ceFilterSql}
    ORDER BY ce.name ASC
  `

  const params = ceIdFilter ? [...userIds, ceIdFilter] : userIds

  return queryRows<CeRow>(env, sql, params)
}

export async function findDistritoRowsByScope(
  env: Bindings,
  userIds: number[],
  byColaborador: boolean
): Promise<DistritoRow[]> {
  if (userIds.length === 0) {
    return []
  }

  const scopeColumn = byColaborador ? 'colaborador_id' : 'agencia_id'
  const userPlaceholders = placeholders(userIds)

  const sql = `
    SELECT d.id, d.name
    FROM distritos d
    WHERE d.id IN (
      SELECT DISTINCT i.distrito_id
      FROM imovs i
      WHERE i.${scopeColumn} IN (${userPlaceholders})
        AND i.online = 1
        AND i.deleted_at IS NULL
        AND i.distrito_id IS NOT NULL
    )
    ORDER BY d.name ASC
  `

  return queryRows<DistritoRow>(env, sql, userIds)
}

export async function findConcelhoRowsByScope(
  env: Bindings,
  userIds: number[],
  byColaborador: boolean,
  distritoIdFilter?: number
): Promise<ConcelhoRow[]> {
  if (userIds.length === 0) {
    return []
  }

  const scopeColumn = byColaborador ? 'colaborador_id' : 'agencia_id'
  const userPlaceholders = placeholders(userIds)
  const distritoFilterSql = distritoIdFilter ? 'AND c.distrito_id = ?' : ''

  const sql = `
    SELECT c.id, c.name
    FROM concelhos c
    WHERE c.id IN (
      SELECT DISTINCT i.concelho_id
      FROM imovs i
      WHERE i.${scopeColumn} IN (${userPlaceholders})
        AND i.online = 1
        AND i.deleted_at IS NULL
        AND i.concelho_id IS NOT NULL
    )
    ${distritoFilterSql}
    ORDER BY c.name ASC
  `

  const params = distritoIdFilter ? [...userIds, distritoIdFilter] : userIds

  return queryRows<ConcelhoRow>(env, sql, params)
}

export async function findConcelhoDistritoById(
  env: Bindings,
  concelhoId: number
): Promise<ConcelhoDistritoRow | null> {
  const sql = `
    SELECT c.distrito_id
    FROM concelhos c
    WHERE c.id = ?
    LIMIT 1
  `

  const rows = await queryRows<ConcelhoDistritoRow>(env, sql, [concelhoId])

  return rows[0] ?? null
}

export async function findFreguesiaRowsByScope(
  env: Bindings,
  userIds: number[],
  byColaborador: boolean,
  concelhoIdFilter?: number
): Promise<FreguesiaRow[]> {
  if (userIds.length === 0) {
    return []
  }

  const scopeColumn = byColaborador ? 'colaborador_id' : 'agencia_id'
  const userPlaceholders = placeholders(userIds)
  const concelhoFilterSql = concelhoIdFilter ? 'AND f.concelho_id = ?' : ''

  const sql = `
    SELECT f.id, f.name, f.concelho_id
    FROM freguesias f
    WHERE f.id IN (
      SELECT DISTINCT i.freguesia_id
      FROM imovs i
      WHERE i.${scopeColumn} IN (${userPlaceholders})
        AND i.online = 1
        AND i.freguesia_id IS NOT NULL
    )
    ${concelhoFilterSql}
    ORDER BY f.name ASC
  `

  const params = concelhoIdFilter ? [...userIds, concelhoIdFilter] : userIds

  return queryRows<FreguesiaRow>(env, sql, params)
}

export async function findFreguesiaConcelhoById(
  env: Bindings,
  freguesiaId: number
): Promise<FreguesiaConcelhoRow | null> {
  const sql = `
    SELECT f.concelho_id
    FROM freguesias f
    WHERE f.id = ?
    LIMIT 1
  `

  const rows = await queryRows<FreguesiaConcelhoRow>(env, sql, [freguesiaId])

  return rows[0] ?? null
}

export async function findImoveisRandomRows(
  env: Bindings,
  userIds: number[]
): Promise<ImovelRandomRow[]> {
  if (userIds.length === 0) {
    return []
  }

  const userPlaceholders = placeholders(userIds)

  const sql = `
    SELECT
      i.id,
      i.agencia_id,
      i.colaborador_id,
      i.imovdisp_id,
      i.ref,
      i.refinterna,
      i.ref_secundary,
      i.slug,
      i.valor,
      i.destacar,
      i.novidade,
      i.baixapreco,
      i.exclusivo,
      i.wcs,
      i.quartos,
      i.garagens,
      i.cad_area_bruta_privativa,
      i.cad_area_bruta_dependente,
      i.cad_area_terreno,
      i.info_descricao,
      i.info_descricao_en,
      i.info_descricao_es,
      i.info_descricao_fr,
      i.info_descricao_de,
      i.titulo_publicacao,
      i.titulo_publicacao_en,
      i.titulo_publicacao_es,
      i.titulo_publicacao_fr,
      i.titulo_publicacao_de,
      i.video,
      i.publicar_video,
      i.link_3D,
      i.online_link_vt,
      i.images,
      i.imovnature_id,
      n.name AS imovnature_name,
      n.pt AS imovnature_pt,
      n.en AS imovnature_en,
      n.es AS imovnature_es,
      n.fr AS imovnature_fr,
      n.de AS imovnature_de,
      d.pt AS imovdisp_pt,
      d.en AS imovdisp_en,
      d.es AS imovdisp_es,
      d.fr AS imovdisp_fr,
      d.de AS imovdisp_de,
      t.pt AS imovtn_pt,
      t.en AS imovtn_en,
      t.es AS imovtn_es,
      t.fr AS imovtn_fr,
      t.de AS imovtn_de,
      co.name AS concelho_name,
      fr.name AS freguesia_name,
      w.ocultarDadosConsultor,
      w.property_title,
      ag.name AS agencia_name,
      ag.email AS agencia_email,
      ag.foto AS agencia_foto,
      col.name AS colaborador_name,
      col.email AS colaborador_email,
      col.foto AS colaborador_foto
    FROM imovs i
    LEFT JOIN imovnatures n ON n.id = i.imovnature_id
    LEFT JOIN imovdisps d ON d.id = i.imovdisp_id
    LEFT JOIN imovtns t ON t.id = i.imovtn_id
    LEFT JOIN concelhos co ON co.id = i.concelho_id
    LEFT JOIN freguesias fr ON fr.id = i.freguesia_id
    LEFT JOIN websites w ON w.agencia_id = i.agencia_id
    LEFT JOIN users ag ON ag.id = i.agencia_id
    LEFT JOIN users col ON col.id = i.colaborador_id
    WHERE i.agencia_id IN (${userPlaceholders})
      AND i.online = 1
      AND i.destacar = 1
      AND i.deleted_at IS NULL
      AND i.colaborador_id IS NOT NULL
    ORDER BY i.destacar DESC, RAND()
    LIMIT 6
  `

  return queryRows<ImovelRandomRow>(env, sql, userIds)
}

export async function findImoveisVirtualTourRows(
  env: Bindings,
  userIds: number[]
): Promise<ImovelRandomRow[]> {
  if (userIds.length === 0) {
    return []
  }

  const userPlaceholders = placeholders(userIds)

  const sql = `
    SELECT
      i.id,
      i.agencia_id,
      i.colaborador_id,
      i.imovdisp_id,
      i.ref,
      i.refinterna,
      i.ref_secundary,
      i.slug,
      i.valor,
      i.destacar,
      i.novidade,
      i.baixapreco,
      i.exclusivo,
      i.wcs,
      i.quartos,
      i.garagens,
      i.cad_area_bruta_privativa,
      i.cad_area_bruta_dependente,
      i.cad_area_terreno,
      i.info_descricao,
      i.info_descricao_en,
      i.info_descricao_es,
      i.info_descricao_fr,
      i.info_descricao_de,
      i.titulo_publicacao,
      i.titulo_publicacao_en,
      i.titulo_publicacao_es,
      i.titulo_publicacao_fr,
      i.titulo_publicacao_de,
      i.video,
      i.publicar_video,
      i.link_3D,
      i.online_link_vt,
      i.images,
      i.imovnature_id,
      n.name AS imovnature_name,
      n.pt AS imovnature_pt,
      n.en AS imovnature_en,
      n.es AS imovnature_es,
      n.fr AS imovnature_fr,
      n.de AS imovnature_de,
      d.pt AS imovdisp_pt,
      d.en AS imovdisp_en,
      d.es AS imovdisp_es,
      d.fr AS imovdisp_fr,
      d.de AS imovdisp_de,
      t.pt AS imovtn_pt,
      t.en AS imovtn_en,
      t.es AS imovtn_es,
      t.fr AS imovtn_fr,
      t.de AS imovtn_de,
      co.name AS concelho_name,
      fr.name AS freguesia_name,
      w.ocultarDadosConsultor,
      w.property_title,
      ag.name AS agencia_name,
      ag.email AS agencia_email,
      ag.foto AS agencia_foto,
      col.name AS colaborador_name,
      col.email AS colaborador_email,
      col.foto AS colaborador_foto
    FROM imovs i
    LEFT JOIN imovnatures n ON n.id = i.imovnature_id
    LEFT JOIN imovdisps d ON d.id = i.imovdisp_id
    LEFT JOIN imovtns t ON t.id = i.imovtn_id
    LEFT JOIN concelhos co ON co.id = i.concelho_id
    LEFT JOIN freguesias fr ON fr.id = i.freguesia_id
    LEFT JOIN websites w ON w.agencia_id = i.agencia_id
    LEFT JOIN users ag ON ag.id = i.agencia_id
    LEFT JOIN users col ON col.id = i.colaborador_id
    WHERE i.agencia_id IN (${userPlaceholders})
      AND i.online = 1
      AND i.link_3D IS NOT NULL
      AND i.deleted_at IS NULL
      AND i.colaborador_id IS NOT NULL
    ORDER BY i.destacar DESC, RAND()
    LIMIT 6
  `

  return queryRows<ImovelRandomRow>(env, sql, userIds)
}

export async function findImoveisExclusiveRows(
  env: Bindings,
  userIds: number[]
): Promise<ImovelRandomRow[]> {
  if (userIds.length === 0) {
    return []
  }

  const userPlaceholders = placeholders(userIds)

  const sql = `
    SELECT
      i.id,
      i.agencia_id,
      i.colaborador_id,
      i.imovdisp_id,
      i.ref,
      i.refinterna,
      i.ref_secundary,
      i.slug,
      i.valor,
      i.destacar,
      i.novidade,
      i.baixapreco,
      i.exclusivo,
      i.wcs,
      i.quartos,
      i.garagens,
      i.cad_area_bruta_privativa,
      i.cad_area_bruta_dependente,
      i.cad_area_terreno,
      i.info_descricao,
      i.info_descricao_en,
      i.info_descricao_es,
      i.info_descricao_fr,
      i.info_descricao_de,
      i.titulo_publicacao,
      i.titulo_publicacao_en,
      i.titulo_publicacao_es,
      i.titulo_publicacao_fr,
      i.titulo_publicacao_de,
      i.video,
      i.publicar_video,
      i.link_3D,
      i.online_link_vt,
      i.images,
      i.imovnature_id,
      n.name AS imovnature_name,
      n.pt AS imovnature_pt,
      n.en AS imovnature_en,
      n.es AS imovnature_es,
      n.fr AS imovnature_fr,
      n.de AS imovnature_de,
      d.pt AS imovdisp_pt,
      d.en AS imovdisp_en,
      d.es AS imovdisp_es,
      d.fr AS imovdisp_fr,
      d.de AS imovdisp_de,
      t.pt AS imovtn_pt,
      t.en AS imovtn_en,
      t.es AS imovtn_es,
      t.fr AS imovtn_fr,
      t.de AS imovtn_de,
      co.name AS concelho_name,
      fr.name AS freguesia_name,
      w.ocultarDadosConsultor,
      w.property_title,
      ag.name AS agencia_name,
      ag.email AS agencia_email,
      ag.foto AS agencia_foto,
      col.name AS colaborador_name,
      col.email AS colaborador_email,
      col.foto AS colaborador_foto
    FROM imovs i
    LEFT JOIN imovnatures n ON n.id = i.imovnature_id
    LEFT JOIN imovdisps d ON d.id = i.imovdisp_id
    LEFT JOIN imovtns t ON t.id = i.imovtn_id
    LEFT JOIN concelhos co ON co.id = i.concelho_id
    LEFT JOIN freguesias fr ON fr.id = i.freguesia_id
    LEFT JOIN websites w ON w.agencia_id = i.agencia_id
    LEFT JOIN users ag ON ag.id = i.agencia_id
    LEFT JOIN users col ON col.id = i.colaborador_id
    WHERE i.agencia_id IN (${userPlaceholders})
      AND i.online = 1
      AND i.exclusivo = 1
      AND i.deleted_at IS NULL
      AND i.colaborador_id IS NOT NULL
    ORDER BY i.destacar DESC, RAND()
    LIMIT 6
  `

  return queryRows<ImovelRandomRow>(env, sql, userIds)
}

export async function findImoveisSimilarRows(
  env: Bindings,
  userIds: number[],
  filters: {
    excludeImovId?: number
    imovsubnatureId?: number
    distritoId?: number
    concelhoId?: number
  }
): Promise<ImovelRandomRow[]> {
  if (userIds.length === 0) {
    return []
  }

  const userPlaceholders = placeholders(userIds)
  const params: QueryParams = [...userIds]
  const optionalFilters: string[] = []

  if (filters.excludeImovId) {
    optionalFilters.push('AND i.id != ?')
    params.push(filters.excludeImovId)
  }

  if (filters.imovsubnatureId) {
    optionalFilters.push('AND i.imovsubnature_id = ?')
    params.push(filters.imovsubnatureId)
  }

  if (filters.distritoId) {
    optionalFilters.push('AND i.distrito_id = ?')
    params.push(filters.distritoId)
  }

  if (filters.concelhoId) {
    optionalFilters.push('AND i.concelho_id = ?')
    params.push(filters.concelhoId)
  }

  const sql = `
    SELECT
      i.id,
      i.agencia_id,
      i.colaborador_id,
      i.imovdisp_id,
      i.ref,
      i.refinterna,
      i.ref_secundary,
      i.slug,
      i.valor,
      i.destacar,
      i.novidade,
      i.baixapreco,
      i.exclusivo,
      i.wcs,
      i.quartos,
      i.garagens,
      i.cad_area_bruta_privativa,
      i.cad_area_bruta_dependente,
      i.cad_area_terreno,
      i.info_descricao,
      i.info_descricao_en,
      i.info_descricao_es,
      i.info_descricao_fr,
      i.info_descricao_de,
      i.titulo_publicacao,
      i.titulo_publicacao_en,
      i.titulo_publicacao_es,
      i.titulo_publicacao_fr,
      i.titulo_publicacao_de,
      i.video,
      i.publicar_video,
      i.link_3D,
      i.online_link_vt,
      i.images,
      i.imovnature_id,
      n.name AS imovnature_name,
      n.pt AS imovnature_pt,
      n.en AS imovnature_en,
      n.es AS imovnature_es,
      n.fr AS imovnature_fr,
      n.de AS imovnature_de,
      d.pt AS imovdisp_pt,
      d.en AS imovdisp_en,
      d.es AS imovdisp_es,
      d.fr AS imovdisp_fr,
      d.de AS imovdisp_de,
      t.pt AS imovtn_pt,
      t.en AS imovtn_en,
      t.es AS imovtn_es,
      t.fr AS imovtn_fr,
      t.de AS imovtn_de,
      co.name AS concelho_name,
      fr.name AS freguesia_name,
      w.ocultarDadosConsultor,
      w.property_title,
      ag.name AS agencia_name,
      ag.email AS agencia_email,
      ag.foto AS agencia_foto,
      col.name AS colaborador_name,
      col.email AS colaborador_email,
      col.foto AS colaborador_foto
    FROM imovs i
    LEFT JOIN imovnatures n ON n.id = i.imovnature_id
    LEFT JOIN imovdisps d ON d.id = i.imovdisp_id
    LEFT JOIN imovtns t ON t.id = i.imovtn_id
    LEFT JOIN concelhos co ON co.id = i.concelho_id
    LEFT JOIN freguesias fr ON fr.id = i.freguesia_id
    LEFT JOIN websites w ON w.agencia_id = i.agencia_id
    LEFT JOIN users ag ON ag.id = i.agencia_id
    LEFT JOIN users col ON col.id = i.colaborador_id
    WHERE i.agencia_id IN (${userPlaceholders})
      AND i.online = 1
      AND i.exclusivo = 1
      AND i.deleted_at IS NULL
      AND i.colaborador_id IS NOT NULL
      ${optionalFilters.join('\n      ')}
    ORDER BY i.destacar DESC, RAND()
    LIMIT 3
  `

  return queryRows<ImovelRandomRow>(env, sql, params)
}

export async function findUserReferencePreferenceByAgencyId(
  env: Bindings,
  agencyId: number
): Promise<number | null> {
  const sql = `
    SELECT u.typereferenceimovs
    FROM users u
    WHERE u.agencia_id = ?
    LIMIT 1
  `

  const rows = await queryRows<UserReferencePreferenceRow>(env, sql, [agencyId])

  return rows[0]?.typereferenceimovs ?? null
}

export async function findDistritosRows(
  env: Bindings,
  term: string,
  userIds: number[],
  byColaborador: boolean
): Promise<PlaceNameRow[]> {
  return findPlaceRows(env, {
    table: 'distritos',
    placeColumnOnImov: 'distrito_id',
    term,
    userIds,
    byColaborador,
    excludeDeleted: true
  })
}

export async function findConcelhosRows(
  env: Bindings,
  term: string,
  userIds: number[],
  byColaborador: boolean
): Promise<PlaceNameRow[]> {
  return findPlaceRows(env, {
    table: 'concelhos',
    placeColumnOnImov: 'concelho_id',
    term,
    userIds,
    byColaborador,
    excludeDeleted: true
  })
}

export async function findFreguesiasRows(
  env: Bindings,
  term: string,
  userIds: number[],
  byColaborador: boolean
): Promise<PlaceNameRow[]> {
  return findPlaceRows(env, {
    table: 'freguesias',
    placeColumnOnImov: 'freguesia_id',
    term,
    userIds,
    byColaborador,
    excludeDeleted: true
  })
}

export async function findDistritosRowsOnlineOnly(
  env: Bindings,
  term: string,
  userIds: number[],
  byColaborador: boolean
): Promise<PlaceNameRow[]> {
  return findPlaceRows(env, {
    table: 'distritos',
    placeColumnOnImov: 'distrito_id',
    term,
    userIds,
    byColaborador,
    excludeDeleted: false
  })
}

export async function findConcelhosRowsOnlineOnly(
  env: Bindings,
  term: string,
  userIds: number[],
  byColaborador: boolean
): Promise<PlaceNameRow[]> {
  return findPlaceRows(env, {
    table: 'concelhos',
    placeColumnOnImov: 'concelho_id',
    term,
    userIds,
    byColaborador,
    excludeDeleted: false
  })
}

export async function findFreguesiasRowsOnlineOnly(
  env: Bindings,
  term: string,
  userIds: number[],
  byColaborador: boolean
): Promise<PlaceNameRow[]> {
  return findPlaceRows(env, {
    table: 'freguesias',
    placeColumnOnImov: 'freguesia_id',
    term,
    userIds,
    byColaborador,
    excludeDeleted: false
  })
}

export type ImoveisSearchRow = ImovelRandomRow & {
  created_at: string | null
  imovdisp_id: number | null
  valor_site: number | null
  area_util_det: string | null
  imovtn_name: string | null
  imovdisp_name: string | null
}

type ImoveisSearchCountRow = RowDataPacket & {
  total: number
}

export type ImoveisSearchFilters = {
  scopeIds: number[]
  scopeByColaborador?: boolean
  placeField?: 'distrito' | 'concelho' | 'freguesia'
  placeId?: number
  distritoId?: number
  concelhoId?: number
  freguesiaId?: number
  reference?: string
  imovnatureIds?: number[]
  agenciasId?: number
  imovtnIds?: number[]
  imovceId?: number
  imovestId?: number
  zonaId?: number
  imovdispId?: number
  precoMin?: number
  precoMax?: number
  baixapreco?: boolean
  imovelBanca?: boolean
  exclusivo?: boolean
  negociavel?: boolean
  permuta?: boolean
  destaque?: boolean
  novidade?: boolean
  virtual?: boolean
  rooms?: number[]
  minroom?: number
  maxroom?: number
  areaMin?: number
  areaMax?: number
  equipamentos?: number[]
  infraestruturas?: number[]
  zonaenvolventes?: number[]
  excludeSold?: boolean
  sort?: number
  page: number
  perPage: number
}

export async function searchImoveisRows(
  env: Bindings,
  filters: ImoveisSearchFilters
): Promise<{ rows: ImoveisSearchRow[]; total: number }> {
  if (filters.scopeIds.length === 0) {
    return { rows: [], total: 0 }
  }

  const userPlaceholders = placeholders(filters.scopeIds)
  const scopeColumn = filters.scopeByColaborador ? 'i.colaborador_id' : 'i.agencia_id'
  const params: QueryParams = [...filters.scopeIds]
  const joins: string[] = []
  const where: string[] = [
    `${scopeColumn} IN (${userPlaceholders})`,
    'i.online = 1',
    'i.deleted_at IS NULL',
    'i.colaborador_id IS NOT NULL'
  ]

  if (filters.agenciasId) {
    joins.push('INNER JOIN users ufilter ON ufilter.id = i.colaborador_id')
    where.push('ufilter.agencias_id = ?')
    params.push(filters.agenciasId)
  }

  if (filters.excludeSold) {
    where.push('i.imovdisp_id != 2')
  }

  if (filters.placeField && filters.placeId) {
    if (filters.placeField === 'distrito') {
      where.push('i.distrito_id = ?')
      params.push(filters.placeId)
    }

    if (filters.placeField === 'concelho') {
      where.push('i.concelho_id = ?')
      params.push(filters.placeId)
    }

    if (filters.placeField === 'freguesia') {
      where.push('i.freguesia_id = ?')
      params.push(filters.placeId)
    }
  } else {
    if (filters.distritoId) {
      where.push('i.distrito_id = ?')
      params.push(filters.distritoId)
    }

    if (filters.concelhoId) {
      where.push('i.concelho_id = ?')
      params.push(filters.concelhoId)
    }

    if (filters.freguesiaId) {
      where.push('i.freguesia_id = ?')
      params.push(filters.freguesiaId)
    }
  }

  if (filters.reference) {
    where.push('(i.ref LIKE ? OR i.refinterna LIKE ? OR i.ref_secundary LIKE ?)')
    const query = `%${filters.reference}%`
    params.push(query, query, query)
  }

  if (filters.imovnatureIds && filters.imovnatureIds.length > 0) {
    where.push(`i.imovnature_id IN (${placeholders(filters.imovnatureIds)})`)
    params.push(...filters.imovnatureIds)
  }

  if (filters.imovtnIds && filters.imovtnIds.length > 0) {
    where.push(`i.imovtn_id IN (${placeholders(filters.imovtnIds)})`)
    params.push(...filters.imovtnIds)
  }

  if (filters.imovceId) {
    where.push('i.imovce_id = ?')
    params.push(filters.imovceId)
  }

  if (filters.imovestId) {
    where.push('i.imovest_id = ?')
    params.push(filters.imovestId)
  }

  if (filters.zonaId) {
    where.push('i.zona_id = ?')
    params.push(filters.zonaId)
  }

  if (filters.imovdispId) {
    where.push('i.imovdisp_id = ?')
    params.push(filters.imovdispId)
  }

  if (filters.precoMin !== undefined) {
    where.push('i.valor >= ?')
    params.push(filters.precoMin)
  }

  if (filters.precoMax !== undefined) {
    where.push('i.valor <= ?')
    params.push(filters.precoMax)
  }

  if (filters.baixapreco) {
    where.push('i.baixapreco = 1')
  }

  if (filters.imovelBanca) {
    where.push('i.imovelBanca = 1')
  }

  if (filters.exclusivo) {
    where.push('i.exclusivo = 1')
  }

  if (filters.negociavel) {
    where.push('i.negociavel = 1')
  }

  if (filters.permuta) {
    where.push('i.permuta = 1')
  }

  if (filters.destaque) {
    where.push('i.destacar = 1')
  }

  if (filters.novidade) {
    where.push('i.novidade = 1')
  }

  if (filters.virtual) {
    where.push('i.link_3D IS NOT NULL')
  }

  if (filters.rooms && filters.rooms.length > 0) {
    where.push(`i.quartos IN (${placeholders(filters.rooms)})`)
    params.push(...filters.rooms)
  }

  if (filters.minroom !== undefined) {
    where.push('i.quartos >= ?')
    params.push(filters.minroom)
  }

  if (filters.maxroom !== undefined) {
    where.push('i.quartos <= ?')
    params.push(filters.maxroom)
  }

  if (filters.areaMin !== undefined) {
    where.push('ia.area_util_det >= ?')
    params.push(filters.areaMin)
  }

  if (filters.areaMax !== undefined) {
    where.push('ia.area_util_det <= ?')
    params.push(filters.areaMax)
  }

  if (filters.equipamentos && filters.equipamentos.length > 0) {
    where.push(
      `EXISTS (SELECT 1 FROM imov_equipamento ie WHERE ie.imov_id = i.id AND ie.equipamento_id IN (${placeholders(filters.equipamentos)}))`
    )
    params.push(...filters.equipamentos)
  }

  if (filters.infraestruturas && filters.infraestruturas.length > 0) {
    where.push(
      `EXISTS (SELECT 1 FROM imov_infraestrutura ii WHERE ii.imov_id = i.id AND ii.infraestrutura_id IN (${placeholders(filters.infraestruturas)}))`
    )
    params.push(...filters.infraestruturas)
  }

  if (filters.zonaenvolventes && filters.zonaenvolventes.length > 0) {
    where.push(
      `EXISTS (SELECT 1 FROM imov_zonaenvolvente iz WHERE iz.imov_id = i.id AND iz.zonaenvolvente_id IN (${placeholders(filters.zonaenvolventes)}))`
    )
    params.push(...filters.zonaenvolventes)
  }

  const whereSql = where.length > 0 ? `WHERE ${where.join('\n      AND ')}` : ''

  let orderBySql = 'ORDER BY i.destacar DESC, i.created_at DESC, i.imovdisp_id ASC'

  switch (filters.sort) {
    case 0:
      orderBySql = 'ORDER BY i.created_at DESC'
      break
    case 1:
      orderBySql = 'ORDER BY i.created_at ASC'
      break
    case 2:
      orderBySql = 'ORDER BY i.valor_site DESC, i.valor DESC'
      break
    case 3:
      orderBySql = 'ORDER BY i.valor_site ASC, i.valor ASC'
      break
    case 4:
      orderBySql = 'ORDER BY ia.area_util_det DESC'
      break
    case 5:
      orderBySql = 'ORDER BY ia.area_util_det ASC'
      break
    default:
      if (filters.sort !== undefined) {
        orderBySql = 'ORDER BY i.destacar DESC, i.id DESC'
      }
      break
  }

  const fromSql = `
    FROM imovs i
    LEFT JOIN imovareas ia ON ia.imov_id = i.id
    LEFT JOIN imovnatures n ON n.id = i.imovnature_id
    LEFT JOIN imovdisps d ON d.id = i.imovdisp_id
    LEFT JOIN imovtns t ON t.id = i.imovtn_id
    LEFT JOIN concelhos co ON co.id = i.concelho_id
    LEFT JOIN freguesias fr ON fr.id = i.freguesia_id
    LEFT JOIN websites w ON w.agencia_id = i.agencia_id
    LEFT JOIN users ag ON ag.id = i.agencia_id
    LEFT JOIN users col ON col.id = i.colaborador_id
    ${joins.join('\n    ')}
    ${whereSql}
  `

  const countSql = `
    SELECT COUNT(DISTINCT i.id) AS total
    ${fromSql}
  `

  const countRows = await queryRows<ImoveisSearchCountRow>(env, countSql, params)
  const total = Number(countRows[0]?.total || 0)

  const safePage = Math.max(1, filters.page)
  const safePerPage = Math.max(1, filters.perPage)
  const offset = (safePage - 1) * safePerPage

  const dataSql = `
    SELECT
      i.id,
      i.agencia_id,
      i.colaborador_id,
      i.ref,
      i.refinterna,
      i.ref_secundary,
      i.slug,
      i.valor,
      i.valor_site,
      i.created_at,
      i.imovdisp_id,
      i.destacar,
      i.novidade,
      i.baixapreco,
      i.exclusivo,
      i.wcs,
      i.quartos,
      i.garagens,
      i.cad_area_bruta_privativa,
      i.cad_area_bruta_dependente,
      i.cad_area_terreno,
      i.info_descricao,
      i.info_descricao_en,
      i.info_descricao_es,
      i.info_descricao_fr,
      i.info_descricao_de,
      i.titulo_publicacao,
      i.titulo_publicacao_en,
      i.titulo_publicacao_es,
      i.titulo_publicacao_fr,
      i.titulo_publicacao_de,
      i.video,
      i.publicar_video,
      i.link_3D,
      i.online_link_vt,
      i.images,
      i.imovnature_id,
      ia.area_util_det,
      n.name AS imovnature_name,
      n.pt AS imovnature_pt,
      n.en AS imovnature_en,
      n.es AS imovnature_es,
      n.fr AS imovnature_fr,
      n.de AS imovnature_de,
      d.name AS imovdisp_name,
      d.pt AS imovdisp_pt,
      d.en AS imovdisp_en,
      d.es AS imovdisp_es,
      d.fr AS imovdisp_fr,
      d.de AS imovdisp_de,
      t.name AS imovtn_name,
      t.pt AS imovtn_pt,
      t.en AS imovtn_en,
      t.es AS imovtn_es,
      t.fr AS imovtn_fr,
      t.de AS imovtn_de,
      co.name AS concelho_name,
      fr.name AS freguesia_name,
      w.ocultarDadosConsultor,
      w.property_title,
      ag.name AS agencia_name,
      ag.email AS agencia_email,
      ag.foto AS agencia_foto,
      col.name AS colaborador_name,
      col.email AS colaborador_email,
      col.foto AS colaborador_foto
    ${fromSql}
    ${orderBySql}
    LIMIT ? OFFSET ?
  `

  const rows = await queryRows<ImoveisSearchRow>(env, dataSql, [...params, safePerPage, offset])

  return { rows, total }
}
