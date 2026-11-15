/**
 * Show All Badges (Valenced)
 *
 * Replaces the profile badge list's render result with a non-collapsing
 * version when the Discord component exposes its badge entries in props.
 *
 * This is a best-effort runtime component patch (Valenced doesn't expose
 * Vencord's webpack factory-source regex patch API).
 */
import { findByTypeNameAll } from "@vendetta/metro";
import { instead } from "@vendetta/patcher";

const cleanups: (() => void)[] = [];

function expandBadgeProps(props: any) {
  // Discord versions have used different names for the badge collection.
  for (const key of ["badges", "badgeList", "profileBadges", "userProfileBadges"]) {
    const list = props?.[key];
    if (Array.isArray(list)) {
      // Preserve all entries; only remove the common presentation cap.
      props[key] = list.slice();
      for (const cap of ["maxVisible", "maxBadges", "maxRows", "limit", "badgeLimit"]) {
        if (cap in props) props[cap] = list.length;
      }
      return true;
    }
  }
  return false;
}

export default {
  onLoad() {
    const components = findByTypeNameAll("UserProfileBadgeListRows") || [];
    let patched = 0;

    for (const component of components) {
      const target = component?.type ?? component;
      if (typeof target !== "function") continue;

      try {
        cleanups.push(instead(target, "call", (_args: any[], original: Function) => original(..._args)));
        // React function components are called directly by React; patch their
        // props through the component's render/type entry where available.
        if (component?.type && typeof component.type === "function") {
          cleanups.push(instead(component, "type", ([props]: any[], original: Function) => {
            expandBadgeProps(props);
            return original(props);
          }));
          patched++;
        }
      } catch (e) {
        console.warn("[Show All Badges] Couldn't hook badge component", e);
      }
    }

    console.log(`[Show All Badges] Hooked ${patched} badge component(s).`);
    if (!patched) console.warn("[Show All Badges] Discord's badge component shape differs on this build.");
  },
  onUnload() {
    cleanups.splice(0).forEach(fn => fn());
  }
};
