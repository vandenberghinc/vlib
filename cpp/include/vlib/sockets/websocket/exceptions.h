#ifndef VLIB_WEBSOCKET_EXCEPTIONS_H
#define VLIB_WEBSOCKET_EXCEPTIONS_H
namespace vlib {
namespace websocket {

// Secure Websocket error.
struct WSSError; CREATE_EXCEPTION(WSSError, "WSSError");

}}
#endif
