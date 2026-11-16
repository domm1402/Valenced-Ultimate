import { access, copyFile, mkdir, readdir, readFile, rm } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { execFileSync } from 'node:child_process'

const root = resolve('plugins')
const pool = resolve('dist/pool')
const stagingRoot = resolve('dist/.staging')
await rm(pool, { recursive: true, force: true })
await rm(stagingRoot, { recursive: true, force: true })
await mkdir(pool, { recursive: true })
await mkdir(stagingRoot, { recursive: true })

let count = 0
for (const entry of await readdir(root, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue
  const folder = join(root, entry.name)
  const manifestPath = join(folder, 'manifest.json')
  let manifest
  try { manifest = JSON.parse(await readFile(manifestPath, 'utf8')) } catch { continue }
  if (manifest.format !== 1 || !manifest.id || !manifest.version || !manifest.dist?.script) continue
  const builtScript = join(folder, 'build/js/index.js')
  try { await access(builtScript) } catch {
    console.warn('Skipping ' + entry.name + ': build output was not found.')
    continue
  }
  const stage = join(stagingRoot, entry.name)
  await mkdir(stage, { recursive: true })
  await copyFile(manifestPath, join(stage, 'manifest.json'))
  await copyFile(builtScript, join(stage, manifest.dist.script))
  const zipName = manifest.id + '@' + manifest.version + '.zip'
  execFileSync('zip', ['-q', '-j', join(pool, zipName), 'manifest.json', manifest.dist.script], { cwd: stage })
  count++
  console.log('Packaged ' + manifest.name + ' -> ' + zipName)
}
if (count === 0) throw new Error('No valid plugin ZIPs were produced.')
console.log('Successfully packaged ' + count + ' plugins.')
