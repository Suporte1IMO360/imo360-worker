const BASE_URL = process.env.BASE_URL || 'http://localhost:8788'
const WEBSITE_VALID_HASH = process.env.WEBSITE_VALID_HASH || '34mm93'
const WEBSITE_ALT_HASH = process.env.WEBSITE_ALT_HASH || '12rdzpm54o34mm938g97vnl6k'
const WEBSITE_INVALID_HASH = process.env.WEBSITE_INVALID_HASH || 'hash-invalido-123'

async function fetchJson(url) {
  const response = await fetch(url)
  const text = await response.text()

  let json
  try {
    json = JSON.parse(text)
  } catch {
    json = null
  }

  return {
    status: response.status,
    json,
    raw: text
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

async function runCase(name, hash, expectedStatus) {
  const url = `${BASE_URL}/api/website/${hash}`
  const result = await fetchJson(url)

  assert(
    result.status === expectedStatus,
    `${name}: status esperado ${expectedStatus}, recebido ${result.status} (${url})`
  )

  if (expectedStatus === 200) {
    assert(result.json && typeof result.json === 'object', `${name}: payload JSON invalido`)
    assert(!result.json.error, `${name}: payload nao deve conter erro`) 
    assert(result.json && typeof result.json.pages === 'object', `${name}: pages nao encontrado`)
    assert(result.json && typeof result.json.colors === 'object', `${name}: colors nao encontrado`)
  }

  if (expectedStatus === 400) {
    assert(result.json && result.json.error === 'invalid_hash', `${name}: erro esperado invalid_hash`)
  }

  console.log(`PASS ${name} -> ${result.status}`)
}

async function main() {
  await runCase('website-main', WEBSITE_VALID_HASH, 200)

  if (WEBSITE_ALT_HASH) {
    await runCase('website-alternative', WEBSITE_ALT_HASH, 200)
  }

  await runCase('website-invalid', WEBSITE_INVALID_HASH, 400)

  console.log('\nWebsite smoke tests concluidos com sucesso.')
}

main().catch((error) => {
  console.error('\nFalha nos website smoke tests:')
  console.error(error.message)
  process.exit(1)
})
