// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

// Header.
#ifndef VLIB_INCLUDE_VLIB_H
#define VLIB_INCLUDE_VLIB_H

// Not everything is included by "vlib.h" some sublibs should be included seperately.
// Mainly avoid sublibs that require new linked libraries or new include paths.
#include "types.h"
#include "cli.h"
#include "encoding.h"

// End header.
#endif
