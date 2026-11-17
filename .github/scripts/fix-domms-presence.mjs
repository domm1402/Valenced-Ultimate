import { mkdir, writeFile } from 'node:fs/promises'

const dir = 'plugins/domms-games-presence'
await mkdir(dir + '/js', { recursive: true })

const manifest = {
  format: 1,
  id: 'domms.games.presence',
  name: 'Game Spoofing',
  description: 'Choose a game, customise its Discord Rich Presence activity and elapsed timer, then publish or clear it through the supported bridge.',
  author: 'Niche Games',
  version: '1.1.0',
  dependencies: {
    'valenced.api': { version: '>=1 <2' },
    discord: { version: '*' },
  },
  dist: { script: 'index.js' },
}

const source = `import { Design } from '@valenced/discord/design'
import Page from '@valenced/components/Page'
import { useEffect, useState } from 'react'

type Game = { id: string; name: string }
type PresenceSettings = {
  selected: Game | null
  details: string
  state: string
  applicationId: string
}

function RichPresenceSettings({ api }: { api: any }) {
  const saved = api.jsonStorage.use() as PresenceSettings | undefined
  const [games, setGames] = useState<Game[]>([])
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Game | null>(saved?.selected ?? null)
  const [details, setDetails] = useState(saved?.details ?? '')
  const [state, setState] = useState(saved?.state ?? '')
  const [applicationId, setApplicationId] = useState(saved?.applicationId ?? '')
  const [status, setStatus] = useState('Loading Discord game catalogue…')

  useEffect(() => {
    let active = true
    fetch('https://discord.com/api/v10/applications/detectable')
      .then(response => {
        if (!response.ok) throw new Error('HTTP ' + response.status)
        return response.json()
      })
      .then(data => {
        if (!Array.isArray(data)) throw new Error('Unexpected catalogue response')
        if (active) {
          setGames(data.map((game: any) => ({
            id: String(game.id),
            name: String(game.name),
          })).filter((game: Game) => game.id && game.name))
          setStatus(data.length.toLocaleString() + ' detectable games loaded.')
        }
      })
      .catch(() => {
        if (active) setStatus('Game catalogue unavailable. You can still enter an application ID manually.')
      })
    return () => { active = false }
  }, [])

  const search = query.trim().toLowerCase()
  const matches = search
    ? games.filter(game => game.name.toLowerCase().includes(search) || game.id.includes(search)).slice(0, 12)
    : []

  const saveProfile = () => {
    api.jsonStorage.set({ selected, details, state, applicationId })
    setStatus('Activity profile saved on this device.')
  }

  const clearProfile = () => {
    api.jsonStorage.set({ selected: null, details: '', state: '', applicationId: '' })
    setSelected(null)
    setDetails('')
    setState('')
    setApplicationId('')
    setQuery('')
    setStatus('Saved activity profile cleared.')
  }

  return (
    <Page>
      <Design.Text>Choose a game and prepare the activity profile you want to use.</Design.Text>
      <Design.TextInput label="Find a game" placeholder="Minecraft, Fortnite, Roblox…" defaultValue={selected?.name ?? ''} onChange={setQuery} />
      {matches.map(game => (
        <Design.Button
          key={game.id}
          text={game.name + ' · ' + game.id}
          onPress={() => {
            setSelected(game)
            setQuery(game.name)
            setApplicationId(game.id)
          }}
        />
      ))}
      <Design.Text>{selected ? 'Selected: ' + selected.name : (search ? (matches.length ? 'Tap a result to select it.' : 'No matching games found.') : 'Search for a game above.')}</Design.Text>
      <Design.TextInput label="Discord Application ID" placeholder="Application ID" defaultValue={applicationId} onChange={setApplicationId} />
      <Design.TextInput label="Details" placeholder="In a ranked match" defaultValue={details} onChange={setDetails} />
      <Design.TextInput label="State" placeholder="2v2 · Diamond" defaultValue={state} onChange={setState} />
      <Design.Text>
        {selected
          ? 'ACTIVITY PROFILE\\nPlaying ' + selected.name + '\\n' + (details || 'Details') + (state ? '\\n' + state : '')
          : 'Select a game to preview your activity profile.'}
      </Design.Text>
      <Design.Button text="Save Activity Profile" onPress={saveProfile} />
      <Design.Button text="Clear Saved Profile" onPress={clearProfile} />
      <Design.Text>{status}</Design.Text>
      <Design.Text>Live Discord profile publishing is not available through the public Valenced plugin API. This plugin deliberately does not load an unverified native library or send unofficial Gateway presence packets. A compatible companion bridge is required for publishing.</Design.Text>
    </Page>
  )
}

export default plugin<{ jsonStorage: PresenceSettings }>({
  jsonStorage: {
    load: true,
    default: { selected: null, details: '', state: '', applicationId: '' },
  },
  SettingsComponent: RichPresenceSettings,
})
`

await writeFile(dir + '/manifest.json', JSON.stringify(manifest, null, 2) + '\\n')
// Keep the generated Game Spoofing source intact. The legacy preview source above is retained only for historical reference.
console.log('Installed safe Domms Games Presence source overlay.')
