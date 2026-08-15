const PROVIDER_NAMES = {
  openai: 'OpenAI',
  mistral: 'Mistral AI',
  anthropic: 'Claude (Anthropic)',
}

function providerName(provider) {
  if (provider && typeof provider === 'object') {
    return provider.name || PROVIDER_NAMES[provider.id] || provider.id || ''
  }
  return PROVIDER_NAMES[provider] || provider || ''
}

export function workoutAIError(error) {
  const name = providerName(error?.provider)
  const subject = name || 'Your selected AI provider'
  const possessive = name || 'your selected AI provider'

  if (error?.status === 401) {
    return { message: 'Your Janus session has expired. Sign in again.', showAccount: false }
  }
  if (error?.code === 'provider_key_required') {
    return { message: `Add an API key for ${possessive} in Account before analyzing workouts.`, showAccount: true }
  }
  if (error?.code === 'provider_key_invalid') {
    return { message: `The API key for ${possessive} is no longer valid. Replace it in Account.`, showAccount: true }
  }
  if (error?.code === 'provider_access_denied') {
    return { message: `The API key for ${possessive} does not have the required API access.`, showAccount: true }
  }
  if (error?.code === 'provider_billing_required') {
    return { message: `The ${possessive} account needs API credit or a higher spending limit.`, showAccount: false }
  }
  if (error?.code === 'provider_rate_limited' || error?.status === 429) {
    return { message: `${subject} is temporarily rate limited. Try again shortly.`, showAccount: false }
  }
  if (error?.code === 'provider_unavailable') {
    return { message: `${subject} is temporarily unavailable. Try again later.`, showAccount: false }
  }
  if (error?.code === 'credential_service_unavailable') {
    return { message: 'Secure key storage is temporarily unavailable. Try again later.', showAccount: false }
  }
  return { message: error?.message || 'Could not analyze that workout.', showAccount: false }
}
