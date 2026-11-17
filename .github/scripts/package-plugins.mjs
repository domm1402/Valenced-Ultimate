import { access, copyFile, cp, mkdir, readdir, readFile, rm } from 'node:fs/promises'
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
  await mkdir(join(stage, manifest.dist.script, '..'), { recursive: true })
  await copyFile(builtScript, join(stage, manifest.dist.script))

  const zipArgs = ['-q', '-r', join(pool, manifest.id + '@' + manifest.version + '.zip'), 'manifest.json', manifest.dist.script]
  if (manifest.dist.android) {
    const androidPath = manifest.dist.android.path
    const androidArtifact = join(folder, androidPath)
    const nativeLibraries = join(folder, 'lib')
    await access(androidArtifact)
    await access(nativeLibraries)
    await mkdir(join(stage, androidPath, '..'), { recursive: true })
    await copyFile(androidArtifact, join(stage, androidPath))
    await cp(nativeLibraries, join(stage, 'lib'), { recursive: true })
    zipArgs.push(androidPath, 'lib')
  }
  execFileSync('zip', zipArgs, { cwd: stage })
  count++
  console.log('Packaged ' + manifest.name + ' -> ' + manifest.id + '@' + manifest.version + '.zip')
}
if (count === 0) throw new Error('No valid plugin ZIPs were produced.')
console.log('Successfully packaged ' + count + ' plugins.')
