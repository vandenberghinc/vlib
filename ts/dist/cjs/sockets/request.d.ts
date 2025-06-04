/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
interface RequestOptions {
    host: string;
    port?: number | null;
    endpoint?: string;
    method?: string;
    headers?: Record<string, any>;
    params?: string | Record<string, any> | any[];
    compress?: boolean;
    decompress?: boolean;
    query?: boolean;
    json?: boolean;
    reject_unauthorized?: boolean;
    delay?: number | null;
    http2?: boolean;
}
interface RequestResponse {
    body: any;
    error: Error | null;
    status: number | null;
    headers: Record<string, any>;
    json: () => any;
}
export declare function request({ host, port, endpoint, method, headers, params, compress, decompress, query, json, reject_unauthorized, delay, http2: use_http2, }: RequestOptions): Promise<RequestResponse>;
export {};
