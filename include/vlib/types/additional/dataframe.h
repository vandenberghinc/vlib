// Author: Daan van den Bergh
// Copyright: © 2022 Daan van den Bergh.
//
// NOTES:
// - DataFrame is still a very basic dataframe type, not yet ready for real-world usage.
//

// Header.
#ifndef VLIB_DF_T_H
#define VLIB_DF_T_H

// Namespace vlib.
namespace vlib {

// ---------------------------------------------------------
// Internal.

// Namespace df.
namespace df {

// Types.
enum types {
	null = 		0,
	boolean = 	1,
    short_type =     2,
	integer = 	3,
	floating = 	4,
	str = 		5,
	df = 		6,
};

// String representation of type.
constexpr
String	strtype(short type) {
	switch (type) {
		case types::null:
			return "null";
		case types::boolean:
			return "boolean";
		case types::integer:
			return "integer";
        case types::short_type:
            return "short";
		case types::floating:
			return "floating";
		case types::str:
			return "string";
		case types::df:
			return "df";
		default:
			return "unknown";
	}
}

// Npos.
ullong npos = NPos::npos;
ullong zero_len = 0;

// End namespace df.
};

// ---------------------------------------------------------
// Values type.
/* @docs
    @chapter: Types
    @title: Dataframe
    @description:
        Type for 1D and 2D dataframes.
    @notes:
        A dataframe can be the following types:
        - `vlib::df::types::null`
        - `vlib::df::types::integer`
        - `vlib::df::types::floating`
        - `vlib::df::types::str`
        - `vlib::df::types::df`
    @usage:
        #include <vlib/types.h>
        vlib::DataFrame df({
            {0, 2345.4, "A"},
            {1, 4363.3, "B"},
            {2, 7895.1, "C"},
        });
*/
// @TODO add docs for subscript.
// @TODO add funcs like, round, fill, generate, and more, perhaps look at Numeric.
struct DataFrame {
	
	// ---------------------------------------------------------
	// Definitions.
	
	using 	This = 		DataFrame;
    // using     Bool =         Bool;
    using   Short =         LLong;
	using 	Int = 		LLong;
	using 	Float = 	LDouble;
    // using     String =     String;
	using	Values =	Array<DataFrame>;
	using	Columns = 	Array<String>;
	using 	Shape = 	Array<ullong>;
	
    // Is string template for g++ compiler.
    template <typename LType> requires (!std::is_same<const LType, const DataFrame>::value) SICE
    bool is_DataFrame_h() { return false; }
    template <typename LType> requires (std::is_same<const LType, const DataFrame>::value) SICE
    bool is_DataFrame_h() { return true; }
    
	// ---------------------------------------------------------
	// Attributes.
	
	short 				m_type;		// type.
	UPtr<Bool>		    m_bool;		// boolean value.
    UPtr<Short>         m_short;    // short value.
	UPtr<Int>			m_int;		// integer value.
	UPtr<Float>		    m_float;	// floating value.
	UPtr<String>		m_str;		// string value.
	UPtr<Values>		m_vals;		// the array with values.
	short 				m_dim;		// the dimension.
	UPtr<Columns>		m_cols;		// the columns, only for a 2D df.
	
// Private.
private:
	
	// ---------------------------------------------------------
	// Private functions.
	
	// Initialize a new df array.
	constexpr
	void 	init_new_df_array(This& obj, short dim, ullong capacity = 0) {
		obj.m_type = df::types::df;
		obj.m_vals.init();
		obj.m_dim = dim;
		if (capacity != 0) {
			obj.m_vals->resize(capacity);
		}
		obj.gen_columns();
	}
	
	// Assign.
	// - Does not reset variables.
	template <typename Type> requires (is_bool<Type>::value || is_Bool<Type>::value) constexpr
	void 	assign(const Type& x) {
		m_bool = x;
		m_dim = 0;
	}
    template <typename Type> requires (is_short<Type>::value) constexpr
    void     assign(const Type& x) {
        m_short = x;
        m_dim = 0;
    }
    template <typename Type> requires (!is_short<Type>::value && (is_any_integer<Type>::value || is_any_integer_Numeric<Type>::value)) constexpr
    void     assign(const Type& x) {
        m_int = x;
        m_dim = 0;
    }
    template <typename Type> requires (is_floating<Type>::value || is_floating_Numeric<Type>::value) constexpr
    void     assign(const Type& x) {
        m_float = x;
        m_dim = 0;
    }
	constexpr
	void 	assign(const String& x) {
		m_str = x;
		m_dim = 0;
	}
	constexpr
	void 	assign(String&& x) {
		m_str = x;
		m_dim = 0;
	}
	constexpr
	void 	assign(const Values& x) {
		if (m_vals.is_undefined()) { m_vals.init(); }
		else { m_vals->reset(); }
		m_dim = 0;
		get_dim(m_dim, x);
		switch (m_dim) {
			case 1: {
				m_vals->resize(x.len());
				for (auto& i0: x) {
					m_vals->append_no_resize(i0);
				}
				if (m_vals->len() != 0 && (!m_cols || m_cols->len() != 1)) {
					gen_columns();
				}
			}
			case 2: {
				if (x.len() != 0) { break; }
				ullong columns = x.get(0).len();
				m_vals->resize(columns);
				m_vals->len() = columns;
				for (auto& i: Range(columns)) {
					init_new_df_array(m_vals->get(i), 1, x.len());
				}
				for (auto& i: x) {
					for (auto& column: Range(columns)) {
						m_vals->get(column).m_vals->append_no_resize(i.get(column));
					}
				}
				if (!m_cols || m_cols->len() != columns) {
					gen_columns();
				}
			}
			default:
				throw DimensionError(to_str("Unsupported dimension of \"", m_dim, "\"."));
		}
	}
	constexpr
	void 	assign(const std::initializer_list<DataFrame>& x) {
		if (m_vals.is_undefined()) { m_vals.init(); }
		else { m_vals->reset(); }
		m_dim = 0;
		get_dim(m_dim, x);
		switch (m_dim) {
			case 1: {
				m_vals->resize(x.size());
				for (auto& i0: x) {
					m_vals->append_no_resize(i0);
				}
				if (!m_cols || m_cols->len() != 1) {
					gen_columns();
				}
				break;
			}
			case 2: {
				if (x.size() == 0) { break; }
				ullong columns = x.begin()->len();
				m_vals->resize(columns);
				m_vals->len() = columns;
				for (auto& i: Range(columns)) {
					init_new_df_array(m_vals->get(i), 1, x.size());
				}
				for (auto& i: x) {
					for (auto& column: Range(columns)) {
						m_vals->get(column).m_vals->append_no_resize(i.get(column));
					}
				}
				if (!m_cols || m_cols->len() != columns) {
					gen_columns();
				}
				break;
			}
			default:
				throw DimensionError(to_str("Unsupported dimension of \"", m_dim, "\"."));
		}
		
	}
	
	// Get the dimension.
	template <typename Object> constexpr
	short 	get_dim(const Object& obj) {
		short dim = 0;
		get_dim(dim, obj);
		return dim;
	}
    constexpr
	void 	get_dim(short& dim, const Values& vals) {
		++dim;
		if (vals.len() > 0) {
			get_dim(dim, vals.get(0));
		}
	}
    constexpr
	void 	get_dim(short& dim, const std::initializer_list<DataFrame>& vals) {
		++dim;
		if (vals.size() > 0) {
			get_dim(dim, *vals.begin());
		}
	}
    constexpr
	void 	get_dim(short& dim, const This& obj) {
		switch (obj.m_type) {
			case df::types::df: {
				++dim;
				if (m_vals->len() > 0) {
					get_dim(dim, m_vals->get(0));
				}
			}
			default: break;
		}
	}
	
	// Set the dimension.
    constexpr
	void 	set_dim() {
		m_dim = 0;
		get_dim(m_dim, *this);
	}
	
	// Generate columns when there are no columns specified.
    constexpr
	void 	gen_columns() {
		if (!m_cols) { m_cols.init(); }
		else { m_cols->reset(); }
		switch (m_dim) {
		case 1: {
			m_cols->append("column 1");
			break;
		}
		case 2: {
			for (auto& index: m_vals->indexes()) {
				m_cols->append(to_str("column ", index));
			}
			break;
		}
		default:
			throw DimensionError(to_str("Unsupported dimension of \"", m_dim, "\"."));
		}
	}
    constexpr
	Columns	gen_columns() const {
		Columns cols;
		switch (m_dim) {
		case 1: {
			cols.append("column 1");
			return cols;
		}
		case 2: {
			for (auto& index: m_vals->indexes()) {
				cols.append(to_str("column ", index));
			}
			return cols;
		}
		default:
			throw DimensionError(to_str("Unsupported dimension of \"", m_dim, "\"."));
		}
	}
	
	// Check the columns dim.
    constexpr
	void 	check_columns(const Columns& cols) {
		switch (m_dim) {
		case 1:
			if (cols.len() != 1) {
				throw ShapeError(
					to_str("Expecting ", m_vals->len(), " columns, not ", cols.len(), ".")
				);
			}
			break;
		case 2:
			if (m_vals->len() != 0 && cols.len() != m_vals->len()) {
				throw ShapeError(
					to_str("Expecting ", m_vals->len(), " columns, not ", cols.len(), ".")
				);
			}
			break;
		default:
			throw DimensionError(to_str("Unsupported dimension of \"", m_dim, "\"."));
		}
	}
	
	// Shape helper.
	constexpr
	Shape	shape(const This& obj) const {
		expect_df(__FUNCTION__);
		Shape shp;
		if (obj.m_vals->len() > 0) {
			shp.append(obj.m_vals->len());
			shape_h(shp, get(0));
		} else {
			shp.append(0);
		}
		return shp;
	}
	constexpr
	void	shape_h(Array<ullong>& shp, const This& val) const {
		switch (val.m_type) {
			case df::types::df: {
				if (val.m_vals->len() > 0) {
					shp.append(val.m_vals->len());
					shape_h(shp, val.get(0));
				} else {
					shp.append(0);
				}
			}
			default: break;
		}
	}
	
	// Expect a df type.
	constexpr
	void	expect_df(const char* func) const {
		switch (m_type) {
		case df::types::df:
			return ;
		default:
			throw TypeError(to_str(
				"Function \"",
				func,
				"()\" is not supported for type \"",
				df::strtype(m_type), "\"."));
		}
	}
	constexpr
	void	expect_1d(const char* func) const {
		switch (m_type) {
		case df::types::df:
			switch (m_dim) {
			case 1: {
				return ;
			}
			default:
				throw DimensionError(to_str(
					"Function \"",
					func,
					"\" is not supported for a dataframe with a dimension of \"",
					m_dim,
					"\"."));
			}
		default:
			throw TypeError(to_str(
				"Function \"",
				func,
				"()\" is not supported for type \"",
				df::strtype(m_type), "\"."));
		}
	}
	constexpr
	void	expect_2d(const char* func) const {
		switch (m_type) {
		case df::types::df:
			switch (m_dim) {
			case 2: {
				return ;
			}
			default:
				throw DimensionError(to_str(
					"Function \"",
					func,
					"\" is not supported for a dataframe with a dimension of \"",
					m_dim,
					"\"."));
			}
		default:
			throw TypeError(to_str(
				"Function \"",
				func,
				"()\" is not supported for type \"",
				df::strtype(m_type), "\"."));
		}
	}
    
    // Expect a numeric type.
    constexpr
    void    expect_numeric(const char* func) const {
        switch (m_type) {
            case df::types::short_type:
            case df::types::integer:
            case df::types::floating:
                return ;
            default:
                throw TypeError(to_str(
                    "Function \"",
                    func,
                    "()\" is not supported for type \"",
                    df::strtype(m_type), "\"."));
        }
    }
    
	/*
    // Apply math operation for df type.
    // Not supported with NVCC.
	template <typename Func> constexpr
	void	math_iter_h(Func&& func, const This& obj) {
		switch (m_dim) {
		case 1: break;
		default:
			throw DimensionError(to_str(
				"Function \"",
				__FUNCTION__,
				"()\" is not supported for a dataframe with dimension ",
				m_dim,
				"."));
		}
		switch (obj.m_type) {
		case df::types::df: {
			switch (obj.m_dim) {
			case 1: break;
			default:
				throw DimensionError(to_str(
					"Function \"",
					__FUNCTION__,
					"()\" is not supported for a dataframe with dimension ",
					obj.m_dim,
					"."));
			}
			for (auto& index: m_vals->indexes()) {
				func(m_vals->get(index), obj.m_vals->get(index));
			}
			break;
		}
		default:
			for (auto& i: *m_vals) {
				func(i, obj);
			}
			break;
		}
	}
	template <typename Func, typename Type> requires (is_any_Numeric<Type>::value || is_any_numeric<Type>::value) constexpr
	void	math_iter_h(Func&& func, const Type& x) {
		switch (m_dim) {
		case 1: break;
		default:
			throw DimensionError(to_str(
				"Function \"",
				__FUNCTION__,
				"()\" is not supported for a dataframe with dimension ",
				m_dim,
				"."));
		}
		for (auto& i: *m_vals) {
			func(i, x);
		}
	}
     */
    
    // Apply a math op on a df with a df type.
    #define DF_MATH_OP(func, obj) \
        switch (m_type) { \
            case df::types::null: \
            case df::types::short_type: \
            case df::types::integer: \
            case df::types::floating: \
                func(*this, obj); \
                return *this; \
            case df::types::df: \
                DF_MATH_ITER(func, obj); \
                return *this; \
            default: break; \
        } \
        throw TypeError(to_str( \
            "Function \"", \
            __FUNCTION__, \
            "()\" is not supported for type \"", \
            df::strtype(m_type), "\"."));

    // Apply a math op on a df with a non df type.
    #define DF_MATH_OP_WITH_NON_DF(func, obj) \
        switch (m_type) { \
            case df::types::null: \
            case df::types::short_type: \
            case df::types::integer: \
            case df::types::floating: \
                func(*this, obj); \
                return *this; \
            case df::types::df: \
                DF_MATH_ITER_WITH_NON_DF(func, obj); \
                return *this; \
            default: break; \
        } \
        throw TypeError(to_str( \
            "Function \"", \
            __FUNCTION__, \
            "()\" is not supported for type \"", \
            df::strtype(m_type), "\"."));
    
    // Apply math iterateion operation for df type with a df type.
    #define DF_MATH_ITER(func, x) \
        switch (m_dim) { \
            case 1: break; \
            default: \
                throw DimensionError(to_str( \
                "Function \"", \
                __FUNCTION__, \
                "()\" is not supported for a dataframe with dimension ", \
                m_dim, \
                ".")); \
        } \
        switch (x.m_type) { \
            case df::types::df: { \
                switch (x.m_dim) { \
                    case 1: break; \
                    default: \
                        throw DimensionError(to_str( \
                            "Function \"", \
                            __FUNCTION__, \
                            "()\" is not supported for a dataframe with dimension ", \
                            x.m_dim, \
                            ".")); \
                } \
                for (auto& index: m_vals->indexes()) { \
                    func(m_vals->get(index), x.m_vals->get(index)); \
                } \
                break; \
            } \
            default: \
                for (auto& i: *m_vals) { \
                    func(i, x); \
                } \
                break; \
        }
    
    // Apply math iterateion operation for df type with a non df type.
    #define DF_MATH_ITER_WITH_NON_DF(func, x) \
        switch (m_dim) { \
            case 1: break; \
            default: \
                throw DimensionError(to_str( \
                    "Function \"", \
                    __FUNCTION__, \
                    "()\" is not supported for a dataframe with dimension ", \
                    m_dim, \
                    ".")); \
                } \
        for (auto& i: *m_vals) { \
            func(i, x); \
        }

// Public.
public:
	
	// ---------------------------------------------------------
	// Constructors.
	
	// Default constructor.
	constexpr
	DataFrame() :
	m_type(df::types::null),
	m_dim(0) {}
	constexpr
	DataFrame(const Null&) :
	m_type(df::types::null),
	m_dim(0) {}
	
	// Copy constructor.
	constexpr
	DataFrame(const This& obj) :
	m_type(obj.m_type),
	m_bool(obj.m_bool),
    m_short(obj.m_short),
	m_int(obj.m_int),
	m_float(obj.m_float),
	m_str(obj.m_str),
	m_vals(obj.m_vals),
	m_dim(obj.m_dim),
	m_cols(obj.m_cols)
	{}
	
	// Move constructor.
	constexpr
	DataFrame(This&& obj) :
	m_type(obj.m_type),
	m_bool(move(obj.m_bool)),
    m_short(move(obj.m_short)),
	m_int(move(obj.m_int)),
	m_float(move(obj.m_float)),
	m_str(move(obj.m_str)),
	m_vals(move(obj.m_vals)),
	m_dim(obj.m_dim),
	m_cols(move(obj.m_cols))
	{
		obj.m_type = 0;
	}
	
	// Constructor from Bool.
	template <typename Type> requires (is_bool<Type>::value || is_Bool<Type>::value) constexpr
	DataFrame (const Type& x) :
	m_type(df::types::boolean),
	m_bool(x),
	m_dim(0)
	{}
	
    // Constructor from Short.
    template <typename Type> requires (is_short<Type>::value) constexpr
    DataFrame (const Type& x) :
    m_type(df::types::short_type),
    m_short(x),
    m_dim(0)
    {}
    
	// Constructor from Int.
	template <typename Type> requires (!is_short<Type>::value && (is_any_integer<Type>::value || is_any_integer_Numeric<Type>::value)) constexpr
	DataFrame (const Type& x) :
	m_type(df::types::integer),
	m_int(x),
	m_dim(0)
	{}
	
	// Constructor from Float.
	template <typename Type> requires (is_floating<Type>::value || is_floating_Numeric<Type>::value) constexpr
	DataFrame (const Type& x) :
	m_type(df::types::floating),
	m_float(x),
	m_dim(0)
	{}
	
	// Constructor from String.
	constexpr
	DataFrame (const String& x) :
	m_type(df::types::str),
	m_str(x),
	m_dim(0)
	{}
	constexpr
	DataFrame (String&& x) :
	m_type(df::types::str),
	m_str(x),
	m_dim(0)
	{}
	constexpr
	DataFrame (const char* x) :
	m_type(df::types::str),
	m_str(x),
	m_dim(0)
	{}
	
	// Constructor from Values.
	constexpr
	DataFrame (const Values& x) :
	m_type(df::types::df)
	{ assign(x); }
    /*  @docs
        @title: Constructor
        @description:
            Construct a `DataFrame` object.
        @parameter:
            @name: x
            @description: The initializer list with values.
        }
        @usage:
            vlib::DataFrame df({
                {0, 2345.4, "A"},
                {1, 4363.3, "B"},
                {2, 7895.1, "C"},
            });
    */
	constexpr
	DataFrame (const std::initializer_list<DataFrame>& x) :
	m_type(df::types::df)
	{ assign(x); }

// Public.
public:
	
	// ---------------------------------------------------------
	// Constructor functions.
	
	// Copy.
    /*  @docs
        @title: Copy
        @description:
            Copy from another `DataFrame` object.
        @parameter:
            @name: obj
            @description: The `DataFrame` to copy from.
        }
        @usage:
            DataFrame df1 (...);
            DataFrame df2 (...);
            df2.copy(df1);
    */
	constexpr
	auto&	copy(const This& obj) {
		reset();
		m_type = obj.m_type;
		switch (m_type) {
            case df::types::null:
                return *this;
            case df::types::boolean: {
                m_bool = obj.m_bool;
                return *this;
            }
            case df::types::short_type: {
                m_short = obj.m_short;
                return *this;
            }
            case df::types::integer: {
                m_int = obj.m_int;
                return *this;
            }
            case df::types::floating: {
                m_float = obj.m_float;
                return *this;
            }
            case df::types::str: {
                m_str = obj.m_str;
                return *this;
            }
            case df::types::df: {
                m_vals = obj.m_vals;
                m_dim = obj.m_dim;
                m_cols = obj.m_cols;
                return *this;
            }
            default:
                throw TypeError(to_str("Unknown type \"", df::strtype(m_type), "\"."));
		}
	}
	
	// Swap.
    /*  @docs
        @title: Swap
        @description:
            Swap from another `DataFrame` object.
        @parameter:
            @name: obj
            @description: The `DataFrame` to swap from.
        }
        @usage:
            DataFrame df1 (...);
            DataFrame df2 (...);
            df2.swap(df1);
    */
	constexpr
	auto&	swap(This& obj) {
		m_type = obj.m_type;
		obj.m_type = 0;
		switch (m_type) {
            case df::types::null:
                return *this;
            case df::types::boolean: {
                m_bool.swap(obj.m_bool);
                return *this;
            }
            case df::types::short_type: {
                m_short.swap(obj.m_short);
                return *this;
            }
            case df::types::integer: {
                m_int.swap(obj.m_int);
                return *this;
            }
            case df::types::floating: {
                m_float.swap(obj.m_float);
                return *this;
            }
            case df::types::str: {
                m_str.swap(obj.m_str);
                return *this;
            }
            case df::types::df: {
                m_vals.swap(obj.m_vals);
                m_cols.swap(obj.m_cols);
                m_dim = obj.m_dim;
                return *this;
            }
            default:
                throw TypeError(to_str("Unknown type \"", df::strtype(m_type), "\"."));
		}
	}
	
	// ---------------------------------------------------------
	// Assignment operators.
	
	// Assignment operator from null.
	constexpr
	This&	operator =(const Null&) {
		return reset();
	}
	
	// Assignment operator from bool.
	template <typename Type> requires (is_bool<Type>::value || is_Bool<Type>::value) constexpr
	This&	operator =(const Type& x) {
		switch (m_type) {
            case df::types::null: {
                break;
            }
            case df::types::boolean: {
                assign(x);
                return *this;
            }
            case df::types::short_type: {
                m_short.reset();
                break;
            }
            case df::types::integer: {
                m_int.reset();
                break;
            }
                    
            case df::types::floating: {
                m_float.reset();
                break;
            }
            case df::types::str: {
                m_str.reset();
                break;
            }
            case df::types::df: {
                m_vals.reset();
                break;
            }
            default:
                throw TypeError(to_str("Unknown type \"", df::strtype(m_type), "\"."));
		}
		m_type = df::types::boolean;
		assign(x);
		return *this;
	}
	
    // Assignment operator from short.
    template <typename Type> requires (is_short<Type>::value) constexpr
    This&    operator =(const Type& x) {
        switch (m_type) {
            case df::types::null: {
                break;
            }
            case df::types::boolean: {
                m_bool.reset();
                break;
            }
            case df::types::short_type: {
                assign(x);
                return *this;
            }
            case df::types::integer: {
                m_int.reset();
                break;
            }
            case df::types::floating: {
                m_float.reset();
                break;
            }
            case df::types::str: {
                m_str.reset();
                break;
            }
            case df::types::df: {
                m_vals.reset();
                break;
            }
            default:
                throw TypeError(to_str("Unknown type \"", df::strtype(m_type), "\"."));
        }
        m_type = df::types::integer;
        assign(x);
        return *this;
    }
    
	// Assignment operator from int.
	template <typename Type> requires (!is_short<Type>::value && (is_any_integer<Type>::value || is_any_integer_Numeric<Type>::value)) constexpr
	This&	operator =(const Type& x) {
		switch (m_type) {
            case df::types::null: {
                break;
            }
            case df::types::boolean: {
                m_bool.reset();
                break;
            }
            case df::types::short_type: {
                m_short.reset();
                break;
            }
            case df::types::integer: {
                assign(x);
                return *this;
            }
            case df::types::floating: {
                m_float.reset();
                break;
            }
            case df::types::str: {
                m_str.reset();
                break;
            }
            case df::types::df: {
                m_vals.reset();
                break;
            }
            default:
                throw TypeError(to_str("Unknown type \"", df::strtype(m_type), "\"."));
		}
		m_type = df::types::integer;
		assign(x);
		return *this;
	}
	
	// Assignment operator from float.
	template <typename Type> requires (is_floating<Type>::value || is_floating_Numeric<Type>::value) constexpr
	This&	operator =(const Type& x) {
		switch (m_type) {
            case df::types::null: {
                break;
            }
            case df::types::boolean: {
                m_bool.reset();
                break;
            }
            case df::types::short_type: {
                m_short.reset();
                break;
            }
            case df::types::integer: {
                m_int.reset();
                break;
            }
            case df::types::floating: {
                assign(x);
                return *this;
            }
            case df::types::str: {
                m_str.reset();
                break;
            }
            case df::types::df: {
                m_vals.reset();
                break;
            }
            default:
                throw TypeError(to_str("Unknown type \"", df::strtype(m_type), "\"."));
		}
		m_type = df::types::floating;
		assign(x);
		return *this;
	}
	
	// Assignment operator from string.
	constexpr
	This&	operator =(const String& x) {
		switch (m_type) {
            case df::types::null: {
                break;
            }
            case df::types::boolean: {
                m_bool.reset();
                break;
            }
            case df::types::integer: {
                m_int.reset();
                break;
            }
            case df::types::short_type: {
                m_short.reset();
                break;
            }
            case df::types::floating: {
                m_float.reset();
                break;
            }
            case df::types::str: {
                assign(x);
                return *this;
            }
            case df::types::df: {
                m_vals.reset();
                break;
            }
            default:
                throw TypeError(to_str("Unknown type \"", df::strtype(m_type), "\"."));
		}
		m_type = df::types::str;
		assign(x);
		return *this;
	}
	constexpr
	This&	operator =(String&& x) {
		switch (m_type) {
            case df::types::null: {
                break;
            }
            case df::types::boolean: {
                m_bool.reset();
                break;
            }
            case df::types::short_type: {
                m_short.reset();
                break;
            }
            case df::types::integer: {
                m_int.reset();
                break;
            }
            case df::types::floating: {
                m_float.reset();
                break;
            }
            case df::types::str: {
                assign(x);
                return *this;
            }
            case df::types::df: {
                m_vals.reset();
                break;
            }
            default:
                throw TypeError(to_str("Unknown type \"", df::strtype(m_type), "\"."));
		}
		m_type = df::types::str;
		assign(x);
		return *this;
	}
	constexpr
	This&	operator =(const char* x) {
		switch (m_type) {
            case df::types::null: {
                break;
            }
            case df::types::boolean: {
                m_bool.reset();
                break;
            }
            case df::types::short_type: {
                m_short.reset();
                break;
            }
            case df::types::integer: {
                m_int.reset();
                break;
            }
            case df::types::floating: {
                m_float.reset();
                break;
            }
            case df::types::str: {
                assign(x);
                return *this;
            }
            case df::types::df: {
                m_vals.reset();
                break;
            }
            default:
                throw TypeError(to_str("Unknown type \"", df::strtype(m_type), "\"."));
		}
		m_type = df::types::str;
		assign(x);
		return *this;
	}
	
	// Assignment operator from dataframe.
	constexpr
	This&	operator =(const Values& x) {
		switch (m_type) {
            case df::types::null: {
                break;
            }
            case df::types::boolean: {
                m_bool.reset();
                break;
            }
            case df::types::short_type: {
                m_short.reset();
                break;
            }
            case df::types::integer: {
                m_int.reset();
                break;
            }
            case df::types::floating: {
                m_float.reset();
                break;
            }
            case df::types::str: {
                m_str.reset();
                break;
            }
            case df::types::df: {
                assign(x);
                return *this;
            }
            default:
                throw TypeError(to_str("Unknown type \"", df::strtype(m_type), "\"."));
		}
		m_type = df::types::df;
		assign(x);
		return *this;
	}
	constexpr
	This&	operator =(const std::initializer_list<DataFrame>& x) {
		switch (m_type) {
            case df::types::null: {
                break;
            }
            case df::types::boolean: {
                m_bool.reset();
                break;
            }
            case df::types::short_type: {
                m_short.reset();
                break;
            }
            case df::types::integer: {
                m_int.reset();
                break;
            }
            case df::types::floating: {
                m_float.reset();
                break;
            }
            case df::types::str: {
                m_str.reset();
                break;
            }
            case df::types::df: {
                assign(x);
                return *this;
            }
            default:
                throw TypeError(to_str("Unknown type \"", df::strtype(m_type), "\"."));
		}
		m_type = df::types::df;
		assign(x);
		return *this;
	}
	
	// Copy assignment operator.
	constexpr
	This&	operator = (const This& obj) {
		return copy(obj);
	}
	
	// Move assignment operator.
	constexpr
	This&	operator = (This&& obj) {
		return swap(obj);
	}
	
	// ---------------------------------------------------------
	// Type functions.
	
	// Null.
	constexpr
	bool	isn() const { return m_type == df::types::null; }
	constexpr
	bool	is_undefined() const { return m_type == df::types::null; }
	
	// Bool.
	constexpr
	bool	isb() const { return m_type == df::types::boolean; }
	constexpr
	auto&	asb() { return *m_bool; }
	constexpr
	auto&	asb() const { return *m_bool; }
	
    // Short.
    constexpr
    bool    issrt() const { return m_type == df::types::short_type; }
    constexpr
    auto&    assrt() { return *m_short; }
    constexpr
    auto&    assrt() const { return *m_short; }
    
	// Int.
	constexpr
	bool	isi() const { return m_type == df::types::integer; }
	constexpr
	auto&	asi() { return *m_int; }
	constexpr
	auto&	asi() const { return *m_int; }
	
	// Float.
	constexpr
	bool	isf() const { return m_type == df::types::floating; }
	constexpr
	auto&	asf() { return *m_float; }
	constexpr
	auto&	asf() const { return *m_float; }
	
	// String.
	constexpr
	bool	iss() const { return m_type == df::types::str; }
	constexpr
	auto&	ass() { return *m_str; }
	constexpr
	auto&	ass() const { return *m_str; }
	
	// Values.
	constexpr
	bool	isd() const { return m_type == df::types::df; }
	constexpr
	auto&	asd() { return *m_vals; }
	constexpr
	auto&	asd() const { return *m_vals; }
	
	// ---------------------------------------------------------
	// Properties.
	
	// Type.
    /*  @docs
        @title: Type
        @description:
            Get the type attribute.
    */
	constexpr
	auto&	type() const {
		return m_type;
	}
	
	// Length.
	// - Returns "npos" when the data type is not "df".
    /*  @docs
        @title: Length
        @description:
            Get the length of the dataframe.
            
            Returns "npos" when the data type is not "df".
    */
	constexpr
	ullong&	len() {
		expect_df(__FUNCTION__);
		return m_vals->len();
		// switch (m_dim) {
		// case 1:
		// 	return m_vals->len();
		// case 2:
		// 	if (m_vals->len() != 0) {
		// 		return m_vals->get(0).m_vals->len();
		// 	}
		// 	return df::zero_len;
		// default:
		// 	throw DimensionError(to_str(
		// 		"Function \"",
		// 		__FUNCTION__,
		// 		"\" is not supported for a dataframe with a dimension of \"",
		// 		m_dim,
		// 		"\"."));
		// }
	}
	constexpr
	ullong&	len() const {
		expect_df(__FUNCTION__);
		return m_vals->len();
		// switch (m_dim) {
		// case 1:
		// 	return m_vals->len();
		// case 2:
		// 	if (m_vals->len() != 0) {
		// 		return m_vals->get(0).m_vals->len();
		// 	}
		// 	return df::zero_len;
		// default:
		// 	throw DimensionError(to_str(
		// 		"Function \"",
		// 		__FUNCTION__,
		// 		"\" is not supported for a dataframe with a dimension of \"",
		// 		m_dim,
		// 		"\"."));
		// }
	}
	
	// Columns.
    /*  @docs
        @title: Columns
        @description:
            Get the assigned columns of the dataframe.
            
            Columns are only used in a 2D dataframe.
    */
	constexpr
	auto&	columns() const { return *m_cols; }
	constexpr
	bool	has_columns() const { return m_cols.is_defined() && m_cols->is_defined(); }
	
	// Shape.
    /*  @docs
        @title: Shape
        @description:
            Get the dataframe's shape.
    */
	constexpr
	Shape	shape() const {
		return shape(*this);
	}
	
	// ---------------------------------------------------------
	// Iterations.

	// Begin.
	// - Will cause a segfault when the df type is not "df".
	constexpr
	auto& 	begin() const {
		expect_df(__FUNCTION__);
		return m_vals->begin();
	}
	constexpr
	auto 	begin(ullong index) const {
		expect_df(__FUNCTION__);
		return m_vals->begin(index);
	}

	// End
	// - Will cause a segfault when the df type is not "df".
	constexpr
	auto 	end() const {
		expect_df(__FUNCTION__);
		return m_vals->end();
	}
	constexpr
	auto 	end(ullong index) const {
		expect_df(__FUNCTION__);
		return m_vals->end(index);
	}

	// Iterate.
	// - Will cause a segfault when the df type is not "df".
	template <typename Iter = Forwards, typename... Air> requires (is_Forwards<Iter>::value || is_Backwards<Iter>::value) constexpr
	auto 	iterate() const {
		expect_df(__FUNCTION__);
		return m_vals->iterate<Iter>();
	}
	template <typename Iter = Forwards, typename... Air> requires (is_Forwards<Iter>::value || is_Backwards<Iter>::value) constexpr
	auto 	iterate(ullong sindex, ullong eindex = internal::npos) const {
		expect_df(__FUNCTION__);
		return m_vals->iterate<Iter>(sindex, eindex);
	}

	// Iterate indexes.
	// - Will cause a segfault when the df type is not "df".
	template <typename Iter = Forwards, typename... Air> requires (is_Forwards<Iter>::value || is_Backwards<Iter>::value) constexpr
	auto 	indexes() const {
		expect_df(__FUNCTION__);
		return m_vals->indexes<Iter>();
	}
	template <typename Iter = Forwards, typename... Air> requires (is_Forwards<Iter>::value || is_Backwards<Iter>::value) constexpr
	auto 	indexes(ullong sindex, ullong eindex = internal::npos) const {
		expect_df(__FUNCTION__);
		return m_vals->indexes<Iter>(sindex, eindex);
	}

	// ---------------------------------------------------------
	// General functions.
	
	// Copy.
    /*  @docs
        @title: Copy
        @description:
            Create a copy of the object.
    */
	constexpr
	This	copy() { return *this; }
	constexpr
	This	copy() const { return *this; }
	
	// Reset.
    /*  @docs
        @title: Reset
        @description:
            Reset all object attributes.
    */
	constexpr
	This&	reset() {
		switch (m_type) {
            case df::types::null: {
                break;
            }
            case df::types::boolean: {
                m_bool.reset();
                break;
            }
            case df::types::short_type: {
                m_short.reset();
                break;
            }
            case df::types::integer: {
                m_int.reset();
                break;
            }
            case df::types::floating: {
                m_float.reset();
                break;
            }
            case df::types::str: {
                m_str.reset();
                break;
            }
            case df::types::df: {
                m_vals.reset();
                m_dim = 0;
                m_cols.reset();
                break;
            }
            default:
                throw TypeError(to_str("Unknown type \"", df::strtype(m_type), "\"."));
		}
		m_type = 0;
		return *this;
	}
	
	// Init type.
	/*  @docs
		@title: Init type
		@description:
			Initialize as a type.
	 
			Parameter dim will only be used when parameter type is `vlib::df::types::df`.
		@parameter:
			@name: type
			@description: The type to assign, from enum `vlib::df::types`.
		}
		@parameter:
			@name: dim
			@description: The dimension to assign then `type` is `vlib::df::types::df`.
		}
		@warning:
			Function `init` will cause a memory leak when the already assigned type is not `vlib::df::types::null`.
	*/
	constexpr
	This& 	init(short type, int dim = 1) {
		switch (type) {
            case df::types::null:
                break;
            case df::types::boolean:
                m_bool.init();
                break;
            case df::types::short_type:
                m_short.init();
                break;
            case df::types::integer:
                m_int.init();
                break;
            case df::types::floating:
                m_float.init();
                break;
            case df::types::str:
                m_str.init();
                break;
            case df::types::df:
                m_vals.init();
                m_dim = dim;
                switch (dim) {
                case 1: break;
                default:
                    m_cols.init();
                    break;
                }
                break;
            default:
                throw TypeError(to_str("Unknown type \"", df::strtype(m_type), "\"."));
		}
		m_type = type;
		return *this;
	}
	
	// Init children type.
	/*  @docs
		@title: Init children type
		@description:
			Initialize the children as a type.
		
			Parameter dim will only be used when parameter type is `vlib::df::types::df`.
			
			Will throw a `TypeError` when the type is not `vlib::df::types::df`.
		@parameter:
			@name: type
			@description: The type to assign, from enum `vlib::df::types`.
		}
		@parameter:
			@name: dim
			@description: The dimension to assign then `type` is `vlib::df::types::df`.
		}
		@warning:
			Function `init_children` will cause a memory leak when the already assigned type is not `vlib::df::types::null`.
	*/
	constexpr
	This& 	init_children(short type, int dim = 1) {
		expect_df(__FUNCTION__);
		for (auto& i: *m_vals) {
			i.init(type, dim);
		}
		return *this;
	}
	
	// Set type.
    /*  @docs
        @title: Set type
        @description:
            Set the type of a dataframe.
     
            Parameter dim will only be used when parameter type is `vlib::df::types::df`.
        @parameter:
            @name: type
            @description: The type to assign, from enum `vlib::df::types`.
        }
        @parameter:
            @name: dim
            @description: The dimension to assign then `type` is `vlib::df::types::df`.
        }
    */
	// constexpr
	// This& 	set_type(short type, int dim = 1) {
	// 	reset();
	// 	return init(type, dim);
	// }
	
	// Convert type.
	// @TODO make seperate func for convert_children, and remove "_type" from name.
    /*  @docs
        @title: Convert type
        @description:
            Convert the type of a dataframe.
     
            When the type is `vlib::df::types::df` the types of the children will be converted.
        @parameter:
            @name: type
            @description: The type to assign, from enum `vlib::df::types`.
        }
    */
	constexpr
	This&	convert_type(short type) {
		switch (m_type) {
		case df::types::null:
			init(type);
			return *this;
		case df::types::boolean:
			switch (type) {
			case df::types::null:
				m_type = type;
				m_bool.reset();
			case df::types::boolean:
				return *this;
            case df::types::short_type:
                m_short = (Short::value_type) m_bool->value();
                m_type = type;
                m_bool.reset();
                return *this;
			case df::types::integer:
				m_int = (Int::value_type) m_bool->value();
				m_type = type;
				m_bool.reset();
				return *this;
			case df::types::floating:
				m_float = (Float::value_type) m_bool->value();
				m_type = type;
				m_bool.reset();
				return *this;
			case df::types::str:
				m_str = m_bool->str();
				m_type = type;
				m_bool.reset();
				return *this;
			default: break;
			}
			break;
        case df::types::short_type:
            switch (type) {
            case df::types::null:
                m_type = type;
                m_short.reset();
            case df::types::boolean:
                m_bool = m_short->value();
                m_type = type;
                m_short.reset();
            case df::types::short_type:
                return *this;
            case df::types::integer:
                m_int = m_short->as<Int>();
                m_type = type;
                m_short.reset();
                return *this;
            case df::types::floating:
                m_float = m_short->as<Float>();
                m_type = type;
                m_short.reset();
                return *this;
            case df::types::str:
                m_str = m_short->str();
                m_type = type;
                m_short.reset();
                return *this;
            default: break;
            }
            break;
		case df::types::integer:
			switch (type) {
			case df::types::null:
				m_type = type;
				m_int.reset();
			case df::types::boolean:
				m_bool = m_int->value();
				m_type = type;
				m_int.reset();
            case df::types::short_type:
                m_short = m_int->as<Short>();
                m_type = type;
                m_int.reset();
                return *this;
			case df::types::integer:
				return *this;
			case df::types::floating:
				m_float = m_int->as<Float>();
				m_type = type;
				m_int.reset();
				return *this;
			case df::types::str:
				m_str = m_int->str();
				m_type = type;
				m_int.reset();
				return *this;
			default: break;
			}
			break;
		case df::types::floating:
			switch (type) {
			case df::types::null:
				m_type = type;
				m_float.reset();
			case df::types::boolean:
				m_bool = m_float->value();
				m_type = type;
				m_float.reset();
            case df::types::short_type:
                m_short = m_float->as<Short>();
                m_type = type;
                m_float.reset();
                return *this;
			case df::types::integer:
				m_int = m_float->as<Int>();
				m_type = type;
				m_float.reset();
				return *this;
			case df::types::floating:
				return *this;
			case df::types::str:
				m_str = m_float->str();
				m_type = type;
				m_float.reset();
				return *this;
			default: break;
			}
			break;
		case df::types::str:
			switch (type) {
			case df::types::null:
				m_type = type;
				m_str.reset();
			case df::types::boolean:
				m_bool = m_str->as<bool>();
				m_type = type;
				m_str.reset();
				return *this;
            case df::types::short_type:
                m_short = Short::parse(m_str->data(), m_str->len());
                m_type = type;
                m_str.reset();
                return *this;
			case df::types::integer:
				m_int = Int::parse(m_str->data(), m_str->len());
				m_type = type;
				m_str.reset();
				return *this;
			case df::types::floating:
				m_float = Float::parse(m_str->data(), m_str->len());
				m_type = type;
				m_str.reset();
				return *this;
			case df::types::str:
				return *this;
			default: break;
			}
			break;
		case df::types::df:
			switch (m_dim) {
			case 1:
			case 2:
				for (auto& i: *m_vals) {
					i.convert_type(type);
				}
				return *this;
			default:
				throw DimensionError(to_str(
					"Function \"",
					__FUNCTION__,
					"()\" is not supported for a dataframe with dimension ",
					m_dim,
					"."));
			}
		default: break;
		}
		throw TypeError(to_str(
			"Unable to convert type \"",
			df::strtype(m_type),
			"\" to type \"",
			df::strtype(type),
			"\"."));
	}
	
	// ---------------------------------------------------------
	// Array functions.
	
	// Resize.
    /*  @docs
        @title: Resize
        @description:
            Resize the dataframe.
     
            Will throw a `TypeError` when the type is not `vlib::df::types::df`.
        @parameter:
            @name: req_len
            @description: The length to resize to.
        }
    */
	constexpr
	This&	resize(ullong req_len) {
		expect_df(__FUNCTION__);
		m_vals->resize(req_len);
		return *this;
	}
	
	// Expand.
    /*  @docs
        @title: Expand
        @description:
            Expand the dataframe.
     
            Will throw a `TypeError` when the type is not `vlib::df::types::df`.
        @parameter:
            @name: with_len
            @description: The length to expand with.
        }
    */
	constexpr
	This&	expand(ullong with_len) {
		expect_df(__FUNCTION__);
		m_vals->expand(with_len);
		return *this;
	}
	
	// Append.
    /*  @docs
        @title: Append
        @description:
            Append an item to the dataframe.
     
            Will throw a `TypeError` when the type is not `vlib::df::types::df`.
            Will throw a `DimensionError` when the dataframe is not 1D.
        @parameter:
            @name: item
            @description: The item to append.
        }
        @funcs: 4
    */
	constexpr
	This&	append(const This& item) {
		expect_df(__FUNCTION__);
		m_vals->append(item);
		return *this;
	}
	constexpr
	This&	append(This&& item) {
		expect_df(__FUNCTION__);
		m_vals->append(item);
		return *this;
	}
	constexpr
	This&	append_no_resize(const This& item) {
		expect_df(__FUNCTION__);
		m_vals->append_no_resize(item);
		return *this;
	}
	constexpr
	This&	append_no_resize(This&& item) {
		expect_df(__FUNCTION__);
		m_vals->append_no_resize(item);
		return *this;
	}
	
	// First element.
    /*  @docs
        @title: First
        @description:
            Get the first item of the dataframe.
            
            Will cause a segfault if the dataframe is empty.
            Will throw a `TypeError` when the type is not `vlib::df::types::df`.
    */
	constexpr
	auto& 	first() {
		expect_df(__FUNCTION__);
		return m_vals->first();
	}
	constexpr
	auto& 	first() const {
		expect_df(__FUNCTION__);
		return m_vals->first();
	}

	// Last element.
    /*  @docs
        @title: Last
        @description:
            Get the last item of the dataframe.
            
            Will cause a segfault if the dataframe is empty.
            Will throw a `TypeError` when the type is not `vlib::df::types::df`.
    */
	constexpr
	auto& 	last() {
		expect_df(__FUNCTION__);
		return m_vals->last();
	}
	constexpr
	auto& 	last() const {
		expect_df(__FUNCTION__);
		return m_vals->last();
	}
	
	// Get a value.
    /*  @docs
        @title: Get
        @description:
            Get an item of the dataframe.
            
            Will cause a segfault when the index is out of range.
            Will throw a `TypeError` when the type is not `vlib::df::types::df`.
    */
	constexpr
	This&	get(ullong index) {
		expect_df(__FUNCTION__);
		return m_vals->get(index);
	}
	constexpr
	This&	get(ullong index) const {
		expect_df(__FUNCTION__);
		return m_vals->get(index);
	}
	
	// Set columns.
    /*  @docs
        @title: Set columns
        @description:
            Assign the columns array.
            
            Will throw a `TypeError` when the type is not `vlib::df::types::df`.
            Will throw a `DimensionError` when the dataframe is not 2D.
    */
	constexpr
	This&	set_columns(const Columns& cols) {
		expect_2d(__FUNCTION__);
		check_columns(cols);
		if (!m_cols) { m_cols.init(); }
		else { *m_cols = cols; }
		return *this;
	}
	
	// Fill.
	/*  @docs
		@title: Fill
		@description:
			Fill the dataframe.
			
			Will throw a `TypeError` when the type is not `vlib::df::types::df`.
	*/
	constexpr
	This&	fill(ullong len, const This& obj) {
		expect_df(__FUNCTION__);
		m_vals->m_len = 0;
		resize(len);
		ullong l_len = len;
		while (l_len--) { append_no_resize(obj); }
		return *this;
	}
	
	// Where.
	/*  @docs
		@title: Where
		@description:
			Fill with a value where `true` and with another value where `false`.
	 
			Will throw a `TypeError` when the type is not `vlib::df::types::df`.
			Will throw a `DimensionError` when the dataframe is not 1D.
	*/
	SICE
	This	where(const DataFrame& df, const DataFrame& where_true, const DataFrame& where_false) {
		df.expect_1d(__FUNCTION__);
		DataFrame where_df;
		where_df.init(df::types::df, 1);
		where_df.resize(df.m_vals->len());
		where_df.len() = df.m_vals->len();
		if (where_true.isd() && where_false.isd()) {
			for (auto& index: df.m_vals->indexes()) {
				if (df.m_vals->get(index)) {
					where_df.m_vals->get(index) = where_true.m_vals->get(index);
				} else {
					where_df.m_vals->get(index) = where_false.m_vals->get(index);
				}
			}
		} else if (where_true.isd()) {
			for (auto& index: df.m_vals->indexes()) {
				if (df.m_vals->get(index)) {
					where_df.m_vals->get(index) = where_true.m_vals->get(index);
				} else {
					where_df.m_vals->get(index) = where_false;
				}
			}
		} else if (where_false.isd()) {
			for (auto& index: df.m_vals->indexes()) {
				if (df.m_vals->get(index)) {
					where_df.m_vals->get(index) = where_true;
				} else {
					where_df.m_vals->get(index) = where_false.m_vals->get(index);
				}
			}
		} else {
			ullong index = 0;
			for (auto& i: *df.m_vals) {
				if (i) {
					where_df.m_vals->get(index) = where_true;
				} else {
					where_df.m_vals->get(index) = where_false;
				}
				++index;
			}
		}
		return where_df;
	}
	
	// Shift.
	/*  @docs
		@title: Shift
		@description:
			Shift the dataframe a number of positions to the front.
			
			Function `shift_r` updates the current array, while `shift` creates a copy.
	 
			Will throw a `TypeError` when the type is not `vlib::df::types::df`.
		@funcs: 2
	*/
	constexpr
	This	shift(const Int& steps) const {
		expect_df(__FUNCTION__);
		DataFrame shifted;
		shifted.init(df::types::df, m_dim);
		shifted.resize(m_vals->len());
		shifted.len() = m_vals->len();
		switch (m_dim) {
		case 1:
			if (steps < 0) {
                Int abs_steps = steps.abs();;
				for (auto& index: m_vals->indexes()) {
					if (index >= abs_steps) {
						shifted.m_vals->get(index - abs_steps.value()) = m_vals->get(index);
					}
				}
			} else {
				for (auto& index: m_vals->indexes()) {
					if (index + steps < shifted.m_vals->len()) {
						shifted.m_vals->get(index + steps.value()) = m_vals->get(index);
					}
				}
			}
			return shifted;
		case 2:
			shifted.m_cols = m_cols;
			for (auto& index: m_vals->indexes()) {
				shifted.m_vals->get(index) = m_vals->get(index).shift(steps);
			}
			return shifted;
		default:
			throw DimensionError(to_str(
				"Function \"",
				__FUNCTION__,
				"\" is not supported for a dataframe with a dimension of \"",
				m_dim,
				"\"."));
		}
	}
	constexpr
	This&	shift_r(const Int& steps) {
		DataFrame x = shift(steps);
		return swap(x);
	}
	
	// Save.
	/*  @docs
		@title: Save
		@type: This&
		@description:
			Save the dataframe.
			
			Will throw a `TypeError` when the type is not `vlib::df::types::df`.
			Will throw a `DimensionError` when the dimension is not `1` or `2`.
		@funcs: 2
	*/
	constexpr
	auto&	save(const char* path) const {
		expect_df(__FUNCTION__);
		String data;
		switch (m_dim) {
		
		// 1D.
		case 1:
			data.concat_r("1\n", 2);
			for (auto& i: *m_vals) {
				switch (i.m_type) {
				case df::types::null:
					data.concat_r("null\n", 5);
					continue;
				case df::types::boolean:
					data.concats_r(i.m_bool->value());
					data.append('\n');
					continue;
                case df::types::short_type:
                    data.concats_r(i.m_short->value());
                    data.append('\n');
                    continue;
				case df::types::integer:
					data.concats_r(i.m_int->value());
					data.append('\n');
					continue;
				case df::types::floating:
					data.concats_r(i.m_float->value());
					data.append('\n');
					continue;
				case df::types::str:
					data.append('"');
					data.concat_r(*i.m_str);
					data.append('"');
					data.append('\n');
					continue;
				default:
					throw TypeError(to_str("Unknown type \"", df::strtype(i.m_type), "\"."));
				}
			}
			break;
			
		// 2D.
		case 2:
			data.concat_r("2\n", 2);
			for (auto& i: *m_cols) {
				data.append('\"');
				data.concat_r(i);
				data.concat_r("\",", 2);
			}
			--data.len();
			data.append('\n');
			if (m_vals->len() > 0) {
				ullong len = m_vals->first().m_vals->len();
				for (auto& index: Range(len)) {
					for (auto& column: *m_vals) {
						DataFrame& item = column.get(index);
						switch (item.m_type) {
						case df::types::null:
							data.concat_r("null", 4);
							break;
						case df::types::boolean:
							data.concats_r(item.m_bool->value());
							break;
                        case df::types::short_type:
                            data.concats_r(item.m_short->value());
                            break;
						case df::types::integer:
							data.concats_r(item.m_int->value());
							break;
						case df::types::floating:
							data.concats_r(item.m_float->value());
							break;
						case df::types::str:
							data.append('"');
							data.concat_r(*item.m_str);
							data.append('"');
							break;
						default:
							throw TypeError(to_str("Unexpected type \"", df::strtype(item.m_type), "\"."));
						}
						data.append(',');
					}
					--data.len();
					data.append('\n');
				}
			}
			break;
			
		// Error.
		default:
			throw DimensionError(to_str(
				"Function \"",
				__FUNCTION__,
				"\" is not supported for a dataframe with a dimension of \"",
				m_dim,
				"\"."));
			
		}
		
		// Save.
		data.save(path);
		return *this;
		
	}
	constexpr
	auto&	save(const String& path) const {
		return save(path.c_str());
	}
	
	// Load.
	/*  @docs
		@title: Load
		@description:
			Load the dataframe.
	 
			The dataframe will always be treated as type `vlib::df::types::df`, regardless of the real type.
		@funcs: 2
	*/
	SICE
	This	load(const char* path) {
		
		// Expect df.
		DataFrame df;
		df.init(df::types::df);
		
		// Load data.
		Code data = Code::load(path);
		
		// Funcs.
		auto append_value = [&](DataFrame& df, const char* data, ullong start, ullong len) {
			switch (len) {
			case 0:
				df.append(DataFrame());
				return ;
			default:
				switch (data[start]) {
				case 'n':
					df.append(DataFrame());
					return ;
				case 't':
					df.append(true);
					return ;
				case 'f':
					df.append(false);
					return ;
				case '"':
					df.append(String(data + start + 1, len - 2));
					return ;
				default:
					bool floating = false;
					for (auto& i: Range(start, start + len)) {
						switch (data[i]) {
						case '.': floating = true; break;
						default: continue;
						}
						break;
					}
					if (floating) {
						df.append(to_num<Float::value_type>(data + start, len));
					} else {
						df.append(to_num<Int::value_type>(data + start, len));
					}
					return ;
				}
			}
		};
		
		// Get first and second newline pos.
		ullong index = 0, first_newline = 0, second_newline = 0;
		for (auto& i: data) {
			switch (i) {
			case '\n':
				if (first_newline == 0) {
					first_newline = index;
				} else {
					second_newline = index;
					break;
				}
				++index;
				continue;
			default:
				++index;
				continue;
			}
			break;
		}
		
		// Check dimension.
		switch (data.first()) {
		
		// 1D.
		case '1': {
			df.m_dim = 1;
			ullong start_index = first_newline + 1;
			for (auto& i: data.iterate(first_newline + 1)) {
				switch (i.character()) {
				case '\n':
					if (!i.is_str()) {
						append_value(df, data.data(), start_index, i.index - 1 - start_index);
						start_index = index + 1;
					}
					continue;
				default:
					continue;
				}
			}
			break;
		}
			
		// 2D.
		case '2': {
			df.m_dim = 2;
			if (df.m_cols == null) { df.m_cols.init(); }
			ullong start_index = first_newline + 1;
			for (auto& i: data.iterate(first_newline + 1, second_newline + 1)) {
				if (!i.is_str()) {
					switch (i.character()) {
					case ',':
					case '\n':
						df.m_cols->append(String(data.data() + start_index + 1, i.index - 1 - start_index - 1));
						start_index = i.index + 1;
						continue;
					default:
						continue;
					}
				}
			}
			df.fill(df.m_cols->len(), DataFrame().init(df::types::df, 1));
			ullong column = 0;
			start_index = second_newline + 1;
			for (auto& i: data.iterate(second_newline + 1)) {
				if (!i.is_str()) {
					switch (i.character()) {
					case ',':
						append_value(df.m_vals->get(column), data.data(), start_index, i.index - start_index);
						start_index = i.index + 1;
						++column;
						continue;
					case '\n':
						append_value(df.m_vals->get(column), data.data(), start_index, i.index - start_index);
						start_index = i.index + 1;
						column = 0;
						continue;
					}
				}
			}
			break;
		}
			
		// Error.
		default:
			throw ParseError(to_str("Unable to parse file \"", path, "\"."));
		}
		return df;
	}
	SICE
	This	load(const String& path) {
		return load(path.c_str());
	}
	
	// Concat.
	/*  @docs
		@title: Concatenate
		@description:
			Concatenate dataframes.
		
			Function `concat_r` updates the current array, while `concat` creates a copy.
	 
			Will throw a `TypeError` when the type is not `vlib::df::types::df`.
		@funcs: 4
	*/
	constexpr
	This&	concat_r(const This& obj, int axis = 0) {
		expect_df(__FUNCTION__);
		obj.expect_df(__FUNCTION__);
		switch (m_dim) {
		case 1:
			m_vals->concat_r(*obj.m_vals);
			return *this;
		case 2:
			switch (axis) {
			case 0:
				for (auto& index: m_vals->indexes()) {
					m_vals->get(index).concat_r(obj.m_vals->get(index));
				}
				return *this;
			case 1:
				m_vals->concat_r(*obj.m_vals);
				return *this;
			default:
				throw InvalidUsageError(to_str("Axis \"", axis, "\" is not a valid option."));
			}
		default:
			throw DimensionError(to_str(
				"Function \"",
				__FUNCTION__,
				"\" is not supported for a dataframe with a dimension of \"",
				m_dim,
				"\"."));
		}
	}
	constexpr
	This&	concat_r(This&& obj, int axis = 0) {
		expect_df(__FUNCTION__);
		obj.expect_df(__FUNCTION__);
		switch (m_dim) {
		case 1:
			m_vals->concat_r(move(*obj.m_vals));
			return *this;
		case 2:
			switch (axis) {
			case 0:
				for (auto& index: m_vals->indexes()) {
					m_vals->get(index).concat_r(move(obj.m_vals->get(index)));
				}
				return *this;
			case 1:
				m_vals->concat_r(move(*obj.m_vals));
				return *this;
			default:
				throw InvalidUsageError(to_str("Axis \"", axis, "\" is not a valid option."));
			}
		default:
			throw DimensionError(to_str(
				"Function \"",
				__FUNCTION__,
				"\" is not supported for a dataframe with a dimension of \"",
				m_dim,
				"\"."));
		}
	}
	constexpr
	This	concat(const This& obj) {
		return copy().concat_r(obj);
	}
	constexpr
	This	concat(This&& obj) {
		return copy().concat_r(obj);
	}
	
	// Merge.
	/*  @docs
		@title: Merge
		@description:
			Merge multiple 2D dataframes.
		
			Function `merge_r` updates the current dataframe, while `merge` creates a copy.
	 
			Will throw a `TypeError` when the type is not `vlib::df::types::df`.
			Will throw a `DimensionError` when the dataframe is not 2D.
		@funcs: 2
	*/
	constexpr
	This&	merge_r(const This& obj) {
		expect_2d(__FUNCTION__);
		obj.expect_2d(__FUNCTION__);
		if (obj.has_columns()) {
			for (auto& col: obj.columns()) {
				operator[](col) = obj[col];
			}
		} else {
			for (auto& i: *obj.m_vals) {
				append(i);
			}
		}
		return *this;
	}
	constexpr
	This	merge(const This& obj) {
		return copy().merge_r(obj);
	}
	
	// Sort.
	/*  @docs
		@title: Sort
		@description:
			Sort a 2D dataframe.
		
			Function `sort_r` updates the current dataframe, while `sort` creates a copy.
	 
			Will throw a `TypeError` when the type is not `vlib::df::types::df`.
			Will throw a `DimensionError` when the dataframe is not 2D.
		@funcs: 2
	*/
	constexpr
	This	sort(const String& column, bool reversed = false) const {
		expect_2d(__FUNCTION__);
		DataFrame& df = operator[](column);
		Dict<ullong, DataFrame> dict;
		ullong index = 0;
		for (auto& i: *df.m_vals) {
			dict.keys().append(index);
			dict.values().append(i);
			++index;
		}
		dict.sort_values_r(reversed);
		DataFrame sorted;
		sorted.init(vlib::df::types::df, 2);
		sorted.fill(m_vals->len(), DataFrame().init(df::types::df));
		sorted.set_columns(*m_cols);
		ullong clen = m_vals->get(0).len();
		for (auto& cindex: Range<ullong>(0, m_vals->len())) {
			DataFrame& ncol = sorted[cindex];
			DataFrame& ocol = m_vals->get(cindex);
			ncol.resize(clen);
			ncol.len() = clen;
			ullong index = 0;
			for (auto& rindex: dict.keys()) {
				ncol[index] = ocol[rindex];
				++index;
			}
		}
		return sorted;
	}
	constexpr
	This&	sort_r(const String& column, bool reversed = false) {
		DataFrame x = sort(column, reversed);
		return swap(x);
	}
	
	// Drop null.
	/*  @docs
		@title: Drop null
		@description:
			Drop all rows or columns where `null` is present.
		
			Function `drop_null_r` updates the current dataframe, while `drop_null` creates a copy.
	 
			Will throw a `TypeError` when the type is not `vlib::df::types::df`.
		@funcs: 2
	*/
	constexpr
	This	drop_null(int axis = 0) const {
		expect_df(__FUNCTION__);
		DataFrame dropped;
		dropped.init(df::types::df, m_dim);
		switch (m_dim) {
			
		// 1D.
		case 1:
			dropped.resize(m_vals->len());
			switch (axis) {
				
			// By rows.
			case 0:
				for (auto& val: *m_vals) {
					switch (val.m_type) {
					case df::types::null:
						continue;
					default:
						dropped.append_no_resize(val);
						continue;
					}
				}
				return dropped;
				
			// By Columns.
			case 1:
				for (auto& val: *m_vals) {
					switch (val.m_type) {
					case df::types::null:
						dropped.reset();
						break;
					default:
						dropped.append_no_resize(val);
						continue;
					}
					break;
				}
				return dropped;
			
			// Invalid axis.
			default:
				throw InvalidUsageError(to_str("Axis \"", axis, "\" is not a valid option."));
			}
		
		// 2D.
		case 2: {
			ullong& col_len = m_vals->len();
			if (col_len == 0) {
				return dropped;
			}
			ullong& row_len = m_vals->first().m_vals->len();
			dropped.fill(
				 m_vals->len(),
				 DataFrame().init(df::types::df).resize(row_len)
			);
			switch (axis) {
				
			// By rows.
			case 0:
				dropped.m_cols = m_cols;
				for (auto& rindex: m_vals->first().indexes()) {
					bool na = false;
					for (auto& cindex: vlib::Range<ullong>(0, col_len)) {
						DataFrame& val = (*m_vals)[cindex][rindex];
						dropped[cindex].append_no_resize(val);
						switch (val.m_type) {
						case df::types::null:
							na = true;
							continue;
						}
					}
					if (na) {
						for (auto& cindex: vlib::Range<ullong>(0, col_len)) {
							--dropped[cindex].len();
						}
					}
				}
				return dropped;
				
			// By Columns.
			case 1: {
				Array<bool> na;
				na.fill(col_len, false);
				ullong cindex = 0;
				for (auto& row: *m_vals) {
					for (auto& val: *row.m_vals) {
						switch (val.m_type) {
						case df::types::null:
							na[cindex] = true;
							break;
						default:
							dropped[cindex].append_no_resize(val);
							continue;
						}
						break;
					}
					++cindex;
				}
				DataFrame x;
				x.init(df::types::df, m_dim);
				for (auto& cindex: vlib::Range<ullong>(0, col_len)) {
					if (!na[cindex]) {
						x.append(move(dropped[cindex]));
						x.m_cols->append(m_cols->get(cindex));
					}
				}
				return x;
			}
			
			// Invalid axis.
			default:
				throw InvalidUsageError(to_str("Axis \"", axis, "\" is not a valid option."));
			}
		}
			
		// Invalid dimension.
		default:
			throw DimensionError(to_str(
				"Function \"",
				__FUNCTION__,
				"\" is not supported for a dataframe with a dimension of \"",
				m_dim,
				"\"."));
		}
		
	}
    constexpr
    This    dropna(int axis = 0) const {
        return drop_null(axis);
    }
	constexpr
	This&	drop_null_r(int axis = 0) {
		DataFrame x = drop_null(axis);
		return swap(x);
	}
    constexpr
    This&    dropna_r(int axis = 0) {
        DataFrame x = drop_null(axis);
        return swap(x);
    }
    
    // Fill null.
    /*  @docs
        @title: Fill null
        @description:
            Fill all rows or columns where `null` is present.
        
            Function `fill_null_r` updates the current dataframe, while `fill_null` creates a copy.
     
            Will throw a `TypeError` when the type is not `vlib::df::types::df`.
        @funcs: 2
    */
    constexpr
    This    fill_null(const DataFrame& value) const {
        return copy().fill_null_r(value);
    }
    constexpr
    This&    fill_null_r(const DataFrame& value) {
        expect_df(__FUNCTION__);
        switch (m_dim) {
            
            // 1D.
            case 1: {
                for (auto& val: *m_vals) {
                    if (val.m_type == df::types::null) {
                        val = value;
                    }
                }
                break;
            }
        
            // 2D.
            case 2: {
                for (auto& val: *m_vals) {
                    val.fill_null_r(value);
                }
                break;
            }
            
            // Invalid dimension.
            default:
                throw DimensionError(to_str(
                    "Function \"",
                    __FUNCTION__,
                    "\" is not supported for a dataframe with a dimension of \"",
                    m_dim,
                    "\"."));
        }
        return *this;
    }
	
	// ---------------------------------------------------------
	// Global functions.
	
	// Equals.
	/*  @docs
		@title: Equals
		@description:
			Check if the dataframe equals another dataframe or value.
	*/
	constexpr
	bool	eq(const This& obj) const {
		switch (m_type) {
            case df::types::null: return true;
            case df::types::boolean:
                if (m_type != obj.m_type) { return false; }
                return *m_bool == *obj.m_bool;
            case df::types::short_type:
                obj.expect_numeric(__FUNCTION__);
                switch (obj.m_type) {
                    case df::types::short_type:
                        return *m_short == *obj.m_short;
                    case df::types::integer:
                        return *m_short == *obj.m_int;
                    case df::types::floating:
                        return *m_short == *obj.m_float;
                }
            case df::types::integer:
                obj.expect_numeric(__FUNCTION__);
                switch (obj.m_type) {
                    case df::types::short_type:
                        return *m_int == *obj.m_short;
                    case df::types::integer:
                        return *m_int == *obj.m_int;
                    case df::types::floating:
                        return *m_int == *obj.m_float;
                }
            case df::types::floating:
                obj.expect_numeric(__FUNCTION__);
                switch (obj.m_type) {
                    case df::types::short_type:
                        return *m_float == *obj.m_short;
                    case df::types::integer:
                        return *m_float == *obj.m_int;
                    case df::types::floating:
                        return *m_float == *obj.m_float;
                }
            case df::types::str:
                if (m_type != obj.m_type) { return false; }
                return *m_str == *obj.m_str;
            case df::types::df:
                if (m_type != obj.m_type) { return false; }
                return *m_vals == *obj.m_vals;
            default:
                throw TypeError(to_str("Unknown type \"", m_type, "\"."));
		}
	}
	
	// As string.
	/*  @docs
		@title: As string
		@description:
			Dump to a string.
	*/
	constexpr
	String	str() const {
		Pipe pipe;
		dump(pipe);
		return String(pipe);
	}
    
    // Dump.
    constexpr
    void     dump(Pipe& pipe, const Bool& add_index = true, const Int& precision = 6) const {
        switch (m_dim) {
            
            // 0D.
            case 0:
                switch (m_type) {
                case df::types::null: {
                    pipe << "null";
                    return ;
                }
                case df::types::boolean: {
                    pipe << *m_bool;
                    return ;
                }
                case df::types::short_type: {
                    pipe << *m_short;
                    return ;
                }
                case df::types::integer: {
                    pipe << *m_int;
                    return ;
                }
                case df::types::floating: {
                    pipe << *m_float;
                    return ;
                }
                case df::types::str: {
                    pipe << *m_str;
                    return ;
                }
                default: return ;
                }
            
            // 1D.
            case 1: {
                
                // Empty.
                if (m_vals->len() == 0) {
                    pipe << "Empty dataframe";
                    return ;
                }
                
                // Vars.
                ullong index;
                Array<Array<String>> vals;
                Array<ullong>    mlens;
                vals.resize(2);
                vals.len() = 2;
                mlens.fill_r(vals.len(), 0);
                
                // Add columns.
                // vals.get(0).append("index");
                // mlens.get(0) = max(mlens.get(0), vals.get(0).last().len());
                // index = 1;
                // for (auto& i: *m_cols) {
                //     vals.get(index).append(i);
                //     mlens.get(index) = max(mlens.get(index), i.len());
                //     ++index;
                // }
                
                // Cast to string.
                index = 0;
                for (auto& i: *m_vals) {
                    vals.get(0).append(to_str(index));
                    mlens.get(0) = vlib::max(mlens.get(0), vals.get(0).last().len());
                    switch (i.m_type) {
                    case df::types::boolean: {
                        vals.get(1).append(i.m_bool->str());
                        break;
                    }
                    case df::types::short_type: {
                        vals.get(1).append(i.m_short->str());
                        break;
                    }
                    case df::types::integer: {
                        vals.get(1).append(i.m_int->str());
                        break;
                    }
                    case df::types::floating: {
                        vals.get(1).append(i.m_float->str());
                        break;
                    }
                    case df::types::str: {
                        vals.get(1).append(*i.m_str);
                        break;
                    }
                    case df::types::null: {
                        vals.get(1).append("null");
                        break;
                    }
                    default:
                        throw TypeError(to_str("Unknown type \"", df::strtype(i.m_type), "\"."));
                    }
                    ullong& mlen1 = mlens.get(1);
                    mlen1 = vlib::max(mlen1, vals.get(1).last().len());
                    ++index;
                }
                
                // Add padding.
                for (auto& cindex: vals.indexes()) {
                    ullong& mlen = mlens.get(cindex);
                    for (auto& i: vals.get(cindex)) {
                        i.ensure_end_padding_r(' ', mlen);
                    }
                }
                
                // Dump.
                for (auto& rindex: vals.get(0).indexes()) {
                    for (auto& cindex: vals.indexes()) {
                        if (!(!add_index && cindex == 0)) {
							pipe << vals.get(cindex).get(rindex) << "    ";
						}
                    }
                    pipe << '\n';
                }
                return ;
            }
                
            // 2D.
            case 2: {
                
                // Empty.
                if (m_vals->len() == 0) {
                    pipe << "Empty dataframe";
                    return ;
                }
                
                // Generate columns.
                Columns cols;
                if (m_cols == null || *m_cols == null) {
                    cols = gen_columns();
                } else {
                    cols = *m_cols;
                }
                
                // Vars.
                Array<Array<String>> vals;
                Array<ullong>    mlens;
                vals.resize(cols.len() + 1);
                vals.len() = cols.len() + 1;
                mlens.fill_r(vals.len(), 0);
                
                // Add columns.
                vals.get(0).append("index");
                mlens.get(0) = vlib::max(mlens.get(0), vals.get(0).last().len());
                ullong index = 1;
                for (auto& i: cols) {
                    vals.get(index).append(i);
                    mlens.get(index) = vlib::max(mlens.get(index), i.len());
                    ++index;
                }
                
                // Cast to string.
                int old_precision = vlib::casts::to_str::precision;
                vlib::casts::to_str::precision = (uint) precision.value();
                for (auto& i: Range(m_vals->get(0).m_vals->len())) {
                    vals.get(0).append(to_str(i));
                    mlens.get(0) = vlib::max(mlens.get(0), vals.get(0).last().len());
                }
                index = 1;
                for (auto& i0: *m_vals) {
                    Array<String>& arr = vals.get(index);
                    for (auto& i1: *i0.m_vals) {
                        switch (i1.m_type) {
                        case df::types::null:
                            arr.append("null");
                            break;
                        case df::types::boolean: {
                            arr.append(i1.m_bool->str());
                            break;
                        }
                        case df::types::short_type: {
                            arr.append(i1.m_short->str());
                            break;
                        }
                        case df::types::integer: {
                            arr.append(i1.m_int->str());
                            break;
                        }
                        case df::types::floating: {
                            arr.append(i1.m_float->str());
                            break;
                        }
                        case df::types::str: {
                            arr.append(*i1.m_str);
                            break;
                        }
                        default:
                            throw TypeError(to_str("Unknown type \"", df::strtype(i1.m_type), "\"."));
                        }
                        mlens.get(index) = vlib::max(mlens.get(index), arr.last().len());
                    }
                    ++index;
                }
                vlib::casts::to_str::precision = old_precision;
                
                // Add padding.
                for (auto& cindex: vals.indexes()) {
                    ullong& mlen = mlens.get(cindex);
                    for (auto& i: vals.get(cindex)) {
                        i.ensure_end_padding_r(' ', mlen);
                    }
                }
                
                // Dump.
                for (auto& rindex: vals.get(0).indexes()) {
                    for (auto& cindex: vals.indexes()) {
                        if (!(!add_index && cindex == 0)) {
							pipe << vals.get(cindex).get(rindex) << "    ";
						}
                    }
                    pipe << '\n';
                }
                return ;
            }
            default:
                throw DimensionError(to_str("Unsupported dimension of \"", m_dim, "\"."));
        }
    }
    constexpr
    void     dump(const Bool& add_index = true, const Int& precision = 6) const {
        dump(vlib::out, add_index, precision);
    }
	
	// ---------------------------------------------------------
	// Math functions.
	
	// Min between values.
    /*  @docs
        @title: Min
        @description:
            Get the minimum of two values.
     
            Function `min_r` will update the current object.
            
            Will throw a `TypeError` when the type is either `vlib::df::types::df` or `vlib::df::types::str`.
        @return:
            Function `min` returns a new `DataFrame` object while function `min_r` updates the current object and returns a reference to the current object.
        @usage:
            vlib::DataFrame x = 10;
            vlib::DataFrame y = x.min(5); y ==> 5
        @funcs: 3
    */
	template <typename Type> requires (is_DataFrame_h<Type>() || is_any_Numeric<Type>::value || is_any_numeric<Type>::value) constexpr
	This	min(const Type& obj) const {
		return copy().min_r(obj);
	}
	constexpr
	This&	min_r(const This& obj) {
		switch (m_type) {
		case df::types::null:
			switch (obj.m_type) {
			case df::types::null:
            case df::types::short_type:
			case df::types::integer:
			case df::types::floating:
				copy(obj);
				return *this;
			default: break;
			}
			break;
        case df::types::short_type:
            switch (obj.m_type) {
            case df::types::null:
                return reset();
            case df::types::short_type:
                m_short->min_r(*obj.m_short);
                return *this;
            case df::types::integer:
                m_short->min_r(*obj.m_int);
                return *this;
            case df::types::floating:
                m_short->min_r(*obj.m_float);
                return *this;
            default: break;
            }
            break;
		case df::types::integer:
			switch (obj.m_type) {
			case df::types::null:
				return reset();
            case df::types::short_type:
                m_int->min_r(*obj.m_short);
                return *this;
			case df::types::integer:
				m_int->min_r(*obj.m_int);
				return *this;
			case df::types::floating:
				m_int->min_r(*obj.m_float);
				return *this;
			default: break;
			}
			break;
		case df::types::floating:
			switch (obj.m_type) {
			case df::types::null:
				return reset();
            case df::types::short_type:
                m_float->min_r(*obj.m_short);
                return *this;
			case df::types::integer:
				m_float->min_r(*obj.m_int);
				return *this;
			case df::types::floating:
				m_float->min_r(*obj.m_float);
				return *this;
			default: break;
			}
			break;
		case df::types::df:
			switch (obj.m_type) {
			case df::types::df:
				if (m_vals->len() != obj.m_vals->len()) {
					throw ShapeError(to_str("Function \"", __FUNCTION__, "\" does not support different dataframe lengths."));
				}
				if (m_dim != obj.m_dim) {
					throw DimensionError(to_str("Function \"", __FUNCTION__, "\" does not support different dataframe dimensions."));
				}
				for (auto& index: m_vals->indexes()) {
					m_vals->get(index).min_r(obj.m_vals->get(index));
				}
				return *this;
			default:
				for (auto& i: *m_vals) {
					i.min_r(obj);
				}
				return *this;
			}
		default: break;
		}
		throw TypeError(to_str(
			"Function \"",
			__FUNCTION__,
			"()\" is not supported for type \"",
			df::strtype(m_type),
			"\" and type \"",
			df::strtype(obj.m_type),
			"\"."));
	}
	template <typename Type> requires (is_any_Numeric<Type>::value || is_any_numeric<Type>::value) constexpr
	This&	min_r(const Type& obj) {
		switch (m_type) {
		case df::types::null:
			return *this;
        case df::types::short_type:
            m_short->min_r(obj);
            return *this;
		case df::types::integer:
			m_int->min_r(obj);
			return *this;
		case df::types::floating:
			m_float->min_r(obj);
			return *this;
		case df::types::df:
			for (auto& i: *m_vals) {
				i.min_r(obj);
			}
			return *this;
		default: break;
		}
		throw TypeError(to_str(
			"Function \"",
			__FUNCTION__,
			"()\" is not supported for type \"",
			df::strtype(m_type),
			"\" and a numeric."));
	}
	
	// Min of dataframe.
    /*  @docs
        @title: Min
        @description:
            Get the minimum value of a dataframe.
            
            Will throw a `TypeError` when the type is not `vlib::df::types::df`.
        @return:
            Returns an integer or floating `DataFrame` with the minimum value of the dataframe array.
        @usage:
            vlib::DataFrame x = {1, 2, 3};
            vlib::DataFrame y = x.min(); y ==> 1
    */
	constexpr
	This	min() const {
		expect_df(__FUNCTION__);
		switch (m_dim) {
		case 1: {
			if (m_vals->len() == 0) { return DataFrame(); }
			DataFrame* val = &m_vals->get(0);
			for (auto& i: *m_vals) {
				if (i < *val) {
					val = &i;
				}
			}
			return *val;
		}
		case 2: {
			if (m_vals->len() == 0) { return DataFrame(); }
			DataFrame val = m_vals->get(0).min();
			for (auto& row: *m_vals) {
				val.min_r(row.min());
			}
			return val;
		}
		default:
			throw DimensionError(to_str(
				"Function \"",
				__FUNCTION__,
				"\" is not supported for a dataframe with a dimension of \"",
				m_dim,
				"\"."));
		}
	}
    constexpr
    This    rolling_min(const LLong& window) const {
        expect_df(__FUNCTION__);
        DataFrame rolling;
        rolling.init(df::types::df);
        rolling.resize(m_vals->len());
        rolling.len() = m_vals->len();
        ullong min_index = window.value() - 1;
        switch (m_dim) {
        case 1: {
            if (m_vals->len() == 0) { return DataFrame(); }
            for (auto& index: m_vals->indexes()) {
                if (index >= min_index) {
                    DataFrame val = m_vals->get(index - window.value() + 1);
                    for (auto& lookback: Range(index - window.value() + 2, index + 1)) {
                        if (m_vals->get(lookback) < val) {
                            val = m_vals->get(lookback);
                        }
                    }
                    rolling.m_vals->get(index) = val;
                }
            }
            return rolling;
        }
        case 2: {
            if (m_vals->len() == 0) { return DataFrame(); }
            for (auto& index: m_vals->indexes()) {
                if (index >= min_index) {
                    rolling.m_vals->get(index) = m_vals->get(index).min(window);
                }
            }
            return rolling;
        }
        default:
            throw DimensionError(to_str(
                "Function \"",
                __FUNCTION__,
                "\" is not supported for a dataframe with a dimension of \"",
                m_dim,
                "\"."));
        }
    }
    constexpr
    This    slice_min(const LLong& start_index, const LLong& end_index) const {
        expect_df(__FUNCTION__);
        switch (m_dim) {
        case 1: {
            if (m_vals->len() == 0) { return DataFrame(); }
            DataFrame val = m_vals->get(start_index.value());
            for (auto& index: Range(start_index.value() + 1, end_index.value())) {
                if (m_vals->get(index) < val) {
                    val = m_vals->get(index);
                }
            }
            return val;
        }
        case 2: {
            if (m_vals->len() == 0) { return DataFrame(); }
            DataFrame val;
            for (auto& row: *m_vals) {
                DataFrame row_min = row.slice_min(start_index, end_index);
                if (val.isn() || row_min < val) {
                    val = row_min;
                }
            }
            return val;
        }
        default:
            throw DimensionError(to_str(
                "Function \"",
                __FUNCTION__,
                "\" is not supported for a dataframe with a dimension of \"",
                m_dim,
                "\"."));
        }
    }
	
	// Max between values.
    /*  @docs
        @title: Max
        @description:
            Get the maximum of two values.
     
            Function `max_r` will update the current object.
            
            Will throw a `TypeError` when the type is either `vlib::df::types::df` or `vlib::df::types::str`.
        @return:
            Function `max` returns a new `DataFrame` object while function `max_r` updates the current object and returns a reference to the current object.
        @usage:
            vlib::DataFrame x = 10;
            vlib::DataFrame y = x.max(15); y ==> 15
        @funcs: 3
    */
	template <typename Type> requires (is_DataFrame_h<Type>() || is_any_Numeric<Type>::value || is_any_numeric<Type>::value) constexpr
	This	max(const Type& obj) const {
		return copy().max_r(obj);
	}
	constexpr
	This&	max_r(const This& obj) {
		switch (m_type) {
		case df::types::null:
			switch (obj.m_type) {
			case df::types::null:
            case df::types::short_type:
			case df::types::integer:
			case df::types::floating:
				return *this;
			default: break;
			}
			break;
        case df::types::short_type:
            switch (obj.m_type) {
            case df::types::null:
                return reset();
            case df::types::short_type:
                m_short->max_r(*obj.m_short);
                return *this;
            case df::types::integer:
                m_short->max_r(*obj.m_int);
                return *this;
            case df::types::floating:
                m_short->max_r(*obj.m_float);
                return *this;
            default: break;
            }
            break;
		case df::types::integer:
			switch (obj.m_type) {
			case df::types::null:
				return reset();
            case df::types::short_type:
                m_int->max_r(*obj.m_short);
                return *this;
			case df::types::integer:
				m_int->max_r(*obj.m_int);
				return *this;
			case df::types::floating:
				m_int->max_r(*obj.m_float);
				return *this;
			default: break;
			}
			break;
		case df::types::floating:
			switch (obj.m_type) {
			case df::types::null:
				return reset();
            case df::types::short_type:
                m_float->max_r(*obj.m_short);
                return *this;
			case df::types::integer:
				m_float->max_r(*obj.m_int);
				return *this;
			case df::types::floating:
				m_float->max_r(*obj.m_float);
				return *this;
			default: break;
			}
			break;
		case df::types::df:
			switch (obj.m_type) {
			case df::types::df:
				if (m_vals->len() != obj.m_vals->len()) {
					throw ShapeError(to_str("Function \"", __FUNCTION__, "\" does not support different dataframe lengths."));
				}
				if (m_dim != obj.m_dim) {
					throw DimensionError(to_str("Function \"", __FUNCTION__, "\" does not support different dataframe dimensions."));
				}
				for (auto& index: m_vals->indexes()) {
					m_vals->get(index).max_r(obj.m_vals->get(index));
				}
				return *this;
			default:
				for (auto& i: *m_vals) {
					i.max_r(obj);
				}
				return *this;
			}
		default: break;
		}
		throw TypeError(to_str(
			"Function \"",
			__FUNCTION__,
			"()\" is not supported for type \"",
			df::strtype(m_type),
			"\" and type \"",
			df::strtype(obj.m_type),
			"\"."));
	}
	template <typename Type> requires (is_any_Numeric<Type>::value || is_any_numeric<Type>::value) constexpr
	This&	max_r(const Type& obj) {
		switch (m_type) {
		case df::types::null:
			return *this;
        case df::types::short_type:
            m_short->max_r(obj);
            return *this;
		case df::types::integer:
			m_int->max_r(obj);
			return *this;
		case df::types::floating:
			m_float->max_r(obj);
			return *this;
		case df::types::df:
			for (auto& i: *m_vals) {
				i.max_r(obj);
			}
			return *this;
		default: break;
		}
		throw TypeError(to_str(
			"Function \"",
			__FUNCTION__,
			"()\" is not supported for type \"",
			df::strtype(m_type),
			"\" and a numeric."));
	}
	
	// Max of dataframe.
    /*  @docs
        @title: max
        @description:
            Get the maximum value of a dataframe.
            
            Will throw a `TypeError` when the type is not `vlib::df::types::df`.
        @return:
            Returns an integer or floating `DataFrame` with the minimum value of the dataframe array.
        @usage:
            vlib::DataFrame x = {1, 2, 3};
            vlib::DataFrame y = x.max(); y ==> 3
    */
	constexpr
	This	max() const {
		expect_df(__FUNCTION__);
		switch (m_dim) {
		case 1: {
			if (m_vals->len() == 0) { return DataFrame(); }
			DataFrame* val = &m_vals->get(0);
			for (auto& i: *m_vals) {
				if ((i > *val).asb()) {
					val = &i;
				}
			}
			return *val;
		}
		case 2: {
			if (m_vals->len() == 0) { return DataFrame(); }
			DataFrame val = m_vals->get(0).max();
			for (auto& row: *m_vals) {
				val.max_r(row.max());
			}
			return val;
		}
		default:
			throw DimensionError(to_str(
				"Function \"",
				__FUNCTION__,
				"\" is not supported for a dataframe with a dimension of \"",
				m_dim,
				"\"."));
		}
	}
    constexpr
    This    rolling_max(const LLong& window) const {
        expect_df(__FUNCTION__);
        DataFrame rolling;
        rolling.init(df::types::df);
        rolling.resize(m_vals->len());
        rolling.len() = m_vals->len();
        ullong min_index = window.value() - 1;
        switch (m_dim) {
        case 1: {
            if (m_vals->len() == 0) { return DataFrame(); }
            for (auto& index: m_vals->indexes()) {
                if (index >= min_index) {
                    DataFrame val = m_vals->get(index - window.value() + 1);
                    for (auto& lookback: Range(index - window.value() + 2, index + 1)) {
                        if (m_vals->get(lookback) > val) {
                            val = m_vals->get(lookback);
                        }
                    }
                    rolling.m_vals->get(index) = val;
                }
            }
            return rolling;
        }
        case 2: {
            if (m_vals->len() == 0) { return DataFrame(); }
            for (auto& index: m_vals->indexes()) {
                if (index >= min_index) {
                    rolling.m_vals->get(index) = m_vals->get(index).max(window);
                }
            }
            return rolling;
        }
        default:
            throw DimensionError(to_str(
                "Function \"",
                __FUNCTION__,
                "\" is not supported for a dataframe with a dimension of \"",
                m_dim,
                "\"."));
        }
    }
    constexpr
    This    slice_max(const LLong& start_index, const LLong& end_index) const {
        expect_df(__FUNCTION__);
        switch (m_dim) {
        case 1: {
            if (m_vals->len() == 0) { return DataFrame(); }
            DataFrame val = m_vals->get(start_index.value());
            for (auto& index: Range(start_index.value() + 1, end_index.value())) {
                if (m_vals->get(index) > val) {
                    val = m_vals->get(index);
                }
            }
            return val;
        }
        case 2: {
            if (m_vals->len() == 0) { return DataFrame(); }
            DataFrame val;
            for (auto& row: *m_vals) {
                DataFrame row_min = row.slice_max(start_index, end_index);
                if (val.isn() || row_min > val) {
                    val = row_min;
                }
            }
            return val;
        }
        default:
            throw DimensionError(to_str(
                "Function \"",
                __FUNCTION__,
                "\" is not supported for a dataframe with a dimension of \"",
                m_dim,
                "\"."));
        }
    }
	
	// Absolute value.
    /*  @docs
        @title: Absolute
        @description:
            Get as absolute value.
     
            Function `abs_r` will update the current object.
            
            Will throw a `TypeError` when the type is `vlib::df::types::str`.
        @return:
            Function `abs` returns a new `DataFrame` object while function `abs_r` updates the current object and returns a reference to the current object.
        @usage:
            vlib::DataFrame x = -10;
            vlib::DataFrame y = x.abs(); y ==> 10
        @funcs: 2
    */
	constexpr
	This	abs() const {
		return copy().abs_r();
	}
	constexpr
	This&	abs_r() {
		switch (m_type) {
		case df::types::null:
		case df::types::boolean:
			return *this;
        case df::types::short_type: {
            m_short->abs_r();
            return *this;
        }
		case df::types::integer: {
			m_int->abs_r();
			return *this;
		}
		case df::types::floating: {
			m_float->abs_r();
			return *this;
		}
		case df::types::df: {
			for (auto& i: *m_vals) {
				i.abs_r();
			}
			return *this;
		}
		default: break;
		}
		throw TypeError(to_str(
			"Function \"",
			__FUNCTION__,
			"()\" is not supported for type \"",
			df::strtype(m_type),
			"\"."));
	}
	
	// Add.
    /*  @docs
        @title: Add
        @description:
            Add a numeric value to the dataframe value.
     
            Function `add_r` will update the current object.
            
            Will throw a `TypeError` when the type is `vlib::df::types::str`.
        @return:
            Function `add` returns a new `DataFrame` object while function `add_r` updates the current object and returns a reference to the current object.
        @usage:
            vlib::DataFrame x = 10;
            vlib::DataFrame y = x.add(5); y ==> 15
        @funcs: 3
    */
	template <typename Type> requires (is_DataFrame_h<Type>() || is_any_Numeric<Type>::value || is_any_numeric<Type>::value) constexpr
	This	add(const Type& obj) const {
		return copy().add_r(obj);
	}
    constexpr
    This&    add_r(const This& obj) {
        DF_MATH_OP(add_h, obj);
    }
    template <typename Type> requires (is_any_Numeric<Type>::value || is_any_numeric<Type>::value) constexpr
    This&    add_r(const Type& obj) {
        DF_MATH_OP_WITH_NON_DF(add_h<Type>, obj);
    }
	SICE
	void	add_h(This& obj, const This& x) {
		switch (obj.m_type) {
		case df::types::null:
			return ;
        case df::types::short_type:
            switch (x.m_type) {
            case df::types::null:
                obj.reset();
                return ;
            case df::types::short_type:
                *obj.m_short += *x.m_short;
                return ;
            case df::types::integer:
                *obj.m_short += *x.m_int;
                return ;
            case df::types::floating:
                *obj.m_short += *x.m_float;
                return ;
            }
            break;
		case df::types::integer:
			switch (x.m_type) {
			case df::types::null:
				obj.reset();
				return ;
            case df::types::short_type:
                *obj.m_int += *x.m_short;
                return ;
			case df::types::integer:
				*obj.m_int += *x.m_int;
				return ;
			case df::types::floating:
				*obj.m_int += *x.m_float;
				return ;
			}
			break;
		case df::types::floating:
			switch (x.m_type) {
			case df::types::null:
				obj.reset();
				return ;
            case df::types::short_type:
                *obj.m_float += *x.m_short;
                return ;
			case df::types::integer:
				*obj.m_float += *x.m_int;
				return ;
			case df::types::floating:
				*obj.m_float += *x.m_float;
				return ;
			}
			break;
		}
		throw TypeError(to_str(
			"Function \"",
			__FUNCTION__,
			"()\" is not supported for types \"",
			df::strtype(obj.m_type),
			"\" and \"",
			df::strtype(x.m_type),
			"\"."));
	}
	template <typename Type> requires (is_any_Numeric<Type>::value || is_any_numeric<Type>::value) SICE
	void	add_h(This& obj, const Type& x) {
		switch (obj.m_type) {
		case df::types::null:
			return ;
        case df::types::short_type:
            *obj.m_short += x;
            return ;
		case df::types::integer:
			*obj.m_int += x;
			return ;
		case df::types::floating:
			*obj.m_float += x;
			return ;
		}
		throw TypeError(to_str(
			"Function \"",
			__FUNCTION__,
			"()\" is not supported for type \"",
			df::strtype(obj.m_type),
			"\"."));
	}
	
	// Subtract.
    /*  @docs
        @title: Sub
        @description:
            Subtract a numeric value from the dataframe value.
     
            Function `sub_r` will update the current object.
            
            Will throw a `TypeError` when the type is `vlib::df::types::str`.
        @return:
            Function `sub` returns a new `DataFrame` object while function `sub_r` updates the current object and returns a reference to the current object.
        @usage:
            vlib::DataFrame x = 10;
            vlib::DataFrame y = x.sub(5); y ==> 5
        @funcs: 3
    */
	template <typename Type> requires (is_DataFrame_h<Type>() || is_any_Numeric<Type>::value || is_any_numeric<Type>::value) constexpr
	This	sub(const Type& obj) const {
		return copy().sub_r(obj);
	}
	template <typename Type> requires (is_any_Numeric<Type>::value || is_any_numeric<Type>::value) constexpr
	This&	sub_r(const Type& obj) {
        DF_MATH_OP_WITH_NON_DF(sub_h<Type>, obj);
	}
    template <typename Type> requires (is_DataFrame_h<Type>()) constexpr
    This&    sub_r(const Type& obj) {
        switch (m_type) {
            case df::types::null:
            case df::types::short_type:
                switch (obj.m_type) {
                    case df::types::df: {
                        DataFrame x;
                        x.init(df::types::df);
                        x.resize(obj.len());
                        x.len() = obj.len();
                        ullong index = 0;
                        for (auto& val: *obj.m_vals) {
                            x[index] = *m_short - val;
                            ++index;
                        }
                        return swap(x);
                    }
                    default:
                        sub_h<Type>(*this, obj);
                        return *this;
                }
            case df::types::integer:
                switch (obj.m_type) {
                    case df::types::df: {
                        DataFrame x;
                        x.init(df::types::df);
                        x.resize(obj.len());
                        x.len() = obj.len();
                        ullong index = 0;
                        for (auto& val: *obj.m_vals) {
                            x[index] = *m_int - val;
                            ++index;
                        }
                        return swap(x);
                    }
                    default:
                        sub_h<Type>(*this, obj);
                        return *this;
                }
            case df::types::floating:
                switch (obj.m_type) {
                    case df::types::df: {
                        DataFrame x;
                        x.init(df::types::df);
                        x.resize(obj.len());
                        x.len() = obj.len();
                        ullong index = 0;
                        for (auto& val: *obj.m_vals) {
                            x[index] = *m_float - val;
                            ++index;
                        }
                        return swap(x);
                    }
                    default:
                        sub_h<Type>(*this, obj);
                        return *this;
                }
            case df::types::df:
                // math_iter_h(sub_h<Type>, obj);
                DF_MATH_ITER(sub_h<Type>, obj);
                return *this;
            default: break;
        }
        throw TypeError(to_str(
            "Function \"",
            __FUNCTION__,
            "()\" is not supported for type \"",
            df::strtype(m_type), "\"."));
    }
	template <typename Type> requires (is_DataFrame_h<Type>()) SICE
	void	sub_h(This& obj, const Type& x) {
		switch (obj.m_type) {
            case df::types::null:
                return ;
            case df::types::short_type:
                switch (x.m_type) {
                    case df::types::null:
                        obj.reset();
                        return ;
                    case df::types::short_type:
                        *obj.m_short -= *x.m_short;
                        return ;
                    case df::types::integer:
                        *obj.m_short -= *x.m_int;
                        return ;
                    case df::types::floating:
                        *obj.m_short -= *x.m_float;
                        return ;
                    }
                break;
            case df::types::integer:
                switch (x.m_type) {
                    case df::types::null:
                        obj.reset();
                        return ;
                    case df::types::short_type:
                        *obj.m_int -= *x.m_short;
                        return ;
                    case df::types::integer:
                        *obj.m_int -= *x.m_int;
                        return ;
                    case df::types::floating:
                        *obj.m_int -= *x.m_float;
                        return ;
                    }
                break;
            case df::types::floating:
                switch (x.m_type) {
                    case df::types::null:
                        obj.reset();
                        return ;
                    case df::types::short_type:
                        *obj.m_float -= *x.m_short;
                        return ;
                    case df::types::integer:
                        *obj.m_float -= *x.m_int;
                        return ;
                    case df::types::floating:
                        *obj.m_float -= *x.m_float;
                        return ;
                    }
                break;
		}
		throw TypeError(to_str(
			"Function \"",
			__FUNCTION__,
			"()\" is not supported for types \"",
			df::strtype(obj.m_type),
			"\" and \"",
			df::strtype(x.m_type),
			"\"."));
	}
	template <typename Type> requires (is_any_Numeric<Type>::value || is_any_numeric<Type>::value) SICE
	void	sub_h(This& obj, const Type& x) {
		switch (obj.m_type) {
		case df::types::null:
			return ;
        case df::types::short_type:
            *obj.m_short -= x;
            return ;
		case df::types::integer:
			*obj.m_int -= x;
			return ;
		case df::types::floating:
			*obj.m_float -= x;
			return ;
		}
		throw TypeError(to_str(
			"Function \"",
			__FUNCTION__,
			"()\" is not supported for type \"",
			df::strtype(obj.m_type),
			"\"."));
	}
	
	// Multiply.
    /*  @docs
        @title: Multiply
        @description:
            Multiply the dataframe value with a numeric value.
     
            Function `mult_r` will update the current object.
            
            Will throw a `TypeError` when the type is `vlib::df::types::str`.
        @return:
            Function `mult` returns a new `DataFrame` object while function `mult_r` updates the current object and returns a reference to the current object.
        @usage:
            vlib::DataFrame x = 10;
            vlib::DataFrame y = x.mult(2); y ==> 20
        @funcs: 3
    */
	template <typename Type> requires (is_DataFrame_h<Type>() || is_any_Numeric<Type>::value || is_any_numeric<Type>::value) constexpr
	This	mult(const Type& obj) const {
		return copy().mult_r(obj);
	}
	constexpr
	This&	mult_r(const This& obj) {
        DF_MATH_OP(mult_h, obj);
	}
    template <typename Type> requires (is_any_Numeric<Type>::value || is_any_numeric<Type>::value) constexpr
    This&    mult_r(const Type& obj) {
        DF_MATH_OP_WITH_NON_DF(mult_h<Type>, obj);
    }
	SICE
	void	mult_h(This& obj, const This& x) {
		switch (obj.m_type) {
		case df::types::null:
			return ;
        case df::types::short_type:
            switch (x.m_type) {
            case df::types::null:
                obj.reset();
                return ;
            case df::types::short_type:
                *obj.m_short *= *x.m_short;
                return ;
            case df::types::integer:
                *obj.m_short *= *x.m_int;
                return ;
            case df::types::floating:
                *obj.m_short *= *x.m_float;
                return ;
            }
            break;
		case df::types::integer:
			switch (x.m_type) {
			case df::types::null:
				obj.reset();
				return ;
            case df::types::short_type:
                *obj.m_int *= *x.m_short;
                return ;
			case df::types::integer:
				*obj.m_int *= *x.m_int;
				return ;
			case df::types::floating:
				*obj.m_int *= *x.m_float;
				return ;
			}
			break;
		case df::types::floating:
			switch (x.m_type) {
			case df::types::null:
				obj.reset();
				return ;
            case df::types::short_type:
                *obj.m_float *= *x.m_short;
                return ;
			case df::types::integer:
				*obj.m_float *= *x.m_int;
				return ;
			case df::types::floating:
				*obj.m_float *= *x.m_float;
				return ;
			}
			break;
		}
		throw TypeError(to_str(
			"Function \"",
			__FUNCTION__,
			"()\" is not supported for types \"",
			df::strtype(obj.m_type),
			"\" and \"",
			df::strtype(x.m_type),
			"\"."));
	}
	template <typename Type> requires (is_any_Numeric<Type>::value || is_any_numeric<Type>::value) SICE
	void	mult_h(This& obj, const Type& x) {
		switch (obj.m_type) {
		case df::types::null:
			return ;
        case df::types::short_type:
            *obj.m_short *= x;
            return ;
		case df::types::integer:
			*obj.m_int *= x;
			return ;
		case df::types::floating:
			*obj.m_float *= x;
			return ;
		}
		throw TypeError(to_str(
			"Function \"",
			__FUNCTION__,
			"()\" is not supported for type \"",
			df::strtype(obj.m_type),
			"\"."));
	}
	
	// Divide.
    /*  @docs
        @title: Divide
        @description:
            Divide the dataframe value by a numeric value.
     
            Function `div_r` will update the current object.
            
            Will throw a `TypeError` when the type is `vlib::df::types::str`.
        @return:
            Function `div` returns a new `DataFrame` object while function `div_r` updates the current object and returns a reference to the current object.
        @usage:
            vlib::DataFrame x = 10;
            vlib::DataFrame y = x.div(2); y ==> 5
        @funcs: 3
    */
	template <typename Type> requires (is_DataFrame_h<Type>() || is_any_Numeric<Type>::value || is_any_numeric<Type>::value) constexpr
	This	div(const Type& obj) const {
		return copy().div_r(obj);
	}
	template <typename Type> requires (is_any_Numeric<Type>::value || is_any_numeric<Type>::value) constexpr
	This&	div_r(const Type& obj) {
        DF_MATH_OP_WITH_NON_DF(div_h<Type>, obj);
	}
    template <typename Type> requires (is_DataFrame_h<Type>()) constexpr
    This&    div_r(const Type& obj) {
        switch (m_type) {
            case df::types::null:
            case df::types::short_type:
                switch (obj.m_type) {
                    case df::types::df: {
                        DataFrame x;
                        x.init(df::types::df);
                        x.resize(obj.len());
                        x.len() = obj.len();
                        ullong index = 0;
                        for (auto& val: *obj.m_vals) {
                            x[index] = *m_short / val;
                            ++index;
                        }
                        return swap(x);
                    }
                    default:
                        div_h<Type>(*this, obj);
                        return *this;
                }
            case df::types::integer:
                switch (obj.m_type) {
                    case df::types::df: {
                        DataFrame x;
                        x.init(df::types::df);
                        x.resize(obj.len());
                        x.len() = obj.len();
                        ullong index = 0;
                        for (auto& val: *obj.m_vals) {
                            x[index] = *m_int / val;
                            ++index;
                        }
                        return swap(x);
                    }
                    default:
                        div_h<Type>(*this, obj);
                        return *this;
                }
            case df::types::floating:
                switch (obj.m_type) {
                    case df::types::df: {
                        DataFrame x;
                        x.init(df::types::df);
                        x.resize(obj.len());
                        x.len() = obj.len();
                        ullong index = 0;
                        for (auto& val: *obj.m_vals) {
                            x[index] = *m_float / val;
                            ++index;
                        }
                        return swap(x);
                    }
                    default:
                        div_h<Type>(*this, obj);
                        return *this;
                }
            case df::types::df:
                // math_iter_h(div_h<Type>, obj);
                DF_MATH_ITER(div_h<Type>, obj);
                return *this;
            default: break;
        }
        throw TypeError(to_str(
            "Function \"",
            __FUNCTION__,
            "()\" is not supported for type \"",
            df::strtype(m_type), "\"."));
    }
	template <typename Type> requires (is_DataFrame_h<Type>()) SICE
	void	div_h(This& obj, const Type& x) {
		switch (obj.m_type) {
		case df::types::null:
			return ;
        case df::types::short_type:
            switch (x.m_type) {
            case df::types::null:
                obj.reset();
                return ;
            case df::types::short_type:
                *obj.m_short /= *x.m_short;
                return ;
            case df::types::integer:
                *obj.m_short /= *x.m_int;
                return ;
            case df::types::floating:
                *obj.m_short /= *x.m_float;
                return ;
            }
            break;
		case df::types::integer:
			switch (x.m_type) {
			case df::types::null:
				obj.reset();
				return ;
            case df::types::short_type:
                *obj.m_int /= *x.m_short;
                return ;
			case df::types::integer:
				*obj.m_int /= *x.m_int;
				return ;
			case df::types::floating:
				*obj.m_int /= *x.m_float;
				return ;
			}
			break;
		case df::types::floating:
			switch (x.m_type) {
			case df::types::null:
				obj.reset();
				return ;
            case df::types::short_type:
                *obj.m_float /= *x.m_short;
                return ;
			case df::types::integer:
				*obj.m_float /= *x.m_int;
				return ;
			case df::types::floating:
				*obj.m_float /= *x.m_float;
				return ;
			}
			break;
		}
		throw TypeError(to_str(
			"Function \"",
			__FUNCTION__,
			"()\" is not supported for types \"",
			df::strtype(obj.m_type),
			"\" and \"",
			df::strtype(x.m_type),
			"\"."));
	}
	template <typename Type> requires (is_any_Numeric<Type>::value || is_any_numeric<Type>::value) SICE
	void	div_h(This& obj, const Type& x) {
		switch (obj.m_type) {
		case df::types::null:
			return ;
        case df::types::short_type:
            *obj.m_short /= x;
            return ;
		case df::types::integer:
			*obj.m_int /= x;
			return ;
		case df::types::floating:
			*obj.m_float /= x;
			return ;
		}
		throw TypeError(to_str(
			"Function \"",
			__FUNCTION__,
			"()\" is not supported for type \"",
			df::strtype(obj.m_type),
			"\"."));
	}
	
	// Modulo.
    /*  @docs
        @title: Modulo
        @description:
            Calculate the modulo of the dataframe value divded by a numeric value.
     
            Function `mod_r` will update the current object.
            
            Will throw a `TypeError` when the type is `vlib::df::types::str`.
        @return:
            Function `mod` returns a new `DataFrame` object while function `mod_r` updates the current object and returns a reference to the current object.
        @usage:
            vlib::DataFrame x = 10;
            vlib::DataFrame y = x.mod(3); y ==> 1
        @funcs: 3
    */
	template <typename Type> requires (is_DataFrame_h<Type>() || is_any_Numeric<Type>::value || is_any_numeric<Type>::value) constexpr
	This	mod(const Type& obj) const {
		return copy().mod_r(obj);
	}
	constexpr
	This&	mod_r(const This& obj) {
        DF_MATH_OP(mod_h, obj);
	}
    template <typename Type> requires (is_any_Numeric<Type>::value || is_any_numeric<Type>::value) constexpr
    This&    mod_r(const Type& obj) {
        DF_MATH_OP_WITH_NON_DF(mod_h<Type>, obj);
    }
	SICE
	void	mod_h(This& obj, const This& x) {
		switch (obj.m_type) {
            case df::types::null:
                return ;
            case df::types::short_type:
                switch (x.m_type) {
                    case df::types::null:
                        obj.reset();
                        return ;
                    case df::types::short_type:
                        *obj.m_short %= *x.m_short;
                        return ;
                    case df::types::integer:
                        *obj.m_short %= *x.m_int;
                        return ;
                }
                break;
            case df::types::integer:
                switch (x.m_type) {
                    case df::types::null:
                        obj.reset();
                        return ;
                    case df::types::short_type:
                        *obj.m_int %= *x.m_short;
                        return ;
                    case df::types::integer:
                        *obj.m_int %= *x.m_int;
                        return ;
                }
                break;
		}
		throw TypeError(to_str(
			"Function \"",
			__FUNCTION__,
			"()\" is not supported for types \"",
			df::strtype(obj.m_type),
			"\" and \"",
			df::strtype(x.m_type),
			"\"."));
	}
	template <typename Type> requires (is_any_Numeric<Type>::value || is_any_numeric<Type>::value) SICE
	void	mod_h(This& obj, const Type& x) {
		switch (obj.m_type) {
            case df::types::null:
                return ;
            case df::types::short_type:
                *obj.m_short %= x;
                break;
            case df::types::integer:
                *obj.m_int %= x;
                break;
            }
		throw TypeError(to_str(
			"Function \"",
			__FUNCTION__,
			"()\" is not supported for type \"",
			df::strtype(obj.m_type),
			"\"."));
	}
	
	// Power of.
    /*  @docs
        @title: Power of
        @description:
            Calculate the value of the dataframe to the power of a numeric value.
     
            Function `pow_r` will update the current object.
            
            Will throw a `TypeError` when the type is `vlib::df::types::str`.
        @return:
            Function `pow` returns a new `DataFrame` object while function `pow_r` updates the current object and returns a reference to the current object.
        @usage:
            vlib::DataFrame x = 10;
            vlib::DataFrame y = x.pow(3); y ==> 1000
        @funcs: 3
    */
	template <typename Type> requires (is_DataFrame_h<Type>() || is_any_Numeric<Type>::value || is_any_numeric<Type>::value) constexpr
	This	pow(const Type& obj) const {
		return copy().pow_r(obj);
	}
	constexpr
	This&	pow_r(const This& obj) {
        DF_MATH_OP(pow_h, obj);
	}
    template <typename Type> requires (is_any_Numeric<Type>::value || is_any_numeric<Type>::value) constexpr
    This&    pow_r(const Type& obj) {
        DF_MATH_OP_WITH_NON_DF(pow_h<Type>, obj);
    }
	SICE
	void	pow_h(This& obj, const This& x) {
		switch (obj.m_type) {
            case df::types::null:
                return ;
            case df::types::short_type:
                switch (x.m_type) {
                    case df::types::null:
                        obj.reset();
                        return ;
                    case df::types::short_type:
                        obj.m_short->pow_r(*x.m_short);
                        return ;
                    case df::types::integer:
                        obj.m_short->pow_r(*x.m_int);
                        return ;
                    case df::types::floating:
                        obj.m_short->pow_r(*x.m_float);
                        return ;
                }
                break;
            case df::types::integer:
                switch (x.m_type) {
                    case df::types::null:
                        obj.reset();
                        return ;
                    case df::types::short_type:
                        obj.m_int->pow_r(*x.m_short);
                        return ;
                    case df::types::integer:
                        obj.m_int->pow_r(*x.m_int);
                        return ;
                    case df::types::floating:
                        obj.m_int->pow_r(*x.m_float);
                        return ;
                }
                break;
            case df::types::floating:
                switch (x.m_type) {
                    case df::types::null:
                        obj.reset();
                        return ;
                    case df::types::short_type:
                        obj.m_float->pow_r(*x.m_short);
                        return ;
                    case df::types::integer:
                        obj.m_float->pow_r(*x.m_int);
                        return ;
                    case df::types::floating:
                        obj.m_float->pow_r(*x.m_float);
                        return ;
                }
                break;
            }
            throw TypeError(to_str(
                "Function \"",
                __FUNCTION__,
                "()\" is not supported for types \"",
                df::strtype(obj.m_type),
                "\" and \"",
                df::strtype(x.m_type),
                "\"."));
	}
	template <typename Type> requires (is_any_Numeric<Type>::value || is_any_numeric<Type>::value) SICE
	void	pow_h(This& obj, const Type& x) {
		switch (obj.m_type) {
            case df::types::null:
                return ;
            case df::types::short_type:
                obj.m_short->pow_r(x);
                return ;
            case df::types::integer:
                obj.m_int->pow_r(x);
                return ;
            case df::types::floating:
                obj.m_float->pow_r(x);
                return ;
		}
		throw TypeError(to_str(
			"Function \"",
			__FUNCTION__,
			"()\" is not supported for type \"",
			df::strtype(obj.m_type),
			"\"."));
	}
	
	// Square root.
    /*  @docs
        @title: Square root
        @description:
            Calculate the square root of the dataframe value.
     
            Function `sqrt_r` will update the current object.
            
            Will throw a `TypeError` when the type is `vlib::df::types::str`.
        @return:
            Function `sqrt` returns a new `DataFrame` object while function `sqrt_r` updates the current object and returns a reference to the current object.
        @usage:
            vlib::DataFrame x = 16;
            vlib::DataFrame y = x.sqrt(); y ==> 4
        @funcs: 2
    */
	constexpr
	This	sqrt() const {
		return copy().sqrt_r();
	}
	constexpr
	This&	sqrt_r() {
		switch (m_type) {
            case df::types::null:
                return *this;
            case df::types::short_type:
                m_short->sqrt_r();
                return *this;
            case df::types::integer:
                m_int->sqrt_r();
                return *this;
            case df::types::floating:
                m_float->sqrt_r();
                return *this;
            case df::types::df:
                expect_1d(__FUNCTION__);
                for (auto& i: *m_vals) {
                    i.sqrt_r();
                }
                return *this;
            default: break;
		}
		throw TypeError(to_str(
			"Function \"",
			__FUNCTION__,
			"()\" is not supported for type \"",
			df::strtype(m_type), "\"."));
	}
	
	// Sum.
    /*  @docs
        @title: Sum
        @description:
            Calculate the sum of the dataframe values.
            
            Will throw a `TypeError` when the type is not `vlib::df::types::df`.
            Will throw a `DimensionError` when the dataframe is not 1D.
        @return:
            Returns a `DataFrame` with type `vlib::df::types::integer` or `vlib::df::types::floating` with the sum as value.
        @usage:
            vlib::DataFrame x = {1, 1, 1};
            vlib::DataFrame y = x.sum(); y ==> 3
    */
	constexpr
	This	sum() {
		expect_1d(__FUNCTION__);
		DataFrame summed;
		for (auto& i: *m_vals) {
			switch (i.m_type) {
			case df::types::null:
				continue;
			default:
				summed.init(i.m_type);
				break;
			}
			break;
		}
		for (auto& i: *m_vals) {
			switch (i.m_type) {
			case df::types::null:
				continue;
			default:
				add_h(summed, i);
				continue;
			}
		}
		return summed;
	}
    /*  @docs
        @title: Sum
        @description:
            Calculate the sum of the dataframe values over a defined window.
            
            Will throw a `TypeError` when the type is not `vlib::df::types::df`.
            Will throw a `DimensionError` when the dataframe is not 1D.
        @notes:
            Values that can't apply a full window will have type `vlib::df::types::null`.
        @return:
            Returns a `DataFrame` with type `vlib::df::types::df` with the sum over the defined window as values.
        @parameter
            @name: window
            @description: The window of the operation.
        @usage:
            vlib::DataFrame x = {1, 1, 1};
            vlib::DataFrame y = x.sum(2); y ==> {null, 2, 2}
    */
    constexpr
    This    sum(const Len& window) {
        return sum(window.value());
    }
	constexpr
	This	sum(ullong window) {
		expect_1d(__FUNCTION__);
		DataFrame df;
		df.init(df::types::df);
		df.resize(m_vals->len());
		df.len() = m_vals->len();
		ullong window_index = window - 1;
		for (auto& index0: m_vals->indexes()) {
			if (index0 >= window_index) {
				auto& val = df.m_vals->get(index0);
				val = m_vals->get(index0);
				for (ullong index1 = index0 - window + 1; index1 < index0; ++index1) {
					add_h(val, m_vals->get(index1));
				}
			}
		}
		return df;
	}
	
	// Mean.
	constexpr
	This	mean() {
		return sum().div_r(len());
	}
	constexpr
	This	mean(const Len& window) {
		return sum(window).div_r(window);
	}
    constexpr
    This    mean(ullong window) {
        return sum(window).div_r(window);
    }
	
	// Moving average.
    /*  @docs
        @title: Moving average
        @description:
            Calculate the moving average of the dataframe values.
            
            Will throw a `TypeError` when the type is not `vlib::df::types::df`.
            Will throw a `DimensionError` when the dataframe is not 1D.
        @return:
            Returns a `DataFrame` with type `vlib::df::types::integer` or `vlib::df::types::floating` with the moving average as value.
        @usage:
            vlib::DataFrame x = {1.00, 0.23, 0.98};
            vlib::DataFrame y = x.ma(); y ==> 0.736667
    */
	constexpr
	This	ma() {
		return sum().div_r(len());
	}
    /*  @docs
        @title: Moving average
        @description:
            Calculate the moving average of the dataframe values over a defined window.
            
            Will throw a `TypeError` when the type is not `vlib::df::types::df`.
            Will throw a `DimensionError` when the dataframe is not 1D.
        @notes:
            Values that can't apply a full window will have type `vlib::df::types::null`.
        @return:
            Returns a `DataFrame` with type `vlib::df::types::df` with the moving average over the defined window as values.
        @parameter
            @name: window
            @description: The window of the operation.
        @usage:
            vlib::DataFrame x = {1.00, 0.23, 0.98};
            vlib::DataFrame y = x.ma(); y ==> {null, 0.615000, 0.605000}
    */
    constexpr
    This    ma(const Len& window) {
        return sum(window).div_r(window);
    }
	constexpr
	This	ma(ullong window) {
		return sum(window).div_r(window);
	}
	
	// Exponentional moving average.
    /*  @docs
        @title: Exponentional moving average
        @description:
            Calculate the exponential moving average of the dataframe values.
            
            The value used for smoothing is `2`.
     
            Will throw a `TypeError` when the type is not `vlib::df::types::df`.
            Will throw a `DimensionError` when the dataframe is not 1D.
        @usage:
            vlib::DataFrame x = {1.00, 0.23, 0.98};
            vlib::DataFrame y = x.ema(); y ==> 0.797500
    */
    // @TODO not sure if this is correct.
	constexpr
	This	ema() {
		return ema(len()).last();
	}
    /*  @docs
        @title: Exponential moving average
        @description:
            Calculate the exponential moving average of the dataframe values over a defined window.
     
            The value used for smoothing is `2`.
            
            Will throw a `TypeError` when the type is not `vlib::df::types::df`.
            Will throw a `DimensionError` when the dataframe is not 1D.
        @parameter:
            @name: window
            @description: The window of the operation.
        @usage:
            vlib::DataFrame x = {1.00, 0.23, 0.98};
            vlib::DataFrame y = x.ema(2); y ==> {1.00, 0.486667, 0.815556}
    */
    // @TODO not sure correct and not sure what to with the values that should opt be null, when the value index is below the window-1.
    constexpr
    This    ema(const Len& window) {
        return ema(window, 2.0 / ((float) window.value() + 1.0));
    }
    constexpr
    This    ema(const Len& window, const Double& alpha) {
        return ema(window.value(), alpha.value());
    }
	constexpr
	This	ema(ullong window) {
		return ema(window, 2.0 / ((float) window + 1.0));
	}
	constexpr
	This	ema(ullong window, const ldouble& alpha) {
		expect_1d(__FUNCTION__);
		DataFrame ema;
		ema.init(vlib::df::types::df);
		ema.resize(m_vals->len());
		ema.len() = m_vals->len();
        
        for (auto& index: m_vals->indexes()) {
            if (window > index) { continue; }
            ema.get(index) = ema_slice(index - window + 1, index + 1, alpha);
        }
        /*
		for (auto& index: m_vals->indexes()) {
			DataFrame& val = ema.m_vals->get(index);
			switch (prev->m_type) {
			case vlib::df::types::null:
				val = m_vals->get(index);
				prev = &val;
				continue;
			default:
				val = m_vals->get(index).mult(alpha) + prev->mult(prev_alpha);
				prev = &val;
				continue;
			}
		}
         */
        
		// for (auto& index: vlib::Range<ullong>(0, window)) {
		// 	ema.m_vals->get(index).reset();
		// }
		return ema;
		
		/*
		expect_1d(__FUNCTION__);
		ullong min_index = window - 1;
		bool edited = false;
		ldouble prev_alpha = 1.0 - alpha;
		DataFrame ema, *prev = nullptr;
		ema.init(df::types::df);
		ema.resize(m_vals->len());
		ema.len() = m_vals->len();
		for (auto& index: m_vals->indexes()) {
			if (index > min_index) {
				DataFrame& val = ema.m_vals->get(index);
				val = m_vals->get(index).mult(alpha) + prev->mult(prev_alpha);
				prev = &val;
			}
			else if (index == min_index) {
				DataFrame& i = m_vals->get(index);
				switch (i.m_type) {
				case df::types::null:
					++min_index;
					edited = true;
					continue;
				default:
					if (!edited) {
						DataFrame& val = ema.m_vals->get(index);
						val = i;
						prev = &val;
					} else {
						min_index = index + (window - 1);
						edited = false;
					}
					continue;
				}
			}
		}
		return ema;
		*/
	}
    constexpr
    This    ema_slice(ullong start, ullong end, const ldouble& alpha) {
        expect_1d(__FUNCTION__);
        ldouble prev_alpha = 1.0 - alpha;
        DataFrame null_df;
        DataFrame* prev = &null_df;
        DataFrame ema;
        for (auto& index: m_vals->indexes(start, end)) {
            switch (prev->m_type) {
                case vlib::df::types::null:
                    ema = m_vals->get(index);
                    prev = &ema;
                    continue;
                default:
                    ema = m_vals->get(index).mult(alpha) + prev->mult(prev_alpha);
                    prev = &ema;
                    continue;
            }
        }
        return ema;
    }
	
	// Weighted moving average.
    /*  @docs
        @title: Weighted moving average
        @description:
            Calculate the weighted moving average of the dataframe values.
            
            Will throw a `TypeError` when the type is not `vlib::df::types::df`.
            Will throw a `DimensionError` when the dataframe is not 1D.
        @return:
            Returns a `DataFrame` with type `vlib::df::types::integer` or `vlib::df::types::floating` with the weighted moving average as value.
        @usage:
            vlib::DataFrame x = {1.00, 0.23, 0.98};
            vlib::DataFrame y = x.wma(); y ==> 0.733333
    */
	constexpr
	This	wma() {
		expect_1d(__FUNCTION__);
		DataFrame wma;
		wma.init(df::types::floating);
		DataFrame step = 1.0 / ((m_vals->len() * (m_vals->len() + 1)) / 2);
		DataFrame denom = step;
		for (auto& i: *m_vals) {
			switch (i.m_type) {
                case df::types::short_type:
                    wma += i.m_short->as<Float>() * denom;
                    denom += step;
                    continue;
                case df::types::integer:
                    wma += i.m_int->as<Float>() * denom;
                    denom += step;
                    continue;
                case df::types::floating:
                    wma += i * denom;
                    denom += step;
                    continue;
                default:
                    break;
			}
		}
		return wma;
	}
    /*  @docs
        @title: Weighted moving average
        @description:
            Calculate the weighted moving average of the dataframe values over a defined window.
            
            Will throw a `TypeError` when the type is not `vlib::df::types::df`.
            Will throw a `DimensionError` when the dataframe is not 1D.
        @notes:
            Values that can't apply a full window will have type `vlib::df::types::null`.
        @return:
            Returns a `DataFrame` with type `vlib::df::types::df` with the weighted moving average over the defined window as values.
        @parameter:
            @name: window
            @description: The window of the operation.
        @usage:
            vlib::DataFrame x = {1.00, 0.23, 0.98};
            vlib::DataFrame y = x.wma(); y ==> {null, 0.486667, 0.730000}
    */
    constexpr
    This    wma(const Len& window) {
        return wma(window.value());
    }
	constexpr
	This	wma(ullong window) {
		expect_1d(__FUNCTION__);
		DataFrame df;
		df.init(df::types::df);
		df.resize(m_vals->len());
		df.len() = m_vals->len();
		DataFrame step = 1.0 / ((window * (window + 1)) / 2);
		DataFrame denom;
		ullong window_minus = window - 1;
		for (auto& index0: m_vals->indexes()) {
			if (index0 >= window_minus) {
				DataFrame& wma = df.m_vals->get(index0);
				wma.init(df::types::floating);
				denom = step;
				for (auto& index1: Range(index0 - window_minus, index0 + 1)) {
					DataFrame& val = m_vals->get(index1);
					switch (val.m_type) {
                        case df::types::short_type:
                            wma += val.m_short->as<Float>() * denom;
                            denom += step;
                            continue;
                        case df::types::integer:
                            wma += val.m_int->as<Float>() * denom;
                            denom += step;
                            continue;
                        case df::types::floating:
                            wma += val * denom;
                            denom += step;
                            continue;
                        default:
                            break;
					}
				}
			}
		}
		return df;
	}
	
	// Difference.
	/*  @docs
		@title: Difference
		@description:
			Calculate the difference between the current and previous value.
			
			Will throw a `TypeError` when the type is not `vlib::df::types::df`.
			Will throw a `DimensionError` when the dataframe is not 1D.
		@return:
			Returns a `DataFrame` with type `vlib::df::types::df`.
		@usage:
			vlib::DataFrame x = {1.00, 1.5, 3.0};
			vlib::DataFrame y = x.diff(); y ==> {null, 0.5, 1.5}
	*/
	constexpr
	This	diff() {
		expect_1d(__FUNCTION__);
		DataFrame diff;
		diff.init(df::types::df);
		diff.resize(m_vals->len());
		diff.len() = m_vals->len();
		for (auto& index: m_vals->indexes()) {
			if (index != 0) {
				diff[index] = m_vals->get(index) - m_vals->get(index - 1);
			}
		}
		return diff;
	}
	
	// Difference.
	/*  @docs
		@title: Percent change
		@description:
			Calculate the difference between the current and previous value.
			
			Will throw a `TypeError` when the type is not `vlib::df::types::df`.
			Will throw a `DimensionError` when the dataframe is not 1D.
		@return:
			Returns a `DataFrame` with type `vlib::df::types::df`.
		@usage:
			vlib::DataFrame x = {1.00, 1.5, 3.0};
			vlib::DataFrame y = x.diff(); y ==> {null, 0.5, 1.5}
	*/
	constexpr
	This	pct_change() {
		expect_1d(__FUNCTION__);
		DataFrame old = shift(1);
		return min(old).div_r(old).mult_r(100.0);
	}
	
	// Standard deviation.
	/*  @docs
		@title: Standard deviation
		@description:
			Calculate the standard deviation.
			
			Will throw a `TypeError` when the type is not `vlib::df::types::df`.
			Will throw a `DimensionError` when the dataframe is not 1D.
		@return:
			Returns a `DataFrame` with type `vlib::df::types::integer` or `vlib::df::types::floating` with the standard deviation as value.
		@usage:
			vlib::DataFrame x = {1.00, 0.23, 0.98};
			vlib::DataFrame y = x.ma(); y ==> 0.736667
	*/
	constexpr
	This	std() {
		expect_1d(__FUNCTION__);
		DataFrame val, mean;
		val = 0.0;
		mean = ma();
		for (auto& i: *m_vals) {
			val += (i - mean).abs_r().pow_r(2.0);
		}
		return val.div_r(m_vals->len() - 1).sqrt_r();
	}
	/*  @docs
		@title: Standard deviation
		@description:
			Calculate the standard deviation.
			
			Will throw a `TypeError` when the type is not `vlib::df::types::df`.
			Will throw a `DimensionError` when the dataframe is not 1D.
		@return:
			Returns a `DataFrame` with type `vlib::df::types::df`.
		@parameter:
			@name: window
			@description: The window of the operation.
		@usage:
			vlib::DataFrame x = {1.00, 0.23, 0.98};
			vlib::DataFrame y = x.ma(); y ==> 0.736667
	*/
	// Source: https://www.programiz.com/cpp-programming/examples/standard-deviation.
	constexpr
	This	std(const Len& window) {
        return std(window.value());
	}
    constexpr
    This    std(ullong window) {
        expect_1d(__FUNCTION__);
        DataFrame std;
        std.init(df::types::df);
        std.resize(m_vals->len());
        std.len() = m_vals->len();
        ullong min_index = window - 1;
        DataFrame val, mean;
        for (auto& index: indexes()) {
            if (index >= min_index) {
                val = 0.0;
                mean = 0.0;
                for (auto& windex: Range(index - min_index, index + 1)) {
                    mean += m_vals->get(windex);
                }
                mean.div_r(window);
                for (auto& windex: Range(index - min_index, index + 1)) {
                    val += (m_vals->get(windex) - mean).abs_r().pow_r(2.0);
                }
                std[index] = val.div_r(window - 1).sqrt_r();
            }
        }
        return std;
    }
		
	// ---------------------------------------------------------
	// Operators.
	
	// Check if undefined.
	constexpr friend
	bool	operator ==(const This& obj, const Null&) {
		return obj.m_type == df::types::null;
	}
	constexpr friend
	bool	operator !=(const This& obj, const Null&) {
		return obj.m_type != df::types::null;
	}
	
	// Cast to bool.
	constexpr explicit
	operator bool() const {
		switch (m_type) {
		case df::types::boolean:
			return *m_bool;
		default:
			throw TypeError(to_str(
				"Function \"",
				__FUNCTION__,
				"()\" is not supported for type \"",
				df::strtype(m_type),
				"\"."));
		}
	}
    
    // Operator !.
    constexpr
    This    operator !() {
        switch (m_type) {
            case df::types::null:
                return DataFrame();
            case df::types::boolean:
                return !m_bool;
            case df::types::df: {
                DataFrame df;
                df.init(df::types::df, m_dim);
                df.resize(m_vals->len());
                df.len() = m_vals->len();
                ullong index = 0;
                switch (m_dim) {
                    case 1: {
                        for (auto& val: *m_vals) {
                            df[index] = !val;
                            ++index;
                        }
                        return df;
                    }
                    case 2: {
                        for (auto& val: *m_vals) {
                            df[index] = !val;
                            ++index;
                        }
                        return df;
                    }
                    default:
                        throw DimensionError(to_str("Unsupported dimension of \"", m_dim, "\"."));
                }
            }
        }
        throw TypeError(to_str(
            "Function \"",
            __FUNCTION__,
            "()\" is not supported for type \"",
            df::strtype(m_type),
            "\"."));
    }
	
	// Or.
	/*  @docs
		@title: Or
		@description:
			Or for a boolean type or dataframe type with boolean children.
	 
			Will throw a `TypeError` when both types are not the same.
			Will throw a `TypeError` if the type's are not either `vlib::df::types::boolean` or `vlib::df::types::df`.
			Will throw a `DimensionError` when the type is `vlib::df::types::df` and the dimension is not 1D.
	*/
	constexpr friend
	This	operator |(const DataFrame& x, const DataFrame& y) {
		switch (x.m_type) {
            case df::types::boolean:
                switch (y.m_type) {
                    case df::types::boolean:
                        return x.asb() || y.asb();
                    case df::types::df: {
                        y.expect_1d(__FUNCTION__);
                        DataFrame z;
                        z.init(df::types::df);
                        z.resize(y.m_vals->len());
                        z.len() = y.m_vals->len();
                        for (auto& index: y.m_vals->indexes()) {
                            if (x.asb() || y.m_vals->get(index).asb()) {
                                z.m_vals->get(index) = true;
                            } else {
                                z.m_vals->get(index) = false;
                            }
                        }
                        return z;
                    }
                    default:
                        break;
                    }
                break;
            case df::types::df:
                x.expect_1d(__FUNCTION__);
                switch (y.m_type) {
                    case df::types::df: {
                        if (x.m_vals->len() != y.m_vals->len()) {
                            throw ShapeError(to_str("Function \"", __FUNCTION__, "\" does not support different dataframe lengths."));
                        }
                        DataFrame z;
                        z.init(df::types::df);
                        z.resize(x.m_vals->len());
                        z.len() = x.m_vals->len();
                        for (auto& index: x.m_vals->indexes()) {
                            if (x.m_vals->get(index).asb() || y.m_vals->get(index).asb()) {
                                z.m_vals->get(index) = true;
                            } else {
                                z.m_vals->get(index) = false;
                            }
                        }
                        return z;
                    }
                    default:
                        break;
                }
                break;
            default: break;
		}
		throw TypeError(to_str(
			"Function \"",
			__FUNCTION__,
			"()\" is not supported for type \"",
			df::strtype(x.m_type),
			"\" and type \"",
			df::strtype(y.m_type),
			"\"."));
	}
	
	// And.
	/*  @docs
		@title: And
		@description:
			And for a boolean type or dataframe type with boolean children.
	 
			Will throw a `TypeError` when both types are not the same.
			Will throw a `TypeError` if the type's are not either `vlib::df::types::boolean` or `vlib::df::types::df`.
			Will throw a `DimensionError` when the type is `vlib::df::types::df` and the dimension is not 1D.
	*/
	constexpr friend
	This	operator &(const DataFrame& x, const DataFrame& y) {
		switch (x.m_type) {
            case df::types::boolean:
                switch (y.m_type) {
                    case df::types::boolean:
                        return x.asb() && y.asb();
                    case df::types::df: {
                        y.expect_1d(__FUNCTION__);
                        DataFrame z;
                        z.init(df::types::df);
                        z.resize(y.m_vals->len());
                        z.len() = y.m_vals->len();
                        for (auto& index: y.m_vals->indexes()) {
                            if (x.asb() && y.m_vals->get(index).asb()) {
                                z.m_vals->get(index) = true;
                            } else {
                                z.m_vals->get(index) = false;
                            }
                        }
                    }
                    default:
                        break;
                }
                break;
            case df::types::df:
                x.expect_1d(__FUNCTION__);
                switch (y.m_type) {
                    case df::types::df: {
                        y.expect_1d(__FUNCTION__);
                        if (x.m_vals->len() != y.m_vals->len()) {
                            throw ShapeError(to_str("Function \"", __FUNCTION__, "\" does not support different dataframe lengths [", x.m_vals->len(), " & ", y.m_vals->len(), "]."));
                        }
                        DataFrame z;
                        z.init(df::types::df);
                        z.resize(x.m_vals->len());
                        z.len() = x.m_vals->len();
                        for (auto& index: x.m_vals->indexes()) {
                            if (x.m_vals->get(index).asb() && y.m_vals->get(index).asb()) {
                                z.m_vals->get(index) = true;
                            } else {
                                z.m_vals->get(index) = false;
                            }
                        }
                        return z;
                    }
                    default:
                        break;
                }
                break;
            default: break;
		}
		throw TypeError(to_str(
			"Function \"",
			__FUNCTION__,
			"()\" is not supported for type \"",
			df::strtype(x.m_type),
			"\" and type \"",
			df::strtype(y.m_type),
			"\"."));
	}
	
	// Equals operator.
	constexpr friend
	This	operator ==(const This& obj, const This& x) {
		switch (obj.m_type) {
		case df::types::df: {
			obj.expect_df(__FUNCTION__);
			DataFrame eq;
			eq.init(df::types::df);
			eq.resize(obj.m_vals->len());
			eq.len() = obj.m_vals->len();
			switch (x.m_type) {
			case df::types::df:
				x.expect_df(__FUNCTION__);
				if (obj.m_vals->len() != x.m_vals->len()) {
					throw ShapeError(to_str("Function \"", __FUNCTION__, "\" does not support different dataframe lengths."));
				}
				for (auto& index: obj.m_vals->indexes()) {
					eq.m_vals->get(index) = obj.m_vals->get(index) == x.m_vals->get(index);
				}
			default:
				for (auto& index: obj.m_vals->indexes()) {
					eq.m_vals->get(index) = obj.m_vals->get(index) == x;
				}
			}
			return eq;
		}
		default:
			switch (x.m_type) {
			case df::types::df:
				return operator ==(x, obj);
			default:
				return obj.eq(x);
			}
		}
	}
	constexpr friend
	This	operator !=(const This& obj, const This& x) {
		switch (obj.m_type) {
		case df::types::df: {
			obj.expect_df(__FUNCTION__);
			DataFrame eq;
			eq.init(df::types::df);
			eq.resize(obj.m_vals->len());
			eq.len() = obj.m_vals->len();
			switch (x.m_type) {
			case df::types::df:
				x.expect_df(__FUNCTION__);
				if (obj.m_vals->len() != x.m_vals->len()) {
					throw ShapeError(to_str("Function \"", __FUNCTION__, "\" does not support different dataframe lengths."));
				}
				for (auto& index: obj.m_vals->indexes()) {
					eq.m_vals->get(index) = obj.m_vals->get(index) != x.m_vals->get(index);
				}
			default:
				for (auto& index: obj.m_vals->indexes()) {
					eq.m_vals->get(index) = obj.m_vals->get(index) != x;
				}
			}
			return eq;
		}
		default:
			switch (x.m_type) {
			case df::types::df:
				return operator !=(x, obj);
			default:
				return !obj.eq(x);
			}
		}
	}
	
	// Greater and lower.
	constexpr friend
	This	operator >(const This& obj, const This& x) {
		switch (obj.m_type) {
            case df::types::null:
                switch (x.m_type) {
                    case df::types::null:
                    case df::types::boolean:
                    case df::types::short_type:
                    case df::types::integer:
                    case df::types::floating:
                    case df::types::str:
                        return false;
                    case df::types::df:
                        return DataFrame().init(df::types::df).fill(x.m_vals->len(), false);
                    default:
                        break;
                }
                break;
            case df::types::boolean:
                switch (x.m_type) {
                    case df::types::null:
                        return false;
                    case df::types::boolean:
                        return (int) obj.m_bool->value() > (int) x.m_bool->value();
                    case df::types::short_type:
                        return (Short::value_type) obj.m_bool->value() > (Short::value_type) x.m_short->value();
                    case df::types::integer:
                        return (Int::value_type) obj.m_bool->value() > (Int::value_type) x.m_int->value();
                    case df::types::floating:
                        return (Float::value_type) obj.m_bool->value() > (Float::value_type) x.m_float->value();
                    default:
                        break;
                }
                break;
            case df::types::short_type:
                switch (x.m_type) {
                    case df::types::null:
                        return false;
                    case df::types::boolean:
                        return obj.m_short->greater((short) x.m_bool->value());
                    case df::types::short_type:
                        return obj.m_short->greater(*x.m_short);
                    case df::types::integer:
                        return obj.m_short->greater(*x.m_int);
                    case df::types::floating:
                        return obj.m_short->greater(*x.m_float);
                    case df::types::df: {
                        x.expect_1d(__FUNCTION__);
                        DataFrame df;
                        df.init(df::types::df);
                        df.resize(x.m_vals->len());
                        df.len() = x.m_vals->len();
                        for (auto& index: x.m_vals->indexes()) {
                            df.m_vals->get(index) = obj > x.get(index);
                        }
                        return df;
                    }
                    default:
                        break;
                }
                break;
            case df::types::integer:
                switch (x.m_type) {
                    case df::types::null:
                        return false;
                    case df::types::boolean:
                        return obj.m_int->greater((int) x.m_bool->value());
                    case df::types::short_type:
                        return obj.m_int->greater(*x.m_short);
                    case df::types::integer:
                        return obj.m_int->greater(*x.m_int);
                    case df::types::floating:
                        return obj.m_int->greater(*x.m_float);
                    case df::types::df: {
                        x.expect_1d(__FUNCTION__);
                        DataFrame df;
                        df.init(df::types::df);
                        df.resize(x.m_vals->len());
                        df.len() = x.m_vals->len();
                        for (auto& index: x.m_vals->indexes()) {
                            df.m_vals->get(index) = obj > x.get(index);
                        }
                        return df;
                    }
                    default:
                        break;
                }
                break;
            case df::types::floating:
                switch (x.m_type) {
                    case df::types::null:
                        return false;
                    case df::types::boolean:
                        return obj.m_float->greater((int) x.m_bool->value());
                    case df::types::short_type:
                        return obj.m_float->greater(*x.m_short);
                    case df::types::integer:
                        return obj.m_float->greater(*x.m_int);
                    case df::types::floating:
                        return obj.m_float->greater(*x.m_float);
                    case df::types::df: {
                        x.expect_1d(__FUNCTION__);
                        DataFrame df;
                        df.init(df::types::df);
                        df.resize(x.m_vals->len());
                        df.len() = x.m_vals->len();
                        for (auto& index: x.m_vals->indexes()) {
                            df.m_vals->get(index) = obj > x.get(index);
                        }
                        return df;
                    }
                    default:
                        break;
                }
                break;
            case df::types::df: {
                obj.expect_1d(__FUNCTION__);
                DataFrame df;
                df.init(df::types::df);
                df.resize(obj.m_vals->len());
                df.len() = obj.m_vals->len();
                switch (x.m_type) {
                    case df::types::df:
                        x.expect_1d(__FUNCTION__);
                        for (auto& index: obj.m_vals->indexes()) {
                            df.m_vals->get(index) = obj.m_vals->get(index) > x.m_vals->get(index);
                        }
                        return df;
                    default:
                        for (auto& index: obj.m_vals->indexes()) {
                            df.m_vals->get(index) = obj.m_vals->get(index) > x;
                        }
                        return df;
                }
                break;
            }
		}
		throw TypeError(to_str(
			"Function \"",
			__FUNCTION__,
			"()\" is not supported for type \"",
			df::strtype(obj.m_type),
			"\" and type \"",
			df::strtype(x.m_type),
			"\"."));
	}
	constexpr friend
	This	operator >=(const This& obj, const This& x) {
		switch (obj.m_type) {
            case df::types::null:
                switch (x.m_type) {
                    case df::types::null:
                    case df::types::boolean:
                    case df::types::short_type:
                    case df::types::integer:
                    case df::types::floating:
                    case df::types::str:
                        return false;
                    case df::types::df:
                        return DataFrame().init(df::types::df).fill(x.m_vals->len(), false);
                    default:
                        break;
                }
                break;
            case df::types::boolean:
                switch (x.m_type) {
                    case df::types::null:
                        return false;
                    case df::types::boolean:
                        return (int) obj.m_bool->value() >= (int) x.m_bool->value();
                    case df::types::short_type:
                        return (Short::value_type) obj.m_bool->value() >= (Short::value_type) x.m_short->value();
                    case df::types::integer:
                        return (Int::value_type) obj.m_bool->value() >= (Int::value_type) x.m_int->value();
                    case df::types::floating:
                        return (Float::value_type) obj.m_bool->value() >= (Float::value_type) x.m_float->value();
                    default:
                        break;
                }
                break;
            case df::types::short_type:
                switch (x.m_type) {
                    case df::types::null:
                        return false;
                    case df::types::boolean:
                        return obj.m_short->greater_eq((short) x.m_bool->value());
                    case df::types::short_type:
                        return obj.m_short->greater_eq(*x.m_short);
                    case df::types::integer:
                        return obj.m_short->greater_eq(*x.m_int);
                    case df::types::floating:
                        return obj.m_short->greater_eq(*x.m_float);
                    case df::types::df: {
                        x.expect_1d(__FUNCTION__);
                        DataFrame df;
                        df.init(df::types::df);
                        df.resize(x.m_vals->len());
                        df.len() = x.m_vals->len();
                        for (auto& index: x.m_vals->indexes()) {
                            df.m_vals->get(index) = obj >= x.get(index);
                        }
                        return df;
                    }
                    default:
                        break;
                }
                break;
            case df::types::integer:
                switch (x.m_type) {
                    case df::types::null:
                        return false;
                    case df::types::boolean:
                        return obj.m_int->greater_eq((int) x.m_bool->value());
                    case df::types::short_type:
                        return obj.m_int->greater_eq(*x.m_short);
                    case df::types::integer:
                        return obj.m_int->greater_eq(*x.m_int);
                    case df::types::floating:
                        return obj.m_int->greater_eq(*x.m_float);
                    case df::types::df: {
                        x.expect_1d(__FUNCTION__);
                        DataFrame df;
                        df.init(df::types::df);
                        df.resize(x.m_vals->len());
                        df.len() = x.m_vals->len();
                        for (auto& index: x.m_vals->indexes()) {
                            df.m_vals->get(index) = obj >= x.get(index);
                        }
                        return df;
                    }
                    default:
                        break;
                }
                break;
            case df::types::floating:
                switch (x.m_type) {
                    case df::types::null:
                        return false;
                    case df::types::boolean:
                        return obj.m_float->greater((int) x.m_bool->value());
                    case df::types::short_type:
                        return obj.m_float->greater_eq(*x.m_short);
                    case df::types::integer:
                        return obj.m_float->greater_eq(*x.m_int);
                    case df::types::floating:
                        return obj.m_float->greater_eq(*x.m_float);
                    case df::types::df: {
                        x.expect_1d(__FUNCTION__);
                        DataFrame df;
                        df.init(df::types::df);
                        df.resize(x.m_vals->len());
                        df.len() = x.m_vals->len();
                        for (auto& index: x.m_vals->indexes()) {
                            df.m_vals->get(index) = obj >= x.get(index);
                        }
                        return df;
                    }
                    default:
                        break;
                }
                break;
            case df::types::df: {
                obj.expect_1d(__FUNCTION__);
                DataFrame df;
                df.init(df::types::df);
                df.resize(obj.m_vals->len());
                df.len() = obj.m_vals->len();
                switch (x.m_type) {
                case df::types::df:
                    x.expect_1d(__FUNCTION__);
                    for (auto& index: obj.m_vals->indexes()) {
                        df.m_vals->get(index) = obj.m_vals->get(index) >= x.m_vals->get(index);
                    }
                    return df;
                default:
                    for (auto& index: obj.m_vals->indexes()) {
                        df.m_vals->get(index) = obj.m_vals->get(index) >= x;
                    }
                    return df;
                }
                break;
            }
		}
		throw TypeError(to_str(
			"Function \"",
			__FUNCTION__,
			"()\" is not supported for type \"",
			df::strtype(obj.m_type),
			"\" and type \"",
			df::strtype(x.m_type),
			"\"."));
	}
	constexpr friend
	This	operator <(const This& obj, const This& x) {
		switch (obj.m_type) {
            case df::types::null:
                switch (x.m_type) {
                    case df::types::null:
                    case df::types::boolean:
                    case df::types::short_type:
                    case df::types::integer:
                    case df::types::floating:
                    case df::types::str:
                        return false;
                    case df::types::df:
                        return DataFrame().init(df::types::df).fill(x.m_vals->len(), false);
                    default:
                        break;
                }
                break;
            case df::types::boolean:
                switch (x.m_type) {
                    case df::types::null:
                        return false;
                    case df::types::boolean:
                        return (int) obj.m_bool->value() < (int) x.m_bool->value();
                    case df::types::short_type:
                        return (Short::value_type) obj.m_bool->value() < (Short::value_type) x.m_short->value();
                    case df::types::integer:
                        return (Int::value_type) obj.m_bool->value() < (Int::value_type) x.m_int->value();
                    case df::types::floating:
                        return (Float::value_type) obj.m_bool->value() < (Float::value_type) x.m_float->value();
                    default:
                        break;
                }
                break;
            case df::types::short_type:
                switch (x.m_type) {
                    case df::types::null:
                        return false;
                    case df::types::boolean:
                        return obj.m_short->less((short) x.m_bool->value());
                    case df::types::short_type:
                        return obj.m_short->less(*x.m_short);
                    case df::types::integer:
                        return obj.m_short->less(*x.m_int);
                    case df::types::floating:
                        return obj.m_short->less(*x.m_float);
                    case df::types::df: {
                        x.expect_1d(__FUNCTION__);
                        DataFrame df;
                        df.init(df::types::df);
                        df.resize(x.m_vals->len());
                        df.len() = x.m_vals->len();
                        for (auto& index: x.m_vals->indexes()) {
                            df.m_vals->get(index) = obj < x.get(index);
                        }
                        return df;
                    }
                    default:
                        break;
                }
                break;
            case df::types::integer:
                switch (x.m_type) {
                    case df::types::null:
                        return false;
                    case df::types::boolean:
                        return obj.m_int->less((int) x.m_bool->value());
                    case df::types::short_type:
                        return obj.m_int->less(*x.m_short);
                    case df::types::integer:
                        return obj.m_int->less(*x.m_int);
                    case df::types::floating:
                        return obj.m_int->less(*x.m_float);
                    case df::types::df: {
                        x.expect_1d(__FUNCTION__);
                        DataFrame df;
                        df.init(df::types::df);
                        df.resize(x.m_vals->len());
                        df.len() = x.m_vals->len();
                        for (auto& index: x.m_vals->indexes()) {
                            df.m_vals->get(index) = obj < x.get(index);
                        }
                        return df;
                    }
                    default:
                        break;
                }
                break;
            case df::types::floating:
                switch (x.m_type) {
                    case df::types::null:
                        return false;
                    case df::types::boolean:
                        return obj.m_float->less((int) x.m_bool->value());
                    case df::types::short_type:
                        return obj.m_float->less(*x.m_short);
                    case df::types::integer:
                        return obj.m_float->less(*x.m_int);
                    case df::types::floating:
                        return obj.m_float->less(*x.m_float);
                    case df::types::df: {
                        x.expect_1d(__FUNCTION__);
                        DataFrame df;
                        df.init(df::types::df);
                        df.resize(x.m_vals->len());
                        df.len() = x.m_vals->len();
                        for (auto& index: x.m_vals->indexes()) {
                            df.m_vals->get(index) = obj < x.get(index);
                        }
                        return df;
                    }
                    default:
                        break;
                }
                break;
            case df::types::df: {
                obj.expect_1d(__FUNCTION__);
                DataFrame df;
                df.init(df::types::df);
                df.resize(obj.m_vals->len());
                df.len() = obj.m_vals->len();
                switch (x.m_type) {
                case df::types::df:
                    x.expect_1d(__FUNCTION__);
                    for (auto& index: obj.m_vals->indexes()) {
                        df.m_vals->get(index) = obj.m_vals->get(index) < x.m_vals->get(index);
                    }
                    return df;
                default:
                    for (auto& index: obj.m_vals->indexes()) {
                        df.m_vals->get(index) = obj.m_vals->get(index) < x;
                    }
                    return df;
                }
                break;
            }
		}
		throw TypeError(to_str(
			"Function \"",
			__FUNCTION__,
			"()\" is not supported for type \"",
			df::strtype(obj.m_type),
			"\" and type \"",
			df::strtype(x.m_type),
			"\"."));
	}
	constexpr friend
	This	operator <=(const This& obj, const This& x) {
		switch (obj.m_type) {
            case df::types::null:
                switch (x.m_type) {
                    case df::types::null:
                    case df::types::short_type:
                    case df::types::integer:
                    case df::types::floating:
                    case df::types::str:
                        return false;
                    case df::types::df:
                        return DataFrame().init(df::types::df).fill(x.m_vals->len(), false);
                    default:
                        break;
                }
                break;
            case df::types::boolean:
                switch (x.m_type) {
                    case df::types::null:
                        return false;
                    case df::types::boolean:
                        return (int) obj.m_bool->value() <= (int) x.m_bool->value();
                    case df::types::short_type:
                        return (Short::value_type) obj.m_bool->value() <= (Short::value_type) x.m_short->value();
                    case df::types::integer:
                        return (Int::value_type) obj.m_bool->value() <= (Int::value_type) x.m_int->value();
                    case df::types::floating:
                        return (Float::value_type) obj.m_bool->value() <= (Float::value_type) x.m_float->value();
                    default:
                        break;
                }
                break;
            case df::types::short_type:
                switch (x.m_type) {
                    case df::types::null:
                        return false;
                    case df::types::boolean:
                        return obj.m_short->less_eq((short) x.m_bool->value());
                    case df::types::short_type:
                        return obj.m_short->less_eq(*x.m_short);
                    case df::types::integer:
                        return obj.m_short->less_eq(*x.m_int);
                    case df::types::floating:
                        return obj.m_short->less_eq(*x.m_float);
                    case df::types::df: {
                        x.expect_1d(__FUNCTION__);
                        DataFrame df;
                        df.init(df::types::df);
                        df.resize(x.m_vals->len());
                        df.len() = x.m_vals->len();
                        for (auto& index: x.m_vals->indexes()) {
                            df.m_vals->get(index) = obj <= x.get(index);
                        }
                        return df;
                    }
                    default:
                        break;
                }
                break;
            case df::types::integer:
                switch (x.m_type) {
                    case df::types::null:
                        return false;
                    case df::types::boolean:
                        return obj.m_int->less_eq((int) x.m_bool->value());
                    case df::types::short_type:
                        return obj.m_int->less_eq(*x.m_short);
                    case df::types::integer:
                        return obj.m_int->less_eq(*x.m_int);
                    case df::types::floating:
                        return obj.m_int->less_eq(*x.m_float);
                    case df::types::df: {
                        x.expect_1d(__FUNCTION__);
                        DataFrame df;
                        df.init(df::types::df);
                        df.resize(x.m_vals->len());
                        df.len() = x.m_vals->len();
                        for (auto& index: x.m_vals->indexes()) {
                            df.m_vals->get(index) = obj <= x.get(index);
                        }
                        return df;
                    }
                    default:
                        break;
                }
                break;
            case df::types::floating:
                switch (x.m_type) {
                    case df::types::null:
                        return false;
                    case df::types::boolean:
                        return obj.m_float->less_eq((int) x.m_bool->value());
                    case df::types::short_type:
                        return obj.m_float->less_eq(*x.m_short);
                    case df::types::integer:
                        return obj.m_float->less_eq(*x.m_int);
                    case df::types::floating:
                        return obj.m_float->less_eq(*x.m_float);
                    case df::types::df: {
                        x.expect_1d(__FUNCTION__);
                        DataFrame df;
                        df.init(df::types::df);
                        df.resize(x.m_vals->len());
                        df.len() = x.m_vals->len();
                        for (auto& index: x.m_vals->indexes()) {
                            df.m_vals->get(index) = obj <= x.get(index);
                        }
                        return df;
                    }
                    default:
                        break;
                }
                break;
            case df::types::df: {
                obj.expect_1d(__FUNCTION__);
                DataFrame df;
                df.init(df::types::df);
                df.resize(obj.m_vals->len());
                df.len() = obj.m_vals->len();
                switch (x.m_type) {
                case df::types::df:
                    x.expect_1d(__FUNCTION__);
                    for (auto& index: obj.m_vals->indexes()) {
                        df.m_vals->get(index) = obj.m_vals->get(index) <= x.m_vals->get(index);
                    }
                    return df;
                default:
                    for (auto& index: obj.m_vals->indexes()) {
                        df.m_vals->get(index) = obj.m_vals->get(index) <= x;
                    }
                    return df;
                }
                break;
            }
		}
		throw TypeError(to_str(
			"Function \"",
			__FUNCTION__,
			"()\" is not supported for type \"",
			df::strtype(obj.m_type),
			"\" and type \"",
			df::strtype(x.m_type),
			"\"."));
	}
	
	// Add operator.
	constexpr friend
	This	operator +(const This& obj, const This& x) { return obj.add(x); }
	constexpr
	This&	operator +=(const This& x) { return add_r(x); }
	//
	template <typename Type> requires (is_any_Numeric<Type>::value || is_any_numeric<Type>::value) constexpr friend
	This	operator +(const This& obj, const Type& x) { return obj.add(x); }
	template <typename Type> requires (is_any_Numeric<Type>::value || is_any_numeric<Type>::value) constexpr
	This&	operator +=(const Type& x) { return add_r(x); }
	
	// Substract operator.
	constexpr friend
	This	operator -(const This& obj, const This& x) { return obj.sub(x); }
	constexpr
	This&	operator -=(const This& x) { return sub_r(x); }
	//
	template <typename Type> requires (is_any_Numeric<Type>::value || is_any_numeric<Type>::value) constexpr friend
	This	operator -(const This& obj, const Type& x) { return obj.sub(x); }
	template <typename Type> requires (is_any_Numeric<Type>::value || is_any_numeric<Type>::value) constexpr
	This&	operator -=(const Type& x) { return sub_r(x); }
	
	// Multiply operator.
	constexpr friend
	This	operator *(const This& obj, const This& x) { return obj.mult(x); }
	constexpr
	This&	operator *=(const This& x) { return mult_r(x); }
	//
	template <typename Type> requires (is_any_Numeric<Type>::value || is_any_numeric<Type>::value) constexpr friend
	This	operator *(const This& obj, const Type& x) { return obj.mult(x); }
	template <typename Type> requires (is_any_Numeric<Type>::value || is_any_numeric<Type>::value) constexpr
	This&	operator *=(const Type& x) { return mult_r(x); }
	
	// Divide operator.
	constexpr friend
	This	operator /(const This& obj, const This& x) { return obj.div(x); }
	constexpr
	This&	operator /=(const This& x) { return div_r(x); }
	//
	template <typename Type> requires (is_any_Numeric<Type>::value || is_any_numeric<Type>::value) constexpr friend
	This	operator /(const This& obj, const Type& x) { return obj.div(x); }
	template <typename Type> requires (is_any_Numeric<Type>::value || is_any_numeric<Type>::value) constexpr
	This&	operator /=(const Type& x) { return div_r(x); }
	
	// Modulo operator.
	constexpr friend
	This	operator %(const This& obj, const This& x) { return obj.mod(x); }
	constexpr
	This&	operator %=(const This& x) { return mod_r(x); }
	//
	template <typename Type> requires (is_any_Numeric<Type>::value || is_any_numeric<Type>::value) constexpr friend
	This	operator %(const This& obj, const Type& x) { return obj.mod(x); }
	template <typename Type> requires (is_any_Numeric<Type>::value || is_any_numeric<Type>::value) constexpr
	This&	operator %=(const Type& x) { return mod_r(x); }
	
	// Power operator.
	// - Not used for bitwise XOR.
	constexpr friend
	This	operator ^(const This& obj, const This& x) { return obj.pow(x); }
	constexpr
	This&	operator ^=(const This& x) { return pow_r(x); }
	//
	template <typename Type> requires (is_any_Numeric<Type>::value || is_any_numeric<Type>::value) constexpr friend
	This	operator ^(const This& obj, const Type& x) { return obj.pow(x); }
	template <typename Type> requires (is_any_Numeric<Type>::value || is_any_numeric<Type>::value) constexpr
	This&	operator ^=(const Type& x) { return pow_r(x); }
	
	// Operator [] with index.
	constexpr
	This&	operator [](ullong index) {
		// expect_df(__FUNCTION__);
		return m_vals->get(index);
	}
	constexpr
	This&	operator [](ullong index) const {
		// expect_df(__FUNCTION__);
		return m_vals->get(index);
	}
	
	// Operator [] with column.
	constexpr
	This&	operator [](const String& column) {
		expect_2d(__FUNCTION__);
		ullong index = m_cols->find(column);
		if (index == NPos::npos) {
			m_cols->append(column);
			m_vals->expand(1);
			++(m_vals->len());
			auto& df = m_vals->last();
			init_new_df_array(df, 1);
			return df;
		} else {
			return m_vals->get(index);
		}
			
	}
	constexpr
	This&	operator [](const String& column) const {
		expect_2d(__FUNCTION__);
		ullong index = m_cols->find(column);
		if (index == NPos::npos) {
			throw KeyError(to_str("Column \"", column, "\" does not exist."));
		} else {
			return m_vals->get(index);
		}
	}
	
	// Dump to pipe.
	constexpr friend
	Pipe&	operator <<(Pipe& pipe, const This& obj) {
		obj.dump(pipe);
		return pipe;
	}
	
};

// ---------------------------------------------------------
// Instances.

// Is type.
template<typename T> 	struct is_DataFrame 						{ SICEBOOL value = false; };
template<> 				struct is_DataFrame<DataFrame> 				{ SICEBOOL value = true;  };

// ---------------------------------------------------------
// Shortcuts.

namespace types { namespace shortcuts {

using DataFrame = vlib::DataFrame;

}; 		// End namespace types.
}; 		// End namespace shortcuts.

// ---------------------------------------------------------
// End.

}; 		// End namespace vlib.
#endif 	// End header.
