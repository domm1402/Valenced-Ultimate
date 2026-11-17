import { mkdir, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const plugins = [
  { slug: 'fake-nitro-preview', id: 'niche.fake-nitro-preview', name: 'Fake Nitro Preview', description: 'Preview Nitro-style profile visuals locally. This does not unlock paid features or server permissions.', kind: 'simple', label: 'Display name', placeholder: 'Your display name', expression: "value.trim() ? '✨ ' + value.trim() + ' · Nitro-style local preview' : 'Enter a display name to preview the cosmetic profile card.'" },
  { slug: 'fake-nitro', id: 'niche.fake-nitro', name: 'Fake Nitro', description: 'Enable supported local Nitro-style client features such as client themes, app icons and sticker rendering. Does not grant server entitlements.', kind: 'fakenitro' },
  { slug: 'discord-game-catalog', id: 'niche.discord-game-catalog', name: 'Discord Game Catalog', description: "Search Discord's public detectable-games catalog and inspect game application IDs.", kind: 'catalog' },
  { slug: 'domms-games-presence', id: 'domms.games.presence', name: 'Domms Games Presence', description: 'Select a game, customise activity details and state, then publish or clear Discord Rich Presence through the Discord Social SDK.', kind: 'presence' },
  { slug: 'profile-card-preview', id: 'niche.profile-card-preview', name: 'Profile Card Preview', description: 'Preview a display name and short profile card locally.', kind: 'simple', label: 'Display name', placeholder: 'Display name', expression: "value.trim() ? 'PROFILE PREVIEW\\n' + value.trim() + '\\nAdd your bio in Discord settings.' : 'Enter a display name to build a local preview.'" },
  { slug: 'badge-gallery-preview', id: 'niche.badge-gallery-preview', name: 'Badge Gallery Preview', description: 'Mock up a local badge row for profile design ideas. These are not official Discord badges.', kind: 'simple', label: 'Badge labels', placeholder: 'Early Supporter, HypeSquad', expression: "value.trim() ? value.split(',').map(x => '🏷️ ' + x.trim()).filter(Boolean).join('  ·  ') : 'Add comma-separated labels to preview a badge row.'" },
  { slug: 'status-draft-vault', id: 'niche.status-draft-vault', name: 'Custom Status Drafts', description: 'Draft a custom Discord status line before setting it in the app.', kind: 'simple', label: 'Status text', placeholder: 'Grinding ranked...', expression: "value.trim() ? 'Status draft: ' + value.trim() : 'Type a status draft.'" },
  { slug: 'silent-typing', id: 'niche.silent-typing', name: 'Silent Typing', description: 'Suppress your local typing-start event while enabled.', kind: 'silent' },
  { slug: 'no-idle', id: 'niche.no-idle', name: 'No Idle', description: 'Prevent Discord from switching your status to idle when the client backgrounds.', kind: 'noidle' },
  { slug: 'file-name-cleaner', id: 'niche.file-name-cleaner', name: 'File Name Cleaner', description: 'Preview a cleaned, upload-friendly file name without changing the original file.', kind: 'simple', label: 'File name', placeholder: 'My cool file (final)!.png', expression: "value.trim() ? value.trim().replace(/[^a-zA-Z0-9._-]/g, '_').replace(/_+/g, '_') : 'Enter a file name to clean it.'" },
  { slug: 'timestamp-generator', id: 'niche.timestamp-generator', name: 'Discord Timestamp Generator', description: 'Convert Unix seconds into Discord relative timestamp syntax.', kind: 'simple', label: 'Unix timestamp (seconds)', placeholder: '1794852000', expression: "(() => { const n = Number(value.trim()); return Number.isFinite(n) && n > 0 ? '<t:' + Math.floor(n) + ':R>' : 'Enter a valid Unix timestamp in seconds.' })()" },
  { slug: 'snowflake-decoder', id: 'niche.snowflake-decoder', name: 'Snowflake Decoder', description: 'Decode a Discord snowflake ID into its creation date.', kind: 'simple', label: 'Discord ID', placeholder: '123456789012345678', expression: "(() => { try { const n = BigInt(value.trim()); if (n <= 0n) return 'Enter a valid Discord ID.'; return new Date(Number((n >> 22n) + 1420070400000n)).toLocaleString(); } catch { return 'Enter a valid numeric Discord ID.'; } })()" },
  { slug: 'link-cleaner', id: 'niche.link-cleaner', name: 'Link Cleaner', description: 'Remove common advertising and analytics query parameters from a pasted URL.', kind: 'simple', label: 'URL', placeholder: 'https://example.com/?utm_source=...', expression: "(() => { try { const u = new URL(value.trim()); for (const k of [...u.searchParams.keys()]) if (/^(utm_|fbclid$|gclid$|mc_cid$|mc_eid$|igshid$|ref_src$)/i.test(k)) u.searchParams.delete(k); return u.toString(); } catch { return 'Paste a complete URL starting with https://'; } })()" },
  { slug: 'text-stats', id: 'niche.text-stats', name: 'Message Text Stats', description: 'Count characters, words, lines and UTF-8 bytes in a message draft.', kind: 'simple', label: 'Message text', placeholder: 'Paste or type your text here...', expression: "'Characters: ' + value.length + ' · Words: ' + (value.trim() ? value.trim().split(/\\s+/).length : 0) + ' · Lines: ' + (value ? value.split(/\\r?\\n/).length : 0) + ' · UTF-8 bytes: ' + new TextEncoder().encode(value).length" },
  { slug: 'markdown-playground', id: 'niche.markdown-playground', name: 'Markdown Playground', description: 'Try common Discord Markdown in a scratchpad without sending a message.', kind: 'simple', label: 'Markdown text', placeholder: 'bold / italic / inline code', expression: "value ? 'Markdown draft:\\n' + value : 'Type some Markdown to preview your draft.'" },
  { slug: 'embed-preview', id: 'niche.embed-preview', name: 'Embed Preview', description: 'Draft an embed title and description locally. Nothing is sent to a channel.', kind: 'simple', label: 'Embed title', placeholder: 'Announcement title', expression: "value.trim() ? 'EMBED PREVIEW\\n' + value.trim() + '\\nDescription: add your embed text here.' : 'Enter an embed title to see a local preview.'" },
  { slug: 'emoji-previewer', id: 'niche.emoji-previewer', name: 'Emoji Previewer', description: 'Preview emoji, Unicode symbols and emoji combinations in a scratchpad.', kind: 'simple', label: 'Emoji or symbols', placeholder: '✨ 🎮 💜', expression: "value.trim() ? 'Preview: ' + value : 'Enter emoji or symbols to preview them.'" },
  { slug: 'hex-color-converter', id: 'niche.hex-color-converter', name: 'Hex Color Converter', description: 'Convert a six-digit hex color into RGB values.', kind: 'simple', label: 'Hex color', placeholder: '#5865F2', expression: "(() => { const m = value.trim().match(/^#?([0-9a-f]{6})$/i); if (!m) return 'Enter a six-digit hex color, such as #5865F2.'; const n = parseInt(m[1],16); return 'RGB(' + (n>>16) + ', ' + ((n>>8)&255) + ', ' + (n&255) + ')'; })()" },
  { slug: 'bio-formatter', id: 'niche.bio-formatter', name: 'Bio Formatter', description: 'Clean extra spaces and blank lines from an About Me draft.', kind: 'simple', label: 'About Me draft', placeholder: 'Write your profile bio...', expression: "value.trim() ? value.trim().split(/\\r?\\n/).map(x => x.trim()).filter(Boolean).join(' ' ) : 'Enter a bio draft to format it.'" },
  { slug: 'invite-link-builder', id: 'niche.invite-link-builder', name: 'Invite Link Builder', description: 'Format an invite code as a Discord invite URL. It does not join or validate the invite.', kind: 'simple', label: 'Invite code or link', placeholder: 'abc123', expression: "(() => { const code = value.trim().replace(/^https?:\\/\\/(www\\.)?discord\\.gg\\//i,'').replace(/^discord\\.gg\\//i,'').replace(/[^a-zA-Z0-9-]/g,''); return code ? 'https://discord.gg/' + code : 'Enter an invite code.'; })()" },
  { slug: 'date-tag-builder', id: 'niche.date-tag-builder', name: 'Discord Date Tag Builder', description: "Convert a date and time into Discord's full and relative timestamp tags.", kind: 'simple', label: 'Date and time', placeholder: '2026-12-25 18:00', expression: "(() => { const ms = Date.parse(value.trim()); if (!Number.isFinite(ms)) return 'Enter a date such as 2026-12-25 18:00.'; const s = Math.floor(ms/1000); return '<t:' + s + ':F>  ·  <t:' + s + ':R>'; })()" },
  { slug: 'activity-text-templates', id: 'niche.activity-text-templates', name: 'Activity Text Templates', description: 'Draft activity details and state lines for a game card. Local preview only.', kind: 'simple', label: 'Activity details', placeholder: 'In a ranked match', expression: "value.trim() ? 'Playing · ' + value.trim() + '\\nState: Ready to play' : 'Enter the activity details you want to draft.'" },
  {"slug":"json-formatter","id":"niche.json-formatter","name":"JSON Formatter","description":"Validate and pretty-print JSON.","kind":"simple","label":"JSON","placeholder":"{\"hello\":\"world\"}","expression":"(() => { try { return JSON.stringify(JSON.parse(value), null, 2); } catch(e) { return 'Invalid JSON: ' + e.message; } })()"},
  {"slug":"base64-tool","id":"niche.base64-tool","name":"Base64 Encoder","description":"Encode text to Base64.","kind":"simple","label":"Text","placeholder":"Text to encode","expression":"btoa(unescape(encodeURIComponent(value)))"},
  {"slug":"base64-decoder","id":"niche.base64-decoder","name":"Base64 Decoder","description":"Decode Base64 to readable UTF-8 text.","kind":"simple","label":"Base64","placeholder":"SGVsbG8=","expression":"(() => { try { return decodeURIComponent(escape(atob(value.trim()))); } catch(e) { return 'Invalid Base64 input'; } })()"},
  {"slug":"url-encoder","id":"niche.url-encoder","name":"URL Encoder","description":"Percent-encode text for URLs.","kind":"simple","label":"Text","placeholder":"hello world","expression":"encodeURIComponent(value)"},
  {"slug":"case-converter","id":"niche.case-converter","name":"Case Converter","description":"Convert text to uppercase, lowercase, title case and sentence case.","kind":"simple","label":"Text","placeholder":"Type text here","expression":"'UPPER: ' + value.toUpperCase() + '\\\\nLOWER: ' + value.toLowerCase() + '\\\\nTITLE: ' + value.toLowerCase().replace(/\\\\b\\\\w/g, c => c.toUpperCase()) + '\\\\nSENTENCE: ' + value.replace(/(^|[.!?]\\\\s+)\\\\w/g, c => c.toUpperCase())"},
  {"slug":"line-sorter","id":"niche.line-sorter","name":"Line Sorter","description":"Sort lines alphabetically.","kind":"simple","label":"Lines","placeholder":"One item per line","expression":"value.split(/\\\\r?\\\\n/).sort((a,b)=>a.localeCompare(b)).join('\\\\n')"},
  {"slug":"duplicate-line-remover","id":"niche.duplicate-line-remover","name":"Duplicate Line Remover","description":"Remove repeated lines while preserving first occurrence.","kind":"simple","label":"Text","placeholder":"Paste lines","expression":"[...new Set(value.split(/\\\\r?\\\\n/))].join('\\\\n')"},
  {"slug":"text-reverser","id":"niche.text-reverser","name":"Text Reverser","description":"Reverse text by Unicode characters.","kind":"simple","label":"Text","placeholder":"Reverse me","expression":"Array.from(value).reverse().join('')"},
  {"slug":"slug-generator","id":"niche.slug-generator","name":"Slug Generator","description":"Turn a title into a URL-friendly slug.","kind":"simple","label":"Title","placeholder":"My Cool Plugin Name","expression":"value.normalize('NFD').replace(/[\\\\u0300-\\\\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')"},
  {"slug":"word-frequency","id":"niche.word-frequency","name":"Word Frequency","description":"Count word occurrences and rank most common.","kind":"simple","label":"Text","placeholder":"Paste text","expression":"Object.entries(value.toLowerCase().match(/[\\\\p{L}\\\\p{N}']+/gu)?.reduce((a,w)=>(a[w]=(a[w]||0)+1,a),{})||{}).sort((a,b)=>b[1]-a[1]).slice(0,20).map(([w,n])=>w+': '+n).join('\\\\n')||'No words found.'"},
  {"slug":"rot13","id":"niche.rot13","name":"ROT13 Encoder","description":"Encode or decode text using ROT13.","kind":"simple","label":"Text","placeholder":"Hello World","expression":"value.replace(/[a-z]/gi,c=>String.fromCharCode(c.charCodeAt(0)+(c.toLowerCase()<'n'?13:-13)))"},
  {"slug":"morse-encoder","id":"niche.morse-encoder","name":"Morse Encoder","description":"Convert letters and numbers to Morse code.","kind":"simple","label":"Text","placeholder":"SOS","expression":"(() => { const m={a:'.-',b:'-...',c:'-.-.',d:'-..',e:'.',f:'..-.',g:'--.',h:'....',i:'..',j:'.---',k:'-.-',l:'.-..',m:'--',n:'-.',o:'---',p:'.--.',q:'--.-',r:'.-.',s:'...',t:'-',u:'..-',v:'...-',w:'.--',x:'-..-',y:'-.--',z:'--..',0:'-----',1:'.----',2:'..---',3:'...--',4:'....-',5:'.....',6:'-....',7:'--...',8:'---..',9:'----.'}; return value.toLowerCase().split('').map(c=>c===' '?' / ':m[c]||'').join(' '); })()"},
  {"slug":"binary-converter","id":"niche.binary-converter","name":"Binary Converter","description":"Convert text to UTF-8 binary bytes.","kind":"simple","label":"Text","placeholder":"Hello","expression":"Array.from(new TextEncoder().encode(value)).map(b=>b.toString(2).padStart(8,'0')).join(' ')"},
  {"slug":"random-picker","id":"niche.random-picker","name":"Random Picker","description":"Pick one random entry from a newline-separated list.","kind":"simple","label":"Options (one per line)","placeholder":"Pizza\\\\nBurger\\\\nTacos","expression":"(() => { const a=value.split(/\\\\r?\\\\n/).map(x=>x.trim()).filter(Boolean); return a.length?a[Math.floor(Math.random()*a.length)]:'Add at least one option.'; })()"},
  {"slug":"percentage-calculator","id":"niche.percentage-calculator","name":"Percentage Calculator","description":"Calculate X percent of a number using format percent,number.","kind":"simple","label":"Percent, number","placeholder":"15, 240","expression":"(() => { const [p,n]=value.split(',').map(Number); return Number.isFinite(p)&&Number.isFinite(n)?(p/100*n).toString():'Enter percent, number (e.g. 15, 240)'; })()"},
  {"slug":"unix-time-converter","id":"niche.unix-time-converter","name":"Unix Time Converter","description":"Convert Unix seconds to local date and ISO format.","kind":"simple","label":"Unix seconds","placeholder":"1794852000","expression":"(() => { const n=Number(value); const d=new Date(n*1000); return Number.isFinite(n)&&!isNaN(d.getTime())?d.toLocaleString()+'\\\\n'+d.toISOString():'Enter Unix seconds.'; })()"},
  {"slug":"css-gradient-builder","id":"niche.css-gradient-builder","name":"CSS Gradient Builder","description":"Generate a simple CSS linear gradient from two hex colors.","kind":"simple","label":"Color1, Color2","placeholder":"#5865F2, #EB459E","expression":"(() => { const a=value.split(',').map(x=>x.trim()); return a.length===2&&a.every(x=>/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(x))?'background: linear-gradient(135deg, '+a[0]+', '+a[1]+');':'Enter two hex colors separated by a comma.'; })()"},
  {"slug":"rgb-to-hex","id":"niche.rgb-to-hex","name":"RGB to Hex","description":"Convert RGB values to a hex color.","kind":"simple","label":"R, G, B","placeholder":"88, 101, 242","expression":"(() => { const a=value.split(',').map(Number); return a.length===3&&a.every(n=>Number.isInteger(n)&&n>=0&&n<=255)?'#'+a.map(n=>n.toString(16).padStart(2,'0')).join('').toUpperCase():'Enter three integers from 0 to 255.'; })()"},
  {"slug":"markdown-checklist","id":"niche.markdown-checklist","name":"Checklist Builder","description":"Turn each line into a Discord Markdown checklist.","kind":"simple","label":"Tasks","placeholder":"Task one\\\\nTask two","expression":"value.split(/\\\\r?\\\\n/).filter(x=>x.trim()).map(x=>'- [ ] '+x.trim()).join('\\\\n')"},
  {"slug":"character-counter","id":"niche.character-counter","name":"Character Counter Pro","description":"Count letters, digits, spaces, punctuation and emoji.","kind":"simple","label":"Text","placeholder":"Paste text","expression":"'Letters: '+(value.match(/[\\\\p{L}]/gu)||[]).length+'\\\\nDigits: '+(value.match(/[0-9]/g)||[]).length+'\\\\nSpaces: '+(value.match(/\\\\s/g)||[]).length+'\\\\nPunctuation: '+(value.match(/[\\\\p{P}\\\\p{S}]/gu)||[]).length"},
  {"slug":"password-generator","id":"niche.password-generator","name":"Password Generator","description":"Generate a random password draft locally (not cryptographically guaranteed).","kind":"simple","label":"Length (8-64)","placeholder":"20","expression":"(() => { const n=Math.max(8,Math.min(64,Math.floor(Number(value)||20))); const c='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%'; return Array.from({length:n},()=>c[Math.floor(Math.random()*c.length)]).join(''); })()"},
  {"slug":"html-entity-encoder","id":"niche.html-entity-encoder","name":"HTML Escape Tool","description":"Escape HTML-sensitive characters.","kind":"simple","label":"Text","placeholder":"<script>alert(1)</script>","expression":"value.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\\\\\\\\\"/g,'&quot;').replace(/'/g,'&#39;')"},
  {"slug":"list-numberer","id":"niche.list-numberer","name":"List Numberer","description":"Number each non-empty line.","kind":"simple","label":"List","placeholder":"First\\\\nSecond\\\\nThird","expression":"value.split(/\\\\r?\\\\n/).filter(x=>x.trim()).map((x,i)=>(i+1)+'. '+x.trim()).join('\\\\n')"},
  {"slug":"quote-formatter","id":"niche.quote-formatter","name":"Quote Formatter","description":"Prefix each line with Discord quote syntax.","kind":"simple","label":"Text","placeholder":"Quote text","expression":"value.split(/\\\\r?\\\\n/).map(x=>'> '+x).join('\\\\n')"},
  {"slug":"emoji-remover","id":"niche.emoji-remover","name":"Emoji Remover","description":"Remove emoji and pictographic symbols from text.","kind":"simple","label":"Text","placeholder":"Text with 😀 emoji","expression":"value.replace(/[\\\\p{Extended_Pictographic}\\\\uFE0F]/gu,'')"},
  {"slug":"whitespace-cleaner","id":"niche.whitespace-cleaner","name":"Whitespace Cleaner","description":"Normalize spaces and trim each line.","kind":"simple","label":"Text","placeholder":"Paste text","expression":"value.split(/\\\\r?\\\\n/).map(x=>x.replace(/[ \\\\t]+/g,' ').trim()).join('\\\\n').trim()"}
]

function manifestFor(p) {
  return JSON.stringify({
    format: 1, id: p.id, name: p.name, description: p.description,
    author: 'Niche Games', version: p.kind === 'presence' ? '1.1.0' : '1.0.2',
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

const presenceSource = "import { Design } from '@valenced/discord/design'\nimport Page from '@valenced/components/Page'\nimport { callNativeMethod } from '@valenced/modules/native'\nimport { useState } from 'react'\n\nconst APPLICATION_ID = '1571988102912675900'\ntype Template = { name: string; details: string; state: string; imageKey: string; category: string }\ntype PresenceSettings = { template: string; gameName: string; details: string; state: string; imageKey: string; customTemplates: Template[]; startedAt?: number }\nconst templates: Template[] = [\n  { name: 'Grand Theft Auto VI', details: 'Exploring Vice City', state: 'In Story Mode', imageKey: 'gta6', category: 'Upcoming' },\n  { name: 'Grand Theft Auto V', details: 'Exploring Los Santos', state: 'In Story Mode', imageKey: 'gtav', category: 'Action' },\n  { name: 'Minecraft', details: 'Building and exploring', state: 'Survival Mode', imageKey: 'minecraft', category: 'Sandbox' },\n  { name: 'Fortnite', details: 'Ready for the next match', state: 'In the Lobby', imageKey: 'fortnite', category: 'Battle Royale' },\n  { name: 'Roblox', details: 'Exploring experiences', state: 'Playing', imageKey: 'roblox', category: 'Sandbox' },\n  { name: 'Call of Duty: Black Ops 7', details: 'Deploying into the action', state: 'Multiplayer', imageKey: 'blackops7', category: 'Shooter' },\n  { name: 'Marvel Rivals', details: 'Assembling the team', state: 'In a Match', imageKey: 'marvelrivals', category: 'Shooter' },\n  { name: 'Valorant', details: 'Queueing for ranked', state: 'Competitive', imageKey: 'valorant', category: 'Shooter' },\n  { name: 'Counter-Strike 2', details: 'Loading into a match', state: 'Competitive', imageKey: 'cs2', category: 'Shooter' },\n  { name: 'Apex Legends', details: 'Entering the arena', state: 'In a Match', imageKey: 'apex', category: 'Battle Royale' },\n  { name: 'Rocket League', details: 'Ready for kickoff', state: 'Online Match', imageKey: 'rocketleague', category: 'Sports' },\n  { name: 'EA SPORTS FC 26', details: 'Preparing for kickoff', state: 'Ultimate Team', imageKey: 'fc26', category: 'Sports' },\n  { name: 'Forza Horizon 6', details: 'Cruising the open world', state: 'Exploring', imageKey: 'forzahorizon6', category: 'Racing' },\n  { name: 'The Elder Scrolls VI', details: 'An adventure awaits', state: 'Exploring', imageKey: 'tes6', category: 'Upcoming' },\n  { name: 'The Witcher 4', details: 'The Path begins again', state: 'On the Path', imageKey: 'witcher4', category: 'Upcoming' },\n  { name: 'Marvel’s Wolverine', details: 'The hunt is on', state: 'Story Mode', imageKey: 'wolverine', category: 'Upcoming' },\n  { name: 'Fable', details: 'A new legend begins', state: 'Exploring Albion', imageKey: 'fable', category: 'Upcoming' },\n  { name: 'Light No Fire', details: 'Discovering a vast world', state: 'Exploring', imageKey: 'lightnofire', category: 'Upcoming' },\n]\nfunction RichPresenceSettings({ api }: { api: any }) {\n  const saved = api.jsonStorage.use() as PresenceSettings | undefined\n  const [customTemplates, setCustomTemplates] = useState<Template[]>(saved?.customTemplates ?? [])\n  const [template, setTemplate] = useState(saved?.template ?? 'Grand Theft Auto VI')\n  const initial = [...templates, ...(saved?.customTemplates ?? [])].find(item => item.name === (saved?.template ?? 'Grand Theft Auto VI')) ?? templates[0]\n  const [gameName, setGameName] = useState(saved?.gameName ?? initial.name)\n  const [details, setDetails] = useState(saved?.details ?? initial.details)\n  const [state, setState] = useState(saved?.state ?? initial.state)\n  const [imageKey, setImageKey] = useState(saved?.imageKey ?? initial.imageKey)\n  const [query, setQuery] = useState('')\n  const [customName, setCustomName] = useState('')\n  const [status, setStatus] = useState('Choose a game, edit the activity, then press Update Presence.')\n  const [startedAt, setStartedAt] = useState(saved?.startedAt ?? 0)\n  const allTemplates = [...templates, ...customTemplates]\n  const q = query.trim().toLowerCase()\n  const matches = (q ? allTemplates.filter(item => (item.name + ' ' + item.category).toLowerCase().includes(q)) : allTemplates).slice(0, 20)\n  const chooseTemplate = (item: Template) => {\n    setTemplate(item.name); setGameName(item.name); setDetails(item.details); setState(item.state); setImageKey(item.imageKey)\n    setStatus('Loaded ' + item.name + '. Press Update Presence to publish it.')\n  }\n  const persist = (nextStartedAt = startedAt) => api.jsonStorage.set({ template, gameName, details, state, imageKey, customTemplates, startedAt: nextStartedAt })\n  const createCustom = () => {\n    const name = customName.trim()\n    if (!name) { setStatus('Enter a game title first.'); return }\n    const item = { name, details: 'Playing ' + name, state: 'In Game', imageKey: '', category: 'Custom / Unreleased' }\n    const next = [...customTemplates.filter(x => x.name.toLowerCase() !== name.toLowerCase()), item]\n    setCustomTemplates(next); setTemplate(name); setGameName(name); setDetails(item.details); setState(item.state); setImageKey('')\n    setCustomName(''); setStatus('Custom game added. Configure it below, then update presence.')\n  }\n  const updatePresence = async () => {\n    if (!gameName.trim()) { setStatus('Enter a game name first.'); return }\n    const start = Date.now()\n    setStatus('Connecting to Discord and publishing your activity…')\n    try {\n      const result = await callNativeMethod('domms.presence.update' as any, [APPLICATION_ID, gameName.trim(), details.trim(), state.trim(), imageKey.trim(), start] as any)\n      setStartedAt(start)\n      api.jsonStorage.set({ template, gameName, details, state, imageKey, customTemplates, startedAt: start })\n      setStatus('Presence update sent to Discord. The elapsed timer starts from now.')\n    } catch (error) {\n      setStatus('Presence update failed: ' + String(error))\n    }\n  }\n  const clearPresence = async () => {\n    setStatus('Clearing Discord activity…')\n    try {\n      await callNativeMethod('domms.presence.clear' as any, [] as any)\n      setStartedAt(0); persist(0)\n      setStatus('Discord activity cleared.')\n    } catch (error) { setStatus('Could not clear activity: ' + String(error)) }\n  }\n  return <Page>\n    <Design.TableRowGroup title='Game catalogue'>\n      <Design.Text>Search the built-in games or create any custom title, including unreleased games. The Discord Application ID remains your own.</Design.Text>\n      <Design.TextInput label='Search games' placeholder='Search by title or genre…' defaultValue='' onChange={setQuery} />\n      {matches.map(item => <Design.Button key={item.name} text={item.name + ' · ' + item.category} onPress={() => chooseTemplate(item)} />)}\n      <Design.Text>{matches.length ? matches.length + ' templates shown. Search to narrow the list.' : 'No matching game. Add it as a custom title below.'}</Design.Text>\n      <Design.TextInput label='Custom or unreleased game title' placeholder='Any game title' defaultValue={customName} onChange={setCustomName} />\n      <Design.Button text='Add custom game' onPress={createCustom} />\n    </Design.TableRowGroup>\n    <Design.TableRowGroup title='Activity settings'>\n      <Design.TextInput label='Game shown in activity' placeholder='Game name' defaultValue={gameName} onChange={setGameName} />\n      <Design.TextInput label='Details' placeholder='Exploring the map' defaultValue={details} onChange={setDetails} />\n      <Design.TextInput label='State' placeholder='In a match' defaultValue={state} onChange={setState} />\n      <Design.TextInput label='Large image asset key' placeholder='Your Discord app asset key' defaultValue={imageKey} onChange={setImageKey} />\n      <Design.Text>Discord Application ID: {APPLICATION_ID}</Design.Text>\n      <Design.Text>Upload matching image assets under this application in the Discord Developer Portal. Image keys are optional.</Design.Text>\n    </Design.TableRowGroup>\n    <Design.TableRowGroup title='Live Rich Presence'>\n      <Design.Text>Press Update Presence to publish a Playing activity with an elapsed-time counter. Updating starts the timer again.</Design.Text>\n      <Design.Button text='Update Presence' onPress={updatePresence} />\n      <Design.Button text='Clear Presence' onPress={clearPresence} />\n      <Design.Text>{startedAt ? 'Last started: ' + new Date(startedAt).toLocaleString() : 'No session timer started yet.'}</Design.Text>\n      <Design.Text>{status}</Design.Text>\n    </Design.TableRowGroup>\n    <Design.TableRowGroup title='Preview'>\n      <Design.Text>Playing {gameName || 'Game name'}</Design.Text>\n      <Design.Text>{details || 'Details'}</Design.Text>\n      <Design.Text>{state || 'State'}</Design.Text>\n      <Design.Text>Image asset: {imageKey || 'Not set'}</Design.Text>\n    </Design.TableRowGroup>\n  </Page>\n}\nexport default plugin<{ jsonStorage: PresenceSettings }>({\n  jsonStorage: { load: true, default: { template: 'Grand Theft Auto VI', gameName: 'Grand Theft Auto VI', details: 'Exploring Vice City', state: 'In Story Mode', imageKey: 'gta6', customTemplates: [], startedAt: 0 } },\n  SettingsComponent: RichPresenceSettings,\n})\n"

const fakeNitroSource = [
  "import { getModules } from '@valenced/modules/finders'",
  "import { withProps } from '@valenced/modules/finders/filters'",
  "import { instead } from '@valenced/patcher'",
  "import { Design } from '@valenced/discord/design'",
  '',
  'interface Settings { enabled: boolean; streaming: boolean }',
  '',
  'export default plugin<{ jsonStorage: Settings }>({',
  '  jsonStorage: { load: true, default: { enabled: true, streaming: true } },',
  '  start({ cleanup, jsonStorage }) {',
  "    cleanup(getModules(withProps<any>('canUserUse'), Catalog => {",
  "      cleanup(instead(Catalog, 'canUserUse', function (args, original) {",
  '        const settings = jsonStorage.cache ?? { enabled: true, streaming: true }',
  '        if (settings.enabled && (args[0] === this.CLIENT_THEMES || args[0] === this.STICKERS_EVERYWHERE || args[0] === this.APP_ICONS)) return true',
  '        if (settings.enabled && settings.streaming && (args[0] === this.STREAM_MID_QUALITY || args[0] === this.STREAM_HIGH_QUALITY)) return true',
  '        return Reflect.apply(original, this, args)',
  '      }))',
  '    }))',
  '  },',
  '  SettingsComponent({ api }) {',
  '    const settings = api.jsonStorage.use()',
  '    return <Design.TableRowGroup title="Fake Nitro (local client)">',
  '      <Design.TableSwitchRow label="Client-side cosmetic features" subLabel="Enable supported themes, app icons and sticker UI locally." value={settings.enabled} onValueChange={enabled => api.jsonStorage.set({ enabled })} />',
  '      <Design.TableSwitchRow label="Higher stream quality UI" subLabel="Client-side feature check only. Server restrictions may still apply." value={settings.streaming} onValueChange={streaming => api.jsonStorage.set({ streaming })} />',
  '    </Design.TableRowGroup>',
  '  },',
  '})',
  ''
].join('\n')

const noidleSource = [
  "import { onFluxEventDispatched } from '@valenced/discord/flux'",
  '',
  'export default plugin({',
  '  start({ cleanup }) {',
  "    cleanup(onFluxEventDispatched('IDLE', payload => { payload.idle = false; return payload }))",
  '  },',
  '})',
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
  '      if (jsonStorage.cache?.enabled ?? true) return undefined',
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
  const src = p.kind === 'catalog' ? catalogSource : p.kind === 'presence' ? presenceSource : p.kind === 'silent' ? silentSource : p.kind === 'noidle' ? noidleSource : p.kind === 'fakenitro' ? fakeNitroSource : simpleSource(p)
  await writeFile(join(dir, 'manifest.json'), manifestFor(p))
  await writeFile(join(dir, 'js/index.tsx'), src)
}
if (plugins.length !== 48) throw new Error('Expected 48 plugin definitions; found ' + plugins.length)
console.log('Generated ' + plugins.length + ' Valenced plugin folders.')
