const i = 100%!;

if (res instanceof Me) {
	const MeClass
	if () {
		if () {

		}
	}
}

@constructor_wrapper
class MeClass {}

@constructor_wrapper(suffix = "Element")
class YouElement {}

const mylib = {};
@constructor_wrapper(suffix = "Element")
mylib.You = class YouElement {}


function decorator_1({
	x = "X",
	y = "Y",
	callback = () => {},
}) {
	return () => {
		console.log(x);
		callback();
		console.log(y);
	}
}
function decorator_2({
	x = "X",
	y = "Y",
	callback = () => {},
}) {
	return () => {
		console.log(x);
		callback();
		console.log(y);
	}
}
@decorator_1(x = "decorator_1: Log 1", y = "decorator_1: Log 5")
@decorator_2(x = "decorator_2: Log 2", y = "decorator_2: Log 4")
function somefunc() {
	console.log("somefunc: Log 3")
}
somefunc();

module.exports  =  Hello;