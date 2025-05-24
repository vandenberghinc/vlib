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
        private _clear_caches_timeout?;
        constructor({ ip, port, https, rate_limit, api_keys, server, }: ServerOptions);
        start(): void;
        stop(): Promise<void>;
        on_event(event: string, callback: Function): void;
        on(command: string, callback: (stream: Stream, id: string, data: any) => void): void;
        send({ stream, command, id, data }: {
            stream: Stream;
            command: string;
            id?: string;
            data: any;
        }): Promise<string>;
        await_response({ stream, id, timeout, step }: {
            stream: Stream;
            id: string;
            timeout?: number;
            step?: number;
        }): Promise<WebSocketMessage>;
        request({ stream, command, data, timeout }: {
            stream: Stream;
            command: string;
            data: any;
            timeout?: number;
        }): Promise<WebSocketMessage>;
        private _clear_caches;
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
        send({ command, id, data }: {
            command: string;
            id?: string;
            data: any;
        }): Promise<string>;
        await_till_connected(timeout?: number): Promise<void>;
        await_response({ id, timeout, step }: {
            id: string;
            timeout?: number;
            step?: number;
        }): Promise<WebSocketMessage>;
        request({ command, data, timeout }: {
            command: string;
            data: any;
            timeout?: number;
        }): Promise<WebSocketMessage>;
    }
    export {};
}
export default websocket;
