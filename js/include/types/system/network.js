/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2023 Daan van den Bergh.
 */

// The network class.
/*  @docs:
    @chapter: System
    @title: Network
    @desc: The network class.
*/
vlib.network = class network {

    // Format.
    /*  @docs:
        @title: Private IP
        @desc: Retrieve the device's private ip.
        @return: 
            @type: string
            @desc: Returns the ip as string.
        @param: 
            @name: family
            @type: string
            @desc: The ip family, `ipv4` or `ipv6`.
    */
    static private_ip(family = "ipv4") {
        const interfaces = libos.networkInterfaces();
        for (const i in interfaces) {
            for (const ifc of interfaces[i]) {
                if (ifc.family.toLowerCase() === family && !ifc.internal) {
                    return ifc.address;
                }
            }
        }
        throw Error("Unable to retrieve the private ip.");
    }
}