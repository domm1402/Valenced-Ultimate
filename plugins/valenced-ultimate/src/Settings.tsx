import { ReactNative as RN } from "@vendetta/metro/common";
import { Forms } from "@vendetta/ui/components";
import { useProxy } from "@vendetta/storage";
import { storage } from "@vendetta/plugin";

const { FormSection, FormSwitchRow, FormInput } = Forms;

export default function Settings() {
  useProxy(storage);
  return (
    <RN.ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }}>
      <FormSection title="Valenced Ultimate" titleStyleType="no_border">
        <FormSwitchRow label="Badge showcase preference" subLabel="Local preview toggle; does not add official badges." value={storage.badgePreview} onValueChange={(v: boolean) => storage.badgePreview = v} />
        <FormSwitchRow label="Nitro-style emoji preference" subLabel="A preference only. Discord Nitro permissions remain unchanged." value={storage.customEmoji} onValueChange={(v: boolean) => storage.customEmoji = v} />
        <FormSwitchRow label="Custom app icon preference" subLabel="A preference only; requires actual launcher/client icon support." value={storage.appIcons} onValueChange={(v: boolean) => storage.appIcons = v} />
        <FormInput title="Rich Presence text (local)" placeholder="Playing Valenced Ultimate" value={storage.richPresence} onChange={(v: string) => storage.richPresence = v} />
        <FormInput title="Badge preview labels" placeholder="One label per line" value={storage.badges} onChange={(v: string) => storage.badges = v} multiline />
      </FormSection>
      <FormSection title="Feature scope">
        <RN.Text style={{ color: "#b5bac1", paddingHorizontal: 16, paddingVertical: 8 }}>
          This initial release saves settings and offers cosmetic preferences. It does not unlock Nitro, publish Discord Rich Presence, grant server-side badges, or alter Discord account data. Those require platform/account authorization and supported client APIs.
        </RN.Text>
      </FormSection>
    </RN.ScrollView>
  );
}
