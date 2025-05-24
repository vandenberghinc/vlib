# Libraries
The directory for nested v libraries.

## Warning
When importing any vlib code always import it through `./index.js`. Otherwise the global imports exteding the primitive classes such as Array String etc might not be imported. Resulting in runtime errors.