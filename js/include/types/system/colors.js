
/*
 * @author: Daan van den Bergh
 * @copyright: © 2022 - 2023 Daan van den Bergh.
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
	static gray = "\u001b[37m";
	static bold = "\u001b[1m";
	static italic = "\u001b[3m";
	static end = "\u001b[0m";

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
		Colors.gray = "\u001b[37m";
		Colors.bold = "\u001b[1m";
		Colors.italic = "\u001b[3m";
		Colors.end = "\u001b[0m";
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
		Colors.gray = "";
		Colors.bold = "";
		Colors.italic = "";
		Colors.end = "";
	}

}
