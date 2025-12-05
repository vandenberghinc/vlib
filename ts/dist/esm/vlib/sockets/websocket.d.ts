/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import * as http from 'http';
import * as https from 'https';
import WebSocketLib from 'ws';
/**
 * The websocket utility
 * @experimental
 * @docs
 */
export declare namespace WebSocket {
    /**
     * A formatted websocket message.
     */
    export interface Message {
        command?: string;
        id?: string;
        data?: any;
        timestamp?: number;
    }
    export interface RateLimitConfig {
        limit: number;
        interval: number;
    }
    type Stream = WebSocketLib & {
        id: string;
        connected: boolean;
        messages: Map<string, Message>;
    };
    /**
     * Nested types for the {@link Server} class.
     */
    export namespace Server {
        /** Constructor options for the {@link Server} class. */
        interface Opts {
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
        type Event = "listen" | "open" | "close" | "error";
        /**
         * The server event callback.
         * - listen: (address) => {}
         * - open: (stream) => {}
         * - close: (stream, code, reason) => {}
         * - error: (stream, error) => {}
         * @docs
         */
        type EventCallback<E extends Event> = E extends "listen" ? (address: string) => void : E extends "open" ? (stream: Stream) => void : E extends "close" ? (stream: Stream, code: number, reason: string) => void : E extends "error" ? (stream: Stream, error: Error) => void : never;
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
        private port;
        private ip?;
        private https_config;
        private server;
        private api_keys;
        private rate_limit;
        private wss;
        private streams;
        private commands;
        private events;
        private rate_limit_cache;
        private _clear_caches_interval?;
        /**
         * Construct a new server instance.
         * @docs
         */
        constructor({ ip, port, https, rate_limit, api_keys, server, }: Server.Opts);
        /**
         * Start the server.
         * @docs
         */
        start(): void;
        /**
         * Stop the server.
         * @docs
         */
        stop(): Promise<void>;
        /**
         * Set an event callback.
         * @docs
         */
        on_event<E extends Server.Event>(event: E, callback: Server.EventCallback<E>): void;
        /**
         * Set a command callback.
         * Will be called when an incoming message has the specified command type.
         * The function can take the following arguments: `(stream, id, data) => {}`.
         *
         * @docs
         */
        on(command: string, callback: (stream: Stream, id: string, data: any) => void): void;
        /**
         * Wait for a message to be filled out.
         * @note This only works when there is a single response message, any more response messages will be lost.
         *
         * @docs
         */
        await_response({ stream, id, timeout, step }: {
            stream: Stream;
            id: string;
            timeout?: number;
            step?: number;
        }): Promise<Message>;
        /**
         * Send a command and expect a single response.
         * @docs
         */
        request({ stream, command, data, timeout }: {
            /** The stream. */
            stream: Stream;
            /** The command identifier. */
            command: string;
            /** The data to send. */
            data: any;
            /** The timeout in milliseconds. */
            timeout?: number;
        }): Promise<Message>;
        /**
         * Send a response to a received command.
         * @docs
         */
        respond({ stream, id, data, }: {
            /** The stream. */
            stream: Stream;
            /** The request id from the received command. */
            id: string;
            /** The data to sent. */
            data: any;
        }): Promise<void>;
        /** Clear all caches. */
        private _clear_caches;
        /**
         * Send data through the websocket.
         * Either a request command when `command` is defined,
         * or a response when `command` is undefined and `id` is defined.
         * Note that `id` should always be defined in a sent response,
         * but it can be auto generated when sending a request command.
         */
        private send_helper;
    }
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
        interface Opts {
            url?: string;
            api_key?: string | null;
            reconnect?: ReconnectConfig | boolean;
            ping?: boolean | number;
        }
        /**
         * The server event callback.
         * @docs
         */
        type Event = "open" | "error" | "reconnect" | "close";
        /**
         * The server event callback.
         * - open: (stream) => {}
         * - error: (stream, error) => {}
         * - reconnect: (stream, code, reason) => {}
         * - close: (stream, code, reason) => {}
         * @docs
         */
        type EventCallback<E extends Event> = E extends "open" ? (stream: Stream) => void : E extends "error" ? (stream: Stream, error: Error) => void : E extends "reconnect" ? (stream: Stream, code: number, reason: string) => void : E extends "close" ? (stream: Stream, code: number, reason: string) => void : never;
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
        private url;
        private api_key;
        private reconnect;
        private auto_ping;
        private commands;
        private events;
        private messages;
        private stream?;
        private connected;
        private try_reconnect;
        private auto_ping_timeout?;
        /**
         * Construct a new client instance.
         * @docs
         */
        constructor({ url, api_key, reconnect, ping, }: Client.Opts);
        /**
         * Connect the websocket
         * @docs
         */
        connect(): Promise<void>;
        /**
         * Disconnect from the server.
         * Automatically calls `close()`.
         * @docs
         */
        disconnect(): void;
        /**
         * Set an event callback.
         * @docs
         */
        on_event<E extends Client.Event>(event: E, callback: Client.EventCallback<E>): void;
        /**
         * Set a command callback.
         * Will be called when an incoming message has the specified command type.
         * The function can take the following arguments: `(stream, id, data) => {}`.
         * @docs
         */
        on(command: string, callback: (id: string, data: any) => void): void;
        /**
         * Send raw data through the websocket.
         * @docs
         */
        send_raw(data: string | Buffer): Promise<void>;
        /**
         * Await till the stream is connected.
         * @docs
         */
        await_till_connected(timeout?: number): Promise<void>;
        /**
         * Wait for a message to be filled out.
         * @note This only works when there is a single response message, any more response messages will be lost.
         * @docs
         */
        await_response({ id, timeout, step }: {
            id: string;
            timeout?: number;
            step?: number;
        }): Promise<Message>;
        /**
         * Send a command and expect a single response.
         * @docs
         */
        request({ command, data, timeout }: {
            command: string;
            data: any;
            timeout?: number;
        }): Promise<Message>;
        /**
         * Send a response to a received command.
         * @docs
         */
        respond({ id, data, }: {
            /** The request id from the received command. */
            id: string;
            /** The data to sent. */
            data: any;
        }): Promise<void>;
        /**
         * Send data through the websocket.
         * Either a request command when `command` is defined,
         * or a response when `command` is undefined and `id` is defined.
         * Note that `id` should always be defined in a sent response,
         * but it can be auto generated when sending a request command.
         */
        private send_helper;
    }
    export {};
}
export { WebSocket as websocket };
