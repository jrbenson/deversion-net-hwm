function encode(obj: any) {
  return encodeURIComponent(JSON.stringify(obj))
}

function decode(str: string) {
  return JSON.parse(decodeURIComponent(str))
}

export function setURLState(obj: any) {
  const url = new URL(window.location.href)
  url.searchParams.set('state', encode(obj))
  window.history.replaceState({}, '', url.toString())
}

export function getURLState() {
  const url = new URL(window.location.href)
  const state = url.searchParams.get('state')
  if (state) {
    return decode(state)
  }
  return {}
}
