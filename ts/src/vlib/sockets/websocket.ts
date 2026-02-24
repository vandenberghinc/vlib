/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2026 Daan van den Bergh. All rights reserved.
 */

import { randomUUID, timingSafeEqual } from 'crypto';
import * as http from 'http';
import * as https from 'https';
import * as bson from 'bson';
import WebSocketLib, { WebSocketServer } from 'ws';
import { Events } from '../generic/events.js';
import { TimeoutError, InvalidUsageError } from '../errors/errors.js';


/**
 * The websocket utility.
 * @experimental
 * @nav Sockets
 * @docs
 */
export namespace WebSocket {

    // ------------------------------------------------------
    // Types

    /**
     * A formatted websocket message.
     *
     * @docs
     */
    export interface Message<D = unknown> {
        /** The command identifier for routing the message. */
        command?: string;
        /** The unique message identifier used for request-response correlation. */
        id?: string;
        /** The message payload. */
        data?: D;
        /** The unix timestamp in milliseconds when the message was received. */
        timestamp?: number;
    }

    /**
     * A type map defining the request and response data types for each command.
     * @example
     * {Type Map}
     * Create a type map of commands by defining an interface that extends `WebSocket.CommandsMeta`.
     * ```ts
     * type MyCommands: WebSocket.CommandsMeta = {
     *     get_user: {
     *         request: { user_id: string };
     *         response: { name: string; email: string };
     *     };
     *     update_user: {
     *         request: { user_id: string; name: string };
     *         response: { success: boolean };
     *     };
     * };
     * ```
     * @docs
     */
    export type CommandsMeta = Record<string, {
        /** The request data type for this command. */
        request: unknown;
        /** The response data type for this command. */
        response: unknown;
    }>;

    // ------------------------------------------------------
    // Server.

    /**
     * Rate limiting configuration for the WebSocket server upgrade requests.
     *
     * @docs
     */
    export interface RateLimitConfig {
        /** The maximum number of requests allowed within the specified interval. */
        limit: number;
        /** The rate limit reset interval in seconds. */
        interval: number;
    }

    /**
     * A WebSocket stream connection extending the base `ws` WebSocket with additional metadata.
     *
     * @docs
     */
    export type Stream = WebSocketLib & {
        /** The unique identifier for this stream connection. */
        id: string;
        /** Whether the stream is currently connected. */
        connected: boolean;
        /** A map of pending response messages keyed by their message id. */
        messages: Map<string, Message>;
    }

    /** The event meta type map for the {@link Server} class. */
    type ServerEventsMeta = {
        listen: (address: string) => void;
        open: (stream: Stream) => void;
        close: (stream: Stream, code: number, reason: string) => void;
        error: (stream: Stream | null, error: Error) => void;
    };

    /** The event meta type map for the {@link Client} class. */
    type ClientEventsMeta = {
        open: () => void;
        error: (error: Error) => void;
        reconnect: (code: number, reason: string) => void;
        close: (code: number, reason: string) => void;
    };

    /**
     * Nested types for the {@link Server} class.
     */
    export namespace Server {

        /**
         * Internal callback type used for storing command handlers at runtime.
         * The typed signatures from `on()` are widened to this type for storage in the commands map.
         */
        export type InternalCommandCallback = (stream: Stream, id: string, data: unknown, respond: (data: unknown) => void) => void;

        /**
         * Constructor options for the {@link Server} class.
         * @docs
         */
        export interface Opts {
            /** The optional server listen ip address. */
            ip?: string | null;
            /** The server listen port. */
            port?: number;
            /** The https settings for `https.createServer`. When left undefined a http server will be used. */
            https?: https.ServerOptions | null;
            /**
             * Rate limit settings for the http upgrade request.
             * Rate limiting can be disabled by defining `rate_limit` as `false`.
             */
            rate_limit?: RateLimitConfig | false;
            /**
             * An array of allowed client API keys. When no API keys are defined, no authentication will be required.
             * @warning API keys are transmitted in the URL query string during the WebSocket upgrade handshake, which may be logged by intermediate proxies or web servers.
             */
            api_keys?: string[];
            /** Optionally pass an already initialized server object directly. Either an http or https server object. */
            server?: http.Server | https.Server | null;
        }

        /**
         * The server event type.
         * @docs
         */
        export type Event = "listen" | "open" | "close" | "error"

        /**
         * The server event callback type.
         * - listen: `(address) => {}`
         * - open: `(stream) => {}`
         * - close: `(stream, code, reason) => {}`
         * - error: `(stream | null, error) => {}` — stream is `null` for server-level errors.
         * @docs
         */
        export type EventCallback<E extends Event> =
            E extends "listen" ? (address: string) => void :
            E extends "open" ? (stream: Stream) => void :
            E extends "close" ? (stream: Stream, code: number, reason: string) => void :
            E extends "error" ? (stream: Stream | null, error: Error) => void :
            never;
    }

    /**
     * WebSocket server object.
     * @experimental
     * @param opts The server constructor options.
     * @example
     * {Server Example}
     * Create a WebSocket server with typed command handling and event listeners.
     * ```ts
     * type Commands = {
     *     get_user: {
     *         request: { user_id: string };
     *         response: { name: string; email: string };
     *     };
     *     update_user: {
     *         request: { user_id: string; name: string };
     *         response: { success: boolean };
     *     };
     * };
     *
     * const server = new WebSocket.Server<Commands>({ port: 8080 });
     *
     * server.on('get_user', (stream, id, data, respond) => {
     *     // data: { user_id: string }
     *     respond({ name: "Alice", email: "alice@example.com" });
     * });
     *
     * server.on_event('open', (stream) => {
     *     server.request({
     *         stream,
     *         command: 'update_user',
     *         data: { user_id: "1", name: "Bob" },
     *     }).then((resp) => {
     *         // resp.data: { success: boolean }
     *     });
     * });
     *
     * server.start();
     * ```
     *
     * @docs
     */
    export class Server<C extends CommandsMeta> {

        /** The server listen port. */
        private port: number;

        /** The optional server listen ip address. */
        private ip?: string | null;

        /** The https configuration for the server, or `null` for http. */
        private https_config: https.ServerOptions | null;

        /** Whether the underlying server uses https. */
        private is_https: boolean = false;

        /** Whether the server has been started. */
        private started: boolean = false;

        /** The underlying http or https server instance. */
        private server: http.Server | https.Server | null;

        /** The list of allowed client API keys. */
        private api_keys: string[];

        /** The rate limit configuration, or `false` when rate limiting is disabled. */
        private rate_limit: RateLimitConfig | false;

        /** The underlying WebSocket server instance. */
        private wss!: WebSocketServer;

        /** A map of active stream connections keyed by their unique id. */
        private streams: Map<string, Stream>;

        /** A map of registered command callbacks keyed by the command name. */
        private commands: Map<string, Server.InternalCommandCallback>;

        /** The typed event handler for server events. */
        private events: Events<ServerEventsMeta>;

        /** A map of pending response resolvers keyed by message id, for instant response resolution. */
        private pending_resolvers: Map<string, {
            /** Resolve the promise with the response message. */
            resolve: (msg: Message) => void;
            /** Reject the promise with an error. */
            reject: (err: Error) => void;
            /** The timeout timer for this resolver. */
            timer: NodeJS.Timeout;
        }>;

        /** A cache of rate limit entries keyed by client ip address. */
        private rate_limit_cache: Map<string, {
            /** The number of requests made within the current interval. */
            count: number;
            /** The unix timestamp in milliseconds when the rate limit resets. */
            expiration: number;
        }>;

        /** The interval timer for periodic cache cleanup. */
        private _clear_caches_interval?: NodeJS.Timeout;

        /**
         * Construct a new server instance.
         * @param opts The server constructor options.
         *
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
            this.events = new Events<ServerEventsMeta>({
                single_events: ['listen', 'open', 'close', 'error'],
            });
            this.pending_resolvers = new Map();
            this.rate_limit_cache = new Map();
        }

        /**
         * Start the server and begin accepting connections.
         *
         * @docs
         */
        start(): void {
            if (this.started) {
                throw new InvalidUsageError("Server.start() has already been called.");
            }
            this.started = true;

            // Create the http(s) server if not provided.
            if (this.server === null) {
                if (this.https_config != null) {
                    this.server = https.createServer(this.https_config, (_req, res) => {
                        res.writeHead(426, { 'Content-Type': 'text/plain' });
                        res.end('This service requires WebSocket protocol.');
                    });
                    this.is_https = true;
                } else {
                    this.server = http.createServer((_req, res) => {
                        res.writeHead(426, { 'Content-Type': 'text/plain' });
                        res.end('This service requires WebSocket protocol.');
                    });
                }
            }

            // Detect HTTPS for user-provided servers.
            if (this.server instanceof https.Server) {
                this.is_https = true;
            }

            // Forward server-level errors through the event system.
            this.server.on('error', (error: Error) => {
                this.events.trigger('error', null, error);
            });

            // Initialize websocket server in noServer mode.
            this.wss = new WebSocketServer({ noServer: true });

            // Handle HTTP upgrade requests with rate limiting and authentication.
            this.server.on('upgrade', (request, socket, head) => {

                // Apply rate limiting.
                if (this.rate_limit !== false) {
                    const rl = this.rate_limit;
                    const ip = request.socket.remoteAddress;
                    if (!ip) {
                        socket.destroy();
                        return;
                    }
                    const now = Date.now();

                    if (this.rate_limit_cache.has(ip)) {
                        let data = this.rate_limit_cache.get(ip)!;
                        if (now >= data.expiration) {
                            data = {
                                count: 0,
                                expiration: now + rl.interval * 1000,
                            };
                        }
                        ++data.count;
                        if (data.count > rl.limit) {
                            socket.write(`HTTP/1.1 429 Too Many Requests\r\n\r\nRate limit exceeded, please try again in ${Math.floor((data.expiration - now) / 1000)} seconds.`);
                            socket.destroy();
                            return;
                        }
                        this.rate_limit_cache.set(ip, data);
                    } else {
                        this.rate_limit_cache.set(ip, {
                            count: 1,
                            expiration: now + rl.interval * 1000,
                        });
                    }
                }

                // Validate API key authentication.
                const parsed_url = new URL(request.url!, `http://${request.headers.host ?? 'localhost'}`);
                const api_key = parsed_url.searchParams.get('api_key');
                const api_key_valid = typeof api_key === 'string' && this.api_keys.some(key => {
                    const key_buf = Buffer.from(key);
                    const input_buf = Buffer.from(api_key);
                    if (key_buf.length !== input_buf.length) { return false; }
                    return timingSafeEqual(key_buf, input_buf);
                });
                if (this.api_keys.length > 0 && !api_key_valid) {
                    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
                    socket.destroy();
                    return;
                }

                // Complete the WebSocket upgrade handshake.
                this.wss.handleUpgrade(request, socket, head, (stream) => {
                    this.wss.emit('connection', stream, request);
                });
            });

            // Handle new WebSocket connections.
            this.wss.on('connection', (stream: Stream) => {
                stream.id = randomUUID();
                stream.connected = true;
                this.streams.set(stream.id, stream);
                stream.messages = new Map();

                // Handle incoming messages.
                stream.on('message', (message: WebSocketLib.Data) => {
                    try {
                        const buf = Buffer.isBuffer(message)
                            ? message
                            : Array.isArray(message)
                                ? Buffer.concat(message)
                                : Buffer.from(message as ArrayBuffer);
                        const parsed = bson.deserialize(buf);
                        if (typeof parsed === 'object') {
                            if (parsed.timestamp == null) {
                                parsed.timestamp = Date.now();
                            }

                            if (parsed.command && this.commands.has(parsed.command)) {
                                const respond_fn = (response_data: unknown) => {
                                    if (parsed.id == null) { return; }
                                    try {
                                        this.send_helper({ stream, id: parsed.id, data: response_data });
                                    } catch (err) {
                                        this.events.trigger('error', stream, err instanceof Error ? err : new Error(String(err)));
                                    }
                                };
                                this.commands.get(parsed.command)!(stream, parsed.id, parsed.data, respond_fn);
                            } else if (parsed.id) {
                                // Resolve pending awaiter immediately, otherwise buffer the message.
                                const entry = this.pending_resolvers.get(parsed.id);
                                if (entry) {
                                    this.pending_resolvers.delete(parsed.id);
                                    clearTimeout(entry.timer);
                                    entry.resolve(parsed);
                                } else {
                                    stream.messages.set(parsed.id, parsed);
                                }
                            }
                        }
                    } catch {
                        // Fall back to text-based ping/pong for non-BSON messages.
                        if (message.toString() === 'ping') {
                            stream.send('pong');
                            return;
                        }
                    }
                });

                // Notify listeners of the new connection.
                this.events.trigger('open', stream);

                // Handle stream close.
                stream.on('close', (code: number, reason: Buffer) => {
                    stream.connected = false;
                    this.events.trigger('close', stream, code, reason.toString());
                });

                // Handle stream errors.
                stream.on('error', (error: Error) => {
                    this.events.trigger('error', stream, error);
                });
            });

            // Start listening on the configured address.
            const listen_callback = () => {
                this.events.trigger('listen', `${this.is_https ? 'https' : 'http'}://${this.ip || 'localhost'}:${this.port}`);
            };

            if (this.ip) {
                this.server.listen(this.port, this.ip, listen_callback);
            } else {
                this.server.listen(this.port, listen_callback);
            }

            // Start periodic cache cleanup every 5 minutes.
            this._clear_caches_interval = setInterval(
                () => this._clear_caches(),
                60 * 5 * 1000,
            );
        }

        /**
         * Stop the server and close all active connections.
         * @returns A promise that resolves when the server has fully stopped.
         *
         * @docs
         */
        public async stop(): Promise<void> {
            if (!this.started) {
                throw new InvalidUsageError("Server.stop() called before Server.start().");
            }
            clearInterval(this._clear_caches_interval);
            this.wss.clients.forEach(client => client.close());

            // Reject all pending resolvers immediately for clean shutdown.
            this.pending_resolvers.forEach((entry) => {
                clearTimeout(entry.timer);
                entry.reject(new Error("Server stopped."));
            });
            this.pending_resolvers.clear();

            await Promise.all([
                new Promise<void>((resolve) => this.wss.close(() => resolve())),
                new Promise<void>((resolve) => this.server!.close(() => resolve())),
            ]);

            // Clean up internal state for potential restart.
            this.server = null;
            this.streams.clear();
            this.rate_limit_cache.clear();
            this.started = false;
        }

        /**
         * Set an event callback.
         * @param event The event type to listen for.
         * @param callback The callback to invoke when the event fires.
         *
         * @docs
         */
        public on_event<E extends Server.Event>(event: E, callback: Server.EventCallback<E>): void {
            this.events.add(event, callback as ServerEventsMeta[E]);
        }

        /**
         * Set a command callback.
         * Will be called when an incoming message has the specified command type.
         * @param command The command identifier to listen for.
         * @param callback The callback invoked with `(stream, id, data, respond)` when the command is received.
         *
         * @docs
         */
        public on<K extends keyof C & string>(
            command: K,
            callback: (
                /** The stream the command was received on. */
                stream: Stream,
                /** The unique message id for request-response correlation. */
                id: string,
                /** The typed request data. */
                data: C[K]['request'],
                /** Send a typed response back to the sender. */
                respond: (data: C[K]['response']) => void,
            ) => void,
        ): void {
            this.commands.set(command, callback as Server.InternalCommandCallback);
        }

        /**
         * Wait for a response message matching the specified id.
         * Uses an instant resolver pattern instead of polling for optimal performance at scale.
         * @param opts The await response options.
         * @returns The matching response message.
         * @note This only works when there is a single response message, any more response messages will be lost.
         *
         * @docs
         */
        public async await_response({
            stream,
            id,
            timeout = 60000,
        }: {
            /** The stream to wait for a response on. */
            stream: Stream;
            /** The message id to wait for. */
            id: string;
            /** The timeout in milliseconds. */
            timeout?: number;
        }): Promise<Message> {

            // Check if the message has already been received.
            if (stream.messages.has(id)) {
                const data = stream.messages.get(id)!;
                stream.messages.delete(id);
                return data;
            }

            // Register a resolver that fires instantly when the message arrives.
            return new Promise((resolve, reject) => {
                const timer = setTimeout(() => {
                    this.pending_resolvers.delete(id);
                    reject(new TimeoutError('Operation timed out.'));
                }, timeout);
                this.pending_resolvers.set(id, { resolve, reject, timer });
            });
        }

        /**
         * Send a command and expect a single response.
         * @param opts The request options.
         * @returns The typed response message.
         *
         * @docs
         */
        public async request<K extends keyof C & string>({
            stream,
            command,
            data,
            timeout = 60000
        }: {
            /** The stream to send the command on. */
            stream: Stream;
            /** The command identifier. */
            command: K;
            /** The typed request data. */
            data: C[K]['request'];
            /** The timeout in milliseconds. */
            timeout?: number;
        }): Promise<Message<C[K]['response']>> {
            const id = this.send_helper({ stream, command, data });
            return await this.await_response({ stream, id, timeout }) as Message<C[K]['response']>;
        }

        /**
         * Send a response to a received command.
         * @param opts The response options.
         *
         * @docs
         */
        public respond({
            stream,
            id,
            data,
        }: {
            /** The stream to send the response on. */
            stream: Stream;
            /** The request id from the received command. */
            id: string;
            /** The response data, constrained to the union of all command response types. */
            data: C[keyof C]['response'];
        }): void {
            this.send_helper({ stream, id, data });
        }

        /**
         * Clear expired rate limit entries, remove disconnected streams,
         * and purge messages older than 1 hour from connected streams.
         */
        private _clear_caches(): void {
            const now = Date.now();

            // Clean expired rate limit entries.
            this.rate_limit_cache.forEach((entry, ip) => {
                if (now >= entry.expiration) {
                    this.rate_limit_cache.delete(ip);
                }
            });

            // Clean disconnected streams and stale messages.
            this.streams.forEach((client, id) => {
                if (client.connected) {
                    // Purge messages older than 1 hour.
                    client.messages.forEach((msg, msg_id) => {
                        if (msg.timestamp && now >= msg.timestamp + (3600 * 1000)) {
                            client.messages.delete(msg_id);
                        }
                    });
                } else {
                    // Remove disconnected streams.
                    this.streams.delete(id);
                }
            });
        }

        /**
         * Send data through the websocket.
         * Sends a request command when `command` is defined,
         * or a response when `command` is undefined and `id` is defined.
         * @param opts The send options.
         * @returns The message id used for the sent message.
         */
        private send_helper({
            stream,
            command,
            id = randomUUID(),
            data
        }: {
            /** The stream to send data on. */
            stream: Stream;
            /** The optional command identifier for request messages. */
            command?: string;
            /** The message id, auto-generated if not provided. */
            id?: string;
            /** The data payload to send. */
            data: unknown;
        }): string {
            if (stream.readyState !== WebSocketLib.OPEN) {
                throw new Error("Stream is no longer connected.");
            }
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

    /**
     * Reconnection configuration for the WebSocket client.
     *
     * @docs
     */
    export interface ReconnectConfig {
        /** The base interval in milliseconds for the first reconnect attempt. */
        interval: number;
        /** The maximum interval in milliseconds for a reconnect attempt. The interval gradually backs off on consecutive connection failures. */
        max_interval: number;
        /** The current number of consecutive reconnect attempts. Resets to 0 on successful connection. */
        attempts?: number;
    }

    /**
     * Nested types for the {@link Client} class.
     */
    export namespace Client {

        /**
         * Internal callback type used for storing command handlers at runtime.
         * The typed signatures from `on()` are widened to this type for storage in the commands map.
         */
        export type InternalCommandCallback = (id: string, data: unknown, respond: (data: unknown) => void) => void;

        /**
         * Constructor options for the {@link Client} class.
         * @docs
         */
        export interface Opts {
            /** The websocket server URL to connect to. */
            url?: string;
            /**
             * The API key needed by the connection to start the handshake.
             * @warning API keys are transmitted in the URL query string during the WebSocket upgrade handshake, which may be logged by intermediate proxies or web servers.
             */
            api_key?: string | null;
            /**
             * Enable automatic reconnection.
             * Define `false` to disable, `true` for default options, or provide custom {@link ReconnectConfig} options.
             */
            reconnect?: ReconnectConfig | boolean;
            /** Enable automatic pings to keep the connection alive. Can be a boolean or a milliseconds number as the auto ping interval. Default interval is `30000`. */
            ping?: boolean | number;
        }

        /**
         * The client event type.
         * @docs
         */
        export type Event = "open" | "error" | "reconnect" | "close"

        /**
         * The client event callback type.
         * - open: `() => {}`
         * - error: `(error) => {}`
         * - reconnect: `(code, reason) => {}`
         * - close: `(code, reason) => {}`
         * @docs
         */
        export type EventCallback<E extends Event> =
            E extends "open" ? () => void :
            E extends "error" ? (error: Error) => void :
            E extends "reconnect" ? (code: number, reason: string) => void :
            E extends "close" ? (code: number, reason: string) => void :
            never;
    }

    /**
     * The websocket client object.
     * @experimental
     * @param opts The client constructor options.
     * @example
     * {Client Example}
     * Create a WebSocket client with typed command handling and event listeners.
     * ```ts
     * type Commands = {
     *     get_user: {
     *         request: { user_id: string };
     *         response: { name: string; email: string };
     *     };
     *     update_user: {
     *         request: { user_id: string; name: string };
     *         response: { success: boolean };
     *     };
     * };
     *
     * const client = new WebSocket.Client<Commands>({
     *     url: 'ws://localhost:8080',
     * });
     *
     * client.on('update_user', (id, data, respond) => {
     *     // data: { user_id: string; name: string }
     *     respond({ success: true });
     * });
     *
     * await client.connect();
     *
     * const resp = await client.request({
     *     command: 'get_user',
     *     data: { user_id: "1" },
     * });
     * // resp.data: { name: string; email: string }
     * ```
     *
     * @docs
     */
    export class Client<C extends CommandsMeta> {

        /** The websocket server URL. */
        private url: string;

        /** The API key for authentication, or `null` when no authentication is required. */
        private api_key: string | null;

        /** The reconnection configuration, or `false` when auto-reconnect is disabled. */
        private reconnect: ReconnectConfig | false;

        /** The auto-ping interval in milliseconds, or `false` when auto-ping is disabled. */
        private auto_ping: number | false;

        /** A map of registered command callbacks keyed by the command name. */
        private commands: Map<string, Client.InternalCommandCallback>;

        /** The typed event handler for client events. */
        private events: Events<ClientEventsMeta>;

        /** A map of pending response messages keyed by their message id. */
        private messages: Map<string, Message>;

        /** A map of pending response resolvers keyed by message id, for instant response resolution. */
        private pending_resolvers: Map<string, {
            /** Resolve the promise with the response message. */
            resolve: (msg: Message) => void;
            /** Reject the promise with an error. */
            reject: (err: Error) => void;
            /** The timeout timer for this resolver. */
            timer: NodeJS.Timeout;
        }>;

        /** The current underlying WebSocket stream. */
        private stream?: WebSocketLib;

        /** Whether the client is currently connected to the server. */
        private connected: boolean = false;

        /** Whether to attempt reconnection on connection close. */
        private try_reconnect: boolean = true;

        /** The timer for the next auto-ping. */
        private auto_ping_timeout?: NodeJS.Timeout;

        /** The timer for the next reconnection attempt. */
        private reconnect_timer?: NodeJS.Timeout;

        /**
         * Construct a new client instance.
         * @param opts The client constructor options.
         *
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

            // Set reconnect configuration.
            if (reconnect === false) {
                this.reconnect = false;
            } else if (reconnect === true || typeof reconnect !== 'object') {
                this.reconnect = { interval: 10, max_interval: 30000, attempts: 0 };
            } else {
                this.reconnect = {
                    interval: reconnect.interval ?? 10,
                    max_interval: reconnect.max_interval ?? 30000,
                    attempts: reconnect.attempts ?? 0,
                };
            }

            // Set auto ping interval.
            if (ping === true) {
                this.auto_ping = 30000;
            } else if (typeof ping === "number") {
                this.auto_ping = ping;
            } else {
                this.auto_ping = false;
            }

            // Initialize maps.
            this.commands = new Map();
            this.events = new Events<ClientEventsMeta>({
                single_events: ['open', 'error', 'reconnect', 'close'],
            });
            this.messages = new Map();
            this.pending_resolvers = new Map();
        }

        /**
         * Connect the websocket to the server.
         * @returns A promise that resolves when the connection is established, or rejects on error.
         *
         * @docs
         */
        public async connect(): Promise<void> {
            return new Promise((resolve, reject) => {
                let settled = false;
                this.try_reconnect = true;

                // Close existing connection if any, to prevent stream leaks.
                // Temporarily disable reconnect so the old close event doesn't trigger it.
                if (this.stream) {
                    this.try_reconnect = false;
                    this.stream.removeAllListeners();
                    this.stream.close();
                    this.try_reconnect = true;
                }

                // Create stream with optional API key authentication.
                this.stream = new WebSocketLib(
                    this.api_key ? `${this.url}?api_key=${encodeURIComponent(this.api_key)}` : this.url
                );

                // On open: mark connected, reset reconnect attempts, start auto-ping, and resolve.
                this.stream.on('open', () => {
                    this.connected = true;
                    if (this.reconnect !== false) {
                        this.reconnect.attempts = 0;
                    }
                    this.events.trigger("open");

                    // Start auto-ping inside the open handler so it only runs after the connection is established.
                    if (this.auto_ping !== false) {
                        clearTimeout(this.auto_ping_timeout);
                        const ping_interval = this.auto_ping;
                        const auto_ping = () => {
                            if (this.connected && this.stream) {
                                this.stream.send("ping");
                                this.auto_ping_timeout = setTimeout(auto_ping, ping_interval);
                            }
                        };
                        this.auto_ping_timeout = setTimeout(auto_ping, ping_interval);
                    }

                    if (!settled) {
                        settled = true;
                        resolve();
                    }
                });

                // On message: deserialize BSON and route to command handlers or message buffer.
                this.stream.on('message', (message: WebSocketLib.Data) => {
                    try {
                        const buf = Buffer.isBuffer(message)
                            ? message
                            : Array.isArray(message)
                                ? Buffer.concat(message)
                                : Buffer.from(message as ArrayBuffer);
                        const parsed = bson.deserialize(buf);

                        if (parsed.command != null && this.commands.has(parsed.command)) {
                            const respond_fn = (response_data: unknown) => {
                                if (parsed.id == null) { return; }
                                this.stream?.send(bson.serialize({
                                    id: parsed.id,
                                    data: response_data,
                                }));
                            };
                            this.commands.get(parsed.command)!(parsed.id, parsed.data, respond_fn);
                        } else if (parsed.id) {
                            if (parsed.timestamp == null) {
                                parsed.timestamp = Date.now();
                            }
                            // Resolve pending awaiter immediately, otherwise buffer the message.
                            const entry = this.pending_resolvers.get(parsed.id);
                            if (entry) {
                                this.pending_resolvers.delete(parsed.id);
                                clearTimeout(entry.timer);
                                entry.resolve(parsed);
                            } else {
                                this.messages.set(parsed.id, parsed);
                            }
                        }
                    } catch {
                        // Ignore non-BSON messages like pong responses.
                        if (message.toString() === "pong") {
                            return;
                        }
                    }
                });

                // On close: attempt reconnection with exponential backoff or fire close event.
                this.stream.on('close', (code: number, reason: Buffer) => {
                    this.connected = false;
                    if (this.try_reconnect && this.reconnect !== false) {
                        const rc = this.reconnect;
                        this.events.trigger("reconnect", code, reason.toString());
                        const timeout = Math.min(
                            rc.interval * Math.pow(2, rc.attempts!),
                            rc.max_interval
                        );
                        rc.attempts!++;
                        this.reconnect_timer = setTimeout(() => {
                            this.reconnect_timer = undefined;
                            this.connect().catch((err) => {
                                this.events.trigger("error", err);
                            });
                        }, timeout);
                    } else {
                        this.events.trigger("close", code, reason.toString());
                    }
                });

                // On error: close the stream and reject the initial connect promise if not yet settled.
                this.stream.on('error', (error: Error) => {
                    this.stream?.close();
                    if (!settled) {
                        settled = true;
                        reject(error);
                    }
                    this.events.trigger("error", error);
                });
            });
        }

        /**
         * Disconnect from the server.
         * Disables auto-reconnect, closes the underlying stream, and cleans up pending state.
         *
         * @docs
         */
        public disconnect(): void {
            this.try_reconnect = false;
            clearTimeout(this.reconnect_timer);
            clearTimeout(this.auto_ping_timeout);
            if (this.stream) {
                this.stream.removeAllListeners();
                this.stream.close();
            }
            this.messages.clear();

            // Reject all pending resolvers immediately for clean shutdown.
            this.pending_resolvers.forEach((entry) => {
                clearTimeout(entry.timer);
                entry.reject(new Error("Client disconnected."));
            });
            this.pending_resolvers.clear();
        }

        /**
         * Set an event callback.
         * @param event The event type to listen for.
         * @param callback The callback to invoke when the event fires.
         *
         * @docs
         */
        public on_event<E extends Client.Event>(event: E, callback: Client.EventCallback<E>): void {
            this.events.add(event, callback as ClientEventsMeta[E]);
        }

        /**
         * Set a command callback.
         * Will be called when an incoming message has the specified command type.
         * @param command The command identifier to listen for.
         * @param callback The callback invoked with `(id, data, respond)` when the command is received.
         *
         * @docs
         */
        public on<K extends keyof C & string>(
            command: K,
            callback: (
                /** The unique message id for request-response correlation. */
                id: string,
                /** The typed request data. */
                data: C[K]['request'],
                /** Send a typed response back to the sender. */
                respond: (data: C[K]['response']) => void,
            ) => void,
        ): void {
            this.commands.set(command, callback as Client.InternalCommandCallback);
        }

        /**
         * Send raw data through the websocket.
         * @param data The raw string or buffer data to send.
         *
         * @docs
         */
        public async send_raw(data: string | Buffer): Promise<void> {
            await this.await_till_connected();
            this.stream?.send(data);
        }


        /**
         * Await until the stream is connected.
         * @param timeout The timeout in milliseconds before rejecting.
         * @returns A promise that resolves when the connection is established.
         *
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
                            reject(new TimeoutError("Connection timed out."));
                        } else {
                            setTimeout(is_connected, step);
                        }
                    }
                };
                is_connected();
            });
        }

        /**
         * Wait for a response message matching the specified id.
         * Uses an instant resolver pattern instead of polling for optimal performance at scale.
         * @param opts The await response options.
         * @returns The matching response message.
         * @note This only works when there is a single response message, any more response messages will be lost.
         *
         * @docs
         */
        public async await_response({
            id,
            timeout = 60000,
        }: {
            /** The message id to wait for. */
            id: string;
            /** The timeout in milliseconds. */
            timeout?: number;
        }): Promise<Message> {

            // Check if the message has already been received.
            if (this.messages.has(id)) {
                const data = this.messages.get(id)!;
                this.messages.delete(id);
                return data;
            }

            // Register a resolver that fires instantly when the message arrives.
            return new Promise((resolve, reject) => {
                const timer = setTimeout(() => {
                    this.pending_resolvers.delete(id);
                    reject(new TimeoutError("Operation timed out."));
                }, timeout);
                this.pending_resolvers.set(id, { resolve, reject, timer });
            });
        }

        /**
         * Send a command and expect a single response.
         * @param opts The request options.
         * @returns The typed response message.
         *
         * @docs
         */
        public async request<K extends keyof C & string>({
            command,
            data,
            timeout = 60000
        }: {
            /** The command identifier. */
            command: K;
            /** The typed request data. */
            data: C[K]['request'];
            /** The timeout in milliseconds. */
            timeout?: number;
        }): Promise<Message<C[K]['response']>> {
            const id = await this.send_helper({ command, data });
            return await this.await_response({ id, timeout }) as Message<C[K]['response']>;
        }

        /**
         * Send a response to a received command.
         * @param opts The response options.
         *
         * @docs
         */
        public async respond({
            id,
            data,
        }: {
            /** The request id from the received command. */
            id: string;
            /** The response data, constrained to the union of all command response types. */
            data: C[keyof C]['response'];
        }): Promise<void> {
            await this.send_helper({ id, data });
        }

        /**
         * Send data through the websocket.
         * Sends a request command when `command` is defined,
         * or a response when `command` is undefined and `id` is defined.
         * @param opts The send options.
         * @returns The message id used for the sent message.
         */
        private async send_helper({
            command,
            id = randomUUID(),
            data
        }: {
            /** The optional command identifier for request messages. */
            command?: string;
            /** The message id, auto-generated if not provided. */
            id?: string;
            /** The data payload to send. */
            data: unknown;
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
