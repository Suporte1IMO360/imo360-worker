import type { Bindings } from '../types/env'
import { decodeSingleHash } from '../utils/hashid'
import { findWebsiteSlidersByAgencyId } from '../repositories/website.repository'
import { resolveWebsiteAdminImageUrl, resolveWebsiteFileUrl } from './website.service'

type SliderItem = {
  img: string
}

type SlidersResponse = {
  sliders: SliderItem[]
}

export async function getSlidersByHash(env: Bindings, hash: string): Promise<SlidersResponse> {
  const agencyId = decodeSingleHash(env, hash)
  const sliders = await findWebsiteSlidersByAgencyId(env, agencyId)

  return {
    sliders: sliders
      .map((slider) => {
        const img =
          Number(slider.option_img_home) === 0
            ? resolveWebsiteFileUrl(env, slider.img, agencyId, hash)
            : resolveWebsiteAdminImageUrl(env, slider.admin_image_imagem)

        if (!img) {
          return null
        }

        return { img }
      })
      .filter((item): item is SliderItem => item !== null)
  }
}