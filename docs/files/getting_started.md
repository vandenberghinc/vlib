# Getting started
Getting started with the library `vlib`.

## Including the library.
Vlib has multiple include files, one for each sub library. Including any other header files directly may lead to undefined behaviour. The following include files are available.
```cpp

// Header "vlib.h" includes sub libraries "types.h", "cli.h" and "encoding.h".
#include <vlib/vlib.h>

// Compression.
#include <vlib/compression.h>

// Cryptography.
#include <vlib/crypto.h>

// Sockets.
#include <vlib/sockets.h>

```

## Using shortcuts.
The following shortcuts are defined specifically for `using namespace`. 
```cpp
using namespace vlib::types::shortcuts;
using namespace vlib::exceptions::shortcuts;
using namespace vlib::http::shortcuts;
```

## A simple hello world program.
Create a simple hello world program with vlib.
```cpp
#include <vlib/vlib.h>
using namespace vlib::types::shortcuts;
int main() {
	print("Hello World!");
}
```
