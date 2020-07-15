// Copyright (c) 2013, Matthew Shelley. All rights reserved.

/*!	namespace
	The ScriptManager is responsible for parsing a new script and running it
	on a frame-by-frame basis until completion. It is a 'top-level scope',
	which actually handles the script once cleaned up (see 'run').
*/
ScriptedPixels.ScriptManager = function()
{
	// Private variables --
	
	/*!	private array
		Array of script lines currently being executed; empty if no script
	*/
	var m_scriptLines = []; // no script to run
	
	
	/*!	private boolean
		A flag indicating if the script has been parsed for execution
	*/
	var m_canExecute = false;
	
	
	/*!	private int
		"Pointer" to the current line
	*/
	var m_currentLineIndex = 0;
	
	
	/*!	private object
		Current command as an object which can be updated on a per-frame basis
	*/
	var m_currentCommand = null;
	
	
	/*!	private object / associative array
		An associative array of label names to the lines (numbers) they refer to
	*/
	var m_labelLines = {};
	
	
	/*!	private object / associative array
		Temporary variables which exist only within the current script
	*/
	var m_tempVars = {};
	
	
	/*!	private function reference
		Function to call when the current script completes.
	*/
	var m_onCompleteCallback = null; // don't do anything
	
	
	// Private functions --
	
	/*!	private function
		Creates a temporary variable
		Params:
			-vartype: type of the type variable
			-varname: name of the variable
			-varvalue [optional]: initial value
		Returns:
			-true: variable was created
			-false: some error occurred
	*/
	var createTempVar = function(vartype, varname, varvalue)
	{
		// Do we have a valid type?
		if (!ScriptedPixels.GameData.validVariableTypes.hasOwnProperty(vartype))
			return false;
			
		// Is the variable name available?
		if (m_tempVars.hasOwnProperty(varname))
			return false;
		
		// Create the variable, which will validate the value		
		m_tempVars[varname] = new ScriptedPixels.GameData.GameVariable(vartype, varvalue);
		return true;
	};
	
	
	/*!	private
		Remove all temporary variables
	*/
	var removeTempVars = function()
	{
		// Delete all variables
		for (varname in this.tempVars)
		{
			if (m_tempVars.hasOwnProperty(varname))
				delete m_tempVars[varname];
		}
		
		// Reset the array - just for safety
		m_tempVars = {};
	};
	
	
	/*! public
		Return reference to variable with its type and value
		Params:
			-varscope: where the variable resides
			-varname: identifier for the variable
		Returns:
			-reference to variable
			-null if the variable does not exist
	*/
	var lookupVariable = function(varscope, varname)
	{
		// Check if the variable exists
		if (varscope == "global" && ScriptedPixels.GameData.globalVariables.hasOwnProperty(varname))
			return ScriptedPixels.GameData.globalVariables[varname];
		else if ((varscope == undefined || varscope == "") && this.tempVars.hasOwnProperty(varname))
			return this.tempVars[varname];

		// Otherwise, return null as no variable was found
		return null;
	};


	/*! function
		Return reference to variable with its type and value using code, if it exists
		e.g. $global.x returns ScriptedPixels.GameData.globalVariables.x
			alternatively, $x returns tempVars.x
		Note that the code provided may not be a variable, in which case null is returned!
		Params:
			-expr: literal representation of a variable in code
		Returns:
			-reference to variable
			-null if the variable does not exist, or the code is not a variable
	*/
	var lookupVariableByExpr = function(expr)
	{
		// Decipher the expression
		var varExprMatches;
		
		if ((varExprMatches = new RegExp("^" + SP_SM_VARIABLE_FORMAT + "$").exec(expr)) != null)
		{
			// Fetch the variable from the expression
			return lookupVariable(varExprMatches[1], varExprMatches[2]);
		}
		
		// Not a variable
		return null;
	};
	
	
	/*!	private
		Given an expression, attempt to initialize a temporary variable
		e.g. Bool $switch
			Bool $switch = true
			Int $x = 5
		Params:
			-expr: expression, which might contain initialization
		Returns:
			-true: temp variable created
			-false: otherwise
	*/
	var evaluateTempVariableInitExpr = function(expr)
	{
		// Initialization
		// (vartype)(varscope)(varname)(varvalue)
		// value is optional and only occurs if = is placed in between
		// note that varscope should be an empty string - but we're checking against the variable format!
		var initRegex = new RegExp("^\\t*(\\S+)\\s*" + SP_SM_VARIABLE_FORMAT + "(?:\\s*=\\s*(.+))?$"); // can be fixed?
		var initMatches;
		
		// Valid assignment format?
		if ((initMatches = initRegex.exec(expr)) == null)
			return false; // the only case which is not an error
		
		// Assign variables from regex for clarity
		var vartype = initMatches[1];
		var varscope = initMatches[2];
		var varname = $.trim(initMatches[3]);
		var varvalue = $.trim(initMatches[4]);
		
		// Providing the varscope is empty, we can attempt to create the variable
		return (varscope == undefined && createTempVar(vartype, varname, varvalue));	
	};
	
	
	/*!	private
		Given an expression, perform assignment.
		This method is called by default through our variable methods
		Params:
			-expr: code which might contain an assginment
		Return:
			-boolean: whether or not the line could be parsed as variable assignment
	*/
	var evaluateVariableAssignmentExpr = function(expr)
	{
		// Assignment (lhsVarExpr)(operator)(rhsExpr)
		var assignRegex = /^\t*(\S+)\s*((?:not|[+\-*\/%])?=)\s*(.+)$/; // accounts for whitespace at start
		var assignMatches;
		
		// Valid assignment format?
		if ((assignMatches = assignRegex.exec(expr)) == null)
			return false; // the only case which is not an error
			
		// Assign variables from regex for clarity
		var lhsVarExpr = assignMatches[1];
		var operator = assignMatches[2];
		var rhsExpr = $.trim(assignMatches[3]);

		// Determine the LHS variable
		var lhsRealVar = lookupVariableByExpr(lhsVarExpr);
		
		if (lhsRealVar == null)
		{
			alert("INVALID LHS VARIABLE: '" + lhsVarExpr + "'");
			return false; // should be an error
		}
		
		// We can only use rhs if the type is the same as lhs!
		var canUseRHS = false;

		// Is the right side a variable?
		var rhsRealVar = lookupVariableByExpr(rhsExpr);
		
		// Ultimately, we want the value of rhs
		var rhsValue;
		
		// If rhs is not a variable, we need to check if it is a legal value for LHS
		if (rhsRealVar == null)
		{
			// Is the value legal?
			if (ScriptedPixels.GameData.validVariableTypes[lhsRealVar.type].valuePattern.test(rhsExpr)) // this method does work for enums :)
			{
				rhsValue = rhsExpr;
				canUseRHS = true;
			}
		}
		else
		{
			// RHS is a variable, but does its type match?
			if (lhsRealVar.type == rhsRealVar.type)
			{
				rhsValue = rhsRealVar.value;
				canUseRHS = true;
			}
		}
		
		// If we cannot use RHS, then we must abort - SHOULD BE AN ERROR
		if (!canUseRHS)
		{
			alert("INVALID RHS VALUE");
			return false; // error
		}
		
		// Return value, so our code is 'acceptable'
		var retval = true; // this way we only handle the fail cases
		
		// Booleans can use both "not=" and "="
		if (lhsRealVar.type == "Bool") // can I avoid the use of "Bool"?
		{
			// What operator do we have?
			switch (operator)
			{
			case "=":
				lhsRealVar.value = rhsValue;
				break;
			case "not=":
				lhsRealVar.value = !rhsValue;
				break;
			default:
				// error should go here!
				alert("INVALID BOOLEAN OPERATOR");
				retval = false;
				break;
			}
		}
		// Integers can use all sorts of operators
		else if (lhsRealVar.type == "Int") // can I avoid the use of "Int"?
		{
			// Convert the string to an actual int - do the same for lhs
			lhsRealVar.value = parseInt(lhsRealVar.value);
			rhsValue = parseInt(rhsValue);
			
			// What operator do we have?
			switch (operator)
			{
			case "=":
				lhsRealVar.value = rhsValue;
				break;
			case "+=":
				lhsRealVar.value += rhsValue;
				break;
			case "-=":
				lhsRealVar.value -= rhsValue;
				break;
			case "*=":
				lhsRealVar.value *= rhsValue;
				break;
			case "/=":
				if (rhsValue == 0)
				{
					alert("CANNOT DIVIDE BY ZERO");
					retval = false;
				}
				else
					lhsRealVar.value /= rhsValue; // rhsValue cannot be 0!
				break;
			case "%=":
				lhsRealVar.value %= rhsValue;
				break;
			default:
				// should be an error here!
				alert("INVALID INT OPERATOR");
				retval = false;
				break;
			}
			
			// Remove any decimal values
			lhsRealVar.value = parseInt(lhsRealVar.value < 0 ? Math.ceil(lhsRealVar.value) : Math.floor(lhsRealVar.value));
			// alternatively, I could round the value?
		}
		// Enums (all other variable types) can only use =
		else
		{
			// If we do not have "=" then we have an error!
			switch (operator)
			{
			case "=":
				lhsRealVar.value = rhsValue;
				break;
			default:
				alert("INVALID ENUM OPERATOR");
				retval = false;
				break;
			}
		}
		
		return retval;
	};
	
	
	/*!	private
		Evaluate a comparison expression
		Params:
			-expr: expression to evaluate
		Returns:
			-boolean: true if the expression equates to true, false otherwise
	*/
	var evaluateComparisonExpr = function(expr)
	{
		// Quick boolean method!
		if (expr == "true")
			return true;
		else if (expr == "false")
			return false;
		
		// Maybe we have a simple boolean expression, e.g.
		// "$boolvar" or "!$boolvar"
		var quickBoolPattern = new RegExp("^(!?)(" + SP_SM_VARIABLE_FORMAT + ")$");
		var quickBoolMatches;
		
		if ((quickBoolMatches = quickBoolPattern.exec(expr)) != null)
		{
			// Do we have a boolean variable?
			var quickMaybeBoolVar = lookupVariableByExpr(quickBoolMatches[2]);
		
			if (quickMaybeBoolVar != null && quickMaybeBoolVar.type == "Bool")
			{
				// Do we have a ! in front?
				if (quickBoolMatches[1] == "!")
					return (quickMaybeBoolVar.value == "false");
				return (quickMaybeBoolVar.value == "true");
			}
		}
	
		// Comparison (lhsExpr)(comparator)(rhsExpr)
		var compareRegex = /^\s*(\S+)\s*([!=><]{1,2})\s*(.+)$/; // accounts for whitespace at start
		var compareMatches; // (==|!=|>|>=|<|<=) - wouldn't capture >= or <= properly
		
		// Valid comparison format?
		if ((compareMatches = compareRegex.exec(expr)) == null)
		{
			alert("INVALID COMPARISON FORMAT");
			return false; // should be an error?
		}
		
		// Assign variables from regex for clarity
		var lhsExpr = compareMatches[1]
		var operator = compareMatches[2];
		var rhsExpr = compareMatches[3];
		
		// Determine the value and type of LHS
		var lhsValue; // to be set later
		var lhsType = null; // unknown by default
		
		// Is LHS a variable?
		var lhsMaybeVar;
		if ((lhsMaybeVar = lookupVariableByExpr(lhsExpr)) != null)
		{
			// We know exactly the type and value
			lhsValue = lhsMaybeVar.value;
			lhsType = lhsMaybeVar.type;
		}
		else
		{
			// We know the value but not the type
			lhsValue = lhsExpr;
			
			// Let's check every possible type to see what this variable could be
			// There is a strong assumption that every value is unique to a type - for now, this is correct!
			for (var vtype in ScriptedPixels.GameData.validVariableTypes)
			{
				if (ScriptedPixels.GameData.validVariableTypes.hasOwnProperty(vtype) && 
					ScriptedPixels.GameData.validVariableTypes[vtype].valuePattern.test(lhsExpr))
					lhsType = vtype; // we know the type!
			}
		}
		
		// Determine the value and type of RHS - IT MAY BE WISE TO MAKE THIS APPROACH INTO A FUNCTION
		var rhsValue; // to be set later
		var rhsType = null; // unknown by default
		
		// Is RHS a variable?
		var rhsMaybeVar;
		if ((rhsMaybeVar = lookupVariableByExpr(rhsExpr)) != null)
		{
			// We know exactly the type and value
			rhsValue = rhsMaybeVar.value;
			rhsType = rhsMaybeVar.type;
		}
		else
		{
			// We know the value but not the type
			rhsValue = rhsExpr;
			
			// Let's check every possible type to see what this variable could be
			// There is a strong assumption that every value is unique to a type - for now, this is correct!
			for (var vtype in ScriptedPixels.GameData.validVariableTypes)
			{
				if (ScriptedPixels.GameData.validVariableTypes.hasOwnProperty(vtype) &&
					ScriptedPixels.GameData.validVariableTypes[vtype].valuePattern.test(rhsExpr))
					rhsType = vtype; // we know the type!
			}
		}
		
		// If the types do not match or are unknwon, return false
		if (lhsType != rhsType || lhsType == null || rhsType == null)
			return false;
		
		// We can handle two operators which are common to all types
		if (operator == "==")
			return (lhsValue == rhsValue);
		else if (operator == "!=")
			return (lhsValue != rhsValue);
		
		// Integers have more comparison operators
		if (lhsType == "Int")
		{
			// Return value
			var retval = false; // by default
			
			// Which operator do we have?
			switch (operator)
			{
			case ">":
				retval = (lhsValue > rhsValue);
				break;
			
			case ">=":
				retval = (lhsValue >= rhsValue);
				break;
				
			case "<":
				retval = (lhsValue < rhsValue);
				break;
			
			case "<=":
				retval = (lhsValue <= rhsValue);
				break;
			}
			
			// Return result of comparison
			return retval;
		}
		
		// If all else fails and we somehow end here, return false!
		return false;
	};
	
	
	/*!	function
		Replaces variables with their values from the lookup
		Params:
			-str: a string or variable expression containing variables
		Returns:
			-a string with variables replaced by their values or 
	*/
	var replaceVariablesWithValues = function(str)
	{
		// Closure for an inner, private function
		var _lookupVariable = lookupVariable; // I feel a problem would arise otherwise
	
		// Replace variables with their value - note that \$ will put the actual string (minus the \) [NOT YET IMPLEMENTED]
		// The author can use \$ to not write out a variable
		return str.replace(new RegExp(SP_SM_VARIABLE_FORMAT, "g"), function ($0, varscope, varname)
		{
			// If we have a backslash, we just write out the rest with the backslash removed
			//if (backslash == "\\")
			//	return $0.substr(1);
				
			// Fetch variable and returns its value
			var realVar = _lookupVariable(varscope, varname);
			
			if (realVar != null)
				return realVar.value;
			
			// No variable, no value
			return $0; // return the string as it is
		});
	};
	
	
	// Public access --
	
	return {
		/*!	public
			Pass along a script to run, overriding any current scripts!
			Only one script can be executed at a time!
			The script will actually run when update() is called, so the name is a little deceiving...
			Params:
				-script: string to be executed
				-onCompleteCallback: [optional] a function to call when the script finishes
		*/
		run: function(script, onCompleteCallback)
		{
			// Store the callback function, or keep it as null
			// http://stackoverflow.com/questions/899574/which-is-best-to-use-typeof-or-instanceof
			m_onCompleteCallback = (onCompleteCallback !== undefined &&
				(onCompleteCallback instanceof Function || typeof onCompleteCallback == "function" )) ?
				onCompleteCallback : null;
				
			// If we have no script to run, we pretend that we have a single empty line
			// This way, we can update once and perform callbacks as expected
			if (/^\s*$/.test(script))
			{
				// A single, empty line
				m_scriptLines = [''];
			
				// Initialize variables before execution
				m_currentLineIndex = 1; // Place the iterator after the script; yes, it's kind of hacky
				m_currentCommand = null;
				removeTempVars();
				
				// Now we can execute
				m_canExecute = true;
				
				// And abort the rest of the calling...
				return;
			}		
		
			// NOTE: Only tabs are allowed for indentation on each line! Spaces are *not* permitted for indentation!
			// Doing so makes each tab an indicator of 'scope' whereas spaces would be variable and thus harder to determine.
		
			// Not allowed to execute the script until processing completes
			m_canExecute = false;
			
			// Preprocess / cleanup lines
			var cleanScript = script;
			
			// Remove any carriage-returns in favour of just \n as opposed to \n\r or \r\n
			cleanScript = cleanScript.replace(/\r/g, "");
			
			// Remove consistent whitespace at the beginning of each line
			var minimumWhiteSpace = /^\s*/.exec(script);
			var minwsRegex = new RegExp("^" + minimumWhiteSpace, "gm"); // avoids an eval statement :)
			cleanScript = cleanScript.replace(minwsRegex , "");
			
			// Remove all comments
			cleanScript = cleanScript.replace(/\s*#.*$/gm, '');
			
			// http://www.regular-expressions.info/captureall.html
			// enter and leave capture group only once

			// Clean up SHOW_MESSAGE
			// e.g.
			// SHOW_MESSAGE:
			// 	You already have an apple!
			// 	Don't be greedy!
			// -> TURNS INTO ->
			// SHOW_MESSAGE "You already have an apple!\nDon't be greedy!"
			// This approach works generically, but realistically only 1 - 3 lines should be applied
			// This approach does not allow for blank lines as they will be removed...
			// Perhaps I could add some keyword like {BLANK} to ignore blank lines in the future :)
			// Alternatively, one can use the reduced form -- SHOW_MESSAGE "L1\n\nL3" -- or some variant
			// We will also turn " into \" to make the string valid
			cleanScript = cleanScript.replace(/^(\t*)(SHOW_MESSAGE):((?:\n\1\t([^\n]*)){1,3})$/gm,
				function($0, $1, $2, $3) {return $1 + $2 + " \"" +
					$.trim($3).replace(/\n\s*/g, "\\n").replace(/\"/g, "\\\"")
					+ "\"";}); // [^\S\n] was used in place of \t after \n\1 to indicate indented lines
					
			// Clean up MOVE_ENTITY
			// e.g.
			// MOVE_ENTITY "Player":
			//  face_left
			//  ...
			//  move_left
			// -> TURNS INTO ->
			// MOVE_ENTITY "Player" {face_left, ..., move_left}
			cleanScript = cleanScript.replace(/^(\t*)(MOVE_ENTITY)\s+(\"[^\"]+\"):((?:\n\1\t([^\n]*))+)$/gm,
				function($0, $1, $2, $3, $4) {return $1 + $2 + " " + $3 + " {" +
					$.trim($4).replace(/\n\s*/g, ", ")
					+ "}";});
				
			// Clean up ASK_CHOICE
			// e.g.
			// ASK_CHOICE \varscope.varname: # could also be just \varname for a temp variable
			//  Yes
			//  No # there should only be a maximum of 3 choices - I could add this requirement in the future using {1,3}
			// -> TURNS INTO ->
			// ASK_CHOICE \varscope.varname {"Yes", "No"}
			var askChoiceRegex = new RegExp("^(\\t*)(ASK_CHOICE)\\s+(" + SP_SM_VARIABLE_FORMAT + "):((?:\\n\\1\\t([^\\n]*)){1,3})$", "gm");
			cleanScript = cleanScript.replace(askChoiceRegex,
				function($0, $1, $2, $3, $4, $5, $6) {return $1 + $2 + " " + $3 + " {\"" +
					$.trim($6).replace(/\n\s*/g, "\", \"")
					+ "\"}";}); // $4 and $5 are varscope and varname - but we capture the entire variable
			
			// Trim any trailing whitespace on each line
			cleanScript = cleanScript.replace(/\s+$/g, "");
			
			// Remove any "blank" lines that consist only of whitespace
			cleanScript = cleanScript.replace(/\n\s*\n/g, "\n");
			
			// --
			
			// Store each line of the script
			m_scriptLines = cleanScript.split("\n");
			
			// Scan script lines to store labels		
			for (var ln = 0; ln < m_scriptLines.length; ln++)
			{
				// Store the line numbers that labels reside on
				var labelMatches;
			
				if ((labelMatches = /^\t*LABEL\s+(\S+)/.exec(m_scriptLines[ln])) != null)
					m_labelLines[labelMatches[1]] = ln;

				// LABEL name -> not quotes around name, because it's sort of a variable
				// In the event of equivalent label names, the later line will be used
			}
			
			// Initialize variables before execution
			m_currentLineIndex = 0;
			m_currentCommand = null;
			removeTempVars();
			
			// Now we can execute
			m_canExecute = true;
		},
	
		
		/*!	public
			Update the active script, if there is one, on a per-frame basis
			Params:
				-dt_sec: time since last update
			Returns:
				-true: script was updated
				-false: no updated occurred
		*/
		update: function(dt_sec)
		{
			// Abort if there is no script to run or we cannot execute
			if (m_scriptLines.length == 0 || !m_canExecute)
				return false;
			
			// Run commands until we reach one that blocks several frames		
			// This loop is designed to run one line per iteration, jumping aside
			var canContinue = true; // only matters for commands, which block; i.e. take multiple frames to process
			
			while (canContinue && m_currentLineIndex < m_scriptLines.length)
			{
				// Update Current Command --
				
				// Update the current command if there is one
				if (m_currentCommand != null)
				{
					// Update the command
					m_currentCommand.update(dt_sec);
					
					// If the command finishes, we are allowed to continue
					// Otherwise, we are done updating this frame!
					if (m_currentCommand.isFinished())
					{
						m_currentLineIndex++; // proceed to next line
						m_currentCommand = null;
					}
					else
						canContinue = false; // we have to stop the loop here
						
					// Attempt to try the while loop again
					continue;
				}
				
			
				// Syntactical Operations --
				var syntaxMatches;
				
				// If we find a LABEL, just jump to the next line
				if ((syntaxMatches = /^\t*LABEL\s+/.exec(m_scriptLines[m_currentLineIndex])) != null)
				{
					m_currentLineIndex++;
					continue;
				}
				
				// If we find a GOTO, jump to that label's line
				if ((syntaxMatches = /^\t*GOTO\s+(\S+)$/.exec(m_scriptLines[m_currentLineIndex])) != null)
				{
					// Is the label valid?
					if (m_labelLines.hasOwnProperty(syntaxMatches[1]))
						m_currentLineIndex = m_labelLines[syntaxMatches[1]];
					else
						alert("Unknown label in GOTO: " + syntaxMatches[1]);
						
					continue;
				}
				
				// If we find an IF statement
				if ((syntaxMatches = /^(\t*)IF\s+(.+):$/.exec(m_scriptLines[m_currentLineIndex])) != null)
				{
					// Provide some variables for clarity
					var initialWhiteSpace = syntaxMatches[1];
					var comparisonExpr = syntaxMatches[2];
					
					// Evaluate the comparison expression 
					if (evaluateComparisonExpr(comparisonExpr))
						m_currentLineIndex++; // it is okay to access the true case of this if-statement
					else
					{
						// Regular Expressions of other if-related syntax
						var withinScope = new RegExp("^" + initialWhiteSpace + "\\\t");
						var sameScopeElseIf = new RegExp("^" + initialWhiteSpace + "ELSE_IF\\\s+(.+):$");
						var sameScopeElse = new RegExp("^" + initialWhiteSpace + "ELSE:$");
						// the whitespace helps us to avoid inner IF statements!
					
						// Traverse each line until we reach ELSE_IF, ELSE, end of scope, or end of script
						var keepGoing = true;
						
						while (keepGoing)
						{
							// Increment the line counter
							m_currentLineIndex++;
							
							// When we find an ELSE_IF statement, we evaluate it
							// If the result is true, we can run the next line
							// Otherwise, we have to find the next ELSE_IF or ELSE
							if ((syntaxMatches = sameScopeElseIf.exec(m_scriptLines[m_currentLineIndex])) != null)
							{
								// We can use the new comparison expression
								comparisonExpr = syntaxMatches[1];
								
								// Evaluate the comparison expression
								if (evaluateComparisonExpr(comparisonExpr))
								{
									m_currentLineIndex++;
									keepGoing = false; // we know where to go now
								}
								
								// The do-while loop will handle additional searching if necessary, so we are fine here
							}
							// Stop if we find an ELSE, then jump to the next line
							else if (sameScopeElse.test(m_scriptLines[m_currentLineIndex]))
							{
								m_currentLineIndex++; // jumps to the line immediately after ELSE
								keepGoing = false;
							}
							// Stop if we are no longer within the scope - which means the if-statement has ended
							else if (!withinScope.test(m_scriptLines[m_currentLineIndex]))
								keepGoing = false; // this line will be processed again - COULD BE CAUSING ERRORS?
							// Also end if we run out of lines
							else if (m_currentLineIndex >= m_scriptLines.length)
								keepGoing = false;
						}
					}
					
					continue;
				}
				
				// If we locate an ELSE_IF or ELSE statement outside of an IF (see above),
				// we need to skip to the end of the end IF statement
				if ((syntaxMatches = /^(\t*)ELSE(?:_IF\s+)?.*:$/.exec(m_scriptLines[m_currentLineIndex])) != null)
				{
					// Provide a variables for clarity
					var initialWhiteSpace = syntaxMatches[1];
					
					// Regular Expressions of other if-related syntax
					var withinScope = new RegExp("^" + initialWhiteSpace + "\\\t");
					var sameScopeElseIf = new RegExp("^" + initialWhiteSpace + "ELSE_IF\\\s+(?:.+):$");
					var sameScopeElse = new RegExp("^" + initialWhiteSpace + "ELSE:$");
					// the whitespace helps us to avoid inner IF statements!
					
					// Skip over any lines with a 'deeper' scope in addition to any
					// more ELSE_IF or ELSE statements so we can reach the end
					var keepGoing = true;
					
					while (keepGoing)
					{			
						// Skip over ELSE_IF and ELSE
						if (sameScopeElseIf.test(m_scriptLines[m_currentLineIndex]) || 
							sameScopeElse.test(m_scriptLines[m_currentLineIndex]) ||
							withinScope.test(m_scriptLines[m_currentLineIndex]))
							m_currentLineIndex++;
						// Stop if we run of out of lines
						else if (m_currentLineIndex >= m_scriptLines.length)
							keepGoing = false;
						// Stop if we exit the scope
						else // handled above, so we need not check
							keepGoing = false;
					}
					
					continue;
				}
				
				
				// Variables --
				
				// Do we have a temporary variable initialization?
				if (evaluateTempVariableInitExpr(m_scriptLines[m_currentLineIndex]))
				{
					m_currentLineIndex++;
					continue;
				}
				
				// Let's try to evaluate a variable assignment
				// returns false if it cannot be processed OR if there is an error!
				if (evaluateVariableAssignmentExpr(m_scriptLines[m_currentLineIndex]))
				{
					m_currentLineIndex++;
					continue;
				}
				
			
				// Commands --
				
				// Does the line represent a command?
				var commandNameMatches;
					
				if ((commandNameMatches = /^\t*([^\s]+)/.exec(m_scriptLines[m_currentLineIndex])) != null)
				{
					// Fetch the command name
					var commandName = commandNameMatches[1];
					
					// Is the command legal?
					if (commandName in SP_SM_SCRIPT_COMMANDS)
					{
						// Remove commandName from the start of the string including any additional white space
						// Doing so will let us focus on the arguments
						var currentLineArguments = $.trim($.trim(m_scriptLines[m_currentLineIndex]).slice(commandName.length));
					
						// Fetch arguments
						var argumentMatches;
						
						// Are the arguments valid?
						if ((argumentMatches = SP_SM_SCRIPT_COMMANDS[commandName].argumentPattern.exec(currentLineArguments)) != null)
						{
							// Remove first match which is for the whole string
							argumentMatches.shift();
							
							// Replace variables in arguments
							for (var arg = 0; arg < argumentMatches.length; arg++)
								argumentMatches[arg] = replaceVariablesWithValues(argumentMatches[arg]);
								
							// ACTUALLY - NOT EVERY ARGUMENT SHOULD HAVE VARIABLES REPLACED
							// THE COMMANDS SHOULD HANDLE THIS PART - TO DO
							
							// Create the currentCommand object - It is assumed the class exists!
							var commandClass = SP_SM_SCRIPT_COMMANDS[commandName].commandClass;
							m_currentCommand = new ScriptedPixels.ScriptManager.Commands[commandClass](argumentMatches);
						}
						else
							alert("INVALID ARGUMENTS FOR COMMAND " + commandName + ": " + currentLineArguments);
					}
					else
					{
						// Error, then proceed to next line
						alert("INVALID COMMAND: " + commandName);
						m_currentLineIndex++;
					}
					
					continue;
				}
			}
			
			
			// Should we terminate the script?
			if (m_currentLineIndex >= m_scriptLines.length)
			{
				// Reset all script-related variables
				m_canExecute = false;
				m_scriptLines.length = 0; // deletes the array - to my knowledge
				m_currentLineIndex = 0;
				m_currentCommand = null;
				m_labelLines = [];
				
				// Destroy any temporary variables for this script
				removeTempVars();
				
				// Now call the callback function since we have completed
				if (m_onCompleteCallback != null)
				{
					// Call the function, and then null the reference for future use
					m_onCompleteCallback();
					m_onCompleteCallback = null; // no more callback
				}
			}
			
			// The script was updated
			return true;
		},
		
		
		/*!	public function
			Some commands need to draw to the screen.
			Params:
				-canvasId: id of canvas to draw to
		*/
		draw: function(canvasId)
		{
			if (m_currentCommand != null)
				m_currentCommand.draw(canvasId);
		},
		
		
		/*!	public function
			A public method to evaluate a comparison expresion.
			Params:
				-string: string expression to eveluate for comparison
			Returns:
				-true|false
		*/
		publicEvaluateComparisonExpr: function(expr)
		{
			return evaluateComparisonExpr(expr);
		}
	};
}();


/*!	namespace
	A collection of command classes for the Script Manager
*/
ScriptedPixels.ScriptManager.Commands = function()
{
	// Private class --
	
	/*!	private class
		Base class for commands within the script manager
	*/
	var ScriptCommand = Class.extend(
	{
		/*!	virtual constructor
			Creates a script command with some arguments
			Params:
				-args: array of arguments; refer to subclasses for details
		*/
		init: function(args)
		{
			// Flag to indicate if the command has finished
			this.finished = false;
		},
		
		
		/*!	public function
			Has the command finished?
			Returns:
				-true|false
		*/
		isFinished: function()
		{
			return this.finished;
		},
		
		
		/*!	public virtual function
			Update the command to perform tick-by-tick processing.
			Upon completion, the finished flag should be set.
			Params:
				-dt_sec: time in seconds since the last update
		*/
		update: function(dt_sec) {},
		
		
		/*!	public vitual function
			Some commands may wish to draw every frame, too!
			Params:
				-canvasId: id of the canvas to draw to
		*/
		draw: function(canvasId) {}
	});
	
	
	// Public classes --

	// Return all command classes
	return {
		/*!	public class
			Set the speaker and terminate immediately
		*/
		SetSpeaker: ScriptCommand.extend(
		{
			/*!	constructor
				Set the speaker given a string
				Params:
					-args: array whose first element is the speaker string
			*/
			init: function(args)
			{
				// Call base constructor
				this._super();
				
				// We can immediately set the speaker and finish
				ScriptedPixels.GameData.setSpeaker(args[0]);
				this.finished = true;
			}
		}),
		
		
		/*!	public class
			Similar to the above command, but the speaker is removed
		*/
		ClearSpeaker: ScriptCommand.extend(
		{
			/*!	constructor
				Simply erase the speaker and finish immediately
				Params:
					-args: useless
			*/
			init: function(args)
			{
				// Call base constructor
				this._super();
				
				// We can immediately set the speaker and finish
				ScriptedPixels.GameData.setSpeaker("");
				this.finished = true;
			}
		}),
		
		
		/*!	public class
			Show a message - for now we just do an alert
			Params:
				-args: array whose first element is the string to display
		*/
		ShowMessage: ScriptCommand.extend(
		{
			/*!	constructor
				For now, we will just show an alert of the message with the speaker.
				Params:
					-args: array whose first element is the string to display
			*/
			init: function(args)
			{
				// Call base constructor
				this._super();
				
				// Additional variables
				this.completeMessage = args[0];
				this.charsToShow = 0;
				
				// Compress all whitespace into single spaces and fix linebreaks
				this.completeMessage = this.completeMessage.replace(/\t/g, ' ');
				this.completeMessage = this.completeMessage.replace(/\\n/g, "\n");
			},
			
			
			/*!	public function
				Update the entire message that will be displayed
				Params:
					-dt_sec: time since last update
			*/
			update: function(dt_sec)
			{
				// Increment characters to show
				this.charsToShow += 1; //Math.round(SP_SM_MESSAGE_CHARS_PER_SEC * dt_sec);
				
				if (this.charsToShow > this.completeMessage.length)
					this.charsToShow = this.completeMessage.length;
				
				// Once the entire message is drawn and the player pressed a key, the message will disappear
				if (this.charsToShow == this.completeMessage.length &&
					ScriptedPixels.InputManager.isKeyJustPressed(SP_IN_VKEYS.ACTION))
					this.finished = true;
			},
			
			
			/*!	public vitual function
				Draw text to the screen
				Params:
					-canvasId: id of the canvas to draw to
			*/
			draw: function(canvasId)
			{
				// Fetch the speaker - NOT USED FOR NOW
				//var speaker_text = ScriptedPixels.GameData.getSpeaker();
				// speaker_text = (speaker_text != "") ? "[" + speaker_text + "]\n" : "";
				
				// Draw a black background
				$(canvasId).drawRect({
					fillStyle: "#000",
					width: SP_CANVAS_WIDTH,
					height: SP_SM_MESSAGE_BOX_HEIGHT,
					fromCenter: false,
					x: 0,
					y: SP_CANVAS_HEIGHT - SP_SM_MESSAGE_BOX_HEIGHT
				});
				
				// Fetch the string to be shown
				var textToShow = this.completeMessage.substr(0, this.charsToShow);
				var linesToShow = textToShow.split("\n");
				
				// Draw each line of text - of which there should be a maximum of 3
				for (var ln = 0; ln < linesToShow.length; ln++)
				{
					// Draw the line
					$(canvasId).drawText({
						layer: true,
						fillStyle: "#fff",
						font: "16pt Verdana",
						fromCenter: false,
						text: linesToShow[ln],
						x: SP_SM_MESSAGE_BOX_PADDING,
						y: SP_CANVAS_HEIGHT - SP_SM_MESSAGE_BOX_HEIGHT + SP_SM_MESSAGE_BOX_PADDING + (ln * SP_SM_MESSAGE_LINE_HEIGHT),
						align: "left"
					});
				}
			}
		}),
		
		
		/*! public class
			Delay the game for arg[0] seconds
		*/
		Sleep: ScriptCommand.extend(
		{
			/*!	constructor
				Set the time to sleep for
				Params:
					-args: array whose first value is a float in seconds
			*/
			init: function(args)
			{
				// Store the time we need to sleep for
				this.sleepFor = args[0];
				
				// Current 'counter' for time slept
				this.sleepTotal = 0.0;
			},
		
		
			/*!	public function
				Sleep until it's time to wake up
				Params:
					-dt_sec: add this amount to the counter
			*/
			update: function(dt_sec)
			{
				// Increment counter, and then end when we have reached the desired period
				this.sleepTotal += dt_sec;
				this.finished = (this.sleepTotal >= this.sleepFor);
			}
		})
	};
}();