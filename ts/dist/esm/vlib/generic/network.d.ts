/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
type IPFamily = 'ipv4' | 'ipv6';
/**
 * The network class.
 * @nav System
 * @docs
*/
export declare class Network {
    /**
     * Retrieve the device's private ip
     * @returns Returns the ip as string
     * @param family The ip family, `ipv4` or `ipv6`
     */
    static private_ip(family?: IPFamily): string;
}
export { Network as network };
