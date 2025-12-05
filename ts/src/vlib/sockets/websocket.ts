/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */

// FIX // audit 
// FIX // convert to jsdoc.

import * as http from 'http';
import * as https from 'https';
import * as bson from 'bson';
import * as url from 'url';
// import * as WebSocket from 'ws';
import WebSocketLib, { WebSocketServer } from 'ws';
globalThis.WebSocket = WebSocketLib;


/**
 * The websocket utility
 * @experimental
 * @docs
 */
export namespace WebSocket {

    // ------------------------------------------------------
    // Types

    /**
     * A formatted websocket message.
     */
    export interface Message {
        command?: string;
        id?: string;
        data?: any;
        timestamp?: number;
    }

    // ------------------------------------------------------
    // Server.

    export interface RateLimitConfig {
        limit: number;
        interval: number;
    }

    type Stream = WebSocketLib & {
        id: string;
        connected: boolean;
        messages: Map<string, Message>;
    }

    /**
     * Nested types for the {@link Server} class.
     */
    export namespace Server {

        /** Constructor options for the {@link Server} class. */
        export interface Opts {
            ip?: string | null;
            port?: number;
            https?: https.ServerOptions | null;
            rate_limit?: RateLimitConfig | false;
            api_keys?: string[];
            server?: http.Server | https.Server | null;
        }

        /**
         * The server event callback.
         * @docs
         */
        export type Event = "listen" | "open" | "close" | "error"

        /**
         * The server event callback.
         * - listen: (address) => {}
         * - open: (stream) => {}
         * - close: (stream, code, reason) => {}
         * - error: (stream, error) => {}
         * @docs
         */
        export type EventCallback<E extends Event> = 
            E extends "listen" ? (address: string) => void :
            E extends "open" ? (stream: Stream) => void :
            E extends "close" ? (stream: Stream, code: number, reason: string) => void :
            E extends "error" ? (stream: Stream, error: Error) => void :
            never;
    }

    /**
     * Websocket server object.
     * @experimental
     * @param ip The optional server listen ip.
     * @param port The server listen post.
     * @param https The https settings for `https.createServer`. When left undefined a http server will be used.
     * @param rate_limit Rate limit settings for the http upgrade request. Rate limiting can be disabled by defining `rate_limit` as `false`.
     * @param rate_limit.limit The limit on the amount of requests in the specified interval.
     * @param rate_limit.interval The rate limit reset interval in seconds.
     * @param api_keys An array of allowed client api keys. When no api keys are defined, no authentication will be required.
     * @param server Optionally pass the server initialized server object directly. Either an http or https server object.
     * @docs
     */
    export class Server {
        private port: number;
        private ip?: string | null;
        private https_config: https.ServerOptions | null;
        private server: http.Server | https.Server | null;
        private api_keys: string[];
        private rate_limit: RateLimitConfig | false;
        private wss!: WebSocketServer;
        private streams: Map<string, Stream>;
        private commands: Map<string, (stream: Stream, id: string, data: any) => void>;
        private events: Map<string, Function>;
        private rate_limit_cache: Map<string, {
            count: number;
            expiration: number;
        }>;
        private _clear_caches_interval?: NodeJS.Timeout;

        /**
         * Construct a new server instance.
         * @docs
         */
        constructor({
            ip = null,
            port = 8000,
            https = null,
            rate_limit = {
                limit: 5,
                interval: 60,
            },
            api_keys = [],
            server = null,
        }: Server.Opts) {
            this.port = port;
            this.ip = ip;
            this.https_config = https;
            this.server = server;
            this.api_keys = api_keys;
            this.rate_limit = rate_limit;

            this.streams = new Map();
            this.commands = new Map();
            this.events = new Map();
            this.rate_limit_cache = new Map();
        }

        /**
         * Start the server.
         * @docs
         */
        start(): void {
            if (this.server === null) {
                if (this.https_config != null) {
                    this.server = https.createServer(this.https_config, (req, res) => {
                        res.writeHead(426, { 'Content-Type': 'text/plain' });
                        res.end('This service requires WebSocket protocol.');
                    });
                    (this.server as any).__is_https = true;
                } else {
                    this.server = http.createServer((req, res) => {
                        res.writeHead(426, { 'Content-Type': 'text/plain' });
                        res.end('This service requires WebSocket protocol.');
                    });
                }
            }

            // Initialize websocket
            this.wss = new WebSocketServer({ noServer: true });

            // Handle upgrades
            this.server.on('upgrade', (request, socket, head) => {
                if (this.rate_limit !== false) {
                    const ip = request.socket.remoteAddress!;
                    const now = Date.now();
                    
                    if (this.rate_limit_cache.has(ip)) {
                        let data = this.rate_limit_cache.get(ip)!;
                        if (now >= data.expiration) {
                            data = {
                                count: 0,
                                expiration: now + (this.rate_limit as RateLimitConfig).interval * 1000,
                            };
                        }
                        ++data.count;
                        if (data.count > (this.rate_limit as RateLimitConfig).limit) {
                            socket.write(`HTTP/1.1 429 Too Many Requests\r\n\r\nRate limit exceeded, please try again in ${Math.floor((data.expiration - now) / 1000)} seconds.`);
                            socket.destroy();
                            return;
                        }
                        this.rate_limit_cache.set(ip, data);
                    } else {
                        this.rate_limit_cache.set(ip, {
                            count: 1,
                            expiration: now + (this.rate_limit as RateLimitConfig).interval * 1000,
                        });
                    }
                }

                const { query } = url.parse(request.url!, true);
                if (this.api_keys.length > 0 && !this.api_keys.includes(query.api_key as string)) {
                    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
                    socket.destroy();
                    return;
                }

                this.wss.handleUpgrade(request, socket, head, (stream) => {
                    this.wss.emit('connection', stream, request);
                });
            });

            // Handle connections
            this.wss.on('connection', (stream: Stream) => {
                stream.id = Math.random().toString(36).substring(2, 16);
                this.streams.set(stream.id, stream);
                stream.messages = new Map();

                stream.on('message', (message: WebSocketLib.Data) => {
                    try {
                        let parsed = bson.deserialize(message as Buffer);
                        if (typeof parsed === 'object') {
                            if (!parsed.timestamp) {
                                parsed.timestamp = Date.now();
                            }
                            
                            if (parsed.command && this.commands.has(parsed.command)) {
                                this.commands.get(parsed.command)!(stream, parsed.id, parsed.data);
                            } else if (parsed.id) {
                                stream.messages.set(parsed.id, parsed);
                            }
                        }
                    } catch (error) {
                        if (message.toString() === 'ping') {
                            stream.send('pong');
                            return;
                        }
                    }
                });

                if (this.events.has('open')) {
                    this.events.get('open')!(stream);
                }

                stream.on('close', (code: number, reason: string) => {
                    stream.connected = false;
                    if (this.events.has('close')) {
                        this.events.get('close')!(stream, code, reason);
                    }
                });

                const err_callback = this.events.get('error');
                if (err_callback) {
                    stream.on('error', (error: Error) => err_callback(stream, error));
                }
            });

            // Start listening
            const listen_callback = () => {
                if (this.events.has('listen')) {
                    this.events.get('listen')!(`${(this.server as any).__is_https ? 'https' : 'http'}://${this.ip || 'localhost'}:${this.port}`);
                }
            };

            if (this.ip) {
                this.server.listen(this.port, this.ip, listen_callback);
            } else {
                this.server.listen(this.port, listen_callback);
            }

            // Clear caches interval
            this._clear_caches_interval = setInterval(
                () => this._clear_caches(),
                60 * 5 * 1000,
            );
        }

        /**
         * Stop the server.
         * @docs
         */
        public async stop(): Promise<void> {
            return new Promise((resolve) => {
                clearInterval(this._clear_caches_interval);

                let closed = 0;
                this.wss.clients.forEach(client => {
                    client.close();
                });

                this.wss.close(() => {
                    ++closed;
                    if (closed === 2) { resolve(); }
                });

                this.server!.close(() => {
                    ++closed;
                    if (closed === 2) { resolve(); }
                });
            });
        }

        /**
         * Set an event callback.
         * @docs
         */
        public on_event<E extends Server.Event>(event: E, callback: Server.EventCallback<E>): void {
            this.events.set(event, callback);
        }

        /**
         * Set a command callback.
         * Will be called when an incoming message has the specified command type.
         * The function can take the following arguments: `(stream, id, data) => {}`.
         * 
         * @docs
         */
        public on(command: string, callback: (stream: Stream, id: string, data: any) => void): void {
            this.commands.set(command, callback);
        }
        
        /**
         * Wait for a message to be filled out.
         * @note This only works when there is a single response message, any more response messages will be lost.
         * 
         * @docs
         */
        public async await_response({
            stream,
            id,
            timeout = 60000,
            step = 10
        }: {
            stream: Stream;
            id: string;
            timeout?: number;
            step?: number;
        }): Promise<Message> {
            let elapsed = 0;
            return new Promise((resolve, reject) => {
                const wait = () => {
                    if (stream.messages.has(id)) {
                        const data = stream.messages.get(id)!;
                        stream.messages.delete(id);
                        resolve(data);
                    } else {
                        elapsed += step;
                        if (elapsed > timeout) {
                            reject(new Error('Operation timed out.'));
                        } else {
                            setTimeout(wait, step);
                        }
                    }
                };
                wait();
            });
        }

        /**
         * Send a command and expect a single response.
         * @docs
         */
        public async request({
            stream,
            command,
            data,
            timeout = 60000
        }: {
            /** The stream. */
            stream: Stream;
            /** The command identifier. */
            command: string;
            /** The data to send. */
            data: any;
            /** The timeout in milliseconds. */
            timeout?: number;
        }): Promise<Message> {
            const id = await this.send_helper({ stream, command, data });
            return await this.await_response({ stream, id, timeout });
        }

        /**
         * Send a response to a received command.
         * @docs
         */
        public async respond({
            stream,
            id,
            data,
        }: {
            /** The stream. */
            stream: Stream;
            /** The request id from the received command. */
            id: string;
            /** The data to sent. */
            data: any;
        }): Promise<void> {
            await this.send_helper({ stream, id, data });
        }

        /** Clear all caches. */
        private _clear_caches(): void {
            const now = Date.now();
            this.streams.forEach((client, id) => {
                if (client.connected) {
                    client.messages.forEach((msg, msg_id) => {
                        if (msg.timestamp && now >= msg.timestamp + (3600 * 1000)) {
                            client.messages.delete(msg_id);
                        }
                    });
                } else {
                    this.streams.delete(id);
                }
            });
        }

        /**
         * Send data through the websocket.
         * Either a request command when `command` is defined,
         * or a response when `command` is undefined and `id` is defined.
         * Note that `id` should always be defined in a sent response,
         * but it can be auto generated when sending a request command.
         */
        private async send_helper({
            stream,
            command,
            id = Math.random().toString(36).substring(2, 32),
            data
        }: {
            stream: Stream;
            command?: string;
            id?: string;
            data: any;
        }): Promise<string> {
            stream.send(bson.serialize({
                command,
                id,
                data,
            }));
            return id;
        }
    }


    // ------------------------------------------------------
    // Client.

    export interface ReconnectConfig {
        interval: number;
        max_interval: number;
        attempts?: number;
    }

    /**
     * Nested types for the {@link Client} class.
     */
    export namespace Client {

        /** Constructor options for the {@link Client} class. */
        export interface Opts {
            url?: string;
            api_key?: string | null;
            reconnect?: ReconnectConfig | boolean;
            ping?: boolean | number;
        }

        /**
         * The server event callback.
         * @docs
         */
        export type Event = "open" | "error" | "reconnect" | "close"

        /**
         * The server event callback.
         * - open: (stream) => {}
         * - error: (stream, error) => {}
         * - reconnect: (stream, code, reason) => {}
         * - close: (stream, code, reason) => {}
         * @docs
         */
        export type EventCallback<E extends Event> =
            E extends "open" ? (stream: Stream) => void :
            E extends "error" ? (stream: Stream, error: Error) => void :
            E extends "reconnect" ? (stream: Stream, code: number, reason: string) => void :
            E extends "close" ? (stream: Stream, code: number, reason: string) => void :
            never;
    }

    /**
     * The websocket client object.
     * @experimental
     * @param address The address of the server you want to connect to.
     * @param api_key The api_key needed by the connection to start the handshake.
     * @param reconnect Enable automatic reconnection. Define `false` to disable automatic reconnection, use `true` to enable automatic reconnection with the default options. Or define custom options.
     * @param reconnect.interval Interval for reconnect attempt
     * @param reconnect.max_interval maximum interval for a reconnect attempt. The interval gradually backs off on consequent connection failures.
     * @param ping Enable automatic pings to keep the connection alive. Can be either a boolean, or a milliseconds number as the auto ping interval. Default interval is `30000`.
     * @docs
    */
    export class Client {
        private url: string;
        private api_key: string | null;
        private reconnect: ReconnectConfig | false;
        private auto_ping: number | false;
        private commands: Map<string, (id: string, data: any) => void>;
        private events: Map<string, Function>;
        private messages: Map<string, Message>;
        private stream?: WebSocketLib;
        private connected: boolean = false;
        private try_reconnect: boolean = true;
        private auto_ping_timeout?: NodeJS.Timeout;

        /**
         * Construct a new client instance.
         * @docs
         */
        constructor(
            {
                url = "wss://localhost:8080",
                api_key = null,
                reconnect = {
                    interval: 10,
                    max_interval: 30000,
                },
                ping = true,
            }: Client.Opts
        ) {
            this.url = url;
            this.api_key = api_key;

            // Set reconnect
            if (reconnect === false) {
                this.reconnect = false;
            } else {
                this.reconnect = reconnect as any;
                if (typeof this.reconnect !== "object") {
                    this.reconnect = {} as ReconnectConfig;
                }
                (this.reconnect as ReconnectConfig).interval ??= 10,
                (this.reconnect as ReconnectConfig).max_interval ??= 30000,
                (this.reconnect as ReconnectConfig).attempts ??= 0
            }

            // Set auto ping
            if (ping === true) {
                this.auto_ping = 30000;
            } else if (typeof ping === "number") {
                this.auto_ping = ping;
            } else {
                this.auto_ping = false;
            }

            // Initialize maps
            this.commands = new Map();
            this.events = new Map();
            this.messages = new Map();
        }

        /**
         * Connect the websocket
         * @docs
         */
        public async connect(): Promise<void> {
            return new Promise((resolve) => {
                this.try_reconnect = true;

                // Create stream
                this.stream = new WebSocketLib(
                    this.api_key ? `${this.url}?api_key=${this.api_key}` : this.url
                );

                // On open
                this.stream.on('open', () => {
                    this.connected = true;
                    if (this.try_reconnect && this.reconnect !== false) {
                        this.reconnect.attempts = 0;
                    }
                    if (this.events.has("open")) {
                        this.events.get("open")!();
                    }
                    resolve();
                });

                // On message
                this.stream.on('message', (message: WebSocketLib.Data) => {
                    try {
                        let parsed = bson.deserialize(message as Buffer);

                        if (parsed.command != null && this.commands.has(parsed.command)) {
                            this.commands.get(parsed.command)!(parsed.id, parsed.data);
                        } else if (parsed.id) {
                            if (parsed.timestamp == null) {
                                parsed.timestamp = Date.now();
                            }
                            this.messages.set(parsed.id, parsed);
                        }
                    } catch (error) {
                        if (message.toString() === "pong") {
                            return;
                        }
                    }
                });

                // On close
                this.stream.on('close', (code: number, reason: string) => {
                    this.connected = false;
                    if (this.try_reconnect && this.reconnect !== false) {
                        if (this.events.has("reconnect")) {
                            this.events.get("reconnect")!(code, reason);
                        }
                        const timeout = Math.min(
                            (this.reconnect as ReconnectConfig).interval * Math.pow(2, (this.reconnect as ReconnectConfig).attempts!),
                            (this.reconnect as ReconnectConfig).max_interval
                        );
                        (this.reconnect as ReconnectConfig).attempts!++;
                        setTimeout(() => this.connect(), timeout);
                    } else if (this.events.has("close")) {
                        this.events.get("close")!(code, reason);
                    }
                });

                // On error
                this.stream.on('error', (error: Error) => {
                    this.stream?.close();
                    if (this.events.has("error")) {
                        this.events.get("error")!(error);
                    }
                });

                // Auto ping
                if (this.auto_ping !== false) {
                    clearTimeout(this.auto_ping_timeout);
                    const auto_ping = () => {
                        if (this.connected && this.stream) {
                            this.stream.send("ping");
                            this.auto_ping_timeout = setTimeout(
                                auto_ping,
                                typeof this.auto_ping === "number" ? this.auto_ping : 30000
                            );
                        }
                    };
                    this.auto_ping_timeout = setTimeout(
                        auto_ping,
                        typeof this.auto_ping === "number" ? this.auto_ping : 30000
                    );
                }
            });
        }

        /**
         * Disconnect from the server.
         * Automatically calls `close()`.
         * @docs
         */
        public disconnect(): void {
            this.try_reconnect = false;
            this.stream?.close();
            if (this.auto_ping_timeout) {
                clearTimeout(this.auto_ping_timeout);
            }
        }

        /**
         * Set an event callback.
         * @docs
         */
        public on_event<E extends Client.Event>(event: E, callback: Client.EventCallback<E>): void {
            this.events.set(event, callback);
        }

        /** 
         * Set a command callback.
         * Will be called when an incoming message has the specified command type.
         * The function can take the following arguments: `(stream, id, data) => {}`.
         * @docs
         */
        public on(command: string, callback: (id: string, data: any) => void): void {
            this.commands.set(command, callback);
        }

        /** 
         * Send raw data through the websocket.
         * @docs
         */
        public async send_raw(data: string | Buffer): Promise<void> {
            await this.await_till_connected();
            this.stream?.send(data);
        }

        
        /**
         * Await till the stream is connected.
         * @docs
         */
        public async await_till_connected(timeout: number = 60000): Promise<void> {
            if (this.connected) { return; }
            const step = 10;
            let elapsed = 0;
            return new Promise((resolve, reject) => {
                const is_connected = () => {
                    if (this.connected) {
                        resolve();
                    } else {
                        elapsed += step;
                        if (elapsed > timeout) {
                            reject(new Error("Timeout."));
                        } else {
                            setTimeout(is_connected, step);
                        }
                    }
                };
                is_connected();
            });
        }

        /** 
         * Wait for a message to be filled out.
         * @note This only works when there is a single response message, any more response messages will be lost.
         * @docs
         */
        public async await_response({
            id,
            timeout = 60000,
            step = 10
        }: {
            id: string;
            timeout?: number;
            step?: number;
        }): Promise<Message> {
            let elapsed = 0;
            return new Promise((resolve, reject) => {
                const wait = () => {
                    if (this.messages.has(id)) {
                        const data = this.messages.get(id)!;
                        this.messages.delete(id);
                        resolve(data);
                    } else {
                        elapsed += step;
                        if (elapsed > timeout) {
                            reject(new Error("Operation timed out."));
                        } else {
                            setTimeout(wait, step);
                        }
                    }
                };
                wait();
            });
        }

        /**
         * Send a command and expect a single response.
         * @docs
         */
        public async request({
            command,
            data,
            timeout = 60000
        }: {
            command: string;
            data: any;
            timeout?: number;
        }): Promise<Message> {
            const id = await this.send_helper({ command, data });
            return await this.await_response({ id, timeout });
        }

        /**
         * Send a response to a received command.
         * @docs
         */
        public async respond({
            id,
            data,
        }: {
            /** The request id from the received command. */
            id: string;
            /** The data to sent. */
            data: any;
        }): Promise<void> {
            await this.send_helper({ id, data });
        }

        /**
         * Send data through the websocket.
         * Either a request command when `command` is defined,
         * or a response when `command` is undefined and `id` is defined.
         * Note that `id` should always be defined in a sent response,
         * but it can be auto generated when sending a request command.
         */
        private async send_helper({
            command,
            id = Math.random().toString(36).substring(2, 32),
            data
        }: {
            command?: string;
            id?: string;
            data: any;
        }): Promise<string> {
            await this.await_till_connected();
            this.stream?.send(bson.serialize({
                command,
                id,
                data
            }));
            return id;
        }
    }

}
export { WebSocket as websocket } // snake_case compatibility