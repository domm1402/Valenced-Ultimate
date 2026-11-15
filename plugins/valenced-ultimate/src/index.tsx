import { storage } from "@vendetta/plugin";
import Settings from "./Settings";
import { installBadgeShowcase } from "./BadgeShowcase";

storage.enabled ??= true;
storage.richPresence ??= "Playing Valenced Ultimate";
storage.customEmoji ??= true;
storage.appIcons ??= true;
storage.badgePreview ??= true;
storage.badges ??= "Nitro-style (local)|#5865f2|#ffffff\nEarly Supporter (mock)|#3ba55c|#ffffff";

let unpatch: (() => void) | undefined;

export default {
  onLoad() {
    try { unpatch = installBadgeShowcase(); }
    catch (error) { console.error("[Valenced Ultimate] badge patch failed", error); }
    console.log("[Valenced Ultimate] Loaded.");
  },
  onUnload() {
    try { unpatch?.(); } catch {}
    unpatch = undefined;
  },
  settings: Settings
};
