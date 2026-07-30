"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Users,
  UserPlus,
  User,
  MagnifyingGlass,
  X,
  Check,
  Clock,
  Envelope,
  Chat,
  GameController,
  Circle,
  WifiHigh,
  WifiX,
  Sword,
  Shield,
  ArrowLeft,
  AddressBook,
  Hourglass,
  PaperPlaneTilt,
  UserCircle,
  Globe,
  Crown,
  Star,
  Lightning,
  CaretRight,
} from "@phosphor-icons/react";
import BrandLogo from "@/components/BrandLogo";
import DimensionBackground from "@/components/effects/DimensionBackground";
import { useGuildStore } from "@/lib/guild/store";
import type { Friend, FriendRequest } from "@/lib/guild/types";

const ONLINE_STATUS_CONFIG = {
  online: { icon: Circle, color: "text-success", label: "在线" },
  offline: { icon: Circle, color: "text-muted", label: "离线" },
  "in-game": { icon: GameController, color: "text-primary", label: "游戏中" },
} as const;

function AddFriendModal({ onClose }: { onClose: () => void }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState<{ id: string; name: string; guildTag: string | null } | null>(null);
  const [searching, setSearching] = useState(false);
  const [sent, setSent] = useState(false);
  const sendFriendRequest = useGuildStore((s) => s.sendFriendRequest);

  const handleSearch = useCallback(() => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setTimeout(() => {
      setSearchResult({
        id: `player_${searchQuery.trim().toLowerCase().replace(/\s/g, "_")}`,
        name: searchQuery.trim(),
        guildTag: null,
      });
      setSearching(false);
    }, 800);
  }, [searchQuery]);

  const handleSendRequest = useCallback(() => {
    if (!searchResult) return;
    sendFriendRequest({
      id: `fr_${Date.now()}`,
      fromId: "self",
      fromName: "你",
      toId: searchResult.id,
      toName: searchResult.name,
      status: "pending",
      createdAt: Date.now(),
    });
    setSent(true);
  }, [searchResult, sendFriendRequest]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="w-full max-w-md rounded-2xl border border-border bg-panel p-6 shadow-2xl"
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-bold text-lg">添加好友</h3>
        <button onClick={onClose} className="rounded-lg p-1 text-muted transition-colors hover:text-foreground">
          <X size={18} weight="bold" />
        </button>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setSearchResult(null); setSent(false); }}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="输入玩家名称搜索..."
          className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
          maxLength={30}
        />
        <button
          onClick={handleSearch}
          disabled={!searchQuery.trim() || searching}
          className="rounded-xl bg-primary px-4 py-2.5 text-white transition-all hover:bg-primary/90 disabled:opacity-40"
        >
          <MagnifyingGlass size={18} weight="bold" />
        </button>
      </div>

      {searching && (
        <div className="mt-4 flex items-center justify-center py-8">
          <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
        </div>
      )}

      {searchResult && !sent && !searching && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 rounded-xl border border-border bg-panel-raised p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <UserCircle size={24} weight="bold" className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold">{searchResult.name}</p>
                <p className="text-xs text-muted">维度行者</p>
              </div>
            </div>
            <button
              onClick={handleSendRequest}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white transition-all hover:bg-primary/90 active:scale-95"
            >
              <UserPlus size={14} weight="bold" />
              添加
            </button>
          </div>
        </motion.div>
      )}

      {sent && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 rounded-xl border border-success/30 bg-success/5 p-4 text-center"
        >
          <Check size={24} weight="bold" className="mx-auto text-success" />
          <p className="mt-2 text-sm font-bold text-success">好友请求已发送</p>
          <p className="mt-1 text-xs text-muted">等待 {searchResult?.name} 确认</p>
        </motion.div>
      )}
    </motion.div>
  );
}

function FriendCard({ friend, onRemove }: { friend: Friend; onRemove: () => void }) {
  const statusConfig = ONLINE_STATUS_CONFIG[friend.status];
  const StatusIcon = statusConfig.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex items-center justify-between rounded-xl border border-border bg-panel p-4 transition-all hover:border-primary/20 hover:shadow-sm"
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <UserCircle size={24} weight="bold" className="text-primary" />
          </div>
          <span className={`absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-panel bg-background ${statusConfig.color}`}>
            <StatusIcon size={8} weight="fill" />
          </span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold">{friend.name}</p>
            {friend.guildTag && (
              <span className="rounded-md bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-primary">
                [{friend.guildTag}]
              </span>
            )}
          </div>
          <p className="flex items-center gap-1 text-xs text-muted">
            {statusConfig.label}
            {friend.status === "offline" && (
              <span className="text-muted">
                · {Math.floor((Date.now() - friend.lastSeen) / 3600000)}小时前
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {friend.status !== "offline" && (
          <button className="rounded-lg border border-border p-2 text-muted transition-all hover:border-primary/30 hover:text-primary" title="私聊">
            <Chat size={16} weight="bold" />
          </button>
        )}
        {friend.status === "online" && (
          <button className="rounded-lg border border-border p-2 text-muted transition-all hover:border-accent/30 hover:text-accent" title="邀请组队">
            <Sword size={16} weight="bold" />
          </button>
        )}
        <button onClick={onRemove} className="rounded-lg border border-border p-2 text-muted transition-all hover:border-danger/30 hover:text-danger" title="删除好友">
          <X size={16} weight="bold" />
        </button>
      </div>
    </motion.div>
  );
}

function FriendRequestCard({ request, onAccept, onDecline }: { request: FriendRequest; onAccept: () => void; onDecline: () => void }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex items-center justify-between rounded-xl border border-accent/20 bg-accent/5 p-4"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
          <UserCircle size={24} weight="bold" className="text-accent" />
        </div>
        <div>
          <p className="text-sm font-bold">{request.fromName}</p>
          <p className="flex items-center gap-1 text-xs text-muted">
            <Hourglass size={12} weight="bold" />
            {request.status === "pending" ? "待处理" : request.status === "accepted" ? "已接受" : "已拒绝"}
          </p>
        </div>
      </div>

      {request.status === "pending" && (
        <div className="flex items-center gap-2">
          <button
            onClick={onAccept}
            className="flex items-center gap-1 rounded-lg bg-success px-3 py-1.5 text-xs font-bold text-white transition-all hover:bg-success/90 active:scale-95"
          >
            <Check size={14} weight="bold" />
            接受
          </button>
          <button
            onClick={onDecline}
            className="flex items-center gap-1 rounded-lg border border-border bg-panel px-3 py-1.5 text-xs font-medium text-muted transition-all hover:border-danger/30 hover:text-danger active:scale-95"
          >
            <X size={14} weight="bold" />
            拒绝
          </button>
        </div>
      )}
    </motion.div>
  );
}

export default function FriendsPage() {
  const reducedMotion = useReducedMotion();
  const { friends, friendRequests, addFriend, removeFriend, acceptFriendRequest, declineFriendRequest } = useGuildStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"friends" | "requests">("friends");
  const [chatOpen, setChatOpen] = useState(false);
  const [chatTarget, setChatTarget] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<{ id: string; sender: string; content: string; time: number }[]>([]);
  const [chatInput, setChatInput] = useState("");

  const onlineCount = friends.filter((f) => f.status !== "offline").length;
  const pendingRequests = friendRequests.filter((r) => r.status === "pending");

  const handleSendChat = useCallback(() => {
    if (!chatInput.trim() || !chatTarget) return;
    setChatMessages((prev) => [
      ...prev,
      { id: `msg_${Date.now()}`, sender: "self", content: chatInput.trim(), time: Date.now() },
    ]);
    setChatInput("");
  }, [chatInput, chatTarget]);

  const handleAcceptRequest = useCallback((requestId: string) => {
    const request = friendRequests.find((r) => r.id === requestId);
    if (!request) return;
    acceptFriendRequest(requestId);
    addFriend({
      id: request.fromId,
      name: request.fromName,
      avatarUrl: null,
      status: "online",
      lastSeen: Date.now(),
      guildTag: null,
    });
  }, [friendRequests, acceptFriendRequest, addFriend]);

  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-background text-foreground">
      <DimensionBackground intensity="subtle" />

      <header className="relative z-20 border-b border-border bg-panel/60 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2 rounded-lg text-sm font-medium text-muted transition-colors hover:text-foreground">
            <ArrowLeft size={18} weight="bold" />
            返回指挥部
          </Link>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 font-mono text-xs text-muted">
              <WifiHigh size={14} weight="bold" className="text-success" />
              {onlineCount} 在线
            </span>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white transition-all hover:bg-primary/90 active:scale-95"
            >
              <UserPlus size={14} weight="bold" />
              添加好友
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 px-4 py-8">
        <div className="flex w-full gap-6">
          {/* Sidebar */}
          <div className="hidden w-56 shrink-0 lg:block">
            <div className="sticky top-24 space-y-1">
              <button
                onClick={() => setActiveTab("friends")}
                className={`flex w-full items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                  activeTab === "friends"
                    ? "bg-primary/10 text-primary"
                    : "text-muted hover:bg-panel-raised hover:text-foreground"
                }`}
              >
                <Users size={18} weight={activeTab === "friends" ? "fill" : "bold"} />
                好友列表
                <span className="ml-auto font-mono text-xs">{friends.length}</span>
              </button>
              <button
                onClick={() => setActiveTab("requests")}
                className={`flex w-full items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                  activeTab === "requests"
                    ? "bg-accent/10 text-accent"
                    : "text-muted hover:bg-panel-raised hover:text-foreground"
                }`}
              >
                <Envelope size={18} weight={activeTab === "requests" ? "fill" : "bold"} />
                好友请求
                {pendingRequests.length > 0 && (
                  <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent px-1.5 font-mono text-[10px] font-bold text-white">
                    {pendingRequests.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Mobile Tabs */}
            <div className="mb-4 flex gap-2 lg:hidden">
              <button
                onClick={() => setActiveTab("friends")}
                className={`flex-1 rounded-xl px-4 py-2 text-sm font-bold transition-all ${
                  activeTab === "friends"
                    ? "bg-primary/10 text-primary"
                    : "border border-border text-muted"
                }`}
              >
                好友 ({friends.length})
              </button>
              <button
                onClick={() => setActiveTab("requests")}
                className={`flex-1 rounded-xl px-4 py-2 text-sm font-bold transition-all ${
                  activeTab === "requests"
                    ? "bg-accent/10 text-accent"
                    : "border border-border text-muted"
                }`}
              >
                请求 ({pendingRequests.length})
              </button>
            </div>

            {/* Friends Tab */}
            {activeTab === "friends" && (
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-bold text-lg">
                    好友列表
                    <span className="ml-2 font-mono text-sm font-normal text-muted">{friends.length} 位</span>
                  </h2>
                </div>

                {friends.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-panel py-16 text-center">
                    <AddressBook size={48} weight="thin" className="text-muted" />
                    <p className="mt-4 text-sm font-medium text-muted">暂无好友</p>
                    <p className="mt-1 text-xs text-muted">搜索其他玩家并发送好友请求</p>
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="mt-4 flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white transition-all hover:bg-primary/90 active:scale-95"
                    >
                      <UserPlus size={16} weight="bold" />
                      添加第一位好友
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <AnimatePresence>
                      {friends.map((friend) => (
                        <FriendCard
                          key={friend.id}
                          friend={friend}
                          onRemove={() => removeFriend(friend.id)}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            )}

            {/* Requests Tab */}
            {activeTab === "requests" && (
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-bold text-lg">
                    好友请求
                    <span className="ml-2 font-mono text-sm font-normal text-muted">{friendRequests.length} 条</span>
                  </h2>
                </div>

                {friendRequests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-panel py-16 text-center">
                    <Envelope size={48} weight="thin" className="text-muted" />
                    <p className="mt-4 text-sm font-medium text-muted">暂无好友请求</p>
                    <p className="mt-1 text-xs text-muted">当其他玩家向你发送好友请求时会显示在这里</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <AnimatePresence>
                      {friendRequests.map((request) => (
                        <FriendRequestCard
                          key={request.id}
                          request={request}
                          onAccept={() => handleAcceptRequest(request.id)}
                          onDecline={() => declineFriendRequest(request.id)}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Add Friend Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
          >
            <AddFriendModal onClose={() => setShowAddModal(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="relative z-10 border-t border-border py-4 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
          公平竞技 · 无付费加成 · 多重宇宙
        </p>
      </footer>
    </div>
  );
}