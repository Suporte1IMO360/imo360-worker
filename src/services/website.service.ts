import type { Bindings } from '../types/env'
import { decodeSingleHash } from '../utils/hashid'
import { findWebsiteAggregateByAgencyId } from '../repositories/website.repository'

const WEBPAGE_IDS = {
  ABOUTUS: 2,
  SERVICES: 4,
  RECRUIT: 6,
  WANTSELL: 7,
  TEAM: 8,
  REALESTATEDEVELOPMENT: 9,
  AGENCIES: 10,
  BLOGS: 11
}

function hasValue(value: unknown): boolean {
  return value !== null && value !== undefined && value !== ''
}

function asString(value: unknown): string {
  if (value === null || value === undefined) {
    return ''
  }

  return String(value)
}

function asNullableString(value: unknown): string | null {
  if (!hasValue(value)) {
    return null
  }

  return String(value)
}

function asNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function asBoolean(value: unknown): boolean {
  return Boolean(Number(value) || value === true)
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
}

function normalizePath(path: string): string {
  return path.replace(/^\/+|\/+$/g, '')
}

function asBooleanString(value: string | undefined): boolean {
  if (!value) {
    return false
  }

  const normalized = value.trim().toLowerCase()
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on'
}

function looksLikeCloudflareImageId(value: string): boolean {
  if (!value || /^https?:\/\//i.test(value)) {
    return false
  }

  if (value.includes('/')) {
    return false
  }

  if (/\.[a-z0-9]{2,5}$/i.test(value)) {
    return false
  }

  return /^[A-Za-z0-9_-]{16,}$/.test(value)
}

function cloudflareImageUrl(env: Bindings, imageId: string): string | null {
  const base = env.CF_IMAGES_BASE_URL

  if (!base) {
    return null
  }

  const variant = env.CF_IMAGES_VARIANT || 'public'
  const normalizedBase = normalizeBaseUrl(base)
  const normalizedId = normalizePath(imageId)
  const normalizedVariant = normalizePath(variant)

  return `${normalizedBase}/${normalizedId}/${normalizedVariant}`
}

function cloudflarePathUrl(env: Bindings, path: string): string | null {
  const base = env.CF_IMAGES_BASE_URL

  if (!base) {
    return null
  }

  return `${normalizeBaseUrl(base)}/${normalizePath(path)}`
}

function resolveLegacyPathPrefix(env: Bindings, agencyId: number, hash: string): string {
  const template = env.WEBSITE_DEFAULT_PATH

  if (!template) {
    return ''
  }

  return normalizePath(
    template
      .replace(/\{agency_id\}/gi, String(agencyId))
      .replace(/\{hash\}/gi, hash)
      .replace(/\{agency_hash\}/gi, hash)
      .replace(/\{user_hash\}/gi, hash)
  )
}

function resolveAssetUrl(env: Bindings, value: unknown, agencyId: number, hash: string): string | null {
  const raw = asNullableString(value)

  if (!raw) {
    return null
  }

  if (/^https?:\/\//i.test(raw)) {
    return raw
  }

  if (asBooleanString(env.USE_CLOUDFLARE_IMAGES) && looksLikeCloudflareImageId(raw)) {
    const cloudflareUrl = cloudflareImageUrl(env, raw)
    if (cloudflareUrl) {
      return cloudflareUrl
    }
  }

  const normalizedRaw = raw.replace(/^\/+/, '')
  const legacyPrefix = resolveLegacyPathPrefix(env, agencyId, hash)
  const withPrefix = legacyPrefix
    ? normalizedRaw.startsWith(`${legacyPrefix}/`) || normalizedRaw === legacyPrefix
      ? normalizedRaw
      : `${legacyPrefix}/${normalizedRaw}`
    : normalizedRaw

  if (asBooleanString(env.USE_CLOUDFLARE_IMAGES)) {
    const cloudflareUrl = cloudflarePathUrl(env, withPrefix)

    if (cloudflareUrl) {
      return cloudflareUrl
    }
  }

  return `${normalizeBaseUrl(env.URL_IMO360)}/${withPrefix}`
}

function makeFileUrl(env: Bindings, value: unknown, agencyId: number, hash: string): string | null {
  return resolveAssetUrl(env, value, agencyId, hash)
}

export function resolveWebsiteFileUrl(
  env: Bindings,
  value: unknown,
  agencyId: number,
  hash: string
): string | null {
  return makeFileUrl(env, value, agencyId, hash)
}

function adminImageUrl(env: Bindings, filename: unknown): string | null {
  const raw = asNullableString(filename)

  if (!raw) {
    return null
  }

  if (asBooleanString(env.USE_CLOUDFLARE_IMAGES)) {
    if (looksLikeCloudflareImageId(raw)) {
      const cloudflareUrl = cloudflareImageUrl(env, raw)
      if (cloudflareUrl) {
        return cloudflareUrl
      }
    }

    const cloudflarePath = cloudflarePathUrl(env, `adminimagens/${raw}`)

    if (cloudflarePath) {
      return cloudflarePath
    }
  }

  return `${normalizeBaseUrl(env.URL_IMO360)}/adminimagens/${raw}`
}

export function resolveWebsiteAdminImageUrl(env: Bindings, filename: unknown): string | null {
  return adminImageUrl(env, filename)
}

function formatHour(value: unknown): string {
  const raw = asNullableString(value)

  if (!raw) {
    return ''
  }

  const hhmm = raw.length >= 5 ? raw.slice(0, 5) : raw
  return `${hhmm}h`
}

function formatTimeBlock(
  morningStart: unknown,
  morningEnd: unknown,
  afternoonStart: unknown,
  afternoonEnd: unknown
): string {
  const morningStartTxt = formatHour(morningStart)
  const morningEndTxt = formatHour(morningEnd)
  const afternoonStartTxt = formatHour(afternoonStart)
  const afternoonEndTxt = formatHour(afternoonEnd)

  let result = ''

  if (morningStartTxt) {
    result += morningStartTxt
  }

  if (morningEndTxt) {
    result += `${result ? ' - ' : ''}${morningEndTxt}`
  }

  if (afternoonStartTxt) {
    result += `${result ? ' / ' : ''}${afternoonStartTxt}`
  }

  if (afternoonEndTxt) {
    result += `${result ? ' - ' : ''}${afternoonEndTxt}`
  }

  return result
}

function formatContactRange(start: unknown, end: unknown): string {
  const startTxt = asString(start)
  const endTxt = asString(end)

  if (startTxt && endTxt) {
    return `${startTxt} a ${endTxt}`
  }

  return startTxt || endTxt || ''
}

function toTitleCase(value: unknown): string {
  const text = asNullableString(value)

  if (!text) {
    return ''
  }

  return text
    .toLocaleLowerCase('pt-PT')
    .replace(/\b([a-z\u00c0-\u017f])/g, (match) => match.toLocaleUpperCase('pt-PT'))
}

function resolveSectionTopImage(params: {
  env: Bindings
  agencyId: number
  hash: string
  optionId: unknown
  websiteImage: unknown
  adminImageName: unknown
}): string | null {
  const optionId = asNumber(params.optionId, 0)

  if (!hasValue(params.optionId) && !hasValue(params.websiteImage)) {
    return null
  }

  if (optionId !== 0 && hasValue(params.optionId)) {
    return adminImageUrl(params.env, params.adminImageName)
  }

  return makeFileUrl(params.env, params.websiteImage, params.agencyId, params.hash)
}

export async function getWebsitePayloadByHash(env: Bindings, hash: string) {
  const agencyId = decodeSingleHash(env, hash)
  const aggregate = await findWebsiteAggregateByAgencyId(env, agencyId, WEBPAGE_IDS)

  if (!aggregate) {
    return null
  }

  const website = aggregate.website as Record<string, unknown>
  const location = aggregate.location
  const adminImages = aggregate.adminImages
  const pages = aggregate.pages
  const colors = aggregate.colors

  const street = `${asString(website.contacto_morada).trim()}${
    hasValue(website.contacto_codpostal) ? `, ${asString(website.contacto_codpostal)}` : ''
  }${
    hasValue(website.localidade)
      ? `, ${asString(website.localidade)}`
      : hasValue(location.concelho)
        ? `, ${asString(location.concelho)}`
        : ''
  }`

  return {
    ico: hasValue(website.ico) ? makeFileUrl(env, website.icon ?? website.ico, agencyId, hash) : null,
    logo: hasValue(website.geral_logo) ? makeFileUrl(env, website.logo ?? website.geral_logo, agencyId, hash) : null,
    ami: website.website_ami,
    alvara: website.alvara,
    active: asBoolean(website.user_activated),
    street,
    freguesia: toTitleCase(location.freguesia),
    postalcode: asString(website.contacto_codpostal),
    footer_contact: asString(website.contacto_footer_empresa),
    footer_image: makeFileUrl(env, website.img_footer, agencyId, hash),
    phone: asString(website.contacto_telefone),
    mobile: asString(website.contacto_telemovel),
    reserved_image: makeFileUrl(env, website.img_reservedimov, agencyId, hash),
    slug: asNumber(website.property_slug) === 2,
    numb_interm_credito: website.contact_interm_credit,
    widget_reatia: asNullableString(website.widget_reatia),
    widget_lou: website.widget_lou,
    reportingchannel: asNullableString(website.reportingchannel),
    modal_custom_is_online: asBoolean(website.modal_custom_is_online),
    iframe_credit_simulator: asNullableString(website.iframe_credit_simulator),
    schedule: {
      week: {
        contact: formatContactRange(website.contacto_horario, website.contacto_horario2),
        time: formatTimeBlock(
          website.contacto_manha_inicio,
          website.contacto_manha_fim,
          website.contacto_tarde_inicio,
          website.contacto_tarde_fim
        )
      },
      weekend: {
        contact: formatContactRange(website.contacto_horario3, website.contacto_horario4),
        time: formatTimeBlock(
          website.contacto_manha_inicio2,
          website.contacto_manha_fim2,
          website.contacto_tarde_inicio2,
          website.contacto_tarde_fim2
        )
      }
    },
    social: {
      facebook: asNullableString(website.geral_facebook),
      instagram: asNullableString(website.geral_instagram),
      twitter: asNullableString(website.geral_twitter),
      linkedin: asNullableString(website.geral_linkedin),
      youtube: asNullableString(website.geral_youtube),
      pinterest: asNullableString(website.geral_pinterest)
    },
    homepage: {
      video:
        asNumber(website.type_homepage) === 1
          ? asNullableString(website.homepage_video)
          : null,
      sliders: asNumber(website.websiteimgsliders_count),
      bgimage:
        asNumber(website.options_website_image_home) === 0 && hasValue(website.website_image_home)
          ? makeFileUrl(env, website.website_image_home, agencyId, hash)
          : adminImageUrl(env, adminImages.home),
      section: {
        destaques: website.section_destaque,
        exclusive: website.section_exclusive,
        virtualtour: website.section_virtualtour
      }
    },
    languages: {
      en: asBoolean(website.user_translate_en),
      es: asBoolean(website.user_translate_es),
      fr: asBoolean(website.user_translate_fr),
      de: asBoolean(website.user_translate_de)
    },
    chat: {
      tidio_code: website.tidio_code,
      facebook_chat_code: website.facebook_chat_code
    },
    google: {
      description_website: website.description_website,
      keywords: website.keywords,
      google_site_verification: website.google_site_verification,
      page_title: website.page_title,
      google_analytics_id: website.google_analytics_id,
      google_tag_manager_head: website.google_tag_manager_head,
      google_tag_manager_body: website.google_tag_manager_body
    },
    pages: {
      aboutus: asBoolean(pages.aboutus),
      services: asBoolean(pages.services),
      recruit: asBoolean(pages.recruit),
      wantsell: asBoolean(pages.wantsell),
      team: asBoolean(pages.team),
      realestatedevelopment: asBoolean(pages.realestatedevelopment),
      agencies: asBoolean(pages.agencies),
      blog: asBoolean(pages.blogs)
    },
    bgimagetopo: {
      about: resolveSectionTopImage({
        env,
        agencyId,
        hash,
        optionId: website.options_website_image_quemsomos,
        websiteImage: website.website_image_quemsomos,
        adminImageName: adminImages.quemsomos
      }),
      services: resolveSectionTopImage({
        env,
        agencyId,
        hash,
        optionId: website.options_website_image_servicos,
        websiteImage: website.website_image_servicos,
        adminImageName: adminImages.servicos
      }),
      recruits: resolveSectionTopImage({
        env,
        agencyId,
        hash,
        optionId: website.options_website_image_recrutamento,
        websiteImage: website.website_image_recrutamento,
        adminImageName: adminImages.recrutamento
      }),
      wantsell: resolveSectionTopImage({
        env,
        agencyId,
        hash,
        optionId: website.options_website_image_querovender,
        websiteImage: website.website_image_querovender,
        adminImageName: adminImages.querovender
      }),
      imovs: resolveSectionTopImage({
        env,
        agencyId,
        hash,
        optionId: website.options_website_image_imoveis,
        websiteImage: website.website_image_imoveis,
        adminImageName: adminImages.imoveis
      }),
      team: resolveSectionTopImage({
        env,
        agencyId,
        hash,
        optionId: website.options_website_image_equipa,
        websiteImage: website.website_image_equipa,
        adminImageName: adminImages.equipa
      }),
      contacts: resolveSectionTopImage({
        env,
        agencyId,
        hash,
        optionId: website.options_website_image_contactos,
        websiteImage: website.website_image_contactos,
        adminImageName: adminImages.contactos
      }),
      empreendimentos: resolveSectionTopImage({
        env,
        agencyId,
        hash,
        optionId: website.options_website_image_empreendimentos,
        websiteImage: website.website_image_empreendimentos,
        adminImageName: adminImages.empreendimentos
      }),
      agency: resolveSectionTopImage({
        env,
        agencyId,
        hash,
        optionId: website.options_website_image_agency,
        websiteImage: website.website_image_agency,
        adminImageName: adminImages.agency
      }),
      blogs: resolveSectionTopImage({
        env,
        agencyId,
        hash,
        optionId: website.options_website_image_blogs,
        websiteImage: website.website_image_blogs,
        adminImageName: adminImages.blogs
      })
    },
    colors: {
      headerhomepage: {
        bg: asString(colors.headerhomepagebg),
        text: asString(colors.headerhomepagecolor)
      },
      homepagesearch: {
        bg: asString(colors.homepagesearchbg),
        text: asString(colors.homepagesearchcolor)
      },
      header: {
        bg: asString(colors.headerbg),
        text: asString(colors.headercolor)
      },
      mobilehomepage: {
        bg: asString(colors.mobilemenuhomepagebg),
        text: asString(colors.mobilemenuhomepagecolor)
      },
      mobilemain: {
        bg: asString(colors.mobilemenumainbg),
        text: asString(colors.mobilemenumaincolor)
      },
      footer: {
        bg: asString(colors.footerbg),
        text: asString(colors.footercolor)
      },
      buttons: {
        bg: asString(colors.buttonsbg),
        text: asString(colors.buttonscolor)
      },
      formcontactheader: {
        bg: asString(colors.formcontactheaderbg),
        text: asString(colors.formcontactheadercolor)
      },
      label: {
        new: {
          bg: asString(colors.label_new_bg),
          text: asString(colors.label_new_color)
        },
        highlights: {
          bg: asString(colors.label_highlights_bg),
          text: asString(colors.label_highlights_color)
        },
        lowprice: {
          bg: asString(colors.label_lowprice_bg),
          text: asString(colors.label_lowprice_color)
        },
        exclusive: {
          bg: asString(colors.label_exclusive_bg),
          text: asString(colors.label_exclusive_color)
        },
        sell: {
          bg: asString(colors.label_sell_bg),
          text: asString(colors.label_sell_color)
        },
        rent: {
          bg: asString(colors.label_rent_bg),
          text: asString(colors.label_rent_color)
        },
        reserved: {
          bg: asString(colors.label_reserved_bg),
          text: asString(colors.label_reserved_color)
        }
      }
    }
  }
}
