import { Design } from '@valenced/discord/design'
import Page from '@valenced/components/Page'
import { callNativeMethod } from '@valenced/modules/native'
import { useState } from 'react'

const APPLICATION_ID = '1571988102912675900'
type Template = { name: string; details: string; state: string; imageKey: string; category: string }
type PresenceSettings = { template: string; gameName: string; details: string; state: string; imageKey: string; customTemplates: Template[]; startedAt?: number }
const templates: Template[] = [
  { name: 'Grand Theft Auto VI', details: 'Exploring Vice City', state: 'In Story Mode', imageKey: 'gta6', category: 'Upcoming' },
  { name: 'Grand Theft Auto V', details: 'Exploring Los Santos', state: 'In Story Mode', imageKey: 'gtav', category: 'Action' },
  { name: 'Minecraft', details: 'Building and exploring', state: 'Survival Mode', imageKey: 'minecraft', category: 'Sandbox' },
  { name: 'Fortnite', details: 'Ready for the next match', state: 'In the Lobby', imageKey: 'fortnite', category: 'Battle Royale' },
  { name: 'Roblox', details: 'Exploring experiences', state: 'Playing', imageKey: 'roblox', category: 'Sandbox' },
  { name: 'Call of Duty: Black Ops 7', details: 'Deploying into the action', state: 'Multiplayer', imageKey: 'blackops7', category: 'Shooter' },
  { name: 'Marvel Rivals', details: 'Assembling the team', state: 'In a Match', imageKey: 'marvelrivals', category: 'Shooter' },
  { name: 'Valorant', details: 'Queueing for ranked', state: 'Competitive', imageKey: 'valorant', category: 'Shooter' },
  { name: 'Counter-Strike 2', details: 'Loading into a match', state: 'Competitive', imageKey: 'cs2', category: 'Shooter' },
  { name: 'Apex Legends', details: 'Entering the arena', state: 'In a Match', imageKey: 'apex', category: 'Battle Royale' },
  { name: 'Rocket League', details: 'Ready for kickoff', state: 'Online Match', imageKey: 'rocketleague', category: 'Sports' },
  { name: 'EA SPORTS FC 26', details: 'Preparing for kickoff', state: 'Ultimate Team', imageKey: 'fc26', category: 'Sports' },
  { name: 'Forza Horizon 6', details: 'Cruising the open world', state: 'Exploring', imageKey: 'forzahorizon6', category: 'Racing' },
  { name: 'The Elder Scrolls VI', details: 'An adventure awaits', state: 'Exploring', imageKey: 'tes6', category: 'Upcoming' },
  { name: 'The Witcher 4', details: 'The Path begins again', state: 'On the Path', imageKey: 'witcher4', category: 'Upcoming' },
  { name: 'Marvel’s Wolverine', details: 'The hunt is on', state: 'Story Mode', imageKey: 'wolverine', category: 'Upcoming' },
  { name: 'Fable', details: 'A new legend begins', state: 'Exploring Albion', imageKey: 'fable', category: 'Upcoming' },
  { name: 'Light No Fire', details: 'Discovering a vast world', state: 'Exploring', imageKey: 'lightnofire', category: 'Upcoming' },,
  { name: 'Half-Life: Alyx', details: 'Entering City 17', state: 'VR Campaign', imageKey: 'halflifealyx', category: 'VR / Legendary' },
  { name: 'Half-Life 3', details: 'The wait is finally over', state: 'Chapter One', imageKey: 'halflife3', category: 'Legendary / Fictional' },
  { name: 'Portal 2', details: 'Solving test chambers', state: 'Co-op testing', imageKey: 'portal2', category: 'Puzzle' },
  { name: 'Bloodborne', details: 'Hunting through Yharnam', state: 'Fear the Old Blood', imageKey: 'bloodborne', category: 'Cult Classic' },
  { name: 'Red Dead Redemption 2', details: 'Riding through the heartlands', state: 'Wanted: Dead or Alive', imageKey: 'rdr2', category: 'Open World' },
  { name: 'Cyberpunk 2077', details: 'Exploring Night City', state: 'Afterlife regular', imageKey: 'cyberpunk2077', category: 'RPG' },
  { name: 'Elden Ring: Shadow of the Erdtree', details: 'Conquering the Land of Shadow', state: 'New Game Plus', imageKey: 'eldenringdlc', category: 'Soulslike' },
  { name: 'Dwarf Fortress', details: ' !!FUN!! is happening', state: 'Losing another fortress', imageKey: 'dwarffortress', category: 'Deep Cut' },
  { name: 'Microsoft Flight Simulator 2024', details: 'Crossing the Atlantic', state: 'Live flight · FL350', imageKey: 'flightsim2024', category: 'Simulation' },
  { name: 'iRacing', details: 'Qualifying for the 24 Hours', state: 'Safety rating on the line', imageKey: 'iracing', category: 'Simulation' },
  { name: 'Escape from Tarkov', details: 'Extracting with a full bag', state: 'One more raid', imageKey: 'tarkov', category: 'Hardcore' },
  { name: 'Arma Reforger', details: 'Coordinating an operation', state: 'MilSim · Radio silence', imageKey: 'armareforger', category: 'MilSim' },
  { name: 'Star Citizen', details: 'Crossing the Stanton system', state: 'Quantum travel', imageKey: 'starcitizen', category: 'Space Sim' },
  { name: 'Squad', details: 'Holding the objective', state: 'Mic check · Squad lead', imageKey: 'squad', category: 'MilSim' },
  { name: 'EVE Online', details: 'Moving a fleet through null-sec', state: 'Please do not disturb', imageKey: 'eveonline', category: 'MMO' },
  { name: 'Old School RuneScape', details: 'Grinding another 99', state: 'No XP waste', imageKey: 'osrs', category: 'MMO' },
  { name: 'Garry’s Mod', details: 'Building something cursed', state: 'Sandbox chaos', imageKey: 'garrysmod', category: 'Sandbox' },
  { name: 'VRChat', details: 'Meeting people across the metaverse', state: 'Avatar hopping', imageKey: 'vrchat', category: 'Social VR' },
  { name: 'Euro Truck Simulator 2', details: 'Delivering across Europe', state: 'Long-haul · Radio on', imageKey: 'ets2', category: 'Simulation' },
  { name: 'GeoGuessr', details: 'Somewhere on Earth', state: '5,000 points or nothing', imageKey: 'geoguessr', category: 'Skill' },
  { name: 'Hollow Knight: Silksong', details: 'Exploring Pharloom', state: 'No spoilers', imageKey: 'silksong', category: 'Indie' },
  { name: 'Baldur’s Gate 3', details: 'Making questionable choices', state: 'Honour Mode', imageKey: 'baldursgate3', category: 'RPG' },
  { name: 'The Sims 4', details: 'Building an architectural masterpiece', state: 'Definitely not using cheats', imageKey: 'thesims4', category: 'Simulation' },
  { name: 'PowerWash Simulator 2', details: 'Restoring order to the universe', state: '100% clean', imageKey: 'powerwash2', category: 'Unexpected' },
  { name: 'Papers, Please', details: 'Glory to Arstotzka', state: 'Next applicant', imageKey: 'papersplease', category: 'Cult Classic' },
  { name: 'Tony Hawk’s Pro Skater 3 + 4', details: 'Chasing the perfect combo', state: 'Sick score', imageKey: 'thps34', category: 'Sports' },
]
function RichPresenceSettings({ api }: { api: any }) {
  const saved = api.jsonStorage.use() as PresenceSettings | undefined
  const [customTemplates, setCustomTemplates] = useState<Template[]>(saved?.customTemplates ?? [])
  const [template, setTemplate] = useState(saved?.template ?? 'Grand Theft Auto VI')
  const initial = [...templates, ...(saved?.customTemplates ?? [])].find(item => item.name === (saved?.template ?? 'Grand Theft Auto VI')) ?? templates[0]
  const [gameName, setGameName] = useState(saved?.gameName ?? initial.name)
  const [details, setDetails] = useState(saved?.details ?? initial.details)
  const [state, setState] = useState(saved?.state ?? initial.state)
  const [imageKey, setImageKey] = useState(saved?.imageKey ?? initial.imageKey)
  const [query, setQuery] = useState('')
  const [customName, setCustomName] = useState('')
  const [status, setStatus] = useState('Choose a game, edit the activity, then press Update Presence.')
  const [startedAt, setStartedAt] = useState(saved?.startedAt ?? 0)
  const allTemplates = [...templates, ...customTemplates]
  const q = query.trim().toLowerCase()
  const matches = q ? allTemplates.filter(item => (item.name + ' ' + item.category).toLowerCase().includes(q)).slice(0, 20) : []
  const chooseTemplate = (item: Template) => {
    setTemplate(item.name); setGameName(item.name); setDetails(item.details); setState(item.state); setImageKey(item.imageKey)
    setStatus('Loaded ' + item.name + '. Press Update Presence to publish it.')
  }
  const persist = (nextStartedAt = startedAt) => api.jsonStorage.set({ template, gameName, details, state, imageKey, customTemplates, startedAt: nextStartedAt })
  const createCustom = () => {
    const name = customName.trim()
    if (!name) { setStatus('Enter a game title first.'); return }
    const item = { name, details: 'Playing ' + name, state: 'In Game', imageKey: '', category: 'Custom / Unreleased' }
    const next = [...customTemplates.filter(x => x.name.toLowerCase() !== name.toLowerCase()), item]
    setCustomTemplates(next); setTemplate(name); setGameName(name); setDetails(item.details); setState(item.state); setImageKey('')
    setCustomName(''); setStatus('Custom game added. Configure it below, then update presence.')
  }
  const updatePresence = async () => {
    if (!gameName.trim()) { setStatus('Enter a game name first.'); return }
    const start = Date.now()
    setStatus('Connecting to Discord and publishing your activity…')
    try {
      const result = await callNativeMethod('domms.presence.update' as any, [APPLICATION_ID, gameName.trim(), details.trim(), state.trim(), imageKey.trim(), start] as any)
      setStartedAt(start)
      api.jsonStorage.set({ template, gameName, details, state, imageKey, customTemplates, startedAt: start })
      setStatus('Presence update sent to Discord. The elapsed timer starts from now.')
    } catch (error) {
      setStatus('Presence update failed: ' + String(error))
    }
  }
  const clearPresence = async () => {
    setStatus('Clearing Discord activity…')
    try {
      await callNativeMethod('domms.presence.clear' as any, [] as any)
      setStartedAt(0); persist(0)
      setStatus('Discord activity cleared.')
    } catch (error) { setStatus('Could not clear activity: ' + String(error)) }
  }
  return <Page>
    <Design.TableRowGroup title='Game catalogue'>
      <Design.Text>Search the built-in games or create any custom title, including unreleased games. The Discord Application ID remains your own.</Design.Text>
      <Design.TextInput label='Search games' placeholder='Search by title or genre…' defaultValue='' onChange={setQuery} />
      {matches.map(item => <Design.Button key={item.name} text={item.name + ' · ' + item.category} onPress={() => chooseTemplate(item)} />)}
      <Design.Text>{!q ? 'Type a game name to search. Your settings are shown below.' : (matches.length ? matches.length + ' templates shown.' : 'No matching game. Add it as a custom title below.')}</Design.Text>
      <Design.TextInput label='Custom or unreleased game title' placeholder='Any game title' defaultValue={customName} onChange={setCustomName} />
      <Design.Button text='Add custom game' onPress={createCustom} />
    </Design.TableRowGroup>
    <Design.TableRowGroup title='Activity settings'>
      <Design.TextInput label='Game shown in activity' placeholder='Game name' defaultValue={gameName} onChange={setGameName} />
      <Design.TextInput label='Details' placeholder='Exploring the map' defaultValue={details} onChange={setDetails} />
      <Design.TextInput label='State' placeholder='In a match' defaultValue={state} onChange={setState} />
      <Design.TextInput label='Large image asset key' placeholder='Your Discord app asset key' defaultValue={imageKey} onChange={setImageKey} />
      <Design.Text>Discord Application ID: {APPLICATION_ID}</Design.Text>
      <Design.Text>Upload matching image assets under this application in the Discord Developer Portal. Image keys are optional.</Design.Text>
    </Design.TableRowGroup>
    <Design.TableRowGroup title='Live Rich Presence'>
      <Design.Text>Press Update Presence to publish a Playing activity with an elapsed-time counter. Updating starts the timer again.</Design.Text>
      <Design.Button text='Update Presence' onPress={updatePresence} />
      <Design.Button text='Clear Presence' onPress={clearPresence} />
      <Design.Text>{startedAt ? 'Last started: ' + new Date(startedAt).toLocaleString() : 'No session timer started yet.'}</Design.Text>
      <Design.Text>{status}</Design.Text>
    </Design.TableRowGroup>
    <Design.TableRowGroup title='Preview'>
      <Design.Text>Playing {gameName || 'Game name'}</Design.Text>
      <Design.Text>{details || 'Details'}</Design.Text>
      <Design.Text>{state || 'State'}</Design.Text>
      <Design.Text>Image asset: {imageKey || 'Not set'}</Design.Text>
    </Design.TableRowGroup>
  </Page>
}
export default plugin<{ jsonStorage: PresenceSettings }>({
  jsonStorage: { load: true, default: { template: 'Grand Theft Auto VI', gameName: 'Grand Theft Auto VI', details: 'Exploring Vice City', state: 'In Story Mode', imageKey: 'gta6', customTemplates: [], startedAt: 0 } },
  SettingsComponent: RichPresenceSettings,
})
