import { storage } from "@vendetta/plugin";
import { Forms } from "@vendetta/ui/components";

const { FormSection, FormRow, FormSwitch, FormInput } = Forms;

export default function Settings() {
  return (
    <FormSection title="Valenced Ultimate">
      <FormRow label="Enable cosmetic profile preview" subLabel="Local mock badges only; no official account badges." trailing={<FormSwitch value={!!storage.badgePreview} onValueChange={(v: boolean) => storage.badgePreview = v} />} />
      <FormRow label="Nitro-style emoji preference" subLabel="Preference toggle only. Does not unlock Nitro emoji permissions." trailing={<FormSwitch value={!!storage.customEmoji} onValueChange={(v: boolean) => storage.customEmoji = v} />} />
      <FormRow label="Custom app icon preference" subLabel="Preference toggle only; app icon assets/launcher support required." trailing={<FormSwitch value={!!storage.appIcons} onValueChange={(v: boolean) => storage.appIcons = v} />} />
      <FormRow label="Rich Presence text" subLabel="Saved locally; does not publish Discord RPC." />
      <FormInput value={String(storage.richPresence || "")} onChange={(v: string) => storage.richPresence = v} placeholder="Playing Valenced Ultimate" />
      <FormRow label="Local badge preview labels" subLabel="One label per line. Preview only." />
      <FormInput value={String(storage.badges || "")} onChange={(v: string) => storage.badges = v} placeholder="Nitro-style (local)" />
      <FormRow label="Status" subLabel="This build stores preferences and provides a settings UI. Actual Nitro/RPC/server-side features require platform support and cannot be spoofed into real entitlements." />
    </FormSection>
  );
}
