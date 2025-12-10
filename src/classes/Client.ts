import * as WebSocket from 'websocket';
import * as guac from '../utils/GuacUtil.js';
import { OutgoingHttpHeaders } from 'http';
import Logger from '../Logger.js';
import htmlToPlainText from '../utils/HTMLUtils.js';

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
            connection.sendUTF('3.nop;');

            connection.on("message", d => {
                switch (d.type) {
                    case "utf8":
                        if (d.utf8Data === "3.nop;") return connection.sendUTF('3.nop;');
                        const msg = guac.decode(d.utf8Data);
                        this.events.get("CUSTOM")?.(msg);
                        switch (msg[0]) {
                            case "chat":
                                this.events.get("chat")?.(htmlToPlainText(msg[2]), msg[1]);
                                break;
                            case "adduser":
                                const usrcount = parseFloat(msg[1]);
                                let isMultiple: boolean|any[] = false
                                if (usrcount > 1) {
                                    isMultiple = [];
                                    let usr:any[] = [];
                                    msg.slice(2).forEach((val, i) => {
                                        const type = i % 2;
                                        usr.push(val);
                                        if (type === 2) { isMultiple = usr ; usr = [] }
                                    });
                                }
                                const users = isMultiple ? isMultiple : [msg[2], msg[3]]
                                this.events.get("join")?.(users);
                                break;
                            case "remuser":
                                if(parseFloat(msg[1]) > 1) break;
                                this.events.get("left")?.(msg[2]);
                                break;
                            case "size":
                                this.events.get("screenRes")?.([msg[2], msg[3]]);
                                break;
                            case "png":
                                this.events.get("screenUpd")?.(msg[5], [msg[1], msg[2]], [msg[3], msg[4]]);
                                break;
                            
                            default:break;
                        }
                        break;
                    default://so binary
                        break;
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
    public on(event: "chat", cb: (message: string, username: string) => void): void;
    //public on(event: "queueUpdate", cb: (queue: TurnData[]) => void): void;
    public on(event: "join", cb: (username: string, rankId: number) => void): void;
    public on(event: "left", cb: (username: string) => void): void;
    public on(event: "error", cb: (err: Error) => void): void;
    public on(event: "close", cb: (reason?: string) => void): void;
    public on(event: "connect", cb: () => void): void;
    public on(event: "CUSTOM", cb: (data: WebSocket.IUtf8Message) => void): void;
    public on(event: "screenRes", cb: (newSize: number[]) => void): void;
    public on(event: "screenUpd", cb: (img: string, pos1: number[], pos2: number[]) => void): void;
    public on(event: "screenRes"|"screenUpd"|"CUSTOM"|"connect"|"chat"/*|"queueUpdate"*/|"join"|"left"|"close"|"error", cb: any) { this.events.set(event, cb) }

    public async login(password: string, auth?: boolean) { // password or token (token if auth is true)
        if (auth) return this.sendPacket('login', password);
        else return this.sendPacket('admin', '2', password);
    }

    public async sendMessage(message: string) {
        return this.sendPacket('chat', message);
    }
    public async sendXssMessage(message: string) {
        return this.sendPacket('admin', '21', message);
    }

    public async vote(yes: boolean, force?: boolean) {
        if (force) return this.sendPacket('admin', '13', yes ? "1" : "0");
        else return this.sendPacket('vote', yes ? "1" : "0");
    }
    public async turn(take: boolean) {
        return this.sendPacket('turn', take ? "1" : "0"); 
    }

    public async moveMouse(x: number, y: number) {
        return this.sendPacket('mouse', x.toString(), y.toString(), '0');
    }
    public async clickMouse(x: number, y: number, type: "left"|"middle"|"right"|"scrollup"|"scrolldown"|"scrollleft"|"scrollright"|"back") {
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
        return this.sendPacket('mouse', x.toString(), y.toString(), _t);
    }
    
    public async pressKey(keyCode: number) {

    }

    public async reboot() {
        return this.sendPacket('admin', '10');
    }
    public async restore() {
        return this.sendPacket('admin', '8');
    }

    public async banUser(username: string) {
        return this.sendPacket('admin', '12', username);
    }
    public async muteUser(username: string) {
        return this.sendPacket('admin', '14', username);
    }
    public async renameUser(username: string, newUsername: string) {
        return this.sendPacket('admin', '18', username, newUsername);
    }
    public async kick(username: string) {
        return this.sendPacket('admin', '15', username);
    }
    
    public async getIP(username: string) {
        // TODO: idk how to do it but fuck
    }

    public async rename(newUsername: string) {
        return this.sendPacket('rename', newUsername);
    }

    public async qemuCommand(cmd: string) {
        // TODO: return the output
        return this.sendPacket('admin', '5', cmd);
    }

    private async sendPacket(...data: string[]) {
        const packet = guac.encode(...data);
        return await this._client?.sendUTF(packet);
    }

    public disconnect() {
        if (!this._client?.connected) return false;
        this._client?.close();
        return true;
    }
    public async reconnect() {
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
