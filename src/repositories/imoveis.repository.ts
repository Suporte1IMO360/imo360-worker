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
