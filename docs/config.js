
// Imports.
const {Meta, LIGHT_THEME, GREEN_THEME, BLUE_THEME} = require(`@librisio/libris`);

// Edit light theme.
LIGHT_THEME.tint_fg = "#58B684";
LIGHT_THEME.anchor_fg = "#53AC7D";
LIGHT_THEME.token_type = "#58B684";
LIGHT_THEME.method_get = "#58B684";
LIGHT_THEME.note_bg = "#58B684";

// Initialize config.
module.exports = {
	version: "1.1",
	name: "VLib",
	icon: {
		dark: "https://raw.githubusercontent.com/vandenberghinc/vlib/master/dev/media/icon/icon.light.0.25.webp",
		light: "https://raw.githubusercontent.com/vandenberghinc/vlib/master/dev/media/icon/icon.dark.0.25.webp",
		height: 17.5,
	},
	meta: new Meta({
		author: "VLib",
		title: "VLib - Documenation",
		description: "The VLib documentation page - Generic C++ and JS library.",
		image: "https://raw.githubusercontent.com/vandenberghinc/public-storage/master/vandenberghinc/icon/triangle.small.png",
		favicon: "https://doxia.io/favicon.ico",
	}),
	dark_theme: BLUE_THEME,//GREEN_THEME,
	light_theme: LIGHT_THEME,
	default_theme: "dark_theme",
	navigation_order: ["C++", "JS"],
	chapter_order: [
		"Global",	
		"Exceptions",
		"Errors",
		"Casts",
		"Types",
		"System",
		"CLI",
		"Sockets",
		"Compression",
		"Encoding",
		"Crypto",
		"HTTP",
		"HTTPS",
		"TLS",
		"SMTP",
		"JavaScript",
	],
	include: [
		`${__dirname}/../include/`,
		`${__dirname}/../js/include/`,
	],
	output: [`${__dirname}/index.html`]
}