/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
interface RequestOpts {
    host: string;
    port?: number | null;
    endpoint?: string;
    method?: string;
    headers?: Record<string, any>;
    params?: string | Record<string, any> | any[];
    compress?: boolean;
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
/**
 * Make a request
 * @param host The host name.
 * @param port The port.
 * @param endpoint The endpoint url.
 * @param method The request method.
 * @param headers The request headers.
 * @param params The params string, array or object. When the method is `GET` and `query` is `true` then only an `object` type is allowed for parameter `params`.
 * @param compress Compress the params.
 * @param query Automatically add the params as query string when the method is `GET`.
 * @param json Try to parse the response body to json.
 * @param reject_unauthorized Reject unauthorized tls certificates.
 * @param delay Wait a number of milliseconds after the request, can be useful for rate-limiting.
 * @param http2 Use http/2.
 *
 * @nav Sockets
 * @docs
 */
export declare function request({ host, port, endpoint, method, headers, params, compress, query, json, reject_unauthorized, delay, http2: use_http2, }: RequestOpts): Promise<RequestResponse>;
export {};
