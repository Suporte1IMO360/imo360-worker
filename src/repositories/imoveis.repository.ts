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

type PlaceNameRow = RowDataPacket & {
  id: number
  name: string | null
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
  }
): Promise<PlaceNameRow[]> {
  if (options.userIds.length === 0) {
    return []
  }

  const scopeColumn = options.byColaborador ? 'colaborador_id' : 'agencia_id'
  const userPlaceholders = placeholders(options.userIds)

  const sql = `
    SELECT p.id, p.name
    FROM ${options.table} p
    WHERE p.name LIKE ?
      AND p.id IN (
        SELECT DISTINCT i.${options.placeColumnOnImov}
        FROM imovs i
        WHERE i.${scopeColumn} IN (${userPlaceholders})
          AND i.online = 1
          AND i.deleted_at IS NULL
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
    byColaborador
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
    byColaborador
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
    byColaborador
  })
}
