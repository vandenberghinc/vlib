#ifndef VLIB_WEBSOCKET_PARSER_H
#define VLIB_WEBSOCKET_PARSER_H

namespace vlib {
namespace websocket {


// Websocket parser.
// sources: https://github.com/php-ion/websocket-parser/
struct Parser {
    
    // ---------------------------------------------------------
    // Enums.
    
    enum websocket_flags {
        
        OP_CONTINUE = 0x0,
        OP_TEXT     = 0x1,
        OP_BINARY   = 0x2,
        OP_CLOSE    = 0x8,
        OP_PING     = 0x9,
        OP_PONG     = 0xA,
        OP_MASK     = 0xF,
        
        FINAL_FRAME = 0x10,
        HAS_MASK    = 0x20,
        
    };
    
    enum state {
        s_start = 0,
        s_head = 1,
        s_length = 2,
        s_mask = 3,
        s_body = 4,
    };
    
    // ---------------------------------------------------------
    // Attributes.
    
    uint                state = 0;
    
    char                mask[4];
    uint                mask_offset;
    
    ullong              length = 0;
    ullong              require = 0;
    ullong              offset = 0;
    
    websocket_flags     flags;
    
    // ---------------------------------------------------------
    // Functions.
    
    // Get frame lenght.
    // ullong frame_len(flags flags, ullong data_len) {
    //     ullong size = data_len + 2; // body + 2 bytes of head
    //     if (data_len >= 126) {
    //         if (data_len > 0xFFFF) {
    //             size += 8;
    //         } else {
    //             size += 2;
    //         }
    //     }
    //     if (flags & HAS_MASK) {
    //         size += 4;
    //     }
    //     return size;
    // };
    
    // Mask data.
    SICE
    void mask_data(char * dst, const char * src, ullong len, const char mask[4], const uint8_t mask_offset) {
        ullong i = 0;
        for(; i < len; i++) {
            dst[i] = src[i] ^ mask[(i + mask_offset) % 4];
        }
        // return (uint8_t) ((i + mask_offset) % 4);
    }
    
    // Create frame.
    SICE
    String create_frame(websocket_flags flags, const char mask[4], const char * data, ullong data_len) {
        String frame;
        frame.resize(14 + data_len);
        
        // Header.
        frame[0] = 0;
        frame[1] = 0;
        if (flags & FINAL_FRAME) {
            frame[0] = (char) (1 << 7);
        }
        frame[0] |= flags & OP_MASK;
        if (flags & HAS_MASK) {
            frame[1] = (char) (1 << 7);
        }
        
        // Payload length.
        ullong body_offset = 0;
        if (data_len < 126) {
            frame[1] |= data_len;
            body_offset = 2;
        } else if (data_len <= 0xFFFF) {
            frame[1] |= 126;
            frame[2] = (char) (data_len >> 8);
            frame[3] = (char) (data_len & 0xFF);
            body_offset = 4;
        } else {
            frame[1] |= 127;
            frame[2] = (char) ((data_len >> 56) & 0xFF);
            frame[3] = (char) ((data_len >> 48) & 0xFF);
            frame[4] = (char) ((data_len >> 40) & 0xFF);
            frame[5] = (char) ((data_len >> 32) & 0xFF);
            frame[6] = (char) ((data_len >> 24) & 0xFF);
            frame[7] = (char) ((data_len >> 16) & 0xFF);
            frame[8] = (char) ((data_len >>  8) & 0xFF);
            frame[9] = (char) ((data_len)       & 0xFF);
            body_offset = 10;
        }
        
        // Mask.
        if (flags & HAS_MASK) {
            if (mask != NULL) {
                memcpy(&frame[body_offset], mask, 4);
            }
            mask_data(&frame[body_offset + 4], data, data_len, mask, 0);
            body_offset += 4;
        } else {
            memcpy(&frame[body_offset], data, data_len);
        }
        
        // Handler.
        frame.len() = body_offset + data_len;
        return frame;
    };
    
    // Parse frame.
    ullong parse_frame(String& received, const String& frame) {
        const char* data = frame.data();
        ullong len = frame.len();
        const char * p;
        const char * end = data + len;
        ullong frame_offset = 0;
        for(p = data; p != end; p++) {
            switch(state) {
                case s_start:
                    offset      = 0;
                    length      = 0;
                    mask_offset = 0;
                    flags       = (websocket_flags) (*p & OP_MASK);
                    if(*p & (1<<7)) {
                        flags = (websocket_flags) (flags | FINAL_FRAME);
                    }
                    state = s_head;
                    frame_offset++;
                    break;
                case s_head:
                    length  = (ullong)*p & 0x7F;
                    if(*p & 0x80) {
                        flags = (websocket_flags) (flags | HAS_MASK);
                    }
                    if(length >= 126) {
                        if(length == 127) {
                            require = 8;
                        } else {
                            require = 2;
                        }
                        length = 0;
                        state = s_length;
                    } else if (flags & HAS_MASK) {
                        state = s_mask;
                        require = 4;
                    } else if (length) {
                        state = s_body;
                        require = length;
                        // NOTIFY_CB(frame_header);
                    } else {
                        state = s_start;
                        // NOTIFY_CB(frame_header);
                        // NOTIFY_CB(frame_end);
                    }

                    frame_offset++;
                    break;
                case s_length:
                    while(p < end && require) {
                        length <<= 8;
                        length |= (unsigned char)*p;
                        require--;
                        frame_offset++;
                        p++;
                    }
                    p--;
                    if(!require) {
                        if (flags & HAS_MASK) {
                            state = s_mask;
                            require = 4;
                        } else if (length) {
                            state = s_body;
                            require = length;
                            // NOTIFY_CB(frame_header);
                        } else {
                            state = s_start;
                            // NOTIFY_CB(frame_header);
                            // NOTIFY_CB(frame_end);
                        }
                    }
                    break;
                case s_mask:
                    while(p < end && require) {
                        mask[4 - require--] = *p;
                        frame_offset++;
                        p++;
                    }
                    p--;
                    if(!require) {
                        if(length) {
                            state = s_body;
                            require = length;
                            // NOTIFY_CB(frame_header);
                        } else {
                            state = s_start;
                            // NOTIFY_CB(frame_header);
                            // NOTIFY_CB(frame_end);
                        }
                    }
                    break;
                case s_body:
                    if(require) {
                        if(p + require <= end) {
                            // EMIT_DATA_CB(frame_body, p, require);
                            received.concat_r(p, require);
                            p += require;
                            require = 0;
                            frame_offset = p - data;
                        } else {
                            // EMIT_DATA_CB(frame_body, p, end - p);
                            received.concat_r(p, require);
                            require -= end - p;
                            p = end;
                            offset += p - data - frame_offset;
                            frame_offset = 0;
                        }

                        p--;
                    }
                    if(!require) {
                        // NOTIFY_CB(frame_end);
                        state = s_start;
                    }
                    break;
                default:
                    throw WSSError("Unreachable case.");
            }
        }
        return (p == end) ? len : (p - data);
    }
    
};
}
}
#endif
