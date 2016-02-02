//_L3o interpreter

//Please note: this document contains comments from my cat Leo, the namesake of this language.
// The code below may distributed in any way you see fit, provided that Leo's comments 
// are not removed for any reason.



////////////////////////////////////////////////////////
// LANGUAGE VARIABLES: Part of the interpreter itself //
////////////////////////////////////////////////////////
var mem = [0];		//The general memory allocated to a program and indexable w/ the pointer as an array
var memCap = 256;	//The maximum number of addresses (the array automatically expands when the pointer needs it. Not entirely necessary, but prevents users from trying to access memory in the array they haven't already used.)

var aliases = [];	//The dictionary of variable names to their locations in mem
var aFlag;			//Set to 1 or true when the interpreter detects @, directs flow to the creation of a new alias

var r = [];			//The result stack; stores the results of operations and stuff
var rCap = 32;		//Has a max size as well. Pretty arbitrary in javascript but hey.
	
var bracktype = "";	//Set by 'f', 'w', 'd', 'i' or 'e', and set to one of these, do tell the interpreter what kind of block it's entering when it reaches {curlies}
	
var connections = {	//This is arbitrary atm but is used to communicate between "Systems" which are not modeled in this example, except in limited scope by the scr canvas
	"0" : 0			//Effectively a simple dictionary of variables shared between ingame Systems to allow, for instance, the ship's computer to communicate with the engines, turrets, etc.
};	

var cFlag = 0;		//Set to true when interpreter encounters #; means that the pointer should temporarily switch to one of the connections above. 
var cPointer = "";	//Keeps track of which connection we're pointing to

var temp = 0;		//the T register, briefly stores a number for feeding as parameters into functions, generating literals, etc.

var tFlag = 0;		//Set to 1 when there is a temp variable. Controls the flow.
var pointer = 0;	//Pointer to the current cursor index in mem

////////////////////////////////////////////////////////////////////////
// CONSOLE VARIABLES: Arbitrary functions of the CONSOLE and the page //
////////////////////////////////////////////////////////////////////////

var hist = [];		//SUPPOSED to be the history of commands entered so one can do up/down arrow to use recent commands. NOT working.
var ctx;			//Context for the Canvas.

var debug = 0;		//set to 1 when the `v command is used.

function cin(){
	var input = document.getElementById('c_in').value;
	hist.push(input);
	document.getElementById('c_in').value = "";
	interpret(input.trim());	
}

function showLast(){
	document.getElementById('c_in').value = hist[hist.length-1];
}



function interpret(input){
	var parameters = [];	
	
	/*	Inline reference 2016.01.25
	//Registers:
	
	// R(esult) - General purpose, and output stack. Stores returns and results of operations.
	// T(emp) - Temporary space for literal values, triggered by underscore
	// P(arameter) - Temporary space for whatever parameters are passed. dumped after execution of a parameterized function.
	
	// Single-Character:
	//	> 	move pointer to the right (index+1)
	//	<	move pointer to the left (index-1)
	//	$	pick up the selected value, push it onto R
	//	!	pick up the selected address, push it onto R
	//	^	place the current R value at the current address
	//	M	point to the address which is in R
	//	,	load the selected value into the parameter stack
	//	{+,-,*,/,%}	arithmetic:
	//		+ -> r := (r + selected)
	//		- -> r := (r - selected)
	//		/ -> r := (r / selected)
	//		* -> r := (r * selected)
	//		% -> r := (r % selected)
	
	// Compound commands:
	
	// Coded-parameter - subroutines that use literal parameters written into the same token in code:
	//	_0xFFFF	put 0xFFFF into T, and point to it.
	//	#0000	point to a Connection 0000.
	
	//	@NAME;	alias NAME to whatever address is loaded into P.
	//	@NAME	point to wherever NAME is said to be

	// 	~NAME{} creates a block of code named NAME whose contents are run when it is called. - NOT IMPLEMENTED
	//	~NAME	Runs the named block of code. - NOT IMPLEMENTED
	
	// Value-Parameter - subroutines that use P register for single and multiple parameter operations.
	//	p1, >	move to the right x times	
	//	p1,	<	move to the left y times
	//	p1, p2, {+, -, *, /}	arithmetic
	
	// Macros - 

	*/
	
	var i = 0;
	
	while(i < input.length){
		switch(input.charAt(i++)){
			case '>': 
				if(parameters.length > 0){
					while(parameters.length > 0){
						if(pointer+parameters[0] >= mem.length){
							if(mem.length+parameters[0] < memCap){
								while(mem.length-1 < pointer+parameters[0]){
									mem.push(0);
								}
							}
						
							pointer = (pointer+parameters.shift()) % memCap; //pointer loops around if it's too big
						
						}
						else {
							pointer += parameters.shift();
						}
					}
				}
				else {		//if nothing is being passed to >,
					if(pointer+1>=mem.length){	//and if we exceed our memory,
						if(mem.length+1 >= memCap){//and we have no space to expand,
							pointer = 0;	
						}
						else{
							mem.push(0);
							pointer++;									
						}
					} 

					else {
						pointer++;
					}	
				} 
				break;
				
			case '<': 
				if(parameters.length == 0){
					if(pointer == 0){
						pointer = mem.length-1;
					}
					else {
						pointer--;
					}
				}
				else while (parameters.length > 0){
					if(pointer-parameters[0] < 0){
						pointer = (mem.length + ((pointer-parameters.shift())%mem.length)); //Pointer loops around if it's < 0
					}
					else{
						pointer -= parameters.shift();
					}		
				}
				
				//parameters =[];	//parameters should be empty at this point as all parameters were pushed on and shifted off
				break;
				
			case '$': 
			
				if(Boolean(cFlag)){
					r.push(connections[cPointer]);
					cFlag = 0;
				}
				else if(Boolean(tFlag)){
					r.push(temp);
					temp = 0;
					tFlag = 0;
				}
				else{ 
					r.push(mem[pointer]); 
				}
				break;
			
			case '!': 
				r.push(pointer); 
				break;
			
			case 'r':
				tFlag = 1;
				temp = r.pop();
				break;
				
			case '^':
				if (Boolean(cFlag)){
					connections["" + cPointer] = r;
					cFlag = 0;
					
					cout("#" + cPointer + " = " + connections[cPointer]);
				}
				else if(Boolean(tFlag)){
					mem[pointer] = temp;	
					temp = 0;
					tFlag = 0;		/*;p;/
									]
					
									|||||||||||||||||||||\*/
				} 
				else {
					mem[pointer] = r.pop();
				}			
				
				break;	
			
			case ',':
				if(tFlag){
					parameters.push(temp);
					temp = 0; 
					tFlag = 0;
				}
				else{
					parameters.push(mem[pointer]);
				}
				break;
			
			case 'M':	// Move to the address shown in the parameters
				if (parameters.length == 1 && parameters[0] < memCap && parameters[0] >= 0){
					pointer = parameters.shift();
				}
				else{
					pointer = r.pop();
				}	
				while(pointer >= mem.length){
					mem.push(0);
				}
			
			case '_':
				var j = i;
				tFlag = 1;
				while(input.charAt(j).match(/\w/) && (j) < input.length){
					j++;
				}
				temp = parseInt(input.substring(i, j));
				i = j;
				break;
			
			case '+':
				if(parameters.length > 1){	//If more than one parameter is listed, add them all and store the result in R.
					r.push(parameters.shift());
					while(parameters.length > 0){
						r[r.length-1] += parameters.shift(); //REPLACE WITH r.pop()?
					}

				} 
				else if(parameters.length == 1){	//If only one parameter is added, add it to the current value of R.
					r[r.length-1] += parameters.shift();
				} 
				else {
					r[r.length-1] += mem[pointer]; //Otherwise, add the value at the pointer to R.
				}
				cout(r[r.length-1]);
				break;
			
			case '-':
				if(parameters.length > 1){
					r.push(parameters.shift());
					while(parameters.length > 0){	//Same deal as subtraction, NOTE that the stacking behavior of subtraction may be strange
						r[r.length-1] -= parameters.shift();
					}

				} 
				else if(parameters.length == 1){
					r[r.length-1] -= parameters.shift();

				} 
				else {
					r[r.length-1] -= mem[pointer];
				}
				cout(r[r.length-1]);
				break;
			
			case '/':
				if(parameters.length > 1){
					r.push(parameters.shift());
					while(parameters.length > 0){	
						r[r.length-1] /= parameters.shift();
					}
					
				} 
				else if(parameters.length == 1){
					r[r.length-1] /= parameters.shift();

				} 
				else {
					r[r.length-1] /= mem[pointer];
				}
				cout(r[r.length-1]);
				break;
			case '*':
				if(parameters.length > 1){
					r.push(parameters.shift());
					while(parameters.length > 0){	//Same deal as subtraction
						r[r.length-1] *= parameters.shift();	//replace parameters[j] -> parameters.shift()
					}
				} 
				else if(parameters.length == 1){
					r[r.length-1] *= parameters[0];
					parameters = [];
				} 
				else {
					r[r.length-1] *= mem[pointer];
				}
				cout(r[r.length-1]);
				break;
			
			case '#':
				var j = i;
				cFlag = 1;
				while(input.charAt(j).match(/\w/) && (j) < input.length){
					j++;
				}
				cPointer = "" + parseInt(input.substring(i, j));
				connections[cPointer] = 0xDECAF123;	//Magic number placed on a connection to show that this system is using it.
				i = j;
				break;
				
			case '@':
				var j = i;
				var sub = "";
				
				while(input.charAt(j).match(/\w/) && (j) < input.length){
					j++;
				}
				
				sub = input.substring(i, j);
				
				if(input.charAt(j) == ';'){	//If we have @NAME; , we create a NEW alias which is then added to the list of aliases : addresses
					//gfvtr
					if(parameters.length > 0){
						aliases[sub] = parameters.shift();	//We can name the address with a parameter,
						parameters = [];
					}
					else{
						aliases[sub] = pointer;
					}
					
					i=j+1;	//We return the master interpret() cursor to the whiteSpace after ';'
				}
				else{					
					
					if(sub in aliases) pointer = aliases[sub];	//Otherwise if we just read @NAME, we recognize it as a reference to an existing alias, and try to assign temp to its value
					else cout("Alias " + sub + " is not in aliases[].");
					
					i = j; //We return the interpret() cursor to j, this was if the character is a comma or anything instead, that gets interpreted next. 
				}
				break;
			
			case '`':
				switch(input.charAt(i++)){
					case 'm':
						monitorOn();
						break;
						
					case 's':
						systemOn();
						break;
						
					case 'c':
						putchar();
						break;
					case 'C':
						cout("CLEARING MEMORY");
						mem = [];
						r = [];
						temp = 0;
						pointer = 0;
						parameters = [];					
						break;
					case 'r':
						cout("R: " + r);
						break;
					case 't':
						cout("T: " + temp);
						break;
					case 'p':
						cout("P: " + parameters);
						break;
					case 'v':		
						cout("R: " + r + "\nT: " + temp + "\nP:{");
						for(j = 0; j < parameters.length; j++){
							cout(" " + j + "\t" + parameters[j]);
						}
						cout("}");
						cout("pointer: " + pointer);
						
						printMem();
						
						break;
					case 'd':
						debug = 1 ^ debug; // toggle debugging.
						break;
						
					default: cout("Invalid metacommand.");
					
				} break;
			
			case 'f':
				bracktype = 'f'; break;
			case 'w':
				bracktype = 'w'; break;
			case 'd':
				bracktype = 'd'; break;
			case 'i':
				bracktype = 'i'; break;
			case 'e':
				bracktype = 'e'; break;
			
			case '{': 
				switch(bracktype){
					case 'f': break;
					case 'w': break;
					case 'd': break;
					case 'i': break;
					case 'e': break;
				}
				level++;
				break;
			case '}': 
				level--;
				break;
			
			
			default: if(input.charAt(i).match(/\w/)) cout("Unrecognized Command: " + input.charAt(i));	
		}		
	}
	
	if(Boolean(debug)){
		printMem();
		cout("R: " + r + "\tT: " + temp + "\tP: " + parameters + " ");
		cout("Aliases: {");
		for(n in aliases){
			cout(n + " : " + aliases[n]);
		}
		cout('}');
		cout("Connections: {");
		for(n in connections){
			cout(" #" + decToHex(n) + " : " + decToHex(connections[n]));
		}
		cout('}');
	}
	
}

function cout(text){
	document.getElementById('console').value += text + "\n";
	document.getElementById('console').scrollTop = document.getElementById('console').scrollHeight;
}

function coutnb(text){
	document.getElementById('console').value += text;
}

function printMem(){
	cout("M: " + mem);
	/*for(j = 0; j < (pointer*2)+3; j++){
		coutnb(" ");
	}*/
	cout("addr: " + pointer);
}

function putchar(){
	ctx.font = "10px Courier";
	ctx.fillText(text,8,8);
}

function putstring(text){
	ctx.font = "10px Courier";
	ctx.fillText(text,8,8);
}

function systemOn(){
	setInterval(tick(), 500);
    ctx = document.getElementById("scr").getContext("2d");
	ctx.fillStyle = "#000000";
	ctx.fillRect(0,0,320, 480);	
}

function monitorOn(){
    ctx = document.getElementById("scr").getContext("2d");
	ctx.fillStyle = "#202020";
	ctx.fillRect(0,0,320, 480);
	ctx.fillStyle = "#00FF00";
	ctx.font = "8px Courier";
	setTimeout(putstring("_L3o Monitor Online."), 1000);
	connections['2'] = 0x10101010;
}

function monitorOff(){
	ctx = document.getElementById("scr").getContext("2d");
	ctx.fillStyle = "#101010";
	ctx.fillRect(0,0,320, 480);
	connections['2'] = 0x00000000;
}

function tick(){	//Simulates a simple hardware device that looks at specific connections for input, and reacts based on the input.
	switch(connections[0]){
		case 0xDECAF123:
			cout('Sweet jesus the system has connected to itself.');
			connections['0'] = 0xB00B135;
			break;		
			
		case 0x00010001:		//Unparameterized commands are sent to the SYSTEM not the COMPONENT. the system activates 0x0001 (HIGH) when it receives 0x0001 (LOW)
			monitorOn();
			break;
			
		case 0x000100FF:		//Likewise 0x000100FF means turn #0001 off
			monitorOff();
			break;
		default: break;
	}
}

function decToHex(number)
{
    if (number < 0)
    {
    	number = number >>> 0;
    }

    return number.toString(16).toUpperCase();
}