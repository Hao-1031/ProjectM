import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import MultiplayerLobby from "./MultiplayerLobby";

describe("MultiplayerLobby", () => {
  const baseProps = {
    room: null,
    isOpen: true,
    onClose: vi.fn(),
    onCreateRoom: vi.fn(),
    onJoinRoom: vi.fn(),
    onDiscoverRooms: vi.fn(),
    onReadyToggle: vi.fn(),
    onStartGame: vi.fn(),
    onLeaveRoom: vi.fn(),
    onCopyInvite: vi.fn(),
    discoveredRooms: [],
    players: [],
    isReconnecting: false,
    reconnectAttempts: 0,
    error: null,
    gameStarted: false,
  };

  it("renders create room tab by default", () => {
    render(<MultiplayerLobby {...baseProps} />);
    expect(screen.getAllByText("创建房间").length).toBe(2);
    expect(screen.getByText("战役撤离")).toBeInTheDocument();
  });

  it("switches to join room tab", () => {
    render(<MultiplayerLobby {...baseProps} />);
    fireEvent.click(screen.getByText("加入房间"));
    expect(screen.getByPlaceholderText("XXXXXX")).toBeInTheDocument();
  });

  it("calls onCreateRoom with player name and mode", () => {
    const onCreateRoom = vi.fn();
    render(<MultiplayerLobby {...baseProps} onCreateRoom={onCreateRoom} />);
    const input = screen.getByPlaceholderText("输入你的代号");
    fireEvent.change(input, { target: { value: "Alpha" } });
    fireEvent.click(screen.getAllByText("创建房间").pop()!);
    expect(onCreateRoom).toHaveBeenCalledWith("Alpha", "campaign");
  });

  it("calls onJoinRoom with code and name", () => {
    const onJoinRoom = vi.fn();
    render(<MultiplayerLobby {...baseProps} onJoinRoom={onJoinRoom} />);
    fireEvent.click(screen.getByText("加入房间"));
    const nameInput = screen.getByPlaceholderText("输入你的代号");
    const codeInput = screen.getByPlaceholderText("XXXXXX");
    fireEvent.change(nameInput, { target: { value: "Beta" } });
    fireEvent.change(codeInput, { target: { value: "ABCD12" } });
    fireEvent.click(screen.getAllByText("加入房间").pop()!);
    expect(onJoinRoom).toHaveBeenCalledWith("ABCD12", "Beta");
  });

  it("shows error message", () => {
    render(<MultiplayerLobby {...baseProps} error="连接失败" />);
    expect(screen.getByText("连接失败")).toBeInTheDocument();
  });

  it("shows player list when in room", () => {
    const room = { isHost: () => true, isLocalReady: () => false, roomCode: "ABCD12" } as never;
    render(
      <MultiplayerLobby
        {...baseProps}
        room={room}
        players={[
          { peerId: "p1", playerName: "Guest", ready: true, latency: 0, lastInputFrame: 0 },
        ]}
      />
    );
    expect(screen.getByText("ABCD12")).toBeInTheDocument();
    expect(screen.getByText("Guest")).toBeInTheDocument();
  });

  it("calls onReadyToggle when ready button clicked", () => {
    const onReadyToggle = vi.fn();
    const room = { isHost: () => false, isLocalReady: () => false, roomCode: "ABCD12" } as never;
    render(
      <MultiplayerLobby
        {...baseProps}
        room={room}
        players={[
          { peerId: "p1", playerName: "Guest", ready: false, latency: 0, lastInputFrame: 0 },
        ]}
        onReadyToggle={onReadyToggle}
      />
    );
    fireEvent.click(screen.getByText("准备"));
    expect(onReadyToggle).toHaveBeenCalled();
  });

  it("shows reconnecting state", () => {
    const room = { isHost: () => false, isLocalReady: () => false, roomCode: "ABCD12" } as never;
    render(
      <MultiplayerLobby
        {...baseProps}
        room={room}
        players={[
          { peerId: "p1", playerName: "Guest", ready: false, latency: 0, lastInputFrame: 0 },
        ]}
        isReconnecting
        reconnectAttempts={2}
      />
    );
    expect(screen.getByText(/正在重连/)).toBeInTheDocument();
  });
});
