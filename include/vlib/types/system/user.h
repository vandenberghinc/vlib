// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

// Header.
#ifndef VLIB_USER_T_H
#define VLIB_USER_T_H

// Includes.
#include <sys/types.h>
#include <sys/errno.h>
#include <pwd.h>
#include <unistd.h>
#if OSID <= 0 || OSID >= 4
	#include <shadow.h>
	#include <crypt.h>
#endif

// Namespace vlib.
namespace vlib {

// ---------------------------------------------------------
// User type
/* 	@docs {
	@chapter: system
	@title: User
	@description:
		User type.
	@usage:
        #include <vlib/types.h>
		vlib::User root0(0);
        vlib::User root1("root");
} */
// @TODO should generate scripts and save them to the /tmp/, since calling Script everytime is super super super dumb.
// @TODO convert raw pointers to Ptr.
struct User {

// Private.
private:
	
	// ---------------------------------------------------------
	// Aliases.
	
	using 		This = 		User;
	
	// ---------------------------------------------------------
	// Attributes.
	
	int 			m_uid;
	int 			m_gid;
	String			m_name;
	String			m_pass;
	String	        m_home;
	char* 			m_buff = nullptr;
	
	// Wrapper function for getpwuid.
	// - Causes undefined behaviour when the wrapper function is called for another user then the initialized user.
	static inline
	int 	getpwuid_wrapper(const uint& uid, struct passwd& pwd, char*& buff, const bool& throw_exceptions = false) {
		struct passwd *result;
		long bufsize;
		int s;
		bufsize = sysconf(_SC_GETPW_R_SIZE_MAX);
		if (bufsize == -1) {          /* Value was indeterminate */
			bufsize = 16384;        /* Should be more than enough */
		}
		delete[] buff;
		buff = new char [(ulong) bufsize];
		s = getpwuid_r(uid, &pwd, buff, (size_t) bufsize, &result);
		endpwent();
		if (result == NULL) {
			if (!throw_exceptions) { return -1; }
			if (s == 0) {
				throw ParseError(tostr("Unable to find user \"", uid, "\"."));
			} else {
				throw ParseError(tostr("Unknown error [errno: ", errno, "]."));
			}
		}
		return 0;
	}
		
	// Wrapper function for getpwnam.
	// - Causes undefined behaviour when the wrapper function is called for another user then the initialized user.
	static inline
	int 	getpwnam_wrapper(const char* username, struct passwd& pwd, char*& buff, const bool& throw_exceptions = false) {
		struct passwd *result;
		long bufsize;
		int s;
		bufsize = sysconf(_SC_GETPW_R_SIZE_MAX);
		if (bufsize == -1) {          /* Value was indeterminate */
			bufsize = 16384;        /* Should be more than enough */
		}
		delete[] buff;
		buff = new char [(ulong) bufsize];
		s = getpwnam_r(username, &pwd, buff, (size_t) bufsize, &result);
		endpwent();
		if (result == NULL) {
			if (!throw_exceptions) { return -1; }
			if (s == 0) {
				throw ParseError(tostr("Unable to find user \"", username, "\"."));
			} else {
				throw ParseError(tostr("Unknown error [errno: ", errno, "]."));
			}
		}
		return 0;
	}
	
	// Wrapper function for getspnam.
	// - Can not use a reference to spwd since that causes a bug.
	// - Causes undefined behaviour when the wrapper function is called for another user then the initialized user.
	#if OSID <= 0 || OSID >= 4
	static inline
	int 	getspnam_wrapper(const char* username, struct spwd& pwd, char*& buff, const bool& throw_exceptions = false) {
		endpwent();
		struct spwd *result;
		long bufsize;
		bufsize = sysconf(_SC_GETPW_R_SIZE_MAX);
		if (bufsize == -1) {          	/* Value was indeterminate */
			bufsize = 16384;        	/* Should be more than enough */
		}
		delete[] buff;
		buff = new char [(ulong) bufsize];
		getspnam_r(username, &pwd, buff, (size_t) bufsize, &result);
		endspent();
		if (result == NULL) {
			if (!throw_exceptions) { return -1; }
			if (errno == EACCES) {
				throw PermissionError(tostr("No permission to read the shadow password file [errno: ", errno, "]."));
			} else {
				throw PermissionError(tostr("Failed to read the shadow password file [errno: ", errno, "]."));
			}
		}
		return 0;
	}
	#endif

	// Crypt wrapper for a new user, with salt.
	// static inline
	// char* 	generate_salt(void*& salt, const uint& len = 16) {
	// 	constexpr char* chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789./";
	// 	salt = new char [len + 1];
	// 	random::random_seed();
	// 	for (uint i = 0; i < length; ++i) {
	// 		salt[i] = chars[random::generate(0, 63)];
	// 	}
	// 	salt[len] = '\0';
	// }
		
	// Parse.
	bool 	parse() {
		struct passwd pass;
		if (getpwuid_wrapper((uint) m_uid, pass, m_buff, true) == 0) {
			m_gid = (int) pass.pw_gid;
			m_name = pass.pw_name;
			m_pass = pass.pw_passwd;
			m_home = pass.pw_dir;
			return true;
		}
		return false;
	}
	constexpr
	bool 	safe_parse() {
		if (m_name.is_undefined()) { return parse(); }
		return true;
	}
	
	// Set the user's password.
	// - Requires root priviliges.
	#if OSID <= 0 || OSID >= 4
	template <typename Proc, typename Script>
	void 	set_pass_h(
		const String& 	pass					// the password.
	) {
		
		// Parse.
		if (!safe_parse()) {
            throw InvalidUIDError(tostr("Invalid user id \"", m_uid, "\"."));
		}
		
		// Encrypt the password.
        String encrypted = encrypt_pass(pass);

		// Create script.
		Script script (
			 // Stop on error.
			 "set -e",

			 // Check root permission.
			 "if [[ `id -u` != 0 ]]; then",
				 "echo \"Setting the password of a user requires root priviliges [uid: $(id -u)].\"",
				 "exit 1",
			 "fi",

			 // Create the user.
			 tostr("usermod -p ", encrypted, " ", m_name),

			 // Handler.
			 "exit 0"
		);

		// Execute script.
		Proc proc;
		proc.timeout = 5000;
        int status;
		if ((status = proc.execute(script)) != 0) {
            throw SetPasswordError(tostr("Unable to set the password for user \"", m_uid, "\"."));
		}
		if (proc.exit_status() != 0) {
            throw SetPasswordError(tostr("Unable to set the password for user \"", m_uid, "\"."));
		}

	}
	#endif

	// Create a user.
	// - Must be executed as user root.
	#if OSID <= 0 || OSID >= 4
	template <typename Proc, typename Script> SICE
	void 	create_h(
		const char* 	name,								// the username.
		const char* 	realname,							// the user's real name.
		const String&	pass,								// the user's password.
		const int& 		uid = 				-1,				// the user id (leave -1 to assign automatically).
		const int& 		gid = 				-1,				// the group id, the group must already exist (leave -1 to ignore).
		const bool&		superuser = 		false,			// whether to grant the new user root priviliges.
		const char* 	homes = 			"/home/",		// the homes path (base path of the direct path, not the direct path).
		const char* 	shell = 			"/bin/bash"		// the shell path.
	) {
		int status;
		
		// Encrypt the password.
        String encrypted = encrypt_new_pass(pass);

		// Vars.
		String command ("useradd", 7);
		command.concat_r(" --badnames", 11);
		command.concat_r(" -c \"", 5); command.concat_r(realname); command.append('\"');
		command.concat_r(" -e \"\"", 6); // do not expire.
		command.concat_r(" -b \"", 5); command.concat_r(homes); command.append('\"');
		command.concat_r(" -m", 3); // automatically create the user's home dir.
		command.concat_r(" -p \"", 5); command.concat_r(encrypted); command.append('\"');
		command.concat_r(" -s \"", 5); command.concat_r(shell); command.append('\"');
		command.concat_r(" -U", 3); // create a group with the same name as the user.
		if (superuser) { command.concat_r(" -G sudo", 8); }
		if (uid > 0) { command.concat_r(" -u ", 4); command.concat_r(uid); }
		if (gid > 0) { command.concat_r(" -g ", 4); command.concat_r(gid); }
		command.append(' ');
		command.concat_r(name);

		// Create script.
		Script script (
			 // Stop on error.
			 "set -e",

			 // Check root permission.
			 "if [[ `id -u` != 0 ]]; then",
				 "echo \"Creating a user requires root priviliges [uid: $(id -u)].\"",
				 "exit 1",
			 "fi",

			 // Create the user.
			 command.c_str(),

			 // Handler.
			 "exit 0"
		);

		// Execute script.
		Proc proc;
		proc.timeout = 5000;
		if ((status = proc.execute(script)) != 0) {
            throw CreateError(tostr("Unable create user \"", name, "\"."));
		}
		if (proc.exit_status() != 0) {
            throw CreateError(tostr("Unable create user \"", name, "\"."));
		}

	}
	#elif OSID == 1
	template <typename Proc, typename Script> SICE
	void 	create_h(
		const char* 	name,								// the username.
		const char* 	realname,							// the user's real name.
		const String&	pass,								// the user's password.
		const int& 		uid = 				-1,				// the user id (leave -1 to assign automatically).
		const int& 		gid = 				-1,				// the group id (leave -1 to assign automatically).
		const bool&		superuser = 		false,			// whether to grant the new user root priviliges.
		const char* 	homes = 			"/Users/",		// the homes path (base path of the direct path, not the direct path).
		const char* 	shell = 			"/bin/zsh"		// the shell path.
	) {
		// Sources:
		// * https://apple.stackexchange.com/questions/226073/how-do-i-create-user-accounts-from-the-terminal-in-mac-os-x-10-11
		// * https://gist.github.com/igorvoltaic/ff3eed83aa0c37a85d1802b4fa40609a

		// Vars.
		int status;
		Proc proc;
		int l_uid = uid;
		int l_gid = gid;
		const char* group;

		// User.
		if (l_uid == -1) {
			if ((status = proc.execute("dscl . list /Users UniqueID | awk '{print $2}' | sort -n | tail -1")) != 0) {
                throw GenerateUIDError("Unable generate a new user id.");
			}
			if (proc.exit_status() != 0) {
                throw GenerateUIDError("Unable generate a new user id.");
			}
			if (!proc.has_out()) {
                throw GenerateUIDError("Unable generate a new user id.");
			}
			proc.out().replace_end_r("\n");
			l_uid = tonumeric<int>(proc.out().data(), proc.out().len()) + 1;
			if (l_uid < 1000) { l_uid = 1000; }
		}

		// Group.
		if (superuser) { group = "wheel"; }
		else { group = "staff"; }
		if (l_gid == -1) {
			if (superuser) { l_gid = 0; }
			else { l_gid = 20; }
		}

		// Create the script.
		Script script (
						 // Stop on error.
						 "set -e",

						 // Arguments.
						 tostr("UserName=\"", name, "\""),
						 tostr("RealName=\"", realname, "\""),
						 tostr("UserID=\"", l_uid, "\""),
						 tostr("GroupID=\"", l_gid, "\""),
						 tostr("UserShell=\"", shell, "\""),
						 tostr("HomeDirectories=\"", homes, "/\""),

						 // Check root permission.
						 "if [[ `id -u` != 0 ]]; then",
							 "echo \"Creating a user requires root priviliges [uid: $(id -u)].\" 1>&2",
							 "exit 1",
						 "fi",

						 // Check if the user already exists.
						 "if [[ $UserName == `dscl . list /Users UniqueID | awk '{print $1}' | grep -w $UserName` ]]; then",
							 "echo \"User \\\"$UserName\\\" already exists.\" 1>&2",
							 "exit 1",
						 "fi",

						 // Create the user.
						 "dscl . create /Users/$UserName",
						 "dscl . create /Users/$UserName RealName $RealName",
						 tostr("dscl . passwd /Users/$UserName \"", pass.c_str(), "\""),
						 "dscl . create /Users/$UserName UniqueID $UserID",
						 "dscl . create /Users/$UserName PrimaryGroupID $GroupID",
						 "dscl . create /Users/$UserName UserShell $UserShell",
						 "dscl . create /Users/$UserName NFSHomeDirectory $HomeDirectories/$UserName",
						 tostr("dscl . -append /Groups/", group, " GroupMembership $UserName"),
						 "createhomedir -n $HomeDirectories -u $UserName -c",

						 // Handler.
						 "exit 0"
		);

		// Execute the script.
		proc.timeout = 5000;
		if ((status = proc.execute(script)) != 0) {
            throw CreateError(tostr("Unable create user \"", name, "\"."));
		}
		if (proc.exit_status() != 0) {
            throw CreateError(tostr("Unable create user \"", name, "\"."));
		}

	}
	#endif

	// Delete a user.
	// - Must be executed as user root.
	template <typename Proc, typename Script> constexpr
	void 	del_h() {
		int status;
		if (!safe_parse()) {
            throw InvalidUIDError(tostr("Invalid user id \"", m_uid, "\"."));
		}
		Proc proc { .timeout = 5000 };
		#if OSID <= 0 || OSID >= 4
			Script script (
							 // Stop on error.
							 "set -e",

							 // Variables.
							 tostr("UserName=\"", m_name, "\""),

							 // Check root permission.
							 "if [[ `id -u` != 0 ]]; then",
								 "echo \"Deleting a user requires root priviliges [uid: $(id -u)].\"",
								 "exit 1",
							 "fi",

							 // Delete the user.
							 "touch /var/mail/$UserName", // to silence the mail spoof not found error from userdel.
							 "userdel -f -r $UserName",

							 // Handler.
							 "exit 0"
			);
		#elif OSID == 1
			Script script (
							 // Stop on error.
							 "set -e",

							 // Variables.
							 tostr("UserName=\"", m_name, "\""),

							 // Check root permission.
							 "if [[ `id -u` != 0 ]]; then",
								 "echo \"Deleting a user requires root priviliges [uid: $(id -u)].\"",
								 "exit 1",
							 "fi",

							 // Check if the user exists.
							 "if [[ $UserName != `dscl . list /Users UniqueID | awk '{print $1}' | grep -w $UserName` ]]; then",
								 "echo \"User \\\"$UserName\\\" does not exist.\"",
								 "exit 2",
							 "fi",

							 // Delete the user.
							 "dscl . delete /Users/$UserName",
							 "sudo rm -fr $HomeDirectories/$UserName", // just to be sure.

							 // Handler.
							 "exit 0"
			);
		#endif

		// Execute the script.
		if ((status = proc.execute(script)) != 0) {
            throw DeleteError(tostr("Unable delete user \"", m_uid, "\"."));
		}
		if (proc.exit_status() != 0) {
            throw DeleteError(tostr("Unable delete user \"", m_uid, "\"."));
		}

	}
	
// Public.
public:
	
	// ---------------------------------------------------------
	// Construct functions.
	
	// Copy.
	constexpr
	auto&	copy(const This& obj) {
		m_uid = obj.m_uid;
		m_gid = obj.m_gid;
        m_name = obj.m_name;
        m_pass = obj.m_pass;
		m_home = obj.m_home;
		return *this;
	}

	// Swap.
	constexpr
	auto&	swap(This& obj) {
		m_uid = obj.m_uid;
		m_gid = obj.m_gid;
        m_name.swap(obj.m_name);
        m_pass.swap(obj.m_pass);
		m_home.swap(obj.m_home);
		return *this;
	}

	// ---------------------------------------------------------
	// Constructors.
	
	// Default constructor.
	constexpr
	User	() :
	m_uid(-1),
	m_gid(-1) {}
	
	// Constructor.
	/*  @docs {
		@title: Constructor
		@description:
			Construct from the user's id.
		@parameter: {
			@name: uid
			@description: The user's id.
		}
		@usage:
			vlib::User root(0);
	} */
	constexpr
	User	(const int& uid) :
	m_uid(uid),
	m_gid(-1) {}
	
	// Constructor from name.
	/*  @docs {
		@title: Constructor
		@description:
			Construct from the users's name.
		@warning:
			Throws an exception when the user does not exist, use `vlib::User::exists(const String&)` to check if the user exists.
		@parameter: {
			@name: name
			@description: The users's name.
		}
		@usage:
			vlib::User root("root");
		@funcs: 2
	} */
	User	(const String& name) {
		struct passwd pass;
		getpwnam_wrapper(name.c_str(), pass, m_buff, true);
		m_uid = (int) pass.pw_uid;
		m_gid = (int) pass.pw_gid;
		m_name = pass.pw_name;
		m_pass = pass.pw_passwd;
		m_home = pass.pw_dir;
	}
	User	(const char* name) {
		struct passwd pass;
		getpwnam_wrapper(name, pass, m_buff, true);
		m_uid = (int) pass.pw_uid;
		m_gid = (int) pass.pw_gid;
		m_name = pass.pw_name;
		m_pass = pass.pw_passwd;
		m_home = pass.pw_dir;
	}
	
	// Copy constructor.
	constexpr
	User	(const This& obj) :
	m_uid(obj.m_uid),
	m_gid(obj.m_gid),
	m_name(obj.m_name),
	m_pass(obj.m_pass),
	m_home(obj.m_home)
	{}
	
	// Move constructor.
	constexpr
	User	(This&& obj) :
	m_uid(obj.m_uid),
	m_gid(obj.m_gid),
	m_name(move(obj.m_name)),
	m_pass(move(obj.m_pass)),
	m_home(move(obj.m_home))
	{}
	
	// Destructor.
	constexpr
	~User	() {
		delete[] m_buff;
	}
	
	// ---------------------------------------------------------
	// Assignment operators.
	
	// Assignment operator.
	constexpr
	auto&	operator =(const int& uid) {
		m_uid = uid;
		m_gid = -1;
        m_name.reset();
        m_pass.reset();
		m_home.reset();
		return *this;
	}
	
	// Assignment operator from name.
	// - WARNING: throws an exception when the user name does not exist, use "User::exists(const char*)" to check if the user exists.
	auto&	operator =(const char* name) {
		struct passwd pass;
		getpwnam_wrapper(name, pass, m_buff, true);
		m_uid = (int) pass.pw_uid;
		m_gid = (int) pass.pw_gid;
		m_name = pass.pw_name;
		m_pass = pass.pw_passwd;
		m_home = pass.pw_dir;
		return *this;
	}
	
	// Copy assignment operator.
	constexpr
	auto&	operator =(const This& obj) {
		return copy(obj);
	}
	
	// Move assignment operator.
	constexpr
	auto&	operator =(This&& obj) {
		return swap(obj);
	}
	
	// ---------------------------------------------------------
	// Functions.
	
	// Copy the object.
	/* @docs {
	   @title: Copy
	   @description: Copy the object.
	} */
	constexpr
	auto 	copy() {
		return *this;
	}
	constexpr
	auto 	copy() const {
		return *this;
	}
	
	// Reset all attributes.
	/* @docs {
	   @title: Reset
	   @description: Reset all attributes.
	} */
	constexpr
	This& 	reset() {
		m_uid = -1;
		m_gid = -1;
        m_name.reset();
        m_pass.reset();
		m_home.reset();
		return *this;
	}
	
	// Is undefined.
	/* @docs {
	   @title: Is undefined
	   @description: Check if the object is undefined.
	   @usage:
			User x;
			x.is_undefined(); ==> true;
	} */
	constexpr
	bool 	is_undefined() const {
		return m_uid == -1;
	}
	
	// Is root.
	/* @docs {
	   @title: Is root
	   @description: Check if the user is root (uid: 0).
	   @usage:
			User x(0);
			x.is_root(); ==> true;
	} */
	constexpr
	bool 	is_root() const {
		return m_uid == 0;
	}
	
	// Get the uid.
	/* @docs {
	   @title: User id
	   @description: Get the user's id.
	} */
	constexpr
	auto& 	uid() const {
		return m_uid;
	}
	
	// Get the gid.
	/* @docs {
	   @title: Group id
	   @description: Get the group id of the user.
	} */
	constexpr
	auto& 	gid() {
		if (m_gid == -1) { parse(); }
		return m_gid;
	}
	
	// Get the user's name as string.
	/* @docs {
	   @title: Name
	   @description: Get the user's name as string.
	   @usage:
			User x(0);
			x.name(); ==> "root";
	} */
	constexpr
	auto& 	name() {
		if (m_name.is_undefined()) { parse(); }
		return m_name;
	}
	
	// Get the user's encrypted password string.
	/* docs {
	   @title: Password
	   @description: Get the user's encrypted password string.
	   @usage:
			User x(0);
			x.pass(); ==> "********";
	} */
	/*constexpr
	auto& 		pass() {
		if (m_pass.is_undefined()) { parse(); }
		return m_pass;
	}*/
	
	// Get the user's home directory as string.
	/* @docs {
	   @title: Home
	   @description: Get the user's home directory path as string.
	   @usage:
			User x(?);
			x.home(); ==> "/home/myuser/";
	} */
	constexpr
	auto& 	home() {
		if (m_home.is_undefined()) { parse(); }
		return m_home;
	}

	// Check if the user exists.
	/* @docs {
	   @title: Exists
	   @description: Check if the user exists.
	} */
	bool 	exists() { return parse(); }
	/* 	@docs {
		@title: Exists
		@description: Check if a user exists.
		@funcs: 3
	} */
	static inline
	bool 	exists(const String& name) {
		return exists(name.c_str());
	}
	static inline
	bool 	exists(const char* name) {
		struct passwd pass;
		char* buff = nullptr;
		bool s = getpwnam_wrapper(name, pass, buff) == 0;
		delete[] buff;
		return s;
	}
	static inline
	bool 	exists(const uint& uid) {
		struct passwd pass;
		char* buff = nullptr;
		bool s = getpwuid_wrapper(uid, pass, buff) == 0;
		delete[] buff;
		return s;
	}
	
	// Prompt a password input without echo.
	/* 	@docs {
		@title: Prompt password
		@description:
			Prompt a password input without echo.
	} */
	static inline
	String 	prompt_pass(const char* prompt = "Password:") {
        String output;
		char* pass;
		if ((pass = ::getpass(prompt)) == NULL) {
            throw PromptPasswordError("Encoutered an error while prompting the password.");
		}
		output = pass;
		return output;
	}

	// Encrypt a password for an existing user.
	#if OSID <= 0 || OSID >= 4
	/*  @docs {
		@title: Encrypt password
		@description:
			Encrypt a password for an existing user.
		@notes:
			- Not supported on `MacOS`.
		@parameter: {
			@name: pass
			@description: The unencrypted password string.
		}
		@usage:
			vlib::User root(0);
			vlib::String output = root.encrypt_pass("Hello World!");
	} */
	String 	encrypt_pass(const String&	pass) {
        
		// Parse the shadow file.
		struct spwd pwd;
		char* buff = nullptr;
		if (getspnam_wrapper(m_name.c_str(), pwd, buff) == -1) {
			delete[] buff;
            // if (errno == EACCES) {
            //     throw PromptPasswordError("Encoutered an error while prompting the password.");
            // } else {
            throw PermissionError("Unable to access the shadow file.");
            // }
		}

		// Encrypt the provided password.
		const char* encrypted = ::crypt(pass.c_str(), pwd.sp_pwdp); // does not have to be deallocated.
		if (encrypted == NULL) {
			delete[] buff;
            throw EncryptError("Unable to encrypt the password.");
		}
        String output = encrypted;
		delete[] buff;
        return output;
	}
	// - Static.
	static inline
	String 	encrypt_pass(const char* username, const String& pass) {

		// Parse the shadow file.
		struct spwd pwd;
		char* buff = nullptr;
		if (getspnam_wrapper(username, pwd, buff) == -1) {
			delete[] buff;
            throw PermissionError("Unable to access the shadow file.");
		}

		// Encrypt the provided password.
		const char* encrypted = ::crypt(pass.c_str(), pwd.sp_pwdp); // does not have to be deallocated.
		if (encrypted == NULL) {
			delete[] buff;
            throw EncryptError("Unable to encrypt the password.");
		}
        String output = encrypted;
		delete[] buff;
        return output;
	}
	// Encrypt a password for a new user.
	/*  @docs {
		@title: Encrypt password
		@description:
			Encrypt a password for a new user.
		@notes:
			- Not supported on `MacOS`.
		@parameter: {
			@name: pass
			@description: The unencrypted password string.
		}
		@usage:
			vlib::String output = vlib::User::encrypt_new_pass("Hello World!")
	} */
	static inline
	String 	encrypt_new_pass(const String& pass) {

		// Encrypt the provided password.
		char* salt = crypt_gensalt_ra("$6$", 15, NULL, 0);
		if (salt == NULL) {
            throw GenerateSaltError("Unable to generate a salt.");
		}
		const char* encrypted = ::crypt(pass.c_str(), salt); // does not have to be deallocated.
		if (encrypted == NULL) {
			delete[] salt;
            throw EncryptError("Unable to encrypt the password.");
		}
        String output = encrypted;
		delete[] salt;
		return output;
	}
	#endif
	
	// Verify the user's current password.
	#if OSID <= 0 || OSID >= 4
	/* docs {
	   @title: Verify password
	   @description: Verify the user's current password.
		@notes:
			- Not supported on `MacOS`.
		@parameter: {
			@name: pass
			@description: The password to verify.
		}
        @return: Returns `true` if the password is correct, and `false` if the password is incorrect.
	   @usage:
			vlib::User root(0);
			root.verify_pass("XXXXXXXXXX");
	} */
	bool 	verify_pass(const String& pass) {

		// Parse.
		if (!safe_parse()) {
            throw InvalidUIDError(tostr("Invalid user id \"", m_uid, "\"."));
		}

		// Parse the shadow file.
		struct spwd pwd;
		if (getspnam_wrapper(m_name.c_str(), pwd, m_buff) == -1) {
            throw PermissionError("Unable to access the shadow file.");
		}

		// Encrypt the provided password.
		const char* encrypted = ::crypt(pass.c_str(), pwd.sp_pwdp);
		if (encrypted == NULL) {
            throw EncryptError("Unable to encrypt the password.");
		}

		// Compare.
		if (vlib::array<char, uint>::eq(encrypted, pwd.sp_pwdp)) {
			return true;
		} else {
            return false;
		}

	}
	#endif

	// Set the user's password.
	// - Requires root priviliges.
	/* 	@docs {
		@title: Set password
		@description:
			 Set the user's password.
		@notes:
			- Not supported on `MacOS`.
			- Requires root priviliges.
		@usage:
			vlib::User root(0);
			root.set_pass("Hello World!");
	} */
	#if OSID <= 0 || OSID >= 4
	void 	set_pass(
		const String& 	pass					// the password.
	);
	#endif
	
	// Set the user's password.
	/*#if OSID == 0
	bool 		set_pass(const char* old_pass, const char* new_pass) {
		endpwent();
		return ::__passwd(name().c_str(), old_pass, new_pass) == 0;
	}
	#endif*/
	
	// Create a user.
	// - Must be executed as user root.
	#if OSID <= 0 || OSID >= 4
	/* 	@docs {
		@title: create
		@description:
			Create a user.
		@parameter: {
			@name: name
			@description: The username.
		}
		@parameter: {
			@name: realname
			@description: The user's real name.
		}
		@parameter: {
			@name: pass
			@description: The user's password.
		}
		@parameter: {
			@name: uid
			@description: The user's id, leave `-1` to assign automatically.
		}
		@parameter: {
			@name: gid
			@description: The user's group id, leave `-1` to assign automatically.
		}
		@parameter: {
			@name: superuser
			@description: Whether to grant the new user root priviliges.
		}
		@parameter: {
			@name: homes
			@description:
				The homes path, base path of the user's home path, not the user's home path itself.
				The function's default value for linux systems is `/home/` while the default value for MacOS is `/Users/`.
		}
		@parameter: {
			@name: shell
			@description:
				The shell path.
				The function's default value for linux systems is `/bin/bash` while the default value for MacOS is `/bin/zsh`.
		}
		@notes:
			- Must be executed with root priviliges.
			- In order to create the user the password will be exposed to `execl()`.
			- MacOS: When a new superuser has been created it requires a reboot before the superuser changes take effect.
	} */
	SICE
	void 	create(
		const char* 	name,								// the username.
		const char* 	realname,							// the user's real name.
		const String&	pass,								// the user's password.
		const int& 		uid = 				-1,				// the user id (leave -1 to assign automatically).
		const int& 		gid = 				-1,				// the group id (leave -1 to assign automatically).
		const bool&		superuser = 		false,			// whether to grant the new user root priviliges.
		const char* 	homes = 			"/home/",		// the homes path (base path of the direct path, not the direct path).
		const char* 	shell = 			"/bin/bash"		// the shell path.
	);
	#elif OSID == 1
	SICE
    void 	create(
		const char* 	username,							// the username.
		const char* 	realname,							// the user's real name.
		const String&	pass,								// the user's password.
		const int& 		uid = 				-1,				// the user id (leave -1 to assign automatically).
		const int& 		gid = 				-1,				// the group id (leave -1 to assign automatically).
		const bool&		superuser = 		false,			// whether to grant the new user root priviliges.
		const char* 	homes = 			"/Users/",		// the homes path (base path of the direct path, not the direct path).
		const char* 	shell = 			"/bin/zsh"		// the shell path.
	);
	#endif
	
	// Delete a user.
	// - Must be executed as user root.
	/* @docs {
	   @title: Delete
	   @description:
			Delete a user.
			- Must be executed with root priviliges.
			- MacOS: The system throws a popup to the user (can be fixed with system settings permissions).
		@usage:
			vlib::User user("myuser");
			user.del();
	} */
	constexpr
	void 	del();
    
    // Get uid of a user.
    /* @docs {
       @title: Get UID
       @description:
            Get the UID of an existing user.
        @notes:
            Throws an exception when the user does not exist.
        @usage:
            Int uid = vlib::User::get_uid("myuser");
        @funcs: 2
    } */
    static inline
    Int get_uid(const String& name) {
        return get_uid(name.c_str());
    }
	static inline
    Int get_uid(const char* name) {
        char* buff = nullptr;
        struct passwd pass;
        if (getpwnam_wrapper(name, pass, buff, false) != 0) {
            delete[] buff;
            throw ParseError(tostr("Unable to find user \"", name, "\"."));
        }
        Int uid = (int) pass.pw_uid;
        delete[] buff;
        return uid;
    }
    
    // Get gid of a user.
    /* @docs {
       @title: Get GID
       @description:
            Get the GID of an existing user.
        @notes:
            Throws an exception when the user does not exist.
        @usage:
            Int gid = vlib::User::get_gid("myuser");
        @funcs: 2
    } */
	static inline
    Int get_gid(const String& name) {
        return get_gid(name.c_str());
    }
    static inline
    Int get_gid(const char* name) {
        char* buff = nullptr;
        struct passwd pass;
        if (getpwnam_wrapper(name, pass, buff, false) != 0) {
            delete[] buff;
            throw ParseError(tostr("Unable to find user \"", name, "\"."));
        }
        Int gid = (int) pass.pw_gid;
        delete[] buff;
        return gid;
    }
    
    // Get gid of a user.
    /* @docs {
       @title: Get UID and GID
       @description:
            Get the UID and GID of an existing user.
        @notes:
            Throws an exception when the user does not exist.
        @return:
            Returns 0 on success and < 0 on failure.
        @usage:
            Int gid = vlib::User::get_ugid("myuser");
        @funcs: 2
    } */
	static inline
    int get_ugid(Int& uid, Int& gid, const String& name) {
        return get_ugid(uid, gid, name.c_str());
    }
    static inline
    int get_ugid(Int& uid, Int& gid, const char* name) {
        char* buff = nullptr;
        struct passwd pass;
        int status;
        if ((status = getpwnam_wrapper(name, pass, buff, false)) != 0) {
            delete[] buff;
            return status;
        }
        uid = (int) pass.pw_uid;
        gid = (int) pass.pw_gid;
        delete[] buff;
        return 0;
    }
    
    // Get username
    /* @docs {
       @title: Get name
       @description:
            Get the name of an user by uid.
        @notes:
            Throws an exception when the user does not exist.
        @usage:
            String name = vlib::User::get_name(...);
    } */
    static inline
    String get_name(const Int& uid) {
        char* buff = nullptr;
        struct passwd pass;
        String name;
        if (getpwuid_wrapper((uint) uid.value(), pass, buff, true) != 0) {
            delete[] buff;
            throw ParseError(tostr("Unable to find user \"", uid, "\"."));
        }
        name = pass.pw_name;
        delete[] buff;
        return name;
    }

	// ---------------------------------------------------------
	// Casts.
	
	// As uid.
	constexpr
	operator int() const {
		return m_uid;
	}
	
};

// ---------------------------------------------------------
// Instances.

// Is instance.
template<>				struct is_instance<User, User>	{ SICEBOOL value = true;  };

// Is type.
template<typename Type> struct is_User 					{ SICEBOOL value = false; };
template<> 				struct is_User<User> 			{ SICEBOOL value = true;  };

// ---------------------------------------------------------
// Shortcuts.

namespace shortcuts {
namespace types {

using User =		vlib::User;

}; 		// End namespace sockets.
}; 		// End namespace shortcuts.

// ---------------------------------------------------------
// End.

}; 		// End namespace vlib.
#endif 	// End header.
