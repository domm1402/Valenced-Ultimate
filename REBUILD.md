# Valenced Ultimate: useful-plugin rebuild

This repository is being rebuilt around actual Discord client features, not generic text encoders.

## Honest capability boundary

A Valenced JavaScript plugin can change supported client UI/hooks. It cannot grant Discord Nitro, unlock server-side permissions, or independently publish a user's live `Playing` presence unless Valenced exposes a supported activity-publishing API. A live CustomRPC feature needs a separate Android companion/RPC transport; a settings-page preview is not Rich Presence.

## Plugin quality rules

- No filler converters or one-line text utilities.
- Every plugin must change a real client behavior, provide a useful persistent setting, or integrate with a clearly identified companion.
- Label cosmetic-only effects as local.
- Never request Discord account passwords/tokens or send unofficial Gateway presence packets.
- Don't advertise a feature as working until it is tested in Valenced.

## High-priority feature tracks

### Presence / RPC
1. CustomRPC companion connector (Android app + local authenticated bridge)
2. RPC connection status and diagnostics
3. Activity profile presets
4. Per-game activity templates
5. Activity schedule / auto-switch rules
6. Presence privacy quick controls
7. Activity preview using real RPC payload schema
8. RPC reconnect and error log

### Nitro-adjacent (client-side only)
9. Profile theme/color preview
10. Avatar decoration preview
11. Profile effect preview
12. Banner/profile layout preview
13. Emoji/sticker favorites organizer (only existing entitlements)
14. Nitro feature explainer and entitlement checker (no bypass)
15. Local profile cosmetics mock-up

### Client quality-of-life
16. Message edit history viewer (local cache only, if supported)
17. Quick reply snippets
18. Channel unread dashboard
19. Server/channel mute presets
20. Notification filters
21. Compact mode toggle
22. AMOLED theme
23. Font size controls
24. Message spacing controls
25. Media auto-play controls
26. Link confirmation / safety prompt
27. Copy message metadata
28. Jump-to-date helper
29. Search shortcuts
30. Better attachment preview controls

The list above is a scoped starting backlog, not a claim that all items are implemented. The published index must only contain buildable, tested plugins.
