// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

//
// NOTES:
//
//  - derived of: https://github.com/mapbox/gzip-hpp
//

// Header.
#ifndef VLIB_COMPRESSION_ZIP_H
#define VLIB_COMPRESSION_ZIP_H

// Includes.
#include <zlib.h>

// Namespace vlib.
namespace vlib {

// ---------------------------------------------------------
// Compression struct.
// Sources:
// * ZIP file format: https://pkware.cachefly.net/webdocs/casestudies/APPNOTE.TXT
// * Extra fields: https://libzip.org/specifications/extrafld.txt

/*  @docs {
 *  @chapter: compression
 *  @title: Zip
 *  @description:
 *      Create or extract a zip archive.
 *
 *      Supports zip archives that exceed 4GB (zip64).
 *
 *      Only supports zip files that are on a single disk.
 *
 *      Only supports the following extra fields.
 *          - ZIP64 extended information extra field.
 *          - Info-ZIP Unix Extra Field (type 2).
 *      All unsupported extra fields are silently ignored.
 *  @usage:
 *      #include <vlib/compression.h>
 *      vlib::Zip zip;
 *      ...
 *  @warning: This class is experimental and still in development.
 } */
struct Zip {

// Public.
public:
    
    // ---------------------------------------------------------
    // Public structs.
    
    // Zip entry structure.
    /*  @docs {
     *  @title: Entry
     *  @description:
     *      A zip archive file entry.
     *
     *      An entry contains the following attributes:
     *      ```
     *      uint64_t        offset = 0;             // file header offset.
     *      uint16_t        mode = 0;               // file mode directly from assigned "st_mode".
     *      uint16_t        uid = 0;                // uid of the path.
     *      uint16_t        gid = 0;                // gid of the path.
     *      uint16_t        mod_time = 0;           // mod time of the path
     *      uint16_t        mod_date = 0;           // mod date of the path.
	 *		uint16_t		compression_method = 8; // the compression method.
     *      uint64_t        compressed_len = 0;     // length of uncompressed data.
     *      uint64_t        uncompressed_len = 0;   // length of compressed data.
     *      uint32_t        crc = 0;                // crc32 checksum.
     *      String          name;                   // sub path.
     *      String          data;                   // compressed data.
     *      ```
     *  @usage:
     *      vlib::Zip zip;
     *      zip.read("/tmp/archive.zip");
     *      for (auto& entry: zip.entries()) {
     *          ...
     *      }
     } */
    struct Entry {
        
        // ---------------------------------------------------------
        // Attributes.
        
        uint64_t        offset = 0;             // file header offset.
        uint16_t        mode = 0;               // file mode directly from assigned "st_mode".
        uint16_t        uid = 0;                // uid of the path.
        uint16_t        gid = 0;                // gid of the path.
        uint16_t        mod_time = 0;           // mod time of the path
        uint16_t        mod_date = 0;           // mod date of the path.
		uint16_t		compression_method = 8; // the compression method.
        uint64_t        compressed_len = 0;     // length of uncompressed data.
        uint64_t        uncompressed_len = 0;   // length of compressed data.
        uint32_t        crc = 0;                // crc32 checksum.
        String          name;                   // sub path.
        String          data;                   // compressed data.
        
        // ---------------------------------------------------------
        // Functions.
        
        // Get the mtime from the "mod_time" and "mod_date".
        Long    mtime() const {
            struct tm timeinfo {};
            timeinfo.tm_sec = (mod_time & 0x1F) * 2; // Bits 0-4 represent seconds (in 2-second increments)
            timeinfo.tm_min = (mod_time >> 5) & 0x3F; // Bits 5-10 represent minutes
            timeinfo.tm_hour = (mod_time >> 11) & 0x1F; // Bits 11-15 represent hours
            timeinfo.tm_mday = mod_date & 0x1F; // Bits 0-4 represent day
            timeinfo.tm_mon = ((mod_date >> 5) & 0xF) - 1; // Bits 5-8 represent month and adjust to zero based.
            timeinfo.tm_year = (((mod_date >> 9) & 0x7F) + 1980) - 1900; // Bits 9-15 represent year (add 1980 to get the actual year). Adjusting year to be relative to 1900
            return mktime(&timeinfo);
        }
        
        // Get the permission from the "mode" attribute.
        UShort  permission() const {
            return mode & (S_IRWXU | S_IRWXG | S_IRWXO);
        }
        
        // Check if the entry is a directory.
        Bool    is_dir() const {
            return mode & S_IFDIR;
        }
        
        // ---------------------------------------------------------
        // Operators.
        
        // Equals by offset.
        constexpr friend
        bool    operator == (const Entry& x, uint64_t offset) {
            return x.offset == offset;
        }
        
        // Equals by name.
        constexpr friend
        bool    operator == (const Entry& x, const String& name) {
            return x.name == name;
        }
        
        // Equals with other entry.
        constexpr friend
        bool    operator == (const Entry& x, const Entry& y) {
            return
            x.offset == y.offset &&
            x.mode == y.mode &&
            x.uid == y.uid &&
            x.gid == y.gid &&
            x.mod_time == y.mod_time &&
            x.mod_date == y.mod_date &&
            x.compressed_len == y.compressed_len &&
            x.uncompressed_len == y.uncompressed_len &&
            x.crc == y.crc &&
            x.name == y.name &&
            x.data == y.data;
        }
        
        // Dump to pipe.
        constexpr friend
        auto&   operator <<(Pipe& pipe, const Entry& entry) {
            return pipe << "Entry: " << "\n" <<
            " * offset: " << entry.offset << "\n" <<
            " * mode: " << entry.mode << "\n" <<
            " * uid: " << entry.uid << "\n" <<
            " * gid: " << entry.gid << "\n" <<
            " * mod_time: " << entry.mod_time << "\n" <<
            " * mod_date: " << entry.mod_date << "\n" <<
            " * compressed_len: " << entry.compressed_len << "\n" <<
            " * uncompressed_len: " << entry.uncompressed_len << "\n" <<
            " * crc: " << entry.crc << "\n" <<
            " * name: " << entry.name << "\n" <<
            " * data length: " << entry.data.len();
        }
        
    };

// Private.
private:
    
    // ---------------------------------------------------------
    // Private structs.
    
    // Archive structure.
    struct Archive {
        Array<Entry>    entries;
        uint32_t        disk = 0;
        uint64_t        cd_size = 0;
        uint64_t        cd_offset = 0;
        uint64_t        eocd_offset = 0;
        
        // Equals.
        constexpr friend
        bool    operator == (const Archive& x, const Archive& y) {
            return
            x.disk == y.disk &&
            x.cd_size == y.cd_size &&
            x.cd_offset == y.cd_offset &&
            x.eocd_offset == y.eocd_offset &&
            x.entries == y.entries; // last.
        }
        
        // Dump to pipe.
        constexpr friend
        auto&   operator <<(Pipe& pipe, const Archive& entry) {
            return pipe << "Archive: \n" <<
            " * entries: " << entry.entries.len() << "\n" <<
            " * disk: " << entry.disk << "\n" <<
            " * cd_size: " << entry.cd_size << "\n" <<
            " * cd_offset: " << entry.cd_offset << "\n" <<
            " * eocd_offset: " << entry.eocd_offset;
        }
        
    };

    // ---------------------------------------------------------
    // Attributes.

    Archive     m_archive;
    Compression m_compression = Z_BEST_COMPRESSION;
    
    // ---------------------------------------------------------
    // Private functions.
    
    // Compute CRC-32.
    static
    uint32_t calc_crc32(const char* data, ullong len) {
        uLong crc = crc32(0L, Z_NULL, 0);
        crc = crc32(crc, (uchar*) data, (uint32_t) len);
        return (uint32_t) crc;
    }

    // Write local file header for a file entry
    template <typename Stream> requires (is_File<Stream>::value || is_Stream<Stream>::value)
    void    write_fheader(Stream& stream, const Entry& entry) const {
        
        // Default headers.
        SCE uint16_t        version = 45;
        SCE uint16_t        general_flag = 0;
		const uint16_t&		compression_method = entry.compression_method;
        const uint16_t&     mod_time = entry.mod_time;
        const uint16_t&     mod_date = entry.mod_date;
        const uint32_t&     crc = entry.crc;
        SCE uint32_t        compressed_len = UINT32_MAX;
        SCE uint32_t        uncompressed_len = UINT32_MAX;
        const uint16_t      name_len = entry.name.len();
        SCE uint16_t        extra_field_len = 24 + 4 + 4 + 4;
        
        // Zip64 extended info extra field.
        SCE uint16_t        extf_zip64_size = 24;
        const uint64_t&     zip64_compressed_len = entry.compressed_len;
        const uint64_t&     zip64_uncompressed_len = entry.uncompressed_len;
        const uint64_t&     zip64_offset = entry.offset;
        
        // Info-ZIP Unix Extra Field (type 2).
        SCE uint16_t        extf_unix2_size = 4;
        const uint16_t&     uid = entry.uid;
        const uint16_t&     gid = entry.gid;
        
        // Write header.
        stream.write((char*) &header_signature, sizeof(header_signature));
        stream.write((char*) &version, sizeof(version));
        stream.write((char*) &general_flag, sizeof(general_flag));
        stream.write((char*) &compression_method, sizeof(compression_method));
        stream.write((char*) &mod_time, sizeof(mod_time));
        stream.write((char*) &mod_date, sizeof(mod_date));
        stream.write((char*) &crc, sizeof(crc));
        stream.write((char*) &compressed_len, sizeof(compressed_len));
        stream.write((char*) &uncompressed_len, sizeof(uncompressed_len));
        stream.write((char*) &name_len, sizeof(name_len));
        stream.write((char*) &extra_field_len, sizeof(extra_field_len));
        
        // File name
        stream.write(entry.name.data(), entry.name.len());
        
        // Info-ZIP Unix Extra Field (type 2).
        stream.write((char*) &extf_unix2_signature, sizeof(extf_unix2_signature));
        stream.write((char*) &extf_unix2_size, sizeof(extf_unix2_size));
        stream.write((char*) &uid, sizeof(uid));
        stream.write((char*) &gid, sizeof(gid));
        
        // Zip64 extented info.
        // Should be last.
        stream.write((char*) &extf_zip64_signature, sizeof(extf_zip64_signature));
        stream.write((char*) &extf_zip64_size, sizeof(extf_zip64_size));
        stream.write((char*) &zip64_uncompressed_len, sizeof(zip64_uncompressed_len));
        stream.write((char*) &zip64_compressed_len, sizeof(zip64_compressed_len));
        stream.write((char*) &zip64_offset, sizeof(zip64_offset));
        
        // File data.
		if (zip64_compressed_len != 0 || zip64_uncompressed_len != 0) {
			stream.write(entry.data.data(), entry.data.len());
		}
        
    }

    // Write central directory file header for a file entry
    template <typename Stream> requires (is_File<Stream>::value || is_Stream<Stream>::value)
    void    write_cdheader(Stream& stream, const Entry& entry) const {
        
        // Default headers.
        SCE uint16_t        made_version = 0x0345; // 03 unix for file permissions and zip version 45.
        SCE uint16_t        version = 45;
        SCE uint16_t        general_flag = 0;
		const uint16_t&		compression_method = entry.compression_method;
        const uint16_t&     mod_time = entry.mod_time;
        const uint16_t&     mod_date = entry.mod_date;
        const uint32_t&     crc = entry.crc;
        SCE uint32_t        compressed_len = UINT32_MAX;
        SCE uint32_t        uncompressed_len = UINT32_MAX;
        const uint16_t&     name_len = entry.name.len();
        SCE uint16_t        extra_field_len = 24 + 4 + 4 + 4;
        SCE uint16_t        comment_len = 0;
        SCE uint16_t        disk = 0;
        SCE uint16_t        internal_file_attr = 0;
        const uint32_t      external_file_attr = ((uint32_t) entry.mode) << 16;
        SCE uint32_t        offset = UINT32_MAX;
        
        // Zip64 extended info extra field.
        SCE uint16_t        extf_zip64_size = 24;
        const uint64_t&     zip64_compressed_len = entry.compressed_len;
        const uint64_t&     zip64_uncompressed_len = entry.uncompressed_len;
        const uint64_t&     zip64_offset = entry.offset;
        
        // Info-ZIP Unix Extra Field (type 2).
        SCE uint16_t        extf_unix2_size = 4;
        const uint16_t&     uid = entry.uid;
        const uint16_t&     gid = entry.gid;
        
        // Write header.
        stream.write((typename Stream::Type*) &cd_header_signature, sizeof(cd_header_signature));
        stream.write((typename Stream::Type*) &made_version, sizeof(made_version));
        stream.write((typename Stream::Type*) &version, sizeof(version));
        stream.write((typename Stream::Type*) &general_flag, sizeof(general_flag));
        stream.write((typename Stream::Type*) &compression_method, sizeof(compression_method));
        stream.write((typename Stream::Type*) &mod_time, sizeof(mod_time));
        stream.write((typename Stream::Type*) &mod_date, sizeof(mod_date));
        stream.write((typename Stream::Type*) &crc, sizeof(crc));
        stream.write((typename Stream::Type*) &compressed_len, sizeof(compressed_len));
        stream.write((typename Stream::Type*) &uncompressed_len, sizeof(uncompressed_len));
        stream.write((typename Stream::Type*) &name_len, sizeof(name_len));
        stream.write((typename Stream::Type*) &extra_field_len, sizeof(extra_field_len));
        stream.write((typename Stream::Type*) &comment_len, sizeof(comment_len));
        stream.write((typename Stream::Type*) &disk, sizeof(disk));
        stream.write((typename Stream::Type*) &internal_file_attr, sizeof(internal_file_attr));
        stream.write((typename Stream::Type*) &external_file_attr, sizeof(external_file_attr));
        stream.write((typename Stream::Type*) &offset, sizeof(offset));

        // File name
        stream.write(entry.name.data(), entry.name.len());
        
        // Info-ZIP Unix Extra Field (type 2).
        stream.write((char*) &extf_unix2_signature, sizeof(extf_unix2_signature));
        stream.write((char*) &extf_unix2_size, sizeof(extf_unix2_size));
        stream.write((char*) &uid, sizeof(uid));
        stream.write((char*) &gid, sizeof(gid));
        
        // Zip64 extented info.
        // Should be last.
        stream.write((typename Stream::Type*) &extf_zip64_signature, sizeof(extf_zip64_signature));
        stream.write((typename Stream::Type*) &extf_zip64_size, sizeof(extf_zip64_size));
        stream.write((typename Stream::Type*) &zip64_uncompressed_len, sizeof(zip64_uncompressed_len));
        stream.write((typename Stream::Type*) &zip64_compressed_len, sizeof(zip64_compressed_len));
        stream.write((typename Stream::Type*) &zip64_offset, sizeof(zip64_offset));
        
    }
    
    // Write end of central directory recod.
    template <typename Stream> requires (is_File<Stream>::value || is_Stream<Stream>::value)
    void    write_eocd64(Stream& stream) const {
        
        // Vars.
        SCE uint64_t        remaining_size = 44;
        SCE uint16_t        made_version = 0x0345; // 03 unix for file permissions and zip version 45.
        SCE uint16_t        version = 45;
        const uint32_t&     disk = m_archive.disk;
        const uint32_t&     start_disk = m_archive.disk;
        const uint64_t&     disk_entries = m_archive.entries.len();
        const uint64_t&     entries = m_archive.entries.len();
        const uint64_t&     size = m_archive.cd_size;
        const uint64_t&     offset = m_archive.cd_offset;
        
        // Write.
        stream.write((typename Stream::Type*) &eocd64_signature, sizeof(eocd64_signature));
        stream.write((typename Stream::Type*) &remaining_size, sizeof(remaining_size));
        stream.write((typename Stream::Type*) &made_version, sizeof(made_version));
        stream.write((typename Stream::Type*) &version, sizeof(version));
        stream.write((typename Stream::Type*) &disk, sizeof(disk));
        stream.write((typename Stream::Type*) &start_disk, sizeof(start_disk));
        stream.write((typename Stream::Type*) &disk_entries, sizeof(disk_entries));
        stream.write((typename Stream::Type*) &entries, sizeof(entries));
        stream.write((typename Stream::Type*) &size, sizeof(size));
        stream.write((typename Stream::Type*) &offset, sizeof(offset));
    }
    
    // Write end of central directory locator.
    template <typename Stream> requires (is_File<Stream>::value || is_Stream<Stream>::value)
    void    write_eocl64(Stream& stream) const {
        
        // Vars.
        const uint32_t&     disk = m_archive.disk;
        const uint64_t&     offset = m_archive.eocd_offset;
        const uint32_t&     disks = m_archive.disk + 1;
        
        // Write.
        stream.write((typename Stream::Type*) &eocl64_signature, sizeof(eocl64_signature));
        stream.write((typename Stream::Type*) &disk, sizeof(disk));
        stream.write((typename Stream::Type*) &offset, sizeof(offset));
        stream.write((typename Stream::Type*) &disks, sizeof(disks));
    }
    
    // Write end of central directory record
    template <typename Stream> requires (is_File<Stream>::value || is_Stream<Stream>::value)
    void    write_eocd(Stream& stream) const {
        
        // Vars.
        SCE uint16_t   disk = UINT16_MAX;
        SCE uint16_t   start_central_disk = UINT16_MAX;
        SCE uint16_t   disk_entries = UINT16_MAX;
        SCE uint16_t   entries = UINT16_MAX;
        SCE uint32_t   size = UINT32_MAX;
        SCE uint32_t   offset = UINT32_MAX;
        SCE uint16_t   comment_len = 0;
        
        // Write header.
        stream.write((typename Stream::Type*) &eocd_signature, sizeof(eocd_signature));
        stream.write((typename Stream::Type*) &disk, sizeof(disk));
        stream.write((typename Stream::Type*) &start_central_disk, sizeof(start_central_disk));
        stream.write((typename Stream::Type*) &disk_entries, sizeof(disk_entries));
        stream.write((typename Stream::Type*) &entries, sizeof(entries));
        stream.write((typename Stream::Type*) &size, sizeof(size));
        stream.write((typename Stream::Type*) &offset, sizeof(offset));
        stream.write((typename Stream::Type*) &comment_len, sizeof(comment_len));
        
    }
    
    // Read a local file header.
    // The start parameter should be the start idnex of the signature.
    // Returns the amount of readed bytes.
    constexpr
    ullong  read_fheader(Entry& entry, const char* data, ullong start) {
        
        // Vars.
        ullong pos = start;
        uint16_t name_len;
        uint32_t extra_field_len = 0;
        
        // Set offset to match file headers with central dir headers.
        entry.offset = start;
        
        // Top.
        pos += sizeof(uint32_t); // signature.
        pos += sizeof(uint16_t); // version.
        pos += sizeof(uint16_t); // general flag.
        entry.compression_method = *((uint16_t*) &data[pos]);
        pos += sizeof(uint16_t); // compression method.
        
        // Mod time / date.
        entry.mod_time = *((uint16_t*) &data[pos]);
        pos += sizeof(uint16_t);
        entry.mod_date = *((uint16_t*) &data[pos]);
        pos += sizeof(uint16_t);
        
        // CRC.
        entry.crc = *((uint32_t*) &data[pos]);
        pos += sizeof(uint32_t);
        
        // Lengths.
        entry.compressed_len = *((uint32_t*) &data[pos]);
        pos += sizeof(uint32_t);
        entry.uncompressed_len = *((uint32_t*) &data[pos]);
        pos += sizeof(uint32_t);
        name_len = *((uint16_t*) &data[pos]);
        pos += sizeof(uint16_t);
        extra_field_len = *((uint16_t*) &data[pos]);
        pos += sizeof(uint16_t);
        
        // Name.
        entry.name.reconstruct(data + pos, name_len);
        pos += name_len;
        
        // Extra field.
        // Currently only the zip64 extended info and ASi UNIX extra field are suppported.
        ullong end_extra_field = pos + extra_field_len;
        if (extra_field_len != 0) {
            read_extra_fields(entry, data, pos, extra_field_len);
        }
        pos = end_extra_field; // in case there are gaps.
        
        // Read data.
        if (entry.compression_method == 0) {
            entry.data.reconstruct(data + pos, entry.uncompressed_len);
            pos += entry.uncompressed_len;
        } else {
            entry.data.reconstruct(data + pos, entry.compressed_len);
            pos += entry.compressed_len;
        }
        
        // Return.
        return pos - start - 1;
    }
    
    // Read a central directory header.
    // The start parameter should be the start idnex of the signature.
    // Returns the amount of readed bytes.
    constexpr
    ullong  read_cdheader(Entry& entry, const char* data, ullong start) {
        
        // Vars.
        ullong pos = start;
        uint16_t name_len, comment_len;
        uint32_t extra_field_len = 0, external_file_attr;
        
        // Top.
        pos += sizeof(uint32_t); // signature
        // made_version = *((uint16_t*) &data[pos]);
        pos += sizeof(uint16_t); // made version.
        pos += sizeof(uint16_t); // version.
        // general_flag = *((uint16_t*) &data[pos]);
        pos += sizeof(uint16_t); // general flag.
		entry.compression_method = *((uint16_t*) &data[pos]);
        pos += sizeof(uint16_t); // compression method.
        
        // Mod time / date.
        entry.mod_time = *((uint16_t*) &data[pos]);
        pos += sizeof(uint16_t);
        entry.mod_date = *((uint16_t*) &data[pos]);
        pos += sizeof(uint16_t);
        
        // CRC.
        entry.crc = *((uint32_t*) &data[pos]);
        pos += sizeof(uint32_t);
        
        // Lengths.
        entry.compressed_len = *((uint32_t*) &data[pos]);
        pos += sizeof(uint32_t);
        entry.uncompressed_len = *((uint32_t*) &data[pos]);
        pos += sizeof(uint32_t);
        name_len = *((uint16_t*) &data[pos]);
        pos += sizeof(uint16_t);
        extra_field_len = *((uint16_t*) &data[pos]);
        pos += sizeof(uint16_t);
        comment_len = *((uint16_t*) &data[pos]);
        pos += sizeof(uint16_t);
        
        // Disk.
        // disk = *((uint16_t*) &data[pos]);
        pos += sizeof(uint16_t);
        
        // File attr.
        pos += sizeof(uint16_t); // internal file attr.
        external_file_attr = *((uint32_t*) &data[pos]);
        pos += sizeof(uint32_t);
        
        // File mode when made version is UNIX.
        // if (made_version & 0x03) {
            entry.mode = (uint16_t) (external_file_attr >> 16);
        // }
        
        // Offset.
        entry.offset = *((uint32_t*) &data[pos]);
        pos += sizeof(uint32_t);
        
        // Name.
        entry.name.reconstruct(data + pos, name_len);
        pos += name_len;
        
        // Extra field.
        // Currently only the zip64 extended info and ASi UNIX extra field are suppported.
        ullong end_extra_field = pos + extra_field_len;
        if (extra_field_len != 0) {
            read_extra_fields(entry, data, pos, extra_field_len);
        }
        pos = end_extra_field; // in case there are gaps.
        
        // Skip comment.
        pos += comment_len;
        
        // Return.
        return pos - start - 1;
    }
    
    // Read the EOCD64.
    constexpr
    ullong  read_eocd64(Archive& archive, const char* data, ullong start) {
        
        // Vars.
        ullong pos = start;
        
        // Signature.
        pos += sizeof(uint32_t); // signature
        
        // Size.
        uint64_t     remaining_size;
        remaining_size = *((uint64_t*) &data[pos]);
        pos += sizeof(uint64_t);
        
        // Other fields.
        if (remaining_size != 0) {
            // made_version = *((uint16_t*) &data[pos]);
            pos += sizeof(uint16_t);
            remaining_size -= sizeof(uint16_t);
        }
        if (remaining_size != 0) {
            // version = *((uint16_t*) &data[pos]);
            pos += sizeof(uint16_t);
            remaining_size -= sizeof(uint16_t);
        }
        if (remaining_size != 0) {
            archive.disk = *((uint32_t*) &data[pos]);
            pos += sizeof(uint32_t);
            remaining_size -= sizeof(uint32_t);
        }
        if (remaining_size != 0) {
            // start_disk = *((uint32_t*) &data[pos]);
            pos += sizeof(uint32_t);
            remaining_size -= sizeof(uint32_t);
        }
        if (remaining_size != 0) {
            // disk_entries = *((uint64_t*) &data[pos]);
            pos += sizeof(uint64_t);
            remaining_size -= sizeof(uint64_t);
        }
        if (remaining_size != 0) {
            // entries = *((uint64_t*) &data[pos]);
            pos += sizeof(uint64_t);
            remaining_size -= sizeof(uint64_t);
        }
        if (remaining_size != 0) {
            archive.cd_size = *((uint64_t*) &data[pos]);
            pos += sizeof(uint64_t);
            remaining_size -= sizeof(uint64_t);
        }
        if (remaining_size != 0) {
            archive.cd_offset = *((uint64_t*) &data[pos]);
            pos += sizeof(uint64_t);
            remaining_size -= sizeof(uint64_t);
        }
        
        // Return.
        return pos - start - 1;
    }
    
    // Read the EOCL64.
    constexpr
    ullong  read_eocl64(Archive& archive, const char* data, ullong start) {
        
        // Vars.
        ullong pos = start;
        
        // Signature.
        pos += sizeof(uint32_t); // signature
        
        // Disk.
        // disk = *((uint32_t*) &data[pos]);
        pos += sizeof(uint32_t);
        
        // Offset.
        archive.eocd_offset = *((uint64_t*) &data[pos]);
        pos += sizeof(uint64_t);
        
        // Disks.
        // disks = *((uint32_t*) &data[pos]);
        pos += sizeof(uint32_t);
        
        // Return.
        return pos - start - 1;
    }
    
    // Read the EOCD.
    constexpr
    ullong  read_eocd(Archive& archive, const char* data, ullong start) {
        
        // Vars.
        ullong pos = start;
        uint16_t   disk;
        // uint16_t   start_central_disk;
        // uint16_t   disk_entries;
        // uint16_t   entries;
        uint32_t   size;
        uint32_t   offset;
        uint16_t   comment_len;
        
        // Signature.
        pos += sizeof(uint32_t); // signature
        
        // Disk.
        disk = *((uint16_t*) &data[pos]);
        if (disk != UINT16_MAX) {
            archive.disk = disk;
        }
        pos += sizeof(uint16_t);
        
        // Start central disk.
        // start_central_disk = *((uint16_t*) &data[pos]);
        pos += sizeof(uint16_t);
        
        // Disk entries.
        // disk_entries = *((uint16_t*) &data[pos]);
        pos += sizeof(uint16_t);
        
        // Entries.
        // entries = *((uint16_t*) &data[pos]);
        pos += sizeof(uint16_t);
        
        // Size.
        size = *((uint32_t*) &data[pos]);
        if (size != UINT32_MAX) {
            archive.cd_size = size;
        }
        pos += sizeof(uint32_t);
        
        // Offset.
        offset = *((uint32_t*) &data[pos]);
        if (size != UINT32_MAX) {
            archive.cd_offset = offset;
        }
        pos += sizeof(uint32_t);
        
        // Comment length.
        comment_len = *((uint16_t*) &data[pos]);
        pos += sizeof(uint16_t);
        
        // Skip comment.
        pos += comment_len;
        
        // Return.
        return pos - start - 1;
    }
    
    // Read extra fields.
    // The start parameter indicates the start index of the extra fields.
    constexpr
    void    read_extra_fields(Entry& entry, const char* data, ullong start, uint extra_field_len) {
        
        // Vars.
        ullong pos = start;
        ullong end_extra_field = pos + extra_field_len;
        uint16_t extra_field_signature;
        
        // Loop.
        while (pos < end_extra_field) {
            
            // Signature.
            extra_field_signature = *((uint16_t*) &data[pos]);
            
            // Info-ZIP Unix Extra Field (type 2).
            if (extra_field_signature == extf_unix2_signature) {
            
                // Signature.
                pos += sizeof(uint16_t);
            
                // Size.
                // uint16_t size = *((uint16_t*) &data[pos]);
                pos += sizeof(uint16_t);
            
                // Parse.
                entry.uid = *((uint16_t*) &data[pos]);
                pos += sizeof(uint16_t);
                entry.gid = *((uint16_t*) &data[pos]);
                pos += sizeof(uint16_t);
            
            }
            
            // ZIP64 extended information extra field.
            else if (extra_field_signature == extf_zip64_signature) {
                
                // Signature.
                pos += sizeof(uint16_t);
                
                // Size.
                uint16_t size = *((uint16_t*) &data[pos]);
                pos += sizeof(uint16_t);
                
                // Parse.
                if (size > 0 && entry.uncompressed_len == UINT32_MAX) {
                    entry.uncompressed_len = *((uint64_t*) &data[pos]);
                    pos += sizeof(uint64_t);
                    size -= sizeof(uint64_t);
                }
                if (size > 0 && entry.compressed_len == UINT32_MAX) {
                    entry.compressed_len = *((uint64_t*) &data[pos]);
                    pos += sizeof(uint64_t);
                    size -= sizeof(uint64_t);
                }
                if (size > 0 && entry.offset == UINT32_MAX) {
                    entry.offset = *((uint64_t*) &data[pos]);
                    pos += sizeof(uint64_t);
                    size -= sizeof(uint64_t);
                }
                
            }
            
            // Unsupported or end.
            else {
                ++pos;
            }
        }
    }
    
    // Get a File or Stream offset.
    static
    ullong  offset(File& stream) {
        return ftell(stream.file());
    }
    template <typename StreamType> static
    ullong  offset(vlib::Stream<StreamType>& stream) {
        return stream.len();
    }
    
    // Find entry.
    template <typename A, typename T> static constexpr
    auto&   find_entry(A& archive, const T& to_match) {
        for (auto& entry: archive.entries) {
            if (entry == to_match) {
                return entry;
            }
        }
        throw EntryNotFoundError(entry_not_found_err);
        return archive.entries[0];
    }
    
// Public.
public:
    
    // ---------------------------------------------------------
    // Static vars.
    
    // Exception ids.
    static const ExceptionID entry_not_found_err;
    
    // Signatures.
    SICE uint32_t   header_signature = 0x04034b50;
    SICE uint32_t   cd_header_signature = 0x02014b50;
    SICE uint32_t   eocd_signature = 0x06054b50;
    SICE uint32_t   eocd64_signature = 0x06064b50;
    SICE uint32_t   eocl64_signature = 0x07064b50;
    SICE uint16_t   extf_zip64_signature = 0x0001;
    SICE uint16_t   extf_unix2_signature = 0x7855;
    
    // ---------------------------------------------------------
    // Constructor.

    // Default constructor.
    constexpr
    Zip() = default;

    // ---------------------------------------------------------
    // Attributes.
    
    // Add a file to an archive.
    /*  @docs {
     *  @title: Compression Level
     *  @description:
     *      Get the underlying compression level attribute.
     *  @attribute: true
     *  @usage:
     *      vlib::Zip zip;
     *      zip.compression_level() = ...;
     } */
    constexpr auto& compression_level() { return m_compression.level(); }
    constexpr auto& compression_level() const { return m_compression.level(); }
    
    // Get all entries.
    /*  @docs {
     *  @title: Entries
     *  @description:
     *      Get all the file names from the archive.
     *
     *      The archive must have been initialized by one of the `Zip` member functions. For example `read()`.
     *  @attribute: true
     *  @type:
     *      Array<Zip::Entry>&
     *  @usage:
     *      // Read a zip archive.
     *      vlib::Zip zip;
     *      zip.read("/tmp/archive.zip");
     *
     *      // Get the entries.
     *      for (auto& entry: zip.entries()) {
     *          print(entry.name);
     *      }
     } */
    constexpr auto& entries() { return m_archive.entries; }
    constexpr auto& entries() const { return m_archive.entries; }
    
    // Get all the file names.
    /*  @docs {
     *  @title: File names
     *  @description:
     *      Get all the file names from the archive.
     *
     *      The archive must have been initialized by one of the `Zip` member functions. For example `read()`.
     *  @warning:
     *      It is much faster to iterate the entries with `entries()`. Since `file_names()` creates a copy of each file name.
     *  @usage:
     *      // Read a zip archive.
     *      vlib::Zip zip;
     *      zip.read("/tmp/archive.zip");
     *
     *      // Iterate the files names.
     *      // Not recommended since it copies each file name.
     *      for (auto& name: zip.file_names()) {
     *          print(name);
     *      }
     *
     *      // Recommended version:
     *      for (auto& entry: zip.entries()) {
     *          print(entry.name);
     *      }
     } */
    constexpr
    Array<String> file_names() const {
        Array<String> names;
        for (auto& entry: m_archive.entries) {
            names.append(entry.name);
        }
        return names;
    }
    
    // ---------------------------------------------------------
    // Functions.

    // Reset the attributes.
    /*  @docs {
     *  @title: Reset
     *  @description:
     *      Reset all attributes.
     *  @type:
     *      Zip&
     *  @usage:
     *      vlib::Zip zip;
     *      zip.add("file1", "/tmp/dir/file1");
     *      zip.reset();
     *      ...
     } */
    auto&   reset() {
        m_archive = {};
        m_compression.level() = Z_BEST_COMPRESSION;
        return *this;
    }
    
    // Find an entry by offset.
    /*  @docs {
     *  @title: Find Entry
     *  @description:
     *      Find an entry by offset.
     *
     *      Throws an `EntryNotFoundError` when the entry is not found.
     *  @type:
     *      Zip::Entry&
     *  @parameter: {
     *      @name: offset
     *      @description: The offset of the entry.
     *  }
     *  @usage:
     *      vlib::Zip zip;
     *      zip.read("/tmp/archive.zip");
     *      vlib::Zip::Entry& entry = zip.find_entry_by_offset(0);
     } */
    auto&   find_entry_by_offset(uint64_t offset) {
        return find_entry(m_archive, offset);
    }
    auto&   find_entry_by_offset(uint64_t offset) const {
        return find_entry(m_archive, offset);
    }
    
    // Find an entry by name.
    /*  @docs {
     *  @title: Find Entry
     *  @description:
     *      Find an entry by name.
     *
     *      A name is often a subpath.
     *
     *      Throws an `EntryNotFoundError` when the entry is not found.
     *  @type:
     *      Zip::Entry&
     *  @parameter: {
     *      @name: name
     *      @description: The filename of the entry.
     *  }
     *  @usage:
     *      vlib::Zip zip;
     *      zip.read("/tmp/archive.zip");
     *      vlib::Zip::Entry& entry = zip.find_entry_by_offset("dir/myfile");
     } */
    auto&   find_entry_by_name(const String& name) {
        return find_entry(m_archive, name);
    }
    auto&   find_entry_by_name(const String& name) const {
        return find_entry(m_archive, name);
    }
    
    // Add a file to an archive.
    /*  @docs {
     *  @title: Add
     *  @description:
     *      Add a zip file to a new archive.
     *  @type:
     *      Zip&
     *  @parameter: {
     *      @name: name
     *      @description: The name of the file, should be the subpath to the absolute dir.
     *  }
     *  @parameter: {
     *      @name: path
     *      @description: The path to the file.
     *  }
     *  @usage:
     *      vlib::Zip zip;
     *      zip.add("file1", "/tmp/dir/file1");
     *      zip.add("dir/file2", "/tmp/dir/dir/file2");
     *  @funcs: 2
     } */
    auto&   add(const String& name, Path& path) {
		
		// Already compressed file extensions.
		static Array<String> compressed_file_extensions = {
			"zip", "7z", "rar", "gz", "bz2", "xz", "tar", "tgz", "tbz2", "txz",
			"jpg", "jpeg", "png", "gif", "bmp", "tif", "tiff", "webp",
			"mp3", "aac", "wav", "flac", "ogg", "wma",
			"mp4", "mkv", "avi", "mov", "wmv", "flv", "webm",
			"pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx",
			"exe", "dll", "so", "dylib", "jar",
			"apk", "ipa", "appx", "appxbundle",
			"iso", "img", "dmg",
			"ttf", "otf", "woff", "woff2",
			"swf", "svg",
			"db", "dbf", "mdb", "accdb", "sqlite", "xlsb",
			"ico", "cur",
			"xml", "json", "csv",
			"epub", "mobi",
			"psd", "ai",
			"log", "bak",
			"zipx", "lzma", "z", "arj", "lzh", "cab", "hqx", "sit", "sitx", "gz", "tgz",
			"bz2", "tbz", "tbz2", "xz", "txz", "lz", "tlz", "lzma", "tlzma", "lz4", "tlz4",
			"lzo", "tlzo", "sz", "tsz", "zst", "tzst", "zstd", "tzstd", "rar", "zoo",
			"iso", "img", "dmg", "vhd", "vmdk", "vdi", "hdd", "qcow", "qcow2",
			"ppt", "pptx", "pps", "ppsx", "pot", "potx", "odp", "otp",
			"xls", "xlsx", "xlm", "xlsm", "xlt", "xltx", "ods", "ots",
			"doc", "docx", "dot", "dotx", "odt", "ott",
			"msg", "pst", "eml",
			"swf", "fla",
			"max", "obj", "fbx", "3ds", "dae",
			"svg", "eps", "ai",
			"cdr", "cmx", "emf", "wmf",
			"exe", "dll", "sys", "ocx",
			"ttf", "otf", "fon",
			"avi", "wmv", "mpg", "mpeg", "mkv", "mp4", "m4v", "flv", "f4v",
			"vob", "mov", "3gp", "webm", "swf",
			"m4a", "aac", "mp3", "wav", "wma", "ogg", "flac", "alac", "aiff"
		};
        
		// Skip directories.
		if (path.is_dir()) {
			return *this;
		}
		
        // Check existance.
        if (!path.exists()) {
            throw FileNotFoundError("File \"", path, "\" does not exist.");
        }
        
        // UID and GUID.
        uint16_t uid = path.uid();
        uint16_t gid = path.gid();
        
        // Permission.
        struct stat stat_info;
        if (::lstat(path.c_str(), &stat_info) == -1) {
            throw ParseError(tostr("Unable to parse path \"", path, "\"."));
        }
        uint16_t mode = stat_info.st_mode;
        
        // Mod time and mod date.
        time_t sec = path.mtime() / 1000;
		struct tm time_info;
		localtime_r(&sec, &time_info);
        uint16_t mod_date = ((time_info.tm_year + 1900 - 1980) << 9) | ((time_info.tm_mon + 1) << 5) | time_info.tm_mday;
        uint16_t mod_time = (time_info.tm_hour << 11) | (time_info.tm_min << 5);
        
        // Data.
        String compressed;
        uint64_t uncompressed_len = 0;
		uint64_t compressed_len = 0;
		uint16_t compression_method = 0;
        
        // CRC.
        uint32_t crc = 0;
        
        // For files.
        if (!(stat_info.st_mode & S_IFDIR)) {
            String  data = path.load();
            uncompressed_len = data.len();
			crc = calc_crc32(data.data(), data.len());
			Bool do_not_compress = vlib::is_compressed(data) || uncompressed_len < 256 || compressed_file_extensions.contains(path.extension());
			
			// Do not compress.
			if (do_not_compress) {
				compressed = move(data);
				compressed_len = compressed.len();
				compression_method = 0;
			}
			
			// Compress.
			else {
				compressed = m_compression.compress(
					data.data(),
					data.len(),
					-15 // window bits should be -15 for raw deflate.
				);
				compressed_len = compressed.len();
				compression_method = 8; // deflate.
			}
        }
		// "data" is no longer accessable now.
        
        // Append.
        m_archive.entries.append(Entry{
            .offset = 0, // will be assigned later.
            .mode = mode,
            .uid = uid,
            .gid = gid,
            .mod_time = mod_time,
            .mod_date = mod_date,
			.compression_method = compression_method,
            .compressed_len = compressed_len,
            .uncompressed_len = uncompressed_len,
            .crc = (uint32_t) crc,
            .name = name,
            .data = compressed,
        });
        return *this;
    }
    auto&   add(const String& name, const Path& _path) {
        Path path = _path;
        return add(name, path);
    }
    
    // Write the archive to a stream or file.
    /*  @docs {
     *  @title: Write
     *  @description:
     *      Write the archive to a stream or file.
     *  @type:
     *      Zip&
     *  @parameter: {
     *      @name: stream
     *      @description: A `vlib::Stream` or `vlib::File` object to write the archive to.
     *  }
     *  @parameter: {
     *      @name: archive
     *      @description: The archive to write out.
     *  }
     *  @usage:
     *      // Create zip.
     *      vlib::Zip zip;
     *      zip.add("file1", "/tmp/dir/file1");
     *      zip.add("dir/file2", "/tmp/dir/dir/file2");
     *
     *      // Write to a file.
     *      vlib::File file ("/tmp/archive.zip");
     *      zip.write(file);
     *
     *      // Or write to a stream.
     *      vlib::Stream stream;
     *      zip.write(stream);
     } */
    template <typename Stream> requires (is_File<Stream>::value || is_Stream<Stream>::value)
    auto&   write(Stream& stream) {
        
        // Write files.
        for (auto& entry: m_archive.entries) {
            entry.offset = offset(stream);
            write_fheader(stream, entry);
        }
        
        // Write central dir.
        m_archive.cd_offset = offset(stream);
        for (auto& entry: m_archive.entries) {
            write_cdheader(stream, entry);
        }
        m_archive.eocd_offset = offset(stream);
        m_archive.cd_size = m_archive.eocd_offset - m_archive.cd_offset;
        
        // Write zip64 EOCD.
        write_eocd64(stream);
        
        // Write zip64 EOCL.
        write_eocl64(stream);
        
        // Write EOCD.
        write_eocd(stream);
        
        // Handler.
        return *this;
    }
    
    // Create zip archive and write to file.
    /*  @docs {
     *  @title: Create
     *  @description:
     *      Create a zip archive from a source file or directory and write it out to the destination path.
     *
     *      No other functions are required to create a zip archive when using this function.
     *  @type:
     *      Zip&
     *  @parameter: {
     *      @name: _source
     *      @description: The source file or directory.
     *  }
     *  @parameter: {
     *      @name: dest
     *      @description: The destination path of the created archive.
     *  }
	 *  @parameter: {
	 *      @name: exclude
	 *      @description: The sub paths to exclude.
	 *  }
	 *  @parameter: {
	 *      @name: exclude_names
	 *      @description: The full name of paths to exclude.
	 *  }
     *  @usage:
     *      vlib::Zip zip;
     *      zip.create("/tmp/dir/", "/tmp/zip.archive");
     } */
	auto&   create(
		const Path& _source,
		const Path& dest,
		const Array<String>& exclude = {},
		const Array<String>& exclude_names = {}
	) {
        
        // Reset.
        reset();
        
        // Vars.
        Path                source = _source; // Make non const for certain funcs
        File                file (dest, vlib::file::mode::write);
        
		// Check source.
		if (!source.exists()) {
			throw FileNotFoundError("Source file \"", source, "\" does not exist.");
		}
		
        // Remove and create.
        if (dest.exists()) {
            dest.remove();
        }
        
        // Open file.
        file.open();
        
        // Path is a file.
        if (source.is_file()) {
            add(source.full_name(), source);
        }
        
        // Path is a dir.
        else {
            const ullong sub_path_slice = source.len() - source.full_name().len();
            for (auto& path: source.paths(true, exclude, exclude_names)) {
                add(path.slice(sub_path_slice), path);
            }
        }
        
        // Write the archive.
        write(file);
        
        // Flush to file.
        file.flush();
        
        // Close.
        file.close();
		
		// Set permissions.
		// Path::chmod(dest.c_str(), 0770);
        
        // Handler.
        return *this;
        
    }
    
    // Create zip archive and write to a stream.
    /*  @docs {
     *  @title: Create
     *  @description:
     *      Create a zip archive from a source file or directory and write it out to a stream.
     *
     *      No other functions are required to create a zip archive when using this function.
     *  @type:
     *      Stream
     *  @parameter: {
     *      @name: _source
     *      @description: The source file or directory.
     *  }
	 *  @parameter: {
	 *      @name: exclude
	 *      @description: The sub paths to exclude.
	 *  }
	 *  @parameter: {
	 *      @name: exclude_names
	 *      @description: The full name of paths to exclude.
	 *  }
     *  @usage:
     *      vlib::Zip zip;
     *      vlib::Stream stream = zip.create("/tmp/dir/");
     } */
    template <typename Stream> requires (is_Stream<Stream>::value)
    Stream  create(
		const Path& _source,
		const Array<String>& exclude = {},
		const Array<String>& exclude_names = {}
	) {
        
        // Reset.
        reset();
        
        // Vars.
        Path source = _source; // Make non const for certain funcs
        Stream stream;
        
        // Check.
        if (!source.exists()) {
            throw FileNotFoundError("Source file \"", source, "\" does not exist.");
        }
        
        // Path is a file.
        if (source.is_file()) {
            add(source.full_name(), source);
        }
        
        // Path is a dir.
        else {
			const ullong sub_path_slice = source.len() - source.full_name().len();
            for (auto& path: source.paths(true, exclude, exclude_names)) {
                add(path.slice(sub_path_slice), path);
            }
        }
        
        // Write the archive.
        write(stream);
        
        // Handler.
        return stream;
    }

    // Read a zip archive.
    /*  @docs {
     *  @title: Read
     *  @description:
     *      Read a zip archive.
     *  @type:
     *      Zip&
     *  @parameter: {
     *      @name: path
     *      @description: The path to the archive to read.
     *  }
     *  @usage:
     *      vlib::Zip zip;
     *      zip.read("/tmp/archive.zip");
     } */
    auto&   read(const Path& path) {
        
        // Reset.
        reset();
        
        // Vars.
        Archive archive;
        
        // Load data.
        String file = path.load();
        const char* data = file.data();
        ullong& len = file.len();
        
        // Iterate.
        ullong pos = 0;
        while (pos + sizeof(uint32_t) <= len) {
            
            // Signature var (when present).
            const uint32_t signature = *((uint32_t*) &data[pos]);
            
            // File header.
            if (signature == header_signature) {
                Entry entry;
                pos += read_fheader(entry, data, pos) - 1;
                archive.entries.append(move(entry));
            }
            
            // Central dir header.
            else if (signature == cd_header_signature) {
                Entry entry;
                pos += read_cdheader(entry, data, pos) - 1;
                
                // Set the fields from archive that are only present in the cd header.
                Entry& archive_entry = find_entry(archive, entry.offset);
                archive_entry.mode = entry.mode;
            }
            
            // End of 64 central dir record.
            else if (signature == eocd64_signature) {
                pos += read_eocd64(archive, data, pos);
            }
            
            // End of 64 central dir locator.
            else if (signature == eocl64_signature) {
                pos += read_eocl64(archive, data, pos);
            }
            
            // End of central dir record.
            else if (signature == eocd_signature) {
                pos += read_eocd(archive, data, pos);
            }
            
            // Increment pos.
            pos += 1;
        }
        
        // Assign.
        m_archive = archive;
        
        // Handler.
        return *this;
        
    }
    
    // Extract an entry.
    /*  @docs {
     *  @title: Extract
     *  @description:
     *      Extract a zip entry.
     *  @type:
     *      Zip&
     *  @parameter: {
     *      @name: dest
     *      @description: The destination path to where the entry will be written to.
     *  }
     *  @usage:
     *      vlib::Zip zip;
     *      zip.read("/tmp/archive.zip");
     *      vlib::Zip::Entry& entry = zip.entries()[0];
     *      zip.extract("/tmp/myfile", entry);
     *  @funcs: 2
     } */
    auto&    extract(Path& dest, const Entry& entry) const {
        
        // Directory
        if (entry.is_dir()) {
            dest.mkdir();
        }
        
        // Non directory.
        else {
            
            // Decompress.
            String data;
            if (entry.compressed_len == 0) {
                data = entry.data;
            } else {
                data = m_compression.decompress(entry.data.data(), entry.data.len(), -15);
            }
            
            // Check crc.
            if (entry.crc != 0) {
                uint32_t crc = calc_crc32(data.data(), data.len());
                if (crc != entry.crc) {
                    throw CRCError("Invalid CRC-32 \"", crc, "\", should be \"", entry.crc, "\".");
                }
            }
            
            // Write.
            dest.save(data);
            
        }
        
        // Set mtime.
        time_t mtime = entry.mtime().value();
        dest.set_time(mtime, mtime);
        
        // Set permission.
        ushort permission = entry.permission().value();
        dest.chmod(permission);
        
        // Set uid & gid.
        dest.chown(entry.uid, entry.gid);
        
        // Handler.
        return *this;
        
    }
    auto&    extract(const Path& _dest, const Entry& entry) const {
        Path dest = _dest;
        return extract(dest, entry);
    }
    
    // Extract a zip archive.
    /*  @docs {
     *  @title: Extract
     *  @description:
     *      Extract a zip archive.
     *
     *      A `FileAlreadyExists` exception will be thrown if the destination path already exists.
     *  @type:
     *      Zip&
     *  @parameter: {
     *      @name: dest
     *      @description: The destination path of the extracted zip.
     *  }
     *  @usage:
     *      vlib::Zip zip;
     *      zip.read("/tmp/archive.zip");
     *      zip.extract("/tmp/extract")
     } */
    auto&   extract(const Path& _dest) const {
        
        // Vars.
        Path dest = _dest;
        
        // Create dest dir.
        if (!dest.exists()) {
            dest.mkdir();
        } else {
            throw FileAlreadyExistsError("Destination path \"", dest, "\" already exists.");
        }
        
        // Iterate entries.
        Path entry_dest, entry_dest_base;
        for (auto& entry: m_archive.entries) {
            
            // Skip paths that start with "__MACOS/" since macos archives uses this for additional info.
            if (entry.name.eq_first("__MACOSX/", 8)) {
                continue;
            }
            
            // Dest path.
            entry_dest = dest.join(entry.name);
            
            // Create base.
            entry_dest_base = entry_dest.base();
            entry_dest_base.mkdir_p();
            
            // Extract.
            extract(entry_dest, entry);
        }
        
        // Handler.
        return *this;
        
    }
    
};

// ---------------------------------------------------------
// Exceptions.

const ExceptionID Zip::entry_not_found_err = "Unable to find an entry that matches the search parameters.";

// ---------------------------------------------------------
// Instances.

// Is instance.
template<>                 struct is_instance<Zip, Zip>    { SICEBOOL value = true;  };

// Is type.
template<typename Type>    struct is_Zip                     { SICEBOOL value = false; };
template<>                 struct is_Zip<Zip>                 { SICEBOOL value = true;  };

};         // End namespace vlib.
#endif     // End header.
