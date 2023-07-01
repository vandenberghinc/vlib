// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

// Header.
#ifndef VLIB_SMTP_MAIL_H
#define VLIB_SMTP_MAIL_H

// Namespace vlib.
namespace vlib {

// Namespace smtp.
namespace smtp {

// ---------------------------------------------------------
// SMTP Mail context.
// Sources: https://github.com/Wohlstand/libSMTPClient/

// Address for sender or recipient.
struct Address {
    
    // Attributes.
    String  m_name;
    String  m_email;
    
    // Constructors.
    constexpr
    Address() = default;
    constexpr
    Address(const String& email) :
    m_email(email) {}
    constexpr
    Address(const String& name, const String& email) :
    m_name(name),
    m_email(email) {}
    
};

/*  @docs {
 *  @chapter: SMTP
 *  @title: SMTP Mail
 *  @description:
 *      A SMTP Mail object for the SMTP Client.
 *
 *      The mail supports HTML format.
 *
 *      Addresses can contain of a single email addres or a name and email address.
 *
 *      The function `Mail::build()` is automatically called in `SMTP::Client::send()`.
 *  @usage:
 *      #include <vlib/sockets/smtp.h>
 *      vlib::smtp::Mail mail {
 *          .sender = {"Sender Name", "sender@email.com"},
 *          .recipients = {
 *              {"Recipient Name", "recipient1@email.com"},
 *              {"recipient2@email.com"},
 *          },
 *          .cc_recipients = {},
 *          .bcc_recipients = {},
 *          .subject = "Example Mail",
 *          .body = "Hello World!",
 *          .attachments = {"/path/to/image.png "}
 *      };
 } */
struct Mail {

	// ---------------------------------------------------------
	// Attributes.

    Address             sender; 			// the sender.
	Array<Address>      recipients; 	    // the recipients.
    Array<Address>      cc_recipients;      // the cc recipients.
    Array<Address>      bcc_recipients;     // the bcc recipients.
	String			    subject; 		    // the mail's subject.
	String			    body; 			    // the body.
	Array<Path>	        attachments;	    // attachment file paths.
	
	// ---------------------------------------------------------
	// Static attributes.
	
	static const String text_boundry;
	
// Private.
private:
	
    // ---------------------------------------------------------
    // Private functions.
	
    // Build headers.
    void    build_header(String& output) const {
        
        // From.
        if (sender.m_name.is_defined()) {
            output.concats_r(
                "From: \"=?UTF-8?B?",
                Base64::encode(sender.m_name),
                "?=\" <", sender.m_email, ">\r\n"
            );
        } else {
            output.concats_r("From: <", sender.m_email, ">\r\n");
        }
        
        // Add recipients func.
        auto add_recipients = [&](const char* header, const Array<Address>& recipients) {
            if (recipients.len() > 0) {
                output.concats_r(header, ':', ' ');
                ullong index = 0;
                for (auto& recipient: recipients) {
                    if (index > 0) {
                        output.concat_r(", ", 2);
                    }
                    if (recipient.m_name.is_defined()) {
                        output.concats_r(
                                         "\"=?UTF-8?B?",
                                         Base64::encode(recipient.m_name),
                                         "?=\" <", recipient.m_email, ">"
                                         );
                    } else {
                        output.concats_r('<', recipient.m_email, '>');
                    }
                    ++index;
                }
                output.concats_r("\r\n");
            }
        };
        
        // Add recipients.
        add_recipients("To", recipients);
        add_recipients("CC", cc_recipients);
        add_recipients("BCC", bcc_recipients);
        
        // Subject.
        if (subject.is_defined()) {
            output.concats_r(
                "Subject: =?UTF-8?B?",
                Base64::encode(subject),
                "?=\r\n"
            );
        }
        
        // Date.
        time_t t;
        time(&t);
        char date[64];
		struct tm time_info;
		localtime_r(&t, &time_info);
        strftime(date, (33), "%a, %d %b %Y %H:%M:%S %z", &time_info);
        output.concats_r("Date: ", date, "\r\n");
        
        // Concat.
        output.concats_r(
            "MIME-Version: 1.0\r\n"
            "X-Mailer: VLib SMTP Client\r\n"
            "Content-Type:multipart/mixed; boundary=\"", text_boundry, "\"\r\n",
            "\r\n"
        );
        
    }
	
	// Build headers and body.
	void	build_body(String& output) const {
		output.concats_r(
            "--", text_boundry, "\r\n"
            "Content-Type: text/html; charset=\"utf-8\"\r\n",
            // "Content-Transfer-Encoding: 8bit\r\n"
            "\r\n", body, "\r\n"
        );
	}	
	
	// Build attachments.
	void    build_attachments(String& output) const {
        Int attachment_id = 0;
        for (auto& path: attachments) {
            output.concats_r(
                "--", text_boundry, "\r\n"
                "Content-Type: application/octet-stream\r\n"
                // "Content-Type: image/png;\r\n",
                "Content-Transfer-Encoding: base64\r\n"
                "X-Attachment-Id: ", ++attachment_id, "\r\n"
                "Content-Disposition: attachment; "
                "filename=\"", path.full_name(), "\"\r\n",
                "\r\n",
                Base64::encode(path.load()),
                "\r\n"
            );
        }
	}
	
	// Build end.
	void	build_end(String& output) const {
        output.concats_r("--", text_boundry, "--\r\n.");
	}
	
// Public.
public:
	
	// ---------------------------------------------------------
	// Functions.
	
	// Build messages.
	
	// Build.
	String 	build() const {
		String output;
        build_header(output);
        build_body(output);
		build_attachments(output);
		build_end(output);
		return output;
	}
    String     build(const String& domain, const RSA& dkim) const {
        
        // Build.
        String output;
        build_header(output);
        build_body(output);
        build_attachments(output);
        build_end(output);
        
        // Signature.
        String hash = SHA256::hash(output);
        String signature = Base64::encode(dkim.sign<crypto::mode::sha256>(hash));
        String dkim_header;
        dkim_header.concats_r(
            "DKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed;\r\n",
            "    d=", domain, "; s=selector1;\r\n",
            "    q=dns/text; t=", Date::get_seconds(), ";\r\n",
            "    h=From:To:CC:BCC:Subject:Date:Mime-Version:X-Mailer:Content-Type:Content-Transfer-Encoding:Content-Disposition:X-Attachment-Id;\r\n"
            "    bh=", Base64::encode(hash), ";\r\n",
            "    b=", signature, ";\r\n"
        );
        output = dkim_header + output;
        print(output);
        return output;
    }
	
	
};

// Static variables.
const String Mail::text_boundry = "------------03145242DFEEEAFBB1FE425E";

// ---------------------------------------------------------
// End.

}; 		// End namespace smtp.
}; 		// End namespace vlib.
#endif 	// End header.
