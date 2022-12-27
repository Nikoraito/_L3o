# _L3o
/'lioʊ/

The below, included in l3o.js is the a reference dated 2016.01.25

	Registers:
	 R - General purpose, and output stack. Stores returns and results of operations.
	 T(emp) - Temporary space for literal values, triggered by underscore
	 P(arameter) - Temporary space for whatever parameters are passed. dumped after execution of a parameterized function.
	
	 Single-Character:
		> 	move pointer to the right (index+1)
		<	move pointer to the left (index-1)
		$	pick up the selected value, push it onto R
		!	pick up the selected address, push it onto R
		^	place the current R value at the current address
		M	point to the address which is in R
		,	load the selected value into the parameter stack
		{+,-,*,/,%}	arithmetic:
			+ -> r := (r + selected)
			- -> r := (r - selected)
			/ -> r := (r / selected)
			* -> r := (r * selected)
			% -> r := (r % selected)
	 Literal-parameter - use literal parameters written into the same token:
		_0xFFFF	put 0xFFFF into T, and point to it.
    #0000	point to a Connection 0000. *

	 Parameterized - use P register for single and multiple parameter operations.
		_x, >	move to the right x times	
		_y,	<	move to the left y times
		_x, _y, {+, -, *, /}	arithmetic
	
	 Meta:
		@NAME;	alias NAME to whatever address is loaded into P.
		@NAME	point to wherever NAME is said to be
    
    *Connections are a concept developed for another project; the goal for having created a simple language was to implement it on ingame computers to control ship systems such as weapons and navigation equipment - 'connections' are one element of the system to share data between ship components.
