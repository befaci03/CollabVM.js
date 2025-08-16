import * as WebSocket from 'websocket';
import * as guac from './utils/GuacUtil';
import { OutgoingHttpHeaders } from 'http';
import { Logger } from './Logger';

export class Client {
    private log: Logger;
    
    private _ws: WebSocket.client;
    private _client?: WebSocket.connection;
    private node: string|null;

    private _wsurl: string;
    private _headrs: OutgoingHttpHeaders|undefined;
    private _orgn: string|undefined;

    public username: string;
    public connected: boolean = false;

    private KEEPALIVE: any;

    constructor(websocket: string, node?: string, username?: string, origin?: string, headers?: OutgoingHttpHeaders) {
        this._ws = new WebSocket.client();
        this.log = new Logger();
        this.username = username || "";
        this.node = node || null;

        this._wsurl = websocket;
        this._headrs = headers;
        this._orgn = origin;
        // TODO: wait until the bot is connected 
        //@ts-ignore
        this._ws.connect(this._wsurl, 'guacamole', this._orgn, this._headrs || undefined);

        this._ws.on('connect', connection => {
            this._client = connection;
            this.log.Log("Successfully connected to the WebSocket");
        });
        this.KEEPALIVE = setInterval(() => this.sendPacket(['nop']), 5000);
    }

    public async connect(node?: string) {
        if (!node && !this.node) return this.log.Critical('Cannot connect: No node specified');
        if (this.username) await this.sendPacket(["rename", this.username]);
        //@ts-ignore
        await this.sendPacket(["connect", node || this.node]);
    }
    public on(cb: (data: WebSocket.Message) => void) {
        this._client?.on('message', cb);
    }

    public async login(password: string, auth?: boolean) { // password or token (token if auth is true)
        if (auth) return this.sendPacket(['login', password]);
        else return this.sendPacket(['admin', '2', password]);
    }

    public async sendMessage(message: string) {
        return this.sendPacket(['chat', message]);
    }
    public async sendXssMessage(message: string) {
        return this.sendPacket(['admin', '21', message]);
    }

    public async vote(yes: boolean, force?: boolean) {
        if (force) return this.sendPacket(['admin', '13', yes ? "1" : "0"]);
        else return this.sendPacket(['vote', yes ? "1" : "0"]);
    }
    public async turn(take: boolean) {
        return this.sendPacket(['turn', take ? "1" : "0"]); 
    }

    // TODO: MAKE THIS SHIT WORK
    /*public async moveMouse(x: number, y: number) {
        return this.sendPacket(['mouse', x.toString(), y.toString(), '0']);
    }
    public async clickMouse(x: number, y: number, type: "left"|"middle"|"right") {
        let _t: string;
        switch (type) {
            case "left":   _t = "1";  break;
            case "middle": _t = "2";  break;
            case "right":  _t = "4";  break;
            // TODO: scroll
        }
        return this.sendPacket(['mouse', x.toString(), y.toString(), '0']);
    }*/
    // TODO: keyboard key

    public async reboot() {
        return this.sendPacket(['admin', '10']);
    }
    public async restore() {
        return this.sendPacket(['admin', '8']);
    }

    public async banUser(username: string) {
        return this.sendPacket(['admin', '12', username]);
    }
    public async muteUser(username: string) {
        return this.sendPacket(['admin', '14', username]);
    }
    public async renameUser(username: string, newUsername: string) {
        return this.sendPacket(['admin', '18', username, newUsername]);
    }
    public async kick(username: string) {
        return this.sendPacket(['admin', '15', username]);
    }
    
    public async getIP(username: string) {
        // TODO: idk how to do it but fuck
    }

    public async rename(newUsername: string) {
        return this.sendPacket(['rename', newUsername]);
    }
    

    public async qemuCommand(cmd: string) {
        // TODO: return the output
        return this.sendPacket(['admin', '5', cmd]);
    }

    private async sendPacket(data: string[]) {
        const packet = guac.encode(data);
        return await this._client?.sendUTF(packet);
    }

    public disconnect() {
        if (!this._client?.connected) return false;
        this._client?.close();
        return true;
    }
    // TODO: make this working
    public async reconnect() {
        if (this._client?.connected) return;
        this._ws.connect(this._wsurl, 'guacamole', undefined, this._headrs);
    }

    public _changeClassValue(key: "websocket", value: string): void;
    public _changeClassValue(key: "username", value: string): void;
    public _changeClassValue(key: "node", value: string): void;
    public _changeClassValue(key: "headers", value: OutgoingHttpHeaders): void;
    public _changeClassValue(key: any, value: any) {
        switch (key) {
            case "websocket":
                this._wsurl = value;
                break;
            case "node":
                this.node = value;
                break;
            case "headers":
                this._headrs = value;
                break;
            case "username":
                this.username = value;
                break;
        }
    }
}
export const Guacamole = {
    encode: (data: string[]) => { return guac.encode(data) },
    decode: (data: string) => { return guac.decode(data) },
};
