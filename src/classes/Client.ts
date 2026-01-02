// TODO: clean this shi' up
import * as WebSocket from 'websocket';
import * as guac from '../utils/GuacUtil.js';
import { OutgoingHttpHeaders } from 'http';
import Logger from '../Logger.js';
import htmlToPlainText from '../utils/HTMLUtils.js';
import { User } from '../interfaces/User.js';
import { Rank, LoginRankRes } from '../enums/Rank.js';
import { OPCodeClient, OPCodeServer } from '../enums/AdminOpcodes.js';

export class Client {
    private log: Logger;
    private events: Map<string, (...args: any[]) => void> = new Map();
    
    private _ws: WebSocket.client;
    private _client?: WebSocket.connection;
    private node: string;

    private _wsurl: string;
    private _headrs: OutgoingHttpHeaders|undefined;
    private _orgn: string|undefined;

    public username: string;
    public connected: boolean = false;

    public connectedUsers: User[] = [];

    constructor(websocket: string, node: string, username?: string, origin?: string, headers?: OutgoingHttpHeaders) {
        this._ws = new WebSocket.client();
        this.log = new Logger();
        this.username = username || "";
        this.node = node;

        this._wsurl = websocket;
        this._headrs = headers ?? {};
        this._orgn = origin;
    }

    public async connect() {
        this._ws.on('connect', connection => {
            this._client = connection;
            connection.on("message", d => {
                if (d.type !== "utf8") return;
                if (d.utf8Data === "3.nop;") return connection.sendUTF('3.nop;'); // we dont really need to encode dat since we know

                const msg = guac.decode(d.utf8Data);
                this.events.get("CUSTOM")?.(msg);

                switch (msg[0]) {
                    case "chat":
                        this.events.get("chat")?.(htmlToPlainText(msg[2]), msg[1]);
                        break;
                    case "adduser":
                        const count = Number(msg[1]);
                        const users = [];

                        for (let i = 0; i < count; i++) {
                            const username = msg[2 + i*2];
                            const rank: Rank = Number(msg[3 + i*2]);
                            users.push([username, rank]);
                        }
                        //@ts-ignore
                        this.connectedUsers.push(...users);

                        this.events.get("join")?.(users);
                        break;
                    case "remuser":
                        if(parseFloat(msg[1]) > 1) break;//idk
                        const unam = msg[2];

                        this.connectedUsers = this.connectedUsers.filter((u) => u.username !== unam);
                        this.events.get("left")?.(unam);
                        break;
                    case "size":
                        this.events.get("screenRes")?.([msg[2], msg[3]]);
                        break;
                    case "png":
                        this.events.get("screenUpd")?.(msg[5], [msg[1], msg[2]], [msg[3], msg[4]]);
                        break;
                            
                    default:break;
                }
            });
            connection.on("close", () => {
                this.connected = false;
                this.events.get("close")?.();
            });

            connection.sendUTF(guac.encode("rename", this.username));
            connection.sendUTF(guac.encode("connect", this.node));

            this.connected = true;
            this.events.get('connect')?.();
        });
        this._ws.on('connectFailed', err => {
            //@ts-ignore
            this.events.get("error")?.(err);
        });

        //@ts-ignore
        if (!this._headrs['user-agent']) this._headrs['user-agent'] = "Mozilla/5.0 (X11; Linux x86_64; rv:141.0) Gecko/20100101 Firefox/141.0";
        this._ws.connect(this._wsurl, ['guacamole'], this._orgn || "computernewb.com", this._headrs);
    }

    // TODO: WTF DID I DO CLEAN THAT TOO
    public on(event: "chat", cb: (message: string, username: string) => void): void;
    //TODO:public on(event: "queueUpdate", cb: (queue: TurnData[]) => void): void;
    public on(event: "join", cb: (username: string, rankId: number) => void): void;
    public on(event: "left", cb: (username: string) => void): void;
    public on(event: "error", cb: (err: Error) => void): void;
    public on(event: "close", cb: (reason?: string) => void): void;
    public on(event: "connect", cb: () => void): void;
    public on(event: "CUSTOM", cb: (data: WebSocket.IUtf8Message) => void): void;
    public on(event: "screenRes", cb: (newSize: number[]) => void): void;
    public on(event: "screenUpd", cb: (img: string, pos1: number[], pos2: number[]) => void): void;
    public on(event: "screenRes"|"screenUpd"|"CUSTOM"|"connect"|"chat"/*|"queueUpdate"*/|"join"|"left"|"close"|"error", cb: any) { this.events.set(event, cb) }

    public async login(password: string, auth?: boolean): Promise<void> { // password or token (token if auth is true)
        // TODO: wait until logged in
        if (auth) this.sendPacket('login', password);
        else this.sendPacket('admin', String(OPCodeClient.Login), password);
    }

    public sendMessage(message: string): void {
        this.sendPacket('chat', message);
    }
    public sendXssMessage(message: string): void {
        this.sendPacket('admin', String(OPCodeClient.XSS), message);
    }
    public sendSystemMessage(message: string): void {
        this.sendPacket('admin', String(OPCodeClient.SysMsg), message);
    }

    public vote(yes: boolean, force?: boolean): void {
        if (force) this.sendPacket('admin', String(OPCodeClient.ForceVote), yes ? "1" : "0");
        else this.sendPacket('vote', yes ? "1" : "0");
    }
    public turn(take: boolean) {
        this.sendPacket('turn', take ? "1" : "0"); 
    }
    /**
     * Wait until the bot have his turn
     */
    public async waitTurn(): Promise<void> {
        return new Promise((yes) => {
            const listener = (d: WebSocket.Message) => {
                if (d.type !== "utf8") return;
                const data: string = d.utf8Data;
                const decoded = guac.decode(data);
                if (decoded[0] === 'turn' && decoded[3] === this.username) {
                    yes();
                    this._client?.off('message', listener);
                }
            }
            this._client?.on('message', listener);
        });
    }

    public moveMouse(x: number, y: number) {
        this.sendPacket('mouse', x.toString(), y.toString(), '0');
    }
    public clickMouse(x: number, y: number, type: "left"|"middle"|"right"|"scrollup"|"scrolldown"|"scrollleft"|"scrollright"|"back") {
        let _t: string;
        switch (type) {
            case "left":         _t = "1";  break;
            case "middle":       _t = "2";  break;
            case "right":        _t = "3";  break;
            case "scrollup":     _t = "4";  break;
            case "scrolldown":   _t = "5";  break;
            case "scrollleft":   _t = "6";  break;
            case "scrollright":  _t = "7";  break;
            case "back":         _t = "8";  break;
        }
        this.sendPacket('mouse', x.toString(), y.toString(), _t);
    }
    
    public instructKey(keyCode: number, state: "pressed"|"released") {
        const stateId = state === "pressed" ?'1':'0';
        this.sendPacket('key', keyCode.toString(10), stateId);
    }

    public reboot() {
        this.sendPacket('admin', String(OPCodeClient.Reboot));
    }
    public restore() {
        this.sendPacket('admin', String(OPCodeClient.Restore));
    }

    public banUser(username: string) {
        this.sendPacket('admin', String(OPCodeClient.Ban), username);
    }
    public muteUser(username: string) {
        this.sendPacket('admin', String(OPCodeClient.Mute), username);
    }
    public renameUser(username: string, newUsername: string) {
        this.sendPacket('admin', String(OPCodeClient.RenameUser), username, newUsername);
    }
    public kick(username: string) {
        this.sendPacket('admin', String(OPCodeClient.Kick), username);
    }
    
    public async getIP(username: string): Promise<string|null> {
        return new Promise((resolve, reject) => {
            this.sendPacket('admin', String(OPCodeClient.GrabIP), username);

            const listener = (d: WebSocket.Message) => {
                if (d.type !== "utf8") return;
                const data: string = d.utf8Data;
                const decoded = guac.decode(data);
                if (decoded[0] === 'admin' && decoded[1] === String(OPCodeServer.GrabIP)) {
                    resolve(decoded[2]);
                    this._client?.off('message', listener);
                }
            }
            this._client?.on('message', listener);

            setTimeout(() => {
                this._client?.off('message', listener);
                resolve(null);
            }, 5000);
        });
    }
    // befaci: for god sakes never run "nmi"
    public async qemuCommand(cmd: string): Promise<string|null> {
        // TODO: return the output
        return new Promise((resolve, reject) => {
            this.sendPacket('admin', String(OPCodeClient.QEMU), cmd);

            const listener = (d: WebSocket.Message) => {
                if (d.type !== "utf8") return;
                const data: string = d.utf8Data;
                const decoded = guac.decode(data);
                if (decoded[0] === 'admin' && decoded[1] === String(OPCodeServer.QEMU)) {
                    resolve(decoded[2]);
                    this._client?.off('message', listener);
                }
            }
            this._client?.on('message', listener);

            setTimeout(() => {
                this._client?.off('message', listener);
                resolve(null);
            }, 5000);
        });
    }

    public rename(newUsername: string): string {
        this.sendPacket('rename', newUsername);
        this.username = newUsername;
        return this.username;
    }


    private sendPacket(...data: string[]): void {
        const packet = guac.encode(...data);
        this._client?.sendUTF(packet);
    }

    public disconnect(): boolean {
        if (!this._client?.connected) return false;
        this._client?.close();
        return true;
    }
    public async reconnect(): Promise<void> {
        if (this._client?.connected) return;
        this._client?.close();
        setTimeout(this.connect, 400);
    }

    public _changeClassValue(key: "websocket", value: string): void;
    public _changeClassValue(key: "username", value: string): void;
    public _changeClassValue(key: "node", value: string): void;
    public _changeClassValue(key: "headers", value: OutgoingHttpHeaders): void;
    public _changeClassValue(key: "websocket"|"username"|"node"|"headers", value: any) {
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
