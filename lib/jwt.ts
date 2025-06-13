// JWT utilities using Web Crypto API (works in Node 18+ and Edge runtime)

const b64u = (buf: ArrayBuffer | string) => {
  const str = typeof buf === 'string'
    ? buf
    : (() => {
        const arr = new Uint8Array(buf as ArrayBuffer)
        let s = ''
        for (let i = 0; i < arr.length; i++) s += String.fromCharCode(arr[i])
        return s
      })()
  return btoa(str).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

const encoder = new TextEncoder()

async function hmac(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  )
  const sigBuf = await crypto.subtle.sign('HMAC', key, encoder.encode(message))
  return b64u(sigBuf)
}

export async function sign(payload: Record<string, any>, secret: string): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' }
  const headerEncoded = b64u(JSON.stringify(header))
  const payloadEncoded = b64u(JSON.stringify(payload))
  const data = `${headerEncoded}.${payloadEncoded}`
  const sig = await hmac(data, secret)
  return `${data}.${sig}`
}

export async function verify(token: string, secret: string): Promise<Record<string, any> | null> {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [headerEncoded, payloadEncoded, sig] = parts
  const data = `${headerEncoded}.${payloadEncoded}`
  const expectedSig = await hmac(data, secret)
  if (sig !== expectedSig) return null
  try {
    const payload = JSON.parse(atob(payloadEncoded))
    if (payload.exp && Date.now() / 1000 > payload.exp) return null
    return payload
  } catch {
    return null
  }
} 