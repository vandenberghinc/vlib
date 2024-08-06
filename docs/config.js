const tint_gradient = "linear-gradient(140deg, #CB50A9 10%, #E95071 40%, #E97D76 60%, #FAC91B 90%)";

module.exports = {
	version: "1.1",
	name: "VLib",
	icon: {
		// dark: "https://raw.githubusercontent.com/vandenberghinc/vlib/master/dev/media/icon-v2/icon.light.0.25.webp",
		// light: "https://raw.githubusercontent.com/vandenberghinc/vlib/master/dev/media/icon-v2/icon.dark.0.25.webp",
		dark: "https://raw.githubusercontent.com/vandenberghinc/vlib/main/dev/media/icon-v3/stroke.light.0.25.webp",
		light: "https://raw.githubusercontent.com/vandenberghinc/vlib/main/dev/media/icon-v3/stroke.dark.0.25.webp",
		height: 17.5,
	},
	meta: {
		author: "VLib",
		title: "VLib - Documenation",
		description: "The VLib documentation page - Generic C++ and JS library.",
		image: "https://raw.githubusercontent.com/vandenberghinc/vlib/main/dev/media/icon-v3/stroke.dark.0.25.webp",
		favicon: "https://raw.githubusercontent.com/vandenberghinc/vlib/main/dev/media/icon-v3/favicon.ico",
	},
	dark_theme: {
		extends: "dark",
		tint_fg: tint_gradient,
		tint_base: "#CB50A9",
		anchor_fg: tint_gradient,
		note_bg: tint_gradient,
		note_fg: "$fg",
	},
	light_theme: {
		extends: "light",
		tint_fg: tint_gradient,
		tint_base: "#CB50A9",
		anchor_fg: tint_gradient,
		note_bg: tint_gradient,
		note_fg: "$fg",
		
		// tint_fg: "#58B684",
		// anchor_fg: "#53AC7D",
		// token_type: "#58B684",
		// method_get: "#58B684",
	},
	default_theme: "dark",
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
		// `${__dirname}/../include/vlib/types/base/array.h`,

		`${__dirname}/../include/`,
		`${__dirname}/../js/include/`,
	],
	output: [`${__dirname}/index.html`]
}