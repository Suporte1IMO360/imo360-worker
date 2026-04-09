import Hashids from 'hashids'
import type { Bindings } from '../types/env'

type HashidsConnection = 'main' | 'alternative'

type HashidsConfig = {
  salt: string
  minLength: number
  alphabet?: string
}

function toPositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value)

  if (Number.isInteger(parsed) && parsed > 0) {
    return parsed
  }

  return fallback
}

function getConnectionConfig(env: Bindings, connection: HashidsConnection): HashidsConfig | null {
  if (connection === 'main') {
    return {
      salt: env.HASHIDS_SALT,
      minLength: toPositiveInt(env.HASHIDS_MIN_LENGTH, 6),
      alphabet: env.HASHIDS_ALPHABET || undefined
    }
  }

  if (!env.HASHIDS_ALTERNATIVE_SALT) {
    return null
  }

  return {
    salt: env.HASHIDS_ALTERNATIVE_SALT,
    minLength: toPositiveInt(env.HASHIDS_ALTERNATIVE_MIN_LENGTH, 25),
    alphabet: env.HASHIDS_ALTERNATIVE_ALPHABET || env.HASHIDS_ALPHABET || undefined
  }
}

export function getHashids(env: Bindings, connection: HashidsConnection = 'main') {
  const config = getConnectionConfig(env, connection)

  if (!config) {
    throw new Error(`Hashids connection not configured: ${connection}`)
  }

  return new Hashids(config.salt, config.minLength, config.alphabet)
}

function decodeOnConnection(
  env: Bindings,
  hash: string,
  connection: HashidsConnection
): number | null {
  const config = getConnectionConfig(env, connection)

  if (!config) {
    return null
  }

  let decoded: unknown[]

  try {
    decoded = new Hashids(config.salt, config.minLength, config.alphabet).decode(hash)
  } catch {
    return null
  }

  const id = Number(decoded[0])

  if (!id) {
    return null
  }

  return id
}

export function decodeSingleHash(env: Bindings, hash: string): number {
  const mainConfig = getConnectionConfig(env, 'main')
  const alternativeConfig = getConnectionConfig(env, 'alternative')

  const preferredConnections: HashidsConnection[] = []

  if (mainConfig && hash.length === mainConfig.minLength) {
    preferredConnections.push('main')
  }

  if (alternativeConfig && hash.length === alternativeConfig.minLength) {
    preferredConnections.push('alternative')
  }

  if (!preferredConnections.includes('main')) {
    preferredConnections.push('main')
  }

  if (alternativeConfig && !preferredConnections.includes('alternative')) {
    preferredConnections.push('alternative')
  }

  for (const connection of preferredConnections) {
    const id = decodeOnConnection(env, hash, connection)

    if (id) {
      return id
    }
  }

  throw new Error('Invalid hash')
}

export function encodeId(env: Bindings, id: number): string {
  return getHashids(env).encode(id)
}