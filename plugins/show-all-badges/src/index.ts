/**
 * Show All Badges — experimental Valenced/Vendetta-compatible port.
 *
 * Discord's badge overflow cap is calculated inside UserProfileBadgeListRows.
 * Unlike Vencord's declarative string patch, the client-side metro patch API
 * cannot safely rewrite that internal calculation. This module detects the
 * target and logs a diagnostic rather than silently claiming it patched it.
 */
import { findByTypeNameAll } from "@vendetta/metro";

export default {
  onLoad() {
    const targets = findByTypeNameAll("UserProfileBadgeListRows") || [];
    if (targets.length) {
      console.warn(
        "[Show All Badges] Found UserProfileBadgeListRows, but the overflow calculation " +
        "needs a runtime-compatible patch. No badge limit was changed."
      );
    } else {
      console.warn(
        "[Show All Badges] UserProfileBadgeListRows was not found in this Discord build."
      );
    }
    console.log("[Show All Badges] Experimental port loaded.");
  },
  onUnload() {
    console.log("[Show All Badges] Unloaded.");
  }
};
