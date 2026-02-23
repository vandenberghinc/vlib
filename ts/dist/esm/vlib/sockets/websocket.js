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
export var WebSocket;
(function (WebSocket) {
    // ------------------------------------------------------
    // Types
    /**
     * WebSocket server object.
     * @experimental
     * @param opts The server constructor options.
     * @example
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
    class Server {
        /** The server listen port. */
        port;
        /** The optional server listen ip address. */
        ip;
        /** The https configuration for the server, or `null` for http. */
        https_config;
        /** Whether the underlying server uses https. */
        is_https = false;
        /** Whether the server has been started. */
        started = false;
        /** The underlying http or https server instance. */
        server;
        /** The list of allowed client API keys. */
        api_keys;
        /** The rate limit configuration, or `false` when rate limiting is disabled. */
        rate_limit;
        /** The underlying WebSocket server instance. */
        wss;
        /** A map of active stream connections keyed by their unique id. */
        streams;
        /** A map of registered command callbacks keyed by the command name. */
        commands;
        /** The typed event handler for server events. */
        events;
        /** A map of pending response resolvers keyed by message id, for instant response resolution. */
        pending_resolvers;
        /** A cache of rate limit entries keyed by client ip address. */
        rate_limit_cache;
        /** The interval timer for periodic cache cleanup. */
        _clear_caches_interval;
        /**
         * Construct a new server instance.
         * @param opts The server constructor options.
         *
         * @docs
         */
        constructor({ ip = null, port = 8000, https = null, rate_limit = {
            limit: 5,
            interval: 60,
        }, api_keys = [], server = null, }) {
            this.port = port;
            this.ip = ip;
            this.https_config = https;
            this.server = server;
            this.api_keys = api_keys;
            this.rate_limit = rate_limit;
            this.streams = new Map();
            this.commands = new Map();
            this.events = new Events({
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
        start() {
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
                }
                else {
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
            this.server.on('error', (error) => {
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
                        let data = this.rate_limit_cache.get(ip);
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
                    }
                    else {
                        this.rate_limit_cache.set(ip, {
                            count: 1,
                            expiration: now + rl.interval * 1000,
                        });
                    }
                }
                // Validate API key authentication.
                const parsed_url = new URL(request.url, `http://${request.headers.host ?? 'localhost'}`);
                const api_key = parsed_url.searchParams.get('api_key');
                const api_key_valid = typeof api_key === 'string' && this.api_keys.some(key => {
                    const key_buf = Buffer.from(key);
                    const input_buf = Buffer.from(api_key);
                    if (key_buf.length !== input_buf.length) {
                        return false;
                    }
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
            this.wss.on('connection', (stream) => {
                stream.id = randomUUID();
                stream.connected = true;
                this.streams.set(stream.id, stream);
                stream.messages = new Map();
                // Handle incoming messages.
                stream.on('message', (message) => {
                    try {
                        const buf = Buffer.isBuffer(message)
                            ? message
                            : Array.isArray(message)
                                ? Buffer.concat(message)
                                : Buffer.from(message);
                        const parsed = bson.deserialize(buf);
                        if (typeof parsed === 'object') {
                            if (parsed.timestamp == null) {
                                parsed.timestamp = Date.now();
                            }
                            if (parsed.command && this.commands.has(parsed.command)) {
                                const respond_fn = (response_data) => {
                                    if (parsed.id == null) {
                                        return;
                                    }
                                    try {
                                        this.send_helper({ stream, id: parsed.id, data: response_data });
                                    }
                                    catch (err) {
                                        this.events.trigger('error', stream, err instanceof Error ? err : new Error(String(err)));
                                    }
                                };
                                this.commands.get(parsed.command)(stream, parsed.id, parsed.data, respond_fn);
                            }
                            else if (parsed.id) {
                                // Resolve pending awaiter immediately, otherwise buffer the message.
                                const entry = this.pending_resolvers.get(parsed.id);
                                if (entry) {
                                    this.pending_resolvers.delete(parsed.id);
                                    clearTimeout(entry.timer);
                                    entry.resolve(parsed);
                                }
                                else {
                                    stream.messages.set(parsed.id, parsed);
                                }
                            }
                        }
                    }
                    catch {
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
                stream.on('close', (code, reason) => {
                    stream.connected = false;
                    this.events.trigger('close', stream, code, reason.toString());
                });
                // Handle stream errors.
                stream.on('error', (error) => {
                    this.events.trigger('error', stream, error);
                });
            });
            // Start listening on the configured address.
            const listen_callback = () => {
                this.events.trigger('listen', `${this.is_https ? 'https' : 'http'}://${this.ip || 'localhost'}:${this.port}`);
            };
            if (this.ip) {
                this.server.listen(this.port, this.ip, listen_callback);
            }
            else {
                this.server.listen(this.port, listen_callback);
            }
            // Start periodic cache cleanup every 5 minutes.
            this._clear_caches_interval = setInterval(() => this._clear_caches(), 60 * 5 * 1000);
        }
        /**
         * Stop the server and close all active connections.
         * @returns A promise that resolves when the server has fully stopped.
         *
         * @docs
         */
        async stop() {
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
                new Promise((resolve) => this.wss.close(() => resolve())),
                new Promise((resolve) => this.server.close(() => resolve())),
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
        on_event(event, callback) {
            this.events.add(event, callback);
        }
        /**
         * Set a command callback.
         * Will be called when an incoming message has the specified command type.
         * @param command The command identifier to listen for.
         * @param callback The callback invoked with `(stream, id, data, respond)` when the command is received.
         *
         * @docs
         */
        on(command, callback) {
            this.commands.set(command, callback);
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
        async await_response({ stream, id, timeout = 60000, }) {
            // Check if the message has already been received.
            if (stream.messages.has(id)) {
                const data = stream.messages.get(id);
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
        async request({ stream, command, data, timeout = 60000 }) {
            const id = this.send_helper({ stream, command, data });
            return await this.await_response({ stream, id, timeout });
        }
        /**
         * Send a response to a received command.
         * @param opts The response options.
         *
         * @docs
         */
        respond({ stream, id, data, }) {
            this.send_helper({ stream, id, data });
        }
        /**
         * Clear expired rate limit entries, remove disconnected streams,
         * and purge messages older than 1 hour from connected streams.
         */
        _clear_caches() {
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
                }
                else {
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
        send_helper({ stream, command, id = randomUUID(), data }) {
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
    WebSocket.Server = Server;
    /**
     * The websocket client object.
     * @experimental
     * @param opts The client constructor options.
     * @example
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
    class Client {
        /** The websocket server URL. */
        url;
        /** The API key for authentication, or `null` when no authentication is required. */
        api_key;
        /** The reconnection configuration, or `false` when auto-reconnect is disabled. */
        reconnect;
        /** The auto-ping interval in milliseconds, or `false` when auto-ping is disabled. */
        auto_ping;
        /** A map of registered command callbacks keyed by the command name. */
        commands;
        /** The typed event handler for client events. */
        events;
        /** A map of pending response messages keyed by their message id. */
        messages;
        /** A map of pending response resolvers keyed by message id, for instant response resolution. */
        pending_resolvers;
        /** The current underlying WebSocket stream. */
        stream;
        /** Whether the client is currently connected to the server. */
        connected = false;
        /** Whether to attempt reconnection on connection close. */
        try_reconnect = true;
        /** The timer for the next auto-ping. */
        auto_ping_timeout;
        /** The timer for the next reconnection attempt. */
        reconnect_timer;
        /**
         * Construct a new client instance.
         * @param opts The client constructor options.
         *
         * @docs
         */
        constructor({ url = "wss://localhost:8080", api_key = null, reconnect = {
            interval: 10,
            max_interval: 30000,
        }, ping = true, }) {
            this.url = url;
            this.api_key = api_key;
            // Set reconnect configuration.
            if (reconnect === false) {
                this.reconnect = false;
            }
            else if (reconnect === true || typeof reconnect !== 'object') {
                this.reconnect = { interval: 10, max_interval: 30000, attempts: 0 };
            }
            else {
                this.reconnect = {
                    interval: reconnect.interval ?? 10,
                    max_interval: reconnect.max_interval ?? 30000,
                    attempts: reconnect.attempts ?? 0,
                };
            }
            // Set auto ping interval.
            if (ping === true) {
                this.auto_ping = 30000;
            }
            else if (typeof ping === "number") {
                this.auto_ping = ping;
            }
            else {
                this.auto_ping = false;
            }
            // Initialize maps.
            this.commands = new Map();
            this.events = new Events({
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
        async connect() {
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
                this.stream = new WebSocketLib(this.api_key ? `${this.url}?api_key=${encodeURIComponent(this.api_key)}` : this.url);
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
                this.stream.on('message', (message) => {
                    try {
                        const buf = Buffer.isBuffer(message)
                            ? message
                            : Array.isArray(message)
                                ? Buffer.concat(message)
                                : Buffer.from(message);
                        const parsed = bson.deserialize(buf);
                        if (parsed.command != null && this.commands.has(parsed.command)) {
                            const respond_fn = (response_data) => {
                                if (parsed.id == null) {
                                    return;
                                }
                                this.stream?.send(bson.serialize({
                                    id: parsed.id,
                                    data: response_data,
                                }));
                            };
                            this.commands.get(parsed.command)(parsed.id, parsed.data, respond_fn);
                        }
                        else if (parsed.id) {
                            if (parsed.timestamp == null) {
                                parsed.timestamp = Date.now();
                            }
                            // Resolve pending awaiter immediately, otherwise buffer the message.
                            const entry = this.pending_resolvers.get(parsed.id);
                            if (entry) {
                                this.pending_resolvers.delete(parsed.id);
                                clearTimeout(entry.timer);
                                entry.resolve(parsed);
                            }
                            else {
                                this.messages.set(parsed.id, parsed);
                            }
                        }
                    }
                    catch {
                        // Ignore non-BSON messages like pong responses.
                        if (message.toString() === "pong") {
                            return;
                        }
                    }
                });
                // On close: attempt reconnection with exponential backoff or fire close event.
                this.stream.on('close', (code, reason) => {
                    this.connected = false;
                    if (this.try_reconnect && this.reconnect !== false) {
                        const rc = this.reconnect;
                        this.events.trigger("reconnect", code, reason.toString());
                        const timeout = Math.min(rc.interval * Math.pow(2, rc.attempts), rc.max_interval);
                        rc.attempts++;
                        this.reconnect_timer = setTimeout(() => {
                            this.reconnect_timer = undefined;
                            this.connect().catch((err) => {
                                this.events.trigger("error", err);
                            });
                        }, timeout);
                    }
                    else {
                        this.events.trigger("close", code, reason.toString());
                    }
                });
                // On error: close the stream and reject the initial connect promise if not yet settled.
                this.stream.on('error', (error) => {
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
        disconnect() {
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
        on_event(event, callback) {
            this.events.add(event, callback);
        }
        /**
         * Set a command callback.
         * Will be called when an incoming message has the specified command type.
         * @param command The command identifier to listen for.
         * @param callback The callback invoked with `(id, data, respond)` when the command is received.
         *
         * @docs
         */
        on(command, callback) {
            this.commands.set(command, callback);
        }
        /**
         * Send raw data through the websocket.
         * @param data The raw string or buffer data to send.
         *
         * @docs
         */
        async send_raw(data) {
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
        async await_till_connected(timeout = 60000) {
            if (this.connected) {
                return;
            }
            const step = 10;
            let elapsed = 0;
            return new Promise((resolve, reject) => {
                const is_connected = () => {
                    if (this.connected) {
                        resolve();
                    }
                    else {
                        elapsed += step;
                        if (elapsed > timeout) {
                            reject(new TimeoutError("Connection timed out."));
                        }
                        else {
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
        async await_response({ id, timeout = 60000, }) {
            // Check if the message has already been received.
            if (this.messages.has(id)) {
                const data = this.messages.get(id);
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
        async request({ command, data, timeout = 60000 }) {
            const id = await this.send_helper({ command, data });
            return await this.await_response({ id, timeout });
        }
        /**
         * Send a response to a received command.
         * @param opts The response options.
         *
         * @docs
         */
        async respond({ id, data, }) {
            await this.send_helper({ id, data });
        }
        /**
         * Send data through the websocket.
         * Sends a request command when `command` is defined,
         * or a response when `command` is undefined and `id` is defined.
         * @param opts The send options.
         * @returns The message id used for the sent message.
         */
        async send_helper({ command, id = randomUUID(), data }) {
            await this.await_till_connected();
            this.stream?.send(bson.serialize({
                command,
                id,
                data
            }));
            return id;
        }
    }
    WebSocket.Client = Client;
})(WebSocket || (WebSocket = {}));
export { WebSocket as websocket }; // snake_case compatibility
//# sourceMappingURL=websocket.js.map