import { Client } from "./client";


export class Room {
    id: number;
    clients: Set<number>;

    constructor(roomId: number, id1: number, id2 : number)
    {
        this.id = roomId;
        this.clients = new Set();
        this.clients.add(id1);
        this.clients.add(id2);
    }

    sendMessage(message: string) {
        // parse max size
        console.log(message);
    }

    blockClient(client: Client) {
        // on verra.
    }

    broadcast(message: string) {
        console.log(message);
    }

    isClientIn(id: number) {
        return this.clients.has(id);
    }

    getId(): number {
        return this.id;
    }
}