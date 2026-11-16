import { Design } from '@valenced/discord/design'
import Page from '@valenced/components/Page'
import { useEffect, useMemo, useState } from 'react'

type Game = { id: string; name: string }
type Settings = { selected: Game | null; details: string; state: string }

function DommsGamesPresence({ api }: { api: any }) {
  const saved = api.jsonStorage.use() as Settings | undefined
  const [games, setGames] = useState<Game[]>([])
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Game | null>(saved?.selected ?? null)
  const [details, setDetails] = useState(saved?.details ?? '')
  const [state, setState] = useState(saved?.state ?? '')
  const [status, setStatus] = useState('Loading Discord game catalogue…')

  useEffect(() => {
    let active = true
    fetch('https://discord.com/api/v10/applications/detectable')
      .then(response => {
        if (!response.ok) throw new Error('Discord returned HTTP ' + response.status)
        return response.json()
      })
      .then(data => {
        if (!Array.isArray(data)) throw new Error('Unexpected catalogue response')
        if (active) {
          const clean = data
            .filter((item: any) => item && item.id && item.name)
            .map((item: any) => ({ id: String(item.id), name: String(item.name) }))
          setGames(clean)
          setStatus(clean.length.toLocaleString() + ' games loaded. Search by name.')
        }
      })
      .catch(error => {
        if (active) setStatus('Could not load Discord catalogue: ' + String(error))
      })
    return () => { active = false }
  }, [])

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return games
      .filter(game => game.name.toLowerCase().includes(q) || game.id.includes(q))
      .slice(0, 12)
  }, [games, query])

  const saveAndUpdate = () => {
    if (!selected) {
      setStatus('Choose a game first.')
      return
    }
    api.jsonStorage.set({ selected, details, state })
    setStatus('Saved: ' + selected.name + ' (' + selected.id + '). This build saves the activity configuration; it does not publish a live Discord activity because the supported native RPC bridge is not exposed to this plugin.')
  }

  return (
    <Page>
      <Design.Text>Choose a game from Discord’s detectable-games catalogue. Its real application ID is filled in automatically.</Design.Text>
      <Design.TextInput label="Search games" placeholder="Minecraft, Fortnite, Rocket League…" defaultValue={selected?.name ?? ''} onChange={setQuery} />
      <Design.Text>{status}</Design.Text>
      {matches.map(game => (
        <Design.Button key={game.id} text={game.name + ' · ' + game.id} onPress={() => { setSelected(game); setQuery(game.name) }} />
      ))}
      <Design.Text>{selected ? 'Selected: ' + selected.name + ' · Application ID: ' + selected.id : 'No game selected yet.'}</Design.Text>
      <Design.TextInput label="Details" placeholder="In a ranked match" defaultValue={details} onChange={setDetails} />
      <Design.TextInput label="State" placeholder="2v2 · Diamond" defaultValue={state} onChange={setState} />
      <Design.Text>{selected ? 'ACTIVITY PREVIEW\nPlaying ' + selected.name + '\n' + (details.trim() || 'Details') + (state.trim() ? '\n' + state.trim() : '') + '\nApplication ID: ' + selected.id : 'Select a game to preview the activity.'}</Design.Text>
      <Design.Button text="Update Presence" onPress={saveAndUpdate} />
    </Page>
  )
}

export default plugin<{ jsonStorage: Settings }>({
  jsonStorage: { load: true, default: { selected: null, details: '', state: '' } },
  SettingsComponent: DommsGamesPresence
})
