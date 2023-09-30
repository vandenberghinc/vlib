
/*
 * @author: Daan van den Bergh
 * @copyright: © 2022 - 2023 Daan van den Bergh.
 */

// ---------------------------------------------------------
// Imports.

vlib.colors = {

	// ---------------------------------------------------------
	// Attributes.

	black: "\u001b[30m",
	red: "\u001b[31m",
	green: "\u001b[32m",
	yellow: "\u001b[33m",
	blue: "\u001b[34m",
	magenta: "\u001b[35m",
	cyan: "\u001b[36m",
	gray: "\u001b[37m",
	bold: "\u001b[1m",
	italic: "\u001b[3m",
	end: "\u001b[0m",

	// ---------------------------------------------------------
	// Functions.

	// Enable colors.
	/* 	@docs {
		@title: Enable
		@description:
			Enable the colors.
		@usage:
			vlib.colors.enable();
	}*/
	enable: function() {
		this.black = "\u001b[30m";
		this.red = "\u001b[31m";
		this.green = "\u001b[32m";
		this.yellow = "\u001b[33m";
		this.blue = "\u001b[34m";
		this.magenta = "\u001b[35m";
		this.cyan = "\u001b[36m";
		this.gray = "\u001b[37m";
		this.bold = "\u001b[1m";
		this.italic = "\u001b[3m";
		this.end = "\u001b[0m";
	},

	// Disable colors.
	/* 	@docs {
		@title: Disable
		@description:
			Disable the colors.
		@usage:
			vlib.colors.disable();
	}*/
	disable: function() {
		this.black = "";
		this.red = "";
		this.green = "";
		this.yellow = "";
		this.blue = "";
		this.magenta = "";
		this.cyan = "";
		this.gray = "";
		this.bold = "";
		this.italic = "";
		this.end = "";
	},

}
