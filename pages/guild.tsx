import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import {
  Users,
  Shield,
  Crown,
  Star,
  ArrowRight,
  CaretRight,
  Plus,
  Chat,
  UserPlus,
  Gear,
  Globe,
  Anchor,
  Sword,
  Lightning,
  TreeStructure,
  MagnifyingGlass,
  X,
  PaperPlaneTilt,
  Lock,
} from "@phosphor-icons/react";
import BrandLogo from "@/components/BrandLogo";
import DimensionBackground from "@/components/effects/DimensionBackground";
import { useGuildStore } from "@/lib/guild/store";
import type { GuildPerk } from "@/lib/guild/types";

function CreateGuildForm({ onClose }: { onClose: () => void }) {
  const createGuild = useGuildStore((s) => s.createGuild);
  const [name, setName] = useState("");
  const [tag, setTag] = useState("");
  const [desc, setDesc] = useState("");

  const handleCreate = () => {
    if (!name.trim() || !tag.trim()) return;
    createGuild(name.trim(), tag.trim().toUpperCase().slice(0, 4), desc.trim());
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bridge-panel p-6"
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-lg font-bold">创建公会</h3>
        <button onClick={onClose} className="rounded-lg p-1 text-muted hover:text-foreground">
          <X size={18} />
        </button>
      </div>
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">公会名称</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="输入公会名称"
            className="w-full rounded-xl border border-primary/10 bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary/50 focus:outline-none"
            maxLength={20}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">公会标签 (4位)</label>
          <input
            type="text"
            value={tag}
            onChange={(e) => setTag(e.target.value.toUpperCase().slice(0, 4))}
            placeholder="TAG"
            className="w-full rounded-xl border border-primary/10 bg-background px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted focus:border-primary/50 focus:outline-none"
            maxLength={4}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">公会简介</label>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="描述你的公会..."
            className="w-full resize-none rounded-xl border border-primary/10 bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary/50 focus:outline-none"
            rows={3}
            maxLength={200}
          />
        </div>
        <button
          onClick={handleCreate}
          disabled={!name.trim() || !tag.trim()}
          className="w-full rounded-xl bg-primary py-2.5 text-sm font-bold text-background transition-all hover:bg-primary/90 disabled:opacity-40"
        >
          创建公会
        </button>
      </div>
    </motion.div>
  );
}

function GuildChatPanel() {
  const { guild, chatMessages, sendChatMessage } = useGuildStore();
  const [msg, setMsg] = useState("");

  const handleSend = () => {
    if (!msg.trim() || !guild) return;
    sendChatMessage({
      id: `msg_${Date.now()}`,
      senderId: "self",
      senderName: "你",
      content: msg.trim(),
      timestamp: Date.now(),
    });
    setMsg("");
  };

  return (
    <div className="bridge-panel holo-scan flex h-full flex-col p-4">
      <div className="bridge-panel-header -mx-4 -mt-4 mb-3 px-4">
        <div className="flex items-center gap-2">
          <Chat size={16} weight="bold" className="text-primary" />
          <span className="text-sm font-bold">公会频道</span>
          <span className="ml-auto font-mono tabular-nums text-[10px] text-muted">{chatMessages.length} 条消息</span>
        </div>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto">
        {chatMessages.length === 0 && (
          <p className="py-8 text-center text-xs text-muted">暂无消息，发送第一条吧</p>
        )}
        {chatMessages.slice(-20).map((m) => (
          <div key={m.id} className="flex items-start gap-2">
            <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
              {m.senderName[0]}
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold">{m.senderName}</span>
                <span className="font-mono tabular-nums text-[10px] text-muted">
                  {new Date(m.timestamp).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <p className="text-xs text-muted">{m.content}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <input
          type="text"
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="输入消息..."
          className="flex-1 rounded-xl border border-primary/10 bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted focus:border-primary/50 focus:outline-none"
          maxLength={200}
        />
        <button
          onClick={handleSend}
          disabled={!msg.trim()}
          className="rounded-xl bg-primary px-3 py-2 text-background transition-all hover:bg-primary/90 disabled:opacity-40"
        >
          <PaperPlaneTilt size={16} weight="bold" />
        </button>
      </div>
    </div>
  );
}

function PerkCard({ perk, onUpgrade }: { perk: GuildPerk; onUpgrade: () => void }) {
  const progress = (perk.level / perk.maxLevel) * 100;
  return (
    <div className="rounded-xl border border-primary/10 bg-background/50 p-3 transition-all hover:border-primary/20">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-bold">{perk.name}</p>
          <p className="mt-0.5 text-[11px] text-muted">{perk.description}</p>
        </div>
        <span className="font-mono tabular-nums text-[10px] font-bold text-primary">
          Lv.{perk.level}/{perk.maxLevel}
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      {perk.level < perk.maxLevel && (
        <button
          onClick={onUpgrade}
          className="mt-2 w-full rounded-lg border border-primary/30 bg-primary/5 py-1.5 text-[11px] font-semibold text-primary transition-all hover:bg-primary/10"
        >
          升级 ({perk.cost} 贡献)
        </button>
      )}
    </div>
  );
}

export default function GuildPage() {
  const reducedMotion = useReducedMotion();
  const { guild, friends, createGuild, leaveGuild, upgradePerk, addExp, addContribution } = useGuildStore();
  const [showCreate, setShowCreate] = useState(false);

  if (!guild) {
    return (
      <div className="relative min-h-[100dvh] bg-background text-foreground">
        <Head><title>公会 - Project M</title></Head>
        <DimensionBackground intensity="subtle" />
        <div className="noise-overlay" />

        <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <BrandLogo size={28} variant="icon" className="text-primary" />
            <BrandLogo size={28} variant="wordmark" />
          </Link>
        </header>

        <main className="relative z-10 flex min-h-[80dvh] items-center justify-center px-4">
          <AnimatePresence mode="wait">
            {showCreate ? (
              <div key="create" className="w-full max-w-md">
                <CreateGuildForm onClose={() => setShowCreate(false)} />
              </div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <div className="mx-auto mb-6 inline-flex h-20 w-20 items-center justify-center rounded-2xl border border-primary/20 bg-primary/5">
                  <Shield size={40} weight="bold" className="text-primary" />
                </div>
                <h1 className="font-display text-2xl font-bold">创建你的公会</h1>
                <p className="mt-2 max-w-sm text-sm text-muted">
                  与维度行者组建公会，共同升级公会科技，在锚点网络上建立你的势力。
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <button
                    onClick={() => setShowCreate(true)}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-background shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 active:scale-[0.97]"
                  >
                    <Plus size={18} weight="bold" />
                    创建公会
                  </button>
                  <button
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-primary/10 bg-panel/80 px-6 text-sm font-semibold backdrop-blur-sm transition-all hover:border-primary/30 active:scale-[0.97]"
                  >
                    <MagnifyingGlass size={18} />
                    搜索公会
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    );
  }

  return (
    <div className="relative min-h-[100dvh] bg-background text-foreground">
      <Head><title>{guild.name} - 公会 - Project M</title></Head>
      <DimensionBackground intensity="subtle" />
      <div className="noise-overlay" />

      <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-2">
          <BrandLogo size={28} variant="icon" className="text-primary" />
          <BrandLogo size={28} variant="wordmark" />
        </Link>
        <nav className="flex items-center gap-2">
          <Link href="/" className="rounded-lg px-3 py-2 text-xs font-medium text-muted hover:text-foreground">
            返回枢纽
          </Link>
        </nav>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-8">
        {/* Guild Header */}
        <div className="bridge-panel holo-scan bridge-glow p-6 mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/5">
                <Shield size={32} weight="bold" className="text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-2xl font-bold">{guild.name}</h1>
                  <span className="rounded-md border border-primary/20 bg-primary/5 px-2 py-0.5 font-mono text-[11px] font-bold text-primary">
                    [{guild.tag}]
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted">{guild.description || "暂无简介"}</p>
                <div className="mt-1.5 flex items-center gap-4 text-[11px] text-muted">
                  <span className="flex items-center gap-1">
                    <Users size={12} /> {guild.memberCount}/{guild.maxMembers} 成员
                  </span>
                  <span className="flex items-center gap-1">
                    <Star size={12} /> Lv.{guild.level}
                  </span>
                  <span className="flex items-center gap-1">
                    <Anchor size={12} /> 锚点 {guild.anchorStability}%
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  addContribution(10);
                  addExp(10);
                }}
                className="rounded-xl border border-primary/10 bg-panel px-4 py-2 text-xs font-semibold transition-all hover:border-primary/30"
              >
                贡献 (+10)
              </button>
              <button
                onClick={leaveGuild}
                className="rounded-xl border border-entropy/20 bg-entropy/5 px-4 py-2 text-xs font-semibold text-entropy transition-all hover:bg-entropy/10"
              >
                退出公会
              </button>
            </div>
          </div>

          {/* Exp bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-muted">公会经验</span>
              <span className="font-mono tabular-nums text-primary">{guild.exp}/{guild.expToNext}</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-quantum transition-all"
                style={{ width: `${(guild.exp / guild.expToNext) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          {/* Members */}
          <div className="lg:col-span-4">
            <div className="bridge-panel holo-scan p-4">
              <div className="bridge-panel-header -mx-4 -mt-4 mb-3 px-4">
                <h3 className="flex items-center gap-2 text-sm font-bold">
                  <Users size={16} weight="bold" className="text-primary" />
                  公会成员
                </h3>
              </div>
              <div className="space-y-2">
                {guild.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-xl border border-primary/10 bg-background/50 p-2.5"
                  >
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                        {member.name[0]}
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold">{member.name}</span>
                          {member.role === "leader" && (
                            <Crown size={12} weight="fill" className="text-anchor" />
                          )}
                        </div>
                        <span className="text-[10px] text-muted">{member.rank}</span>
                      </div>
                    </div>
                    <span className="font-mono tabular-nums text-[10px] text-muted">{member.contribution} 贡献</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Perks */}
          <div className="lg:col-span-4">
            <div className="bridge-panel holo-scan p-4">
              <div className="bridge-panel-header -mx-4 -mt-4 mb-3 px-4">
                <h3 className="flex items-center gap-2 text-sm font-bold">
                  <TreeStructure size={16} weight="bold" className="text-primary" />
                  公会科技
                </h3>
              </div>
              <div className="space-y-2">
                {guild.perks.map((perk) => (
                  <PerkCard
                    key={perk.id}
                    perk={perk}
                    onUpgrade={() => upgradePerk(perk.id)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Chat */}
          <div className="lg:col-span-4" style={{ minHeight: "400px" }}>
            <GuildChatPanel />
          </div>
        </div>
      </main>
    </div>
  );
}