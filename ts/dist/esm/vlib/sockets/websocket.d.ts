/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2026 Daan van den Bergh. All rights reserved.
 */
import * as http from 'http';
import * as https from 'https';
import WebSocketLib from 'ws';
/**
 * The websocket utility.
 * @experimental
 * @nav Sockets
 * @docs
 */
export declare namespace WebSocket {
    /**
     * A formatted websocket message.
     *
     * @docs
     */
    interface Message<D = unknown> {
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
    type CommandsMeta = Record<string, {
        /** The request data type for this command. */
        request: unknown;
        /** The response data type for this command. */
        response: unknown;
    }>;
    /**
     * Rate limiting configuration for the WebSocket server upgrade requests.
     *
     * @docs
     */
    interface RateLimitConfig {
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
    type Stream = WebSocketLib & {
        /** The unique identifier for this stream connection. */
        id: string;
        /** Whether the stream is currently connected. */
        connected: boolean;
        /** A map of pending response messages keyed by their message id. */
        messages: Map<string, Message>;
    };
    /**
     * Nested types for the {@link Server} class.
     */
    namespace Server {
        /**
         * Internal callback type used for storing command handlers at runtime.
         * The typed signatures from `on()` are widened to this type for storage in the commands map.
         */
        type InternalCommandCallback = (stream: Stream, id: string, data: unknown, respond: (data: unknown) => void) => void;
        /**
         * Constructor options for the {@link Server} class.
         * @docs
         */
        interface Opts {
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
        type Event = "listen" | "open" | "close" | "error";
        /**
         * The server event callback type.
         * - listen: `(address) => {}`
         * - open: `(stream) => {}`
         * - close: `(stream, code, reason) => {}`
         * - error: `(stream | null, error) => {}` — stream is `null` for server-level errors.
         * @docs
         */
        type EventCallback<E extends Event> = E extends "listen" ? (address: string) => void : E extends "open" ? (stream: Stream) => void : E extends "close" ? (stream: Stream, code: number, reason: string) => void : E extends "error" ? (stream: Stream | null, error: Error) => void : never;
    }
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
    class Server<C extends CommandsMeta> {
        /** The server listen port. */
        private port;
        /** The optional server listen ip address. */
        private ip?;
        /** The https configuration for the server, or `null` for http. */
        private https_config;
        /** Whether the underlying server uses https. */
        private is_https;
        /** Whether the server has been started. */
        private started;
        /** The underlying http or https server instance. */
        private server;
        /** The list of allowed client API keys. */
        private api_keys;
        /** The rate limit configuration, or `false` when rate limiting is disabled. */
        private rate_limit;
        /** The underlying WebSocket server instance. */
        private wss;
        /** A map of active stream connections keyed by their unique id. */
        private streams;
        /** A map of registered command callbacks keyed by the command name. */
        private commands;
        /** The typed event handler for server events. */
        private events;
        /** A map of pending response resolvers keyed by message id, for instant response resolution. */
        private pending_resolvers;
        /** A cache of rate limit entries keyed by client ip address. */
        private rate_limit_cache;
        /** The interval timer for periodic cache cleanup. */
        private _clear_caches_interval?;
        /**
         * Construct a new server instance.
         * @param opts The server constructor options.
         *
         * @docs
         */
        constructor({ ip, port, https, rate_limit, api_keys, server, }: Server.Opts);
        /**
         * Start the server and begin accepting connections.
         *
         * @docs
         */
        start(): void;
        /**
         * Stop the server and close all active connections.
         * @returns A promise that resolves when the server has fully stopped.
         *
         * @docs
         */
        stop(): Promise<void>;
        /**
         * Set an event callback.
         * @param event The event type to listen for.
         * @param callback The callback to invoke when the event fires.
         *
         * @docs
         */
        on_event<E extends Server.Event>(event: E, callback: Server.EventCallback<E>): void;
        /**
         * Set a command callback.
         * Will be called when an incoming message has the specified command type.
         * @param command The command identifier to listen for.
         * @param callback The callback invoked with `(stream, id, data, respond)` when the command is received.
         *
         * @docs
         */
        on<K extends keyof C & string>(command: K, callback: (
        /** The stream the command was received on. */
        stream: Stream, 
        /** The unique message id for request-response correlation. */
        id: string, 
        /** The typed request data. */
        data: C[K]['request'], 
        /** Send a typed response back to the sender. */
        respond: (data: C[K]['response']) => void) => void): void;
        /**
         * Wait for a response message matching the specified id.
         * Uses an instant resolver pattern instead of polling for optimal performance at scale.
         * @param opts The await response options.
         * @returns The matching response message.
         * @note This only works when there is a single response message, any more response messages will be lost.
         *
         * @docs
         */
        await_response({ stream, id, timeout, }: {
            /** The stream to wait for a response on. */
            stream: Stream;
            /** The message id to wait for. */
            id: string;
            /** The timeout in milliseconds. */
            timeout?: number;
        }): Promise<Message>;
        /**
         * Send a command and expect a single response.
         * @param opts The request options.
         * @returns The typed response message.
         *
         * @docs
         */
        request<K extends keyof C & string>({ stream, command, data, timeout }: {
            /** The stream to send the command on. */
            stream: Stream;
            /** The command identifier. */
            command: K;
            /** The typed request data. */
            data: C[K]['request'];
            /** The timeout in milliseconds. */
            timeout?: number;
        }): Promise<Message<C[K]['response']>>;
        /**
         * Send a response to a received command.
         * @param opts The response options.
         *
         * @docs
         */
        respond({ stream, id, data, }: {
            /** The stream to send the response on. */
            stream: Stream;
            /** The request id from the received command. */
            id: string;
            /** The response data, constrained to the union of all command response types. */
            data: C[keyof C]['response'];
        }): void;
        /**
         * Clear expired rate limit entries, remove disconnected streams,
         * and purge messages older than 1 hour from connected streams.
         */
        private _clear_caches;
        /**
         * Send data through the websocket.
         * Sends a request command when `command` is defined,
         * or a response when `command` is undefined and `id` is defined.
         * @param opts The send options.
         * @returns The message id used for the sent message.
         */
        private send_helper;
    }
    /**
     * Reconnection configuration for the WebSocket client.
     *
     * @docs
     */
    interface ReconnectConfig {
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
    namespace Client {
        /**
         * Internal callback type used for storing command handlers at runtime.
         * The typed signatures from `on()` are widened to this type for storage in the commands map.
         */
        type InternalCommandCallback = (id: string, data: unknown, respond: (data: unknown) => void) => void;
        /**
         * Constructor options for the {@link Client} class.
         * @docs
         */
        interface Opts {
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
        type Event = "open" | "error" | "reconnect" | "close";
        /**
         * The client event callback type.
         * - open: `() => {}`
         * - error: `(error) => {}`
         * - reconnect: `(code, reason) => {}`
         * - close: `(code, reason) => {}`
         * @docs
         */
        type EventCallback<E extends Event> = E extends "open" ? () => void : E extends "error" ? (error: Error) => void : E extends "reconnect" ? (code: number, reason: string) => void : E extends "close" ? (code: number, reason: string) => void : never;
    }
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
    class Client<C extends CommandsMeta> {
        /** The websocket server URL. */
        private url;
        /** The API key for authentication, or `null` when no authentication is required. */
        private api_key;
        /** The reconnection configuration, or `false` when auto-reconnect is disabled. */
        private reconnect;
        /** The auto-ping interval in milliseconds, or `false` when auto-ping is disabled. */
        private auto_ping;
        /** A map of registered command callbacks keyed by the command name. */
        private commands;
        /** The typed event handler for client events. */
        private events;
        /** A map of pending response messages keyed by their message id. */
        private messages;
        /** A map of pending response resolvers keyed by message id, for instant response resolution. */
        private pending_resolvers;
        /** The current underlying WebSocket stream. */
        private stream?;
        /** Whether the client is currently connected to the server. */
        private connected;
        /** Whether to attempt reconnection on connection close. */
        private try_reconnect;
        /** The timer for the next auto-ping. */
        private auto_ping_timeout?;
        /** The timer for the next reconnection attempt. */
        private reconnect_timer?;
        /**
         * Construct a new client instance.
         * @param opts The client constructor options.
         *
         * @docs
         */
        constructor({ url, api_key, reconnect, ping, }: Client.Opts);
        /**
         * Connect the websocket to the server.
         * @returns A promise that resolves when the connection is established, or rejects on error.
         *
         * @docs
         */
        connect(): Promise<void>;
        /**
         * Disconnect from the server.
         * Disables auto-reconnect, closes the underlying stream, and cleans up pending state.
         *
         * @docs
         */
        disconnect(): void;
        /**
         * Set an event callback.
         * @param event The event type to listen for.
         * @param callback The callback to invoke when the event fires.
         *
         * @docs
         */
        on_event<E extends Client.Event>(event: E, callback: Client.EventCallback<E>): void;
        /**
         * Set a command callback.
         * Will be called when an incoming message has the specified command type.
         * @param command The command identifier to listen for.
         * @param callback The callback invoked with `(id, data, respond)` when the command is received.
         *
         * @docs
         */
        on<K extends keyof C & string>(command: K, callback: (
        /** The unique message id for request-response correlation. */
        id: string, 
        /** The typed request data. */
        data: C[K]['request'], 
        /** Send a typed response back to the sender. */
        respond: (data: C[K]['response']) => void) => void): void;
        /**
         * Send raw data through the websocket.
         * @param data The raw string or buffer data to send.
         *
         * @docs
         */
        send_raw(data: string | Buffer): Promise<void>;
        /**
         * Await until the stream is connected.
         * @param timeout The timeout in milliseconds before rejecting.
         * @returns A promise that resolves when the connection is established.
         *
         * @docs
         */
        await_till_connected(timeout?: number): Promise<void>;
        /**
         * Wait for a response message matching the specified id.
         * Uses an instant resolver pattern instead of polling for optimal performance at scale.
         * @param opts The await response options.
         * @returns The matching response message.
         * @note This only works when there is a single response message, any more response messages will be lost.
         *
         * @docs
         */
        await_response({ id, timeout, }: {
            /** The message id to wait for. */
            id: string;
            /** The timeout in milliseconds. */
            timeout?: number;
        }): Promise<Message>;
        /**
         * Send a command and expect a single response.
         * @param opts The request options.
         * @returns The typed response message.
         *
         * @docs
         */
        request<K extends keyof C & string>({ command, data, timeout }: {
            /** The command identifier. */
            command: K;
            /** The typed request data. */
            data: C[K]['request'];
            /** The timeout in milliseconds. */
            timeout?: number;
        }): Promise<Message<C[K]['response']>>;
        /**
         * Send a response to a received command.
         * @param opts The response options.
         *
         * @docs
         */
        respond({ id, data, }: {
            /** The request id from the received command. */
            id: string;
            /** The response data, constrained to the union of all command response types. */
            data: C[keyof C]['response'];
        }): Promise<void>;
        /**
         * Send data through the websocket.
         * Sends a request command when `command` is defined,
         * or a response when `command` is undefined and `id` is defined.
         * @param opts The send options.
         * @returns The message id used for the sent message.
         */
        private send_helper;
    }
}
export { WebSocket as websocket };
