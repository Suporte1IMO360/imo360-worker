import type { Bindings } from '../types/env'
import { decodeSingleHash } from '../utils/hashid'
import { findWebsiteContactsByAgencyId } from '../repositories/website.repository'

function hasText(value: string | null | undefined): boolean {
  return Boolean(value && value.trim() !== '')
}

function formatHour(value: string | null): string {
  if (!value) {
    return ''
  }

  const hhmm = value.length >= 5 ? value.slice(0, 5) : value
  return `${hhmm}h`
}

function formatScheduleTime(
  morningStart: string | null,
  morningEnd: string | null,
  afternoonStart: string | null,
  afternoonEnd: string | null
): string {
  const mStart = formatHour(morningStart)
  const mEnd = formatHour(morningEnd)
  const aStart = formatHour(afternoonStart)
  const aEnd = formatHour(afternoonEnd)

  let out = ''

  if (mStart) {
    out += mStart
  }

  if (mEnd) {
    out += `${out ? ' - ' : ''}${mEnd}`
  }

  if (aStart) {
    out += `${out ? ' / ' : ''}${aStart}`
  }

  if (aEnd) {
    out += `${out ? ' - ' : ''}${aEnd}`
  }

  return out
}

function formatScheduleRange(start: string | null, end: string | null): string {
  const startTxt = start || ''

  if (hasText(end)) {
    return `${startTxt} a ${end}`
  }

  return startTxt
}

export async function getContactsByHash(env: Bindings, hash: string) {
  const agencyId = decodeSingleHash(env, hash)
  const website = await findWebsiteContactsByAgencyId(env, agencyId)

  if (!website) {
    return {
      email: null,
      phone: '',
      street: '',
      latitude: null,
      longitude: null,
      schedule: {
        week1: '',
        time1: '',
        week2: '',
        time2: ''
      }
    }
  }

  const email =
    Number(website.show_contacto_email) === 1
      ? hasText(website.contacto_email)
        ? website.contacto_email
        : ''
      : null

  const phone = `${hasText(website.contacto_telefone) ? website.contacto_telefone : ''}${hasText(website.contacto_telemovel) ? `|${website.contacto_telemovel}` : ''}`

  const street = `${hasText(website.contacto_morada) ? website.contacto_morada : ''}${hasText(website.contacto_codpostal) ? `, ${website.contacto_codpostal}` : ''}${hasText(website.localidade) ? website.localidade : hasText(website.contacto_concelho_name) ? `, ${website.contacto_concelho_name}` : ''}`

  return {
    email,
    phone,
    street,
    latitude: website.latitude,
    longitude: website.longitude,
    schedule: {
      week1: formatScheduleRange(website.contacto_horario, website.contacto_horario2),
      time1: formatScheduleTime(
        website.contacto_manha_inicio,
        website.contacto_manha_fim,
        website.contacto_tarde_inicio,
        website.contacto_tarde_fim
      ),
      week2: formatScheduleRange(website.contacto_horario3, website.contacto_horario4),
      time2: formatScheduleTime(
        website.contacto_manha_inicio2,
        website.contacto_manha_fim2,
        website.contacto_tarde_inicio2,
        website.contacto_tarde_fim2
      )
    }
  }
}
