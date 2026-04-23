import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";

@WebSocketGateway({
  cors: {
    origin: "http://localhost:3000",
  },
})
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log("Client connected:", client.id);
  }

  handleDisconnect(client: Socket) {
    console.log("Client disconnected:", client.id);
  }

  @SubscribeMessage("send_message")
  handleMessage(
    @MessageBody() payload: any,
    @ConnectedSocket() client: Socket
  ) {
    console.log("Message received:", payload);

    // broadcast to all clients
    this.server.emit("receive_message", payload);
  }
}
