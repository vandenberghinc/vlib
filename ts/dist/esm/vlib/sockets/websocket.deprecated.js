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
import WebSocket, { WebSocketServer } from 'ws';
globalThis.WebSocket = WebSocket;
export var websocket;
(function (websocket) {
    // ------------------------------------------------------
    // Types
    /*  @docs:
        @chapter: Sockets
        @title: Websocket Server
        @descr: Websocket server object.
        @param:
            @name: ip
            @descr: The optional server listen ip.
        @param:
            @name: port
            @descr: The server listen post.
        @param:
            @name: https
            @descr: The https settings for `https.createServer`. When left undefined a http server will be used.
        @param:
            @name: rate_limit
            @descr: Rate limit settings for the http upgrade request. Rate limiting can be disabled by defining `rate_limit` as `false`.
            @type: object, boolean
            @attr:
                @name: limit
                @descr: The limit on the amount of requests in the specified interval.
            @attr:
                @name: interval
                @descr: The rate limit reset interval in seconds.
        @param:
            @name: api_keys
            @descr: An array of allowed client api keys. When no api keys are defined, no authentication will be required.
        @param:
            @name: server
            @descr: Optionally pass the server initialized server object directly. Either an http or https server object.
    */
    class Server {
        port;
        ip;
        https_config;
        server;
        api_keys;
        rate_limit;
        wss;
        streams;
        commands;
        events;
        rate_limit_cache;
        _clear_caches_interval;
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
            this.events = new Map();
            this.rate_limit_cache = new Map();
        }
        /*  @docs:
         *  @title: Start
         *  @descr: Start the server.
         */
        start() {
            if (this.server === null) {
                if (this.https_config != null) {
                    this.server = https.createServer(this.https_config, (req, res) => {
                        res.writeHead(426, { 'Content-Type': 'text/plain' });
                        res.end('This service requires WebSocket protocol.');
                    });
                    this.server.__is_https = true;
                }
                else {
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
                    const ip = request.socket.remoteAddress;
                    const now = Date.now();
                    if (this.rate_limit_cache.has(ip)) {
                        let data = this.rate_limit_cache.get(ip);
                        if (now >= data.expiration) {
                            data = {
                                count: 0,
                                expiration: now + this.rate_limit.interval * 1000,
                            };
                        }
                        ++data.count;
                        if (data.count > this.rate_limit.limit) {
                            socket.write(`HTTP/1.1 429 Too Many Requests\r\n\r\nRate limit exceeded, please try again in ${Math.floor((data.expiration - now) / 1000)} seconds.`);
                            socket.destroy();
                            return;
                        }
                        this.rate_limit_cache.set(ip, data);
                    }
                    else {
                        this.rate_limit_cache.set(ip, {
                            count: 1,
                            expiration: now + this.rate_limit.interval * 1000,
                        });
                    }
                }
                const { query } = url.parse(request.url, true);
                if (this.api_keys.length > 0 && !this.api_keys.includes(query.api_key)) {
                    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
                    socket.destroy();
                    return;
                }
                this.wss.handleUpgrade(request, socket, head, (stream) => {
                    this.wss.emit('connection', stream, request);
                });
            });
            // Handle connections
            this.wss.on('connection', (stream) => {
                stream.id = Math.random().toString(36).substring(2, 16);
                this.streams.set(stream.id, stream);
                stream.messages = new Map();
                stream.on('message', (message) => {
                    try {
                        let parsed = bson.deserialize(message);
                        if (typeof parsed === 'object') {
                            if (!parsed.timestamp) {
                                parsed.timestamp = Date.now();
                            }
                            if (parsed.command && this.commands.has(parsed.command)) {
                                this.commands.get(parsed.command)(stream, parsed.id, parsed.data);
                            }
                            else if (parsed.id) {
                                stream.messages.set(parsed.id, parsed);
                            }
                        }
                    }
                    catch (error) {
                        if (message.toString() === 'ping') {
                            stream.send('pong');
                            return;
                        }
                    }
                });
                if (this.events.has('open')) {
                    this.events.get('open')(stream);
                }
                stream.on('close', (code, reason) => {
                    stream.connected = false;
                    if (this.events.has('close')) {
                        this.events.get('close')(stream, code, reason);
                    }
                });
                const err_callback = this.events.get('error');
                if (err_callback) {
                    stream.on('error', (error) => err_callback(stream, error));
                }
            });
            // Start listening
            const listen_callback = () => {
                if (this.events.has('listen')) {
                    this.events.get('listen')(`${this.server.__is_https ? 'https' : 'http'}://${this.ip || 'localhost'}:${this.port}`);
                }
            };
            if (this.ip) {
                this.server.listen(this.port, this.ip, listen_callback);
            }
            else {
                this.server.listen(this.port, listen_callback);
            }
            // Clear caches interval
            this._clear_caches_interval = setInterval(() => this._clear_caches(), 60 * 5 * 1000);
        }
        /*  @docs:
         *  @title: Stop
         *  @descr: Stop the server.
         */
        async stop() {
            return new Promise((resolve) => {
                clearInterval(this._clear_caches_interval);
                let closed = 0;
                this.wss.clients.forEach(client => {
                    client.close();
                });
                this.wss.close(() => {
                    ++closed;
                    if (closed === 2) {
                        resolve();
                    }
                });
                this.server.close(() => {
                    ++closed;
                    if (closed === 2) {
                        resolve();
                    }
                });
            });
        }
        /*  @docs:
         *  @title: Event callback
         *  @descr:
         *      Set an event callback.
         *
         *      The following callbacks can be set:
         *      - listen: (address) => {}
         *      - open: (stream) => {}
         *      - close: (stream, code, reason) => {}
         *      - error: (stream, error) => {}
         */
        on_event(event, callback) {
            this.events.set(event, callback);
        }
        /*  @docs:
         *  @title: Command
         *  @descr:
         *      Set a command callback.
         *      Will be called when an incoming message has the specified command type.
         *      The function can take the following arguments: `(stream, id, data) => {}`.
         */
        on(command, callback) {
            this.commands.set(command, callback);
        }
        /*  @docs:
         *  @title: Await response
         *  @descr: Wait for a message to be filled out.
         *  @note: This only works when there is a single response message, any more response messages will be lost.
         */
        async await_response({ stream, id, timeout = 60000, step = 10 }) {
            let elapsed = 0;
            return new Promise((resolve, reject) => {
                const wait = () => {
                    if (stream.messages.has(id)) {
                        const data = stream.messages.get(id);
                        stream.messages.delete(id);
                        resolve(data);
                    }
                    else {
                        elapsed += step;
                        if (elapsed > timeout) {
                            reject(new Error('Operation timed out.'));
                        }
                        else {
                            setTimeout(wait, step);
                        }
                    }
                };
                wait();
            });
        }
        /**
         * Send a command and expect a single response.
         */
        async request({ stream, command, data, timeout = 60000 }) {
            const id = await this.send_helper({ stream, command, data });
            return await this.await_response({ stream, id, timeout });
        }
        /**
         * Send a response to a received command.
         */
        async respond({ stream, id, data, }) {
            await this.send_helper({ stream, id, data });
        }
        /** Clear all caches. */
        _clear_caches() {
            const now = Date.now();
            this.streams.forEach((client, id) => {
                if (client.connected) {
                    client.messages.forEach((msg, msg_id) => {
                        if (msg.timestamp && now >= msg.timestamp + (3600 * 1000)) {
                            client.messages.delete(msg_id);
                        }
                    });
                }
                else {
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
        async send_helper({ stream, command, id = Math.random().toString(36).substring(2, 32), data }) {
            stream.send(bson.serialize({
                command,
                id,
                data,
            }));
            return id;
        }
    }
    websocket.Server = Server;
    /*  @docs:
        @chapter: Sockets
        @experimental: true
        @title: Websocket Client
        @descr: The websocket client object.
        @param:
            @name: address
            @descr: The address of the server you want to connect to.
        @param:
            @name: api_key
            @descr: The api_key needed by the connection to start the handshake.
        @param:
            @name: reconnect
            @descr: Enable automatic reconnection. Define `false` to disable automatic reconnection, use `true` to enable automatic reconnection with the default options. Or define custom options.
            @type: boolean, object
            @attribute:
                @name: interval
                @descr: Interval for reconnect attempt
                @type: type
            @attribute:
                @name: max_interval
                @descr: The maximum interval for a reconnect attempt. The interval gradually backs off on consequent connection failures.
                @type: type
        @param:
            @name: ping
            @descr: Enable automatic pings to keep the connection alive. Can be either a boolean, or a milliseconds number as the auto ping interval. Default interval is `30000`.
            @type: boolen, number
    */
    class Client {
        url;
        api_key;
        reconnect;
        auto_ping;
        commands;
        events;
        messages;
        stream;
        connected = false;
        try_reconnect = true;
        auto_ping_timeout;
        constructor({ url = "wss://localhost:8080", api_key = null, reconnect = {
            interval: 10,
            max_interval: 30000,
        }, ping = true, }) {
            this.url = url;
            this.api_key = api_key;
            // Set reconnect
            if (reconnect === false) {
                this.reconnect = false;
            }
            else {
                this.reconnect = reconnect;
                if (typeof this.reconnect !== "object") {
                    this.reconnect = {};
                }
                this.reconnect.interval ??= 10,
                    this.reconnect.max_interval ??= 30000,
                    this.reconnect.attempts ??= 0;
            }
            // Set auto ping
            if (ping === true) {
                this.auto_ping = 30000;
            }
            else if (typeof ping === "number") {
                this.auto_ping = ping;
            }
            else {
                this.auto_ping = false;
            }
            // Initialize maps
            this.commands = new Map();
            this.events = new Map();
            this.messages = new Map();
        }
        /*  @docs:
         *  @title: Connect
         *  @descr: Connect the websocket
         */
        async connect() {
            return new Promise((resolve) => {
                this.try_reconnect = true;
                // Create stream
                this.stream = new WebSocket(this.api_key ? `${this.url}?api_key=${this.api_key}` : this.url);
                // On open
                this.stream.on('open', () => {
                    this.connected = true;
                    if (this.try_reconnect && this.reconnect !== false) {
                        this.reconnect.attempts = 0;
                    }
                    if (this.events.has("open")) {
                        this.events.get("open")();
                    }
                    resolve();
                });
                // On message
                this.stream.on('message', (message) => {
                    try {
                        let parsed = bson.deserialize(message);
                        if (parsed.command != null && this.commands.has(parsed.command)) {
                            this.commands.get(parsed.command)(parsed.id, parsed.data);
                        }
                        else if (parsed.id) {
                            if (parsed.timestamp == null) {
                                parsed.timestamp = Date.now();
                            }
                            this.messages.set(parsed.id, parsed);
                        }
                    }
                    catch (error) {
                        if (message.toString() === "pong") {
                            return;
                        }
                    }
                });
                // On close
                this.stream.on('close', (code, reason) => {
                    this.connected = false;
                    if (this.try_reconnect && this.reconnect !== false) {
                        if (this.events.has("reconnect")) {
                            this.events.get("reconnect")(code, reason);
                        }
                        const timeout = Math.min(this.reconnect.interval * Math.pow(2, this.reconnect.attempts), this.reconnect.max_interval);
                        this.reconnect.attempts++;
                        setTimeout(() => this.connect(), timeout);
                    }
                    else if (this.events.has("close")) {
                        this.events.get("close")(code, reason);
                    }
                });
                // On error
                this.stream.on('error', (error) => {
                    this.stream?.close();
                    if (this.events.has("error")) {
                        this.events.get("error")(error);
                    }
                });
                // Auto ping
                if (this.auto_ping !== false) {
                    clearTimeout(this.auto_ping_timeout);
                    const auto_ping = () => {
                        if (this.connected && this.stream) {
                            this.stream.send("ping");
                            this.auto_ping_timeout = setTimeout(auto_ping, typeof this.auto_ping === "number" ? this.auto_ping : 30000);
                        }
                    };
                    this.auto_ping_timeout = setTimeout(auto_ping, typeof this.auto_ping === "number" ? this.auto_ping : 30000);
                }
            });
        }
        /*  @docs:
         *  @title: Disconnect
         *  @descr:
         *      Disconnect from the server.
         *      Automatically calls `close()`.
         */
        disconnect() {
            this.try_reconnect = false;
            this.stream?.close();
            if (this.auto_ping_timeout) {
                clearTimeout(this.auto_ping_timeout);
            }
        }
        /*  @docs:
         *  @title: Event callback
         *  @descr:
         *      Set an event callback.
         *      The following callbacks can be set:
         *      - open: (stream) => {}
         *      - error: (stream, error) => {}
         *      - reconnect: (stream, code, reason) => {}
         *      - close: (stream, code, reason) => {}
         */
        on_event(event, callback) {
            this.events.set(event, callback);
        }
        /*  @docs:
         *  @title: Command callback
         *  @descr:
         *      Set a command callback.
         *      Will be called when an incoming message has the specified command type.
         *      The function can take the following arguments: `(stream, id, data) => {}`.
         */
        on(command, callback) {
            this.commands.set(command, callback);
        }
        /*  @docs:
         *  @title: Send raw
         *  @descr: Send raw data through the websocket.
         */
        async send_raw(data) {
            await this.await_till_connected();
            this.stream?.send(data);
        }
        /** Await till the stream is connected. */
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
                            reject(new Error("Timeout."));
                        }
                        else {
                            setTimeout(is_connected, step);
                        }
                    }
                };
                is_connected();
            });
        }
        /*  @docs:
         *  @title: Await response
         *  @descr: Wait for a message to be filled out.
         *  @note: This only works when there is a single response message, any more response messages will be lost.
         */
        async await_response({ id, timeout = 60000, step = 10 }) {
            let elapsed = 0;
            return new Promise((resolve, reject) => {
                const wait = () => {
                    if (this.messages.has(id)) {
                        const data = this.messages.get(id);
                        this.messages.delete(id);
                        resolve(data);
                    }
                    else {
                        elapsed += step;
                        if (elapsed > timeout) {
                            reject(new Error("Operation timed out."));
                        }
                        else {
                            setTimeout(wait, step);
                        }
                    }
                };
                wait();
            });
        }
        /**
         * Send a command and expect a single response.
         */
        async request({ command, data, timeout = 60000 }) {
            const id = await this.send_helper({ command, data });
            return await this.await_response({ id, timeout });
        }
        /**
         * Send a response to a received command.
         */
        async respond({ id, data, }) {
            await this.send_helper({ id, data });
        }
        /**
         * Send data through the websocket.
         * Either a request command when `command` is defined,
         * or a response when `command` is undefined and `id` is defined.
         * Note that `id` should always be defined in a sent response,
         * but it can be auto generated when sending a request command.
         */
        async send_helper({ command, id = Math.random().toString(36).substring(2, 32), data }) {
            await this.await_till_connected();
            this.stream?.send(bson.serialize({
                command,
                id,
                data
            }));
            return id;
        }
    }
    websocket.Client = Client;
})(websocket || (websocket = {}));
//# sourceMappingURL=websocket.deprecated.js.map