// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

// header.
#ifndef VLIB_SOCKETS_BLACKLIST_H
#define VLIB_SOCKETS_BLACKLIST_H

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <netinet/in.h>
#include <sys/socket.h>
#include <unistd.h>
#include <netdb.h>
#include <arpa/inet.h>
#include <arpa/nameser.h>

// Record types for apple.
#ifdef __APPLE__
#define T_A 1
#define T_AAAA 28
#define T_TXT 16
#endif

// Namespace vlib.
namespace vlib {

// Check dns blacklist.
// Returns an ip on successfull dns query or an undefined string when no record exists.
// When multiple lists are specified the first record found is returned unless ...
//   the record is present in param 'except'.
String  dns_blacklist(
    const String& ip,
    const Array<String>& domains,
    const Array<String>& except = {}
) {
    
    // Vars.
    String resolved, reversed;
    
    // Create full domain.
    auto splitted = ip.split(".");
    for (auto& i: splitted.iterate<Backwards>()) {
        reversed << i << '.';
    }
    
    // Iterate domains.
    // float index = 0;
    for (auto& domain: domains) {
        // llong timestamp = Date::get_mseconds();
        
        // Addrinfo.
        struct addrinfo hints = {}, *result;
        hints.ai_family = AF_UNSPEC;  // Allow both IPv4 and IPv6
        hints.ai_socktype = SOCK_STREAM;
        
        // Query records
        String full_domain = to_str(reversed, domain);
        int res = getaddrinfo(full_domain.c_str(), NULL, &hints, &result);
        if (res == 0) {
            
            // Potentially blocked.
            if (result == NULL) {
                throw RateLimitExceeded("IP address is potentially temporarily blocked");
            }
            
            // Iterate.
            for (struct addrinfo* addr = result; addr != NULL; addr = addr->ai_next) {
                
                // A record.
                if (addr->ai_family == AF_INET /*&& query_type == T_A*/) {
                    struct sockaddr_in* ipv4_addr = (struct sockaddr_in*)addr->ai_addr;
                    resolved.resize(INET_ADDRSTRLEN);
                    resolved.len() = INET_ADDRSTRLEN;
                    inet_ntop(AF_INET, &(ipv4_addr->sin_addr), resolved.data(), INET_ADDRSTRLEN);
                    break;
                    
                    // AAAA record.
                } else if (addr->ai_family == AF_INET6 /*&& query_type == T_AAAA*/) {
                    struct sockaddr_in6* ipv6_addr = (struct sockaddr_in6*)addr->ai_addr;
                    resolved.resize(INET6_ADDRSTRLEN);
                    resolved.len() = INET6_ADDRSTRLEN;
                    inet_ntop(AF_INET6, &(ipv6_addr->sin6_addr), resolved.data(), INET6_ADDRSTRLEN);
                    break;
                    
                    // TXT record.
                } else if (addr->ai_family == AF_UNSPEC /*&& query_type == T_TXT*/) {
                    resolved.resize(512);
                    resolved.len() = addr->ai_addrlen;
                    if (addr->ai_addrlen < 512) {
                        memcpy(resolved.data(), addr->ai_addr, addr->ai_addrlen);
                    }
                    break;
                }
                
            }
            
            // Free.
            freeaddrinfo(result);
            
            // Handler.
            if (resolved.is_defined() && (except.len() == 0 || !except.contains(resolved))) {
                // Log.
                // ++index;
                // print(index / domains.len() * 100, "% (", domain, ": ", Date::get_mseconds() - timestamp, "ms)");
                return resolved;
            }
        }
        
        // Log.
        // ++index;
        // print(index / domains.len() * 100, "% (", domain, ": ", Date::get_mseconds() - timestamp, "ms)");
    }

    // Handler.
    return {};
    
}
String  dns_blacklist(const String& ip) {
    static const Array<String> list = {
        "0spam-killlist.fusionzero.com",
        "0spam.fusionzero.com",
        "access.redhawk.org",
        "all.rbl.jp",
        "all.spam-rbl.fr",
        "all.spamrats.com",
        // "aspews.ext.sorbs.net", // slow.
        "b.barracudacentral.org",
        "backscatter.spameatingmonkey.net",
        "badnets.spameatingmonkey.net",
        "bb.barracudacentral.org",
        "bl.drmx.org",
        "bl.konstant.no",
        // "bl.spamcannibal.org", // very slow.
        "bl.spameatingmonkey.net",
        "bl.spamstinks.com",
        "black.junkemailfilter.com",
        "blackholes.five-ten-sg.com",
        "blacklist.sci.kun.nl",
        "blacklist.woody.ch",
        "bogons.cymru.com",
        "bsb.empty.us",
        "bsb.spamlookup.net",
        "cart00ney.surriel.com",
        "cbl.abuseat.org",
        // "cbl.anti-spam.org.cn", // very slow.
        // "cblless.anti-spam.org.cn", // very slow.
        // "cblplus.anti-spam.org.cn", // very slow.
        // "cdl.anti-spam.org.cn", // very slow.
        // "cidr.bl.mcafee.com", // very slow.
        "combined.rbl.msrbl.net",
        "db.wpbl.info",
        "dev.null.dk",
        "dialups.visi.com",
        "dnsbl-0.uceprotect.net",
        "dnsbl-1.uceprotect.net",
        "dnsbl-2.uceprotect.net",
        "dnsbl-3.uceprotect.net",
        // "dnsbl.anticaptcha.net", // slow.
        // "dnsbl.aspnet.hu", // slow.
        "dnsbl.inps.de",
        // "dnsbl.justspam.org", // slow.
        "dnsbl.kempt.net",
        "dnsbl.madavi.de",
        // "dnsbl.rizon.net", // slow.
        "dnsbl.rv-soft.info",
        "dnsbl.rymsho.ru",
        // "dnsbl.sorbs.net", // slow.
        "dnsbl.zapbl.net",
        "dnsrbl.swinog.ch",
        // "dul.pacifier.net", // slow.
        "dyna.spamrats.com",
        "fnrbl.fast.net",
        // "fresh.spameatingmonkey.net", // slow.
        "hostkarma.junkemailfilter.com",
        "images.rbl.msrbl.net",
        "ips.backscatterer.org",
        "ix.dnsbl.manitu.net",
        "korea.services.net",
        // "l2.bbfh.ext.sorbs.net", // very slow.
        // "l3.bbfh.ext.sorbs.net", // very slow.
        // "l4.bbfh.ext.sorbs.net", // very slow.
        // "list.bbfh.org", // very slow.
        "list.blogspambl.com",
        "mail-abuse.blacklist.jippg.org",
        "netbl.spameatingmonkey.net",
        "netscan.rbl.blockedservers.com",
        "no-more-funn.moensted.dk",
        "noptr.spamrats.com",
        "orvedb.aupads.org",
        "pbl.spamhaus.org",
        "phishing.rbl.msrbl.net",
        "pofon.foobar.hu",
        "psbl.surriel.com",
        "rbl.abuse.ro",
        "rbl.blockedservers.com",
        "rbl.dns-servicios.com",
        "rbl.efnet.org",
        "rbl.efnetrbl.org",
        "rbl.iprange.net",
        "rbl.schulte.org",
        "rbl.talkactive.net",
        "rbl2.triumf.ca",
        "rsbl.aupads.org",
        "sbl-xbl.spamhaus.org",
        "sbl.spamhaus.org",
        "short.rbl.jp",
        "spam.dnsbl.anonmails.de",
        "spam.pedantic.org",
        "spam.rbl.blockedservers.com",
        "spam.rbl.msrbl.net",
        "spam.spamrats.com",
        "spamrbl.imp.ch",
        "spamsources.fabel.dk",
        "st.technovision.dk",
        "tor.dan.me.uk",
        "tor.dnsbl.sectoor.de",
        "tor.efnet.org",
        "torexit.dan.me.uk",
        "truncate.gbudb.net",
        "ubl.unsubscore.com",
        "uribl.spameatingmonkey.net",
        "urired.spameatingmonkey.net",
        "virbl.dnsbl.bit.nl",
        "virus.rbl.jp",
        "virus.rbl.msrbl.net",
        "vote.drbl.caravan.ru",
        "vote.drbl.gremlin.ru",
        "web.rbl.msrbl.net",
        "work.drbl.caravan.ru",
        // "work.drbl.gremlin.ru", // slow.
        "wormrbl.imp.ch",
        "xbl.spamhaus.org",
        "zen.spamhaus.org",
        // "dbl.spamhaus.org", // only for domains.
        "multi.surbl.org",
        // "web.dnsbl.sorbs.net", // slow.
        "bl.spamcop.net",
        "ivmURI:dnsbl",
        "ivmSIP:dnsbl",
        // "dnsbl.njabl.org", // very slow.
        // "combined.njabl.org", // very slow.
        // "dul.dnsbl.sorbs.net", // slow.
        // "spam.dnsbl.sorbs.net", // slow.
        // "zombiednsbl.sorbs.net", // very slow.
        "dnsbl.dronebl.org",
        "dnsbl.abuse.ch",
        // "dnsrbl.org", // incorrect.
        // "dnsbl.spfbl.net", // incorrect.
        "dnsbl.cyberlogic.net",
        "bl.mailspike.net",
        // "rhsbl.sorbs.net", // slow.
        // "dnsbl.proxybl.org", // very slow.
        "dnsbl.tornevall.org",
        "relays.bl.gweep.ca",
        "list.dsbl.org",
        // "l2.apews.org", // very slow.
        "rbl.interserver.net"
    };
    return dns_blacklist(ip, list);
}

}; 		// End namespace vlib.
#endif 	// End header.
