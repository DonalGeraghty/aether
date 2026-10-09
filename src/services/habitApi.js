import { authFetch } from '../config/api.js'

export async function habitRequest(path, method = 'GET', body) {
  const response = await authFetch(path, {
    method,
    ...(body !== undefined ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(data.message || data.error || 'Could not sync habits with Janus.')
    error.status = response.status
    error.code = data.error
    throw error
  }
  return data
}
