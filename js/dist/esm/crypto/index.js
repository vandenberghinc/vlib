/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import * as _hash from "./hash.js";
export var Crypto;
(function (Crypto) {
    Crypto.hash = _hash.hash; // _hash.hash is a function
})(Crypto || (Crypto = {}));
export { Crypto as crypto }; // snake_case compatibility
//# sourceMappingURL=index.js.map