# Valenced Ultimate

> **Feature rebuild in progress:** the current collection includes mock previews and utility filler. See [REBUILD.md](REBUILD.md) for the useful-plugin scope and hard API limits. Do not treat Rich Presence Builder or Nitro Preview as live features.

A collection of 48 standalone plugins for Valenced, the mobile Discord client modification.

## Add this repository in Valenced

1. Open Settings → Valenced → Plugins.
2. Tap the repository settings gear.
3. Add this URL: https://tiktoknotificationtroll-wq.github.io/Valenced-Ultimate/index.json
4. Return to the plugin browser and install the plugins you want.

GitHub Actions builds the plugins, packages individual ZIP files, generates the repository index, and publishes everything to GitHub Pages.

## Plugin Studio APK

This repository now includes **Valenced Plugin Studio**, an Android app for writing your own Valenced plugins. It now includes an offline TypeScript-to-JavaScript compiler, beginner templates, syntax error messages, manifest validation, local draft saving, ZIP export, and built-in help/tips. Compilation transpiles source code; projects importing external packages still need the Valenced CLI to bundle dependencies.

To get the APK, open the [Actions tab](https://github.com/tiktoknotificationtroll-wq/Valenced-Ultimate/actions/workflows/plugin-studio-apk.yml), run **Build Plugin Studio APK**, then download the **valenced-plugin-studio-apk** artifact from the completed run. See [PLUGIN-STUDIO.md](PLUGIN-STUDIO.md) for details. The app creates source projects; exported plugins still need to be built with the Valenced plugin CLI before installation.

## The 48 plugins

| # | Plugin | What it does |
|---:|---|---|
| 1 | Fake Nitro Preview | Local Nitro-style profile mock-up. It does not unlock paid features. |
| 2 | Discord Game Catalog | Searches Discord's public detectable-games catalog and shows game names and application IDs. |
| 3 | Rich Presence Builder | Pick a game from that catalog and draft a Playing activity card with details and state. Preview only. |\n| 4 | Domms Games Presence | Select a game, save an activity profile, and prepare details/state. Live publishing requires a supported companion bridge. |
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

### Added utility plugins (26, legacy)

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
- Rich Presence Builder lets you search and select a game from that list, then preview the activity card. Valenced's documented mobile plugin API does not expose a supported publisher for a user's game activity. Domms Games Presence therefore saves a game/activity profile without loading an unverified native SDK or sending unofficial Gateway presence packets. Live publishing requires a supported companion bridge.
- The plugins do not ask for your Discord password or authentication token and do not collect telemetry.

## Development

Requires Node.js 22.18 or newer. Run: npm install, node .github/scripts/generate-plugins.mjs, npm run build, node .github/scripts/package-plugins.mjs, then npm run generate-index with the pool directory and GitHub Pages base URL.

The plugin definitions live in .github/scripts/generate-plugins.mjs. The Domms Games Presence implementation is applied by .github/scripts/fix-domms-presence.mjs after generation. GitHub Actions then builds and publishes the generated Valenced plugin folders.
