/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
type IPFamily = 'ipv4' | 'ipv6';
export declare class Network {
    static private_ip(family?: IPFamily): string;
}
export { Network as network };
export default Network;
