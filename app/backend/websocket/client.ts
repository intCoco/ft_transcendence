export class Client 
{
    // id: number;
    // nickname: string;
    // blocked: Set<number>;

    constructor(
        private id: number,
        private nickname: string,
        private ws: WebSocket
    ){
        // this.id = id;
        // this.nickname = nickname;
        // this.blocked = new Set();
    }

    getId(): number {
        return this.id;
    }

    getNickname(): string {
        return this.nickname;
    }

    send(event: any) {
        this.ws.send(JSON.stringify(event));
    }

    // getBlocked(): Set<number> {
    //     return this.blocked;
    // }

    // block(id: number) {
    //     this.blocked.add(id);
    // }

    // unblock(id: number) {
    //     this.blocked.delete(id);
    // }
}