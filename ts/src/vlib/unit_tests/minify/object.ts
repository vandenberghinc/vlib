"use strict";

// Imports.
import { Module } from "../../../vtest/index.js";
import { Object as minify } from '../../minify/object.js';

// Unit test module name.
const tests = new Module({ name: "vlib/minify/object" });

// -------------------------------------------------------------------
// Unit tests for minify()

tests.add({
    id: "minify:1", expect: "success", callback: () => minify.minify({
        object: {
            hello: 'world',
            foo: { bar: 'baz', foo: { a: 'b', c: 'd', e: { f: 'g' } }, a: ['a', 'b', 'c'] },
            not_present: 'unchanged',
        },
        flat_scheme: {
            'hello': 'h',
            'foo': 'f',
            'foo.bar': 'b',
            'foo.foo': 'f',
            'foo.foo.a': 'a',
            'foo.foo.c': 'c',
            'foo.foo.e': 'e',
            'foo.foo.e.f': 'f',
            'foo.a': 'a',
        }
    })
});

tests.add({
    id: "minify:2", expect: "success", callback: () => minify.minify({
        object: {
            hello: 'world',
            foo: { bar: 'baz', foo: { a: 'b', c: 'd', e: { f: 'g' } }, a: ['a', 'b', 'c'] },
            not_present: 'unchanged',
        },
        scheme: {
            hello: { key: 'h' },
            foo: {
                key: 'f',
                scheme: {
                    bar: { key: 'b' },
                    foo: {
                        key: 'f',
                        scheme: {
                            a: { key: 'a' },
                            c: { key: 'c' },
                            e: { key: 'e', scheme: { f: { key: 'f' } } }
                        }
                    },
                    a: { key: 'a' }
                }
            },
        }
    })
});


// -------------------------------------------------------------------
// Unit tests for expand()

const original_obj = {
    hello: 'world',
    foo: {
        bar: 'baz',
        foo: {
            a: 'b',
            c: 'd',
            foo: {
                foo: {
                    a: 'a',
                    b: 'b',
                    c: 'c',
                },
                some_attr: "x",
            }
        },
        a: ['a', 'b', 'c']
    },
    not_present: 'unchanged',
};

const flat_scheme = {
    'hello': 'h',
    'foo': 'f',
    'foo.bar': 'b',
    'foo.foo': 'f',
    'foo.foo.a': 'a',
    'foo.foo.foo': 'f',
    'foo.foo.foo.foo': 'f',
    'foo.foo.foo.foo.a': 'a',
    'foo.foo.foo.foo.b': 'b',
    'foo.foo.foo.foo.c': 'c',
    'foo.foo.foo.foo.some_attr': 'x',
    'foo.foo.e': 'e',
    'foo.foo.e.f': 'f',
    'foo.a': 'a',
};
tests.add({
    id: "expand:1", expect: "success", callback: () => {
        const minified = minify.minify({ object: original_obj, flat_scheme });
        const expanded = minify.expand({ object: minified, flat_scheme });
        return { expanded };
    }
});

const nested_scheme = {
    hello: { key: 'h' },
    foo: {
        key: 'f',
        scheme: {
            bar: { key: 'b' },
            foo: {
                key: 'f',
                scheme: {
                    a: { key: 'a' },
                    c: { key: 'c' },
                    e: {
                        key: 'e',
                        scheme: {
                            f: { key: 'f' }
                        }
                    }
                }
            },
            a: { key: 'a' }
        }
    }
};
tests.add({
    id: "expand:2", expect: "success", callback: () => {
        const minified = minify.minify({ object: original_obj, scheme: nested_scheme });
        const expanded = minify.expand({ object: minified, scheme: nested_scheme });
        return { expanded };
    }
});

export {}