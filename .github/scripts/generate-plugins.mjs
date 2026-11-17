import { mkdir, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const plugins = [
  { slug: 'fake-nitro-preview', id: 'niche.fake-nitro-preview', name: 'Fake Nitro Preview', description: 'Preview Nitro-style profile visuals locally. This does not unlock paid features or server permissions.', kind: 'simple', label: 'Display name', placeholder: 'Your display name', expression: "value.trim() ? '✨ ' + value.trim() + ' · Nitro-style local preview' : 'Enter a display name to preview the cosmetic profile card.'" },
  { slug: 'fake-nitro', id: 'niche.fake-nitro', name: 'Fake Nitro', description: 'Enable supported local Nitro-style client features such as client themes, app icons and sticker rendering. Does not grant server entitlements.', kind: 'fakenitro' },
  { slug: 'discord-game-catalog', id: 'niche.discord-game-catalog', name: 'Discord Game Catalog', description: "Search Discord's public detectable-games catalog and inspect game application IDs.", kind: 'catalog' },
  { slug: 'domms-games-presence', id: 'domms.games.presence', name: 'Domms Games Presence', description: 'Select a game, customise activity details and state, then publish or clear Discord Rich Presence through the Discord Social SDK.', kind: 'presence' },
  { slug: 'profile-card-preview', id: 'niche.profile-card-preview', name: 'Profile Card Preview', description: 'Preview a display name and short profile card locally.', kind: 'simple', label: 'Display name', placeholder: 'Display name', expression: "value.trim() ? 'PROFILE PREVIEW\\n' + value.trim() + '\\nAdd your bio in Discord settings.' : 'Enter a display name to build a local preview.'" },
  { slug: 'badge-gallery-preview', id: 'niche.badge-gallery-preview', name: 'Badge Gallery Preview', description: 'Mock up a local badge row for profile design ideas. These are not official Discord badges.', kind: 'simple', label: 'Badge labels', placeholder: 'Early Supporter, HypeSquad', expression: "value.trim() ? value.split(',').map(x => '🏷️ ' + x.trim()).filter(Boolean).join('  ·  ') : 'Add comma-separated labels to preview a badge row.'" },
  { slug: 'status-draft-vault', id: 'niche.status-draft-vault', name: 'Custom Status Drafts', description: 'Save reusable custom status text presets locally. Copy them into Discord when needed.', kind: 'presets', label: 'Status text', placeholder: 'Grinding ranked...', expression: "value.trim() ? 'Status draft: ' + value.trim() : 'Type a status draft.'" },
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
  {"slug":"whitespace-cleaner","id":"niche.whitespace-cleaner","name":"Whitespace Cleaner","description":"Normalize spaces and trim each line.","kind":"simple","label":"Text","placeholder":"Paste text","expression":"value.split(/\\\\r?\\\\n/).map(x=>x.replace(/[ \\\\t]+/g,' ').trim()).join('\\\\n').trim()"},

  { slug: 'uwu-text-converter', id: 'niche.uwu-text-converter', name: 'Uwu Text Converter', description: 'Convert pasted text into an uwu-style version. Preview only; it does not intercept messages you send.', kind: 'simple', label: 'Text to convert', placeholder: 'Hello, how are you?', expression: "value.replace(/[rl]/gi, 'w').replace(/n([aeiou])/gi, 'ny$1').replace(/ove/gi, 'uv')" },
  { slug: 'text-replacer', id: 'niche.text-replacer', name: 'Text Replacer', description: 'Apply find=>replace rules to pasted text. One rule per line; local text tool.', kind: 'simple', label: 'Text and rules', placeholder: 'TEXT: hello world\nRULE: hello=>hi', expression: "(() => { const lines=value.split(/\\r?\\n/); let text=lines.filter(x=>x.startsWith('TEXT:')).join('\\n').slice(5); for(const line of lines.filter(x=>x.startsWith('RULE:'))){const rule=line.slice(5).split('=>');if(rule.length>=2&&rule[0])text=text.split(rule[0]).join(rule.slice(1).join('=>'));} return text || 'Add TEXT: followed by your text, then RULE: old=>new lines.'; })()" },
  { slug: 'message-splitter', id: 'niche.message-splitter', name: 'Message Splitter', description: 'Split a long draft into chunks that fit a 2,000-character message limit. Does not bypass upload or server limits.', kind: 'simple', label: 'Message draft', placeholder: 'Paste a long message...', expression: "(() => { const limit=2000; const out=[]; let rest=value; while(rest.length>limit){let cut=rest.lastIndexOf(' ',limit);if(cut<limit*0.55)cut=limit;out.push(rest.slice(0,cut));rest=rest.slice(cut).trimStart();}if(rest)out.push(rest);return out.map((x,i)=>'PART '+(i+1)+' ('+x.length+' chars)\\n'+x).join('\\n\\n')||'Paste a message to split.'; })()" },
  { slug: 'status-presets-draft', id: 'niche.status-presets-draft', name: 'Status Presets Draft', description: 'Prepare multiple custom status lines to copy into Discord. Does not change account status automatically.', kind: 'simple', label: 'Status presets', placeholder: 'Gaming\nAt work\nAway for a bit', expression: "value.split(/\\r?\\n/).map((x,i)=>x.trim()?((i+1)+'. '+x.trim()):'').filter(Boolean).join('\\n') || 'Add one status per line.'" },
  { slug: 'timestamp-locale-tool', id: 'niche.timestamp-locale-tool', name: 'Timestamp Locale Tool', description: 'Preview a date in a chosen locale and create a Discord timestamp tag. Does not alter Discord globally.', kind: 'simple', label: 'Date, locale (optional)', placeholder: '2026-12-25 18:00, en-GB', expression: "(() => { const [raw,locale='en-GB']=value.split(',').map(x=>x.trim());const d=new Date(raw);if(isNaN(d.getTime()))return 'Enter a valid date and optional locale.';return d.toLocaleString(locale)+'\\nDiscord tag: <t:'+Math.floor(d.getTime()/1000)+':F>'; })()" },
  { slug: 'server-notes-scratchpad', id: 'niche.server-notes-scratchpad', name: 'Server Notes Scratchpad', description: 'A local notes scratchpad for server reminders. Notes are not automatically linked to a selected server.', kind: 'notes', label: 'Notes', placeholder: 'Rules, reminders, useful links...', expression: "value.trim() ? value.trim() : 'Write a note or reminder here.'" },
  { slug: 'media-favourites-organizer', id: 'niche.media-favourites-organizer', name: 'Media Favourites Organizer', description: 'Organize pasted media URLs into a simple list. Does not fetch or download media.', kind: 'simple', label: 'Media URLs', placeholder: 'https://example.com/image.gif', expression: "value.split(/\\r?\\n/).map(x=>x.trim()).filter(x=>/^https?:\\/\\//i.test(x)).map((x,i)=>(i+1)+'. '+x).join('\\n') || 'Paste one http(s) media URL per line.'" },
  { slug: 'gif-tag-organizer', id: 'niche.gif-tag-organizer', name: 'GIF Tag Organizer', description: 'Create a tagged list of GIF links for organizing your own collection. Does not modify Discord GIF search.', kind: 'simple', label: 'Tag | GIF URL', placeholder: 'reaction | https://example.com/reaction.gif', expression: "value.split(/\\r?\\n/).map(x=>x.trim()).filter(Boolean).map((x,i)=>{const p=x.split('|');return (i+1)+'. ['+(p[0]||'untagged').trim()+'] '+(p.slice(1).join('|')||'No URL').trim()}).join('\\n') || 'Add entries as tag | URL.'" },
  { slug: 'fire-text-converter', id: 'niche.fire-text-converter', name: 'Fire Text Converter', description: 'Create a fire-style text draft using emoji decoration. Preview only.', kind: 'simple', label: 'Text', placeholder: 'That was incredible', expression: "value.trim() ? '🔥 '+value.trim().split(/\\s+/).join(' 🔥 ')+' 🔥' : 'Enter text to decorate.'" },
  { slug: 'pastel-name-generator', id: 'niche.pastel-name-generator', name: 'Pastel Name Generator', description: 'Generate pastel-style name variants for a profile preview. Does not recolor other users in Discord.', kind: 'simple', label: 'Name', placeholder: 'Your name', expression: "value.trim() ? '୨୧ '+value.trim()+' ୨୧\\n♡ '+value.trim()+' ♡\\n✿ '+value.trim()+' ✿' : 'Enter a name to preview variants.'" },
]

function manifestFor(p) {
  return JSON.stringify({
    format: 1, id: p.id, name: p.name, description: p.description,
    author: 'Niche Games', version: p.kind === 'presence' ? '1.1.0' : '1.0.2',
    dependencies: { 'valenced.api': { version: '>=1 <2' }, discord: { version: '*' } },
    dist: p.kind === 'presence' ? { script: 'index.js', android: { path: 'android/plugin.jar', class: 'com.domms.presence.DommsGamesPresence' } } : { script: 'index.js' }
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

const presenceSource = "import { Design } from '@valenced/discord/design'\nimport Page from '@valenced/components/Page'\nimport { callNativeMethod } from '@valenced/modules/native'\nimport { useState } from 'react'\n\nconst APPLICATION_ID = '1571988102912675900'\ntype Template = { name: string; details: string; state: string; imageKey: string; category: string }\ntype PresenceSettings = { template: string; gameName: string; details: string; state: string; imageKey: string; customTemplates: Template[]; startedAt?: number }\nconst templates: Template[] = [\n  { name: 'Grand Theft Auto VI', details: 'Exploring Vice City', state: 'In Story Mode', imageKey: 'gta6', category: 'Upcoming' },\n  { name: 'Grand Theft Auto V', details: 'Exploring Los Santos', state: 'In Story Mode', imageKey: 'gtav', category: 'Action' },\n  { name: 'Minecraft', details: 'Building and exploring', state: 'Survival Mode', imageKey: 'minecraft', category: 'Sandbox' },\n  { name: 'Fortnite', details: 'Ready for the next match', state: 'In the Lobby', imageKey: 'fortnite', category: 'Battle Royale' },\n  { name: 'Roblox', details: 'Exploring experiences', state: 'Playing', imageKey: 'roblox', category: 'Sandbox' },\n  { name: 'Call of Duty: Black Ops 7', details: 'Deploying into the action', state: 'Multiplayer', imageKey: 'blackops7', category: 'Shooter' },\n  { name: 'Marvel Rivals', details: 'Assembling the team', state: 'In a Match', imageKey: 'marvelrivals', category: 'Shooter' },\n  { name: 'Valorant', details: 'Queueing for ranked', state: 'Competitive', imageKey: 'valorant', category: 'Shooter' },\n  { name: 'Counter-Strike 2', details: 'Loading into a match', state: 'Competitive', imageKey: 'cs2', category: 'Shooter' },\n  { name: 'Apex Legends', details: 'Entering the arena', state: 'In a Match', imageKey: 'apex', category: 'Battle Royale' },\n  { name: 'Rocket League', details: 'Ready for kickoff', state: 'Online Match', imageKey: 'rocketleague', category: 'Sports' },\n  { name: 'EA SPORTS FC 26', details: 'Preparing for kickoff', state: 'Ultimate Team', imageKey: 'fc26', category: 'Sports' },\n  { name: 'Forza Horizon 6', details: 'Cruising the open world', state: 'Exploring', imageKey: 'forzahorizon6', category: 'Racing' },\n  { name: 'The Elder Scrolls VI', details: 'An adventure awaits', state: 'Exploring', imageKey: 'tes6', category: 'Upcoming' },\n  { name: 'The Witcher 4', details: 'The Path begins again', state: 'On the Path', imageKey: 'witcher4', category: 'Upcoming' },\n  { name: 'Marvel’s Wolverine', details: 'The hunt is on', state: 'Story Mode', imageKey: 'wolverine', category: 'Upcoming' },\n  { name: 'Fable', details: 'A new legend begins', state: 'Exploring Albion', imageKey: 'fable', category: 'Upcoming' },\n  { name: 'Light No Fire', details: 'Discovering a vast world', state: 'Exploring', imageKey: 'lightnofire', category: 'Upcoming' },,\n  { name: 'Half-Life: Alyx', details: 'Entering City 17', state: 'VR Campaign', imageKey: 'halflifealyx', category: 'VR / Legendary' },\n  { name: 'Half-Life 3', details: 'The wait is finally over', state: 'Chapter One', imageKey: 'halflife3', category: 'Legendary / Fictional' },\n  { name: 'Portal 2', details: 'Solving test chambers', state: 'Co-op testing', imageKey: 'portal2', category: 'Puzzle' },\n  { name: 'Bloodborne', details: 'Hunting through Yharnam', state: 'Fear the Old Blood', imageKey: 'bloodborne', category: 'Cult Classic' },\n  { name: 'Red Dead Redemption 2', details: 'Riding through the heartlands', state: 'Wanted: Dead or Alive', imageKey: 'rdr2', category: 'Open World' },\n  { name: 'Cyberpunk 2077', details: 'Exploring Night City', state: 'Afterlife regular', imageKey: 'cyberpunk2077', category: 'RPG' },\n  { name: 'Elden Ring: Shadow of the Erdtree', details: 'Conquering the Land of Shadow', state: 'New Game Plus', imageKey: 'eldenringdlc', category: 'Soulslike' },\n  { name: 'Dwarf Fortress', details: ' !!FUN!! is happening', state: 'Losing another fortress', imageKey: 'dwarffortress', category: 'Deep Cut' },\n  { name: 'Microsoft Flight Simulator 2024', details: 'Crossing the Atlantic', state: 'Live flight · FL350', imageKey: 'flightsim2024', category: 'Simulation' },\n  { name: 'iRacing', details: 'Qualifying for the 24 Hours', state: 'Safety rating on the line', imageKey: 'iracing', category: 'Simulation' },\n  { name: 'Escape from Tarkov', details: 'Extracting with a full bag', state: 'One more raid', imageKey: 'tarkov', category: 'Hardcore' },\n  { name: 'Arma Reforger', details: 'Coordinating an operation', state: 'MilSim · Radio silence', imageKey: 'armareforger', category: 'MilSim' },\n  { name: 'Star Citizen', details: 'Crossing the Stanton system', state: 'Quantum travel', imageKey: 'starcitizen', category: 'Space Sim' },\n  { name: 'Squad', details: 'Holding the objective', state: 'Mic check · Squad lead', imageKey: 'squad', category: 'MilSim' },\n  { name: 'EVE Online', details: 'Moving a fleet through null-sec', state: 'Please do not disturb', imageKey: 'eveonline', category: 'MMO' },\n  { name: 'Old School RuneScape', details: 'Grinding another 99', state: 'No XP waste', imageKey: 'osrs', category: 'MMO' },\n  { name: 'Garry’s Mod', details: 'Building something cursed', state: 'Sandbox chaos', imageKey: 'garrysmod', category: 'Sandbox' },\n  { name: 'VRChat', details: 'Meeting people across the metaverse', state: 'Avatar hopping', imageKey: 'vrchat', category: 'Social VR' },\n  { name: 'Euro Truck Simulator 2', details: 'Delivering across Europe', state: 'Long-haul · Radio on', imageKey: 'ets2', category: 'Simulation' },\n  { name: 'GeoGuessr', details: 'Somewhere on Earth', state: '5,000 points or nothing', imageKey: 'geoguessr', category: 'Skill' },\n  { name: 'Hollow Knight: Silksong', details: 'Exploring Pharloom', state: 'No spoilers', imageKey: 'silksong', category: 'Indie' },\n  { name: 'Baldur’s Gate 3', details: 'Making questionable choices', state: 'Honour Mode', imageKey: 'baldursgate3', category: 'RPG' },\n  { name: 'The Sims 4', details: 'Building an architectural masterpiece', state: 'Definitely not using cheats', imageKey: 'thesims4', category: 'Simulation' },\n  { name: 'PowerWash Simulator 2', details: 'Restoring order to the universe', state: '100% clean', imageKey: 'powerwash2', category: 'Unexpected' },\n  { name: 'Papers, Please', details: 'Glory to Arstotzka', state: 'Next applicant', imageKey: 'papersplease', category: 'Cult Classic' },\n  { name: 'Tony Hawk’s Pro Skater 3 + 4', details: 'Chasing the perfect combo', state: 'Sick score', imageKey: 'thps34', category: 'Sports' },\n]\nfunction RichPresenceSettings({ api }: { api: any }) {\n  const saved = api.jsonStorage.use() as PresenceSettings | undefined\n  const [customTemplates, setCustomTemplates] = useState<Template[]>(saved?.customTemplates ?? [])\n  const [template, setTemplate] = useState(saved?.template ?? 'Grand Theft Auto VI')\n  const initial = [...templates, ...(saved?.customTemplates ?? [])].find(item => item.name === (saved?.template ?? 'Grand Theft Auto VI')) ?? templates[0]\n  const [gameName, setGameName] = useState(saved?.gameName ?? initial.name)\n  const [details, setDetails] = useState(saved?.details ?? initial.details)\n  const [state, setState] = useState(saved?.state ?? initial.state)\n  const [imageKey, setImageKey] = useState(saved?.imageKey ?? initial.imageKey)\n  const [query, setQuery] = useState('')\n  const [customName, setCustomName] = useState('')\n  const [status, setStatus] = useState('Choose a game, edit the activity, then press Update Presence.')\n  const [startedAt, setStartedAt] = useState(saved?.startedAt ?? 0)\n  const allTemplates = [...templates, ...customTemplates]\n  const q = query.trim().toLowerCase()\n  const matches = q ? allTemplates.filter(item => (item.name + ' ' + item.category).toLowerCase().includes(q)).slice(0, 20) : []\n  const chooseTemplate = (item: Template) => {\n    setTemplate(item.name); setGameName(item.name); setDetails(item.details); setState(item.state); setImageKey(item.imageKey)\n    setStatus('Loaded ' + item.name + '. Press Update Presence to publish it.')\n  }\n  const persist = (nextStartedAt = startedAt) => api.jsonStorage.set({ template, gameName, details, state, imageKey, customTemplates, startedAt: nextStartedAt })\n  const createCustom = () => {\n    const name = customName.trim()\n    if (!name) { setStatus('Enter a game title first.'); return }\n    const item = { name, details: 'Playing ' + name, state: 'In Game', imageKey: '', category: 'Custom / Unreleased' }\n    const next = [...customTemplates.filter(x => x.name.toLowerCase() !== name.toLowerCase()), item]\n    setCustomTemplates(next); setTemplate(name); setGameName(name); setDetails(item.details); setState(item.state); setImageKey('')\n    setCustomName(''); setStatus('Custom game added. Configure it below, then update presence.')\n  }\n  const updatePresence = async () => {\n    if (!gameName.trim()) { setStatus('Enter a game name first.'); return }\n    const start = Date.now()\n    setStatus('Connecting to Discord and publishing your activity…')\n    try {\n      const result = await callNativeMethod('domms.presence.update' as any, [APPLICATION_ID, gameName.trim(), details.trim(), state.trim(), imageKey.trim(), start] as any)\n      setStartedAt(start)\n      api.jsonStorage.set({ template, gameName, details, state, imageKey, customTemplates, startedAt: start })\n      setStatus('Presence update sent to Discord. The elapsed timer starts from now.')\n    } catch (error) {\n      setStatus('Presence update failed: ' + String(error))\n    }\n  }\n  const clearPresence = async () => {\n    setStatus('Clearing Discord activity…')\n    try {\n      await callNativeMethod('domms.presence.clear' as any, [] as any)\n      setStartedAt(0); persist(0)\n      setStatus('Discord activity cleared.')\n    } catch (error) { setStatus('Could not clear activity: ' + String(error)) }\n  }\n  return <Page>\n    <Design.TableRowGroup title='Game catalogue'>\n      <Design.Text>Search the built-in games or create any custom title, including unreleased games. The Discord Application ID remains your own.</Design.Text>\n      <Design.TextInput label='Search games' placeholder='Search by title or genre…' defaultValue='' onChange={setQuery} />\n      {matches.map(item => <Design.Button key={item.name} text={item.name + ' · ' + item.category} onPress={() => chooseTemplate(item)} />)}\n      <Design.Text>{!q ? 'Type a game name to search. Your settings are shown below.' : (matches.length ? matches.length + ' templates shown.' : 'No matching game. Add it as a custom title below.')}</Design.Text>\n      <Design.TextInput label='Custom or unreleased game title' placeholder='Any game title' defaultValue={customName} onChange={setCustomName} />\n      <Design.Button text='Add custom game' onPress={createCustom} />\n    </Design.TableRowGroup>\n    <Design.TableRowGroup title='Activity settings'>\n      <Design.TextInput label='Game shown in activity' placeholder='Game name' defaultValue={gameName} onChange={setGameName} />\n      <Design.TextInput label='Details' placeholder='Exploring the map' defaultValue={details} onChange={setDetails} />\n      <Design.TextInput label='State' placeholder='In a match' defaultValue={state} onChange={setState} />\n      <Design.TextInput label='Large image asset key' placeholder='Your Discord app asset key' defaultValue={imageKey} onChange={setImageKey} />\n      <Design.Text>Discord Application ID: {APPLICATION_ID}</Design.Text>\n      <Design.Text>Upload matching image assets under this application in the Discord Developer Portal. Image keys are optional.</Design.Text>\n    </Design.TableRowGroup>\n    <Design.TableRowGroup title='Live Rich Presence'>\n      <Design.Text>Press Update Presence to publish a Playing activity with an elapsed-time counter. Updating starts the timer again.</Design.Text>\n      <Design.Button text='Update Presence' onPress={updatePresence} />\n      <Design.Button text='Clear Presence' onPress={clearPresence} />\n      <Design.Text>{startedAt ? 'Last started: ' + new Date(startedAt).toLocaleString() : 'No session timer started yet.'}</Design.Text>\n      <Design.Text>{status}</Design.Text>\n    </Design.TableRowGroup>\n    <Design.TableRowGroup title='Preview'>\n      <Design.Text>Playing {gameName || 'Game name'}</Design.Text>\n      <Design.Text>{details || 'Details'}</Design.Text>\n      <Design.Text>{state || 'State'}</Design.Text>\n      <Design.Text>Image asset: {imageKey || 'Not set'}</Design.Text>\n    </Design.TableRowGroup>\n  </Page>\n}\nexport default plugin<{ jsonStorage: PresenceSettings }>({\n  jsonStorage: { load: true, default: { template: 'Grand Theft Auto VI', gameName: 'Grand Theft Auto VI', details: 'Exploring Vice City', state: 'In Story Mode', imageKey: 'gta6', customTemplates: [], startedAt: 0 } },\n  SettingsComponent: RichPresenceSettings,\n})\n"

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

const notesSource = [
  "import { Design } from '@valenced/discord/design'",
  "import { useState } from 'react'",
  '',
  'type Note = { title: string; body: string; updatedAt: number }',
  'type Store = { notes: Note[] }',
  'function NotesSettings({ api }: { api: any }) {',
  '  const saved = api.jsonStorage.use() as Store | undefined',
  '  const notes = saved?.notes ?? []',
  "  const [title, setTitle] = useState('')",
  "  const [body, setBody] = useState('')",
  "  const [status, setStatus] = useState('Notes are saved locally on this device.')",
  '  const save = () => {',
  "    if (!title.trim() && !body.trim()) { setStatus('Enter a title or note first.'); return }",
  '    api.jsonStorage.set({ notes: [{ title: title.trim() || "Untitled", body, updatedAt: Date.now() }, ...notes].slice(0, 100) })',
  "    setTitle(''); setBody(''); setStatus('Note saved.')",
  '  }',
  '  const remove = (index: number) => api.jsonStorage.set({ notes: notes.filter((_, i) => i !== index) })',
  '  return <Design.TableRowGroup title="Saved server notes">',
  '    <Design.Text>Persistent local notes. They are not uploaded or automatically associated with a server.</Design.Text>',
  '    <Design.TextInput label="Note title" placeholder="Server rules" defaultValue={title} onChange={setTitle} />',
  '    <Design.TextInput label="Note" placeholder="Add reminders, links or details…" defaultValue={body} onChange={setBody} />',
  '    <Design.Button text="Save note" onPress={save} />',
  '    <Design.Text>{status}</Design.Text>',
  '    {notes.map((note, index) => <Design.TableRowGroup key={index} title={note.title}>',
  '      <Design.Text>{note.body}</Design.Text>',
  '      <Design.Text>{new Date(note.updatedAt).toLocaleString()}</Design.Text>',
  '      <Design.Button text="Delete note" onPress={() => remove(index)} />',
  '    </Design.TableRowGroup>)}',
  '    {!notes.length ? <Design.Text>No saved notes yet.</Design.Text> : null}',
  '  </Design.TableRowGroup>',
  '}',
  'export default plugin<{ jsonStorage: Store }>({ jsonStorage: { load: true, default: { notes: [] } }, SettingsComponent: NotesSettings })',
  ''
].join('\n')

const presetsSource = [
  "import { Design } from '@valenced/discord/design'",
  "import { useState } from 'react'",
  'type Store = { presets: string[] }',
  'function PresetSettings({ api }: { api: any }) {',
  '  const saved = api.jsonStorage.use() as Store | undefined',
  '  const presets = saved?.presets ?? []',
  "  const [draft, setDraft] = useState('')",
  "  const [status, setStatus] = useState('Presets are stored locally.')",
  '  const add = () => { if (!draft.trim()) { setStatus("Enter a status first."); return }; api.jsonStorage.set({ presets: [...presets, draft.trim()].slice(-50) }); setDraft(""); setStatus("Preset saved.") }',
  '  const remove = (index: number) => api.jsonStorage.set({ presets: presets.filter((_, i) => i !== index) })',
  '  return <Design.TableRowGroup title="Saved status presets">',
  '    <Design.TextInput label="Status text" placeholder="Playing with friends…" defaultValue={draft} onChange={setDraft} />',
  '    <Design.Button text="Save preset" onPress={add} />',
  '    <Design.Text>{status}</Design.Text>',
  '    {presets.map((item, index) => <Design.TableRowGroup key={index} title={"Preset " + (index + 1)}><Design.Text>{item}</Design.Text><Design.Button text="Delete" onPress={() => remove(index)} /></Design.TableRowGroup>)}',
  '    {!presets.length ? <Design.Text>No presets saved yet.</Design.Text> : null}',
  '  </Design.TableRowGroup>',
  '}',
  'export default plugin<{ jsonStorage: Store }>({ jsonStorage: { load: true, default: { presets: [] } }, SettingsComponent: PresetSettings })',
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


const extraPlugins = [
  {
    "slug": "welcome-message-builder",
    "id": "niche.welcome-message-builder",
    "name": "Welcome Message Builder",
    "description": "Welcome Message Builder is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "value.trim().split(/\\r?\\n/).filter(Boolean).map(x=>'- [ ] '+x.trim()).join('\\n') || 'Add tasks, one per line.'"
  },
  {
    "slug": "farewell-message-builder",
    "id": "niche.farewell-message-builder",
    "name": "Farewell Message Builder",
    "description": "Farewell Message Builder is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "value.trim().split(/\\r?\\n/).filter(Boolean).map((x,i)=>(i+1)+'. '+x.trim()).join('\\n') || 'Add items, one per line.'"
  },
  {
    "slug": "announcement-drafts",
    "id": "niche.announcement-drafts",
    "name": "Announcement Drafts",
    "description": "Announcement Drafts is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "value.trim().split(/\\r?\\n/).filter(Boolean).map(x=>'• '+x.trim()).join('\\n') || 'Add items, one per line.'"
  },
  {
    "slug": "event-planner",
    "id": "niche.event-planner",
    "name": "Event Planner",
    "description": "Event Planner is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "'Characters: '+value.length+' | Words: '+(value.trim()?value.trim().split(/\\s+/).length:0)+' | Lines: '+(value?value.split(/\\r?\\n/).length:0)"
  },
  {
    "slug": "poll-builder",
    "id": "niche.poll-builder",
    "name": "Poll Builder",
    "description": "Poll Builder is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "[...new Set(value.split(/\\r?\\n/).map(x=>x.trim()).filter(Boolean))].join('\\n') || 'Add lines to remove duplicates.'"
  },
  {
    "slug": "giveaway-planner",
    "id": "niche.giveaway-planner",
    "name": "Giveaway Planner",
    "description": "Giveaway Planner is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "value.split(/\\r?\\n/).map(x=>x.trim()).filter(Boolean).sort((a,b)=>a.localeCompare(b)).join('\\n') || 'Add lines to sort.'"
  },
  {
    "slug": "server-rules-builder",
    "id": "niche.server-rules-builder",
    "name": "Server Rules Builder",
    "description": "Server Rules Builder is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "value.trim().replace(/\\s+/g,' ') || 'Enter text to clean.'"
  },
  {
    "slug": "faq-builder",
    "id": "niche.faq-builder",
    "name": "FAQ Builder",
    "description": "FAQ Builder is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "value.trim().toLowerCase().replace(/(^|[.!?]\\s+)[a-z]/g,m=>m.toUpperCase()) || 'Enter text to format.'"
  },
  {
    "slug": "support-ticket-template",
    "id": "niche.support-ticket-template",
    "name": "Support Ticket Template",
    "description": "Support Ticket Template is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "value.trim().replace(/\\b\\w/g,c=>c.toUpperCase()) || 'Enter a title.'"
  },
  {
    "slug": "bug-report-builder",
    "id": "niche.bug-report-builder",
    "name": "Bug Report Builder",
    "description": "Bug Report Builder is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "value.trim().split(/\\r?\\n/).map(x=>'> '+x).join('\\n') || 'Enter quote text.'"
  },
  {
    "slug": "moderator-notes",
    "id": "niche.moderator-notes",
    "name": "Moderator Notes",
    "description": "Moderator Notes is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "(()=>{const a=value.split(/\\r?\\n/).filter(Boolean);return a.length?a.map((x,i)=>'PART '+(i+1)+': '+x).join('\\n'):'Add content.'})()"
  },
  {
    "slug": "appeal-draft-helper",
    "id": "niche.appeal-draft-helper",
    "name": "Appeal Draft Helper",
    "description": "Appeal Draft Helper is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "(()=>{const a=value.split(',').map(x=>x.trim());return a.length>=2?a.join(' → '):'Enter at least two steps separated by commas.'})()"
  },
  {
    "slug": "staff-handover-notes",
    "id": "niche.staff-handover-notes",
    "name": "Staff Handover Notes",
    "description": "Staff Handover Notes is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "(()=>{const a=value.split('|').map(x=>x.trim());return a.length>=2?'**'+a[0]+'**\\n'+a.slice(1).join('\\n'):'Use title | details.'})()"
  },
  {
    "slug": "staff-rota-formatter",
    "id": "niche.staff-rota-formatter",
    "name": "Staff Rota Formatter",
    "description": "Staff Rota Formatter is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "(()=>{const a=value.split(',').map(Number);return a.length&&a.every(Number.isFinite)?'Total: '+a.reduce((x,y)=>x+y,0)+' | Average: '+(a.reduce((x,y)=>x+y,0)/a.length).toFixed(2):'Enter comma-separated numbers.'})()"
  },
  {
    "slug": "incident-timeline",
    "id": "niche.incident-timeline",
    "name": "Incident Timeline",
    "description": "Incident Timeline is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "(()=>{const a=value.split(/\\r?\\n/).filter(Boolean);return a.length?a[Math.floor(Math.random()*a.length)]:'Add options, one per line.'})()"
  },
  {
    "slug": "server-directory",
    "id": "niche.server-directory",
    "name": "Server Directory",
    "description": "Server Directory is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "(()=>{const a=value.split('|').map(x=>x.trim());return a.length===2?'https://discord.com/channels/@me/'+a[0]+'  '+a[1]:'Enter channel ID | label.'})()"
  },
  {
    "slug": "channel-topic-builder",
    "id": "niche.channel-topic-builder",
    "name": "Channel Topic Builder",
    "description": "Channel Topic Builder is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "(()=>{const a=value.trim();return /^\\d{15,22}$/.test(a)?'<@'+a+'>':'Enter a numeric Discord user ID.'})()"
  },
  {
    "slug": "role-description-builder",
    "id": "niche.role-description-builder",
    "name": "Role Description Builder",
    "description": "Role Description Builder is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "(()=>{const a=value.split(',').map(Number);return a.length===2&&a.every(Number.isFinite)?'Each pays: '+(a[0]/a[1]).toFixed(2):'Enter total, people.'})()"
  },
  {
    "slug": "server-setup-checklist",
    "id": "niche.server-setup-checklist",
    "name": "Server Setup Checklist",
    "description": "Server Setup Checklist is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "(()=>{const a=value.split(',').map(Number);return a.length===2&&a.every(Number.isFinite)?'Result: '+(a[0]*(1-a[1]/100)).toFixed(2):'Enter price, discount percent.'})()"
  },
  {
    "slug": "onboarding-guide",
    "id": "niche.onboarding-guide",
    "name": "Onboarding Guide",
    "description": "Onboarding Guide is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "(()=>{const a=value.split(/\\r?\\n/).filter(Boolean);return a.length?'• '+a.join('\\n• '):'Add items.'})()"
  },
  {
    "slug": "message-template-vault",
    "id": "niche.message-template-vault",
    "name": "Message Template Vault",
    "description": "Message Template Vault is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "value.trim().split(/\\r?\\n/).filter(Boolean).map(x=>'- [ ] '+x.trim()).join('\\n') || 'Add tasks, one per line.'"
  },
  {
    "slug": "quick-reply-builder",
    "id": "niche.quick-reply-builder",
    "name": "Quick Reply Builder",
    "description": "Quick Reply Builder is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "value.trim().split(/\\r?\\n/).filter(Boolean).map((x,i)=>(i+1)+'. '+x.trim()).join('\\n') || 'Add items, one per line.'"
  },
  {
    "slug": "apology-draft-helper",
    "id": "niche.apology-draft-helper",
    "name": "Apology Draft Helper",
    "description": "Apology Draft Helper is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "value.trim().split(/\\r?\\n/).filter(Boolean).map(x=>'• '+x.trim()).join('\\n') || 'Add items, one per line.'"
  },
  {
    "slug": "de-escalation-helper",
    "id": "niche.de-escalation-helper",
    "name": "De-escalation Helper",
    "description": "De-escalation Helper is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "'Characters: '+value.length+' | Words: '+(value.trim()?value.trim().split(/\\s+/).length:0)+' | Lines: '+(value?value.split(/\\r?\\n/).length:0)"
  },
  {
    "slug": "boundary-message-helper",
    "id": "niche.boundary-message-helper",
    "name": "Boundary Message Helper",
    "description": "Boundary Message Helper is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "[...new Set(value.split(/\\r?\\n/).map(x=>x.trim()).filter(Boolean))].join('\\n') || 'Add lines to remove duplicates.'"
  },
  {
    "slug": "thank-you-note-builder",
    "id": "niche.thank-you-note-builder",
    "name": "Thank You Note Builder",
    "description": "Thank You Note Builder is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "value.split(/\\r?\\n/).map(x=>x.trim()).filter(Boolean).sort((a,b)=>a.localeCompare(b)).join('\\n') || 'Add lines to sort.'"
  },
  {
    "slug": "welcome-dm-builder",
    "id": "niche.welcome-dm-builder",
    "name": "Welcome DM Builder",
    "description": "Welcome DM Builder is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "value.trim().replace(/\\s+/g,' ') || 'Enter text to clean.'"
  },
  {
    "slug": "reminder-message-builder",
    "id": "niche.reminder-message-builder",
    "name": "Reminder Message Builder",
    "description": "Reminder Message Builder is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "value.trim().toLowerCase().replace(/(^|[.!?]\\s+)[a-z]/g,m=>m.toUpperCase()) || 'Enter text to format.'"
  },
  {
    "slug": "status-draft-vault",
    "id": "niche.status-draft-vault",
    "name": "Status Draft Vault",
    "description": "Status Draft Vault is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "value.trim().replace(/\\b\\w/g,c=>c.toUpperCase()) || 'Enter a title.'"
  },
  {
    "slug": "profile-bio-helper",
    "id": "niche.profile-bio-helper",
    "name": "Profile Bio Helper",
    "description": "Profile Bio Helper is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "value.trim().split(/\\r?\\n/).map(x=>'> '+x).join('\\n') || 'Enter quote text.'"
  },
  {
    "slug": "game-night-planner",
    "id": "niche.game-night-planner",
    "name": "Game Night Planner",
    "description": "Game Night Planner is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "(()=>{const a=value.split(/\\r?\\n/).filter(Boolean);return a.length?a.map((x,i)=>'PART '+(i+1)+': '+x).join('\\n'):'Add content.'})()"
  },
  {
    "slug": "looking-for-group-builder",
    "id": "niche.looking-for-group-builder",
    "name": "Looking For Group Builder",
    "description": "Looking For Group Builder is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "(()=>{const a=value.split(',').map(x=>x.trim());return a.length>=2?a.join(' → '):'Enter at least two steps separated by commas.'})()"
  },
  {
    "slug": "tournament-planner",
    "id": "niche.tournament-planner",
    "name": "Tournament Planner",
    "description": "Tournament Planner is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "(()=>{const a=value.split('|').map(x=>x.trim());return a.length>=2?'**'+a[0]+'**\\n'+a.slice(1).join('\\n'):'Use title | details.'})()"
  },
  {
    "slug": "match-report-formatter",
    "id": "niche.match-report-formatter",
    "name": "Match Report Formatter",
    "description": "Match Report Formatter is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "(()=>{const a=value.split(',').map(Number);return a.length&&a.every(Number.isFinite)?'Total: '+a.reduce((x,y)=>x+y,0)+' | Average: '+(a.reduce((x,y)=>x+y,0)/a.length).toFixed(2):'Enter comma-separated numbers.'})()"
  },
  {
    "slug": "scoreboard-builder",
    "id": "niche.scoreboard-builder",
    "name": "Scoreboard Builder",
    "description": "Scoreboard Builder is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "(()=>{const a=value.split(/\\r?\\n/).filter(Boolean);return a.length?a[Math.floor(Math.random()*a.length)]:'Add options, one per line.'})()"
  },
  {
    "slug": "game-session-log",
    "id": "niche.game-session-log",
    "name": "Game Session Log",
    "description": "Game Session Log is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "(()=>{const a=value.split('|').map(x=>x.trim());return a.length===2?'https://discord.com/channels/@me/'+a[0]+'  '+a[1]:'Enter channel ID | label.'})()"
  },
  {
    "slug": "game-backlog-organiser",
    "id": "niche.game-backlog-organiser",
    "name": "Game Backlog Organiser",
    "description": "Game Backlog Organiser is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "(()=>{const a=value.trim();return /^\\d{15,22}$/.test(a)?'<@'+a+'>':'Enter a numeric Discord user ID.'})()"
  },
  {
    "slug": "clip-caption-builder",
    "id": "niche.clip-caption-builder",
    "name": "Clip Caption Builder",
    "description": "Clip Caption Builder is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "(()=>{const a=value.split(',').map(Number);return a.length===2&&a.every(Number.isFinite)?'Each pays: '+(a[0]/a[1]).toFixed(2):'Enter total, people.'})()"
  },
  {
    "slug": "stream-schedule-planner",
    "id": "niche.stream-schedule-planner",
    "name": "Stream Schedule Planner",
    "description": "Stream Schedule Planner is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "(()=>{const a=value.split(',').map(Number);return a.length===2&&a.every(Number.isFinite)?'Result: '+(a[0]*(1-a[1]/100)).toFixed(2):'Enter price, discount percent.'})()"
  },
  {
    "slug": "gaming-goals-tracker",
    "id": "niche.gaming-goals-tracker",
    "name": "Gaming Goals Tracker",
    "description": "Gaming Goals Tracker is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "(()=>{const a=value.split(/\\r?\\n/).filter(Boolean);return a.length?'• '+a.join('\\n• '):'Add items.'})()"
  },
  {
    "slug": "community-prompt-builder",
    "id": "niche.community-prompt-builder",
    "name": "Community Prompt Builder",
    "description": "Community Prompt Builder is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "value.trim().split(/\\r?\\n/).filter(Boolean).map(x=>'- [ ] '+x.trim()).join('\\n') || 'Add tasks, one per line.'"
  },
  {
    "slug": "icebreaker-generator",
    "id": "niche.icebreaker-generator",
    "name": "Icebreaker Generator",
    "description": "Icebreaker Generator is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "value.trim().split(/\\r?\\n/).filter(Boolean).map((x,i)=>(i+1)+'. '+x.trim()).join('\\n') || 'Add items, one per line.'"
  },
  {
    "slug": "daily-question-builder",
    "id": "niche.daily-question-builder",
    "name": "Daily Question Builder",
    "description": "Daily Question Builder is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "value.trim().split(/\\r?\\n/).filter(Boolean).map(x=>'• '+x.trim()).join('\\n') || 'Add items, one per line.'"
  },
  {
    "slug": "weekly-challenge-planner",
    "id": "niche.weekly-challenge-planner",
    "name": "Weekly Challenge Planner",
    "description": "Weekly Challenge Planner is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "'Characters: '+value.length+' | Words: '+(value.trim()?value.trim().split(/\\s+/).length:0)+' | Lines: '+(value?value.split(/\\r?\\n/).length:0)"
  },
  {
    "slug": "member-shoutout-builder",
    "id": "niche.member-shoutout-builder",
    "name": "Member Shoutout Builder",
    "description": "Member Shoutout Builder is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "[...new Set(value.split(/\\r?\\n/).map(x=>x.trim()).filter(Boolean))].join('\\n') || 'Add lines to remove duplicates.'"
  },
  {
    "slug": "community-survey-builder",
    "id": "niche.community-survey-builder",
    "name": "Community Survey Builder",
    "description": "Community Survey Builder is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "value.split(/\\r?\\n/).map(x=>x.trim()).filter(Boolean).sort((a,b)=>a.localeCompare(b)).join('\\n') || 'Add lines to sort.'"
  },
  {
    "slug": "event-feedback-form",
    "id": "niche.event-feedback-form",
    "name": "Event Feedback Form",
    "description": "Event Feedback Form is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "value.trim().replace(/\\s+/g,' ') || 'Enter text to clean.'"
  },
  {
    "slug": "attendance-list-formatter",
    "id": "niche.attendance-list-formatter",
    "name": "Attendance List Formatter",
    "description": "Attendance List Formatter is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "value.trim().toLowerCase().replace(/(^|[.!?]\\s+)[a-z]/g,m=>m.toUpperCase()) || 'Enter text to format.'"
  },
  {
    "slug": "volunteer-signup-builder",
    "id": "niche.volunteer-signup-builder",
    "name": "Volunteer Signup Builder",
    "description": "Volunteer Signup Builder is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "value.trim().replace(/\\b\\w/g,c=>c.toUpperCase()) || 'Enter a title.'"
  },
  {
    "slug": "community-calendar",
    "id": "niche.community-calendar",
    "name": "Community Calendar",
    "description": "Community Calendar is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "value.trim().split(/\\r?\\n/).map(x=>'> '+x).join('\\n') || 'Enter quote text.'"
  },
  {
    "slug": "meeting-agenda-builder",
    "id": "niche.meeting-agenda-builder",
    "name": "Meeting Agenda Builder",
    "description": "Meeting Agenda Builder is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "(()=>{const a=value.split(/\\r?\\n/).filter(Boolean);return a.length?a.map((x,i)=>'PART '+(i+1)+': '+x).join('\\n'):'Add content.'})()"
  },
  {
    "slug": "meeting-notes-formatter",
    "id": "niche.meeting-notes-formatter",
    "name": "Meeting Notes Formatter",
    "description": "Meeting Notes Formatter is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "(()=>{const a=value.split(',').map(x=>x.trim());return a.length>=2?a.join(' → '):'Enter at least two steps separated by commas.'})()"
  },
  {
    "slug": "action-item-extractor",
    "id": "niche.action-item-extractor",
    "name": "Action Item Extractor",
    "description": "Action Item Extractor is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "(()=>{const a=value.split('|').map(x=>x.trim());return a.length>=2?'**'+a[0]+'**\\n'+a.slice(1).join('\\n'):'Use title | details.'})()"
  },
  {
    "slug": "decision-log-builder",
    "id": "niche.decision-log-builder",
    "name": "Decision Log Builder",
    "description": "Decision Log Builder is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "(()=>{const a=value.split(',').map(Number);return a.length&&a.every(Number.isFinite)?'Total: '+a.reduce((x,y)=>x+y,0)+' | Average: '+(a.reduce((x,y)=>x+y,0)/a.length).toFixed(2):'Enter comma-separated numbers.'})()"
  },
  {
    "slug": "project-brief-builder",
    "id": "niche.project-brief-builder",
    "name": "Project Brief Builder",
    "description": "Project Brief Builder is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "(()=>{const a=value.split(/\\r?\\n/).filter(Boolean);return a.length?a[Math.floor(Math.random()*a.length)]:'Add options, one per line.'})()"
  },
  {
    "slug": "project-roadmap",
    "id": "niche.project-roadmap",
    "name": "Project Roadmap",
    "description": "Project Roadmap is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "(()=>{const a=value.split('|').map(x=>x.trim());return a.length===2?'https://discord.com/channels/@me/'+a[0]+'  '+a[1]:'Enter channel ID | label.'})()"
  },
  {
    "slug": "sprint-planner",
    "id": "niche.sprint-planner",
    "name": "Sprint Planner",
    "description": "Sprint Planner is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "(()=>{const a=value.trim();return /^\\d{15,22}$/.test(a)?'<@'+a+'>':'Enter a numeric Discord user ID.'})()"
  },
  {
    "slug": "daily-standup-formatter",
    "id": "niche.daily-standup-formatter",
    "name": "Daily Standup Formatter",
    "description": "Daily Standup Formatter is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "(()=>{const a=value.split(',').map(Number);return a.length===2&&a.every(Number.isFinite)?'Each pays: '+(a[0]/a[1]).toFixed(2):'Enter total, people.'})()"
  },
  {
    "slug": "weekly-review-builder",
    "id": "niche.weekly-review-builder",
    "name": "Weekly Review Builder",
    "description": "Weekly Review Builder is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "(()=>{const a=value.split(',').map(Number);return a.length===2&&a.every(Number.isFinite)?'Result: '+(a[0]*(1-a[1]/100)).toFixed(2):'Enter price, discount percent.'})()"
  },
  {
    "slug": "progress-report-formatter",
    "id": "niche.progress-report-formatter",
    "name": "Progress Report Formatter",
    "description": "Progress Report Formatter is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "(()=>{const a=value.split(/\\r?\\n/).filter(Boolean);return a.length?'• '+a.join('\\n• '):'Add items.'})()"
  },
  {
    "slug": "task-checklist-builder",
    "id": "niche.task-checklist-builder",
    "name": "Task Checklist Builder",
    "description": "Task Checklist Builder is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "value.trim().split(/\\r?\\n/).filter(Boolean).map(x=>'- [ ] '+x.trim()).join('\\n') || 'Add tasks, one per line.'"
  },
  {
    "slug": "priority-sorter",
    "id": "niche.priority-sorter",
    "name": "Priority Sorter",
    "description": "Priority Sorter is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "value.trim().split(/\\r?\\n/).filter(Boolean).map((x,i)=>(i+1)+'. '+x.trim()).join('\\n') || 'Add items, one per line.'"
  },
  {
    "slug": "kanban-board-formatter",
    "id": "niche.kanban-board-formatter",
    "name": "Kanban Board Formatter",
    "description": "Kanban Board Formatter is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "value.trim().split(/\\r?\\n/).filter(Boolean).map(x=>'• '+x.trim()).join('\\n') || 'Add items, one per line.'"
  },
  {
    "slug": "goal-breakdown-helper",
    "id": "niche.goal-breakdown-helper",
    "name": "Goal Breakdown Helper",
    "description": "Goal Breakdown Helper is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "'Characters: '+value.length+' | Words: '+(value.trim()?value.trim().split(/\\s+/).length:0)+' | Lines: '+(value?value.split(/\\r?\\n/).length:0)"
  },
  {
    "slug": "deadline-reminder-builder",
    "id": "niche.deadline-reminder-builder",
    "name": "Deadline Reminder Builder",
    "description": "Deadline Reminder Builder is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "[...new Set(value.split(/\\r?\\n/).map(x=>x.trim()).filter(Boolean))].join('\\n') || 'Add lines to remove duplicates.'"
  },
  {
    "slug": "routine-planner",
    "id": "niche.routine-planner",
    "name": "Routine Planner",
    "description": "Routine Planner is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "value.split(/\\r?\\n/).map(x=>x.trim()).filter(Boolean).sort((a,b)=>a.localeCompare(b)).join('\\n') || 'Add lines to sort.'"
  },
  {
    "slug": "study-session-planner",
    "id": "niche.study-session-planner",
    "name": "Study Session Planner",
    "description": "Study Session Planner is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "value.trim().replace(/\\s+/g,' ') || 'Enter text to clean.'"
  },
  {
    "slug": "pomodoro-planner",
    "id": "niche.pomodoro-planner",
    "name": "Pomodoro Planner",
    "description": "Pomodoro Planner is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "value.trim().toLowerCase().replace(/(^|[.!?]\\s+)[a-z]/g,m=>m.toUpperCase()) || 'Enter text to format.'"
  },
  {
    "slug": "habit-checklist-builder",
    "id": "niche.habit-checklist-builder",
    "name": "Habit Checklist Builder",
    "description": "Habit Checklist Builder is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "value.trim().replace(/\\b\\w/g,c=>c.toUpperCase()) || 'Enter a title.'"
  },
  {
    "slug": "personal-notes-formatter",
    "id": "niche.personal-notes-formatter",
    "name": "Personal Notes Formatter",
    "description": "Personal Notes Formatter is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "value.trim().split(/\\r?\\n/).map(x=>'> '+x).join('\\n') || 'Enter quote text.'"
  },
  {
    "slug": "shopping-list-organiser",
    "id": "niche.shopping-list-organiser",
    "name": "Shopping List Organiser",
    "description": "Shopping List Organiser is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "(()=>{const a=value.split(/\\r?\\n/).filter(Boolean);return a.length?a.map((x,i)=>'PART '+(i+1)+': '+x).join('\\n'):'Add content.'})()"
  },
  {
    "slug": "packing-checklist-builder",
    "id": "niche.packing-checklist-builder",
    "name": "Packing Checklist Builder",
    "description": "Packing Checklist Builder is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "(()=>{const a=value.split(',').map(x=>x.trim());return a.length>=2?a.join(' → '):'Enter at least two steps separated by commas.'})()"
  },
  {
    "slug": "travel-itinerary-formatter",
    "id": "niche.travel-itinerary-formatter",
    "name": "Travel Itinerary Formatter",
    "description": "Travel Itinerary Formatter is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "(()=>{const a=value.split('|').map(x=>x.trim());return a.length>=2?'**'+a[0]+'**\\n'+a.slice(1).join('\\n'):'Use title | details.'})()"
  },
  {
    "slug": "trip-recap-builder",
    "id": "niche.trip-recap-builder",
    "name": "Trip Recap Builder",
    "description": "Trip Recap Builder is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "(()=>{const a=value.split(',').map(Number);return a.length&&a.every(Number.isFinite)?'Total: '+a.reduce((x,y)=>x+y,0)+' | Average: '+(a.reduce((x,y)=>x+y,0)/a.length).toFixed(2):'Enter comma-separated numbers.'})()"
  },
  {
    "slug": "meal-plan-formatter",
    "id": "niche.meal-plan-formatter",
    "name": "Meal Plan Formatter",
    "description": "Meal Plan Formatter is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "(()=>{const a=value.split(/\\r?\\n/).filter(Boolean);return a.length?a[Math.floor(Math.random()*a.length)]:'Add options, one per line.'})()"
  },
  {
    "slug": "workout-log-builder",
    "id": "niche.workout-log-builder",
    "name": "Workout Log Builder",
    "description": "Workout Log Builder is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "(()=>{const a=value.split('|').map(x=>x.trim());return a.length===2?'https://discord.com/channels/@me/'+a[0]+'  '+a[1]:'Enter channel ID | label.'})()"
  },
  {
    "slug": "expense-list-formatter",
    "id": "niche.expense-list-formatter",
    "name": "Expense List Formatter",
    "description": "Expense List Formatter is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "(()=>{const a=value.trim();return /^\\d{15,22}$/.test(a)?'<@'+a+'>':'Enter a numeric Discord user ID.'})()"
  },
  {
    "slug": "shared-cost-splitter",
    "id": "niche.shared-cost-splitter",
    "name": "Shared Cost Splitter",
    "description": "Shared Cost Splitter is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "(()=>{const a=value.split(',').map(Number);return a.length===2&&a.every(Number.isFinite)?'Each pays: '+(a[0]/a[1]).toFixed(2):'Enter total, people.'})()"
  },
  {
    "slug": "budget-planner",
    "id": "niche.budget-planner",
    "name": "Budget Planner",
    "description": "Budget Planner is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "(()=>{const a=value.split(',').map(Number);return a.length===2&&a.every(Number.isFinite)?'Result: '+(a[0]*(1-a[1]/100)).toFixed(2):'Enter price, discount percent.'})()"
  },
  {
    "slug": "subscription-tracker-draft",
    "id": "niche.subscription-tracker-draft",
    "name": "Subscription Tracker Draft",
    "description": "Subscription Tracker Draft is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "(()=>{const a=value.split(/\\r?\\n/).filter(Boolean);return a.length?'• '+a.join('\\n• '):'Add items.'})()"
  },
  {
    "slug": "profile-link-directory",
    "id": "niche.profile-link-directory",
    "name": "Profile Link Directory",
    "description": "Profile Link Directory is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "value.trim().split(/\\r?\\n/).filter(Boolean).map(x=>'- [ ] '+x.trim()).join('\\n') || 'Add tasks, one per line.'"
  },
  {
    "slug": "username-idea-builder",
    "id": "niche.username-idea-builder",
    "name": "Username Idea Builder",
    "description": "Username Idea Builder is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "value.trim().split(/\\r?\\n/).filter(Boolean).map((x,i)=>(i+1)+'. '+x.trim()).join('\\n') || 'Add items, one per line.'"
  },
  {
    "slug": "nickname-generator",
    "id": "niche.nickname-generator",
    "name": "Nickname Generator",
    "description": "Nickname Generator is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "value.trim().split(/\\r?\\n/).filter(Boolean).map(x=>'• '+x.trim()).join('\\n') || 'Add items, one per line.'"
  },
  {
    "slug": "tagline-builder",
    "id": "niche.tagline-builder",
    "name": "Tagline Builder",
    "description": "Tagline Builder is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "'Characters: '+value.length+' | Words: '+(value.trim()?value.trim().split(/\\s+/).length:0)+' | Lines: '+(value?value.split(/\\r?\\n/).length:0)"
  },
  {
    "slug": "creator-bio-builder",
    "id": "niche.creator-bio-builder",
    "name": "Creator Bio Builder",
    "description": "Creator Bio Builder is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "[...new Set(value.split(/\\r?\\n/).map(x=>x.trim()).filter(Boolean))].join('\\n') || 'Add lines to remove duplicates.'"
  },
  {
    "slug": "streamer-about-builder",
    "id": "niche.streamer-about-builder",
    "name": "Streamer About Builder",
    "description": "Streamer About Builder is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "value.split(/\\r?\\n/).map(x=>x.trim()).filter(Boolean).sort((a,b)=>a.localeCompare(b)).join('\\n') || 'Add lines to sort.'"
  },
  {
    "slug": "social-bio-drafts",
    "id": "niche.social-bio-drafts",
    "name": "Social Bio Drafts",
    "description": "Social Bio Drafts is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "value.trim().replace(/\\s+/g,' ') || 'Enter text to clean.'"
  },
  {
    "slug": "status-length-checker",
    "id": "niche.status-length-checker",
    "name": "Status Length Checker",
    "description": "Status Length Checker is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "value.trim().toLowerCase().replace(/(^|[.!?]\\s+)[a-z]/g,m=>m.toUpperCase()) || 'Enter text to format.'"
  },
  {
    "slug": "profile-bio-cleaner",
    "id": "niche.profile-bio-cleaner",
    "name": "Profile Bio Cleaner",
    "description": "Profile Bio Cleaner is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "value.trim().replace(/\\b\\w/g,c=>c.toUpperCase()) || 'Enter a title.'"
  },
  {
    "slug": "about-me-outline",
    "id": "niche.about-me-outline",
    "name": "About Me Outline",
    "description": "About Me Outline is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "value.trim().split(/\\r?\\n/).map(x=>'> '+x).join('\\n') || 'Enter quote text.'"
  },
  {
    "slug": "plugin-description-writer",
    "id": "niche.plugin-description-writer",
    "name": "Plugin Description Writer",
    "description": "Plugin Description Writer is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "(()=>{const a=value.split(/\\r?\\n/).filter(Boolean);return a.length?a.map((x,i)=>'PART '+(i+1)+': '+x).join('\\n'):'Add content.'})()"
  },
  {
    "slug": "plugin-readme-builder",
    "id": "niche.plugin-readme-builder",
    "name": "Plugin README Builder",
    "description": "Plugin README Builder is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "(()=>{const a=value.split(',').map(x=>x.trim());return a.length>=2?a.join(' → '):'Enter at least two steps separated by commas.'})()"
  },
  {
    "slug": "plugin-release-notes",
    "id": "niche.plugin-release-notes",
    "name": "Plugin Release Notes",
    "description": "Plugin Release Notes is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "(()=>{const a=value.split('|').map(x=>x.trim());return a.length>=2?'**'+a[0]+'**\\n'+a.slice(1).join('\\n'):'Use title | details.'})()"
  },
  {
    "slug": "plugin-install-guide",
    "id": "niche.plugin-install-guide",
    "name": "Plugin Install Guide",
    "description": "Plugin Install Guide is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "(()=>{const a=value.split(',').map(Number);return a.length&&a.every(Number.isFinite)?'Total: '+a.reduce((x,y)=>x+y,0)+' | Average: '+(a.reduce((x,y)=>x+y,0)/a.length).toFixed(2):'Enter comma-separated numbers.'})()"
  },
  {
    "slug": "plugin-troubleshooting-guide",
    "id": "niche.plugin-troubleshooting-guide",
    "name": "Plugin Troubleshooting Guide",
    "description": "Plugin Troubleshooting Guide is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "(()=>{const a=value.split(/\\r?\\n/).filter(Boolean);return a.length?a[Math.floor(Math.random()*a.length)]:'Add options, one per line.'})()"
  },
  {
    "slug": "plugin-test-plan",
    "id": "niche.plugin-test-plan",
    "name": "Plugin Test Plan",
    "description": "Plugin Test Plan is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "(()=>{const a=value.split('|').map(x=>x.trim());return a.length===2?'https://discord.com/channels/@me/'+a[0]+'  '+a[1]:'Enter channel ID | label.'})()"
  },
  {
    "slug": "plugin-qa-checklist",
    "id": "niche.plugin-qa-checklist",
    "name": "Plugin QA Checklist",
    "description": "Plugin QA Checklist is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "(()=>{const a=value.trim();return /^\\d{15,22}$/.test(a)?'<@'+a+'>':'Enter a numeric Discord user ID.'})()"
  },
  {
    "slug": "plugin-feature-list",
    "id": "niche.plugin-feature-list",
    "name": "Plugin Feature List",
    "description": "Plugin Feature List is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "(()=>{const a=value.split(',').map(Number);return a.length===2&&a.every(Number.isFinite)?'Each pays: '+(a[0]/a[1]).toFixed(2):'Enter total, people.'})()"
  },
  {
    "slug": "plugin-roadmap-builder",
    "id": "niche.plugin-roadmap-builder",
    "name": "Plugin Roadmap Builder",
    "description": "Plugin Roadmap Builder is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "(()=>{const a=value.split(',').map(Number);return a.length===2&&a.every(Number.isFinite)?'Result: '+(a[0]*(1-a[1]/100)).toFixed(2):'Enter price, discount percent.'})()"
  },
  {
    "slug": "plugin-support-reply",
    "id": "niche.plugin-support-reply",
    "name": "Plugin Support Reply",
    "description": "Plugin Support Reply is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "(()=>{const a=value.split(/\\r?\\n/).filter(Boolean);return a.length?'• '+a.join('\\n• '):'Add items.'})()"
  },
  {
    "slug": "server-maintenance-plan",
    "id": "niche.server-maintenance-plan",
    "name": "Server Maintenance Plan",
    "description": "Server Maintenance Plan is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "value.trim().split(/\\r?\\n/).filter(Boolean).map(x=>'- [ ] '+x.trim()).join('\\n') || 'Add tasks, one per line.'"
  },
  {
    "slug": "channel-cleanup-planner",
    "id": "niche.channel-cleanup-planner",
    "name": "Channel Cleanup Planner",
    "description": "Channel Cleanup Planner is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "value.trim().split(/\\r?\\n/).filter(Boolean).map((x,i)=>(i+1)+'. '+x.trim()).join('\\n') || 'Add items, one per line.'"
  },
  {
    "slug": "role-audit-checklist",
    "id": "niche.role-audit-checklist",
    "name": "Role Audit Checklist",
    "description": "Role Audit Checklist is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "value.trim().split(/\\r?\\n/).filter(Boolean).map(x=>'• '+x.trim()).join('\\n') || 'Add items, one per line.'"
  },
  {
    "slug": "permission-review-notes",
    "id": "niche.permission-review-notes",
    "name": "Permission Review Notes",
    "description": "Permission Review Notes is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "'Characters: '+value.length+' | Words: '+(value.trim()?value.trim().split(/\\s+/).length:0)+' | Lines: '+(value?value.split(/\\r?\\n/).length:0)"
  },
  {
    "slug": "privacy-checklist",
    "id": "niche.privacy-checklist",
    "name": "Privacy Checklist",
    "description": "Privacy Checklist is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "[...new Set(value.split(/\\r?\\n/).map(x=>x.trim()).filter(Boolean))].join('\\n') || 'Add lines to remove duplicates.'"
  },
  {
    "slug": "accessibility-checklist",
    "id": "niche.accessibility-checklist",
    "name": "Accessibility Checklist",
    "description": "Accessibility Checklist is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "value.split(/\\r?\\n/).map(x=>x.trim()).filter(Boolean).sort((a,b)=>a.localeCompare(b)).join('\\n') || 'Add lines to sort.'"
  },
  {
    "slug": "mobile-ui-review",
    "id": "niche.mobile-ui-review",
    "name": "Mobile UI Review",
    "description": "Mobile UI Review is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "value.trim().replace(/\\s+/g,' ') || 'Enter text to clean.'"
  },
  {
    "slug": "performance-checklist",
    "id": "niche.performance-checklist",
    "name": "Performance Checklist",
    "description": "Performance Checklist is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "value.trim().toLowerCase().replace(/(^|[.!?]\\s+)[a-z]/g,m=>m.toUpperCase()) || 'Enter text to format.'"
  },
  {
    "slug": "release-readiness-checklist",
    "id": "niche.release-readiness-checklist",
    "name": "Release Readiness Checklist",
    "description": "Release Readiness Checklist is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "value.trim().replace(/\\b\\w/g,c=>c.toUpperCase()) || 'Enter a title.'"
  },
  {
    "slug": "backup-checklist",
    "id": "niche.backup-checklist",
    "name": "Backup Checklist",
    "description": "Backup Checklist is a local Valenced helper for drafting, organising or formatting Discord community content. It does not send messages or change server settings.",
    "kind": "simple",
    "label": "Text or details",
    "placeholder": "Enter details here…",
    "expression": "value.trim().split(/\\r?\\n/).map(x=>'> '+x).join('\\n') || 'Enter quote text.'"
  }
]
plugins.push(...extraPlugins)

await rm('plugins', { recursive: true, force: true })
await mkdir('plugins', { recursive: true })
for (const p of plugins) {
  const dir = join('plugins', p.slug)
  await mkdir(join(dir, 'js'), { recursive: true })
  const src = p.kind === 'catalog' ? catalogSource : p.kind === 'presence' ? presenceSource : p.kind === 'silent' ? silentSource : p.kind === 'noidle' ? noidleSource : p.kind === 'fakenitro' ? fakeNitroSource : p.kind === 'notes' ? notesSource : p.kind === 'presets' ? presetsSource : simpleSource(p)
  await writeFile(join(dir, 'manifest.json'), manifestFor(p))
  await writeFile(join(dir, 'js/index.tsx'), src)
}
if (plugins.length !== 168) throw new Error('Expected 168 plugin definitions; found ' + plugins.length)
console.log('Generated ' + plugins.length + ' Valenced plugin folders.')
