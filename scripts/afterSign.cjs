// electron-builder `afterSign` hook. `mac.identity: null` in
// electron-builder.yml tells electron-builder's own codesign step to skip
// entirely (no Developer ID cert is configured) — but on Apple Silicon,
// macOS *requires* every arm64 Mach-O binary to carry at least an ad-hoc
// signature just to launch at all. A fully unsigned arm64 build doesn't
// get a polite "unidentified developer" prompt; it fails outright and
// macOS reports it as "damaged". This hook ad-hoc signs the packaged .app
// (identity "-", no certificate needed) after electron-builder assembles
// it but before it's wrapped into the dmg/zip, which is enough to satisfy
// that hard requirement — the softer "unidentified developer" Gatekeeper
// prompt documented in the README is the remaining, expected step.
const { execFileSync } = require('node:child_process')
const path = require('node:path')

module.exports = async function afterSign(context) {
  if (context.electronPlatformName !== 'darwin') return

  const appName = `${context.packager.appInfo.productFilename}.app`
  const appPath = path.join(context.appOutDir, appName)

  execFileSync('codesign', ['--force', '--deep', '--sign', '-', appPath], { stdio: 'inherit' })
}
