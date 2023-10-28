// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

// Header.
#ifndef VLIB_GROUP_T_H
#define VLIB_GROUP_T_H

// Includes.
#include <sys/types.h>
#include <grp.h>

// Namespace vlib.
namespace vlib {

// ---------------------------------------------------------
// Group type

/* 	@docs
	@chapter: System
	@title: Group
	@description:
		Group type.
	@usage:
        #include <vlib/types.h>
		vlib::Group group;
*/
// @TODO make docs.
// @TODO should generate scripts and save them to the local computer, since calling Script everytime is super super super dumb.
struct Group {

// ---------------------------------------------------------
// Private.
private:

	// Attributes.
	char* 	m_buff = nullptr;

	// Wrapper function for getgrgid.
	// - Causes undefined behaviour when the wrapper function is called for another group then the initialized group.
	static inline
	int 	getgrgid_wrapper(uint gid, struct group& gr, char* buff, bool throw_exceptions = false) {
		struct group* result;
		long bufsize;
		int s;
		bufsize = sysconf(_SC_GETGR_R_SIZE_MAX);
		if (bufsize == -1) {          /* Value was indeterminate */
			bufsize = 16384;        /* Should be more than enough */
		}
		delete[] buff;
		buff = new char [(ulong) bufsize];
		s = getgrgid_r(gid, &gr, buff, (size_t) bufsize, &result);
		endgrent();
		if (result == NULL) {
			if (!throw_exceptions) { return -1; }
			if (s == 0) {
				throw ParseError(to_str("Unable to find group \"", gid, "\"."));
			} else {
				throw ParseError(to_str("Unknown error [errno: ", errno, "]."));
			}
		}
		return 0;
	}

	// Wrapper function for getgrnam.
	// - Causes undefined behaviour when the wrapper function is called for another group then the initialized group.
	static inline
	int 	getgrnam_wrapper(const char* name, struct group& gr, char* buff, bool throw_exceptions = false) {
		endgrent();
		struct group* result;
		long bufsize;
		int s;
		bufsize = sysconf(_SC_GETGR_R_SIZE_MAX);
		if (bufsize == -1) {          /* Value was indeterminate */
			bufsize = 16384;        /* Should be more than enough */
		}
		delete[] buff;
		buff = new char [(ulong) bufsize];
		s = getgrnam_r(name, &gr, buff, (size_t) bufsize, &result);
		endgrent();
		if (result == NULL) {
			if (!throw_exceptions) { return -1; }
			if (s == 0) {
				throw ParseError(to_str("Unable to find group \"", name, "\"."));
			} else {
				throw ParseError(to_str("Unknown error [errno: ", errno, "]."));
			}
		}
		// free(result);
		return 0;
	}

	// Parse.
	bool 	parse() {
		struct group gr;
		if (getgrgid_wrapper((uint) m_gid, gr, m_buff, true)) {
			m_gid = (Type) gr.gr_gid;
			m_name = gr.gr_name;
			m_pass = gr.gr_passwd;
            m_members = {};
			for(uint i = 0; gr.gr_mem && gr.gr_mem[i]; i++) {
				m_members.append(gr.gr_mem[i]);
			}
			return true;
		}
		return false;
	}
	constexpr
	bool 	safe_parse() {
		if (m_name.is_undefined()) { return parse(); }
		return true;
	}
	
// ---------------------------------------------------------
// Public.
public:

	// ---------------------------------------------------------
	// Aliases.
	
	using 		This = 		Group;
	using 		Type = 		int;
	
	// ---------------------------------------------------------
	// Attributes.
	
	Type 			m_gid;
	String 		    m_name;
	String 			m_pass;
	Array<String>   m_members;

	// ---------------------------------------------------------
	// Construct functions.
	
	// Copy.
	constexpr
	auto&	copy(const This& obj) {
		m_gid = obj.m_gid;
        m_name = obj.m_name;
        m_pass = obj.m_pass;
		m_members = obj.m_members;
		return *this;
	}

	// Swap.
	constexpr
	auto&	swap(This& obj) {
		m_gid = obj.m_gid;
        m_name.swap(obj.m_name);
        m_pass.swap(obj.m_pass);
        m_members.swap(obj.m_members);
		return *this;
	}

	// ---------------------------------------------------------
	// Constructors.
	
	// Default constructor.
	constexpr
	Group	() :
	m_gid(-1) {}
	
	// Constructor from gid.
	/*  @docs
		@title: Constructor
		@description:
			Construct from the group's id.
		@parameter:
			@name: gid
			@description: The group's id.
		}
		@usage:
			vlib::Group group(0);
	*/
	constexpr
	Group	(const Type& gid) :
	m_gid(gid) {}

	// Constructor from name.
	/*  @docs
		@title: Constructor
		@description:
			Construct from the group's name.
		@warning:
			Throws an exception when the group does not exist, use `vlib::Group::exists(const String&)` to check if the group exists.
		@parameter:
			@name: name
			@description: The group's name.
		}
		@usage:
			vlib::Group group("mygroup");
		@funcs: 2
	*/
	Group	(const String& name) {
		struct group gr;
		getgrnam_wrapper(name.c_str(), gr, m_buff, true);
		m_gid = (Type) gr.gr_gid;
		m_name = gr.gr_name;
		m_pass = gr.gr_passwd;
        m_members = {};
		for(uint i = 0; gr.gr_mem && gr.gr_mem[i]; i++) {
			m_members.append(gr.gr_mem[i]);
		}
	}
	Group	(const char* name) {
		struct group gr;
		getgrnam_wrapper(name, gr, m_buff, true);
		m_gid = (Type) gr.gr_gid;
		m_name = gr.gr_name;
		m_pass = gr.gr_passwd;
        m_members = {};
		for(uint i = 0; gr.gr_mem && gr.gr_mem[i]; i++) {
			m_members.append(gr.gr_mem[i]);
		}
	}
	
	// Copy constructor.
	constexpr
	Group	(const This& obj) :
	m_gid(obj.m_gid),
	m_name(obj.m_name),
	m_pass(obj.m_pass),
	m_members(obj.m_members)
    {}
	
	// Move constructor.
	constexpr
	Group	(This&& obj) :
	m_gid(obj.m_gid),
	m_name(move(obj.m_name)),
	m_pass(move(obj.m_pass)),
	m_members(move(obj.m_members))
	{}

	// Destructor.
	constexpr
	~Group() {
        delete[] m_buff;
	}

	// ---------------------------------------------------------
	// Assignment operators.
	
	// Assignment operator.
	constexpr
	auto&	operator =(const Type& gid) {
		m_gid = gid;
        m_name.reset();
        m_pass.reset();
		m_members.reset();
		return *this;
	}

	// Assignment operator from name.
	auto&	operator =(const char* name) {
		struct group gr;
		getgrnam_wrapper(name, gr, m_buff, true);
		m_gid = (Type) gr.gr_gid;
		m_name = gr.gr_name;
		m_pass = gr.gr_passwd;
        m_members = {};
		for(uint i = 0; gr.gr_mem && gr.gr_mem[i]; i++) {
			m_members.append(gr.gr_mem[i]);
		}
		return *this;
	}
	
	// Copy assignment operator.
	constexpr
	auto&	operator =(const This& obj) { return copy(obj); }
	
	// Move assignment operator.
	constexpr
	auto&	operator =(This&& obj) { return swap(obj); }
	
	// ---------------------------------------------------------
	// Functions.
	
	// Copy the object.
	/* @docs
	   @title: copy
	   @description: Copy the object.
	*/
	constexpr
	auto 	copy() {
		return *this;
	}
	constexpr
	auto 	copy() const {
		return *this;
	}
	
	// Reset all attributes.
	/* @docs
	   @title: reset
	   @description: Reset all attributes.
	*/
	constexpr
	auto& 	reset() {
		m_gid = -1;
        m_name.reset();
        m_pass.reset();
        m_members.reset();
		return *this;
	}
	
	// Is undefined.
	/* @docs
	   @title: Is undefined
	   @description: Check if the object is undefined.
	   @usage:
			Group x;
			x.is_undefined(); ==> true;
	*/
	constexpr
	bool 	is_undefined() const {
		return m_gid == -1;
	}
	
	// Get the gid.
	/* @docs
	   @title: gid
	   @description: Get the gid.
	*/
	constexpr
	auto& 	gid() const {
		return m_gid;
	}

	// Get the group name.
	/* @docs
	   @title: gid
	   @description: Get the group name.
	*/
	constexpr
	auto& 	name() {
		safe_parse();
		return m_name;
	}

	// Get the group pass.
	/* docs {
	   @title: pass
	   @description: Get the group pass.
	*/
	/*constexpr
	auto& 		pass() {
		safe_parse();
		return m_pass;
	*/

	// Get the group members.
	/* @docs
	   @title: members
	   @description: Get the group members.
	*/
	constexpr
	auto& 	members() {
		safe_parse();
		return m_members;
	}

	// Check if the group exists.
	/* 	@docs
		@title: exists
		@description: Check if the group exists.
	*/
	bool 	exists() { return parse(); }
	/* 	@docs
		@title: Exists
		@description: Check if a group exists.
		@funcs: 3
	*/
	static inline
	bool 	exists(const String& name) {
		return exists(name.c_str());
	}
	static inline
	bool 	exists(const char* name) {
		struct group gr;
		char* buff = nullptr;
		bool s = getgrnam_wrapper(name, gr, buff) == 0;
		delete[] buff;
		return s;
	}
	static inline
	bool 	exists(uint gid) {
		struct group gr;
		char* buff = nullptr;
		bool s = getgrgid_wrapper(gid, gr, buff) == 0;
		delete[] buff;
		return s;
	}

	// Create a group.
	/*  @docs
		@title: Create
		@description:
			Create a group.
	 
			- Automatically adds user `root` to the group.
			- Must be executed as user `root`.
		@parameter:
			@name: name
			@description: The group's name.
		}
		@parameter:
			@name: pass
			@description: The group's password, use `*` for no password.
		}
		@parameter:
			@name: gid
			@description: The new group id, must be unique.
		}
		@usage:
			vlib::Group::create("mynewgroup");
	*/
	SICE
    void 	create(
		const char* 	name,								// the group name.
		const String& 	pass = 				"*",			// the group's password (use "*" for no password).
		int 			gid = 				-1				// the group id (leave -1 to assign automatically).
	);

	// Delete a group.
	/*  @docs
		@title: Delete
		@description:
			Delete a group.
	 
			- Must be executed as user `root`.
		@usage:
			vlib::Group group("mygroup");
			group.del();
	*/
	constexpr
    void 	del();

	// Add one or multiple users to the group.
	/*  @docs
		@title: Add
		@description:
			Add one or multiple users to the group.
		@notes:
			- Must be executed as user `root`.
			- The argument types must be `const char*`.
		@usage:
			vlib::Group group("mygroup");
			int status = group.add("someuser");
	*/
	template <typename... Args> constexpr
    void 	add(const char* username, Args&&... args);

	// Remove one or multiple users from the group.
	// - Must be executed as user root.
	// - Args type must be "const char*".
	/*  @docs
		@title: Add
		@description:
			Add one or multiple users to the group.
		@notes:
			- Must be executed as user `root`.
			- The argument types must be `const char*`.
		@usage:
			vlib::Group group("mygroup");
			int status = group.remove("someuser");
	*/
	template <typename... Args> constexpr
    void 	remove(const char* username, Args&&... args);

    // Get name by gid.
    /* @docs
       @title: Get GID
       @description:
            Get the GID of an existing group.
        @notes:
            Throws an exception when the group does not exist.
        @usage:
            Int gid = vlib::Group::get_gid("mygroup");
        @funcs: 2
    */
	static inline
    Int get_gid(const String& name) {
        return get_gid(name.c_str());
    }
    static inline
    Int get_gid(const char* name) {
        char* buff = nullptr;
        struct group gr;
        if (getgrnam_wrapper(name, gr, buff, false) != 0) {
            delete[] buff;
            throw ParseError(to_str("Unable to find group \"", name, "\"."));
        }
        Int s = gr.gr_gid;
        delete[] buff;
        return s;
    }
    
    // Get name of gid.
    /* @docs
       @title: Get name
       @description:
            Get the name of a group by uid.
        @notes:
            Throws an exception when the group does not exist.
        @usage:
            String name = vlib::Group::get_name(...);
    */
	static inline
    String  get_name(const Int& gid) {
        char* buff = nullptr;
        struct group gr;
        if (getgrgid_wrapper((uint) gid.value(), gr, buff, false) != 0) {
            delete[] buff;
            throw ParseError(to_str("Unable to find group \"", gid, "\"."));
        }
        String name = gr.gr_name;
        delete[] buff;
        return name;
    }
    
	// ---------------------------------------------------------
	// Helper functions.

	// Create a group.
	#if OSID <= 0 || OSID >= 4
	template <typename Proc, typename Script> SICE
	void 	create_h(
		const char* 	name,						// the group name.
		const String&	pass = 		"*",			// the group's password.
		int 			gid = 		-1				// the group id (leave -1 to ignore).
	) {
		int status;
		
		// Vars.
		String command ("groupadd");
		if (pass[0] != '*') {
			String encrypted = User::encrypt_new_pass(pass);
			command.concat_r(" -p ", 4);
			command.concat_r(encrypted);
		}
		if (gid > 0) {
			command.concat_r(" -g ", 4);
			command.concat_r(gid);
		}
		command.append(' ');
		command.concat_r(name);

		// Create script.
		Script script (
			 // Stop on error.
			 "set -e",

			 // Check root permission.
			 "if [[ `id -u` != 0 ]]; then",
				 "echo \"Creating a group requires root priviliges [uid: $(id -u)].\"",
				 "exit 1",
			 "fi",

			 // Create the group.
			 command.c_str(),
			 to_str("usermod -a -G ", name, " root"),

			 // Handler.
			 "exit 0"
		);

		// Execute script.
		Proc proc;
		proc.timeout = 5000;
		if ((status = proc.execute(script)) != 0) {
            throw CreateError(to_str("Unable to create group \"", name, "\"."));
		}
		if (proc.exit_status() != 0) {
            throw CreateError(to_str("Unable to create group \"", name, "\"."));
		}

	}
	#elif OSID == 1
	template <typename Proc, typename Script> SICE
	void 	create_h(
		const char* 	name,						// the group name.
		const String& 	pass = 		"*",			// the group's password (use "*" for no password).
		int 			gid = 		-1				// the group id (leave -1 to assign automatically).
	) {

		// Vars.
		int status;
		Proc proc;
		int l_gid = gid;

		// User.
		if (l_gid == -1) {
			if ((status = proc.execute("dscl . list /Groups gid | awk '{print $2}' | sort -n | tail -1")) != 0) {
                throw CreateError(to_str("Unable to create group \"", name, "\"."));
			}
			if (proc.exit_status() != 0) {
                throw CreateError(to_str("Unable to create group \"", name, "\"."));
			}
			if (!proc.has_out()) {
                throw CreateError(to_str("Unable to create group \"", name, "\"."));
			}
			proc.out().replace_end_r("\n");
			l_gid = to_num<int>(proc.out().data(), proc.out().len()) + 1;
			if (l_gid < 1000) { l_gid = 1000; }
		}

		// Create the script.
		Script script (
						 // Interpreter.
						 "set -e",

						 // Arguments.
						 to_str("GroupName=\"", name, "\""),
						 // to_str("RealName=\"", realname, "\""),
						 to_str("GroupID=\"", l_gid, "\""),

						 // Check root permission.
						 "if [[ `id -u` != 0 ]]; then",
							 "echo \"Creating a group requires root priviliges [uid: $(id -u)].\" 1>&2",
							 "exit 1",
						 "fi",

						 // Check if the group already exists.
						 "if [[ $GroupName == `dscl . list /Groups | awk '{print $1}' | grep -w $GroupName` ]]; then",
							 "echo \"Group \\\"$GroupName\\\" already exists.\" 1>&2",
							 "exit 1",
						 "fi",

						 // Create the group.
						 "dscl . create /Groups/$GroupName",
						 // "dscl . create /Groups/$GroupName RealName $RealName",
						 to_str("dscl . create /Groups/$GroupName passwd \"", pass, "\""),
						 "dscl . create /Groups/$GroupName gid $GroupID",
						 "dscl . create /Groups/$GroupName GroupMembership root",

						 // Handler.
						 "exit 0"
		);
		script.permission() = 0700;

		// Execute the script.
		proc.timeout = 5000;
		if ((status = proc.execute(script)) != 0) {
            throw CreateError(to_str("Unable to create group \"", name, "\"."));
		}
		if (proc.exit_status() != 0) {
            throw CreateError(to_str("Unable to create group \"", name, "\"."));
		}

	}
	#endif

	// Delete a group.
	template <typename Proc, typename Script> constexpr
	void 	del_h() {
		int status;
		if (!safe_parse()) {
            throw InvalidGIDError(to_str("Invalid group id \"", m_gid, "\"."));
		}
		Proc proc { .timeout = 5000 };
		#if OSID <= 0 || OSID >= 4
			Script script (
						     // Stop on error.
						     "set -e",

							 // Variables.
							 to_str("GroupName=\"", m_name, "\""),

							 // Check root permission.
							 "if [[ `id -u` != 0 ]]; then",
								 "echo \"Deleting a user requires root priviliges [uid: $(id -u)].\"",
								 "exit 1",
							 "fi",

							 // Delete the user.
							 "groupdel $GroupName",

							 // Handler.
							 "exit 0"
			);
		#elif OSID == 1
			Script script (
						     // Stop on error.
						     "set -e",

							 // Variables.
							 to_str("GroupName=\"", m_name, "\""),

							 // Check root permission.
							 "if [[ `id -u` != 0 ]]; then",
								 "echo \"Deleting a user requires root priviliges [uid: $(id -u)].\"",
								 "exit 1",
							 "fi",

							 // Check if the group exists.
							 "if [[ $GroupName != `dscl . list /Groups | awk '{print $1}' | grep -w $GroupName` ]]; then",
								 "echo \"Group \\\"$GroupName\\\" does not exist.\"",
								 "exit 2",
							 "fi",

							 // Delete the user.
							 "dscl . delete /Groups/$GroupName",

							 // Handler.
							 "exit 0"
			);
		#endif

		// Execute the script.
		if ((status = proc.execute(script)) != 0) {
            throw RemoveError(to_str("Unable to remove group \"", m_gid, "\"."));
		}
		if (proc.exit_status() != 0) {
            throw RemoveError(to_str("Unable to remove group \"", m_gid, "\"."));
		}

	}

	// Create the add users command.
	constexpr
	void 	add_command_h(String& result, const String&) {
		result.null_terminate();
	}
	#if OSID <= 0 || OSID >= 4
	template <typename... Args> constexpr
	void 	add_command_h(
		String& 	result,
		const String& 		groupname,
		const char* 		username,
		Args&&... 			args
	) {
		result.concat_r("usermod -a -G ", 14);
		result.concat_r(groupname);
		result.append(' ');
		result.concat_r(username);
		result.append('\n');
		add_command_h(result, groupname, args...);
	}
	#elif OSID == 1
	template <typename... Args> constexpr
	void 	add_command_h(
		String&			 	result,
		const String& 		groupname,
		const char* 		username,
		Args&&... 			args
	) {
		result.concat_r("dscl . append /Groups/", 22);
		result.concat_r(groupname);
		result.concat_r(" GroupMembership ", 17);
		result.concat_r(username);
		result.append('\n');
		add_command_h(result, groupname, args...);
	}
	#endif

	// Add one or multiple users to the group.
	template <typename Proc, typename Script, typename... Args> constexpr
	void 	add_h(
		const char* 		username,
		Args&&... 			args
	) {
		int status;
		
		// Parse.
		if (!safe_parse()) {
            throw InvalidGIDError(to_str("Invalid group id \"", m_gid, "\"."));
		}

		// Vard.
		Proc proc { .timeout = 5000 };
		String add_command;

		// Add root since the first member must be added with "create" instead of "append".
		if (m_members.len() == 0) {
			add_command_h(add_command, m_name, "root");
		}
		add_command_h(add_command, m_name, username, args...);
		Script script (
			 // Stop on error.
			 "set -e",

			 // Check root permission.
			 "if [[ `id -u` != 0 ]]; then",
				 "echo \"Deleting a user requires root priviliges [uid: $(id -u)].\"",
				 "exit 1",
			 "fi",

			 // Delete the user.
			 add_command,

			 // Handler.
			 "exit 0"
		);
		
		// Execute the script.
		if ((status = proc.execute(script)) != 0) {
            throw AddError(to_str("Unable to add user \"", username, "\" to group \"", m_gid, "\"."));
		}
		if (proc.exit_status() == 0) {
			if (m_members.len() == 0) {
				m_members.append("root");
			}
			m_members.append(username, args...);
		}
		else {
            throw AddError(to_str("Unable to add user \"", username, "\" to group \"", m_gid, "\"."));
		}

	}

	// Create the delete command.
	constexpr
	void 	remove_command_h(String& result, const String&) {
		result.null_terminate();
	}
	#if OSID <= 0 || OSID >= 4
	template <typename... Args> constexpr
	void 	remove_command_h(
		String& 	result,
		const String& 		groupname,
		const char* 		username,
		Args&&... 			args
	) {
		result.concat_r("deluser ", 8);
		result.concat_r(username);
		result.append(' ');
		result.concat_r(groupname);
		result.append('\n');
		remove_command_h(result, groupname, args...);
	}
	#elif OSID == 1
	template <typename... Args> constexpr
	void 	remove_command_h(
		String& 	result,
		const String& 		groupname,
		const char* 		username,
		Args&&... 			args
	) {
		result.concat_r("dscl . delete /Groups/", 22);
		result.concat_r(groupname);
		result.concat_r(" GroupMembership ", 17);
		result.concat_r(username);
		result.append('\n');
		remove_command_h(result, groupname, args...);
	}
	#endif

	// Delete one or multiple users from the group.
	template <typename Proc, typename Script, typename... Args> constexpr
	void 	remove_h(
		const char* 		username,
		Args&&... 			args
	) {
		
		int status;
		if (!safe_parse()) {
            throw InvalidGIDError(to_str("Invalid gid \"", m_gid, "\"."));
		}
		Proc proc { .timeout = 5000 };
		String remove_command;
		remove_command_h(remove_command, m_name, username, args...);
		Script script (
					     // Stop on error.
					     "set -e",

						 // Check root permission.
						 "if [[ `id -u` != 0 ]]; then",
							 "echo \"Deleting a user requires root priviliges [uid: $(id -u)].\"",
							 "exit 1",
						 "fi",

						 // Delete the user.
						 remove_command,

						 // Handler.
						 "exit 0"
		);

		// Execute the script.
		if ((status = proc.execute(script)) != 0) {
            throw RemoveError(to_str("Unable to remove user \"", username, "\" from group \"", m_gid, "\"."));
		}
		// std::cout << "ERRNO: " << proc.m_errno << "\n";
		// std::cout << "EXIT STATUS: " << proc.exit_status() << "\n";
		// if (proc.has_out()) { std::cout << "OUTPUT: " << proc.output().c_str() << "\n"; }
		// if (proc.has_err()) { std::cout << "ERROR: " << proc.error().c_str() << "\n"; }
		if (proc.exit_status() == 0) {
			m_members.remove(username, args...);
		}
		else {
            throw RemoveError(to_str("Unable to remove user \"", username, "\" from group \"", m_gid, "\"."));
		}

	}
    
	// ---------------------------------------------------------
	// Casts.
	
	// As ulong.
	constexpr
	operator 	Type() const {
		return m_gid;
	}
	
};

// ---------------------------------------------------------
// Instances.

// Is type.
template<typename Type> struct is_Group 						{ SICEBOOL value = false; };
template<> 				struct is_Group<Group> 				{ SICEBOOL value = true;  };

// ---------------------------------------------------------
// Shortcuts.

namespace types { namespace shortcuts {

using Group =		vlib::Group;

}; 		// End namespace sockets.
}; 		// End namespace shortcuts.

// ---------------------------------------------------------
// End.

}; 		// End namespace vlib.
#endif 	// End header.
