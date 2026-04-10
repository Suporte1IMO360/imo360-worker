export type Bindings = {
  HYPERDRIVE: Hyperdrive
  APP_ENV: string
  URL_IMO360: string
  USE_CLOUDFLARE_IMAGES?: string
  CF_IMAGES_BASE_URL?: string
  CF_IMAGES_VARIANT?: string
  WEBSITE_DEFAULT_PATH?: string
  IMOVEL_DEFAULT_PATH?: string
  HASHIDS_SALT: string
  HASHIDS_MIN_LENGTH: string
  HASHIDS_ALPHABET: string
  HASHIDS_ALTERNATIVE_SALT?: string
  HASHIDS_ALTERNATIVE_MIN_LENGTH?: string
  HASHIDS_ALTERNATIVE_ALPHABET?: string
  CACHE_TTL_WEBSITE: string
  CACHE_TTL_IMOVEIS: string
  CACHE_TTL_PREVIEW: string
  API_AUTH_TOKEN?: string
}

export type AppEnv = {
  Bindings: Bindings
}