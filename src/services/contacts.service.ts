import type { Bindings } from '../types/env'
import { decodeSingleHash } from '../utils/hashid'
import { findWebsiteContactsByAgencyId } from '../repositories/website.repository'

function asNullableString(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null
  }

  return String(value)
}

function hasText(value: unknown): boolean {
  const text = asNullableString(value)

  return Boolean(text && text.trim() !== '')
}

function formatHour(value: unknown): string {
  const text = asNullableString(value)

  if (!text) {
    return ''
  }

  const hhmm = text.length >= 5 ? text.slice(0, 5) : text
  return `${hhmm}h`
}

function formatScheduleTime(
  morningStart: unknown,
  morningEnd: unknown,
  afternoonStart: unknown,
  afternoonEnd: unknown
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

function normalizeWeekday(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return ''
  }

  const index = Number(value)

  if (!Number.isInteger(index)) {
    return asNullableString(value) || ''
  }

  const labels: Record<number, string> = {
    0: 'Segunda',
    1: 'Terca',
    2: 'Quarta',
    3: 'Quinta',
    4: 'Sexta',
    5: 'Sabado',
    6: 'Domingo'
  }

  return labels[index] || ''
}

function formatScheduleRange(start: unknown, end: unknown): string {
  const startTxt = normalizeWeekday(start)
  const endTxt = normalizeWeekday(end)

  if (hasText(endTxt)) {
    return `${startTxt} a ${endTxt}`
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
        ? asNullableString(website.contacto_email) || ''
        : ''
      : null

  const phone = `${hasText(website.contacto_telefone) ? asNullableString(website.contacto_telefone) : ''}${hasText(website.contacto_telemovel) ? `|${asNullableString(website.contacto_telemovel)}` : ''}`

  const street = `${hasText(website.contacto_morada) ? asNullableString(website.contacto_morada) : ''}${hasText(website.contacto_codpostal) ? `, ${asNullableString(website.contacto_codpostal)}` : ''}${hasText(website.localidade) ? asNullableString(website.localidade) : hasText(website.contacto_concelho_name) ? `, ${asNullableString(website.contacto_concelho_name)}` : ''}`

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
