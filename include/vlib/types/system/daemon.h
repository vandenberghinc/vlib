// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

// Header.
#ifndef VLIB_DAEMON_T_H
#define VLIB_DAEMON_T_H

// Namespace vlib.
namespace vlib {

// ---------------------------------------------------------
// Daemon type.

/* 	@docs {
	@chapter: system
	@title: Daemon
	@description:
		Daemon type.
    @usage:
        #include <vlib/types.h>
        vlib::Daemon daemon ({ ... });
} */
struct Daemon {
	
	// ---------------------------------------------------------
	// Definitions.
	
	using 	This = 	 Daemon;
	
	// ---------------------------------------------------------
	// Attributes.
	
	struct settings_t {
		
		// The name.
		String 	name;		// required.
		
		// The user & group owner.
		String 	user;		// required.
		String 	group;
		
		// The start command or script path.
		String 	command;	// required.
		
		// The start command arguments.
		Array<String>	args;
        
        // Environment.
        // Not used in MacOS.
        Dict<String, String> env;
		
		// The description
		String 	desc;
		
		// Restart on crash settings.
		bool 	auto_restart = false;
		int 	auto_restart_limit = -1;		// will be ignored on macos.
		int 	auto_restart_delay = -1;
		
		// The path to the log files.
		Path	logs;
		Path	errors;
		
	};
	settings_t 	m_settings;	// the daemon settings.
	Path		m_path;		// the service path.
	
	// ---------------------------------------------------------
	// Constructors.
	
	// Default constructor.
	constexpr
	Daemon() = default;
	
	// Settings constructor.
	constexpr
	Daemon(const settings_t& settings) :
	m_settings(settings)
	{ assign_path(); }
	constexpr
	Daemon(settings_t&& settings) :
	m_settings(settings)
	{ assign_path(); }
	
	// Copy constructor.
	constexpr
	Daemon(const This& obj) :
	m_settings(obj.m_settings),
	m_path(obj.m_path) {}
	
	// Move constructor.
	constexpr
	Daemon(This&& obj) :
	m_settings(obj.m_settings),
	m_path(obj.m_path) {}
	
	// ---------------------------------------------------------
	// Construct functions.
	
	// Copy.
	constexpr
	auto&	copy(const This& obj) {
		m_settings = obj.m_settings;
		m_path = obj.m_path;
		return *this;
	}
	
	// Swap.
	constexpr
	auto&	swap(This& obj) {
		m_settings = move(obj.m_settings);
		m_path.swap(obj.m_path);
		return *this;
	}
	
	// ---------------------------------------------------------
	// Assignment operators.
	
	// Settings constructor.
	auto&	operator =(const settings_t& settings) {
		m_settings = settings;
		assign_path();
		return *this;
	}
	auto&	operator =(settings_t&& settings) {
		m_settings = settings;
		assign_path();
		return *this;
	}
	
	// Copy constructor.
	constexpr
	auto&	operator =(const This& obj) {
		return copy(obj);
		return *this;
	}
	
	// Move constructor.
	constexpr
	auto&	operator =(This&& obj) {
		return swap(obj);
		return *this;
	}
	
	// ---------------------------------------------------------
	// Properties.
	
	// Name.
	/*  @docs {
		@title: Name
		@type: String&
		@description: Get daemon's name.
	} */
	constexpr
	auto&	name() { return m_settings.name; }
	constexpr
	auto&	name() const { return m_settings.name; }
	
	// User.
	/*  @docs {
		@title: User
		@type: String&
		@description: Get daemon's executing user.
	} */
	constexpr
	auto&	user() { return m_settings.user; }
	constexpr
	auto&	user() const { return m_settings.user; }
	
	// Group.
	/*  @docs {
		@title: Group
		@type: String&
		@description: Get daemon's executing group.
	} */
	constexpr
	auto&	group() { return m_settings.group; }
	constexpr
	auto&	group() const { return m_settings.group; }
	
	// Command.
	/*  @docs {
		@title: Command
		@type: String&
		@description: Get daemon's start command.
	} */
	constexpr
	auto&	command() { return m_settings.command; }
	constexpr
	auto&	command() const { return m_settings.command; }
	
	// Args.
	/*  @docs {
		@title: Args
		@type: Array<String>&
		@description: Get daemon's start arguments.
	} */
	constexpr
	auto&	args() { return m_settings.args; }
	constexpr
	auto&	args() const { return m_settings.args; }
    
    // Env.
    /*  @docs {
        @title: Env
        @type: Dict<String, String>&
        @description: Get daemon's environment dict.
    } */
    constexpr
    auto&    env() { return m_settings.env; }
    constexpr
    auto&    env() const { return m_settings.env; }
	
	// Desc.
	/*  @docs {
		@title: Description
		@type: String&
		@description: Get daemon's description.
	} */
	constexpr
	auto&	desc() { return m_settings.desc; }
	constexpr
	auto&	desc() const { return m_settings.desc; }
	
	// Restart.
	/*  @docs {
		@title: Auto restart
		@type: bool&
		@description: Get the auto restart boolean.
	} */
	constexpr
	auto&	auto_restart() { return m_settings.auto_restart; }
	constexpr
	auto&	auto_restart() const { return m_settings.auto_restart; }
	
	// Restart limit.
	/*  @docs {
		@title: Restart limit
		@type: int&
		@description: Get the restart limit, not used on macos.
	} */
	constexpr
	auto&	restart_limit() { return m_settings.auto_restart_limit; }
	constexpr
	auto&	restart_limit() const { return m_settings.auto_restart_limit; }
	
	// Restart_delay.
	/*  @docs {
		@title: Restart delay
		@type: int&
		@description: Get the restart delay in seconds.
	} */
	constexpr
	auto&	restart_delay() { return m_settings.auto_restart_delay; }
	constexpr
	auto&	restart_delay() const { return m_settings.auto_restart_delay; }
	
	// Logs.
	/*  @docs {
		@title: Logs
		@type: Path&
		@description: Get log file path.
	} */
	constexpr
	auto&	logs() { return m_settings.logs; }
	constexpr
	auto&	logs() const { return m_settings.logs; }
	
	// Errors.
	/*  @docs {
		@title: Errors
		@type: Path&
		@description: Get error file path.
	} */
	constexpr
	auto&	errors() { return m_settings.errors; }
	constexpr
	auto&	errors() const { return m_settings.errors; }
	
	// Daemon config path.
	/*  @docs {
		@title: Path
		@type: Path&
		@description: Get daemon config path.
	} */
	constexpr
	auto&	path() { return m_path; }
	constexpr
	auto&	path() const { return m_path; }
	
// Private.
private:
	
	// ---------------------------------------------------------
	// Private functions.
	
	// Assign the daemon path.
	void 	assign_path() {
        #if OSID == 0
            String x ("/etc/systemd/system/");
            x << m_settings.name;
            x << ".service";
            m_path = x;
        #elif OSID == 0
            String x ("/Library/LaunchDaemons/");
            x << m_settings.name;
            x << ".plist";
            m_path = x;
        #else
            throw OSError(to_str("Operating system \"MacOS\" is not yet supported."));
        #endif
	}
	
	// Create the daemon config.
	#if OSID == 0
	constexpr
	String 	create_h() {
		
		// Default.
		String data;
		data <<
		"[Unit]" << "\n" <<
		"Description=" << m_settings.desc << "\n" <<
		"After=network.target" << "\n" <<
		"StartLimitIntervalSec=0" << "\n" <<
		"" << "\n" <<
        
		"[Service]" << "\n" <<
        "User=" << m_settings.user << "\n" <<
		"Type=simple" << "\n" <<
		"ExecStart=" << m_settings.command << " ";
		for (auto& i: m_settings.args) {
			data << "\"" << i << "\" ";
		}
        data << "\n";
        for (auto& index: m_settings.env.indexes()) {
            data << "Environment=\"" << m_settings.env.key(index) << "=" << m_settings.env.value(index) << "\"\n";
        }

		# // Group.
		if (m_settings.group.is_defined()) {
			data <<
			"Group=" << m_settings.group << "\n";
		}

		// Restart.
		if (m_settings.auto_restart) {
			data <<
			"Restart=always" << "\n" <<
			"RestartSec=1" << "\n" <<
			"";
			if (m_settings.auto_restart_limit != -1) {
				data <<
				"StartLimitBurst=" << m_settings.auto_restart_limit << "\n";
			}
			if (m_settings.auto_restart_delay != -1) {
				data <<
				"StartLimitIntervalSec=" << m_settings.auto_restart_delay << "\n";
			}
		}

		// Additional build.
		data <<
		"" << "\n" <<
		"[Install]" << "\n" <<
		"WantedBy=multi-user.target" << "\n";
		
		// Handler.
		return data;
		
		//
	}
	#elif OSID == 1
	constexpr
	String 	create_h() {
		
		// Default.
		String data;
		data <<
		"<?xml version=\"1.0\" encoding=\"UTF-8\"?>" << "\n" <<
		"<!DOCTYPE plist PUBLIC \"-//Apple//DTD PLIST 1.0//EN\" \"http://www.apple.com/DTDs/PropertyList-1.0.dtd\">" << "\n" <<
		"<plist version=\"1.0\">" << "\n" <<
		"<dict>" << "\n" <<
		"    <key>Label</key>" << "\n" <<
		"    <string>" << m_settings.name << "</string>" << "\n" <<
		"    <key>UserName</key>" << "\n" <<
		"    <string>" << m_settings.user << "</string>" << "\n" <<
		"";
		
		// Arguments.
		data <<
		"	<key>ProgramArguments</key>" << "\n" <<
		"	<array>" << "\n" <<
		"		<string>" << m_settings.command << "</string>" << "\n";
		for (auto& i: m_settings.args) {
			data << "		<string>" << i << "</string>" << "\n";
		}
		data <<
		"	</array>" << "\n";

		// Group.
		if (m_settings.group.is_defined()) {
			data <<
			"    <key>GroupName</key>" << "\n" <<
			"    <string>" << m_settings.group << "</string>" << "\n" <<
			"";
		}

		// Restart.
		if (m_settings.auto_restart) {
			data <<
			"    <key>StartInterval</key>" << "\n" <<
			"    <integer>" << (m_settings.auto_restart_delay == -1 ? 3 : m_settings.auto_restart_delay) << "</integer>" << "\n" <<
			"";
		}

		// Logs.
		if (m_settings.logs.is_defined()) {
			data <<
			"    <key>StandardOutPath</key>" << "\n" <<
			"    <string>" << m_settings.logs << "</string>" << "\n" <<
			"";
		}

		// Errors.
		if (m_settings.errors.is_defined()) {
			data <<
			"    <key>StandardErrorPath</key>" << "\n" <<
			"    <string>" << m_settings.errors << "</string>" << "\n" <<
			"";
		}
			
		// End.
		data <<
		"</dict>" << "\n" <<
		"</plist>" << "\n";
		
		// Handler.
		return data;
		
		//
	}
	#endif
	
	// Load & reload the daemon config.
	#if OSID == 1
    void    load_h() {
		Proc proc;
		String command ("launchctl load ", 15);
		command.concat_r(m_path);
		int status;
        if ((status = proc.execute(command)) != 0 || proc.exit_status() != 0) {
            throw DaemonError("Failed to reload the daemon.");
        }
	}
    void    reload_h() {
		Proc proc;
		String command ("launchctl unload ", 17);
		command.concat_r(m_path);
		command.concat_r("&& launchctl load ", 18);
		command.concat_r(m_path);
		int status;
		if ((status = proc.execute(command)) != 0 || proc.exit_status() != 0) {
            throw DaemonError("Failed to reload the daemon.");
		}
	}
    #elif OSID == 0
    void    reload_h() {
        Proc proc;
        String command ("systemctl daemon-reload");
        int status;
        if ((status = proc.execute(command)) != 0 || proc.exit_status() != 0) {
            throw DaemonError("Failed to reload the daemon.");
        }
    }
	#endif
	
// Public.
public:
	
	// ---------------------------------------------------------
	// Public functions.
    
    // @TODO still implement systemctl daemon-reload for linux.
	
	// Check if the daemon exists.
	/* @docs {
		@title: Exists
		@description:
			Check if the daemon's exists.
	 
			- Requires root priviliges.
		@return:
			Returns a boolean indicating whether the daemon's configuration file exists.
	*/
	bool 	exists() {
        if (getuid() != 0) {
            throw DaemonError("Root privileges required.");
        }
		return m_path.exists();
	}
	
	// Create the daemon.
	/* @docs {
		@title: Create
		@description:
			Create the daemon's configuration file.
	 
			Use `update()` to update an exisiting daemon.
	 
			- Requires root priviliges.
	*/
	void    create() {
        if (getuid() != 0) {
            throw DaemonError("Root privileges required.");
        }
		if (m_path.exists()) {
            throw DaemonError(to_str("Daemon \"", m_path, "\" already exists."));
		}
		String data = create_h();
		m_path.save(data);
		#if OSID == 1
            load_h();
		#endif
	}
	
	// Update the daemon.
	/* @docs {
		@title: Update
		@description:
			Update the daemon's configuration file.
	 
			Use `create()` to create an unexisiting daemon.
	 
			- Requires root priviliges.
	*/
	void    update() {
        if (getuid() != 0) {
            throw DaemonError("Root privileges required.");
        }
		if (!m_path.exists()) {
            throw DaemonError(to_str("Daemon \"", m_path, "\" does not exist."));
		}
		String data = create_h();
		m_path.save(data);
		reload_h();
	}
	
	// Remove the daemon.
	/* @docs {
		@title: Remove
		@description:
			Remove the daemon's configuration file.
			
			Equal to `path().remove()`.
	 
			- Requires root priviliges.
	*/
	void 	remove() {
        if (getuid() != 0) {
            throw DaemonError("Root privileges required.");
        }
		m_path.remove();
	}
	
	// Start the daemon.
	/* @docs {
		@title: Start
		@description:
			Start the daemon.
	 
			- Requires root priviliges.
	*/
	void    start() {
        if (getuid() != 0) {
            throw DaemonError("Root privileges required.");
        }
		if (!m_path.exists()) {
            throw DaemonError(to_str("Daemon \"", m_path, "\" does not exist."));
		}
		#if OSID == 0
			String command ("systemctl start ", 16);
		#elif OSID == 1
			String command ("launchctl start ", 16);
		#endif
		command << m_settings.name;
		Proc proc;
        if (proc.execute(command) != 0 || proc.exit_status() != 0) {
            throw DaemonError("Failed to start the daemon.");
        }
	}
	
	// Stop the daemon.
	/* @docs {
		@title: stop
		@description:
			Stop the daemon.
	 
			- Requires root priviliges.
	*/
	void    stop() {
        if (getuid() != 0) {
            throw DaemonError("Root privileges required.");
        }
		if (!m_path.exists()) {
            throw DaemonError(to_str("Daemon \"", m_path, "\" does not exist."));
		}
		#if OSID == 0
			String command ("systemctl stop ", 15);
		#elif OSID == 1
			String command ("launchctl stop ", 15);
		#endif
		command << m_settings.name;
		Proc proc;
        if (proc.execute(command) != 0 || proc.exit_status() != 0) {
            throw DaemonError("Failed to stop the daemon.");
        }
	}
	
	// Restart the daemon.
	/* @docs {
		@title: restart
		@description:
			Restart the daemon.
		
			- Requires root priviliges.
	*/
	void    restart() {
        if (getuid() != 0) {
            throw DaemonError("Root privileges required.");
        }
		if (!m_path.exists()) {
            throw DaemonError(to_str("Daemon \"", m_path, "\" does not exist."));
		}
		#if OSID == 0
			String command ("systemctl restart ", 18);
			command << m_settings.name;
		#elif OSID == 1
			String command ("launchctl stop ", 15);
			command << m_settings.name;
			command.concat_r(" && launchctl start ", 20);
			command << m_settings.name;
		#endif
		Proc proc;
        if (proc.execute(command) != 0 || proc.exit_status() != 0) {
            throw DaemonError("Failed to restart the daemon.");
        }
	}
    
    // Tail the daemon logs.
    /* @docs {
        @title: tail
        @description:
            Tail the daemon logs.
        
            - Requires root priviliges.
    */
    String  tail(const Int& lines = 100) {
        if (getuid() != 0) {
            throw DaemonError("Root privileges required.");
        }
        if (!m_path.exists()) {
            throw DaemonError(to_str("Daemon \"", m_path, "\" does not exist."));
        }
        String command;
        #if OSID == 0
            command = to_str("sudo journalctl -u ", m_settings.name, ".service --no-pager  -n ", lines);
        #elif OSID == 1
            throw OSError(to_str("Operating system \"MacOS\" is not yet supported."));
			lines + 1; // to ignore unused parameter.
        #endif
        Proc proc;
        if (proc.execute(command) != 0 || proc.exit_status() != 0) {
            throw DaemonError("Failed to tail the daemon.");
        }
        return proc.err_or_out();
    }
	
};

// ---------------------------------------------------------
// Instances.

// Is type.
template<typename Type> 	struct is_Daemon 							{ SICEBOOL value = false; };
template<> 					struct is_Daemon<Daemon> 				{ SICEBOOL value = true;  };

// ---------------------------------------------------------
// Shortcuts.

namespace types { namespace shortcuts {

using Daemon =		vlib::Daemon;

}; 		// End namespace types.
}; 		// End namespace shortcuts.


// ---------------------------------------------------------
// End.

}; 		// End namespace vlib.
#endif 	// End header.
