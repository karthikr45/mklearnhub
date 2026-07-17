import { Logger } from '@nestjs/common'
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'

@WebSocketGateway({ cors: true })
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(NotificationsGateway.name)

  @WebSocketServer()
  server!: Server

  /** Maps a userId to its currently connected socket id. */
  private readonly userSockets = new Map<string, string>()

  handleConnection(client: Socket): void {
    const token = client.handshake.auth?.token as string | undefined
    // Token validation is stubbed — a real implementation would verify the JWT
    // and derive the userId from it. For now we trust the handshake payload.
    const userId = this.validateToken(token, client)
    if (userId) {
      this.userSockets.set(userId, client.id)
      this.logger.debug(`Socket connected for user ${userId}`)
    }
  }

  handleDisconnect(client: Socket): void {
    for (const [userId, socketId] of this.userSockets) {
      if (socketId === client.id) {
        this.userSockets.delete(userId)
        break
      }
    }
  }

  private validateToken(
    token: string | undefined,
    client: Socket,
  ): string | null {
    // No-op stub: accept the connection and use the userId supplied alongside
    // the token in the handshake auth payload.
    void token
    const userId = client.handshake.auth?.userId as string | undefined
    return userId ?? null
  }

  emitToUser(userId: string, event: string, data: unknown): void {
    const socketId = this.userSockets.get(userId)
    if (socketId) {
      this.server.to(socketId).emit(event, data)
    }
  }
}
