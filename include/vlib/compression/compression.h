// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

//
// NOTES:
//
//  - derived of: https://github.com/mapbox/gzip-hpp
//

// Header.
#ifndef VLIB_COMPRESSION_H
#define VLIB_COMPRESSION_H

// Includes.
#include <zlib.h>

// Namespace vlib.
namespace vlib {

// ---------------------------------------------------------
// Enums.

// Namespace compression.
namespace compression {

// Level enum [-1..9].
enum levels {
	null = Z_NO_COMPRESSION,
	def = Z_DEFAULT_COMPRESSION,
	best_speed = Z_BEST_SPEED,
	best_compression = Z_BEST_COMPRESSION,
};

// End namespace compression.
};

// ---------------------------------------------------------
// Compression struct.
/* @docs {
    @chapter: compression
    @title: Compression
    @description:
        Compression type, used to compress and decompress data.
    @usage:
        #include <vlib/compression.h>
        vlib::Compression compression;
} */

struct Compression {

    // ---------------------------------------------------------
    // Exceptions.
    
    static excid_t max_len_err;
    static excid_t deflate_err;
    static excid_t inflate_err;
    static excid_t decompress_err;
    
	// ---------------------------------------------------------
	// Aliases.

	using 	This =		Compression;
	using 	Length = 	ullong;

	// ---------------------------------------------------------
	// Attributes.

	int 	m_level;

	// ---------------------------------------------------------
	// Static attributes.
	SICE uint 	m_limit = limits<uint>::max;

	// ---------------------------------------------------------
	// Constructor.

	// Constructor.
    /*  @docs {
        @title: Constructor
        @description:
            Construct a compression object.
        @parameter: {
            @name: level
            @description: The compression level.
        }
        @parameter: {
            @name: maxbytes
            @description: The maximum bytes to compress, use `-1` to ignore the max bytes.
        }
        @usage:
            vlib::Compression compression(vlib::compression::level::def, -1);
    } */
	constexpr
	Compression(const int level = compression::levels::def) :
	m_level(level) {}

	// Copy constructor.
	constexpr
	Compression(const This& obj) :
	m_level(obj.m_level) {}

	// Move constructor.
	constexpr
	Compression(This&& obj) :
	m_level(obj.m_level) {}

	// ---------------------------------------------------------
	// Properties.

	// Compression level.
    /*  @docs {
        @title: Level
        @description:
            Get the compression level attribute.
        @attribute: true
    } */
    constexpr auto& level() { return m_level; }
	constexpr auto&	level() const { return m_level; }

	// ---------------------------------------------------------
	// Functions.

	// Compress data.
    /*  @docs {
        @title: Compress
        @description:
            Compress a string.
        @parameter: {
            @name: data
            @description: The data to compress.
        }
        @usage:
            vlib::Compression compression;
            vlib::String output = compression.compress("Hello World!");
        @funcs: 2
    } */
    String  compress(const String& data) const {
        return compress(data.data(), data.len());
    }
    String  compress(const char* data, const Length& len, const int window_bits = 31, const int mem_level = 8) const {
        
        // The windowBits parameter is the base two logarithm of the window size (the size of the history buffer).
        // It should be in the range 8..15 for this version of the library.
        // Larger values of this parameter result in better compression at the expense of memory usage.
        // This range of values also changes the decoding type:
        //  -8 to -15 for raw deflate
        //  8 to 15 for zlib
        // (8 to 15) + 16 for gzip
        // (8 to 15) + 32 to automatically detect gzip/zlib header (decompression/inflate only)
        // constexpr int window_bits = 15 + 16; // gzip with windowbits of 15

        // constexpr int mem_level = 8;
        // The memory requirements for deflate are (in bytes):
        // (1 << (window_bits+2)) +  (1 << (mem_level+9))
        // with a default value of 8 for mem_level and our window_bits of 15
        // this is 128Kb
        
        // Zero.
        if (len == 0) { return String(); }

        // Init.
        z_stream deflate_s;
        deflate_s.zalloc = Z_NULL;
        deflate_s.zfree = Z_NULL;
        deflate_s.opaque = Z_NULL;
        deflate_s.avail_in = 0;
        deflate_s.next_in = Z_NULL;

        // Init.
        if (deflateInit2(&deflate_s, m_level, Z_DEFLATED, window_bits, mem_level, Z_DEFAULT_STRATEGY) != Z_OK) {
            throw DeflateError(deflate_err);
        }

        // Deflate.
        ullong _len = len;
        uint chunk_size = UINT_MAX, chunk = 0;
        String output;
        deflate_s.next_in = reinterpret_cast<z_const Bytef*>((char*) data);
        deflate_s.avail_in = 0;
        do {
            
            // Set avail in.
            if (deflate_s.avail_in == 0) {
                chunk = _len > chunk_size ? chunk_size : static_cast<uint>(_len);
                _len -= chunk;
                deflate_s.avail_in = chunk;
            }
            
            // Expand.
            output.expand(chunk);
            
            // Set out.
            deflate_s.avail_out = chunk;
            deflate_s.next_out = reinterpret_cast<Bytef*>((output.data() + output.len()));
            
            // Deflate.
            deflate(&deflate_s, _len ? Z_FULL_FLUSH : Z_FINISH);
            
            // Add length.
            output.len() += (chunk - deflate_s.avail_out);
            
        } while (_len && deflate_s.avail_in == 0);
        deflateEnd(&deflate_s);
        return output;
        
        
        /*
        
        // V1 has max number of bytes.
         
        if (len == 0) { return String(); }
        
		// Init.
		// if (output.is_undefined()) {
		// 	output.alloc(len / 2);
		// }

		// Verify if len input will fit into uint, type used for zlib's avail_in
		if (len > m_limit) {
            throw LimitError(max_len_err);
		}

		// Verify length.
		if (m_max != -1 && len > (Length) m_max) {
            throw LimitError(max_len_err);
		}

		z_stream deflate_s;
		deflate_s.zalloc = Z_NULL;
		deflate_s.zfree = Z_NULL;
		deflate_s.opaque = Z_NULL;
		deflate_s.avail_in = 0;
		deflate_s.next_in = Z_NULL;

		// The windowBits parameter is the base two logarithm of the window size (the size of the history buffer).
		// It should be in the range 8..15 for this version of the library.
		// Larger values of this parameter result in better compression at the expense of memory usage.
		// This range of values also changes the decoding type:
		//  -8 to -15 for raw deflate
		//  8 to 15 for zlib
		// (8 to 15) + 16 for gzip
		// (8 to 15) + 32 to automatically detect gzip/zlib header (decompression/inflate only)
		constexpr int window_bits = 15 + 16; // gzip with windowbits of 15

		constexpr int mem_level = 8;
		// The memory requirements for deflate are (in bytes):
		// (1 << (window_bits+2)) +  (1 << (mem_level+9))
		// with a default value of 8 for mem_level and our window_bits of 15
		// this is 128Kb

		#pragma GCC diagnostic push
		#pragma GCC diagnostic ignored "-Wold-style-cast"
		if (deflateInit2(&deflate_s, m_level, Z_DEFLATED, window_bits, mem_level, Z_DEFAULT_STRATEGY) != Z_OK) {
            throw DeflateError(deflate_err);
		}
		#pragma GCC diagnostic pop

		deflate_s.next_in = reinterpret_cast<z_const Bytef*>((char*) data);
		deflate_s.avail_in = static_cast<uint>(len);
        String output;
		do {
			Length increase = len / 2 + 1024;
			output.expand(increase);

			// There is no way we see that "increase" would not fit in an uint,
			// hence we use static cast here to avoid -Wshorten-64-to-32 error
			deflate_s.avail_out = static_cast<uint>(increase);
			//deflate_s.next_out = reinterpret_cast<Bytef*>((&output.data()[0] + output.len()));
			deflate_s.next_out = reinterpret_cast<Bytef*>((output.data() + output.len()));

			// From http://www.zlib.net/zlib_how.html
			// "deflate() has a return value that can indicate errors, yet we do not check it here.
			// Why not? Well, it turns out that deflate() can do no wrong here."
			// Basically only possible error is from deflateInit not working properly
			deflate(&deflate_s, Z_FINISH);
			output.len() += (increase - deflate_s.avail_out);
		} while (deflate_s.avail_out == 0);
		deflateEnd(&deflate_s);
		return output;
        */
	}

	// Decompress.
    /*  @docs {
        @title: Decompress
        @description:
            Decompress a string.
        @parameter: {
            @name: data
            @description: The data to decompress.
        }
        @usage:
            vlib::Compression compression;
            vlib::String output = compression.decompress("XXX");
        @funcs: 2
    } */
    String  decompress(const String& data) const {
        return decompress(data.data(), data.len());
    }
	String  decompress(const char* data, const Length& len, const int window_bits = 47) const {
        
        // The windowBits parameter is the base two logarithm of the window size (the size of the history buffer).
        // It should be in the range 8..15 for this version of the library.
        // Larger values of this parameter result in better compression at the expense of memory usage.
        // This range of values also changes the decoding type:
        //  -8 to -15 for raw deflate
        //  8 to 15 for zlib
        // (8 to 15) + 16 for gzip
        // (8 to 15) + 32 to automatically detect gzip/zlib header
        // constexpr int window_bits = 15 + 32; // auto with windowbits of 15
        
        // Zero.
        if (len == 0) { return String(); }
        
        // Vars.
        String output;
        z_stream inflate_s;
        inflate_s.zalloc = Z_NULL;
        inflate_s.zfree = Z_NULL;
        inflate_s.opaque = Z_NULL;
        inflate_s.avail_in = 0;
        inflate_s.next_in = Z_NULL;

        // Init.
        if (inflateInit2(&inflate_s, window_bits) != Z_OK) {
            throw InflateError(inflate_err);
        }

        // Deflate.
        ullong _len = len;
        uint chunk_size = UINT_MAX, chunk = 0;
        inflate_s.next_in = reinterpret_cast<z_const Bytef*>((char*) data);
        inflate_s.avail_in = 0;
        do {
            
            // Set avail in.
            if (inflate_s.avail_in == 0) {
                chunk = _len > chunk_size ? chunk_size : static_cast<uint>(_len);
                _len -= chunk;
                inflate_s.avail_in = chunk;
            }
            
            // Expand.
            output.expand(chunk);
            
            // Set out.
            inflate_s.avail_out = chunk;
            inflate_s.next_out = reinterpret_cast<Bytef*>(output.data() + output.len());
            
            // Inflate.
            int ret = inflate(&inflate_s, _len ? Z_FULL_FLUSH : Z_FINISH);
            if (ret != Z_STREAM_END && ret != Z_OK && ret != Z_BUF_ERROR) {
                inflateEnd(&inflate_s);
                throw CompressionError(decompress_err);
            }
            
            // Set len.
            output.len() += (chunk - inflate_s.avail_out);
            
        } while (inflate_s.avail_out == 0);
        inflateEnd(&inflate_s);
        return output;
        
        /*
        if (len == 0) { return String(); }
		z_stream inflate_s;
		inflate_s.zalloc = Z_NULL;
		inflate_s.zfree = Z_NULL;
		inflate_s.opaque = Z_NULL;
		inflate_s.avail_in = 0;
		inflate_s.next_in = Z_NULL;

		// The windowBits parameter is the base two logarithm of the window size (the size of the history buffer).
		// It should be in the range 8..15 for this version of the library.
		// Larger values of this parameter result in better compression at the expense of memory usage.
		// This range of values also changes the decoding type:
		//  -8 to -15 for raw deflate
		//  8 to 15 for zlib
		// (8 to 15) + 16 for gzip
		// (8 to 15) + 32 to automatically detect gzip/zlib header
        // constexpr int window_bits = 15 + 32; // auto with windowbits of 15

		#pragma GCC diagnostic push
		#pragma GCC diagnostic ignored "-Wold-style-cast"
		if (inflateInit2(&inflate_s, window_bits) != Z_OK) {
            throw InflateError(inflate_err);
		}
		#pragma GCC diagnostic pop
		inflate_s.next_in = reinterpret_cast<z_const Bytef*>((char*) data);

		// Verify if size (long type) input will fit into uint, type used for zlib's avail_in
        // @TODO add support without max.
		if ((std::uint64_t) (len * 2) > m_limit) {
			inflateEnd(&inflate_s);
            throw LimitError(max_len_err);
		}

		if (m_max != -1 && (len > (Length) m_max || (len * 2) > (Length) m_max)) {
			inflateEnd(&inflate_s);
            throw LimitError(max_len_err);
		}
		inflate_s.avail_in = static_cast<uint>(len);
        String output;
		do {
			Length resize_to = output.len() + 2 * len;
			if (resize_to > (Length) m_max) {
				inflateEnd(&inflate_s);
                throw LimitError(max_len_err);
			}
			output.resize(resize_to);
			inflate_s.avail_out = static_cast<uint>(2 * len);
			//inflate_s.next_out = reinterpret_cast<Bytef*>(&output.m_arr[0] + output.len());
			inflate_s.next_out = reinterpret_cast<Bytef*>(output.data() + output.len());
			int ret = inflate(&inflate_s, Z_FINISH);
			if (ret != Z_STREAM_END && ret != Z_OK && ret != Z_BUF_ERROR) {
				inflateEnd(&inflate_s);
                throw CompressionError(decompress_err);
			}
			output.len() += (2 * len - inflate_s.avail_out);
		} while (inflate_s.avail_out == 0);
		inflateEnd(&inflate_s);
        return output;
        */
        
	}

	// Is compressed.
    /*  @docs {
        @title: Is compressed
        @description:
            Check if data is compressed.
        @parameter: {
            @name: data
            @description: The data to check.
        }
        @return:
            Returns a boolean indicating whether the data is compressed or not.
        @usage:
            vlib::Compression compression;
            bool is_compressed = compression.is_compressed("XXX");
        @funcs: 2
    } */
    constexpr
    bool    is_compressed(const String& obj) const {
        return is_compressed(obj.data(), obj.len());
    }
	constexpr
	bool 	is_compressed(const char* data, const Length& len) const {
		return len > 2 && (
		   // zlib
		   (
			   static_cast<uint8_t>(data[0]) == 0x78 &&
			   (static_cast<uint8_t>(data[1]) == 0x9C ||
				static_cast<uint8_t>(data[1]) == 0x01 ||
				static_cast<uint8_t>(data[1]) == 0xDA ||
				static_cast<uint8_t>(data[1]) == 0x5E)) ||
		   // gzip
		   (static_cast<uint8_t>(data[0]) == 0x1F && static_cast<uint8_t>(data[1]) == 0x8B)
		);
	}

};

// Exceptions.
excid_t Compression::max_len_err = exceptions::add_err("Data exceeds maximum length.");
excid_t Compression::deflate_err = exceptions::add_err("Encoutered an error while deflating.");
excid_t Compression::inflate_err = exceptions::add_err("Encoutered an error while inflating.");
excid_t Compression::decompress_err = exceptions::add_err("Encoutered an error while decompressing.");

// ---------------------------------------------------------
// Alias functions.

// Namespace compression.
namespace compression {

Compression compressor;
int& level = compressor.m_level;

} // end namespace compression.

// Compress data.
/*  @docs {
    @chapter: compression
    @title: Compress
    @description:
        Compress a string.
    @parameter: {
        @name: data
        @description: The data to compress.
    }
    @usage:
        vlib::String output = vlib::compression::compress("Hello World!");
    @funcs: 2
} */
String  compress(const String& data) {
    return compression::compressor.compress(data.data(), data.len());
}
String  compress(const char* data, const ullong& len) {
	return compression::compressor.compress(data, len);
}

// Decompress.
/*  @docs {
    @chapter: compression
    @title: Decompress
    @description:
        Decompress a string.
    @parameter: {
        @name: data
        @description: The data to decompress.
    }
    @usage:
        vlib::String output = vlib::compression::decompress("XXX");
    @funcs: 2
} */
String  decompress(const String& data) {
    return compression::compressor.decompress(data.data(), data.len());
}
String  decompress(const char* data, const ullong& len) {
	return compression::compressor.decompress(data, len);
}

// Is compressed.
/*  @docs {
    @chapter: compression
    @title: Is compressed
    @description:
        Check if data is compressed.
    @parameter: {
        @name: data
        @description: The data to check.
    }
    @return:
        Returns a boolean indicating whether the data is compressed or not.
    @usage:
        bool is_compressed = vlib::compression::is_compressed("XXX");
    @funcs: 2
} */
constexpr
bool     is_compressed(const String& obj) {
    return compression::compressor.is_compressed(obj.data(), obj.len());
}
constexpr
bool 	is_compressed(const char* data, const ullong& len) {
	return compression::compressor.is_compressed(data, len);
}

// ---------------------------------------------------------
// Instances.

// Is instance.
template<> 				struct is_instance<Compression, Compression>	{ SICEBOOL value = true;  };

// Is type.
template<typename Type>	struct is_Compression 							{ SICEBOOL value = false; };
template<> 				struct is_Compression<Compression> 				{ SICEBOOL value = true;  };

}; 		// End namespace vlib.
#endif 	// End header.
