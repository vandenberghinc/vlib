// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.

// Header.
#ifndef VLIB_RANDOM_H
#define VLIB_RANDOM_H

// Namespace vlib.
namespace vlib {

// Random type.
/* 	@docs {
	@chapter: global
	@title: Random
	@description:
		Static random structure.
    @usage:
        #include <vlib/types.h>
        vlib::random:: ... ();
} */
struct random {

// Public:
public:

	// ---------------------------------------------------------
	// Attributes.
	
	SICE const char* alphabet = 			"abcdefghijklmnopqrstuvwxyz";
	SICE const char* alphabet_uppercase = 	"ABCDEFGHIJKLMNOPQRSTUVWXYZ";
	SICE const char* numbers = 				"0123456789";
    SICE const char* combined_chars =       "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    SICE const uint  combined_chars_len =   len(combined_chars);
    static bool      seeded;
	
	// ---------------------------------------------------------
	// Functions.

	// Set a random seed.
	/* 	@docs {
		@title: Random seed
		@description:
			Set a random seed.
		@usage:
			vlib::random::random_seed();
	} */
	inline static
	void	random_seed() {
		srand((uint) time(NULL));
        seeded = true;
	}

	// Set seed.
	/* 	@docs {
		@title: Seed
		@description:
			Set a seed.
		@usage:
			vlib::random::seed(1);
	} */
	inline static
	void	seed(const uint& x) {
		srand(x);
        seeded = true;
	}

	// Get a random digit between 0 and 9.
	/* 	@docs {
		@title: Generate
		@description:
			Get a random digit between 0 and 9.
		@usage:
			auto x = vlib::random::generate<short>();
	} */
	template <typename Type> requires (is_short<Type>::value)
	inline static
	short 	generate() noexcept {
        if (seeded == false) {
            random_seed();
        }
		return rand() % 10;
	}

	// Get a random integer integral type between min and max.
	/* 	@docs {
		@title: Generate
		@description:
			Get a random integer integral type between min and max.
		@usage:
			auto x = vlib::random::generate<uint>();
			auto x = vlib::random::generate<uint>(0, 10);
			auto x = vlib::random::generate<ullong>();
			auto x = vlib::random::generate<ullong>(0.0, 9999999999999999999.0);
	} */
	template <typename Type> requires (!is_short<Type>::value && is_any_integer<Type>::value)
	inline static
	Type 	generate(const Type& min = 0, const Type& max = limits<Type>::max) noexcept {
        if (seeded == false) {
            random_seed();
        }
		return rand() % (max - min) + min;
	}

	// Get a random floating integral type.
	/* @docs {
	  @title: Generate
	  @description:
			Get a random floating integral type.
	  @usage:
			vlib::random::generate<float>() ==> 0.283957;
			vlib::random::generate<float>(0.1) ==> 0.082981;
			vlib::random::generate<float>(0.001) ==> 0.000284;
	} */
	template <typename Type> requires (is_floating<Type>::value)
	inline static
	Type 	generate(const Type& base = 1.0) noexcept {
        if (seeded == false) {
            random_seed();
        }
		return ((Type) rand() / (Type) (RAND_MAX)) * base;
	}
    
    // Get a random character.
    /* @docs {
      @title: Generate
      @description:
            Get a random character.
      @usage:
            vlib::random::generate<char>() ==> 'a';
    } */
    template <typename Type> requires (is_char<Type>::value)
    inline static
    Type     generate() noexcept {
        return combined_chars[generate<uint>(0, combined_chars_len + 1)];
    }

	//
};

bool random::seeded = false;

}; 		// End namespace vlib.
#endif 	// End header.
