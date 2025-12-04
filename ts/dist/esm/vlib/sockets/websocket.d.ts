/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import * as http from 'http';
import * as https from 'https';
import WebSocket from 'ws';
export declare namespace websocket {
    export interface WebSocketMessage {
        command?: string;
        id?: string;
        data?: any;
        timestamp?: number;
    }
    export interface RateLimitConfig {
        limit: number;
        interval: number;
    }
    type Stream = WebSocket & {
        id: string;
        connected: boolean;
        messages: Map<string, WebSocketMessage>;
    };
    export interface ServerOptions {
        ip?: string | null;
        port?: number;
        https?: https.ServerOptions | null;
        rate_limit?: RateLimitConfig | false;
        api_keys?: string[];
        server?: http.Server | https.Server | null;
    }
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
        constructor({ ip, port, https, rate_limit, api_keys, server, }: ServerOptions);
        start(): void;
        stop(): Promise<void>;
        on_event(event: string, callback: Function): void;
        on(command: string, callback: (stream: Stream, id: string, data: any) => void): void;
        await_response({ stream, id, timeout, step }: {
            stream: Stream;
            id: string;
            timeout?: number;
            step?: number;
        }): Promise<WebSocketMessage>;
        /**
         * Send a command and expect a single response.
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
        }): Promise<WebSocketMessage>;
        /**
         * Send a response to a received command.
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
        constructor({ url, api_key, reconnect, ping, }: {
            url?: string;
            api_key?: string | null;
            reconnect?: ReconnectConfig | boolean;
            ping?: boolean | number;
        });
        connect(): Promise<void>;
        disconnect(): void;
        on_event(event: string, callback: Function): void;
        on(command: string, callback: (id: string, data: any) => void): void;
        send_raw(data: string | Buffer): Promise<void>;
        /** Await till the stream is connected. */
        await_till_connected(timeout?: number): Promise<void>;
        await_response({ id, timeout, step }: {
            id: string;
            timeout?: number;
            step?: number;
        }): Promise<WebSocketMessage>;
        /**
         * Send a command and expect a single response.
         */
        request({ command, data, timeout }: {
            command: string;
            data: any;
            timeout?: number;
        }): Promise<WebSocketMessage>;
        /**
         * Send a response to a received command.
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
