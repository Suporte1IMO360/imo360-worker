import type { Bindings } from '../types/env'
import {
  findHomepageBlocksByAgencyId,
  type HomepageBlockRow
} from '../repositories/website.repository'
import { decodeSingleHash } from '../utils/hashid'
import {
  resolveWebsiteAdminImageUrl,
  resolveWebsiteFileUrl
} from './website.service'

type SupportedLang = 'pt' | 'en' | 'es' | 'fr' | 'de'

type HomepageBlockResponse = {
  img: string | null
  text: string | null
  bt: string | null
  link: string | null
}

function normalizeLang(lang: string | undefined): SupportedLang {
  const value = (lang || 'pt').toLowerCase()

  if (value === 'en' || value === 'es' || value === 'fr' || value === 'de') {
    return value
  }

  return 'pt'
}

function getLocalizedValue(block: HomepageBlockRow, prefix: 'text' | 'bt' | 'link', lang: SupportedLang) {
  const field = `${prefix}_${lang}` as keyof HomepageBlockRow
  const value = block[field]

  if (value === null || value === undefined) {
    return null
  }

  return String(value)
}

function mapBlock(
  env: Bindings,
  agencyId: number,
  hash: string,
  lang: SupportedLang,
  block: HomepageBlockRow
): HomepageBlockResponse {
  const img =
    Number(block.selection) === 0
      ? resolveWebsiteFileUrl(env, block.img, agencyId, hash)
      : resolveWebsiteAdminImageUrl(env, block.admin_image_imagem)

  return {
    img,
    text: getLocalizedValue(block, 'text', lang),
    bt: getLocalizedValue(block, 'bt', lang),
    link: getLocalizedValue(block, 'link', lang)
  }
}

export async function getHomepageBlocksByHash(
  env: Bindings,
  hash: string,
  langInput?: string
): Promise<{ blocks: HomepageBlockResponse[] }> {
  const agencyId = decodeSingleHash(env, hash)
  const lang = normalizeLang(langInput)
  const blocks = await findHomepageBlocksByAgencyId(env, agencyId)

  return {
    blocks: blocks.map((block) => mapBlock(env, agencyId, hash, lang, block))
  }
}
