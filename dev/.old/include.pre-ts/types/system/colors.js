
/*
 * @author: Daan van den Bergh
 * @copyright: © 2022 - 2023 Daan van den Bergh.
 *
 * WARNING:
 *  This script is also embedded into vweb.
 *  Therefore, it must be a standalone script not depending on anything from vlib except for Array.iterate.
 *  And beware that `vlib` will be replaced with `vweb`.
 */

// ---------------------------------------------------------
// Imports.

/*  @docs:
	@chapter: System
    @title: Colors
    @desc: The colors class.
*/
vlib.colors = class Colors {

    // ---------------------------------------------------------
    // Attributes.

    static black = "\u001b[30m";
    static red = "\u001b[31m";
    static red_bold = "\u001b[31m\u001b[1m";
    static green = "\u001b[32m";
    static yellow = "\u001b[33m";
    static blue = "\u001b[34m";
    static magenta = "\u001b[35m";
    static cyan = "\u001b[36m";
    static light_gray = "\u001b[37m";
    static gray = "\u001b[90m";
    static bold = "\u001b[1m";
    static italic = "\u001b[3m";
    static end = "\u001b[0m";
    static purple = "\u001b[94m";
    static bg = {
    	black: "\u001b[40m",
		red: "\u001b[41m",
		green: "\u001b[42m",
		yellow: "\u001b[43m",
		blue: "\u001b[44m",
		magenta: "\u001b[45m",
		cyan: "\u001b[46m",
		white: "\u001b[47m",
    }
    static bright_bg = {
    	black: "\u001b[100m",
		red: "\u001b[101m",
		green: "\u001b[102m",
		yellow: "\u001b[103m",
		blue: "\u001b[104m",
		magenta: "\u001b[105m",
		cyan: "\u001b[106m",
		white: "\u001b[107m",
    }

    // ---------------------------------------------------------
    // Functions.

    // Enable colors.
    /* 	@docs
        @title: Enable
        @description:
            Enable the colors.
        @usage:
            vlib.colors.enable();
    */
    static enable() {
        Colors.black = "\u001b[30m";
        Colors.red = "\u001b[31m";
        Colors.red_bold = "\u001b[31m\u001b[1m";
        Colors.green = "\u001b[32m";
        Colors.yellow = "\u001b[33m";
        Colors.blue = "\u001b[34m";
        Colors.magenta = "\u001b[35m";
        Colors.cyan = "\u001b[36m";
        Colors.light_gray = "\u001b[37m";
        Colors.gray = "\u001b[90m";
        Colors.bold = "\u001b[1m";
        Colors.italic = "\u001b[3m";
        Colors.end = "\u001b[0m";
        Colors.purple = "\u001b[94m";
        Colors.bg = {
	    	black: "\u001b[40m",
			red: "\u001b[41m",
			green: "\u001b[42m",
			yellow: "\u001b[43m",
			blue: "\u001b[44m",
			magenta: "\u001b[45m",
			cyan: "\u001b[46m",
			white: "\u001b[47m",
	    }
	    Colors.bright_bg = {
	    	black: "\u001b[100m",
			red: "\u001b[101m",
			green: "\u001b[102m",
			yellow: "\u001b[103m",
			blue: "\u001b[104m",
			magenta: "\u001b[105m",
			cyan: "\u001b[106m",
			white: "\u001b[107m",
	    }
    }

    // Disable colors.
    /* 	@docs
        @title: Disable
        @description:
            Disable the colors.
        @usage:
            vlib.colors.disable();
    */
    static disable() {
        Colors.black = "";
        Colors.red = "";
        Colors.red_bold = "";
        Colors.green = "";
        Colors.yellow = "";
        Colors.blue = "";
        Colors.magenta = "";
        Colors.cyan = "";
        Colors.light_gray = "";
        Colors.gray = "";
        Colors.bold = "";
        Colors.italic = "";
        Colors.end = "";
        Colors.purple = "";
        Colors.bg = {
	    	black: "",
			red: "",
			green: "",
			yellow: "",
			blue: "",
			magenta: "",
			cyan: "",
			white: "",
	    };
	    Colors.bright_bg = {
	    	black: "",
			red: "",
			green: "",
			yellow: "",
			blue: "",
			magenta: "",
			cyan: "",
			white: "",
	    };
    }

}

// Color functions instead of strings.
vlib.color = {
    black: data => `${vlib.colors.black}${data}${vlib.colors.end}`,
    red: data => `${vlib.colors.red}${data}${vlib.colors.end}`,
    red_bold: data => `${vlib.colors.red_bold}${data}${vlib.colors.end}`,
    green: data => `${vlib.colors.green}${data}${vlib.colors.end}`,
    yellow: data => `${vlib.colors.yellow}${data}${vlib.colors.end}`,
    blue: data => `${vlib.colors.blue}${data}${vlib.colors.end}`,
    magenta: data => `${vlib.colors.magenta}${data}${vlib.colors.end}`,
    cyan: data => `${vlib.colors.cyan}${data}${vlib.colors.end}`,
    light_gray: data => `${vlib.colors.light_gray}${data}${vlib.colors.end}`,
    gray: data => `${vlib.colors.gray}${data}${vlib.colors.end}`,
    bold: data => `${vlib.colors.bold}${data}${vlib.colors.end}`,
    italic: data => `${vlib.colors.italic}${data}${vlib.colors.end}`,
    end: data => `${vlib.colors.end}${data}${vlib.colors.end}`,
    purple: data => `${vlib.colors.purple}${data}${vlib.colors.end}`,
    bg: {
    	black: data => `${vlib.colors.bg.black}${data}${vlib.colors.end}`,
		red: data => `${vlib.colors.bg.red}${data}${vlib.colors.end}`,
		green: data => `${vlib.colors.bg.green}${data}${vlib.colors.end}`,
		yellow: data => `${vlib.colors.bg.yellow}${data}${vlib.colors.end}`,
		blue: data => `${vlib.colors.bg.blue}${data}${vlib.colors.end}`,
		magenta: data => `${vlib.colors.bg.magenta}${data}${vlib.colors.end}`,
		cyan: data => `${vlib.colors.bg.cyan}${data}${vlib.colors.end}`,
		white: data => `${vlib.colors.bg.white}${data}${vlib.colors.end}`,
    },
    bright_bg: {
    	black: data => `${vlib.colors.bright_bg.black}${data}${vlib.colors.end}`,
		red: data => `${vlib.colors.bright_bg.red}${data}${vlib.colors.end}`,
		green: data => `${vlib.colors.bright_bg.green}${data}${vlib.colors.end}`,
		yellow: data => `${vlib.colors.bright_bg.yellow}${data}${vlib.colors.end}`,
		blue: data => `${vlib.colors.bright_bg.blue}${data}${vlib.colors.end}`,
		magenta: data => `${vlib.colors.bright_bg.magenta}${data}${vlib.colors.end}`,
		cyan: data => `${vlib.colors.bright_bg.cyan}${data}${vlib.colors.end}`,
		white: data => `${vlib.colors.bright_bg.white}${data}${vlib.colors.end}`,
    },
}