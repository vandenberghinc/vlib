/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2023 Daan van den Bergh.
 */

// String prototype functions.
String.prototype.first = function() {
    return this[0];
};
String.prototype.last = function() {
    return this[this.length - 1];
};

// Get the first non whitespace char, does not count \n as whitespace.
String.prototype.first_non_whitespace = function() {
    for (let i = 0; i < this.length; i++) {
        const char = this.charAt(i);
        if (char != " " && char != "\t") {
            return char;
        }
    }
    return null;
};

// Get the last non whitespace char, does not count \n as whitespace.
String.prototype.last_non_whitespace = function() {
    for (let i = this.length - 1; i >= 0; i--) {
        const char = this.charAt(i);
        if (char != " " && char != "\t") {
            return char;
        }
    }
    return null;
};

// Insert substr at index.
String.prototype.insert = function(index, substr) {
    let edited = this.substr(0, index);
    edited += substr;
    edited += this.substr(index);
    return edited;
};

// Remove substr at index.
String.prototype.remove_indices = function(start, end) {
    let edited = this.substr(0, start);
    edited += this.substr(end);
    return edited;
};

// Check if the first chars of the main string equals a substring, optionally with start index.
String.prototype.eq_first = function(substr, start_index = 0) {
    if (start_index + substr.length > this.length) {
        return false;
    }
    const end = start_index + substr.length;
    let y = 0;
    for (let x = start_index; x < end; x++) {
        if (this.charAt(x) != substr.charAt(y)) {
            return false;
        }
        ++y;
    }
    return true;
}

// Capitalize the first letter.
String.prototype.capitalize_first_letter = function() {
    if ("abcdefghijklmopqrstuvwxyz".includes(this.charAt(0))) {
        return this.charAt(0).toUpperCase() + this.substr(1);
    }
    return this;
}

// Reverse the string.
String.prototype.reverse = function() {
    let reversed = "";
    for (let i = this.length - 1; i >= 0; i--) {
    	reversed += this.charAt(i);
    }
    return reversed;
}