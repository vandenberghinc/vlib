// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

// Header.
#ifndef VLIB_ENV_H
#define VLIB_ENV_H

// Includes.
#include <stdlib.h>

// Namespace vlib.
namespace vlib {

// ---------------------------------------------------------
// Static environment type.

/* 	@docs {
	@chapter: system
	@title: Environment
	@description:
		Get and set environment variables.
    @usage:
        #include <vlib/types.h>
        String home = vlib::env::get("HOME");
} */
struct env {

// Public.
public:
    
    // ---------------------------------------------------------
    // Static attributes.
    
    static excid_t set_err;
    static excid_t del_err;

// Private.
private:
    
    // ---------------------------------------------------------
    // Private functions.
    
    // Get helper.
    static inline
    const char* get_h(const char* name) {
        #if OSID == 1 // macos
            return ::getenv(name);
        #else
            return ::secure_getenv(name);
        #endif
    }
    
    // Set helper.
	static inline
    void    set_h(const char* name, const char* value) {
        if (::setenv(name, value, 1) != 0) {
            throw EnvironmentError(set_err);
        }
    }
    
    // Delete helper.
	static inline
    void    del_h(const char* name) {
        if (::unsetenv(name) != 0) {
            throw EnvironmentError(del_err);
        }
    }
    
// Public.
public:
	
	// ---------------------------------------------------------
	// Public functions.
	
	// Get.
	/* @docs {
		@title: Get
		@description:
			Get an environment variable.
            
            Optionally parse the variable to a `Numeric` or `Bool` by specified the template type.
        @funcs: 4
	*/
    static inline
	String 	get(const String& name) {
        return get_h(name.c_str());
	}
	static inline
    String  get(const char* name) {
        return get_h(name);
    }
    template <typename Type> requires (is_any_Numeric<Type>::value || is_Bool<Type>::value) static inline
    Type    get(const String& name) {
        const char* value = get_h(name.c_str());
        return Type::parse(value, vlib::len(value));
    }
    template <typename Type> requires (is_any_Numeric<Type>::value || is_Bool<Type>::value) static inline
    Type    get(const char* name) {
        const char* value = get_h(name);
        return Type::parse(value, vlib::len(value));
    }
    
    // Get.
    /* @docs {
        @title: Get With Default
        @description:
            Get an environment variable with a default return when the variable is not set.
     
        Optionally parse the variable to a `Numeric` or `Bool` by specified the template type.
        @funcs: 4
     */
    static inline
    String     get(const String& name, const String& def) {
        const char* value = get_h(name.c_str());
        if (value == NULL) {
            return def;
        }
        return value;
    }
    static inline
    String  get(const char* name, const char* def) {
        const char* value = get_h(name);
        if (value == NULL) {
            return def;
        }
        return value;
    }
    template <typename Type> requires (is_any_Numeric<Type>::value || is_Bool<Type>::value) static inline
    Type    get(const String& name, const Type& def) {
        const char* value = get_h(name.c_str());
        if (value == NULL) {
            return def;
        }
        return Type::parse(value, vlib::len(value));
    }
    template <typename Type> requires (is_any_Numeric<Type>::value || is_Bool<Type>::value) static inline
    Type    get(const char* name, const Type& def) {
        const char* value = get_h(name);
        if (value == NULL) {
            return def;
        }
        return Type::parse(value, vlib::len(value));
    }
    
    // Set.
    /* @docs {
        @title: Set
        @description:
            Set an environment variable.
            
            Optionally parse the variable to a `Numeric` or `Bool` by specified the template type.
        @funcs: 4
    */
	static inline
    void    set(const String& name, const String& value) {
        return set_h(name.c_str(), value.c_str());
    }
	static inline
    void    set(const char* name, const char* value) {
        return set_h(name, value);
    }
    template <typename Type> requires (is_any_Numeric<Type>::value || is_Bool<Type>::value) static inline
    void    set(const String& name, const Type& value) {
        return set_h(name.c_str(), value.str().c_str());
    }
    template <typename Type> requires (is_any_Numeric<Type>::value || is_Bool<Type>::value) static inline
    void    set(const char* name, const Type& value) {
        return set_h(name, value.str().c_str());
    }
    
    // Get.
    /* @docs {
        @title: Delete
        @description:
            Delete an environment variable.
        @funcs: 2
    */
	static inline
    void    del(const String& name) {
        return del_h(name.c_str());
    }
	static inline
    void    del(const char* name) {
        return del_h(name);
    }
		
};

// Set static vars.
excid_t env::set_err = exceptions::add_err("Unable to set the environment variable.");
excid_t env::del_err = exceptions::add_err("Unable to delete the environment variable.");

// ---------------------------------------------------------
// End.

}; 		// End namespace vlib.
#endif 	// End header.
