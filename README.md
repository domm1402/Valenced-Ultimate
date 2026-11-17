# Valenced Ultimate

> **Valenced Ultimate** is an expanding collection of practical Valenced plugins: Discord-focused quality-of-life tools, local organisers, text and media helpers, developer utilities, and optional native integrations. Each plugin is packaged separately. Features that require unsupported Discord APIs are labelled honestly, and paid/server-side entitlements are not bypassed.

A catalogue of 168 standalone plugins for Valenced, including 110 new practical Discord community, gaming, planning, moderation-drafting and productivity helpers. No new encoding utilities are included.

## Add this repository in Valenced

1. Open Settings → Valenced → Plugins.
2. Tap the repository settings gear.
3. Add this URL: https://domm1402.github.io/Valenced-Ultimate/index.json
4. Return to the plugin browser and install the plugins you want.

GitHub Actions builds the plugins, packages individual ZIP files, generates the repository index, and publishes everything to GitHub Pages.

## Plugin Studio APK

This repository now includes **Valenced Plugin Studio**, an Android app for writing your own Valenced plugins. It now includes an offline TypeScript-to-JavaScript compiler, beginner templates, syntax error messages, manifest validation, local draft saving, ZIP export, and built-in help/tips. Compilation transpiles source code; projects importing external packages still need the Valenced CLI to bundle dependencies.

To get the APK, open the [Actions tab](https://github.com/domm1402/Valenced-Ultimate/actions/workflows/plugin-studio-apk.yml), run **Build Plugin Studio APK**, then download the **valenced-plugin-studio-apk** artifact from the completed run. See [PLUGIN-STUDIO.md](PLUGIN-STUDIO.md) for details. The app creates source projects; exported plugins still need to be built with the Valenced plugin CLI before installation.

## Plugin catalogue

| # | Plugin | What it does |
|---:|---|---|
| 1 | Fake Nitro Preview | Local Nitro-style profile mock-up. It does not unlock paid features. |
| 2 | Discord Game Catalog | Searches Discord's public detectable-games catalog and shows game names and application IDs. |
| 3 | Rich Presence Builder | Pick a game from that catalog and draft a Playing activity card with details and state. Preview only. |\n| 4 | Game Spoofing | Eskimo Rich Presence engine with multiple activities, timers, schedules, live previews, SoundCloud support, and 44 game templates with artwork. |
| 4 | Profile Card Preview | Preview a display name and profile-card text. |
| 5 | Badge Gallery Preview | Make a local mock badge row. These are not official Discord badges. |
| 6 | Custom Status Drafts | Draft custom status text. |
| 7 | Silent Typing | Suppress your local typing-start event while enabled. |
| 8 | File Name Cleaner | Clean up a file name before you upload it. |
| 9 | Discord Timestamp Generator | Convert Unix seconds to Discord timestamp syntax. |
| 10 | Snowflake Decoder | Decode a Discord snowflake ID into its creation date. |
| 11 | Link Cleaner | Remove common tracking parameters from a URL. |
| 12 | Message Text Stats | Count characters, words, lines, and UTF-8 bytes. |
| 13 | Markdown Playground | Draft common Discord Markdown in a scratchpad. |
| 14 | Embed Preview | Draft an embed title and description locally. |
| 15 | Emoji Previewer | Preview emoji and Unicode symbols. |
| 16 | Hex Color Converter | Convert a six-digit hex color to RGB. |
| 17 | Bio Formatter | Clean extra spaces and blank lines from an About Me draft. |
| 18 | Invite Link Builder | Format an invite code as a Discord invite URL. |
| 19 | Discord Date Tag Builder | Create full and relative Discord timestamp tags. |
| 20 | Activity Text Templates | Draft game-activity details and state text. |

### Additional utility plugins

These are retained for compatibility but are not the focus of the feature rebuild.

JSON Formatter, Base64 Encoder/Decoder, URL Encoder, Case Converter, Line Sorter, Duplicate Line Remover, Text Reverser, Slug Generator, Word Frequency, ROT13 Encoder, Morse Encoder, Binary Converter, Random Picker, Percentage Calculator, Unix Time Converter, CSS Gradient Builder, RGB to Hex, Checklist Builder, Character Counter Pro, Password Generator, HTML Escape Tool, List Numberer, Quote Formatter, Emoji Remover, and Whitespace Cleaner.

These are interactive tools that calculate or transform the text you enter. Password Generator is a convenience generator and is not a cryptographic password manager.

## Newly added client features

- **Fake Nitro**: uses Valenced module hooks to expose supported client-side cosmetic/theme/app-icon/sticker UI and stream-quality checks. It does not grant Nitro, upload permissions, server-side emoji permissions, or paid account entitlements.
- **No Idle**: prevents the local IDLE event from switching the client to idle.
- **Silent Typing**: suppresses the local typing-start event while enabled.

## Important limitations

- Fake Nitro Preview is only a cosmetic mock-up. It does not grant Nitro, bypass payment, enable server-side emoji permissions, or change account entitlements.
- Discord Game Catalog reads Discord's public detectable-games list. A catalog entry gives you the listed name and application ID; it is not a Discord verification badge.
- Game Spoofing is based on the Rich Presence implementation from MarkLong0467's EskimoPlugins repository. It uses Valenced's Discord activity internals, not the previous custom native Social SDK bridge. Game templates prefill activity text and game artwork; the full editor supports multiple profiles, timers, schedules, buttons, image links, and SoundCloud.
- The plugins do not ask for your Discord password or authentication token and do not collect telemetry.

## Development

Requires Node.js 22.18 or newer. Run: npm install, node .github/scripts/generate-plugins.mjs, npm run build, node .github/scripts/package-plugins.mjs, then npm run generate-index with the pool directory and GitHub Pages base URL.

The plugin definitions live in .github/scripts/generate-plugins.mjs. Game Spoofing sources are vendored from Eskimo Rich Presence in vendor/eskimo-rich-presence-sources.json and copied into the generated plugin folder. GitHub Actions then builds and publishes the generated Valenced plugin folders.


### 110 new practical helpers

The latest expansion adds 110 standalone local tools across these areas:

- **Community and server:** welcome/farewell drafts, announcements, polls, giveaways, rules, FAQs, onboarding, channel directories, role descriptions, event calendars and maintenance checklists.
- **Messaging and profiles:** reusable replies, apology and de-escalation drafts, reminders, status drafts, bio helpers, creator profiles and link directories.
- **Gaming:** game-night and LFG planners, tournament schedules, match reports, scoreboards, session logs, backlogs, clip captions and stream schedules.
- **Moderation support:** private staff notes, appeal drafts, incident timelines, handovers, permission reviews and safety checklists. These tools prepare text; they do not perform moderation actions.
- **Planning and productivity:** meeting agendas, notes, action items, decision logs, task boards, priorities, study plans, routines, travel lists, budgets and personal notes.
- **Plugin development support:** README and release-note drafts, install and troubleshooting guides, test plans, QA checklists, roadmaps, support replies and release readiness.

These additions are local drafting and formatting tools. They do not claim to send messages, grant account entitlements, or modify server configuration. Existing encoding-focused utilities were not expanded.
