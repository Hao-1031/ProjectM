import { Prohibit } from "@phosphor-icons/react";

export default function AuthButton() {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-panel px-2.5 py-1.5 text-xs font-medium text-muted"
      title="注册与登录功能已临时关闭"
    >
      <Prohibit size={14} weight="bold" />
      <span className="hidden sm:inline">登录暂停</span>
    </span>
  );
}
