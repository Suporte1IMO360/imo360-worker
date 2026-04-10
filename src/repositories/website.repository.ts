import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise'
import { getConnection } from '../utils/db'
import type { Bindings } from '../types/env'

type QueryParams = Array<string | number | null>

function placeholders(values: unknown[]): string {
  return values.map(() => '?').join(', ')
}

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

export type HomepageBlockRow = RowDataPacket & {
  selection: number
  img: string | null
  admin_image_imagem: string | null
  text_pt: string | null
  text_en: string | null
  text_es: string | null
  text_fr: string | null
  text_de: string | null
  bt_pt: string | null
  bt_en: string | null
  bt_es: string | null
  bt_fr: string | null
  bt_de: string | null
  link_pt: string | null
  link_en: string | null
  link_es: string | null
  link_fr: string | null
  link_de: string | null
}

export type AboutBlockRow = RowDataPacket & {
  video_url: string | null
  description: string | null
  image: string | null
}

export type WebsiteServiceRow = RowDataPacket & {
  title: string | null
  description: string | null
}

export type WebsiteContactsRow = RowDataPacket & {
  id: number
  agencia_id: number
  contacto_telemovel: string | null
  contacto_telefone: string | null
  show_contacto_email: number | null
  contacto_email: string | null
  latitude: string | null
  longitude: string | null
  contacto_morada: string | null
  contacto_concelho: number | null
  contacto_codpostal: string | null
  localidade: string | null
  contacto_horario: string | null
  contacto_horario2: string | null
  contacto_horario3: string | null
  contacto_horario4: string | null
  contacto_manha_inicio: string | null
  contacto_manha_inicio2: string | null
  contacto_manha_fim: string | null
  contacto_manha_fim2: string | null
  contacto_tarde_inicio: string | null
  contacto_tarde_inicio2: string | null
  contacto_tarde_fim: string | null
  contacto_tarde_fim2: string | null
  contacto_concelho_name: string | null
}

export type WebsiteCustomModalRow = RowDataPacket & {
  title: string | null
  description: string | null
  image: string | null
  text_button: string | null
  url: string | null
}

export type WebsiteSliderRow = RowDataPacket & {
  img: string | null
  option_img_home: number | null
  admin_image_imagem: string | null
}

export type TeamMemberRow = RowDataPacket & {
  id: number
  agencia_id: number
  email: string | null
  foto: string | null
  name: string | null
  telemovel: string | null
  user_website_title: string | null
  public_image: number | null
  whatsapp_number: string | null
  facebook: string | null
  instagram: string | null
  linkedin: string | null
  group_id: number | null
  activated: number | null
  group_name: string | null
  ocultarDadosConsultor: number | null
  imovelcolaboradores_count: number
}

export type TeamConsultantRow = RowDataPacket & {
  id: number
  agencia_id: number
  foto: string | null
  group_id: number | null
  email: string | null
  name: string | null
  telemovel: string | null
  telefone: string | null
  user_website_title: string | null
  apresentacao: string | null
  public_image: number | null
  facebook: string | null
  instagram: string | null
  linkedin: string | null
  whatsapp_number: string | null
  activated: number | null
  group_name: string | null
  ocultarDadosConsultor: number | null
  website_contacto_telefone: string | null
  agency_user_email: string | null
  agency_user_telefone: string | null
  agency_user_telemovel: string | null
  imovelcolaboradores_count: number
}

export type EmpreendimentoSearchRow = RowDataPacket & {
  id: number
  agencia_id: number
  image: string | null
  imagepath: string | null
  title_pt: string | null
  title_en: string | null
  title_es: string | null
  title_fr: string | null
  title_de: string | null
  concelho_id: number | null
  freguesia_id: number | null
  concelho_name: string | null
  freguesia_name: string | null
  imovs_count: number
}

export type EmpreendimentoDetailRow = RowDataPacket & {
  id: number
  agencia_id: number
  image: string | null
  imagepath: string | null
  morada: string | null
  online_street: number | null
  longitude: string | null
  latitude: string | null
  distrito_id: number | null
  concelho_id: number | null
  freguesia_id: number | null
  distrito_name: string | null
  concelho_name: string | null
  freguesia_name: string | null
  title_pt: string | null
  title_en: string | null
  title_es: string | null
  title_fr: string | null
  title_de: string | null
  description_pt: string | null
  description_en: string | null
  description_es: string | null
  description_fr: string | null
  description_de: string | null
  typereferenceimovs: number | null
}

export type EmpreendimentoDetailImovRow = RowDataPacket & {
  id: number
  slug: string | null
  ref: string | null
  refinterna: string | null
  ref_secundary: string | null
  valor: string | null
  valor_site: number | null
  online: number | null
  area_util_det: string | null
  imovdisp_name: string | null
  imovdisp_pt: string | null
  imovdisp_en: string | null
  imovdisp_es: string | null
  imovdisp_fr: string | null
  imovdisp_de: string | null
  imovnature_pt: string | null
  imovnature_en: string | null
  imovnature_es: string | null
  imovnature_fr: string | null
  imovnature_de: string | null
  imovtn_pt: string | null
  imovtn_en: string | null
  imovtn_es: string | null
  imovtn_fr: string | null
  imovtn_de: string | null
}

type EmpreendimentoSearchCountRow = RowDataPacket & {
  total: number
}

export type EmpreendimentoDistritoRow = RowDataPacket & {
  id: number
  name: string | null
}

export type CategoryRow = RowDataPacket & {
  id: number
  title: string | null
}

export type ArticleSearchRow = RowDataPacket & {
  id: number
  title_pt: string | null
  title_en: string | null
  title_es: string | null
  title_fr: string | null
  title_de: string | null
  content_pt: string | null
  content_en: string | null
  content_es: string | null
  content_fr: string | null
  content_de: string | null
  subcontent_pt: string | null
  subcontent_en: string | null
  subcontent_es: string | null
  subcontent_fr: string | null
  subcontent_de: string | null
  seotitle_pt: string | null
  seotitle_en: string | null
  seotitle_es: string | null
  seotitle_fr: string | null
  seotitle_de: string | null
  seolink_pt: string | null
  seolink_en: string | null
  seolink_es: string | null
  seolink_fr: string | null
  seolink_de: string | null
  seodescription_pt: string | null
  seodescription_en: string | null
  seodescription_es: string | null
  seodescription_fr: string | null
  seodescription_de: string | null
  image: string | null
  imagepath: string | null
  created_at: string | null
}

type EmpreendimentoAgencyRow = RowDataPacket & {
  id: number
  agencia_id: number
}

type LeadMaxRow = RowDataPacket & {
  maxNumLead: number | null
}

type ArticleSearchCountRow = RowDataPacket & {
  total: number
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

async function executeStatement(
  env: Bindings,
  sql: string,
  params: QueryParams
): Promise<ResultSetHeader> {
  const connection = await getConnection(env)

  try {
    const client = connection as unknown as {
      execute?: (statement: string, values: QueryParams) => Promise<[ResultSetHeader]>
      query?: (statement: string, values: QueryParams) => Promise<[ResultSetHeader]>
    }

    const run = client.query ?? client.execute

    if (!run) {
      throw new Error('Unsupported MySQL connection client')
    }

    const [result] = await run.call(client, sql, params)
    return result
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

export async function findHomepageBlocksByAgencyId(
  env: Bindings,
  agencyId: number
): Promise<HomepageBlockRow[]> {
  return queryRows<HomepageBlockRow>(
    env,
    `
      SELECT
        wh.selection,
        wh.img,
        wh.text_pt,
        wh.text_en,
        wh.text_es,
        wh.text_fr,
        wh.text_de,
        wh.bt_pt,
        wh.bt_en,
        wh.bt_es,
        wh.bt_fr,
        wh.bt_de,
        wh.link_pt,
        wh.link_en,
        wh.link_es,
        wh.link_fr,
        wh.link_de,
        ai.imagem AS admin_image_imagem
      FROM website_homepage wh
      JOIN websites w ON w.id = wh.website_id
      LEFT JOIN adminimagens ai ON ai.id = wh.img
      WHERE wh.online = 1
        AND w.agencia_id = ?
      ORDER BY wh.bloco ASC
    `,
    [agencyId]
  )
}

export async function findAboutBlockByAgencyIdAndLang(
  env: Bindings,
  agencyId: number,
  lang: string
): Promise<AboutBlockRow | null> {
  return querySingleRow<AboutBlockRow>(
    env,
    `
      SELECT
        wab.video_url,
        wab.description,
        wab.image
      FROM website_about_blocks wab
      JOIN websites w ON w.id = wab.website_id
      WHERE w.agencia_id = ?
        AND wab.lang = ?
      ORDER BY wab.\`order\` ASC, wab.id ASC
      LIMIT 1
    `,
    [agencyId, lang]
  )
}

export async function findWebsiteServicesByAgencyIdAndLang(
  env: Bindings,
  agencyId: number,
  lang: string
): Promise<WebsiteServiceRow[]> {
  return queryRows<WebsiteServiceRow>(
    env,
    `
      SELECT
        ws.titulo AS title,
        ws.texto AS description
      FROM website_services ws
      WHERE ws.website_id IN (
        SELECT w.id
        FROM websites w
        WHERE w.agencia_id = ?
      )
        AND ws.language = ?
        AND ws.ativos = 1
      ORDER BY ws.id ASC
    `,
    [agencyId, lang]
  )
}

export async function findWebsiteContactsByAgencyId(
  env: Bindings,
  agencyId: number
): Promise<WebsiteContactsRow | null> {
  return querySingleRow<WebsiteContactsRow>(
    env,
    `
      SELECT
        w.id,
        w.agencia_id,
        w.contacto_telemovel,
        w.contacto_telefone,
        w.show_contacto_email,
        w.contacto_email,
        w.latitude,
        w.longitude,
        w.contacto_morada,
        w.contacto_concelho,
        w.contacto_codpostal,
        w.localidade,
        w.contacto_horario,
        w.contacto_horario2,
        w.contacto_horario3,
        w.contacto_horario4,
        w.contacto_manha_inicio,
        w.contacto_manha_inicio2,
        w.contacto_manha_fim,
        w.contacto_manha_fim2,
        w.contacto_tarde_inicio,
        w.contacto_tarde_inicio2,
        w.contacto_tarde_fim,
        w.contacto_tarde_fim2,
        (SELECT c.name FROM concelhos c WHERE c.id = w.contacto_concelho LIMIT 1) AS contacto_concelho_name
      FROM websites w
      WHERE w.agencia_id = ?
      LIMIT 1
    `,
    [agencyId]
  )
}

export async function findWebsiteCustomModalByAgencyIdAndLang(
  env: Bindings,
  agencyId: number,
  lang: 'pt' | 'en' | 'es' | 'fr' | 'de'
): Promise<WebsiteCustomModalRow | null> {
  return querySingleRow<WebsiteCustomModalRow>(
    env,
    `
      SELECT
        m.title,
        m.description,
        m.image,
        m.text_button,
        m.url
      FROM websites w
      INNER JOIN website_custom_modals m ON m.website_id = w.id
      WHERE w.agencia_id = ?
        AND m.language = ?
      LIMIT 1
    `,
    [agencyId, lang]
  )
}

export async function findWebsiteSlidersByAgencyId(
  env: Bindings,
  agencyId: number
): Promise<WebsiteSliderRow[]> {
  return queryRows<WebsiteSliderRow>(
    env,
    `
      SELECT
        ws.img,
        ws.option_img_home,
        ai.imagem AS admin_image_imagem
      FROM websites w
      INNER JOIN website_imgslider ws ON ws.website_id = w.id
      LEFT JOIN adminimagens ai ON ai.id = ws.option_img_home
      WHERE w.agencia_id = ?
        AND (
          (ws.img IS NOT NULL AND ws.option_img_home = 0)
          OR (ws.img IS NULL AND ws.option_img_home NOT IN (-1, 0))
        )
      ORDER BY ws.ordem ASC
    `,
    [agencyId]
  )
}

export async function findConsultantRealestateTranslation(
  env: Bindings,
  locale: 'pt' | 'en' | 'es' | 'fr' | 'de'
): Promise<string | null> {
  const row = await querySingleRow<RowDataPacket & { value: string | null }>(
    env,
    `
      SELECT t.value
      FROM translations t
      WHERE t.locale = ?
        AND t.key = 'Consultant_realestate'
        AND t.\`group\` = 'app'
      LIMIT 1
    `,
    [locale]
  )

  return row?.value ?? null
}

export async function findTeamMembersByAgencyIds(
  env: Bindings,
  agencyIds: number[],
  options: {
    text?: string
    sort?: 0 | 1
    page: number
    perPage: number
  }
): Promise<{ rows: TeamMemberRow[]; total: number }> {
  if (agencyIds.length === 0) {
    return { rows: [], total: 0 }
  }

  const scopeSql = placeholders(agencyIds)
  const where: string[] = [
    `u.agencia_id IN (${scopeSql})`,
    `u.activated = 1`,
    `u.show_user_website = 1`,
    `u.deleted_at IS NULL`,
    `u.group_id IN (SELECT g.id FROM groups g WHERE LOWER(g.name) IN ('consultor', 'coordenador', 'consultant', 'coordinator'))`
  ]
  const params: QueryParams = [...agencyIds]

  if (options.text && options.text.trim() !== '') {
    where.push('u.name LIKE ?')
    params.push(`%${options.text.trim()}%`)
  }

  const whereSql = where.join('\n      AND ')

  const totalRows = await queryRows<RowDataPacket & { total: number }>(
    env,
    `
      SELECT COUNT(*) AS total
      FROM users u
      WHERE ${whereSql}
    `,
    params
  )

  const total = Number(totalRows[0]?.total || 0)
  const sortSql = options.sort === 1 ? 'DESC' : 'ASC'
  const safePage = Math.max(1, options.page)
  const safePerPage = Math.max(1, options.perPage)
  const offset = (safePage - 1) * safePerPage

  const rows = await queryRows<TeamMemberRow>(
    env,
    `
      SELECT
        u.id,
        u.agencia_id,
        u.email,
        u.foto,
        u.name,
        u.telemovel,
        u.user_website_title,
        u.public_image,
        u.whatsapp_number,
        u.facebook,
        u.instagram,
        u.linkedin,
        u.group_id,
        u.activated,
        g.name AS group_name,
        w.ocultarDadosConsultor,
        (
          SELECT COUNT(*)
          FROM imovs i
          WHERE i.colaborador_id = u.id
            AND i.online = 1
            AND i.deleted_at IS NULL
        ) AS imovelcolaboradores_count
      FROM users u
      LEFT JOIN websites w ON w.agencia_id = u.agencia_id
      LEFT JOIN groups g ON g.id = u.group_id
      WHERE ${whereSql}
      ORDER BY u.name ${sortSql}
      LIMIT ? OFFSET ?
    `,
    [...params, safePerPage, offset]
  )

  return { rows, total }
}

export async function findTeamHomepageMembersByAgencyIds(
  env: Bindings,
  agencyIds: number[],
  options: {
    text?: string
    sort?: 0 | 1
  }
): Promise<TeamMemberRow[]> {
  if (agencyIds.length === 0) {
    return []
  }

  const scopeSql = placeholders(agencyIds)
  const where: string[] = [
    `u.agencia_id IN (${scopeSql})`,
    `u.activated = 1`,
    `u.show_user_website = 1`,
    `u.deleted_at IS NULL`,
    `u.group_id IN (SELECT g.id FROM groups g WHERE LOWER(g.name) IN ('consultor', 'coordenador', 'consultant', 'coordinator'))`
  ]
  const params: QueryParams = [...agencyIds]

  if (options.text && options.text.trim() !== '') {
    where.push('u.name LIKE ?')
    params.push(`%${options.text.trim()}%`)
  }

  const whereSql = where.join('\n      AND ')
  const sortSql = options.sort === 1 ? 'DESC' : 'ASC'

  return queryRows<TeamMemberRow>(
    env,
    `
      SELECT
        u.id,
        u.agencia_id,
        u.email,
        u.foto,
        u.name,
        u.telemovel,
        u.user_website_title,
        u.public_image,
        u.whatsapp_number,
        u.facebook,
        u.instagram,
        u.linkedin,
        u.group_id,
        u.activated,
        g.name AS group_name,
        w.ocultarDadosConsultor,
        (
          SELECT COUNT(*)
          FROM imovs i
          WHERE i.colaborador_id = u.id
            AND i.online = 1
            AND i.deleted_at IS NULL
        ) AS imovelcolaboradores_count
      FROM users u
      LEFT JOIN websites w ON w.agencia_id = u.agencia_id
      LEFT JOIN groups g ON g.id = u.group_id
      WHERE ${whereSql}
      ORDER BY u.name ${sortSql}
    `,
    params
  )
}

export async function findTeamConsultantByAgencyIdsAndUserId(
  env: Bindings,
  agencyIds: number[],
  userId: number
): Promise<TeamConsultantRow | null> {
  if (agencyIds.length === 0) {
    return null
  }

  const scopeSql = placeholders(agencyIds)

  return querySingleRow<TeamConsultantRow>(
    env,
    `
      SELECT
        u.id,
        u.agencia_id,
        u.foto,
        u.group_id,
        u.email,
        u.name,
        u.telemovel,
        u.telefone,
        u.user_website_title,
        u.apresentacao,
        u.public_image,
        u.facebook,
        u.instagram,
        u.linkedin,
        u.whatsapp_number,
        u.activated,
        g.name AS group_name,
        w.ocultarDadosConsultor,
        w.contacto_telefone AS website_contacto_telefone,
        au.email AS agency_user_email,
        au.telefone AS agency_user_telefone,
        au.telemovel AS agency_user_telemovel,
        0 AS imovelcolaboradores_count
      FROM users u
      LEFT JOIN groups g ON g.id = u.group_id
      LEFT JOIN websites w ON w.agencia_id = u.agencia_id
      LEFT JOIN users au ON au.id = u.agencia_id
      WHERE u.agencia_id IN (${scopeSql})
        AND u.id = ?
      LIMIT 1
    `,
    [...agencyIds, userId]
  )
}

export async function searchEmpreendimentosRows(
  env: Bindings,
  filters: {
    scopeIds: number[]
    distritoId?: number
    concelhoId?: number
    freguesiaId?: number
    text?: string
    sort?: number
    page: number
    perPage: number
  }
): Promise<{ rows: EmpreendimentoSearchRow[]; total: number }> {
  if (filters.scopeIds.length === 0) {
    return { rows: [], total: 0 }
  }

  const scopeSql = placeholders(filters.scopeIds)
  const where: string[] = [
    `e.agencia_id IN (${scopeSql})`,
    'e.online = 1'
  ]
  const params: QueryParams = [...filters.scopeIds]

  if (filters.distritoId) {
    where.push('e.distrito_id = ?')
    params.push(filters.distritoId)
  }

  if (filters.concelhoId) {
    where.push('e.concelho_id = ?')
    params.push(filters.concelhoId)
  }

  if (filters.freguesiaId) {
    where.push('e.freguesia_id = ?')
    params.push(filters.freguesiaId)
  }

  if (filters.text && filters.text.trim() !== '') {
    where.push(`(
      EXISTS (
        SELECT 1
        FROM empreendimento_infos ei_t
        WHERE ei_t.empreendimento_id = e.id
          AND ei_t.title_pt LIKE ?
      )
      OR EXISTS (
        SELECT 1
        FROM imovs i_t
        WHERE i_t.empreendimento_id = e.id
          AND (
            i_t.ref LIKE ?
            OR i_t.refinterna LIKE ?
            OR i_t.ref_secundary LIKE ?
          )
      )
    )`)
    const query = `%${filters.text.trim()}%`
    params.push(query, query, query, query)
  }

  const whereSql = where.length > 0 ? `WHERE ${where.join('\n      AND ')}` : ''

  let orderBySql = 'ORDER BY e.updated_at DESC'

  switch (filters.sort) {
    case 0:
      orderBySql = 'ORDER BY e.created_at DESC'
      break
    case 1:
      orderBySql = 'ORDER BY e.created_at ASC'
      break
    case 2:
      orderBySql = 'ORDER BY e.updated_at DESC'
      break
    case 3:
      orderBySql = 'ORDER BY e.updated_at ASC'
      break
    default:
      break
  }

  const fromSql = `
    FROM empreendimentos e
    LEFT JOIN empreendimento_infos ei ON ei.empreendimento_id = e.id
    LEFT JOIN concelhos co ON co.id = e.concelho_id
    LEFT JOIN freguesias fr ON fr.id = e.freguesia_id
    ${whereSql}
  `

  const countSql = `
    SELECT COUNT(DISTINCT e.id) AS total
    ${fromSql}
  `

  const countRows = await queryRows<EmpreendimentoSearchCountRow>(env, countSql, params)
  const total = Number(countRows[0]?.total || 0)

  const safePage = Math.max(1, filters.page)
  const safePerPage = Math.max(1, filters.perPage)
  const offset = (safePage - 1) * safePerPage

  const dataSql = `
    SELECT
      e.id,
      e.agencia_id,
      e.image,
      e.imagepath,
      ei.title_pt,
      ei.title_en,
      ei.title_es,
      ei.title_fr,
      ei.title_de,
      e.concelho_id,
      e.freguesia_id,
      co.name AS concelho_name,
      fr.name AS freguesia_name,
      (
        SELECT COUNT(*)
        FROM imovs i
        WHERE i.empreendimento_id = e.id
          AND i.deleted_at IS NULL
      ) AS imovs_count
    ${fromSql}
    GROUP BY e.id
    ${orderBySql}
    LIMIT ? OFFSET ?
  `

  const rows = await queryRows<EmpreendimentoSearchRow>(env, dataSql, [...params, safePerPage, offset])

  return { rows, total }
}

export async function findEmpreendimentosDistritosByAgencyIds(
  env: Bindings,
  agencyIds: number[]
): Promise<EmpreendimentoDistritoRow[]> {
  if (agencyIds.length === 0) {
    return []
  }

  const scopeSql = placeholders(agencyIds)

  return queryRows<EmpreendimentoDistritoRow>(
    env,
    `
      SELECT d.id, d.name
      FROM distritos d
      WHERE d.id IN (
        SELECT e.distrito_id
        FROM empreendimentos e
        WHERE e.agencia_id IN (${scopeSql})
          AND e.online = 1
          AND e.distrito_id IS NOT NULL
      )
      ORDER BY d.name ASC, d.id ASC
    `,
    agencyIds
  )
}

export async function findEmpreendimentosConcelhosByAgencyIds(
  env: Bindings,
  agencyIds: number[],
  distritoId?: number
): Promise<EmpreendimentoDistritoRow[]> {
  if (agencyIds.length === 0) {
    return []
  }

  const scopeSql = placeholders(agencyIds)
  const params: QueryParams = [...agencyIds]
  let distritoSql = ''

  if (distritoId) {
    distritoSql = 'AND e.distrito_id = ?'
    params.push(distritoId)
  }

  return queryRows<EmpreendimentoDistritoRow>(
    env,
    `
      SELECT c.id, c.name
      FROM concelhos c
      WHERE c.id IN (
        SELECT e.concelho_id
        FROM empreendimentos e
        WHERE e.agencia_id IN (${scopeSql})
          AND e.online = 1
          AND e.concelho_id IS NOT NULL
          ${distritoSql}
      )
      ORDER BY c.name ASC, c.id ASC
    `,
    params
  )
}

export async function findEmpreendimentosFreguesiasByAgencyIds(
  env: Bindings,
  agencyIds: number[],
  concelhoId?: number
): Promise<EmpreendimentoDistritoRow[]> {
  if (agencyIds.length === 0) {
    return []
  }

  const scopeSql = placeholders(agencyIds)
  const params: QueryParams = [...agencyIds]
  let concelhoSql = ''

  if (concelhoId) {
    concelhoSql = 'AND e.concelho_id = ?'
    params.push(concelhoId)
  }

  return queryRows<EmpreendimentoDistritoRow>(
    env,
    `
      SELECT f.id, f.name
      FROM freguesias f
      WHERE f.id IN (
        SELECT e.freguesia_id
        FROM empreendimentos e
        WHERE e.agencia_id IN (${scopeSql})
          AND e.online = 1
          AND e.freguesia_id IS NOT NULL
          ${concelhoSql}
      )
      ORDER BY f.name ASC, f.id ASC
    `,
    params
  )
}

export async function findEmpreendimentoDetailById(
  env: Bindings,
  empreendimentoId: number
): Promise<EmpreendimentoDetailRow | null> {
  return querySingleRow<EmpreendimentoDetailRow>(
    env,
    `
      SELECT
        e.id,
        e.agencia_id,
        e.image,
        e.imagepath,
        e.morada,
        e.online_street,
        e.longitude,
        e.latitude,
        e.distrito_id,
        e.concelho_id,
        e.freguesia_id,
        d.name AS distrito_name,
        co.name AS concelho_name,
        fr.name AS freguesia_name,
        ei.title_pt,
        ei.title_en,
        ei.title_es,
        ei.title_fr,
        ei.title_de,
        ei.description_pt,
        ei.description_en,
        ei.description_es,
        ei.description_fr,
        ei.description_de,
        ag.typereferenceimovs
      FROM empreendimentos e
      LEFT JOIN empreendimento_infos ei ON ei.empreendimento_id = e.id
      LEFT JOIN distritos d ON d.id = e.distrito_id
      LEFT JOIN concelhos co ON co.id = e.concelho_id
      LEFT JOIN freguesias fr ON fr.id = e.freguesia_id
      LEFT JOIN users ag ON ag.id = e.agencia_id
      WHERE e.id = ?
      LIMIT 1
    `,
    [empreendimentoId]
  )
}

export async function findEmpreendimentoImovsByEmpreendimentoId(
  env: Bindings,
  empreendimentoId: number
): Promise<EmpreendimentoDetailImovRow[]> {
  return queryRows<EmpreendimentoDetailImovRow>(
    env,
    `
      SELECT
        i.id,
        i.slug,
        i.ref,
        i.refinterna,
        i.ref_secundary,
        i.valor,
        i.valor_site,
        i.online,
        ia.area_util_det,
        d.name AS imovdisp_name,
        d.pt AS imovdisp_pt,
        d.en AS imovdisp_en,
        d.es AS imovdisp_es,
        d.fr AS imovdisp_fr,
        d.de AS imovdisp_de,
        n.pt AS imovnature_pt,
        n.en AS imovnature_en,
        n.es AS imovnature_es,
        n.fr AS imovnature_fr,
        n.de AS imovnature_de,
        t.pt AS imovtn_pt,
        t.en AS imovtn_en,
        t.es AS imovtn_es,
        t.fr AS imovtn_fr,
        t.de AS imovtn_de
      FROM imovs i
      LEFT JOIN imovareas ia ON ia.imov_id = i.id
      LEFT JOIN imovdisps d ON d.id = i.imovdisp_id
      LEFT JOIN imovnatures n ON n.id = i.imovnature_id
      LEFT JOIN imovtns t ON t.id = i.imovtn_id
      WHERE i.empreendimento_id = ?
        AND i.deleted_at IS NULL
      ORDER BY i.id DESC
    `,
    [empreendimentoId]
  )
}

export async function findEmpreendimentoAgencyById(
  env: Bindings,
  empreendimentoId: number
): Promise<EmpreendimentoAgencyRow | null> {
  return querySingleRow<EmpreendimentoAgencyRow>(
    env,
    `
      SELECT e.id, e.agencia_id
      FROM empreendimentos e
      WHERE e.id = ?
      LIMIT 1
    `,
    [empreendimentoId]
  )
}

export async function findMaxLeadNumByAgencyId(env: Bindings, agenciaId: number): Promise<number> {
  const row = await querySingleRow<LeadMaxRow>(
    env,
    `
      SELECT MAX(l.numLead) AS maxNumLead
      FROM leads l
      WHERE l.agencia_id = ?
    `,
    [agenciaId]
  )

  return Number(row?.maxNumLead || 0)
}

export async function createEmpreendimentoLead(
  env: Bindings,
  input: {
    numLead: number
    data_inicio: string
    hora_inicio: string
    mensagem_lead: string | null
    email_lead: string | null
    contacto_lead: string | null
    pessoa_lead: string | null
    agencia_id: number
  }
): Promise<number> {
  const result = await executeStatement(
    env,
    `
      INSERT INTO leads (
        numLead,
        data_inicio,
        hora_inicio,
        imovorisub_id,
        mensagem_lead,
        email_lead,
        contacto_lead,
        pessoa_lead,
        agencia_id,
        colaborador_id,
        comprar,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, 29, ?, ?, ?, ?, ?, NULL, 1, NOW(), NOW())
    `,
    [
      input.numLead,
      input.data_inicio,
      input.hora_inicio,
      input.mensagem_lead,
      input.email_lead,
      input.contacto_lead,
      input.pessoa_lead,
      input.agencia_id
    ]
  )

  return Number(result.insertId || 0)
}

export async function findCategoriesByUserIdsAndLang(
  env: Bindings,
  userIds: number[],
  lang: 'pt' | 'en' | 'es' | 'fr' | 'de'
): Promise<CategoryRow[]> {
  if (userIds.length === 0) {
    return []
  }

  const scopeSql = placeholders(userIds)
  const langColumn =
    lang === 'en'
      ? 'c.title_en'
      : lang === 'es'
        ? 'c.title_es'
        : lang === 'fr'
          ? 'c.title_fr'
          : lang === 'de'
            ? 'c.title_de'
            : 'c.title_pt'

  return queryRows<CategoryRow>(
    env,
    `
      SELECT c.id, ${langColumn} AS title
      FROM categories c
      WHERE c.user_id IN (${scopeSql})
        AND c.active = 1
      ORDER BY ${langColumn} ASC
    `,
    userIds
  )
}

export async function searchArticlesByAgencyIds(
  env: Bindings,
  filters: {
    scopeIds: number[]
    categoryId?: number
    page: number
    perPage: number
  }
): Promise<{ rows: ArticleSearchRow[]; total: number }> {
  if (filters.scopeIds.length === 0) {
    return { rows: [], total: 0 }
  }

  const scopeSql = placeholders(filters.scopeIds)
  const where: string[] = [`a.agencia_id IN (${scopeSql})`, 'a.online = 1']
  const params: QueryParams = [...filters.scopeIds]

  if (filters.categoryId) {
    where.push('a.categories_id = ?')
    params.push(filters.categoryId)
  }

  const whereSql = `WHERE ${where.join('\n      AND ')}`

  const countSql = `
    SELECT COUNT(*) AS total
    FROM articles a
    ${whereSql}
  `

  const countRows = await queryRows<ArticleSearchCountRow>(env, countSql, params)
  const total = Number(countRows[0]?.total || 0)

  const safePage = Math.max(1, filters.page)
  const safePerPage = Math.max(1, filters.perPage)
  const offset = (safePage - 1) * safePerPage

  const dataSql = `
    SELECT
      a.id,
      a.title_pt,
      a.title_en,
      a.title_es,
      a.title_fr,
      a.title_de,
      a.content_pt,
      a.content_en,
      a.content_es,
      a.content_fr,
      a.content_de,
      a.subcontent_pt,
      a.subcontent_en,
      a.subcontent_es,
      a.subcontent_fr,
      a.subcontent_de,
      a.seotitle_pt,
      a.seotitle_en,
      a.seotitle_es,
      a.seotitle_fr,
      a.seotitle_de,
      a.seolink_pt,
      a.seolink_en,
      a.seolink_es,
      a.seolink_fr,
      a.seolink_de,
      a.seodescription_pt,
      a.seodescription_en,
      a.seodescription_es,
      a.seodescription_fr,
      a.seodescription_de,
      a.image,
      a.imagepath,
      a.created_at
    FROM articles a
    ${whereSql}
    ORDER BY a.id DESC
    LIMIT ? OFFSET ?
  `

  const rows = await queryRows<ArticleSearchRow>(env, dataSql, [...params, safePerPage, offset])

  return { rows, total }
}

export async function findArticleById(env: Bindings, articleId: number): Promise<ArticleSearchRow | null> {
  return querySingleRow<ArticleSearchRow>(
    env,
    `
      SELECT
        a.id,
        a.title_pt,
        a.title_en,
        a.title_es,
        a.title_fr,
        a.title_de,
        a.content_pt,
        a.content_en,
        a.content_es,
        a.content_fr,
        a.content_de,
        a.subcontent_pt,
        a.subcontent_en,
        a.subcontent_es,
        a.subcontent_fr,
        a.subcontent_de,
        a.seotitle_pt,
        a.seotitle_en,
        a.seotitle_es,
        a.seotitle_fr,
        a.seotitle_de,
        a.seolink_pt,
        a.seolink_en,
        a.seolink_es,
        a.seolink_fr,
        a.seolink_de,
        a.seodescription_pt,
        a.seodescription_en,
        a.seodescription_es,
        a.seodescription_fr,
        a.seodescription_de,
        a.image,
        a.imagepath,
        a.created_at
      FROM articles a
      WHERE a.id = ?
      LIMIT 1
    `,
    [articleId]
  )
}
