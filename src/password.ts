const buffToBase64 = (buff: Uint8Array) =>
  // @ts-ignore
  btoa(String.fromCharCode.apply(null, buff))

const base64ToBuf = (b64: string) =>
  Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))

const enc = new TextEncoder()
const dec = new TextDecoder()

const getPasswordKey = (password: string | undefined) =>
  window.crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, [
    'deriveKey',
  ])

const deriveKey = (
  passwordKey: CryptoKey,
  salt: Uint8Array,
  keyUsage: string[],
  iterations: any
) =>
  window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    // @ts-ignore
    keyUsage
  )

export default class Password {
  async encrypt(secretData: string, password: string, iterations: number) {
    const salt = window.crypto.getRandomValues(new Uint8Array(16))
    const iv = window.crypto.getRandomValues(new Uint8Array(12))
    const passwordKey = await getPasswordKey(password)
    const aesKey = await deriveKey(passwordKey, salt, ['encrypt'], iterations)
    const encryptedContent = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      aesKey,
      enc.encode(secretData)
    )

    const encryptedContentArr = new Uint8Array(encryptedContent)
    const buff = new Uint8Array(
      salt.byteLength + iv.byteLength + encryptedContentArr.byteLength
    )
    buff.set(salt, 0)
    buff.set(iv, salt.byteLength)
    buff.set(encryptedContentArr, salt.byteLength + iv.byteLength)
    return buffToBase64(buff)
  }

  async decrypt(encryptedData: string, password: string, iterations: number) {
    const encryptedDataBuff = base64ToBuf(encryptedData)
    const salt = encryptedDataBuff.slice(0, 16)
    const iv = encryptedDataBuff.slice(16, 16 + 12)
    const data = encryptedDataBuff.slice(16 + 12)
    const passwordKey = await getPasswordKey(password)
    const aesKey = await deriveKey(passwordKey, salt, ['decrypt'], iterations)
    const decryptedContent = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      aesKey,
      data
    )
    return dec.decode(decryptedContent)
  }
}
