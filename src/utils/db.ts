import mysql from 'mysql2/promise'
import type { Bindings } from '../types/env'

export async function getConnection(env: Bindings) {
  return mysql.createConnection({
    host: env.HYPERDRIVE.host,
    user: env.HYPERDRIVE.user,
    password: env.HYPERDRIVE.password,
    database: env.HYPERDRIVE.database,
    port: env.HYPERDRIVE.port,
    disableEval: true
  })
}