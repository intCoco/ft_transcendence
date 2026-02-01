import { Client } from "./client";
import { Room } from "./room";


type ChatEvent = 
    // | { type: "user_connected"; id: number, nickname: string; }
    // | { type: "user_disconnected"; id: number, nickname: string }
    | { type: "message"; fromId: number; fromNick: string; toId: number; content: string };

export class Chat 
{
  clients: Map<number, Client>;

  constructor() {
    this.clients = new Map();
  }

  addClient(userId: number, nickname: string, ws: WebSocket) {
    const client = new Client(userId, nickname, ws);
    this.clients.set(userId, client);
  }

  removeClient(userId: number) {
    this.clients.delete(userId);
  }

  sendMessage(fromId: number, toId: number, content: string) {
    if (!content.trim()) return;

    const sender = this.clients.get(fromId);
    const receiver = this.clients.get(toId);
    if (!sender || !receiver) return;

    const event: ChatEvent = {
      type: "message",
      fromId,
      fromNick: sender.getNickname(),
      toId,
      content,
    };

    sender.send(event);   // echo
    receiver.send(event); // temps réel
  }

    // nextClientId: number;

    // clients: Map<number, Client>;  // list of users connected to transcendence
    // rooms: Map<number, Room>;      // list of dm opened

    // constructor() {
    //     this.nextClientId = 0;

    //     this.clients = new Map();
    //     this.rooms = new Map();
    // }

    // addClient(nickname: string) {
    //     const id = this.nextClientId++;
    //     const client = new Client(id, nickname);
    //     this.clients.set(id, client);

    //     // for websocket
    //     return id;
    // }

    // addRoom() {
    //     // todo
    // }

    // removeClient(id: number) {
    //     this.broadcastClientOut(id);
    //     this.clients.delete(id);
    // }

    // broadcastClientIn(id: number) {
    //     const nick = this.getClientNick(id);
    //     if (!nick)
    //         return;
    
    //     console.log(`${nick} is connected.\n`);
    // }

    // broadcastClientOut(id: number) {
    //     const nick = this.getClientNick(id);
    //     if (!nick)
    //         return;

    //     console.log(`${nick} is disconnected.\n`);
    // }

    // broadcastSystem(message: string) {
    //     for (const room of this.rooms.values())
    //         room.broadcast(message);
    // }

    // // used for show which is connected on transcendence
    // displayClientsNicks() {
    //     for (const client of this.clients.values())
    //         console.log(client.getNickname());
    // }

    // isClientConnected(id: number): boolean {
    //     return this.clients.has(id);
    // }

    // getClientNick(id: number): string | undefined {
    //     const client = this.clients.get(id);

    //     // if client exist, then return this nick, otherwise return 'undefined'
    //     return client?.getNickname();
    // }

    // // EVENTS FOR WEBSOCKET
    // // private is like c++, cannot be used outside of this class
    // private makeUserEvent(type: "user_connected" | "user_disconnected", id: number): ChatEvent | undefined {
    //     const nickname = this.getClientNick(id);
    //     if (!nickname)
    //         return undefined;
        
    //     // Shorthand object syntax:
    //     // equivalent to { type: type, nickname: nickname }
    //     // works because variable names match ChatEvent fields
    //     return {type, id, nickname}; 
    // }

    // getClientInEvent(id: number): ChatEvent | undefined {
    //     return this.makeUserEvent("user_connected", id);
    // }

    // getClientOutEvent(id: number): ChatEvent | undefined {
    //     return this.makeUserEvent("user_disconnected", id);
    // }

    // sendMessage(fromId: number, toId: number, message: string): ChatEvent | undefined {
    //     if (message.trim() === "" || fromId === toId)
    //         return undefined;
        
    //     const sender = this.clients.get(fromId);
    //     const recipient = this.clients.get(toId);
        
    //     if (!sender || !recipient)
    //         return undefined;

    //     // block is mutual: no messages if either user blocked the other
    //     if (recipient.getBlocked().has(fromId) || sender.getBlocked().has(toId))
    //         return undefined;

    //     return {
    //         type: "message",
    //         fromId: fromId,
    //         fromNick: sender.getNickname(),
    //         toId: toId,
    //         toNick: recipient.getNickname(),
    //         content: message
    //     }

    //     //{ type: "message"; fromId: number; fromNick: string, toId: number, toNick: string, content: string };
    // }
}