export class Client 
{
    id: number;
    nickname: string;
    blocked: Set<number>;

    constructor(id: number, nickname: string) {
        this.id = id;
        this.nickname = nickname;
        this.blocked = new Set();
    }

    getNickname(): string {
        return this.nickname;
    }

    getId(): number {
        return this.id;
    }

    getBlocked(): Set<number> {
        return this.blocked;
    }

    block(id: number) {
        this.blocked.add(id);
    }

    unblock(id: number) {
        this.blocked.delete(id);
    }
}