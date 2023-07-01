// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

// Header.
#ifndef VLIB_EXCEPTIONS_H
#define VLIB_EXCEPTIONS_H

// Namespace vlib.
namespace vlib {

// Create exception macro.
#define CREATE_EXCEPTION(name, strname) \
struct name : public vlib::Exception { \
    static excid_t type_id; \
    \
    constexpr \
    name(const ullong& err_id) : \
    vlib::Exception(type_id, err_id) {} \
    \
    constexpr \
    name(const vlib::ExceptionID& err_id) : \
    vlib::Exception(type_id, err_id.id) {} \
    \
    constexpr \
    name(const char* message) : \
    vlib::Exception(strname, message) {} \
    \
    constexpr \
    name(const String& message) : \
    vlib::Exception(strname, message) {} \
    \
    constexpr \
    name(String&& message) : \
    vlib::Exception(strname, message) {} \
    \
    template <typename Arg1, typename Arg2, typename... Args> \
    requires (!vlib::is_any_numeric<Arg1>::value || !vlib::is_any_numeric<Arg2>::value) \
    constexpr \
    name (const Arg1& arg1, const Arg2& arg2, Args&&... args) : \
    vlib::Exception(strname, arg1, arg2, args...) {} \
    \
    constexpr \
    name(const name& obj) : \
    vlib::Exception(static_cast<const Exception&>(obj)) {} \
    \
    constexpr \
    name(name&& obj) : \
    vlib::Exception(static_cast<Exception&&>(obj)) {} \
}; \
excid_t name::type_id = vlib::exceptions::add_type(strname); \

// template <typename Arg1, typename Arg2> \
// name(const Arg1& arg1, const Arg2& arg2) : \
// vlib::Exception(strname, arg1, arg2) {} \

// Add exception to shortcuts macro.
#define SHORTCUT_EXCEPTION(name) \
namespace shortcuts { \
namespace exceptions { \
using name = vlib::name; \
}}

struct InvalidUsageError; CREATE_EXCEPTION(InvalidUsageError, "InvalidUsageError"); SHORTCUT_EXCEPTION(InvalidUsageError);
struct IndexError; CREATE_EXCEPTION(IndexError, "IndexError"); SHORTCUT_EXCEPTION(IndexError);
struct KeyError; CREATE_EXCEPTION(KeyError, "KeyError"); SHORTCUT_EXCEPTION(KeyError);
struct TypeError; CREATE_EXCEPTION(TypeError, "TypeError"); SHORTCUT_EXCEPTION(TypeError);
struct AllocError; CREATE_EXCEPTION(AllocError, "AllocError"); SHORTCUT_EXCEPTION(AllocError);

struct OSError; CREATE_EXCEPTION(OSError, "OSError"); SHORTCUT_EXCEPTION(OSError);

struct PointerError; CREATE_EXCEPTION(PointerError, "PointerError"); SHORTCUT_EXCEPTION(PointerError);
struct CreateError; CREATE_EXCEPTION(CreateError, "CreateError"); SHORTCUT_EXCEPTION(CreateError);
struct RemoveError; CREATE_EXCEPTION(RemoveError, "RemoveError"); SHORTCUT_EXCEPTION(RemoveError);
struct DeleteError; CREATE_EXCEPTION(DeleteError, "DeleteError"); SHORTCUT_EXCEPTION(DeleteError);
struct AddError; CREATE_EXCEPTION(AddError, "AddError"); SHORTCUT_EXCEPTION(AddError);
struct OpenError; CREATE_EXCEPTION(OpenError, "OpenError"); SHORTCUT_EXCEPTION(OpenError);
struct ReadError; CREATE_EXCEPTION(ReadError, "ReadError"); SHORTCUT_EXCEPTION(ReadError);
struct WriteError; CREATE_EXCEPTION(WriteError, "WriteError"); SHORTCUT_EXCEPTION(WriteError);
struct FlushError; CREATE_EXCEPTION(FlushError, "FlushError"); SHORTCUT_EXCEPTION(FlushError);
struct SyncError; CREATE_EXCEPTION(SyncError, "SyncError"); SHORTCUT_EXCEPTION(SyncError);
struct CopyError; CREATE_EXCEPTION(CopyError, "CopyError"); SHORTCUT_EXCEPTION(CopyError);
struct MoveError; CREATE_EXCEPTION(MoveError, "MoveError"); SHORTCUT_EXCEPTION(MoveError);
struct ScanError; CREATE_EXCEPTION(ScanError, "ScanError"); SHORTCUT_EXCEPTION(ScanError);
struct LinkError; CREATE_EXCEPTION(LinkError, "LinkError"); SHORTCUT_EXCEPTION(LinkError);
struct FileNotFoundError; CREATE_EXCEPTION(FileNotFoundError, "FileNotFoundError"); SHORTCUT_EXCEPTION(FileNotFoundError);
struct FileAlreadyExistsError; CREATE_EXCEPTION(FileAlreadyExistsError, "FileAlreadyExistsError"); SHORTCUT_EXCEPTION(FileAlreadyExistsError);
struct TimeoutError; CREATE_EXCEPTION(TimeoutError, "TimeoutError"); SHORTCUT_EXCEPTION(TimeoutError);
struct BufferOverflow; CREATE_EXCEPTION(BufferOverflow, "BufferOverflow"); SHORTCUT_EXCEPTION(BufferOverflow);

struct DuplicateError; CREATE_EXCEPTION(DuplicateError, "DuplicateError"); SHORTCUT_EXCEPTION(DuplicateError);

struct ParseError; CREATE_EXCEPTION(ParseError, "ParseError"); SHORTCUT_EXCEPTION(ParseError);

struct EnvironmentError; CREATE_EXCEPTION(EnvironmentError, "EnvironmentError"); SHORTCUT_EXCEPTION(EnvironmentError);

struct PermissionError; CREATE_EXCEPTION(PermissionError, "PermissionError"); SHORTCUT_EXCEPTION(PermissionError);

struct InvalidGIDError; CREATE_EXCEPTION(InvalidGIDError, "InvalidGIDError"); SHORTCUT_EXCEPTION(InvalidGIDError);
struct InvalidUIDError; CREATE_EXCEPTION(InvalidUIDError, "InvalidUIDError"); SHORTCUT_EXCEPTION(InvalidUIDError);
struct GenerateUIDError; CREATE_EXCEPTION(GenerateUIDError, "GenerateUIDError"); SHORTCUT_EXCEPTION(GenerateUIDError);
struct SetPasswordError; CREATE_EXCEPTION(SetPasswordError, "SetPasswordError"); SHORTCUT_EXCEPTION(SetPasswordError);
struct PromptPasswordError; CREATE_EXCEPTION(PromptPasswordError, "PromptPasswordError"); SHORTCUT_EXCEPTION(PromptPasswordError);

struct DimensionError; CREATE_EXCEPTION(DimensionError, "DimensionError"); SHORTCUT_EXCEPTION(DimensionError);

struct ThreadError; CREATE_EXCEPTION(ThreadError, "ThreadError"); SHORTCUT_EXCEPTION(ThreadError);
struct MutexError; CREATE_EXCEPTION(MutexError, "MutexError"); SHORTCUT_EXCEPTION(MutexError);
struct LockError; CREATE_EXCEPTION(LockError, "LockError"); SHORTCUT_EXCEPTION(LockError);
struct UnlockError; CREATE_EXCEPTION(UnlockError, "UnlockError"); SHORTCUT_EXCEPTION(UnlockError);
struct StartError; CREATE_EXCEPTION(StartError, "StartError"); SHORTCUT_EXCEPTION(StartError);
struct JoinError; CREATE_EXCEPTION(JoinError, "JoinError"); SHORTCUT_EXCEPTION(JoinError);
struct DetachError; CREATE_EXCEPTION(DetachError, "DetachError"); SHORTCUT_EXCEPTION(DetachError);
struct SignalError; CREATE_EXCEPTION(SignalError, "SignalError"); SHORTCUT_EXCEPTION(SignalError);
struct KillError; CREATE_EXCEPTION(KillError, "KillError"); SHORTCUT_EXCEPTION(KillError);

struct SerialError; CREATE_EXCEPTION(SerialError, "SerialError"); SHORTCUT_EXCEPTION(SerialError);

struct ShapeError; CREATE_EXCEPTION(ShapeError, "ShapeError"); SHORTCUT_EXCEPTION(ShapeError);

struct GenerateSaltError; CREATE_EXCEPTION(GenerateSaltError, "GenerateSaltError"); SHORTCUT_EXCEPTION(GenerateSaltError);
struct GenerateIVError; CREATE_EXCEPTION(GenerateIVError, "GenerateIVError"); SHORTCUT_EXCEPTION(GenerateIVError);
struct GenerateKeyError; CREATE_EXCEPTION(GenerateKeyError, "GenerateKeyError"); SHORTCUT_EXCEPTION(GenerateKeyError);
struct EncryptError; CREATE_EXCEPTION(EncryptError, "EncryptError"); SHORTCUT_EXCEPTION(EncryptError);
struct DecryptError; CREATE_EXCEPTION(DecryptError, "DecryptError"); SHORTCUT_EXCEPTION(DecryptError);

struct SignError; CREATE_EXCEPTION(SignError, "SignError"); SHORTCUT_EXCEPTION(SignError);
struct HashError; CREATE_EXCEPTION(HashError, "HashError"); SHORTCUT_EXCEPTION(HashError);

struct RSAError; CREATE_EXCEPTION(RSAError, "RSAError"); SHORTCUT_EXCEPTION(RSAError);

struct LimitError; CREATE_EXCEPTION(LimitError, "LimitError"); SHORTCUT_EXCEPTION(LimitError);
struct DeflateError; CREATE_EXCEPTION(DeflateError, "DeflateError"); SHORTCUT_EXCEPTION(DeflateError);
struct InflateError; CREATE_EXCEPTION(InflateError, "InflateError"); SHORTCUT_EXCEPTION(InflateError);
struct CompressionError; CREATE_EXCEPTION(CompressionError, "CompressionError"); SHORTCUT_EXCEPTION(CompressionError);

struct EntryNotFoundError; CREATE_EXCEPTION(EntryNotFoundError, "EntryNotFoundError"); SHORTCUT_EXCEPTION(EntryNotFoundError);
struct CRCError; CREATE_EXCEPTION(CRCError, "CRCError"); SHORTCUT_EXCEPTION(CRCError);

struct SocketError; CREATE_EXCEPTION(SocketError, "SocketError"); SHORTCUT_EXCEPTION(SocketError);
struct SetOptionError; CREATE_EXCEPTION(SetOptionError, "SetOptionError"); SHORTCUT_EXCEPTION(SetOptionError);
struct LookupError; CREATE_EXCEPTION(LookupError, "LookupError"); SHORTCUT_EXCEPTION(LookupError);
struct CloseError; CREATE_EXCEPTION(CloseError, "CloseError"); SHORTCUT_EXCEPTION(CloseError);
struct SocketClosedError; CREATE_EXCEPTION(SocketClosedError, "SocketClosedError"); SHORTCUT_EXCEPTION(SocketClosedError);
struct PollError; CREATE_EXCEPTION(PollError, "PollError"); SHORTCUT_EXCEPTION(PollError);
struct BindError; CREATE_EXCEPTION(BindError, "BindError"); SHORTCUT_EXCEPTION(BindError);
struct ListenError; CREATE_EXCEPTION(ListenError, "ListenError"); SHORTCUT_EXCEPTION(ListenError);
struct AcceptError; CREATE_EXCEPTION(AcceptError, "AcceptError"); SHORTCUT_EXCEPTION(AcceptError);
struct ConnectError; CREATE_EXCEPTION(ConnectError, "ConnectError"); SHORTCUT_EXCEPTION(ConnectError);
struct BrokenPipeError; CREATE_EXCEPTION(BrokenPipeError, "BrokenPipeError"); SHORTCUT_EXCEPTION(BrokenPipeError);

struct RateLimitExceeded; CREATE_EXCEPTION(RateLimitExceeded, "RateLimitExceeded"); SHORTCUT_EXCEPTION(RateLimitExceeded);

struct TLSError; CREATE_EXCEPTION(TLSError, "TLSError"); SHORTCUT_EXCEPTION(TLSError);
struct TLSVersionError; CREATE_EXCEPTION(TLSVersionError, "TLSVersionError"); SHORTCUT_EXCEPTION(TLSVersionError);

struct SMTPError; CREATE_EXCEPTION(SMTPError, "SMTPError"); SHORTCUT_EXCEPTION(SMTPError);

struct DaemonError; CREATE_EXCEPTION(DaemonError, "DaemonError"); SHORTCUT_EXCEPTION(DaemonError);

struct ConfigError; CREATE_EXCEPTION(ConfigError, "ConfigError"); SHORTCUT_EXCEPTION(ConfigError);

struct CudaError; CREATE_EXCEPTION(CudaError, "CudaError"); SHORTCUT_EXCEPTION(CudaError);

struct UserDoesNotExistError; CREATE_EXCEPTION(UserDoesNotExistError, "UserDoesNotExistError"); SHORTCUT_EXCEPTION(UserDoesNotExistError);

}; 		// End namespace vlib.
#endif 	// End header.
