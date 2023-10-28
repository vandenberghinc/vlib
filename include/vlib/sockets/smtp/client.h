// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

// Header.
#ifndef VLIB_SMTP_CLIENT_H
#define VLIB_SMTP_CLIENT_H

// Namespace vlib.
namespace vlib {

// Namespace smtp.
namespace smtp {

// ---------------------------------------------------------
// SMTP Client.
// Sources: https://github.com/Wohlstand/libSMTPClient/


/*  @docs
 *  @chapter: SMTP
 *  @title: SMTP Client
 *  @description:
 *      A simple SMTP client to send emails.
 *
 *      Make sure SPF and DKIM are properly set up when sending attachments.
 *  @warning:
 *      This object is still experimental and may contain bugs.
 *  @usage:
 *      #include <vlib/sockets/smtp.h>
 *      vlib::smtp::Client client ({
 *          .host = "smtp.domain.com",
 *          .port = 465,
 *          .email = "user\@domain.com",
 *          .pass = "MyPass!",
 *          .debug = false,
 *      });
 */
struct Client {

// Private.
private:

	// ---------------------------------------------------------
	// Aliases.

    using   Socket =    tls::Client<sockets::family::ipv4, sockets::type::stream, sockets::protocol::undefined, 1024, false, tls::version::any>;

	// ---------------------------------------------------------
	// Attributes.

    Socket          m_sock;
    String          m_email;
    String          m_pass;
    String          m_domain; // the domain that provided the signature.
    RSA             m_dkim; // enable dkim signatures by defining an RSA object.
    Int             m_timeout = 30 * 1000;
    Bool            m_debug = false;
    Bool            m_logged_in = false;
    Array<String>   m_debugs;
    
    // ---------------------------------------------------------
    // Private functions.
    
    // Receive till CRLF.
    // Not all servers response with a double CRLF.
    String  recv() {
        String received;
        while (true) {
            m_sock.recv(received, m_timeout);
            if (
                received.len() >= 2 &&
                received.rget(2) == '\r' &&
                received.rget(1) == '\n'
            ) {
                break;
            }
        }
        return received;
    }
    
    // Receive status.
    void    recv_status(const char* mode) {
        String received = recv();
        Int status = Int::parse(received.data(), 3);
        if (m_debug) {
            m_debugs.append(to_str(mode, ": ", received.replace_end_r("\r\n"), '.'));
        }
        switch(status.value()) {
            case 250:
            case 235:
            case 354:
            case 334:
            case 221:
                break;
            default: {
                if (m_debug) {
                    debug();
                }
                ullong pos;
                if ((pos = received.find("Error: ")) != NPos::npos) {
                    String err = received.slice(pos + 7).replace_end_r("\r\n");
                    throw SMTPError("vlib::smtp::Client", to_str("Encoutered an error while ", mode, ": ", err, " [", status, "]."));
                } else {
                    throw SMTPError("vlib::smtp::Client", to_str("Encoutered an error while ", mode, " [", status, "]."));
                }
            }
        }
    }
    
    // Command.
    void    command(const String& cmd, const char* mode = NULL, const Bool& encode = false) {
        command(cmd.data(), cmd.len(), mode, encode);
    }
    void    command(const char* cmd, const char* mode = NULL, const Bool& encode = false) {
        command(cmd, vlib::len(cmd), mode, encode);
    }
    void    command(const char* cmd, ullong len, const char* mode = NULL, const Bool& encode = false) {
        if (encode) {
            m_sock.send(Base64::encode(cmd, len), m_timeout);
        } else {
            m_sock.send(cmd, (uint) len, m_timeout);
        }
        // if (strcmp(cmd, "DATA") != 0) {
            m_sock.send("\r\n", 2, m_timeout);
        // }
        if (mode == NULL) {
            recv_status(cmd);
        } else {
            recv_status(mode);
        }
    }
    
    // Log in.
    constexpr
    auto&   login() {
        
        // Already logged in.
        if (m_logged_in && !m_sock.is_broken() && m_sock.is_connected()) {
            return *this;
        }
        
        // Connect.
        else if (m_sock.is_broken() || !m_sock.is_connected()) {
            if (m_logged_in) {
                m_sock.restart();
            }
            m_sock.connect(m_timeout.value());
            m_logged_in = false;
        }
        
        // Vars.
        String received;
        
        // Receive welcome message.
        received = m_sock.recv();
        
        // Commands.
        command("EHLO Here", "sending the initialization");
        command("AUTH LOGIN", "initializing the authentication");
        command(m_email, "sending the authentication email", true);
        command(m_pass, "sending the authentication password", true);
        
        // Set logged in.
        m_logged_in = true;
        
        
        // Handler.
        return *this;
    }

// Public.
public:

	// ---------------------------------------------------------
	// Constructors.
	
    // Default constructor.
    constexpr
    Client() = default;
    
    // Constructor.
    /*  @docs
     *  @title: Constructor
     *  @description:
     *      Construct the SMTP Client.
     *  @parameter:
     *      @name: args
     *      @description:
     *          The ConstructArgs object consists of the following values:
     *
     *          `struct ConstructArgs {
     *              String  host;                   // the smtp hostname.
     *              Int     port = 465;             // the smtp host port.
     *              String  email;                  // the auth email.
     *              String  pass;                   // the auth password.
     *              String  domain;                 // the domain name for the dkim signature (optional).
     *              RSA     dkim;                   // the RSA object with the dkim private key (optional).
     *              Int     timeout = 30 * 1000;    // the timeout in ms.
     *              Bool    debug = false;          // debugging enabled.
     *          };`
     *
     *          Though DKIM is mostly handled by the server, it is still included.
     *  @usage:
     *      #include <vlib/sockets/smtp.h>
     *      vlib::smtp::Client client ({
     *          String  host;
     *          Int     port = 465;
     *          String  email;
     *          String  pass;
     *          String  domain;
     *          RSA     dkim;
     *          Int     timeout = 30 * 1000;
     *          Bool    debug = false;
     *      });
     */
    struct ConstructArgs {
        String  host;
        Int     port = 465;
        String  email;
        String  pass;
        String  domain;
        RSA     dkim;
        Int     timeout = 30 * 1000;
        Bool    debug = false;
    };
    constexpr
    Client(const ConstructArgs& args) :
    // m_sock(args.host, vlib::null, args.port),
    m_email(args.email),
    m_pass(args.pass),
    m_domain(args.domain),
    m_dkim(args.dkim),
    m_timeout(args.timeout),
    m_debug(args.debug)
    {
        if (args.host.is_defined()) {
            m_sock.reconstruct(args.host, vlib::null, args.port);
        }
    }
    
    // ---------------------------------------------------------
    // Assignment operator.
    
    constexpr
    auto&   operator =(const ConstructArgs& args) {
        m_sock.reconstruct(args.host, vlib::null, args.port);
        m_email = args.email;
        m_pass = args.pass;
        m_domain = args.domain;
        m_dkim = args.dkim;
        m_timeout = args.timeout;
        m_debug = args.debug;
        return *this;
    }
    
    // ---------------------------------------------------------
    // Functions.
    
    // Is defined.
    /*  @docs
     *  @title: Is defined
     *  @description: Check if the object is defined.
     */
    constexpr bool is_defined() const { return m_email.is_defined(); }
    
    // Is undefined.
    /*  @docs
     *  @title: Is undefined
     *  @description: Check if the object is undefined.
     */
    constexpr bool is_undefined() const { return m_email.is_undefined(); }
    
    // Socket.
    /*  @docs
     *  @title: Socket
     *  @description: Get the underlying socket attribute.
     */
    constexpr auto& sock() const { return m_sock; }
    
    // Email.
    /*  @docs
     *  @title: Email
     *  @description: Get the email attribute used for authentication.
     */
    constexpr auto& email() const { return m_email; }
    
    // ---------------------------------------------------------
    // Functions.

    // Send mail.
    /*  @docs
     *  @title: Send Mail
     *  @description:
     *      Send one or multiple emails.
     *
     *      Take a look at `vlib::SMTP::Mail` for more details.
     *  @parameter:
     *      @name: args
     *      @description:
     *          The ConstructArgs object consists of the following values:
     *          `struct ConstructArgs {
     *              String  host;
     *              Int     port;
     *              String  email;
     *              String  pass;
     *              Bool    debug = false;
     *          };`
     *  @usage:
     *      vlib::SMTP::Client client { ... };
     *      client.send({
     *          .sender = {"Sender Name", "sender\@email.com"},
     *          .recipients = {
     *              {"Recipient Name", "recipient1\@email.com"},
     *              {"recipient2\@email.com"},
     *          },
     *          .subject = "Example Mail",
     *          .body = "Hello World!",
     *          .attachments = {"/path/to/image.png "}
     *      });
     *  @funcs: 2
     */
    Client& send(const Mail& mail) {
        return send(Array<Mail>{mail});
    }
    Client& send(const Array<Mail>& mails) {
        
        // Log in.
        if (!m_logged_in) {
            login();
        }
        
        // Iterate mails.
        for (auto& mail: mails) {
            command(to_str("MAIL FROM:<", mail.sender.m_email, ">"), "sending the sender details");
            for (auto& recipient: mail.recipients) {
                command(to_str("RCPT TO:<", recipient.m_email, ">"), "sending the recipient details");
            }
            command("DATA", "sending the mail command");
            command(m_dkim.is_defined() ? mail.build(m_domain, m_dkim) : mail.build(), "sending the mail data");
        }
        
        // Quit.
        try {
            command("QUIT", "sending the quit command");
        } catch (BrokenPipeError& e) {}
        
        // Handler.
        return *this;
        
    }
    
    // Dump debug info.
    constexpr
    void    debug(const Int& limit = 20) {
        if (!m_debug) {
            throw InvalidUsageError("vlib::smtp::Client", "Debugging is not enabled.");
        }
        ullong start = 0;
        if (m_debugs.len() > (ullong) limit.value()) {
            start = m_debugs.len() = limit.value();
        }
        for (auto& i: m_debugs.iterate(start)) {
            vlib::out << "SMTP Client: ";
            vlib::out << uppercase(i[0]);
            vlib::out.dump(i.data() + 1, i.len() - 1);
            vlib::out << '\n';
        }
        
    }
    
    // ---------------------------------------------------------
    // Attribute functions.

	
};

// ---------------------------------------------------------
// End.

}; 		// End namespace smtp.
}; 		// End namespace vlib.
#endif 	// End header.
