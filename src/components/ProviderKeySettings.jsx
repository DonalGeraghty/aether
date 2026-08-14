import { useState } from 'react'
import Icon from './Icon.jsx'
import {
  deleteAIProviderCredential,
  saveAIProviderCredential,
} from '../services/aiSettings.js'

const PROVIDER_LINKS = {
  openai: {
    href: 'https://platform.openai.com/api-keys',
    label: 'Create an OpenAI API key',
    placeholder: 'sk-…',
  },
  mistral: {
    href: 'https://console.mistral.ai/api-keys/',
    label: 'Create a Mistral API key',
    placeholder: 'Enter your Mistral API key',
  },
  anthropic: {
    href: 'https://console.anthropic.com/settings/keys',
    label: 'Create a Claude API key',
    placeholder: 'sk-ant-…',
  },
}

function credentialErrorMessage(error, providerName) {
  if (error.code === 'invalid_api_key') return `Enter a valid ${providerName} API key.`
  if (error.code === 'provider_key_invalid') return `${providerName} rejected this key. Check that it is active and has API access.`
  if (error.code === 'provider_access_denied') return `${providerName} accepted the key, but it does not have the required API access.`
  if (error.code === 'provider_billing_required') return `${providerName} accepted the key, but the account needs API credit or a higher spending limit.`
  if (error.code === 'provider_rate_limited') return `${providerName} could not verify the key because it is currently rate limited.`
  if (error.code === 'provider_unavailable') return `${providerName} is temporarily unavailable. Try again later.`
  if (error.code === 'credential_service_unavailable') return 'Secure key storage is temporarily unavailable. Try again later.'
  return error.message || `Could not update your ${providerName} API key.`
}

export default function ProviderKeySettings({
  provider,
  selected = false,
  onCredentialChange,
  onUnauthorized,
}) {
  const [apiKey, setApiKey] = useState('')
  const [action, setAction] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const providerId = String(provider.id)
  const providerName = provider.name || providerId
  const fieldId = `${providerId.replace(/[^a-z0-9_-]/gi, '-')}-api-key`
  const headingId = `${fieldId}-heading`
  const presentation = PROVIDER_LINKS[providerId.toLowerCase()]
  const configured = Boolean(provider.credential?.configured)
  const busy = Boolean(action)

  const handleSave = async (event) => {
    event.preventDefault()
    setError('')
    setNotice('')
    const submittedKey = apiKey.trim()
    if (!submittedKey) {
      setError(`Enter your ${providerName} API key.`)
      return
    }

    setAction('save')
    try {
      const result = await saveAIProviderCredential(providerId, submittedKey)
      const credential = result?.credential || result
      onCredentialChange(providerId, credential)
      setApiKey('')
      setNotice(result?.warning?.message || `${providerName} is now connected.`)
    } catch (requestError) {
      if (!onUnauthorized(requestError)) setError(credentialErrorMessage(requestError, providerName))
    } finally {
      setAction('')
    }
  }

  const handleRemove = async () => {
    const selectedWarning = selected
      ? ` ${providerName} is your selected provider, so AI features will be unavailable until you replace the key or select another provider.`
      : ''
    if (!window.confirm(`Remove your ${providerName} API key?${selectedWarning}`)) return

    setError('')
    setNotice('')
    setAction('delete')
    try {
      await deleteAIProviderCredential(providerId)
      onCredentialChange(providerId, { configured: false })
      setApiKey('')
      setNotice(`${providerName} was disconnected.`)
    } catch (requestError) {
      if (!onUnauthorized(requestError)) setError(credentialErrorMessage(requestError, providerName))
    } finally {
      setAction('')
    }
  }

  return (
    <section className={`provider-key-card${selected ? ' is-selected' : ''}`} aria-labelledby={headingId}>
      <header className="provider-key-heading">
        <div>
          <span className="provider-overline">{selected ? 'Active provider' : 'Provider connection'}</span>
          <h3 id={headingId}>{providerName}</h3>
        </div>
        <span className={`connection-state${configured ? ' is-connected' : ''}`}>
          {configured ? `•••• ${provider.credential.last_four || ''}` : 'Not connected'}
        </span>
      </header>

      <p className="provider-key-copy">
        Your key is verified with {providerName}, encrypted by Janus, and never shown again.
      </p>

      {presentation && (
        <a className="provider-key-link" href={presentation.href} target="_blank" rel="noreferrer">
          {presentation.label} <Icon name="arrow" size={14} />
        </a>
      )}

      <form className="provider-key-form" onSubmit={handleSave}>
        <label htmlFor={fieldId}>{configured ? 'Replace API key' : 'API key'}</label>
        <div className="provider-key-input-row">
          <input
            id={fieldId}
            name={fieldId}
            type="password"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck="false"
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            placeholder={presentation?.placeholder || 'Enter API key'}
            disabled={busy}
          />
          <button type="submit" disabled={busy || !apiKey.trim()}>
            {action === 'save' ? 'Checking…' : configured ? 'Replace' : 'Connect'}
          </button>
        </div>
      </form>

      {configured && (
        <button className="provider-remove" type="button" onClick={handleRemove} disabled={busy}>
          {action === 'delete' ? 'Disconnecting…' : 'Disconnect provider'}
        </button>
      )}
      {error && <p className="settings-message is-error" role="alert">{error}</p>}
      {notice && <p className="settings-message is-success" role="status">{notice}</p>}
    </section>
  )
}
