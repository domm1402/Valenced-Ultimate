import { mkdir, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const plugins = [
  { slug: 'fake-nitro-preview', id: 'niche.fake-nitro-preview', name: 'Fake Nitro Preview', description: 'Preview Nitro-style profile visuals locally. This does not unlock paid features or server permissions.', kind: 'simple', label: 'Display name', placeholder: 'Your display name', expression: "value.trim() ? '✨ ' + value.trim() + ' · Nitro-style local preview' : 'Enter a display name to preview the cosmetic profile card.'" },
  { slug: 'discord-game-catalog', id: 'niche.discord-game-catalog', name: 'Discord Game Catalog', description: "Search Discord's public detectable-games catalog and inspect game application IDs.", kind: 'catalog' },
  { slug: 'rich-presence-builder', id: 'niche.rich-presence-builder', name: 'Rich Presence Builder', description: 'Pick a game from Discord’s detectable-games catalog and draft a Playing activity with custom details and state.', kind: 'presence' },
  { slug: 'profile-card-preview', id: 'niche.profile-card-preview', name: 'Profile Card Preview', description: 'Preview a display name and short profile card locally.', kind: 'simple', label: 'Display name', placeholder: 'Display name', expression: "value.trim() ? 'PROFILE PREVIEW\\n' + value.trim() + '\\nAdd your bio in Discord settings.' : 'Enter a display name to build a local preview.'" },
  { slug: 'badge-gallery-preview', id: 'niche.badge-gallery-preview', name: 'Badge Gallery Preview', description: 'Mock up a local badge row for profile design ideas. These are not official Discord badges.', kind: 'simple', label: 'Badge labels', placeholder: 'Early Supporter, HypeSquad', expression: "value.trim() ? value.split(',').map(x => '🏷️ ' + x.trim()).filter(Boolean).join('  ·  ') : 'Add comma-separated labels to preview a badge row.'" },
  { slug: 'status-draft-vault', id: 'niche.status-draft-vault', name: 'Custom Status Drafts', description: 'Draft a custom Discord status line before setting it in the app.', kind: 'simple', label: 'Status text', placeholder: 'Grinding ranked...', expression: "value.trim() ? 'Status draft: ' + value.trim() : 'Type a status draft.'" },
  { slug: 'silent-typing', id: 'niche.silent-typing', name: 'Silent Typing', description: 'Suppress your local typing-start event while enabled.', kind: 'silent' },
  { slug: 'file-name-cleaner', id: 'niche.file-name-cleaner', name: 'File Name Cleaner', description: 'Preview a cleaned, upload-friendly file name without changing the original file.', kind: 'simple', label: 'File name', placeholder: 'My cool file (final)!.png', expression: "value.trim() ? value.trim().replace(/[^a-zA-Z0-9._-]/g, '_').replace(/_+/g, '_') : 'Enter a file name to clean it.'" },
  { slug: 'timestamp-generator', id: 'niche.timestamp-generator', name: 'Discord Timestamp Generator', description: 'Convert Unix seconds into Discord relative timestamp syntax.', kind: 'simple', label: 'Unix timestamp (seconds)', placeholder: '1794852000', expression: "(() => { const n = Number(value.trim()); return Number.isFinite(n) && n > 0 ? '<t:' + Math.floor(n) + ':R>' : 'Enter a valid Unix timestamp in seconds.' })()" },
  { slug: 'snowflake-decoder', id: 'niche.snowflake-decoder', name: 'Snowflake Decoder', description: 'Decode a Discord snowflake ID into its creation date.', kind: 'simple', label: 'Discord ID', placeholder: '123456789012345678', expression: "(() => { try { const n = BigInt(value.trim()); if (n <= 0n) return 'Enter a valid Discord ID.'; return new Date(Number((n >> 22n) + 1420070400000n)).toLocaleString(); } catch { return 'Enter a valid numeric Discord ID.'; } })()" },
  { slug: 'link-cleaner', id: 'niche.link-cleaner', name: 'Link Cleaner', description: 'Remove common advertising and analytics query parameters from a pasted URL.', kind: 'simple', label: 'URL', placeholder: 'https://example.com/?utm_source=...', expression: "(() => { try { const u = new URL(value.trim()); for (const k of [...u.searchParams.keys()]) if (/^(utm_|fbclid$|gclid$|mc_cid$|mc_eid$|igshid$|ref_src$)/i.test(k)) u.searchParams.delete(k); return u.toString(); } catch { return 'Paste a complete URL starting with https://'; } })()" },
  { slug: 'text-stats', id: 'niche.text-stats', name: 'Message Text Stats', description: 'Count characters, words, lines and UTF-8 bytes in a message draft.', kind: 'simple', label: 'Message text', placeholder: 'Paste or type your text here...', expression: "'Characters: ' + value.length + ' · Words: ' + (value.trim() ? value.trim().split(/\\s+/).length : 0) + ' · Lines: ' + (value ? value.split(/\\r?\\n/).length : 0) + ' · UTF-8 bytes: ' + new TextEncoder().encode(value).length" },
  { slug: 'markdown-playground', id: 'niche.markdown-playground', name: 'Markdown Playground', description: 'Try common Discord Markdown in a scratchpad without sending a message.', kind: 'simple', label: 'Markdown text', placeholder: 'bold / italic / inline code', expression: "value ? 'Markdown draft:\\n' + value : 'Type some Markdown to preview your draft.'" },
  { slug: 'embed-preview', id: 'niche.embed-preview', name: 'Embed Preview', description: 'Draft an embed title and description locally. Nothing is sent to a channel.', kind: 'simple', label: 'Embed title', placeholder: 'Announcement title', expression: "value.trim() ? 'EMBED PREVIEW\\n' + value.trim() + '\\nDescription: add your embed text here.' : 'Enter an embed title to see a local preview.'" },
  { slug: 'emoji-previewer', id: 'niche.emoji-previewer', name: 'Emoji Previewer', description: 'Preview emoji, Unicode symbols and emoji combinations in a scratchpad.', kind: 'simple', label: 'Emoji or symbols', placeholder: '✨ 🎮 💜', expression: "value.trim() ? 'Preview: ' + value : 'Enter emoji or symbols to preview them.'" },
  { slug: 'hex-color-converter', id: 'niche.hex-color-converter', name: 'Hex Color Converter', description: 'Convert a six-digit hex color into RGB values.', kind: 'simple', label: 'Hex color', placeholder: '#5865F2', expression: "(() => { const m = value.trim().match(/^#?([0-9a-f]{6})$/i); if (!m) return 'Enter a six-digit hex color, such as #5865F2.'; const n = parseInt(m[1],16); return 'RGB(' + (n>>16) + ', ' + ((n>>8)&255) + ', ' + (n&255) + ')'; })()" },
  { slug: 'bio-formatter', id: 'niche.bio-formatter', name: 'Bio Formatter', description: 'Clean extra spaces and blank lines from an About Me draft.', kind: 'simple', label: 'About Me draft', placeholder: 'Write your profile bio...', expression: "value.trim() ? value.trim().split(/\\r?\\n/).map(x => x.trim()).filter(Boolean).join('\\n') : 'Enter a bio draft to format it.'" },
  { slug: 'invite-link-builder', id: 'niche.invite-link-builder', name: 'Invite Link Builder', description: 'Format an invite code as a Discord invite URL. It does not join or validate the invite.', kind: 'simple', label: 'Invite code or link', placeholder: 'abc123', expression: "(() => { const code = value.trim().replace(/^https?:\\/\\/(www\\.)?discord\\.gg\\//i,'').replace(/^discord\\.gg\\//i,'').replace(/[^a-zA-Z0-9-]/g,''); return code ? 'https://discord.gg/' + code : 'Enter an invite code.'; })()" },
  { slug: 'date-tag-builder', id: 'niche.date-tag-builder', name: 'Discord Date Tag Builder', description: "Convert a date and time into Discord's full and relative timestamp tags.", kind: 'simple', label: 'Date and time', placeholder: '2026-12-25 18:00', expression: "(() => { const ms = Date.parse(value.trim()); if (!Number.isFinite(ms)) return 'Enter a date such as 2026-12-25 18:00.'; const s = Math.floor(ms/1000); return '<t:' + s + ':F>  ·  <t:' + s + ':R>'; })()" },
  { slug: 'activity-text-templates', id: 'niche.activity-text-templates', name: 'Activity Text Templates', description: 'Draft activity details and state lines for a game card. Local preview only.', kind: 'simple', label: 'Activity details', placeholder: 'In a ranked match', expression: "value.trim() ? 'Playing · ' + value.trim() + '\\nState: Ready to play' : 'Enter the activity details you want to draft.'" }
]

function manifestFor(p) {
  return JSON.stringify({
    format: 1, id: p.id, name: p.name, description: p.description,
    author: 'Niche Games', version: '1.0.0',
    dependencies: { 'valenced.api': { version: '>=1 <2' }, discord: { version: '*' } },
    dist: { script: 'index.js' }
  }, null, 2) + '\n'
}

function simpleSource(p) {
  return [
    "import { Design } from '@valenced/discord/design'",
    "import Page from '@valenced/components/Page'",
    "import { useState } from 'react'",
    '',
    'function ToolSettings() {',
    "  const [value, setValue] = useState('')",
    '  const result = ' + p.expression,
    '',
    '  return (',
    '    <Page>',
    '      <Design.Text>{' + JSON.stringify(p.description) + '}</Design.Text>',
    '      <Design.TextInput label={' + JSON.stringify(p.label) + '} placeholder={' + JSON.stringify(p.placeholder) + '} defaultValue="" onChange={setValue} />',
    '      <Design.Text>{String(result)}</Design.Text>',
    '    </Page>',
    '  )',
    '}',
    '',
    'export default plugin({ SettingsComponent: ToolSettings })',
    ''
  ].join('\n')
}

const catalogSource = [
  "import { Design } from '@valenced/discord/design'",
  "import Page from '@valenced/components/Page'",
  "import { useEffect, useState } from 'react'",
  '',
  'type Game = { id: string; name: string }',
  '',
  'function GameCatalogSettings() {',
  '  const [games, setGames] = useState<Game[]>([])',
  "  const [query, setQuery] = useState('')",
  '  const [selected, setSelected] = useState<Game | null>(null)',
  "  const [status, setStatus] = useState('Loading Discord game catalog…')",
  '  useEffect(() => {',
  '    let active = true',
  "    fetch('https://discord.com/api/v10/applications/detectable')",
  '      .then(response => { if (!response.ok) throw new Error("Discord returned HTTP " + response.status); return response.json() })',
  '      .then(data => {',
  "        if (!Array.isArray(data)) throw new Error('Unexpected catalog response')",
  '        if (active) { setGames(data); setStatus(data.length.toLocaleString() + " detectable applications loaded.") }',
  '      })',
  '      .catch(error => { if (active) setStatus("Catalog unavailable: " + String(error)) })',
  '    return () => { active = false }',
  '  }, [])',
  '  const q = query.trim().toLowerCase()',
  '  const matches = q ? games.filter(game => String(game.name ?? "").toLowerCase().includes(q) || String(game.id ?? "").includes(q)).slice(0, 12) : []',
  '  return (',
  '    <Page>',
  '      <Design.Text>Search Discord’s public detectable-games catalog by game name or application ID.</Design.Text>',
  '      <Design.TextInput label="Search games" placeholder="Minecraft, Fortnite, Rocket League…" defaultValue="" onChange={setQuery} />',
  '      <Design.Text>{status}</Design.Text>',
  '      {matches.map(game => <Design.Button key={game.id} text={game.name + " · " + game.id} onPress={() => setSelected(game)} />)}',
  '      <Design.Text>{selected ? "Selected: " + selected.name + " · Application ID: " + selected.id : (q ? (matches.length ? "Tap a game to select it." : "No matching games found.") : "Type a game name to search.")}</Design.Text>',
  '      <Design.Text>Catalog entry only. This screen does not publish a Playing activity.</Design.Text>',
  '    </Page>',
  '  )',
  '}',
  '',
  'export default plugin({ SettingsComponent: GameCatalogSettings })',
  ''
].join('\n')

const presenceSource = [
  "import { Design } from '@valenced/discord/design'",
  "import Page from '@valenced/components/Page'",
  "import { useEffect, useState } from 'react'",
  '',
  'type Game = { id: string; name: string }',
  '',
  'function RichPresenceSettings() {',
  '  const [games, setGames] = useState<Game[]>([])',
  "  const [query, setQuery] = useState('')",
  '  const [selected, setSelected] = useState<Game | null>(null)',
  "  const [details, setDetails] = useState('')",
  "  const [state, setState] = useState('')",
  "  const [status, setStatus] = useState('Loading Discord game catalog…')",
  '  useEffect(() => {',
  '    let active = true',
  "    fetch('https://discord.com/api/v10/applications/detectable')",
  '      .then(response => { if (!response.ok) throw new Error("Discord returned HTTP " + response.status); return response.json() })',
  '      .then(data => {',
  "        if (!Array.isArray(data)) throw new Error('Unexpected catalog response')",
  '        if (active) { setGames(data); setStatus(data.length.toLocaleString() + " detectable games ready to search.") }',
  '      })',
  '      .catch(error => { if (active) setStatus("Could not load game list: " + String(error)) })',
  '    return () => { active = false }',
  '  }, [])',
  '  const q = query.trim().toLowerCase()',
  '  const matches = q ? games.filter(game => String(game.name ?? "").toLowerCase().includes(q) || String(game.id ?? "").includes(q)).slice(0, 10) : []',
  '  return (',
  '    <Page>',
  '      <Design.Text>Choose a game from Discord’s detectable-games catalog, then fill in the activity details.</Design.Text>',
  '      <Design.TextInput label="Find a Discord game" placeholder="Search Minecraft, Fortnite, Rocket League…" defaultValue="" onChange={setQuery} />',
  '      <Design.Text>{status}</Design.Text>',
  '      {matches.map(game => <Design.Button key={game.id} text={game.name + " · " + game.id} onPress={() => { setSelected(game); setQuery(game.name) }} />)}',
  '      <Design.TextInput label="Details" placeholder="In a ranked match" defaultValue="" onChange={setDetails} />',
  '      <Design.TextInput label="State" placeholder="2v2 · Diamond" defaultValue="" onChange={setState} />',
  '      <Design.Text>{selected ? "ACTIVITY PREVIEW\\nPlaying " + selected.name + "\\n" + (details.trim() || "Details") + (state.trim() ? "\\n" + state.trim() : "") + "\\nApplication ID: " + selected.id : "Select a game above to preview the activity card."}</Design.Text>',
  '      <Design.Text>Preview only. Valenced’s documented mobile plugin API does not provide a supported way to publish a user Playing status, so this screen does not change your live Discord presence.</Design.Text>',
  '    </Page>',
  '  )',
  '}',
  '',
  'export default plugin({ SettingsComponent: RichPresenceSettings })',
  ''
].join('\n')

const silentSource = [
  "import { onFluxEventDispatched } from '@valenced/discord/flux'",
  "import { Design } from '@valenced/discord/design'",
  '',
  'interface Settings { enabled: boolean }',
  '',
  'export default plugin<{ jsonStorage: Settings }>({',
  '  jsonStorage: { load: true, default: { enabled: true } },',
  '  start({ cleanup, jsonStorage }) {',
  "    cleanup(onFluxEventDispatched('TYPING_START_LOCAL', payload => {",
  '      if (jsonStorage.cache?.enabled) return',
  '      return payload',
  '    }))',
  '  },',
  '  SettingsComponent({ api }) {',
  '    const { TableRowGroup, TableSwitchRow } = Design',
  '    const settings = api.jsonStorage.use()',
  '    return (',
  '      <TableRowGroup title="Silent Typing">',
  '        <TableSwitchRow label="Hide my typing indicator" subLabel="Suppresses the local typing-start event while enabled." value={settings?.enabled ?? true} onValueChange={(enabled: boolean) => api.jsonStorage.set({ enabled })} />',
  '      </TableRowGroup>',
  '    )',
  '  },',
  '})',
  ''
].join('\n')

await rm('plugins', { recursive: true, force: true })
await mkdir('plugins', { recursive: true })
for (const p of plugins) {
  const dir = join('plugins', p.slug)
  await mkdir(join(dir, 'js'), { recursive: true })
  const src = p.kind === 'catalog' ? catalogSource : p.kind === 'presence' ? presenceSource : p.kind === 'silent' ? silentSource : simpleSource(p)
  await writeFile(join(dir, 'manifest.json'), manifestFor(p))
  await writeFile(join(dir, 'js/index.tsx'), src)
}
if (plugins.length !== 20) throw new Error('Expected 20 plugin definitions; found ' + plugins.length)
console.log('Generated ' + plugins.length + ' Valenced plugin folders.')
