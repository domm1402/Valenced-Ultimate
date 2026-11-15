import { storage } from "@vendetta/plugin";
import Settings from "./Settings";

storage.enabled ??= true;
storage.richPresence ??= "Playing Valenced Ultimate";
storage.customEmoji ??= true;
storage.appIcons ??= true;
storage.badgePreview ??= true;
storage.badges ??= "Nitro-style (local)|#5865f2|#ffffff\nEarly Supporter (mock)|#3ba55c|#ffffff";

export default {
  onLoad() {
    console.log("[Valenced Ultimate] Loaded. Cosmetic controls are local.");
  },
  onUnload() {},
  settings: Settings
};
