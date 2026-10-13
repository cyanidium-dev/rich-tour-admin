export async function copyPasswordToClipboard(password: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(password)
      return true
    }
  } catch {
    // Fall back to the selection-based copy used in older or restricted browsers.
  }

  const input = document.createElement('textarea')
  input.value = password
  input.readOnly = true
  input.style.position = 'fixed'
  input.style.left = '-9999px'
  document.body.appendChild(input)
  try {
    input.select()
    return document.execCommand('copy')
  } catch {
    return false
  } finally {
    input.remove()
  }
}
