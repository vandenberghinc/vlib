/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */

import * as os from 'os';

type IPFamily = 'ipv4' | 'ipv6';

/*  @docs:
    @chapter: System
    @title: Network
    @desc: The network class.
*/
export class Network {
    /*  @docs:
        @title: Private IP
        @desc: Retrieve the device's private ip
        @return: 
            @type: string
            @desc: Returns the ip as string
        @param: 
            @name: family
            @type: string
            @desc: The ip family, `ipv4` or `ipv6`
    */
    public static private_ip(family: IPFamily = "ipv4"): string {
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
