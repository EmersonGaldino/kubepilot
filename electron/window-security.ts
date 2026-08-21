/** Only ordinary web URLs may leave the application through the OS browser.
 * This prevents untrusted renderer content from invoking custom or local URI
 * schemes through Electron's shell integration. */
export function isSafeExternalUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}
