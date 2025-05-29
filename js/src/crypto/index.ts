/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import * as _hash from "./hash.js";
export namespace Crypto {
    export const hash = _hash.hash; // _hash.hash is a function
}
export { Crypto as crypto }; // snake_case compatibility