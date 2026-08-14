export function formatDate(value, options = {}) {
  return new Intl.DateTimeFormat('en-IE', options).format(new Date(value))
}
