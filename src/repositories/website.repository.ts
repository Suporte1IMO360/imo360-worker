import type { RowDataPacket } from 'mysql2/promise'
import { getConnection } from '../utils/db'
import type { Bindings } from '../types/env'

type QueryParams = Array<string | number | null>

type WebsiteBaseRow = RowDataPacket & {
  id: number
  agencia_id: number
  contacto_concelho: number | null
  contacto_freguesia: number | null
  options_website_image_home: number | null
  options_website_image_quemsomos: number | null
  options_website_image_servicos: number | null
  options_website_image_recrutamento: number | null
  options_website_image_querovender: number | null
  options_website_image_imoveis: number | null
  options_website_image_agency: number | null
  options_website_image_equipa: number | null
  options_website_image_contactos: number | null
  options_website_image_empreendimentos: number | null
  options_website_image_blogs: number | null
  user_activated: number | null
  user_translate_en: number | null
  user_translate_es: number | null
  user_translate_fr: number | null
  user_translate_de: number | null
  user_template_id: number | null
  websiteimgsliders_count: number
}

type LocationRow = RowDataPacket & {
  concelho: string | null
  freguesia: string | null
}

type AdminImageRow = RowDataPacket & {
  home: string | null
  quemsomos: string | null
  servicos: string | null
  recrutamento: string | null
  querovender: string | null
  imoveis: string | null
  agency: string | null
  equipa: string | null
  contactos: string | null
  empreendimentos: string | null
  blogs: string | null
}

type PagesRow = RowDataPacket & {
  aboutus: number
  services: number
  recruit: number
  wantsell: number
  team: number
  realestatedevelopment: number
  agencies: number
  blogs: number
}

type ColorsRow = RowDataPacket & {
  headerhomepagecolor: string | null
  headerhomepagebg: string | null
  homepagesearchcolor: string | null
  homepagesearchbg: string | null
  headercolor: string | null
  headerbg: string | null
  mobilemenuhomepagecolor: string | null
  mobilemenuhomepagebg: string | null
  mobilemenumaincolor: string | null
  mobilemenumainbg: string | null
  footercolor: string | null
  footerbg: string | null
  buttonscolor: string | null
  buttonsbg: string | null
  formcontactheadercolor: string | null
  formcontactheaderbg: string | null
  label_new_color: string | null
  label_new_bg: string | null
  label_highlights_color: string | null
  label_highlights_bg: string | null
  label_lowprice_color: string | null
  label_lowprice_bg: string | null
  label_exclusive_color: string | null
  label_exclusive_bg: string | null
  label_sell_color: string | null
  label_sell_bg: string | null
  label_rent_color: string | null
  label_rent_bg: string | null
  label_reserved_color: string | null
  label_reserved_bg: string | null
}

export type WebsiteAggregate = {
  website: WebsiteBaseRow
  location: LocationRow
  adminImages: AdminImageRow
  pages: PagesRow
  colors: ColorsRow
}

async function querySingleRow<T extends RowDataPacket>(
  env: Bindings,
  sql: string,
  params: QueryParams
): Promise<T | null> {
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
    return rows[0] ?? null
  } finally {
    await connection.end()
  }
}

export async function findWebsiteAggregateByAgencyId(
  env: Bindings,
  agencyId: number,
  webpageIds: {
    ABOUTUS: number
    SERVICES: number
    RECRUIT: number
    WANTSELL: number
    TEAM: number
    REALESTATEDEVELOPMENT: number
    AGENCIES: number
    BLOGS: number
  }
): Promise<WebsiteAggregate | null> {
  const website = await querySingleRow<WebsiteBaseRow>(
    env,
    `
      SELECT
        w.*,
        COALESCE((SELECT activated FROM users u WHERE u.agencia_id = w.agencia_id LIMIT 1), 0) AS user_activated,
        COALESCE((SELECT translate_en FROM users u WHERE u.agencia_id = w.agencia_id LIMIT 1), 0) AS user_translate_en,
        COALESCE((SELECT translate_es FROM users u WHERE u.agencia_id = w.agencia_id LIMIT 1), 0) AS user_translate_es,
        COALESCE((SELECT translate_fr FROM users u WHERE u.agencia_id = w.agencia_id LIMIT 1), 0) AS user_translate_fr,
        COALESCE((SELECT translate_de FROM users u WHERE u.agencia_id = w.agencia_id LIMIT 1), 0) AS user_translate_de,
        (SELECT template_id FROM users u WHERE u.agencia_id = w.agencia_id LIMIT 1) AS user_template_id,
        (SELECT COUNT(*) FROM website_imgslider ws WHERE ws.website_id = w.id) AS websiteimgsliders_count
      FROM websites w
      WHERE w.agencia_id = ?
      LIMIT 1
    `,
    [agencyId]
  )

  if (!website) {
    return null
  }

  const location =
    (await querySingleRow<LocationRow>(
      env,
      `
        SELECT
          (SELECT name FROM concelhos WHERE id = ?) AS concelho,
          (SELECT name FROM freguesias WHERE id = ?) AS freguesia
      `,
      [website.contacto_concelho, website.contacto_freguesia]
    )) ?? ({ concelho: null, freguesia: null } as LocationRow)

  const adminImages =
    (await querySingleRow<AdminImageRow>(
      env,
      `
        SELECT
          (SELECT imagem FROM adminimagens WHERE id = ?) AS home,
          (SELECT imagem FROM adminimagens WHERE id = ?) AS quemsomos,
          (SELECT imagem FROM adminimagens WHERE id = ?) AS servicos,
          (SELECT imagem FROM adminimagens WHERE id = ?) AS recrutamento,
          (SELECT imagem FROM adminimagens WHERE id = ?) AS querovender,
          (SELECT imagem FROM adminimagens WHERE id = ?) AS imoveis,
          (SELECT imagem FROM adminimagens WHERE id = ?) AS agency,
          (SELECT imagem FROM adminimagens WHERE id = ?) AS equipa,
          (SELECT imagem FROM adminimagens WHERE id = ?) AS contactos,
          (SELECT imagem FROM adminimagens WHERE id = ?) AS empreendimentos,
          (SELECT imagem FROM adminimagens WHERE id = ?) AS blogs
      `,
      [
        website.options_website_image_home,
        website.options_website_image_quemsomos,
        website.options_website_image_servicos,
        website.options_website_image_recrutamento,
        website.options_website_image_querovender,
        website.options_website_image_imoveis,
        website.options_website_image_agency,
        website.options_website_image_equipa,
        website.options_website_image_contactos,
        website.options_website_image_empreendimentos,
        website.options_website_image_blogs
      ]
    )) ??
    ({
      home: null,
      quemsomos: null,
      servicos: null,
      recrutamento: null,
      querovender: null,
      imoveis: null,
      agency: null,
      equipa: null,
      contactos: null,
      empreendimentos: null,
      blogs: null
    } as AdminImageRow)

  const pages =
    (await querySingleRow<PagesRow>(
      env,
      `
        SELECT
          SUM(CASE WHEN webpage_id = ? AND active = 1 THEN 1 ELSE 0 END) AS aboutus,
          SUM(CASE WHEN webpage_id = ? AND active = 1 THEN 1 ELSE 0 END) AS services,
          SUM(CASE WHEN webpage_id = ? AND active = 1 THEN 1 ELSE 0 END) AS recruit,
          SUM(CASE WHEN webpage_id = ? AND active = 1 THEN 1 ELSE 0 END) AS wantsell,
          SUM(CASE WHEN webpage_id = ? AND active = 1 THEN 1 ELSE 0 END) AS team,
          SUM(CASE WHEN webpage_id = ? AND active = 1 THEN 1 ELSE 0 END) AS realestatedevelopment,
          SUM(CASE WHEN webpage_id = ? AND active = 1 THEN 1 ELSE 0 END) AS agencies,
          SUM(CASE WHEN webpage_id = ? AND active = 1 THEN 1 ELSE 0 END) AS blogs
        FROM website_webpage
        WHERE website_id = ?
      `,
      [
        webpageIds.ABOUTUS,
        webpageIds.SERVICES,
        webpageIds.RECRUIT,
        webpageIds.WANTSELL,
        webpageIds.TEAM,
        webpageIds.REALESTATEDEVELOPMENT,
        webpageIds.AGENCIES,
        webpageIds.BLOGS,
        website.id
      ]
    )) ??
    ({
      aboutus: 0,
      services: 0,
      recruit: 0,
      wantsell: 0,
      team: 0,
      realestatedevelopment: 0,
      agencies: 0,
      blogs: 0
    } as PagesRow)

  const colors =
    (await querySingleRow<ColorsRow>(
      env,
      `
        SELECT
          MAX(CASE WHEN wws.element = 'color' AND ws.type = 'header' AND ws.page = 'homepage' THEN wws.hexa END) AS headerhomepagecolor,
          MAX(CASE WHEN wws.element = 'background' AND ws.type = 'header' AND ws.page = 'homepage' THEN wws.hexa END) AS headerhomepagebg,
          MAX(CASE WHEN wws.element = 'color' AND ws.type = 'search' AND ws.page = 'homepage' THEN wws.hexa END) AS homepagesearchcolor,
          MAX(CASE WHEN wws.element = 'background' AND ws.type = 'search' AND ws.page = 'homepage' THEN wws.hexa END) AS homepagesearchbg,
          MAX(CASE WHEN wws.element = 'color' AND ws.type = 'header' AND ws.page = 'main' THEN wws.hexa END) AS headercolor,
          MAX(CASE WHEN wws.element = 'background' AND ws.type = 'header' AND ws.page = 'main' THEN wws.hexa END) AS headerbg,
          MAX(CASE WHEN wws.element = 'color' AND ws.type = 'mobile' AND ws.page = 'homepage' THEN wws.hexa END) AS mobilemenuhomepagecolor,
          MAX(CASE WHEN wws.element = 'background' AND ws.type = 'mobile' AND ws.page = 'homepage' THEN wws.hexa END) AS mobilemenuhomepagebg,
          MAX(CASE WHEN wws.element = 'color' AND ws.type = 'mobile' AND ws.page = 'main' THEN wws.hexa END) AS mobilemenumaincolor,
          MAX(CASE WHEN wws.element = 'background' AND ws.type = 'mobile' AND ws.page = 'main' THEN wws.hexa END) AS mobilemenumainbg,
          MAX(CASE WHEN wws.element = 'color' AND ws.type = 'footer' AND ws.page = 'main' THEN wws.hexa END) AS footercolor,
          MAX(CASE WHEN wws.element = 'background' AND ws.type = 'footer' AND ws.page = 'main' THEN wws.hexa END) AS footerbg,
          MAX(CASE WHEN wws.element = 'color' AND ws.type = 'buttons' AND ws.page = 'main' THEN wws.hexa END) AS buttonscolor,
          MAX(CASE WHEN wws.element = 'background' AND ws.type = 'buttons' AND ws.page = 'main' THEN wws.hexa END) AS buttonsbg,
          MAX(CASE WHEN wws.element = 'color' AND ws.type = 'contactheader' AND ws.page = 'imovel' THEN wws.hexa END) AS formcontactheadercolor,
          MAX(CASE WHEN wws.element = 'background' AND ws.type = 'contactheader' AND ws.page = 'imovel' THEN wws.hexa END) AS formcontactheaderbg,
          MAX(CASE WHEN wws.element = 'color' AND ws.type = 'labelnovidade' AND ws.page = 'main' THEN wws.hexa END) AS label_new_color,
          MAX(CASE WHEN wws.element = 'background' AND ws.type = 'labelnovidade' AND ws.page = 'main' THEN wws.hexa END) AS label_new_bg,
          MAX(CASE WHEN wws.element = 'color' AND ws.type = 'labeldestaque' AND ws.page = 'main' THEN wws.hexa END) AS label_highlights_color,
          MAX(CASE WHEN wws.element = 'background' AND ws.type = 'labeldestaque' AND ws.page = 'main' THEN wws.hexa END) AS label_highlights_bg,
          MAX(CASE WHEN wws.element = 'color' AND ws.type = 'labelbaixapreco' AND ws.page = 'main' THEN wws.hexa END) AS label_lowprice_color,
          MAX(CASE WHEN wws.element = 'background' AND ws.type = 'labelbaixapreco' AND ws.page = 'main' THEN wws.hexa END) AS label_lowprice_bg,
          MAX(CASE WHEN wws.element = 'color' AND ws.type = 'labelexclusivo' AND ws.page = 'main' THEN wws.hexa END) AS label_exclusive_color,
          MAX(CASE WHEN wws.element = 'background' AND ws.type = 'labelexclusivo' AND ws.page = 'main' THEN wws.hexa END) AS label_exclusive_bg,
          MAX(CASE WHEN wws.element = 'color' AND ws.type = 'labelvendido' AND ws.page = 'main' THEN wws.hexa END) AS label_sell_color,
          MAX(CASE WHEN wws.element = 'background' AND ws.type = 'labelvendido' AND ws.page = 'main' THEN wws.hexa END) AS label_sell_bg,
          MAX(CASE WHEN wws.element = 'color' AND ws.type = 'labelarrendado' AND ws.page = 'main' THEN wws.hexa END) AS label_rent_color,
          MAX(CASE WHEN wws.element = 'background' AND ws.type = 'labelarrendado' AND ws.page = 'main' THEN wws.hexa END) AS label_rent_bg,
          MAX(CASE WHEN wws.element = 'color' AND ws.type = 'labelreservado' AND ws.page = 'main' THEN wws.hexa END) AS label_reserved_color,
          MAX(CASE WHEN wws.element = 'background' AND ws.type = 'labelreservado' AND ws.page = 'main' THEN wws.hexa END) AS label_reserved_bg
        FROM website_webstructure wws
        JOIN webstructure ws ON ws.id = wws.webstructure_id
        WHERE wws.website_id = ?
      `,
      [website.id]
    )) ??
    ({
      headerhomepagecolor: null,
      headerhomepagebg: null,
      homepagesearchcolor: null,
      homepagesearchbg: null,
      headercolor: null,
      headerbg: null,
      mobilemenuhomepagecolor: null,
      mobilemenuhomepagebg: null,
      mobilemenumaincolor: null,
      mobilemenumainbg: null,
      footercolor: null,
      footerbg: null,
      buttonscolor: null,
      buttonsbg: null,
      formcontactheadercolor: null,
      formcontactheaderbg: null,
      label_new_color: null,
      label_new_bg: null,
      label_highlights_color: null,
      label_highlights_bg: null,
      label_lowprice_color: null,
      label_lowprice_bg: null,
      label_exclusive_color: null,
      label_exclusive_bg: null,
      label_sell_color: null,
      label_sell_bg: null,
      label_rent_color: null,
      label_rent_bg: null,
      label_reserved_color: null,
      label_reserved_bg: null
    } as ColorsRow)

  return {
    website,
    location,
    adminImages,
    pages,
    colors
  }
}
