//_L3o interpreter

//Please note: this document contains comments from my cat Leo, the namesake of this language.
// The code below may distributed in any way you see fit, provided that Leo's comments 
// are not removed for any reason.

var mem = [0];
var memCap = 256;

var aliases = [];
var aFlag

var ctx;

var r = [];			//0x0000
var rCap = 32;
	
var bracktype = "";
	
var connections = {
	"0" : 0	
};	
var cFlag = 0;
var cPointer = "";
	
var debug = 0;
var temp = 0;		

var tFlag = 0;
var pointer = 0;

var hist = [];

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
	
	// R - General purpose, and output stack. Stores returns and results of operations.
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
	// Literal-parameter - use literal parameters written into the same token:
	//	_0xFFFF	put 0xFFFF into T, and point to it.
	//	#0000	point to a Connection 0000.

	// Parameterized - use P register for single and multiple parameter operations.
	//	_x, >	move to the right x times	
	//	_y,	<	move to the left y times
	//	_x, _y, {+, -, *, /}	arithmetic
	
	// Meta:
	//	@NAME;	alias NAME to whatever address is loaded into P.
	//	@NAME	point to wherever NAME is said to be
	*/
	
	/*var sys = {			//Object.setPrototypeOf(x, sys); to clone system object
		mem : [],
		memCap : 256,
		r : [],
		rCap : 32,
		temp : 0,
		parameters : [],
		i : 0,	
		pointer : 0
	};*/
	
	var i = 0;
	
	while(i < input.length){
		switch(input.charAt(i++)){
			case '>': 
				if(parameters.length > 0){
					while (parameters.length > 0){
						if(pointer+parameters[parameters.length-1] >= mem.length){
							if(mem.length+parameters[parameters.length-1] < memCap){
								while(mem.length-1 < pointer+parameters[parameters.length-1]){
									mem.push(0);
								}
							}
						
							pointer = (pointer+mem.length+parameters.pop()) % memCap; //pointer loops around if it's too big
						
						}
						else {
							pointer += parameters[parameters.length-1];
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
					if(pointer-parameters[parameters.length-1] < 0){
						pointer = (mem.length + ((pointer-parameters.pop())%mem.length)); //Pointer loops around if it's < 0
					}
					else{
						pointer -= parameters.pop();
					}		
				}
				
				parameters =[];	//ALL OF THESE CAN BE REMOVED IF EVERY USE OF PARAMETERIZED COMMANDS USES param.pop()
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
			
			case '^':
				if (Boolean(cFlag)){
					connections["" + cPointer] = r;
					cFlag = 0;
					
					cout("#" + cPointer + " = " + connections[cPointer]);
				}
				else if(Boolean(tFlag)){
					temp = r;/*;p;/
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
				if (parameters.length == 1 && parameters[0] < memCap){
					pointer = parameters[0];
					parameters = [];
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
					r.push(parameters[0]);
					for(j = 1; j < parameters.length; j++){
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
					r.push(parameters[0]);
					for(j = 1; j < parameters.length; j++){	//Same deal as subtraction, NOTE that the stacking behavior of subtraction may be strange
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
					r.push(parameters[0]);
					for(j = 1; j < parameters.length; j++){	//Same deal as subtraction, NOTE that stacking with 
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
					r.push(parameters[0]);
					for(j = 1; j < parameters.length; j++){	//Same deal as subtraction
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
				connections[cPointer] = 0xDECAF123;
				i = j;
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
						debug = 1;
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
			
			
		default: if(input.charAt(i).match(/\w/)) cout("Unrecognized Command.");	
		}		
	}
	
	if(Boolean(debug)){
		printMem();
		cout("R: " + r + "\tT: " + temp + "\tP: " + parameters + " ");
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