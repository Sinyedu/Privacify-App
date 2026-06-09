import { socket } from "./socket";

export type SocketAck<T> =
  | ({ ok: true } & T)
  | {
      ok: false;
      message?: string;
    };

export function emitWithAck<T>(
  event: string,
  payload: unknown,
): Promise<SocketAck<T>> {
  return new Promise((resolve, reject) => {
    socket.timeout(7000).emit(
      event,
      payload,
      (error: Error | null, response?: SocketAck<T>) => {
        if (error) {
          reject(error);
          return;
        }

        if (!response) {
          reject(new Error("Server did not return a response."));
          return;
        }

        resolve(response);
      },
    );
  });
}
