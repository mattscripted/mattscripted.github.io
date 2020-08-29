// Copyright (c) 2013, Matthew Shelley. All rights reserved.

/*!	namespace for Game Data */
ScriptedPixels.GameData = function()
{
	// Private variables --
	
	/*!	private string
		The speaker for current and future messages
	*/
	m_speaker = ""; // no speaker by default
	
	
	// Privates classes --

	/*!	private struct
		A primitive data type
	*/
	var VTPrimitive = Class.extend(
	{
		/*!	constructor
			Params:
				-valuePattern: regular expression representing values
				-defaultValue: initial value, if none is given
		*/
		init: function(valuePattern, defaultValue)
		{
			this.valuePattern = valuePattern;
			this.defaultValue = defaultValue;
		}
	});
	
	
	/*!	private struct
		A shortcut for creating enums similar to primitives.
		It is assumed that the default value is the first.
		Enum values are accessed as: EnumName.EnumValue
	*/
	var VTEnum = VTPrimitive.extend(
	{
		/*!	constructor
			Create the enum
			Params:
				-enumName: name of the enum
				-values: a comma-separated set of values stored as a string
		*/
		init: function(enumName, values)
		{
			// We want to save the values as an array, as it is helpful to have
			this.enumValues = values.split(',');
		
			// Create the pattern and default value
			var valuePattern = new RegExp("^" + enumName + "\\.(" + this.enumValues.join('|') + ")$");
			var defaultValue = enumName +  "." + (this.enumValues[0]); // I should do some checking
			
			alert(this.enumValues.length);
			alert("^" + enumName + "\\.(" + this.enumValues.join('|') + ")$");
			
			// Call base constructor
			this._super(valuePattern, defaultValue);
		}
	});


	// Public access --
	
	return {
		/*!	public class
			Creates a variable of one of the legal types
		*/
		GameVariable: Class.extend(
		{
			/*!	class
				Create a generic game variable
				Params:
					-type: type of variable, as a string
					-value: [optional] value of the variable, otherwise default for type is used
				Note:
					If the type is invalid, variables will default to Bool
			*/
			init: function(type, value)
			{
				// Store the type if it is valid, otherwise default to Bool
				this.type = (ScriptedPixels.GameData.validVariableTypes.hasOwnProperty(type)) ? type : SP_DEFAULT_VARIABLE_TYPE;
				
				// Value of the variable - or the default if not provided
				this.value = (value !== undefined && ScriptedPixels.GameData.validVariableTypes[this.type].valuePattern.test(value))
					? value : ScriptedPixels.GameData.validVariableTypes[this.type].defaultValue;
			}
		}),
	
		/*!	public function
			Create an enum variable type, if it oes not exist
			Params:
				-name: name of the enum
				-values: a comma-seperated set of values stores as a string
		*/
		createEnumType: function(name, values)
		{
			// Add the variable type if it doesn't yet exist
			if (!this.validVariableTypes.hasOwnProperty(name))
				this.validVariableTypes[name] = new VTEnum(name, values);
			// Otherwise, failure?
		},
		
		
		/*!	public function
			Create a global variable, if it does not yet exist
			Params:
				-name: name of the variable
				-type: type of the variable
				-value: [optional] default value of the variable
		*/
		createGlobalVariable: function(name, type, value)
		{
			// Add the variable, if its name is not already in use
			if (!this.globalVariables.hasOwnProperty(name))
				this.globalVariables[name] = new this.GameVariable(type, value);
		},
		
		
		/*!	public function
			Destroy all global variables and enums. Use with caution!
		*/
		destroyAllGlobalVariablesAndEnums: function()
		{
			// Delete each global variable
			for (var gv in this.globalVariables)
			{
				if (this.globalVariables.hasOwnProperty(gv))
					delete this.globalVariables[gv];
			}
			
			this.globalVariables = {};
			
			// Delete each enum type, by excluding Bool and Int
			for (var vt in this.validVariableTypes)
			{
				if (this.validVariableTypes.hasOwnProperty(vt) && vt != "Bool" && vt != "Int")
					delete this.validVariableTypes[vt];
			}
		},

		
		/*!	public 'constant' object / associative array
			This object represents a collection of global variables within the game.
			Once set, this data should be treated as read-only.
		*/
		globalVariables: {}, // an empty object for now
		
		
		/*!	public 'constant' object / associative array
			The collection of valid variable types, which will be updated on
			*one occasion* in order to store all enums for the game. These values
			include primitives (bool and int) and game-specific enums.
			Once set, this data should be treated as read-only.
		*/
		validVariableTypes:
		{
			Bool: new VTPrimitive(/^true|false$/, false),
			Int: new VTPrimitive(/^[-+]?[0-9]+$/, 0)
			// Enums will be stored in this object as well
		},
		
		
		/*!	public function
			Store the speaker for future messages
			Params:
				-speaker: string to be displayed
		*/
		setSpeaker: function(speaker)
		{
			m_speaker = speaker;
		},
		
		
		/*!	public function
			Get the speaker for future messages
			Returns:
				-string for the speaker
		*/
		getSpeaker: function()
		{
			return m_speaker;
		}
	};
}();