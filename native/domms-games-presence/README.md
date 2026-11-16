# Domms Games Presence

A Valenced external Android plugin backed by Discord's Social SDK.

The plugin provides a game search/selection screen, editable activity details and state, persistent settings, Update Presence and Clear Presence actions. The game catalogue selection is presentation text; Discord Rich Presence publishing uses the user's registered Discord Application ID.

The GitHub Actions workflow builds the Kotlin/C++ bridge against the uploaded `discord_partner_sdk.aar`, compiles the Valenced JS settings UI, packages the DEX plugin class and ABI-specific native libraries, and uploads `domms-games-presence.zip`.

Supported Android ABIs: arm64-v8a, armeabi-v7a and x86_64.

Build packaging is handled by `.github/workflows/build-domms-presence.yml` on this branch.

The plugin UI build fixes are included in this revision.

The CI job now builds this plugin independently of the legacy plugin collection.
