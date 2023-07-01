/*
 Author: Daan van den Bergh
 Copyright: © 2022 Daan van den Bergh.
*/
//
// Example API Key: j6Xj3EW94q7OvGVufkIznyCmTBhstkSQoXfrljblC9vtm9lb2eDcfn9eWvAF5LfX
// Example Secret Key: yaXWkfP3HXFkGwlHt8mnJjN3eJudIlyBUuAz7dsBFS1EedQE1mmO62sgc58AOL7q

// Header.
#ifndef VLIB_RESTAPI_SERVER_T_H
#define VLIB_RESTAPI_SERVER_T_H

// Namespace vlib.
namespace vlib {

// Namespace restapi.
namespace restapi {

// ---------------------------------------------------------
// RestAPI server type.
//
// Notes:
// - Only supports content type: "application/json".
// - GET request parameters are by default passed in the payload body. Since HTTP/1.1 no longer forbids this.
//

/*  @docs {
	@chapter: restapi
	@title: Server
	@description:
		The RESTAPI server object.
	@usage:
		#include <vlib/sockets/restapi.h>
		vlib::restapi::Server server;
} */
template <
	uchar	family = 		sockets::family::ipv4,
	int 	type = 			sockets::type::stream,
	int 	protocol = 		sockets::protocol::undefined,
	uint 	buff_len = 		1024 * 8,
	bool 	blocking = 		false,
	uint	tls_version = 	tls::version::v1_3, // the minimum tls version.
	uint	http_version = 	http::version::v1_1 // the http version.
> requires (
	family == sockets::family::ipv4 ||
	family == sockets::family::ipv6
)
struct Server : public Thread<Server<family, type, protocol, buff_len, blocking, tls_version, http_version>> {

	// ---------------------------------------------------------
	// Aliases.

	using 	This = 			Server;
	using 	Thread =		Thread<Server<family, type, protocol, buff_len, blocking, tls_version, http_version>>;
	using 	Socket = 		tls::Server<family, type, protocol, buff_len, blocking, tls_version>;
	using 	Headers = 		http::Headers;
	using 	Request = 		http::Request;
	using 	Response = 		http::Response;
	using 	Endpoint = 		Endpoint<http_version>;
	using 	Endpoints = 	Array<Endpoint>;
	using 	Addrin4 = 		struct sockaddr_in;		// ipv4 socket address in.
	using 	Addrin6 = 		struct sockaddr_in6;	// ipv6 socket address in.

	// ---------------------------------------------------------
	// Attributes.
	
	struct attr {
		Socket			sock;				// the tls socket.
		Endpoints		endpoints;			// the endpoints.
		Path			database;			// the database directory.
		Compression	    compression;		// the compression.
        Int             debug_level = 0;

		// Reserved system attributes.
		
		// Thread status.
		// - 0 means not running.
		// - 1 means running.
		int				status = 0;
		
		// Log files.
		File			log_file;
		File			error_file;
		
		// Path shortcuts.
		Path			users_sys_path;
		Path			users_path;
		
		// Master sha key.
		String			master_sha;
		
		// Mutex.
        Mutex			mutex;
		
	};
	SPtr<attr>		m_attr;

	// ---------------------------------------------------------
	// Default responses.

	struct resps {
		Response 	invalid_endpoint = Response(
			http_version,
			http::status::not_found,
			{{"Content-Type", http::content_type::desc::json}},
			{{"error", "Invalid endpoint."}}
		);
		Response	invalid_body = Response(
			http_version,
			http::status::bad_request,
			{{"Content-Type", http::content_type::desc::json}},
			{{"error", "Invalid body."}}
		);
		Response 	unauthorized = Response(
			http_version,
			http::status::unauthorized,
			{{"Content-Type", http::content_type::desc::json}},
			{{"error", "Unauthorized."}}
		);
		Response 	rate_limit_exceeded = Response(
			http_version,
			http::status::too_many_requests,
			{{"Content-Type", http::content_type::desc::json}},
			{{"error", "Rate limit exceeded."}}
		);
		Response 	internal_server_error = Response(
			http_version,
			http::status::internal_server_error,
			{{"Content-Type", http::content_type::desc::json}},
			{{"error", "Internal server error."}}
		);
	};
	SPtr<resps>		m_resps;

	// ---------------------------------------------------------
	// Constructors.
	
	// Default constructor.
	constexpr
	Server () :
	Thread(),
	m_attr(attr{}),
	m_resps(resps{}) {}

	// Constructor from ip and port.
	constexpr
	Server (
		const String& 			ip,
		const uint& 	port,
		const String& 			cert,
		const String& 			key,
		const String& 			pass = nullptr
	) :
	Thread(),
	m_attr(attr{ .sock = Socket(ip, port, cert, key, pass) }),
	m_resps(resps{}) {}

	// Constructor from universal ip and defined port.
	constexpr
	Server (
		const uint& 	port,
		const String& 			cert,
		const String& 			key,
		const String& 			pass = nullptr
	) :
	Thread(),
	m_attr(attr{ .sock = Socket(port, cert, key, pass) }),
	m_resps(resps{}) {}
	
	// Constructor constuct args.
	struct args {
		String 			ip;
		uint 	        port;
		String			cert;
		String			key;
		String			pass;
		Path			database;
        Int             debug_level;
		Compression	compression;
	};
	constexpr
	Server (const args& x) :
	Thread(),
	m_attr(attr{
		.sock = Socket(x.ip, x.port, x.cert, x.key, x.pass),
		.database = x.database,
        .compression = x.compression,
        .debug_level = x.debug_level,
	}),
	m_resps(resps{}) {}

	// Copy constructor.
	constexpr
	Server(const This& obj) :
	Thread(obj),
	m_attr(obj.m_attr),
	m_resps(obj.m_resps) {}

	// Move constructor.
	constexpr
	Server(This&& obj) :
	Thread(obj),
	m_attr(move(obj.m_attr)),
	m_resps(move(obj.m_resps)) {}

	// ---------------------------------------------------------
	// Assignment operators.

	// Copy assignment operator.
	constexpr
	auto& 	operator =(const This& obj) {
		m_attr.copy(obj.m_attr);
		return *this;
	}

	// Move assignment operator.
	constexpr
	auto& 	operator =(This&& obj) {
		m_attr.swap(obj.m_attr);
		return *this;
	}

	// ---------------------------------------------------------
	// Attribute functions.

	// Is running.
	constexpr
	auto&	status() const {
		return m_attr->status;
	}

	// Is running.
	constexpr
	bool	running() const {
		return m_attr->status == 1;
	}

    // The port.
    constexpr
    auto&    port() {
        return m_attr->sock.port();
    }
    
	// The tls socket.
	// - Warning: causes undefined behaviour when assigning after calling "initialize()".
	constexpr
	auto&	sock() {
		return m_attr->sock;
	}

	// Endpoints.
	// - Warning: causes undefined behaviour when assigning after calling "initialize()".
	constexpr
	auto&	endpoints() {
		return m_attr->endpoints;
	}

	// The database path.
	// - Warning: causes undefined behaviour when assigning after calling "initialize()".
	constexpr
	auto&	database() {
		return m_attr->database;
	}

	// The log file.
	// - Warning: causes undefined behaviour when used for assigning after calling "initialize()".
	constexpr
	auto&	log_file() {
		return m_attr->log_file;
	}

	// The error file.
	// - Warning: causes undefined behaviour when used for assigning after calling "initialize()".
	constexpr
	auto&	error_file() {
		return m_attr->error_file;
	}

	// Compression.
	constexpr
	auto&	compression() {
		return m_attr->compression;
	}

// Private.
private:
	
	// ---------------------------------------------------------
	// Private functions.
	
	// Initialize before start.
	constexpr
	int 	init_database() {

		// Check if the database is assigned.
		if (m_attr->database.is_undefined()) {
			return restapi::error::undefined_database;
		}

		// Create the database directory.
		if (m_attr->database.is_defined()) {
            m_attr->database.mkdir();

			// Create sub dirs.
            m_attr->database.join("logs/").mkdir();
            m_attr->database.join("sys/").mkdir();
            m_attr->database.join("sys/tls/").mkdir();
            m_attr->database.join("sys/sha/").mkdir();
            m_attr->database.join("sys/users/").mkdir();
            m_attr->database.join("users/").mkdir();

			// Assign default files.
			if (m_attr->log_file.is_undefined()) {
				m_attr->log_file = m_attr->database.join("logs/logs");
			}
			if (m_attr->error_file.is_undefined()) {
				m_attr->error_file = m_attr->database.join("logs/errors");
			}

		}
		
		// Set path shortcuts.
		m_attr->users_sys_path = m_attr->database.join("sys/users/");
		m_attr->users_path = m_attr->database.join("users/");

		return 0;
	}
	
	// Initialize files.
	constexpr
	int 	init_files() {
		Path path;
		
		// Create and open log files.
		if (m_attr->log_file.is_defined()) {
			if (!m_attr->log_file.exists()) {
                m_attr->log_file.create();
			}
            m_attr->log_file.open();
		}
		if (m_attr->error_file.is_defined()) {
			if (!m_attr->error_file.exists()) {
                m_attr->error_file.create();
			}
            m_attr->error_file.open();
		}
		
		// Create or load the master sha key.
		path = m_attr->database.join("sys/sha/master");
		if (path.exists()) {
            m_attr->master_sha = String::load(path);
		} else {
            m_attr->master_sha = SHA256::generate_key(32);
			m_attr->master_sha.save(path);
		}
		
		// Success.
		return 0;
	}
	
	// Generate a key.
	SICE
	String 	generate_key(const int len = 64) {
		const char* chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
		String key;
		key.resize(len);
		for (int i = 0; i < len; ++i) {
			key.append_no_resize(chars[random::generate<int>(0, 61)]);
		}
		return key;
	}
	
	// Load a user's sys data.
	constexpr
	int		load_user_sys(Json& data, const String& username) {
		
		// User path.
		Path sys_path (m_attr->users_sys_path.join(username));
		
		// Check path.
		if (!sys_path.exists()) {
			return restapi::error::unknown_username;
		}
		
		// Load data.
		data = Json::load(sys_path);
		
		// Success.
		return 0;
	}

	// ---------------------------------------------------------
	// Client thread.

	// Serve thread.
	template <typename Addrin> SICE
	void*	serve_thread(
		This*				m_server,
		const uint& 		client,
		const Addrin&		addr
	) {
		int status;
		String ip = sockets::Socket<>::get_ip<String>(addr);
		uint port = sockets::Socket<>::get_port(addr);
		if ((status = serve(m_server, client, addr)) != 0) {
			if (m_server->m_attr->error_file.is_defined()) {
				m_server->m_attr->error_file.append(tostr(Date::now().mtime()));
				m_server->m_attr->error_file.append(": Encoutered error [", 20);
				m_server->m_attr->error_file.append(tostr(status));
				m_server->m_attr->error_file.append("] during while serving client [", 31);
				m_server->m_attr->error_file.append(ip);
				m_server->m_attr->error_file.append(":", 1);
				m_server->m_attr->error_file.append(tostr(port));
				m_server->m_attr->error_file.append("].\n", 3);
			}
		} else if (m_server->m_attr->log_file.is_defined()) {
			m_server->m_attr->log_file.append(tostr(Date::now().mtime()));
			m_server->m_attr->log_file.append(": Successfully served client [", 30);
			m_server->m_attr->log_file.append(ip);
			m_server->m_attr->log_file.append(":", 1);
			m_server->m_attr->log_file.append(tostr(port));
			m_server->m_attr->log_file.append("].\n", 3);
		}
		m_server->m_attr->sock.close(client);
		if (m_server->m_attr->log_file.is_defined()) {
			m_server->m_attr->log_file.flush();
		}
		if (m_server->m_attr->error_file.is_defined()) {
			m_server->m_attr->error_file.flush();
		}
        // print("Serve time: ", Date::get_mseconds() - now, "ms");
		return NULL;
	}

	// Serve a client.
	template <typename Addrin> SICE
	int		serve(
		This* 				m_server,
		const uint& 		client,
		const Addrin&		addr
	) {

		// Receive.
		int timeout = 300;
		int status;
		int status1;
		Request request;
		if ((status = m_server->m_attr->sock.receive(request, client, timeout)) != 0) {
			return status;
		}

		// Parse params.
		Json params;
		if (request.has_body()) {
            String *to_parse;
            String decompressed;
			if (m_server->m_attr->compression.is_compressed(request.body())) {
                decompressed = m_server->m_attr->compression.decompress(request.body());
                to_parse = &decompressed;
			} else {
                to_parse = &request.body();
			}
            try {
                params = Json::parse(*to_parse);
            } catch (Exception& e) {
                if ((status1 = m_server->m_attr->sock.send(client, m_server->m_resps->invalid_body, timeout)) != 0) {
                    return status1;
                }
                return status;
            }
		}

		// Execute endpoint.
        if (m_server->m_attr->debug_level >= 1) {
            print(vlib::http::method::tostr(request.method()), ' ', request.endpoint());
        }
		http::Response response;
		bool found = false;
        String raw_endpoint = request.endpoint();
        ullong pos = raw_endpoint.find('?');
        if (pos != NPos::npos) {
            raw_endpoint.len() -= raw_endpoint.len() - pos;
        }
		for (auto& endpoint: m_server->m_attr->endpoints) {
			if (endpoint.eq(request.content_type(), request.method(), raw_endpoint)) {
				found = true;
				
				// Verify rate limit.
				ullong ip = sockets::Socket<>::get_ip<ullong>(addr);
				if ((status = endpoint.verify_rate_limit(ip)) == restapi::error::rate_limit_exceeded) {
					response = m_server->m_resps->rate_limit_exceeded;
					break;
				}
				else if (status != 0) {
					response = m_server->m_resps->internal_server_error;
					break;
				}
				
				// Requires no auth.
				if (endpoint.auth() == 0) {
					response = endpoint.func()(NULL, params, request.headers());
					break;
				}
				
				// Auth vars.
				String username;
				bool authenticated = false;
				
				// Verify access token.
				if (endpoint.auth() & auth::token) {
					auto& access_token = request.headers().value("Authorization", 13);
					if (
						access_token.is_defined() &&
						m_server->get_username_by_api_key(username, access_token) == 0 &&
						m_server->verify_access_token(username, access_token) == 0
					) {
						authenticated = true;
					}
				}
				
				// Verify API key & signature.
				if (!authenticated && request.has_body() && endpoint.auth() & (auth::key | auth::sign)) {
					auto& api_key = request.headers().value("API-Key", 7);
					auto& signature = request.headers().value("API-Signature", 13);
					if (
						api_key.is_defined() &&
						signature.is_defined() &&
						m_server->get_username_by_api_key(username, api_key) == 0 &&
						m_server->verify_api_key(username, api_key, signature, request.body()) == 0
					) {
						authenticated = true;
					}
				}
				
				// Verify API key.
				else if (!authenticated && endpoint.auth() & auth::key) {
					auto& api_key = request.headers().value("API-Key", 7);
					if (
						api_key.is_defined() &&
						m_server->get_username_by_api_key(username, api_key) == 0 &&
						m_server->verify_api_key(username, api_key) == 0
					) {
						authenticated = true;
					}
				}
			
				// Not authenticated.
				if (!authenticated) {
					response = m_server->m_resps->unauthorized;
					break;
				}
				
				// Execute.
				response = endpoint.func()(username, params, request.headers());
				break;
				
			}
		}
		if (!found) {
			response = m_server->m_resps->invalid_endpoint;
		}
		if ((status = m_server->m_attr->sock.send(client, response, timeout)) != 0) {
			return status;
		}
		return 0;
	}
	
	// ---------------------------------------------------------
	// Server thread.
	
	// Server thread.
	constexpr
	void	server_thread() {
		
		// Logs.
		if (m_attr->log_file.is_defined()) {
			m_attr->log_file.append(tostr(Date::now().mtime()));
			m_attr->log_file.append(": Starting the server.\n", 23);
		}

		// Bind.
        m_attr->sock.bind();

		// Listen.
        m_attr->sock.listen();

		// Start accept loop.
		if (m_attr->log_file.is_defined()) {
			m_attr->log_file.append(tostr(Date::now().mtime()));
			m_attr->log_file.append(": Accepting clients.\n", 21);
		}
		m_attr->status = 1;
		while (m_attr->status == 1) {
			accept();
		}

		// Flush files.
		if (m_attr->log_file.is_defined()) {
			m_attr->log_file.flush();
		}
		if (m_attr->error_file.is_defined()) {
			m_attr->error_file.flush();
		}
	}
	
	// Accept.
	constexpr
	void 	accept() requires (family == sockets::family::ipv4) {
        throw std::runtime_error("No longer supported.");
		
        // Serve in thread.
        // int status;
        // Addrin4 addr;
        // if ((status = m_attr->sock.accept(addr)) >= 0) {
        //     FThread thread;
        //     thread.start(
        //         serve_thread<Addrin4>,
        //         &(*this),
        //         (uint) status,
        //         addr
        //     );
        //     thread.detach();
        // }
  //
        // // Accept error.
        // else if (m_attr->error_file.is_defined()) {
        //     m_attr->error_file.append(tostr(Date::now().mtime()));
        //     m_attr->error_file.append(": Accept error.\n", 16);
        // }
		
	}
	constexpr
	void 	accept() requires (family == sockets::family::ipv6) {
		
		// Serve in thread.
		int status;
		Addrin6 addr;
		if ((status = m_attr->sock.accept(addr)) >= 0) {
			FThread thread;
			thread.start(
				serve_thread<Addrin6>,
				*this,
				(uint) status,
				addr
			);
			// thread.start(serve_thread);
			thread.detach();
		}

		// Accept error.
		else if (m_attr->error_file.is_defined()) {
			m_attr->error_file.append(tostr(Date::now().mtime()));
			m_attr->error_file.append(": Accept error.\n", 16);
		}
		
	}

// Public.
public:
	
	// ---------------------------------------------------------
	// Server thread.
	
	// Start the server.
	constexpr
	void*	run(void) {
		server_thread();
		return NULL;
	}
	
	// Send the stop signal to the server thread.
	/*  @docs {
		@title: Stop
		@description:
			Send the stop signal to the server thread.
		@return:
			Returns `0` upon success, and the error code upon failure (`< 0`).
	} */
	constexpr
	int 	stop() {
		m_attr->status = 0;
		return 0;
	}
	
	// ---------------------------------------------------------
	// Functions.

	// Initialize before start.
	/*  @docs {
		@title: Inititialize
		@description:
			Initialize the server, is required to be called before `start()`.
		@return:
			Returns `0` upon success, and the error code upon failure (`< 0`).
	} */
	constexpr
	int 	initialize() {
		random::random_seed(); // for key generation.
		int status;
		if ((status = init_database()) != 0) {
			return status;
		}
		if ((status = init_files()) != 0) {
			return status;
		}
		return 0;
	}
	
	// Sign data with the master sha key.
	/*  @docs {
		@title: Sign data
		@description:
			Sign data with the master sha key.
		@parameter: {
			@name: data
			@description: The data to sign.
		}
	} */
	constexpr
	String  hmac(const String& data) {
        return SHA256::hmac(m_attr->master_sha, data);
	}
	
	// ---------------------------------------------------------
	// Endpoints.
	
	// Create an endpoint.
	/*  @docs {
		@title: Endpoint
		@type: vlib::http::Endpoint
		@description:
			Create an endpoint.
		@return:
			Returns an endpoint object.
		@parameter: {
			@name: a
			@description: The endpoint attributes.
		}
	} */
    constexpr
    auto    endpoint(const typename Endpoint::attr& x) {
        return Endpoint(x);
    }
	
	// Add endpoints.
	constexpr
	void	add_endpoints() {}
	/*  @docs {
		@title: Add endpoints
		@description:
			Add endpoints to the server.
		@parameter: {
			@name: endpoint
			@description: The endpoint object.
		}
		@parameter: {
			@name: endpoints
			@description: The other endpoint objects.
		}
		@funcs: 2
	} */
	template <typename... Endpoints> constexpr
	void	add_endpoints(Endpoint&& endpoint, Endpoints&&... endpoints) {
		m_attr->endpoints.append(endpoint);
		add_endpoints(endpoints...);
	}
	template <typename... Endpoints> constexpr
	void	add_endpoints(const Endpoint& endpoint, Endpoints&&... endpoints) {
		m_attr->endpoints.append(endpoint);
		add_endpoints(endpoints...);
	}
	
	// ---------------------------------------------------------
	// Users.
	
	// Create user.
	/*  @docs {
		@title: Create user
		@description:
			Create a new user.
		@return:
			Returns `0` upon success, and the error code upon failure (`< 0`).
		@parameter: {
			@name: username
			@description: The new username.
		}
		@parameter: {
			@name: password
			@description: The user's new password.
		}
		@parameter: {
			@name: data
			@description: The user's storage data.
		}
	} */
	constexpr
	int		create_user(
		const String&	username,		// the user's username.
		const String&	password,		// the user's username.
		const Json& 	data = {}		// the user data.
	) {
		
		// Check invalid characters.
		if (username.contains('+')) {
			return restapi::error::invalid_username;
		}
		
		// User path.
		Path sys_path(m_attr->users_sys_path.join(username));
		
		// Check username.
		if (sys_path.exists()) {
			return restapi::error::duplicate_username;
		}
		
		// Save keys.
        String signed_pass = SHA256::hmac(m_attr->master_sha, password);
		Json sys_data({
			{"username", username},
			{"password", signed_pass},
			{"api_keys", JArray()},
			{"api_secrets", JArray()},
			{"access_tokens", JArray()},
			{"access_tokens_expiration", JArray()},
		});
		sys_path.save(sys_data.json());
		
		// Save user data.
		m_attr->users_path.join(username).save(data.json());
	
		// Success.
		return 0;
	}
	
	// Delete a user.
	/*  @docs {
		@title: Delete user
		@description:
			Delete an existing user.
		@return:
			Returns `0` upon success, and the error code upon failure (`< 0`).
		@parameter: {
			@name: username
			@description: The existing username.
		}
	} */
	constexpr
	int		delete_user(const String& username) {
		
		// User path.
		Path sys_path(m_attr->users_sys_path.join(username));
		
		// Check username.
		if (!sys_path.exists()) {
			return restapi::error::unknown_username;
		}
		
		// Reset user keys & data.
        try {
            sys_path.remove();
        } catch (Exception& e) {
            return file::error::remove;
        }
        try {
            m_attr->users_path.join(username).remove();
        } catch (Exception& e) {
            return file::error::remove;
        }
		
		// Success.
		return 0;
	}
	
	// Create an api key for a user.
	/*  @docs {
		@title: Create API key
		@description:
			Create an API key and API secret for an existing user.
		@return:
			Returns `0` upon success, and the error code upon failure (`< 0`).
		@parameter: {
			@name: api_key
			@description: A reference to the output API key string.
		}
		@parameter: {
			@name: api_secret
			@description: A reference to the output API secret string.
		}
		@parameter: {
			@name: username
			@description: The username of the user.
		}
	} */
	constexpr
	int		create_api_key(
		String& 			api_key,		// a reference to the user's api key (will be assigned).
		String& 			api_secret,		// a reference to the user's api secret (will be assigned).
		const String&	username		// the user's id.
	) {
		
		// User id.
		Path sys_path(m_attr->users_sys_path.join(username));
		
		// Check username.
		if (!sys_path.exists()) {
			return restapi::error::unknown_username;
		}
		
		// Generate keys.
		String raw_api_key = generate_key();
		api_key.reset();
		api_key.concat_r(username);
		api_key.append('+');
		api_key.concat_r(raw_api_key);
		api_secret = generate_key();
		
		// Save and load keys.
		Json sys_data = Json::load(sys_path);
		sys_data.value("api_keys", 8).asa().append(api_key);
		sys_data.value("api_secrets", 11).asa().append(api_secret);
		sys_data.save(sys_path);
			
		// Success.
		return 0;
	}
	
	// Delete an api key.
	/*  @docs {
		@title: Delete API key
		@description:
			Delete an existing API key and API secret from a user.
		@return:
			Returns `0` upon success, and the error code upon failure (`< 0`).
		@parameter: {
			@name: username
			@description: The username of the user.
		}
		@parameter: {
			@name: api_key
			@description: The API key to delete from the user.
		}
	} */
	constexpr
	int		delete_api_key(const String& username, const String& api_key) {
		
		// User id.
		Path sys_path(m_attr->users_sys_path.join(username));
		
		// Check username.
		if (!sys_path.exists()) {
			return restapi::error::unknown_username;
		}
		
		// Load data.
		Json sys_data = Json::load(sys_path);
		
		// Find index.
		auto& api_keys = sys_data.value("api_keys", 8).asa();
		auto index = api_keys.find(api_key);
		if (index == NPos::npos) {
			return restapi::error::invalid_api_key;
		}
		
		// Pop & save.
		api_keys.pop(index);
		sys_data.value("api_secrets", 11).asa().pop(index);
		sys_data.save(sys_path);
		
		// Success.
		return 0;
	}
	
	// Create an access token for a user.
	/*  @docs {
		@title: Create access token
		@description:
			Create an access token for an existing user.
		@return:
			Returns `0` upon success, and the error code upon failure (`< 0`).
		@parameter: {
			@name: access_token
			@description: A reference to the output access token string.
		}
		@parameter: {
			@name: username
			@description: The username of the user.
		}
		@parameter: {
			@name: expires_in
			@description: Expires in seconds.
		}
	} */
	constexpr
	int		create_access_token(String& access_token, const String& username, const time_t& expires_in = 86400) {
		
		// User id.
		Path sys_path(m_attr->users_sys_path.join(username));
		
		// Check username.
		if (!sys_path.exists()) {
			return restapi::error::unknown_username;
		}
		
		// Generate keys.
		String raw_access_token = generate_key();
		access_token.reset();
		access_token.concat_r(username);
		access_token.append('+');
		access_token.concat_r(raw_access_token);
		time_t expiration = Date::get_seconds() + expires_in;
		
		// Append & save.
		Json sys_data = Json::load(sys_path);
		sys_data.value("access_tokens", 13).asa().append(access_token);
		sys_data.value("access_tokens_expiration", 24).asa().append(expiration);
		sys_data.save(sys_path);
			
		// Success.
		return 0;
	}
	
	// Delete an access token.
	/*  @docs {
		@title: Delete access token
		@description:
			Delete an existing access token from a user.
		@return:
			Returns `0` upon success, and the error code upon failure (`< 0`).
		@parameter: {
			@name: username
			@description: The username of the user.
		}
		@parameter: {
			@name: access_token
			@description: The acces token to delete from the user.
		}
	} */
	constexpr
	int		delete_access_token(const String& username, const String& access_token) {
		
		// User id.
		Path sys_path(m_attr->users_sys_path.join(username));
		
		// Check username.
		if (!sys_path.exists()) {
			return restapi::error::unknown_username;
		}
		
		// Load data.
		Json sys_data = Json::load(sys_path);
		
		// Find index.
		auto& access_tokens = sys_data.value("access_tokens", 13).asa();
		auto index = access_tokens.find(access_token);
		if (index == NPos::npos) {
			return restapi::error::invalid_api_key;
		}
		
		// Pop & save.
		access_tokens.pop(index);
		sys_data.value("access_tokens_expiration", 24).asa().pop(index);
		sys_data.save(sys_path);
		
		// Success.
		return 0;
	}
	
	// Verify a username and password combination.
	/*  @docs {
		@title: Verify user
		@description:
			Verify a username and password combiniation.
		@return:
			Returns `0` upon success, and the error code upon failure (`< 0`).
		@parameter: {
			@name: username
			@description: The username of the user.
		}
		@parameter: {
			@name: password
			@description: The raw password of the user.
		}
	} */
	constexpr
	int		verify_user(const String& username, const String& password) {
		int status;
		Json data;
		if ((status = load_user_sys(data, username)) != 0) {
			return status;
		}
        String signed_pass = SHA256::hmac(m_attr->master_sha, password);
		if (signed_pass == data.value("password", 8).ass()) {
			return 0;
		}
		return restapi::error::invalid_auth;
	}
	
	// Load a user.
	/*  @docs {
		@title: Load user
		@description:
			Load the user's data.
		@return:
			Returns `0` upon success, and the error code upon failure (`< 0`).
		@parameter: {
			@name: data
			@description: A reference to the output json data.
		}
		@parameter: {
			@name: username
			@description: The username of the user.
		}
	} */
	constexpr
	int		load_user(Json& data, const String& username) {
		
		// User path.
		Path user_path (m_attr->users_path.join(username));
		
		// Check path.
		if (!user_path.exists()) {
			return restapi::error::unknown_username;
		}
		
		// Load data.
		data = Json::load(user_path);
		
		// Success.
		return 0;
	}
	
	// Save a user's data.
	/*  @docs {
		@title: Save user
		@description:
			Save the user's data.
		@return:
			Returns `0` upon success, and the error code upon failure (`< 0`).
		@parameter: {
			@name: username
			@description: The username of the user.
		}
		@parameter: {
			@name: data
			@description: The json data to save.
		}
	} */
	constexpr
	int		save_user(const String& username, const Json& data) {
		
		// User path.
		Path user_path (m_attr->users_path.join(username));
		
		// Check path.
		if (!user_path.exists()) {
			return restapi::error::unknown_username;
		}
		
		// Load data.
		data.save(user_path);
		
		// Success.
		return 0;
	}
	
	// Check if a user exists.
	/*  @docs {
		@title: User exists
		@description:
			Check if a user exists by username.
		@return:
			Returns `0` upon success, and the error code upon failure (`< 0`).
		@parameter: {
			@name: username
			@description: The username of the user.
		}
	} */
	constexpr
	bool	user_exists(const String& username) {
		return m_attr->users_sys_path.join(username).exists();
	}
	
	// Get a uid from the api key / access token.
	/*  @docs {
		@title: Get username by api key
		@description:
			Get the username from the encoded API key.
		@return:
			Returns `0` upon success, and the error code upon failure (`< 0`).
		@parameter: {
			@name: username
			@description: A reference to the output username string.
		}
		@parameter: {
			@name: api_key
			@description: The API key to retrieve the username from.
		}
		@funcs: 2
	} */
	constexpr
	int		get_username_by_api_key(String& username, const String& api_key) {
		username.reset();
		bool success = false;
		for (auto& i: api_key) {
			switch (i) {
				case '+': {
					success = true;
					break;
				}
				default: {
					username.append(i);
					continue;
				}
			}
			break;
		}
		if (!success) {
			return restapi::error::invalid_api_key;
		}
		return 0;
	}
	constexpr
	int		get_username_by_access_token(String& username, const String& access_token) {
		return get_username_by_api_key(username, access_token);
	}
	
	// Verify a user's api key.
	/*  @docs {
		@title: Verify API key
		@description:
			Verify an API key.
	 
			Optionally also verify the signature provided by the client.
		@return:
			Returns `0` upon success, and the error code upon failure (`< 0`).
		@parameter: {
			@name: api_key
			@description: The api key to verify.
		}
		@funcs: 3
	} */
	constexpr
	int		verify_api_key(const String& api_key) {
		int status;
		String username;
		if ((status = get_username_by_api_key(username, api_key)) != 0) {
			return status;
		}
		return verify_api_key(username, api_key);
	}
	constexpr
	int		verify_api_key(const String& username, const String& api_key) {
		int status;
		Json data;
		if ((status = load_user_sys(data, username)) != 0) {
			return status;
		}
		if (data.value("api_keys", 8).asa().find(api_key) == NPos::npos) {
			return restapi::error::invalid_api_key;
		}
		return 0;
	}
	constexpr
	int		verify_api_key(const String& username, const String& api_key, const String& signature, const String& data) {
		int status;
		Json sys_data;
		if ((status = load_user_sys(sys_data, username)) != 0) {
			return status;
		}
		ullong index;
		if ((index = sys_data.value("api_keys", 8).asa().find(api_key)) == NPos::npos) {
			return restapi::error::invalid_api_key;
		}
        String signed_data = SHA256::hmac(sys_data.value("api_secrets", 11).asa().get(index).ass(), data);
		if (!signature.eq(signed_data)) {
			return restapi::error::invalid_signature;
		}
		return 0;
	}
	
	// Verify a user's signature.
	/*  @docs {
		@title: Verify signature
		@description:
			Verify a user's signature
		@return:
			Returns `0` upon success, and the error code upon failure (`< 0`).
		@parameter: {
			@name: username
			@description: The username of the user.
		}
		@parameter: {
			@name: api_key
			@description: The API key of the user.
		}
		@parameter: {
			@name: signature
			@description: The provided signature.
		}
		@parameter: {
			@name: data
			@description: The data that has been used to create the signature.
		}
	} */
	constexpr
	int		verify_signature(const String& username, const String& api_key, const String& signature, const String& data) {
		return verify_api_key(username, api_key, signature, data);
	}
	
	// Verify a user's access token.
	/*  @docs {
		@title: Verify access token
		@description:
			Verify an access token.
		@return:
			Returns `0` upon success, and the error code upon failure (`< 0`).
		@parameter: {
			@name: access_token
			@description: The access token to verify.
		}
		@funcs: 2
	} */
	constexpr
	int		verify_access_token(const String& access_token) {
		int status;
		String username;
		if ((status = get_username_by_api_key(username, access_token)) != 0) {
			return status;
		}
		return verify_access_token(username, access_token);
	}
	constexpr
	int		verify_access_token(const String& username, const String& access_token) {
		int status;
		Json data;
		if ((status = load_user_sys(data, username)) != 0) {
			return status;
		}
		bool verified = false;
		auto now = Date::get_seconds();
		auto& access_tokens = data.value("access_tokens", 13).asa();
		auto& access_tokens_expiration = data.value("access_tokens_expiration", 24).asa();
		int pops = 0;
		for (auto& i: access_tokens.indexes()) {
			if (access_tokens_expiration.get(i).asi() <= now) {
				++pops;
			} else if (!verified && access_token.eq(access_tokens.get(i).ass())) {
				verified = true;
			}
		}
		if (pops != 0) {
			JArray new_access_tokens;
			JArray new_access_tokens_expiration;
			for (auto& i: access_tokens.indexes()) {
				if (access_tokens_expiration.get(i).asi() > now) {
					new_access_tokens.append(move(access_tokens.get(i)));
					new_access_tokens_expiration.append(access_tokens_expiration.get(i));
				}
			}
			access_tokens = move(new_access_tokens);
			access_tokens_expiration = move(new_access_tokens_expiration);
			m_attr->users_sys_path.join(username).save(data.json());
		}
		return 0;
	}
	
	// Sign data with a user's secret key.
	/*  @docs {
		@title: Sign data
		@description:
			Sign data with a user's secret key.
		@return:
			Returns `0` upon success, and the error code upon failure (`< 0`).
		@parameter: {
			@name: output
			@description: A reference to the output object.
		}
		@parameter: {
			@name: username
			@description: The username of the user.
		}
		@parameter: {
			@name: api_key
			@description: The api key of the user.
		}
		@parameter: {
			@name: data
			@description: The data to sign.
		}
	} */
	constexpr
	int		sign(String& output, const String& username, const String& api_key, const String& data) {
		int status;
		Json sys_data;
		if ((status = load_user_sys(sys_data, username)) != 0) {
			return status;
		}
		auto index = sys_data.value("api_keys", 8).asa().find(api_key);
		if (index == NPos::npos) {
			return restapi::error::invalid_api_key;
		}
        output = SHA256::hmac(sys_data.value("api_secrets", 11).asa().get(index).ass(), data);
		return 0;
	}

	// ---------------------------------------------------------
	// New responses.
	
	// Server response.
	/*  @docs {
		@title: Response
		@type: vlib::http::Response
		@description:
			Create a server response object.
		@return:
			Returns a response object.
		@parameter: {
			@name: status
			@description: The response status.
		}
		@parameter: {
			@name: headers
			@description: The response headers.
		}
		@parameter: {
			@name: body
			@description: The response body.
		}
		@funcs: 2
	} */
	constexpr
	auto 	response(const int& status, const http::Headers& headers, const String& body) {
		return http::Response(http_version, status, headers, body);
	}
	constexpr
	auto 	response(const int& status, const http::Headers& headers, const Json& body) {
		return http::Response(http_version, status, headers, body.json());
	}
	/*  @docs {
		@title: Compressed response
		@type: vlib::http::Response
		@description:
			Create a compressed server response object.
		@return:
			Returns a compressed response object.
		@parameter: {
			@name: status
			@description: The response status.
		}
		@parameter: {
			@name: headers
			@description: The response headers.
		}
		@parameter: {
			@name: body
			@description: The response body.
		}
		@funcs: 2
	} */
	constexpr
	auto 	compressed_response(const int& status, const http::Headers& headers, const String& body) {
        http::Headers new_headers = headers;
        new_headers["Content-Encoding"] = "gzip";
		return http::Response(http_version, status, new_headers, vlib::compress(body));
	}
	constexpr
	auto 	compressed_response(const int& status, const http::Headers& headers, const Json& body) {
		return compressed_response(status, headers, body.json());
	}
	
	// Internal server error.
	constexpr
	auto 	internal_server_error() {
		return vlib::http::Response(
			http_version,
			vlib::http::status::bad_request,
			{{"Content-Type", vlib::http::content_type::desc::json}},
			{{"error", "Internal server error."}}
		);
	}
	constexpr
	auto 	internal_server_error(const String& error) {
		return vlib::http::Response(
			http_version,
			vlib::http::status::bad_request,
			{{"Content-Type", vlib::http::content_type::desc::json}},
			{{"error", error}}
		);
	}
	constexpr
	auto 	internal_server_error(String&& error) {
		return vlib::http::Response(
			http_version,
			vlib::http::status::bad_request,
			{{"Content-Type", vlib::http::content_type::desc::json}},
			{{"error", error}}
		);
	}
	
	// Bad request.
	constexpr
	auto 	bad_request(const String& error) {
		return vlib::http::Response(
			http_version,
			vlib::http::status::bad_request,
			{{"Content-Type", vlib::http::content_type::desc::json}},
			{{"error", error}}
		);
	}
	constexpr
	auto 	bad_request(String&& error) {
		return vlib::http::Response(
			http_version,
			vlib::http::status::bad_request,
			{{"Content-Type", vlib::http::content_type::desc::json}},
			{{"error", error}}
		);
	}
	
	// Success.
	constexpr
	auto 	success(const String& body) {
		return vlib::http::Response(
			http_version,
			vlib::http::status::success,
			{{"Content-Type", vlib::http::content_type::desc::json}},
			body
		);
	}
	constexpr
	auto 	success(const Json& body) {
		return vlib::http::Response(
			http_version,
			vlib::http::status::success,
			{{"Content-Type", vlib::http::content_type::desc::json}},
			body
		);
	}
	constexpr
	auto 	success(Json&& body) {
		return vlib::http::Response(
			http_version,
			vlib::http::status::success,
			{{"Content-Type", vlib::http::content_type::desc::json}},
			body
		);
	}
	
	// ---------------------------------------------------------
	// Operators.

	// Dump to pipe.
	constexpr friend
	auto& 	operator <<(Pipe& pipe, const Server& obj) {
		return pipe << obj.m_attr->sock;
	}


};

// ---------------------------------------------------------
// End.

}; 		// End namespace https.
}; 		// End namespace vlib.
#endif 	// End header.
