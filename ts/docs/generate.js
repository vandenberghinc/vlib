
// Imports.
const {Client} = require(`${process.env.PERSISTANCE}/private/dev/libris/libris/apps/libris-js/dist/cjs/apps/libris-js/src/index.js`);

// Generate docs.
new Client({
	api_key: "04NsHTGdRbtbdAGdm:iulKUkCWtpNSVlFHi5ONEZueiabN16E8", // vandenberghinc@gmail.com
})
.generate_docs({ config: __dirname + "./config.js", })
.then(console.log).catch(console.error);