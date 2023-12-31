// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

// Default socket timeout.
#ifndef VLIB_SOCK_TIMEOUT
#define VLIB_SOCK_TIMEOUT 900000 // 15 minutes in milliseconds.
#endif

// Includes.
#include <sys/types.h>
#include <sys/socket.h>
#include <arpa/inet.h>
#include <netinet/in.h>
#include <netinet/tcp.h>
#include <netdb.h>
#include <fcntl.h>
#include <poll.h>

// Includes.
#include "../types.h"
#include "../compression.h"
#include "../crypto.h" // for smtp.
#include "global/global.h"
#include "global/blacklist.h"

// Include http request and response.
#include "http/content_type.h"
#include "http/headers.h"
#include "http/method.h"
#include "http/status.h"
#include "http/version.h"
#include "http/parser.h"
#include "http/response.h"
#include "http/request.h"

// Include sockets.
#include "socket/_include.h"
