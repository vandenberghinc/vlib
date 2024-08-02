// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

// ---------------------------------------------------------
// Imports.

const WebSocket = require('ws');
const liburl = require('url');

// Library.
vlib.websocket = {};

// ---------------------------------------------------------
// Server class.

/*  @docs:
  	@chapter: Sockets
  	@experimental: true
    @title: Websocket Server
    @descr: Websocket server object.
    @param:
        @name: ip
        @descr: The optional server listen ip.
    @param:
        @name: port
        @descr: The server listen post.
    @param:
        @name: https
        @descr: The https settings for `https.createServer`. When left undefined a http server will be used.
    @param:
        @name: rate_limit
        @descr: Rate limit settings for the http upgrade request. Rate limiting can be disabled by defining `rate_limit` as `false`.
        @type: object, boolean
    	@attr:
    	    @name: limit
    	    @descr: The limit on the amount of requests in the specified interval.
    	@attr:
    	    @name: interval
    	    @descr: The rate limit reset interval in seconds.
    @param:
        @name: api_keys
        @descr: An array of allowed client api keys. When no api keys are defined, no authentication will be required.
    @param:
        @name: server
        @descr: Optionally pass the server initialized server object directly. Either an http or https server object.
 */

vlib.websocket.Server = class Server {
    constructor({
    	ip = null,
    	port = 8000,
    	https = null,
    	rate_limit = {
    		limit: 5,
    		interval: 60,
    	},
    	api_keys = [],
    	server = null,
    }) {

    	// Parameters.
    	this.port = port;
    	this.https_config = https;
    	this.server = server;
        this.api_keys = api_keys;
        this.rate_limit = rate_limit;

    	// Attributes.
    	this.streams = new Map();
    	this.commands = new Map();
    	this.events = new Map();
    	this.rate_limit_cache = new Map();

    }

    // Start.
    /*  @docs:
     *  @title: Start
     *  @descr: Start the server.
     */
    start() {

    	// Initialize server.
    	if (this.server === null) {
	    	if (this.https_config != null) {
	    		this.server = libhttps.createServer(this.https_config, (req, res) => {
		            // Respond with a 426 Upgrade Required status code to indicate
				    // that the server expects a WebSocket upgrade request.
				    res.writeHead(426, { 'Content-Type': 'text/plain' });
				    res.end('This service requires WebSocket protocol.');
		        });
		        this.server.__is_https = true;
	    	} else {
	    		this.server = libhttp.createServer((req, res) => {
		            // Respond with a 426 Upgrade Required status code to indicate
				    // that the server expects a WebSocket upgrade request.
				    res.writeHead(426, { 'Content-Type': 'text/plain' });
				    res.end('This service requires WebSocket protocol.');
		        });
	    	}
	    }

        // Initialize websocket.
        this.wss = new WebSocket.Server({ noServer: true });

        // On upgrade.
        this.server.on('upgrade', (request, socket, head) => {

        	// Rate limit.
        	if (this.rate_limit !== false) {
	        	const ip = request.socket.remoteAddress;
				const now = Date.now();
				if (this.rate_limit_cache.has(ip)) {
					let data = this.rate_limit_cache.get(ip);
					if (now >= data.expiration) {
						data = {
							count: 0,
							expiration: now + this.rate_limit.interval * 1000,
						};
					}
					++data.count;
					if (data.count > this.rate_limit.limit) {
						socket.write(`HTTP/1.1 429 Too Many Requests\r\n\r\nRate limit exceeded, please try again in ${parseInt((data.expiration - now) / 1000)} seconds.`);
		                socket.destroy();
		                return;
					}
					this.rate_limit_cache.set(ip, data);
				} else {
					this.rate_limit_cache.set(ip, {
						count: 1,
						expiration: now + this.rate_limit.interval * 1000,
					});
				}
			}

        	// Check api key.
            const { query } = liburl.parse(request.url, true);
            if (this.api_keys.length > 0 && !this.api_keys.includes(query.api_key)) {
                socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
                socket.destroy();
                return;
            }

            // Upgrade.
            this.wss.handleUpgrade(request, socket, head, (stream) => {
                this.wss.emit('connection', stream, request);
            });
        });

        // On connection.
        this.wss.on('connection', (stream) => {
            	
            // Generate id.
            stream.id = Math.random().toString(36).substr(2, 16);
            // console.log(`Client ${stream.id} connected.`);
            this.streams.set(stream.id, stream);

            // Client message queue.
            stream.messages = new Map();

            // On message.
            stream.on('message', (message) => {
                
            	// Parse object.            
	            try {
			        message = libbson.deserialize(message);
			   	}

			    // Not a json object.
			    catch (error) {

			    	// Ping.
	            	if (message.toString() === "ping") {
	            		stream.send("pong");
	            		return ;
	            	}

            		// Proceed with error.
			    	if (this.on_no_json_message !== undefined) {
			    		this.on_no_json_message(message);
			    	}
			    	return ;
			    }

		        // Process.
	        	if (message.timestamp == null) {
	        		message.timestamp = Date.now();
	        	}
			    if (message.command != null && this.commands.has(message.command)) {
					this.commands.get(message.command)(stream, message.id, message.data);
			    } else if (message.id != null) {
	        		stream.messages.set(message.id, message);
	        	}
            });

            // On open.
            if (this.events.has("open")) {
        		this.events.get("open")(stream);
        	}

            // On close.
            stream.on('close', (code, reason) => {   
	            stream.connected = false;
	            if (this.events.has("close")) {
	        		this.events.get("close")(stream, code, reason);
	        	}
            });

            // On error.
            const err_callback = this.events.get("open");
            if (err_callback) {
	            stream.on("error", (e) => err_callback(stream, e));
	        }
        });

        // Start listening.
        if (this.ip) {
        	this.server.listen(this.port, this.ip, () => {
        		if (this.events.has("listen")) {
	        		this.events.get("listen")(`${this.server.__is_https ? "https" : "http"}://${this.ip}:${this.port}`);
	        	}
	        });
        } else {
        	this.server.listen(this.port, () => {
        		if (this.events.has("listen")) {
	        		this.events.get("listen")(`${this.server.__is_https ? "https" : "http"}://localhost:${this.port}`);
	        	}
	        });
        }

        // Clear caches.
        this._clear_caches();
    }

    // Stop.
    /*  @docs:
     *  @title: Stop
     *  @descr: Stop the server.
     */
    async stop() {
    	return new Promise((resolve) => {

    		// Stop timeout.
    		clearTimeout(this._clear_caches_timeout);

	    	// First, close all WebSocket client connections.
		    this.wss.clients.forEach(client => {
		        client.close();
		    });

		    // Next, close the WebSocket server to prevent new connections.
		    let closed = 0;
		    this.wss.close(() => {
		        ++closed;
		        if (closed === 2) { resolve(); }
		    });

		    // Finally, close the HTTPS server.
		    this.server.close(() => {
		        ++closed;
		        if (closed === 2) { resolve(); }
		    });
		})
    }

    // On event callback.
    /*  @docs:
     *  @title: Event callback
     *  @descr:
     *      Set an event callback.
     *
     *		The following callbacks can be set.
     *		- listen: (address) => {}
     *		- open: (stream) => {}
     *		- close: (stream, code, reason) => {}
     *		- error: (stream, error) => {}
     */
    on_event(event, callback) {
    	this.events.set(event, callback);
    }

    // On command callback.
    /*  @docs:
     *  @title: Command
     *  @descr:
     *      Set a command callback.
     *
     *		Will be called when an incoming message has the specified command type.
     *
     *		The function can take the following arguments: `(stream, id, data) => {}`.
     */
    on(command, callback) {
    	this.commands.set(command, callback);
    }

    // Send data.
    /*  @docs:
     *  @title: Send
     *  @descr: 
     *		Send data through the websocket.
     *		
     *		When responding on a request use the same message id to create a response. Each message should have a message id so a request/response system can be created. 
     *  @param:
     *      @name: stream
     *      @descr: The client stream to send to.
     *  @param:
     *      @name: command
     *      @descr: The command type.
     *  @param:
     *      @name: id
     *      @descr: The message id.
     *  @param:
     *      @name: data
     *      @descr: The data to send.
     */
    async send({stream, command, id, data}) {
    	if (id == null) {
    		id = String.random(32);
    	}
    	stream.send(libbson.serialize({
    		command,
    		id: id,
    		data: data,
    	}))
    	return id;
    }

    // Async await message.
    /*  @docs:
     *  @title:  Await response
     *  @descr: Wait for a message to be filled out.
     *	@note: This only works when there is a single response message, any more response messages will be lost.
     *  @param:
     *      @name: stream
     *      @descr: The client stream.
     *  @param:
     *      @name: id
     *      @descr: Message id to wait for.
     *  @param:
     *      @name: timeout
     *      @descr: The maximum number of milliseconds to wait before timing out the operation.
     *  @param:
     *      @name: step
     *      @descr: The step value at which the message should run.
     */
    async await_response({stream, id, timeout = 60000, step = 10}) {
    	let elpased = 0;
    	return new Promise((resolve, reject) => {
    		const wait = () => {
    			if (stream.messages.has(id)) {
    				const data = stream.messages.get(id)
    				stream.messages.delete(id)
    				return resolve(data);
    			} else {
    				elpased += step;
    				if (elpased > timeout) {
    					return reject(new Error("Operation timed out."));
    				}
    				setTimeout(wait, step);
    			}
	    	}
	    	wait();
    	})
    }

    // Send a command and expect a response.
    /*  @docs:
     *  @title: Request
     *  @descr: Send a command and expect a single response.
     *	@note: This only works when there is a single response message, any more response messages will be lost.
     *  @param:
     *      @name: stream
     *      @descr: Stream from which to send the request. Should be the body of the response, as a single bytes object.
     *  @param:
     *      @name: command
     *      @descr: The command to execute.
     *  @param:
     *      @name: data
     *      @descr: The command data.
     *  @param:
     *      @name: timeout
     *      @descr: The maximum amount of milliseconds to wait before the response times out.
     */
    async request({stream, command, data, timeout = 60000}) {
    	const id = await this.send({stream, command, data});
    	return this.await_response({stream, id, timeout});
    }

    // Clear caches.
    _clear_caches(client) {
    	const now = Date.now();
    	for (const [id, client] of this.streams) {
    		if (client.connected) {
    			for (const [msg_id, msg] of client.messages) {
    				if (msg.timestamp && now >= msg.timestamp + (3600 * 1000)) {
    					client.messages.delete(msg_id);
    				}
    			}
	    	} else {
	    		this.streams.delete(id);
	    	}
    	}
    	this._clear_caches_timeout = setTimeout(() => this._clear_caches(), 3600 * 1000)
    }
}

// ---------------------------------------------------------
// Client class.

/*  @docs:
	@chapter: Sockets
  	@experimental: true
    @title: Websocket Client
    @descr: The websocket client object.
    @param:
        @name: address
        @descr: The address of the server you want to connect to.
    @param:
        @name: api_key
        @descr: The api_key needed by the connection to start the handshake.
    @param:
        @name: reconnect
        @descr: Enable automatic reconnection. Define `false` to disable automatic reconnection, use `true` to enable automatic reconnection with the default options. Or define custom options.
        @type: boolean, object
    	@attribute:
    	    @name: interval
    	    @descr: Interval for reconnect attempt
        	@type: type
    	@attribute:
    	    @name: max_interval
    	    @descr: The maximum interval for a reconnect attempt. The interval gradually backs off on consequent connection failures.
        	@type: type
    @param:
        @name: ping
        @descr: Enable automatic pings to keep the connection alive. Can be either a boolean, or a milliseconds number as the auto ping interval. Default interval is `30000`.
  		@type: boolen, number
 */
vlib.websocket.Client = class Client {
    constructor({
    	url = "wss://localhost:8080",
    	api_key = null,
    	reconnect = {
    		interval: 10,
    		max_interval: 30000,
    	},
    	ping = true, 
    }) {
        this.url = url;
        this.api_key = api_key;

        // Set reconnect.
        if (reconnect === false) {
        	this.reconnect = false;
        } else {
        	if (reconnect === true) {
	        	reconnect = {};
	        }
        	this.reconnect = reconnect;
        	this.reconnect.enabled = true;
        	this.reconnect.attempts = 0;
        	if (this.reconnect.interval == null) {
	        	this.reconnect.interval = 10;
	        }
	        if (this.reconnect.max_interval == null) {
	        	this.reconnect.max_interval = 30000;
	        }
        }

        // Set auto ping.
        if (ping === true) {
        	this.auto_ping = 30000;
        }
        else if (typeof ping === "number") {
        	this.auto_ping = ping;
        } else {
        	this.auto_ping = false;
        }

        // Attributes.
        this.commands = new Map();
        this.events = new Map();
        this.messages = new Map();

    }

    // Connect.
    /*  @docs:
     *  @title: Connect
     *  @descr:
     *      Connect the websocket.
     */
    async connect() {
    	return new Promise((resolve) => {

	    	// Reset vars.
	    	this.try_reconnect = this.rate_limit !== false;

	    	// Create stream.
	        this.stream = new WebSocket(this.api_key ? `${this.url}?api_key=${this.api_key}` : this.url);

	        // On open.
	        this.stream.on('open', () => {
	            this.connected = true;
	            if (this.try_reconnect) {
	            	this.reconnect.attempts = 0;
	            }
	            if (this.events.has("open")) {
	        		this.events.get("open")();
	        	}
	        	resolve();
	        });

	        // On message.
	        this.stream.on('message', (message) => {
		
				// Parse object.            
	            try {
			        message = libbson.deserialize(message);
			   	}

			    // Not a json object.
			    catch (error) {

			    	// Pong.
		        	if (message.toString() === "pong") {
		        		return ;
		        	}

		        	// Proceed with error.
			    	if (this.on_no_json_message !== undefined) {
			    		this.on_no_json_message(message);
			    	}
			    	return ;
			    }

		        // Cache message.
			    if (message.command != null && this.commands.has(message.command)) {
					this.commands.get(message.command)(message.id, message.data);
			    } else if (message.id) {
			    	if (message.timestamp == null) {
		        		message.timestamp = Date.now();
		        	}
	        		this.messages.set(message.id, message);
	        	}

	        });

			// On close.
	        this.stream.on('close', (code, reaseon) => {
	        	this.connected = false;
	        	if (this.try_reconnect) {
	        		if (this.events.has("reconnect")) {
		        		this.events.get("reconnect")(code, reaseon);
		        	}
	        		let timeout = Math.min(this.reconnect.interval * Math.pow(2, this.reconnect.attempts), this.reconnect.max_interval);
			        this.reconnect.attempts++;
			        setTimeout(() => this.connect(), timeout);
	        	} else if (this.events.has("close")) {
	        		this.events.get("close")(code, reaseon);
	        	}
	        });

	        // On error.
	        this.stream.on('error', (error) => {
	        	// console.error('Socket encountered error: ', error + '. Closing socket');
	        	this.stream.close();
	            if (this.events.has("error")) {
	        		this.events.get("error")(error);
	        	}
	        });

	        // Send ping every x seconds.
	        let ping_every = typeof this.auto_ping === "number" ? this.auto_ping : 30000
	        clearTimeout(this.auto_ping_timeout)
	        const auto_ping = () => {
	        	if (this.connected) {
	        		this.stream.send("ping");
	        		this.auto_ping_timeout = setTimeout(auto_ping, ping_every);
	        	}
	        }
	        this.auto_ping_timeout = setTimeout(auto_ping, ping_every)
	    })
    }

    // Disconnect.
    /*  @docs:
     *  @title: Disconnect
     *  @descr:
     *      Disconnect from the server.
     *      	 
     *      Automatically calls `close()`.
     */
    disconnect() {
    	this.try_reconnect = false;
    	this.stream.close();
    	clearTimeout(this.auto_ping_timeout)
    }

    // Await till connected.
    async await_till_connected(timeout = 60000) {
    	if (this.connected) { return ; }
    	let step = 10;
    	let elpased = 0;
    	return new Promise((resolve, reject) => {
    		const is_connected = () => {
    			if (this.connected) {
    				return resolve();
    			} else {
    				elpased += step;
    				if (elpased > timeout) {
    					return reject(new Error("Timeout."));
    				}
    				setTimeout(is_connected, step);
    			}
	    	}
	    	is_connected();
    	})
    }

    // On event callback.
    /*  @docs:
     *  @title: Event callback
     *  @descr:
     *      Set an event callback.
     *
     *		The following callbacks can be set.
     *		- open: (stream) => {}
     *		- error: (stream, error) => {}
     *		- reconnect: (stream, code, reaseon) => {}
     *		- close: (stream, code, reaseon) => {}
     */
    on_event(event, callback) {
    	this.events.set(event, callback);
    }

    // On command callback.
    /*  @docs:
     *  @title: Command callback
     *  @descr:
     *      Set a command callback.
     *
     *		Will be called when an incoming message has the specified command type.
     *
     *		The function can take the following arguments: `(stream, id, data) => {}`.
     */
    on(command, callback) {
    	this.commands.set(command, callback);
    }

    // Send raw data, could cause undefined behaviour.
    /*  @docs:
     *  @title: Send raw
     *  @descr: Send raw data through the websocket.
     *  @param:
     *      @name: data
     *      @descr: The data to send.
     */
    async send_raw(data) {
    	await this.await_till_connected();
    	this.stream.send(data)
    }

    // Send data.
    /*  @docs:
     *  @title: Send
     *  @descr: 
     *		Send data through the websocket.
     *		
     *		When responding on a request use the same message id to create a response. Each message should have a message id so a request/response system can be created. 
     *  @param:
     *      @name: command
     *      @descr: The command type.
     *  @param:
     *      @name: id
     *      @descr: The message id.
     *  @param:
     *      @name: data
     *      @descr: The data to send.
     */
    async send({command, id, data}) {
    	await this.await_till_connected();
    	if (id == null) {
    		id = String.random(32);
    	}
    	this.stream.send(libbson.serialize({
    		command,
    		id: id,
    		data: data,
    	}))
    	return id;
    }

    // Async await message.
    /*  @docs:
     *  @title:  Await response
     *  @descr: Wait for a message to be filled out.
     *	@note: This only works when there is a single response message, any more response messages will be lost.
     *  @param:
     *      @name: id
     *      @descr: Message id to wait for.
     *  @param:
     *      @name: timeout
     *      @descr: The maximum number of milliseconds to wait before timing out the operation.
     *  @param:
     *      @name: step
     *      @descr: The step value at which the message should run.
     */
    async await_response({id, timeout = 60000, step = 10}) {
    	let elapsed = 0;
    	return new Promise((resolve, reject) => {
    		const wait = () => {
    			if (this.messages.has(id)) {
    				const data = this.messages.get(id)
    				this.messages.delete(id)
    				return resolve(data);
    			} else {
    				elapsed += step;
    				if (elapsed > timeout) {
    					return reject(new Error("Operation timed out."));
    				}
    				setTimeout(wait, step);
    			}
	    	}
	    	wait();
    	})
    }

    // Send a command and expect a response.
    /*  @docs:
     *  @title: Request
     *  @descr: Send a command and expect a single response.
     *	@note: This only works when there is a single response message, any more response messages will be lost.
     *  @param:
     *      @name: command
     *      @descr: The command to execute.
     *  @param:
     *      @name: data
     *      @descr: The command data.
     *  @param:
     *      @name: timeout
     *      @descr: The maximum amount of milliseconds to wait before the response times out.
     */
    async request({command, data, timeout = 60000}) {
    	const id = await this.send({command, data});
    	return await this.await_response({id, timeout});
    }

    // Clear caches.
    _clear_caches(client) {
    	const now = Date.now();
    	for (const [id, client] of this.streams) {
    		if (client.connected) {
    			for (const [msg_id, msg] of client.messages) {
    				if (msg.timestamp && now >= msg.timestamp + (60 * 5 * 1000)) {
    					client.messages.delete(msg_id);
    				}
    			}
	    	} else {
	    		this.streams.delete(id);
	    	}
    	}
    	this._clear_caches_timeout = setTimeout(() => this._clear_caches(), 60 * 5 * 1000)
    }
}