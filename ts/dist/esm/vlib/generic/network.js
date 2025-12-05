/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import * as os from 'os';
/**
 * The network class.
 * @nav System
 * @docs
*/
export class Network {
    /**
     * Retrieve the device's private ip
     * @returns Returns the ip as string
     * @param family The ip family, `ipv4` or `ipv6`
     */
    static private_ip(family = "ipv4") {
        const interfaces = os.networkInterfaces();
        for (const i in interfaces) {
            for (const ifc of interfaces[i] || []) {
                if (ifc.family.toLowerCase() === family && !ifc.internal) {
                    return ifc.address;
                }
            }
        }
        throw Error("Unable to retrieve the private ip.");
    }
}
export { Network as network }; // also export as lowercase for compatibility.
//# sourceMappingURL=network.js.map