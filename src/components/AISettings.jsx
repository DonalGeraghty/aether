import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/useAuth.js'
import { getAISettings, saveAISelection } from '../services/aiSettings.js'
import ProviderKeySettings from './ProviderKeySettings.jsx'

function validModelFor(provider, ...candidates) {
  const models = provider?.models || []
  for (const candidate of candidates) {
    if (models.some((model) => model.id === candidate)) return candidate
  }
  return models[0]?.id || ''
}

function selectionFor(settings) {
  const providers = settings.providers || []
  const selectedProvider = providers.find((provider) => provider.id === settings.selection?.provider) || providers[0]
  return {
    provider: selectedProvider?.id || '',
    model: validModelFor(selectedProvider, settings.selection?.model),
  }
}

function settingsErrorMessage(error) {
  if (error.code === 'provider_key_required') return 'Connect that provider before selecting it.'
  if (error.code === 'provider_key_invalid') return 'That provider’s API key is no longer valid. Replace it below.'
  if (error.code === 'provider_access_denied') return 'That API key does not have the required provider access.'
  if (error.code === 'provider_billing_required') return 'That provider account needs API credit or a higher spending limit.'
  if (error.code === 'provider_unavailable') return 'That AI provider is temporarily unavailable. Try again later.'
  if (error.code === 'credential_service_unavailable') return 'Secure key storage is temporarily unavailable. Try again later.'
  return error.message || 'Could not update your AI profile.'
}

export default function AISettings({ offline = false }) {
  const { user, logout } = useAuth()
  const [settings, setSettings] = useState(null)
  const [draftSelection, setDraftSelection] = useState({ provider: '', model: '' })
  const [draftModelsByProvider, setDraftModelsByProvider] = useState({})
  const [loading, setLoading] = useState(!user?.isDemo && !offline)
  const [loadFailed, setLoadFailed] = useState(false)
  const [savingSelection, setSavingSelection] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const handleUnauthorized = useCallback((requestError) => {
    if (requestError.status !== 401) return false
    logout()
    return true
  }, [logout])

  useEffect(() => {
    if (user?.isDemo || offline) return undefined
    let active = true
    getAISettings()
      .then((nextSettings) => {
        if (!active) return
        const initialSelection = selectionFor(nextSettings)
        setSettings(nextSettings)
        setDraftSelection(initialSelection)
        setDraftModelsByProvider(initialSelection.provider ? { [initialSelection.provider]: initialSelection.model } : {})
        setLoadFailed(false)
      })
      .catch((requestError) => {
        if (!active || handleUnauthorized(requestError)) return
        setLoadFailed(true)
        setError(settingsErrorMessage(requestError))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [handleUnauthorized, offline, user?.isDemo])

  const selectedProvider = useMemo(
    () => settings?.providers.find((provider) => provider.id === draftSelection.provider),
    [draftSelection.provider, settings?.providers],
  )
  const selectedModel = selectedProvider?.models?.find((model) => model.id === draftSelection.model)
  const savedSelection = settings?.selection || {}
  const selectionChanged = draftSelection.provider !== savedSelection.provider || draftSelection.model !== savedSelection.model
  const selectionReady = Boolean(selectedProvider?.credential?.configured && selectedModel)

  const handleProviderChange = (providerId) => {
    const provider = settings.providers.find((candidate) => candidate.id === providerId)
    const savedModel = settings.selection?.provider === providerId ? settings.selection.model : ''
    const model = validModelFor(provider, draftModelsByProvider[providerId], savedModel)
    setDraftSelection({ provider: providerId, model })
    setDraftModelsByProvider((current) => ({ ...current, [providerId]: model }))
    setError('')
    setNotice('')
  }

  const handleModelChange = (event) => {
    const model = event.target.value
    const providerId = draftSelection.provider
    setDraftSelection((current) => ({ ...current, model }))
    if (providerId) setDraftModelsByProvider((current) => ({ ...current, [providerId]: model }))
    setError('')
    setNotice('')
  }

  const handleSelectionSave = async (event) => {
    event.preventDefault()
    if (!selectionReady || !selectionChanged || savingSelection) return
    setSavingSelection(true)
    setError('')
    setNotice('')
    try {
      const selection = await saveAISelection(draftSelection)
      setSettings((current) => ({ ...current, selection }))
      setDraftSelection(selection)
      setDraftModelsByProvider((current) => ({ ...current, [selection.provider]: selection.model }))
      setNotice('Your provider and model have been updated for this Janus account.')
    } catch (requestError) {
      if (!handleUnauthorized(requestError)) setError(settingsErrorMessage(requestError))
    } finally {
      setSavingSelection(false)
    }
  }

  const handleCredentialChange = useCallback((providerId, credential) => {
    setSettings((current) => current ? {
      ...current,
      providers: current.providers.map((provider) => (
        provider.id === providerId ? { ...provider, credential } : provider
      )),
    } : current)
  }, [])

  if (user?.isDemo) {
    return (
      <section className="settings-card demo-ai-card">
        <p className="settings-kicker">AI connections</p>
        <h2>Connect your preferred LLM.</h2>
        <p>The demo account cannot store API keys. Sign in with a Janus account to connect OpenAI, Mistral, or Anthropic.</p>
      </section>
    )
  }

  if (offline) {
    return (
      <section className="settings-card demo-ai-card">
        <p className="settings-kicker">AI connections</p>
        <h2>Reconnect to manage LLMs.</h2>
        <p>Your saved provider settings remain in Janus and will be available when this device is online.</p>
      </section>
    )
  }

  return (
    <>
      <section className="settings-card ai-profile-card">
        <header className="settings-heading">
          <div>
            <p className="settings-kicker">AI profile</p>
            <h2>Choose the mind.</h2>
          </div>
          <p>{loading ? 'Loading providers…' : loadFailed ? 'Providers unavailable' : 'Shared through Janus'}</p>
        </header>

        {!loading && settings?.providers.length > 0 && (
          <form className="ai-profile-form" onSubmit={handleSelectionSave}>
            <fieldset className="provider-picker" disabled={savingSelection}>
              <legend>Provider</legend>
              <div>
                {settings.providers.map((provider) => {
                  const checked = provider.id === draftSelection.provider
                  const configured = Boolean(provider.credential?.configured)
                  const disabled = !configured && !checked
                  return (
                    <label className={`${checked ? 'is-active' : ''}${disabled ? ' is-disabled' : ''}`} key={provider.id}>
                      <input type="radio" name="ai-provider" value={provider.id} checked={checked} disabled={disabled} onChange={() => handleProviderChange(provider.id)} />
                      <span><strong>{provider.name || provider.id}</strong><small>{configured ? 'Connected' : 'Connect below'}</small></span>
                    </label>
                  )
                })}
              </div>
            </fieldset>

            <div className="model-picker-row">
              <label htmlFor="ai-model">Model
                <select id="ai-model" value={draftSelection.model} onChange={handleModelChange} disabled={savingSelection || !selectedProvider?.models?.length}>
                  {(selectedProvider?.models || []).map((model) => <option key={model.id} value={model.id}>{model.name || model.id}</option>)}
                </select>
              </label>
              <button type="submit" disabled={!selectionReady || !selectionChanged || savingSelection}>{savingSelection ? 'Saving…' : 'Save selection'}</button>
            </div>
            {selectedModel?.description && <p className="model-description">{selectedModel.description}</p>}
            {!selectedProvider?.credential?.configured && <p className="settings-guidance">Connect {selectedProvider?.name || 'this provider'} below before selecting it.</p>}
          </form>
        )}

        {error && <p className="settings-message is-error" role="alert">{error}</p>}
        {notice && <p className="settings-message is-success" role="status">{notice}</p>}
      </section>

      {!loading && settings?.providers.length > 0 && (
        <div className="provider-key-grid" aria-label="Provider API keys">
          {settings.providers.map((provider) => (
            <ProviderKeySettings
              key={provider.id}
              provider={provider}
              selected={provider.id === settings.selection?.provider}
              onCredentialChange={handleCredentialChange}
              onUnauthorized={handleUnauthorized}
            />
          ))}
        </div>
      )}
    </>
  )
}
