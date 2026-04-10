import type { Bindings } from '../types/env'
import { decodeSingleHash } from '../utils/hashid'
import {
  findWebsitePrivacyBaseByAgencyId,
  findWebsitePrivacyTermByWebsiteIdAndLang
} from '../repositories/website.repository'

type SupportedLang = 'pt' | 'en' | 'es' | 'fr' | 'de'

function normalizeLang(lang: string | undefined): SupportedLang {
  const value = (lang || 'pt').toLowerCase()

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

export async function getPrivacyPolicyByHash(
  env: Bindings,
  hash: string,
  langInput?: string
): Promise<{ status: 200 | 404; body: Record<string, string> }> {
  const lang = normalizeLang(langInput)
  const agencyId = decodeSingleHash(env, hash)

  const website = await findWebsitePrivacyBaseByAgencyId(env, agencyId)

  if (!website) {
    return {
      status: 404,
      body: {
        message: 'Website nao encontrado.'
      }
    }
  }

  const term = await findWebsitePrivacyTermByWebsiteIdAndLang(env, website.id, lang)

  if (!term) {
    return {
      status: 404,
      body: {
        message: 'Politica de privacidade nao encontrada.'
      }
    }
  }

  const companyName = `${asString(website.first_name)} ${asString(website.last_name)}`.trim()

  const policy = asString(term.policies)
    .replaceAll('#nomeimobiliaria', companyName)
    .replaceAll('#NIF', asString(website.nif))
    .replaceAll('#AMI', asString(website.ami))
    .replaceAll('#website', asString(website.website_link))
    .replaceAll('#emailimobiliaria', asString(website.email))
    .replaceAll('#telefone', asString(website.telefone))
    .replaceAll('#morada', asString(website.morada))

  return {
    status: 200,
    body: {
      politicadeprivacidade: policy
    }
  }
}
