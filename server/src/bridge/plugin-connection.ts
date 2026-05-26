/**
 * Plugin connection wrapper — Phase 6.
 *
 * Encapsulates an active WebSocket connection from a paired RemNote plugin.
 * Tracks metadata, handles keep-alive pings, and exposes clean lifecycle events.
 */

import type WebSocket from 'ws';

export interface PluginConnectionInfo {
  connectionId: string;
  userId: string;
  deviceId: string;
  pluginSessionId: string;
  connectedAt: string;
  lastPongAt: string;
  alive: boolean;
}

export class PluginConnection {
  public readonly connectionId: string;
  public readonly userId: string;
  public readonly deviceId: string;
  public readonly pluginSessionId: string;
  public readonly connectedAt: string;
  public lastPongAt: string;
  public alive: boolean;

  private socket: WebSocket;

  constructor(
    socket: WebSocket,
    connectionId: string,
    userId: string,
    deviceId: string,
    pluginSessionId: string
  ) {
    this.socket = socket;
    this.connectionId = connectionId;
    this.userId = userId;
    this.deviceId = deviceId;
    this.pluginSessionId = pluginSessionId;
    this.connectedAt = new Date().toISOString();
    this.lastPongAt = this.connectedAt;
    this.alive = true;

    socket.on('pong', () => {
      this.alive = true;
      this.lastPongAt = new Date().toISOString();
    });
  }

  get readyState(): number {
    return this.socket.readyState;
  }

  get socketRef(): WebSocket {
    return this.socket;
  }

  get isOpen(): boolean {
    return this.socket.readyState === 1; // WebSocket.OPEN
  }

  send(data: string, callback?: (err?: Error) => void): void {
    this.socket.send(data, callback);
  }

  ping(): void {
    if (this.isOpen) {
      this.socket.ping();
    }
  }

  close(code: number, reason: string): void {
    this.alive = false;
    this.socket.close(code, reason);
  }

  onMessage(handler: (raw: WebSocket.RawData) => void): void {
    this.socket.on('message', handler);
  }

  onClose(handler: () => void): void {
    this.socket.on('close', handler);
  }

  onError(handler: (err: Error) => void): void {
    this.socket.on('error', handler);
  }

  getInfo(): PluginConnectionInfo {
    return {
      connectionId: this.connectionId,
      userId: this.userId,
      deviceId: this.deviceId,
      pluginSessionId: this.pluginSessionId,
      connectedAt: this.connectedAt,
      lastPongAt: this.lastPongAt,
      alive: this.alive,
    };
  }
}
