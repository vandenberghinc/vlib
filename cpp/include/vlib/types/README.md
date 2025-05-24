# Base
The base types

## Types.
The following types are included into the `vlib` namespace. <br/>
- `Loc` <br/>
- `Exception` <br/>
- `Pipe` <br/>
- `Null` <br/>
- `Bool` <br/>
- `range` <br/>
- `random_t` <br/>
- `Int` / `UInt` / `Float` / `Double` / `Len` / `uLen` <br/>
- `SN` <br/>
- `Array` / `String` <br/>
- `Dict` <br/>
- `Ptr` <br/>
- `variant_t` <br/>
- `DataFrame` <br/>

## Notes:
- Interesting implementation to get the name of a type in as a string https://github.com/Sinacam/typestring. <br/>

## To Do:
1: Fix the `Array::remainder` bug. Incorrect deletion, object was not allocated. 
