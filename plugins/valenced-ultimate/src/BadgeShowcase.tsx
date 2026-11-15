import { findByProps, findByStoreName, findByTypeNameAll } from "@vendetta/metro";
import { after } from "@vendetta/patcher";
import { findInReactTree } from "@vendetta/utils";
import { storage } from "@vendetta/plugin";

export function installBadgeShowcase() {
  const Tag = findByProps("getBotLabel")?.default;
  if (!Tag || !storage.badgePreview) return () => {};
  const self = findByStoreName("UserStore")?.getCurrentUser?.()?.id;
  if (!self) return () => {};
  const rows = findByTypeNameAll("UserRow") || [];
  const cleanups = rows.map((component: any) => after("type", component, ([props]: any[], tree: any) => {
    const user = props?.user ?? props?.item?.user;
    if (String(user?.id) !== String(self)) return;
    const labels = String(storage.badges || "").split(/\r?\n/).slice(0, 6);
    const target = findInReactTree(tree, (node: any) =>
      Array.isArray(node?.props?.children) && node.props.children.some((child: any) =>
        typeof child === "string" || typeof child?.props?.children === "string"
      )
    );
    if (!target) return;
    if (!Array.isArray(target.props.children)) target.props.children = [target.props.children];
    labels.forEach((line, i) => {
      const [label, bg, fg] = line.split("|");
      if (!label?.trim()) return;
      const valid = (v: string) => /^#[0-9a-f]{6}$/i.test(v || "");
      target.props.children.push(<Tag key={"vu-" + i} type={0} text={label.trim().slice(0,32)}
        backgroundColor={valid(bg) ? bg : "#5865f2"} textColor={valid(fg) ? fg : "#ffffff"} />);
    });
  }));
  return () => cleanups.forEach((fn: any) => fn?.());
}
