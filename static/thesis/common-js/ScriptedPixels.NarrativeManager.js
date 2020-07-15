// Copyright (c) 2013, Matthew Shelley. All rights reserved.

/*! namespace
	The Narrative Manager treats a Use Case Map as a narrative representation.
	When an event is called, the narrative progress is updated provided the
	event is legal to call according to the representation.
*/
ScriptedPixels.NarrativeManager = function()
{
	// EXPRESSION MODIFICATION --
	
	/*!	private function
		Modifies an expression from jUCMNav so it can be parsed by the ScriptManager.
		In particular, we replace variable names and enum values.
		Params:
			-ucmExpr: string from a jUCMNav expression to evaluate
		Returns:
			-string: modified expression
	*/
	var modifyUCMExpressionForScriptManager = function(ucmExpr)
	{
		// First, let's handle some very simple cases
		if (ucmExpr == true || ucmExpr == "true")
			return "true";
		if (ucmExpr == false || ucmExpr == "false")
			return "false";
			
		// Otherwise, we need to convert variables and enum types...
		var modifiedExpr = ucmExpr;
		
		// Second, let's convert any variables to their global expression
		// We do this so we can parse in the same format as our ScriptManager
		for (var globvar in ScriptedPixels.GameData.globalVariables)
		{
			if (ScriptedPixels.GameData.globalVariables.hasOwnProperty(globvar))
			{
				// Update the expression to convert the variable
				modifiedExpr = modifiedExpr.replace(new RegExp("\\b" + globvar + "\\b", "g"), function($0)
				{
					// See ScriptManager for details on the variable format
					return "$global." + $0;
				});
			}
		}
		
		// Convert ENUM values
		// We need to check if the value belongs to a certain type
		for (var vartype in ScriptedPixels.GameData.validVariableTypes)
		{
			// Do we have an enum?
			if (ScriptedPixels.GameData.validVariableTypes.hasOwnProperty(vartype) &&
				ScriptedPixels.GameData.validVariableTypes[vartype].hasOwnProperty('enumValues'))
				// the last line is a cheat to check if we have an enum, because the VTEnum class is private
			{
				// Fetch the enum
				var enumType = ScriptedPixels.GameData.validVariableTypes[vartype];
				
				// Now, for each value in this enum, we run a replace to convert
				for (var e = 0; e < enumType.enumValues.length; e++)
				{
					// Update the expression to convert the enum value
					// We make a very important assumption that all enum values are unique!
					modifiedExpr = modifiedExpr.replace(new RegExp("\\b" + enumType.enumValues[e] + "\\b", "g"), function($0)
					{
						// See ScriptManager for details on enum format
						return vartype + "." + $0;
					});
				}
			}
		}
		
		// Now return the modified expression
		return modifiedExpr;
	};

	
	// EVENTS --

	/*!	public class
		This Event class is referred to by a RespRef, and serves the purpose of
		being a 'definition' of an event. Events can be preloaded, unloaded, and
		called. Events also maintain a list of unique attendees.
		
		Perhaps most importantly, when an event is called traversal continues so
		the player's narrative progress may be updated.
	*/
	var Event = Class.extend(
	{
		/*!	constructor
			Create an event given raw responsibility data from a UCM file.
			The rest of the information can be looked up in a file for the event.
			Params:
				-rawResponsibility: an object containing responsibility data
				-uniqueId: the unique index for this event, which is helpful for self-reference
		*/
		init: function(rawResponsibility, uniqueId)
		{
			// Store the name and condition expression
			this.name = rawResponsibility.name;
			this.expr = rawResponsibility.expression; // not currently used
			
			// Store this event's unique id, as it's useful to pass along
			this.uniqueId = uniqueId;
			
			// Who is at the event? We store references to Royal Guards and Pegasi, not just their ids!
			this.attendees = []; // typically of size 0 or 1, rarely of size 2 or more; just stores unique IDs
			// Note that events can refer to multiple nodes! It's not the same as who is at a node!
			
			// A flag to indicate if this event is passable, i.e. it has just been completed
			this.passable = false;
			
			// A button to represent this event when it is callable - FOR DEBUG PURPOSES
			this.debugButton = null;
			
			// Optional script to call
			// The script will be given using the assignScript() method
			this.script = "";
		},
		
		
		/*!	public [restricted] function
			Assign a script to this event - callable just once!
			Params:
				-script: script to be assigned
		*/
		assignScript: function(script)
		{
			this.script = script;
		},
		
		
		/*!	public function
			Is this event passable? Has it just been completed recently?
			Returns:
				-true|false
		*/
		isPassable: function()
		{
			return this.passable;
		},
		
		
		/*!	public function
			Can we call this event?
			Returns:
				-true|false
		*/
		isLegalToCall: function()
		{
			// If the event has visitors, we can call the event
			return (this.attendees.length > 0);
		},
		
		
		/*!	private function
			Add an attendee, leaving the list unique
			Params:
				-attendee: Royal Guard or Pegasus
			Returns:
				-true: attendee was added
				-false: attendee was already in the list
		*/
		addUniqueAttendee: function(attendee)
		{
			// Has the attendee's unique id already been stored?
			for (var a = 0; a < this.attendees.length; a++)
			{
				if (this.attendees[a].getUniqueId() == attendee.getUniqueId())
					return false;
			}
			
			// If we survived the loop, then add the attendee
			this.attendees.push(attendee);
			return true;
		},
		
		
		/*!	private function
			Remove an attendee from the unique attendees list
			Params:
				-attendee: Royal Guard or Pegasus
			Returns:
				-true: attendee was removed
				-false: attendee was not in the list
		*/
		removeUniqueAttendee: function(attendee)
		{
			// Remove the attendee by finding its unique id and then splicing
			var index = -1;
			
			for (var a = 0; a < this.attendees.length && index == -1; a++)
			{
				if (this.attendees[a].getUniqueId() == attendee.getUniqueId())
					index = a;
			}
			
			// Did we find the attendee?
			if (index >= 0)
			{
				// Yes! Now, we remove it
				this.attendees.splice(index, 1);
				return true;
			}
			
			// Nope, not found...
			return false;
		},
		
		
		/*!	public function
			Preload this event, so it may be callable within the game world
			Params:
				-attendee: a Royal Guard or Pegasus at the event
			Returns:
				-true: event just became legal and was thus preloaded
				-false: event was already legal and was not preloaded again
		*/
		preloadMaybe: function(attendee)
		{
			// Value to be returned
			var retval = false;
		
			// If this event is already considered legal, we can stop the preload
			if (!this.isLegalToCall())
			{
				// Preload the event through a callback function
				// Games will handle the preloading on their own
				if (m_settings.onPreloadEventCallback != null)
					m_settings.onPreloadEventCallback(this.name);
				
				// Add the event name to the list of legal event names
				m_legalEventNames.push(this.name);
				
				// Create legal event button - for debugging
				this.debugButton = $(document.createElement("button"));
				this.debugButton.attr('id', this.name);
				this.debugButton.html(this.name);
				
				// Assign callback to the button
				var _this = this;
				this.debugButton.click(function()
				{
					// Try to call the associated event
					ScriptedPixels.NarrativeManager.tryToCallEventById(_this.uniqueId);
				});
				
				// Put the debug button on the page, if there's a location for it
				if ($(SP_NM_DEBUG_EVENTS_ELEMENT_ID).length > 0)
					$(SP_NM_DEBUG_EVENTS_ELEMENT_ID).append(this.debugButton);
				
				// We had to preload this time
				retval = true;
			}
			
			// We always need to add the attendee
			this.addUniqueAttendee(attendee);
			
			// Return the result
			return retval;
		},
		
		
		/*!	public function
			Call the event - assuming a legal check has already been performed.
			One or more attendees will be notified of the call.
			Params:
				-onCompleteCallback: a method to call once the script finishes
		*/
		call: function(onCompleteCallback)
		{
			//console.log("Calling event through Narrative Manager: " + this.name);
		
			// Closure for 'this'
			var _this = this;
			
			// Call the script with a callback function to update the narrative manager
			ScriptedPixels.ScriptManager.run(this.script, function()
			{
				// BEGIN TIMER FOR TRAVERSAL
				console.time("Call Event (" + _this.name + ") and Update Narrative State"); // which event?
			
				// Array of attendees to move - may be 1 or all
				var attendeesToMove = [];
				
				// Determine attendees to move			
				switch (m_settings.onEventCall)
				{
					case SP_NM_ON_EVENT_CALL.MOVE_FIRST:
						attendeesToMove.push(_this.attendees[0]);
						break;
						
					case SP_NM_ON_EVENT_CALL.MOVE_LAST:
						attendeesToMove.push(_this.attendees[_this.attendees.length - 1]);
						break;
						
					case SP_NM_ON_EVENT_CALL.MOVE_RANDOM:
						var rand_index = Math.floor((Math.random() * _this.attendees.length));
						attendeesToMove.push(_this.attendees[rand_index]);
						break;
						
					default: // case SP_NM_ON_EVENT_CALL.MOVE_ALL:
						// We manually add each attendee, so we are not creating a clone of the attendees object
						for (var a = 0; a < _this.attendees.length; a++)
							attendeesToMove.push(_this.attendees[a]);
						break;
				}
				
				// Temporarily allow this event to be passable
				_this.passable = true;
				
				// Notify the selected attendee(s) that they may leave the event
				for (var a = 0; a < attendeesToMove.length; a++)
					attendeesToMove[a].onEventCall();
					
				// Now, quickly prevent this event from being passable
				_this.passable = false;
				
				// Now, we need to move all Royal Guards to update the narrative structure
				for (var rg in m_royalGuards)
				{
					if (m_royalGuards.hasOwnProperty(rg))
					{
						// Move the Royal Guard along
						m_royalGuards[rg].trot();
						
						// Is the Royal Guard up for deletion?
						if (m_royalGuards[rg].canBeDestroyed())
							destroyRoyalGuardByUniqueId(rg);
					}
				}
				
				// END TIMER
				console.timeEnd("Call Event (" + _this.name + ") and Update Narrative State");
			});
		},
		
		
		/*!	public function
			Unload the event so that it cannot be called again unless it is legal to do so.
			This method should be called whenever a Royal Guard leaves or a Pegasi no longer
			exists at its location.
			Params:
				-attendee: the Royal Guard or Pegasus leaving the event
			Returns:
				-true: if the event was unloaded due to no more attendees
				-false: if the event is still loaded
		*/
		unloadMaybe: function(attendee)
		{
			// Remove the attendee
			this.removeUniqueAttendee(attendee);
		
			// We only unload the event if there are no more attendees
			if (!this.isLegalToCall())
			{
				// Unload the event through a callback function
				// Games will handle the unloading on their own
				if (m_settings.onUnloadEventCallback != null)
					m_settings.onUnloadEventCallback(this.name);
				
				// Remove the debug button from the page
				if (this.debugButton != null)
				{
					this.debugButton.remove();
					this.debugButton = null;
				}
				
				// Remove the event name from the legal array
				var index = m_legalEventNames.indexOf(this.name);
				if (index >= 0) m_legalEventNames.splice(index, 1);
				
				// The event was unloaded
				return true;
			}
		
			// The event was not unloaded
			return false;
		}
	});
	
	
	// NODE AND CONNECTION REFERENCES --
	
	/*!	struct - all members are public
		A reference to a node within any map/stub
	*/
	var NodeRef = Class.extend(
	{
		/*!	constructor
			Creates a node reference given a raw node reference string
			Params:
				-rawNodeRef: a string from a UCM file referring to a node
		*/
		init: function(rawNodeRef)
		{
			// Decompose something like "//@urndef/@specDiagrams.0/@nodes.5" into [0,5]
			var matches;

			if ((matches = /@specDiagrams\.([0-9]+)\/@nodes\.([0-9]+)$/.exec(rawNodeRef)) != null)
			{
				// Store the values
				this.specDiagramIndex = parseInt(matches[1]);
				this.nodeIndex = parseInt(matches[2]);
			}
			else
			{
				// Invalid values, which can be used for error-handling
				this.specDiagramIndex = -1;
				this.nodeIndex = -1;
			}
		},
		
		
		/*!	public function
			Check if one node reference is equivalent to this one,
			as in they refer to the same node.
			Params:
				-nodeRef: reference to compare against
			Returns;
				-true|false
		*/
		isEqualTo: function(nodeRef)
		{
			return (this.specDiagramIndex == nodeRef.specDiagramIndex &&
				this.nodeIndex == nodeRef.nodeIndex);
		} // NOT USED?
	});
	
	
	/*!	struct - all members are public
		A reference to a connection within any map/stub
	*/
	var ConnectionRef = Class.extend(
	{
		/*!	constructor
			Creates a connection reference given a raw connection reference string
			Params:
				-rawNodeRef: a string from a UCM file referring to a connection
		*/
		init: function(rawConnectionRef)
		{
			// Decompose something like "//@urndef/@specDiagrams.0/@connections.5" into [0,5]
			var matches;
			
			if ((matches = /@specDiagrams\.([0-9]+)\/@connections\.([0-9]+)$/.exec(rawConnectionRef)) != null)
			{
				// Store the values
				this.specDiagramIndex = parseInt(matches[1]);
				this.connectionIndex = parseInt(matches[2]);
			}
			else
			{
				// Invalid values, which can be used for error-handling
				this.specDiagramIndex = -1;
				this.connectionIndex = -1;
			}
		},
		
		
		/*!	publlic function
			Convert this connection reference into a string to be used as a key
			Returns:
				-string: can be used as a key in an associative array
		*/
		getStringKey: function()
		{
			// Return something like "0_2"
			return this.specDiagramIndex + "_" + this.connectionIndex;
		},
		
		
		/*!	public function
			Check if one connection reference is equivalent to this one,
			as in they refer to the same connection.
			Params:
				-connectionRef: reference to compare against
			Returns;
				-true|false
		*/
		isEqualTo: function(connectionRef)
		{
			return (this.specDiagramIndex == connectionRef.specDiagramIndex &&
				this.connectionIndex == connectionRef.connectionIndex);
		}
	});
	
	
	// CONNECTIONS --
	
	/*!	class
		A connection is a link between two nodes.
	*/
	var Connection = Class.extend(
	{
		/*!	constructor
			Create a connection given raw connection data from the UCM parser.
			Look into the UCM-parser for more details on the information given.
			Params:
				-rawConnection: an object containing connection data from a UCM file
		*/
		init: function(rawConnection) //function(sourceNodeRef, targetNodeRef)
		{
			// Source - from which node?
			this.sourceNodeRef = new NodeRef(rawConnection.source);
			
			// Target - to which node?
			this.targetNodeRef = new NodeRef(rawConnection.target);
			
			// Condition - only used in a few cases
			this.conditionExpr =
				(rawConnection.conditionExpr === undefined || rawConnection.conditionExpr == "") ?
				"true" : // defaults to true, because it's passable
				modifyUCMExpressionForScriptManager(rawConnection.conditionExpr);
		},
		
		
		/*!	public function
			Get the target of this connection
			Returns:
				-node reference for target
		*/
		getTargetNodeRef: function()
		{
			return this.targetNodeRef;
		},
		
		
		/*!	public function
			Check to see if this edge can even be crossed
			Returns:
				-true|false
		*/
		canCross: function()
		{
			return ScriptedPixels.ScriptManager.publicEvaluateComparisonExpr(this.conditionExpr);
		}
	});
	
	
	// BINDINGS FOR STUBS --
	
	/*!	private struct
		An in-binding tells a stub how to handle a specific connection, by relating
		that connection reference to a start-point node reference.
	*/
	var InBinding = Class.extend(
	{
		/*! constructor
			Create an in binding given raw details from a UCM file
			Params:
				-rawInBinding: in binding details from a UCM file
		*/
		init: function(rawInBinding)
		{
			this.startPointNodeRef = new NodeRef(rawInBinding.startPoint); // node reference
			this.stubEntryConnectionRef = new ConnectionRef(rawInBinding.stubEntry); // connection reference
		},
		
		/*!	public function
			Checks if a connection reference is the same as this stub entry's connection reference
			Params:
				-connectionRef: connection to compare against
			Returns:
				-true|false
		*/
		isStubEntryEqualTo: function(connectionRef)
		{
			return this.stubEntryConnectionRef.isEqualTo(connectionRef);
		}
	});
	
	
	/*!	private struct
		Similar to InBinding, except for an EndPoint leaving a stub.
	*/
	var OutBinding = Class.extend(
	{
		/*!	constructor
			Creates an OutBounding given raw details from a UCM file
			Params:
				-rawOutBinding: raw details from a UCM file
		*/
		init: function(rawOutBinding)
		{
			// Which end point did I come from? Which connection am I supposed to take?
			this.endPointNodeRef = new NodeRef(rawOutBinding.endPoint); // node reference
			this.stubExitConnectionRef = new ConnectionRef(rawOutBinding.stubExit); // connection reference
		}
	});
	
	
	/*!	private struct
		A reference to an out-binding within a spec diagram's node
	*/
	var OutBindingRef = Class.extend(
	{
		/*!	constructor
			Create the in-binding reference based on a string
			Params:
				-rawOutBindingRef: a reference usually given to an End-Point
		*/
		init: function (rawOutBindingRef)
		{
			// Decompose something like "//@urndef/@specDiagrams.0/@nodes.4/@bindings.0/@out.0" into [0,4,0,0]
			var matches;
			
			if ((matches = /@specDiagrams\.([0-9]+)\/@nodes\.([0-9]+)\/@bindings\.([0-9]+)\/@out\.([0-9]+)$/.exec(rawOutBindingRef)) != null)
			{
				// Store the values
				this.specDiagramIndex = parseInt(matches[1]);
				this.nodeIndex = parseInt(matches[2]);
				this.bindingsIndex = parseInt(matches[3]); // can probably be skipped
				this.outIndex = parseInt(matches[4]);
			}
			else
			{
				// Invalid values, which can be used for error-handling
				this.specDiagramIndex = -1;
				this.nodeIndex = -1;
				this.bindingsIndex = -1; // can probably be skipped
				this.outIndex = -1
			}
		},
		
		
		/*!	public function
			Check if a stub node reference contains the outbinding we refer to
			Params:
				-stubNodeRef: reference to a stub node
			Returns:
				-true|false
		*/
		matchesStubNodeRef: function(stubNodeRef)
		{
			return (this.specDiagramIndex == stubNodeRef.specDiagramIndex &&
				this.nodeIndex == stubNodeRef.nodeIndex);
		}
	});
	
	
	// NODES --
	
	/*!	private [base] class
		A node belongs to a SpecDiagram. It can be of many types including Events, Stubs,
		And-Forks, And-Joins, Or-Forks, Or-Joins, and Waiting Places.
	*/
	var Node = Class.extend(
	{
		/*!	constructor
			Creates a Node given the raw data from the UCM file.
			Refer to the UCM-parsing function for details.
			Params:
				-rawNode: object containg node data from UCM file
		*/
		init: function(rawNode)
		{
			// Incoming and outgoing connections
			this.incomingConnectionRefs = [];
			this.outgoingConnectionRefs = [];
			
			// Store references for incoming connections - may be empty
			if (rawNode.pred !== undefined)
			{
				// rawNode.pred is something like "//@urndef/@specDiagrams.0/@connections.2 //@urndef/@specDiagrams.0/@connections.7"
				// We need to split by the space key, and then get the individual connection references
				
				// Split for each connection
				var rawPredArray = rawNode.pred.split(" ");
				
				// Store each connection reference
				for (var p = 0; p < rawPredArray.length; p++)
					this.incomingConnectionRefs.push(new ConnectionRef(rawPredArray[p]));
			}
			
			// Store references for outgoing connections - may be empty
			if (rawNode.succ !== undefined)
			{
				// Again, we split like before
				var rawSuccArray = rawNode.succ.split(" ");
				
				// And then store the connection references
				for (var s = 0; s < rawSuccArray.length; s++)
					this.outgoingConnectionRefs.push(new ConnectionRef(rawSuccArray[s]));
			}
		},
		
		
		/*!	public virtual function
			Return the next legal set of connections
			Returns:
				-array of connection references
		*/
		getNextConnectionRefs: function()
		{
			// By default, we only return the connections that can be crossed
			var legalConnectionRefs = [];
			
			for (var conn = 0; conn < this.outgoingConnectionRefs.length; conn++)
			{
				// Fetch the connection
				var connection = getConnectionByRef(this.outgoingConnectionRefs[conn]);
				
				// Can the connection be crossed? If so, let's add it
				if (connection != null && connection.canCross())
					legalConnectionRefs.push(this.outgoingConnectionRefs[conn]);
			}
			
			// Return the results
			return legalConnectionRefs;
		}
	});
	
	
	/*!	private class
		Start Points begin paths and are similar to generic nodes.
		This class could probably be dropped :)
	*/
	var StartPointNode = Node.extend({});
	
	
	/*!	private class
		End Nodes either terminate a narrative path altogether OR
		exit a stub to an upper level narrative map.
	*/
	var EndPointNode = Node.extend(
	{
		/*! constructor
			Create an End Node given raw UCM data
			Params:
				-rawNode: raw information for an End Node from a UCM file
		*/
		init: function(rawNode)
		{
			// Call base constructor
			this._super(rawNode);
			
			// Array of outbinding references
			this.outBindingRefs = [];
			
			// Split string for each outbinding
			var rawOutBindingRefArray = rawNode.outBindings.split(" ");
			
			// Store out binding references
			for (var out = 0; out < rawOutBindingRefArray.length; out++)
				this.outBindingRefs.push(new OutBindingRef(rawOutBindingRefArray[out]));
		},
		
		
		/*!	public function
			Find a connection reference for this end point given the stub node
			that lead into the current stub / spec diagram.
			Params:
				-stubNodeRef: reference to a stub node that should bind to this EndPoint
			Returns:
				-ConnectionRef: reference to a connection
				-null: no appropriate binding was found
		*/
		getStubExitConnectionRefFromStubNodeRef: function(stubNodeRef)
		{
			// Array of outbinding references
			for (var obref = 0; obref < this.outBindingRefs.length; obref++)
			{
				// Does the outbinding reference refer to an outbinding in this stub?
				if (this.outBindingRefs[obref].matchesStubNodeRef(stubNodeRef))
				{
					// Fetch the outbinding
					var outBinding = getOutBindingByRef(this.outBindingRefs[obref]);
					
					// Is there an outbinding?
					if (outBinding != null)
					{
						// Fetch the connection reference
						return outBinding.stubExitConnectionRef;
					}
					
					// Somehow we have no outbinding when one should exist
					return null;
				}
			}
			
			// No binding found
			return null;
		}
	});
	
	
	/*!	private class
		Nodes that refer to events, though they are 'responsibility' references.
	*/
	var RespRefNode = Node.extend(
	{
		/*!	constructor
			Creates a node that refers to an event
			Params:
				-rawNode: same as usual, but the attribute 'respDef' will be included
		*/
		init: function(rawNode)
		{
			// Call base constructor
			this._super(rawNode);
		
			// Event reference (i.e. id)
			// Convert something like "//@urndef/@responsibilities.0" into 0
			this.eventIndex = parseInt(/\.([0-9]+)$/.exec(rawNode.respDef)[1]);
		},
		
		
		/*!	public function
			Connections are only given when the event is completed
			Returns:
				-an array of 1 connection, if the event was *just* completed
				-an array of 0 connections, if the event was *not* just completed
		*/
		getNextConnectionRefs: function()
		{
			// Only return the connections if the event was *just* completed
			if (m_events[this.eventIndex].isPassable())
				return this.outgoingConnectionRefs;
			
			// If the event cannot be passed, we have no results
			return [];
		},
		
		
		/*!	public function
			Attempt to preload the associated event, or at least add an attendee
			Params:
				-attendee: Royal Guard or Pegasus attending the event
		*/
		preloadEvent: function(attendee)
		{
			m_events[this.eventIndex].preloadMaybe(attendee);
		},
		
		
		/*!	public function
			Attempt to unload the associated event, or at least remove an attendee
			Params:
				-attendee: Royal Guard or Pegasus attending the event
		*/
		unloadEvent: function(attendee)
		{
			m_events[this.eventIndex].unloadMaybe(attendee);
		},
	});
	
	
	/*!	private class
		This class exists purely for performing 'instanceof'. However, with
		Or-Forks we will create a Pegasi tree later on.
	*/
	var OrForkNode = Node.extend({});
	
	
	/*!	private class
		And-Forks create 'levels' of concurrency, by allowing multiple Royal Guards to
		explore the outgoing paths. This class exists purely for performing 'instanceof'.
	*/
	var AndForkNode = Node.extend({}); // create additional Royal Guards
	
	
	/*!	private class
		An AndJoin blocks until all incoming, concurrent paths have completed.
		In this sense, these nodes remove a 'level' of concurrency.
	*/
	var AndJoinNode = Node.extend(
	{
		/*!	constructor
			Create the And-Join
		*/
		init: function(rawNode)
		{
			// Call base constructor
			this._super(rawNode);
			
			// List of Royal Guards or Pegasi visiting this node
			// We key attendees by their unique ids, and store the objects
			this.attendees = {}; //[];
			
			// Incoming connections to cover
			// We key by the connection reference, and count the visitors on that connection
			this.connectionsToCoverByKey = {};
			
			for (var conn = 0; conn < this.incomingConnectionRefs.length; conn++)
			{
				var connKey = this.incomingConnectionRefs[conn].getStringKey();
				this.connectionsToCoverByKey[connKey] = 0; // counter of visitors along that connection
				// this counter should only ever be 0 or 1...
			}
			
			// We also keep a counter of the unique incoming connections crossed
			// We use this variable so we can have an O(1) lookup when trying to cross
			this.uniqueIncomingConnectionsCovered = 0; // none so far!
			
			// Finally, we keep one last variable for the number of unique Royal Guards
			// who have crossed unique connections - again, for O(1) lookup
			this.uniqueIncomingConnectionsCoveredByRoyalGuards = 0;
		},
		
		
		/*!	public function
			Attempt to add an attendee to the list, but only if it is new and
			crossed a valid connection to get this node! We also keep track of
			which connections have been crossed for faster lookup later on.
			Params:
				-attendee: Royal Guard or Pegasus
			Returns:
				-true: attendee was added
				-false: attendee could not be added to the list
		*/
		addUniqueAttendee: function(attendee)
		{
			// Is the attendee new to the list?
			if (!this.attendees.hasOwnProperty(attendee.getUniqueId()))
			{
				// Is the connection just crossed valid?
				if (getConnectionByRef(attendee.getLastConnectionRef()) != null)
				{
					// Fetch key of this attendee's recently crossed connection
					var connKey = attendee.getLastConnectionRef().getStringKey();
					
					// Does this And-Join own the connection?
					if (this.connectionsToCoverByKey.hasOwnProperty(connKey))
					{
						// Awesome! We can increment the counter there, and
						// store the attendee too!
						this.connectionsToCoverByKey[connKey]++;
						this.attendees[attendee.getUniqueId()] = attendee;
						
						// Can we increment the unique counters?
						if (this.connectionsToCoverByKey[connKey] == 1) // criteria just met
						{
							// Increment generic counter
							this.uniqueIncomingConnectionsCovered++;
							
							// Increment counter for Royal Guards?
							if (!attendee.isPegasus())
								this.uniqueIncomingConnectionsCoveredByRoyalGuards++;
						}
						
						// Attendee was just added
						return true;
					}
				}
			}
			
			// Attendee could not be added
			return false;
		},
		
		
		/*!	public function
			Remove an attendee from the unique attendees list
			Params:
				-attendee: Royal Guard or Pegasus
			Returns:
				-true: attendee was removed
				-false: attendee was not in the list
		*/
		removeUniqueAttendee: function(attendee)
		{
			// Is the attendee in the list?
			if (this.attendees.hasOwnProperty(attendee.getUniqueId()))
			{
				// Remove the attendee from the list
				delete this.attendees[attendee.getUniqueId()];
				
				// We can assume the connection is valid as per the function above
				var connKey = attendee.getLastConnectionRef().getStringKey();
				
				if (this.connectionsToCoverByKey.hasOwnProperty(connKey))
				{
					// We can decrement the counter on this connection
					this.connectionsToCoverByKey[connKey]--;
					
					// Can we decrement the unique counters?
					if (this.connectionsToCoverByKey[connKey] == 0) // criteria just failed
					{
						// Decrement generic counter
						this.uniqueIncomingConnectionsCovered--;
						
						// Decrement counter for Royal Guards?
						if (!attendee.isPegasus())
							this.uniqueIncomingConnectionsCoveredByRoyalGuards--;
					}
				}
				
				// Attendee was removed from the list
				return true;
			}
			
			// The attendee was not in the list
			return false;
		},
		
		
		/*!	public function - use with caution!
			Destroy all Royal Guards (not Pegasi) waiting at this And-Join.
			It is assumed the entity leaving this And-Join has already left.
		*/
		destroyAllWaitingRoyalGuards: function()
		{
			// Traverse all attendees
			for (var attendeeId in this.attendees)
			{
				// Do we have a Royal Guard?
				if (this.attendees.hasOwnProperty(attendeeId) && !this.attendees[attendeeId].isPegasus())
				{
					// Remove the Royal guard using the above method
					//this.removeUniqueAttendee(this.attendees[attendeeId]);
					// the above happens when I destroy the Royal Guard?
					
					// Now, delete the Royal Guard altogether --
					// Recall that attendees are keyed by their unique id!
					destroyRoyalGuardByUniqueId(attendeeId);
				}
			}
		},

		
		/*!	public function - use with more caution!
			Destroy all Royal Guards including those belonging to Pegasi waiting at this And-Join.
			It is assumed the entity leaving this And-Join has already left.
		*/
		destroyAbsolutelyAllWaiting: function()
		{
			// Delete all Pegasi (by destroying their parents) and Royal Guards
			for (var attendeeId in this.attendees)
			{
				// Can we use this object?
				if (this.attendees.hasOwnProperty(attendeeId))
				{
					// Fetch our attendee
					var royalGuardOrPegasus = this.attendees[attendeeId];
					
					// Remove the attendee from the list
					//this.removeUniqueAttendee(this.attendees[attendeeId]);
					// again, removed upon deletion?
					
					// Do we have a Royal Guard or a Pegasus?
					if (royalGuardOrPegasus.isPegasus())
					{
						// We need to destroy the entire Pegasi tree and the root
						// No entities in that tree are allowed to continue
						royalGuardOrPegasus.destroyEntirePegasiTreeAndRoot();
					}
					else
					{
						// Otherwise, just destroy the Royal Guard normally
						destroyRoyalGuardByUniqueId(attendeeId);
					}
				}
			}
		},
		
		
		/*!	public function
			Check to see if every incoming connection has a Royal Guard waiting
			Returns:
				-true|false
		*/
		isPassableByRoyalGuard: function()
		{
			return (this.uniqueIncomingConnectionsCoveredByRoyalGuards == this.incomingConnectionRefs.length);
		},
		
		
		/*!	public function
			We can only proceed past the And-Join if all incoming edges
			have been crossed by attendees.
			Returns:
				-[ConnectionRef]: array of size 1, if the passing condition is met
				-[]: empty array, if the passing conditions has not been met
		*/
		getNextConnectionRefs: function()
		{
			// Have all incoming connections been covered to allow us to proceed?
			if (this.uniqueIncomingConnectionsCovered >= this.incomingConnectionRefs.length)
				return this.outgoingConnectionRefs;
			
			// If the And-Join cannot be passed, we have no results
			return [];
		},
		
		
		/*!	public function
			Display debug information to the console
		*/
		showDebugMessage: function()
		{
			// String of Royal Guard / Pegasi IDs for debugging
			var attendee_ids_str = "";
			
			for (var attendeeId in this.attendees)
			{
				if (this.attendees.hasOwnProperty(attendeeId))
					attendee_ids_str += attendeeId + ", ";
			}
			
			// Remove final ", "
			attendee_ids_str = attendee_ids_str.slice(0, -2);
		
			// Begin debug string
			var debugString = "And-Join\n========\n"
				+ "uniqueIncomingConnectionsCovered = " + this.uniqueIncomingConnectionsCovered + "\n"
				+ "uniqueIncomingConnectionsCoveredByRoyalGuards = " + this.uniqueIncomingConnectionsCoveredByRoyalGuards + "\n"
				+ "attendees = {" + attendee_ids_str + "}";
			
			// Output the debug string
			console.log(debugString);
		}
	});
	
	
	/*!	private class
		A stub node can be thought of as a function call, in that it represents
		a lower-level 'function', i.e. spec diagram.
	*/
	var StubNode = Node.extend(
	{
		/*!	constructor
			Create a stub node given raw data from a UCM file
			Params:
				-rawNode: UCM data for a stub node
		*/
		init: function(rawNode)
		{
			// Call base constructor
			this._super(rawNode);
			
			// Store in-bindings
			this.inBindings = [];
			
			for (var inb = 0; inb < rawNode.bindings.incoming.length; inb++)
				this.inBindings.push(new InBinding(rawNode.bindings.incoming[inb]));
			
			// Store out-bindings
			this.outBindings = [];
			
			for (var out = 0; out < rawNode.bindings.outgoing.length; out++)
				this.outBindings.push(new OutBinding(rawNode.bindings.outgoing[out]));
		},
		
		
		/*! public function
			Given an incoming connection, find the appropriate start node within the stub map
			Params:
				-connectionRef: reference of the last edge crossed to get to this stub
			Returns:
				-StartPointNode: if a binding exists using the given connection
				-null: otherwise
		*/
		getStartPointNodeRefByConnectionRef: function(connectionRef)
		{
			// Check all in bindings until we find a match to return
			// In our defense, the number of inBindings should be very small [e.g. 5 or less]
			for (var inb = 0; inb < this.inBindings.length; inb++)
			{
				if (this.inBindings[inb].isStubEntryEqualTo(connectionRef))
					return this.inBindings[inb].startPointNodeRef;
			}
			
			// Otherwise, no match was found
			return null;
		},
		
		
		/*!	public function
			Get out binding given an index to one
			Params:
				-outBindingIndex: index to an outbinding
			Returns:
				-OutBinding: if the index is valid
				-null: otherwise
		*/
		getOutBindingByIndex: function(outBindingIndex)
		{
			if (outBindingIndex >= 0 && outBindingIndex < this.outBindings.length)
				return this.outBindings[outBindingIndex];
			return null;
		}
	});
	
	
	// SPECIFICATION DIAGRAMS --
	
	/*!	private class
		Spec(ification) Diagrams contain both nodes and connections.
		They are used to represent a single diagram within a UCM.
	*/
	var SpecDiagram = Class.extend(
	{
		/*! constructor
			Creates a Spec Diagram given the raw data from the UCM file
			Params:
				-rawSpecDiagram: a collection of raw data stored as an object
			Notes:
				See the init() method for this namespace for more details
		*/
		init: function(rawSpecDiagram)
		{
			// Create connections
			this.connections = [];
			for (var rc = 0; rc < rawSpecDiagram.rawConnections.length; rc++)
				this.connections.push(new Connection(rawSpecDiagram.rawConnections[rc]));
		
			// Array of nodes
			this.nodes = [];
			
			// Create each individual node
			for (var rn = 0; rn < rawSpecDiagram.rawNodes.length; rn++)
			{
				// Create node by its type				
				switch (rawSpecDiagram.rawNodes[rn].type)
				{
				case "ucm.map:StartPoint": // May want to use constants?
					this.nodes.push(new StartPointNode(rawSpecDiagram.rawNodes[rn]));
					break;
					
				case "ucm.map:EndPoint":
					this.nodes.push(new EndPointNode(rawSpecDiagram.rawNodes[rn]));
					break;
					
				case "ucm.map:RespRef":
					this.nodes.push(new RespRefNode(rawSpecDiagram.rawNodes[rn]));
					break;
				
				case "ucm.map:OrFork":
					this.nodes.push(new OrForkNode(rawSpecDiagram.rawNodes[rn]));
					break;
					
				case "ucm.map:AndFork":
					this.nodes.push(new AndForkNode(rawSpecDiagram.rawNodes[rn]));
					break;
					
				case "ucm.map:AndJoin":
					this.nodes.push(new AndJoinNode(rawSpecDiagram.rawNodes[rn]));
					break;
				
				case "ucm.map:Stub":
					this.nodes.push(new StubNode(rawSpecDiagram.rawNodes[rn]));
					break;
					
				default:
					this.nodes.push(new Node(rawSpecDiagram.rawNodes[rn]));
					break;
				}
			}
		},
		
		
		/*!	public function
			Get a node from this SpecDiagram by its index
			Params:
				-nodeIndex: an index into the nodes array
			Returns:
				-Node object from the index OR null, if the index is invalid
		*/
		getNodeByIndex: function(nodeIndex)
		{
			if (nodeIndex >= 0 && nodeIndex < this.nodes.length)
				return this.nodes[nodeIndex];
			return null;
		},
		
		
		/*!	public function
			Get a connection from this SpecDiagram by its index
			Params:
				-connectionIndex: an index into the connections array
			Returns:
				-Connection object from the index
				-null, if the index is invalid
		*/
		getConnectionByIndex: function(connectionIndex)
		{
			if (connectionIndex >= 0 && connectionIndex < this.connections.length)
				return this.connections[connectionIndex];
			return null;
		},
		
		
		/*!	public function
			Fetch an outbinding from a stub node given a reference
			Params:
				-outBindingRef: reference to out-binding
			Returns:
				-OutBinding: if the reference is valid
				-null: if the reference leads nowhere
			Notes:
				We assume that the specDiagramIndex refers this SpecDiagram.
		*/
		getOutBindingByRef: function(outBindingRef)
		{
			// Is the node valid AND a stub?
			if (outBindingRef.nodeIndex >= 0 && outBindingRef.nodeIndex < this.nodes.length &&
				this.nodes[outBindingRef.nodeIndex] instanceof StubNode)
				return this.nodes[outBindingRef.nodeIndex].getOutBindingByIndex(outBindingRef.outIndex);
			return null;
		}
	});
	
	
	// HELPER METHODS FOR SPEC DIAGRAMS --
	
	/*!	function
		A generic function to get a node given a node reference
		Params:
			-nodeRef: refers to a spec diagrams and a node
		Returns:
			-Node object, if the node reference leads somewhere
			-null, if no node object can be retrieved
	*/
	var getNodeByRef = function(nodeRef)
	{
		if (nodeRef != null && nodeRef.specDiagramIndex >= 0 && nodeRef.specDiagramIndex < m_specDiagrams.length)
			return m_specDiagrams[nodeRef.specDiagramIndex].getNodeByIndex(nodeRef.nodeIndex);
		return null;
	};
	
	
	/*!	function
		A generic function to get a connection given a connection reference
		Params:
			-connectionRef: refers to a spec diagrams and a connection
		Returns:
			-Connection object, if the connection reference leads somewhere
			-null, if no connection object can be retrieved
	*/
	var getConnectionByRef = function(connectionRef)
	{
		if (connectionRef != null && connectionRef.specDiagramIndex >= 0 && connectionRef.specDiagramIndex < m_specDiagrams.length)
			return m_specDiagrams[connectionRef.specDiagramIndex].getConnectionByIndex(connectionRef.connectionIndex);
		return null;
	};
	
	
	/*!	function
		A generic function to get an out-binding given a reference to one
		Params:
			-outBindingRef: reference to out-binding
		Returns:
			-OutBinding: if the reference is valid
			-null: if the reference leads nowhere
	*/
	var getOutBindingByRef = function(outBindingRef)
	{
		if (outBindingRef.specDiagramIndex >= 0 && outBindingRef.specDiagramIndex < m_specDiagrams.length)
			return m_specDiagrams[outBindingRef.specDiagramIndex].getOutBindingByRef(outBindingRef);
		return null;
	};
	
	
	// ROYAL GUARDS AND PEGASI --
	
	/*!	class
		Royal Guards represent where the player currently is along a path; however,
		Pegasi  represent hypothetically where the play could go.
		Pegasi are different. They just happen to use the same class.
	*/
	var RoyalGuardOrPegasus = Class.extend(
	{
		/*!	Constructor
			Creates a Royal Guard or Pegasus at an initial position
			Params:
				-initialNodeRef: reference to an initial node
				-stubNodeStackRef [optional]: array of references to stub nodes
				-parent [optional]: defaults to null, if provided we get a Pegasus
		*/
		init: function(initialNodeRef, stubNodeRefStack, parent)
		{
			// Set the current location
			this.currentNodeRef = initialNodeRef;
			
			// Set the parent, used for Pegasi
			this.parent = (parent === undefined) ? null : parent;
			
			// Unique id, used for reference with AndJoins and to easily differentiate
			this.uniqueId = getNextUniqueIdForRoyalGuardsAndPegasi();
			
			// Children pegasi for Or-Forks
			this.pegasi = [];
			
			// Path taken by this guard, specifically used for Pegasi
			// An array of *connection* references to cross
			this.connectionRefsTakenByPegasus = []; // stays empty otherwise
			
			// Reference to the last connection crossed
			this.lastConnectionRef = null; // none crossed yet
			
			// A stack of stub node references for whenever a stub is entered
			// This stack helps us determine where to go when we leave a stub
			// It is often necessary to copy from a previous Royal Guard or Pegasus
			this.stubNodeRefStack = (stubNodeRefStack === undefined) ? [] : stubNodeRefStack.slice(0);
			
			// Are we up for deletion?
			this.deleteMe = false;
		},
		
		
		/*!	public function
			Get the unique id of this entity
			Return:
				-int: unique id
		*/
		getUniqueId: function()
		{
			return this.uniqueId;
		},
		
		
		/*!	public function
			Get the last connection reference
			Returns:
				-ConnectionRef: reference to last connection crossed
		*/
		getLastConnectionRef: function()
		{
			return this.lastConnectionRef;
		},
		
		/*!	public function
			Can this Royal Guard or Pegasus be destroyed?
			This function really only applies to Royal Guards, as Pegasi
			are destroyed whenever a Royal Guard moves.
			Returns:
				-true|false
		*/
		canBeDestroyed: function()
		{
			return this.deleteMe;
		},
		
		
		/*!	public function
			Is this entity a pegasus? If it has a parent, then yes.
			Returns:
				-true|false
		*/
		isPegasus: function()
		{
			return (this.parent != null && this.parent instanceof RoyalGuardOrPegasus);
		},
		
		
		/*!	public function
			This method acts like a destructor, except it must be manually called
		*/
		destroy: function()
		{
			//console.log("Destroy " + (this.isPegasus() ? "Pegasus" : "Royal Guard") + " with id = " + this.uniqueId);
			
			// Fetch the current node
			var currentNode = getNodeByRef(this.currentNodeRef);
			
			// Unload the event this Royal Guard or Pegasus is at - providing it's at an event
			// Should affect Pegasi only? Royal Guards wouldn't be destroyed at an event...
			if (currentNode instanceof RespRefNode)
				currentNode.unloadEvent(this);
			// Decrement AndJoin counter, if we are at one
			else if (currentNode instanceof AndJoinNode)
			{
				currentNode.removeUniqueAttendee(this);
				//currentNode.showDebugMessage();
			}
		
			// Destroy all sub-Pegasi
			this.rainbowFactory();
		},
		
		
		/*!	private function
			Destroy all sub-pegasi
		*/
		rainbowFactory: function()
		{
			// Destroy all of the pegasi
			while (this.pegasi.length > 0)
			{
				var pegasusToDestroy = this.pegasi.pop();
				pegasusToDestroy.destroy();
			}
		},
		
		
		/*!	public function - use with extreme caution!
			This method acts like a destructor for the entire tree! It takes an arbitrary 'node'
			within the tree, finds the root, and then deletes the entire tree including its root!
		*/
		destroyEntirePegasiTreeAndRoot: function()
		{
			// Stop traversal and perform regular destroy() if there is no parent
			if (this.parent == null)
				destroyRoyalGuardByUniqueId(this.uniqueId); // we have to destroy ourselves this way to remove from the RoyalGuards array
			// Otherwise, we tell the parent to try, moving up the tree recursively
			else
				this.parent.destroyEntirePegasiTreeAndRoot();
		},
		
		
		/*!	public function
			Trot calls traverse() with some RoyalGuard-specific code; the method is
			used to begin the traversal allowing some non-recursive code
		*/
		trot: function()
		{
			// Destroy any sub-Pegasi before moving
			this.rainbowFactory();

			// Now we can traverse
			this.traverse();
		},
		
		
		/*!	public function
			Calls the generic traverse() method, and maybe something extra later on;
			this method is specific to Pegasi, but not yet used for any significant purpose
		*/
		flyAhead: function()
		{
			// Anything to do before we begin our turn?
			
			// Call traverse
			this.traverse();
		},
		
		
		/*!	private function
			Follow a given connection reference, to move the Royal Guard or Pegasus
			Params:
				-connectionRef: connection to follow
		*/
		followConnectionRef: function(connectionRef)
		{
			// Fetch the actual connection object
			var legalConnection = getConnectionByRef(connectionRef); // we assume there is exactly one connection
				
			// If there is a connection, let's move to its 'target' and then traverse on the new node
			if (legalConnection != null)
			{
				// Move to the target of the connection, effectively crossing it
				this.currentNodeRef = legalConnection.getTargetNodeRef();
				
				// We also want to store the connection reference, as it is useful to know where we came from
				this.lastConnectionRef = connectionRef;
			}
		},
		
		
		/*!	private function
			Walk through the map until we hit an event, get stuck, or need to create Pegasi
		*/
		traverse: function()
		{
			// Pegasi have an additional check to avoid loops before traversal;
			// they record connections crossed and stop on a duplicate.
			// Royal Guards should never get stuck, so we don't check them.
			// Further note that these connections are used in followPegasus().
			if (this.isPegasus() && this.lastConnectionRef != null)
			{
				// Stop if the connection has previously been added, as we would find ourselves in a loop
				// We give some leeway by ignoring the most recent connection - doing so prevents an error with stub entry
				// That -1 fixed was added on February 9th, 2013 by Matthew Shelley
				for (var point = 0; point < this.connectionRefsTakenByPegasus.length - 1; point++)
				{
					if (this.connectionRefsTakenByPegasus[point].isEqualTo(this.lastConnectionRef))
						return; // we cannot add this connection, because we would be in a loop
				}
				
				// If we survive the for-loop above, store the last connection reference
				this.connectionRefsTakenByPegasus.push(this.lastConnectionRef);
			}
			
			
			// --
			
			// Fetch the current node
			var currentNode = getNodeByRef(this.currentNodeRef);
			
			// We abort traversal if we do not find a node
			// This case *should not* happen
			if (currentNode == null)
				return;
			
			// Let's handle the node based on its type
			if (currentNode instanceof StubNode)
			{
				// This node is only handled when we *arrive* at the stub
				// If we are leaving the stub, the behaviour is handled by EndPoint

				// Push the stub node to the stack, so when we exit we know where to go
				this.stubNodeRefStack.push(this.currentNodeRef);
			
				// We simply lookup the start point for this connection and save it
				// Since we are using our current connection to reach the new point,
				// there is no new connection to save.
				this.currentNodeRef = currentNode.getStartPointNodeRefByConnectionRef(this.lastConnectionRef);
				
				// And traverse from the new point!
				this.traverse();
			}
			else if (currentNode instanceof EndPointNode)
			{
				// For End Points, we either terminate (mark for deletion) or exit a stub
				//console.log("REACHED AN END POINT (diagram: "
				//	+ this.currentNodeRef.specDiagramIndex + " id: " + this.currentNodeRef.nodeIndex + ")");
					
				// Is there a stub we can return to?
				if (this.stubNodeRefStack.length > 0)
				{
					// Fetch the connection and pop the stub
					var stubExitConnectionRef = currentNode.getStubExitConnectionRefFromStubNodeRef(this.stubNodeRefStack.pop());
					
					// Does this end point bind to a connection?
					if (stubExitConnectionRef != null)
					{
						// Follow the connection and then traverse
						this.followConnectionRef(stubExitConnectionRef);
						this.traverse();
					}
					else
					{
						//console.log("Unable to leave stub due to invalid stub node reference");
						// Flag for deletion
						this.deleteMe = true;
					}
				}
				else
				{
					//console.log("Stub node ref stack is empty! Unable to leave stub");
					// Flag for deletion
					this.deleteMe = true;
				}
			}
			else if (currentNode instanceof RespRefNode)
			{
				// If we land at an event, we can preload it and then stop traversal
				currentNode.preloadEvent(this);
				
				// We move away from events through 'onEventCall()'
			}
			else if (currentNode instanceof OrForkNode)
			{
				// With an Or-Fork, we need to create sub-Pegasi to explore further.
				// The paths ahead are hypothetical, so we cannot choose an exact path to follow
				// unless there is exactly one valid edge from the Or-Fork.
				
				// Fetch all valid edges, i.e. the ones whose conditions are true
				var legalConnectionRefs = currentNode.getNextConnectionRefs();
				
				// Is there exactly one edge we can follow?
				if (legalConnectionRefs.length == 1)
				{
					// Follow the connection and then traverse
					this.followConnectionRef(legalConnectionRefs[0]); // assume exactly one connection
					this.traverse();
				}
				else
				{
					// We need to create sub-Pegasi to explore each branched path ahead
					// Note that there should be no sub-Pegasi for this Royal Guard or Pegasus at this point!
					for (var conn = 0; conn < legalConnectionRefs.length; conn++)
					{
						// Place the new Pegasus at the Or-Join, and then manually push it forward
						// Doing so will let us keep track of the first connection crossed!
						
						// Create a pegasus
						this.pegasi.push(new RoyalGuardOrPegasus(this.currentNodeRef, this.stubNodeRefStack, this));
						
						// Push the Pegasus forward
						this.pegasi[conn].followConnectionRef(legalConnectionRefs[conn]);
						
						// Make the pegasus fly ahead - so it can explore
						this.pegasi[conn].flyAhead();
					}
				}
			}
			else if (currentNode instanceof AndForkNode)
			{
				// Fetch legal connections leaving the And-Fork
				var legalConnectionRefs = currentNode.getNextConnectionRefs();
				
				// Do we have a Pegasus or a Royal Guard?
				if (this.isPegasus())
				{
					// We have a Pegasus, so we need to create sub-Pegasi for each connection
					// We do it this way because we add Pegasi paths together
					for (var conn = 0; conn < legalConnectionRefs.length; conn++)
					{
						// Place the new Pegasus at the And-Fork, and then manually push it forward
						// Doing so will let us keep track of the first connection crossed!
						
						// Create a pegasus
						this.pegasi.push(new RoyalGuardOrPegasus(this.currentNodeRef, this.stubNodeRefStack, this));
						
						// Push the Pegasus forward
						this.pegasi[conn].followConnectionRef(legalConnectionRefs[conn]);
						
						// Make the pegasus fly ahead - so it can explore
						this.pegasi[conn].flyAhead();
					}
				}
				else
				{
					// When we have a Royal Guard, we can go down one path, but
					// we need to create other Royal Guards for the other paths
					for (var conn = 1; conn < legalConnectionRefs.length; conn++)
					{
						// Create Royal Guard at the And-Fork, and then move it along the connection
						var royalGuard = createRoyalGuard(this.currentNodeRef, this.stubNodeRefStack);
						royalGuard.followConnectionRef(legalConnectionRefs[conn]);
						royalGuard.trot();
					}
					
					// Continue on with this Royal Guard
					this.followConnectionRef(legalConnectionRefs[0]);
					this.trot();
				}
			}
			else if (currentNode instanceof AndJoinNode)
			{
				// When we arrive at an AndJoin node, we add ourself to its list
				currentNode.addUniqueAttendee(this);
				//currentNode.showDebugMessage();
				
				// We then try to proceed from it
				var legalConnectionRefs = currentNode.getNextConnectionRefs();
				
				// Can we proceed?
				if (legalConnectionRefs.length > 0)
				{
					// It's okay to proceed, but we need to handle a few cases...
					
					// Case 1: Pegasi can always pass
					if (this.isPegasus())
					{
						// Create a pegasus
						var pegasus = new RoyalGuardOrPegasus(this.currentNodeRef, this.stubNodeRefStack, this);
						this.pegasi.push(pegasus);
						
						// Push the Pegasus forward
						pegasus.followConnectionRef(legalConnectionRefs[0]);
						
						// Make the pegasus fly ahead - so it can explore
						pegasus.flyAhead();
						
						// I can merge this code with the option below :)
					}
					// Case 2: Royal Guard, but some Pegasi are at the And-Join
					else if (!currentNode.isPassableByRoyalGuard())
					{
						// We cannot proceed as a Royal Guard, because some Pegasi are
						// at the And-Join. We can only hypothetically move forward.
						// Note further that if we later to choose to move past the
						// And-Join, the other options will be removed!
						// ^ That behaviour is handled in followPegasus()
						
						// Create a pegasus
						var pegasus = new RoyalGuardOrPegasus(this.currentNodeRef, this.stubNodeRefStack, this);
						this.pegasi.push(pegasus);
						
						// Push the Pegasus forward
						pegasus.followConnectionRef(legalConnectionRefs[0]);
						
						// Make the pegasus fly ahead - so it can explore
						pegasus.flyAhead();
					}
					// Case 3: Royal Guard, and Royal Guards are on all incoming connections
					else
					{
						// Remove ourself from the And-Join
						currentNode.removeUniqueAttendee(this);
						
						// Follow the connection to escape the And-Join
						this.followConnectionRef(legalConnectionRefs[0]);
						
						// Inform the And-Join to destroy everyone else there
						// -- that is, destroy all of the Royal Guards
						currentNode.destroyAllWaitingRoyalGuards();
						
						// Now we can move forward
						this.traverse();
					}
				}
			}
			// For all other nodes including Or-Join, Empty Point, Direction Arrow, Waiting Place, and Starting Point
			else
			{
				// Many nodes follow a generic approach of following the one legal connection, if there is one
				
				// Fetch the legal connections
				var legalConnectionRefs = currentNode.getNextConnectionRefs();
				
				// Is there a connection to follow?
				// Sometimes we can't cross the connection yet
				if (legalConnectionRefs.length >= 1) // should only be 1, but just in case
				{
					// Follow the connection and then traverse
					this.followConnectionRef(legalConnectionRefs[0]);
					this.traverse();
				}
			}
		},
		
		
		/*!	exclusive function - should only be used by Event upon completion
			This method should only be called by the event this Royal Guard or Pegasus is
			attending, when that event has been completed. Essentially, we know we can
			now pass the event. It is assumed we are a RespRefNode / Event node.
		*/
		onEventCall: function()
		{		
			// Fetch the current node
			var currentNode = getNodeByRef(this.currentNodeRef);
			
			// Attempt to unload the event first
			currentNode.unloadEvent(this);
			
			// If we have a Pegasus, we need to inform its Royal Guard by compiling paths
			if (this.isPegasus())
			{
				//console.log("Pegasus (id: " + this.uniqueId + "; parent id: " + this.parent.uniqueId + ") completed an event");
				// First, store the new position and then notify the parent to follow
				// Eventually a parent Royal Guard will follow the compiled paths
				this.parent.followPegasus(this.connectionRefsTakenByPegasus);
			}
			else
			{
				// We fetch the current node, which is an event, and step forward so
				// we can bypass the 'block' in the normal traverse method.
				// We assume a connection exists because events have one outgoing edge.
				var legalConnectionRefs = currentNode.getNextConnectionRefs();
				this.followConnectionRef(legalConnectionRefs[0]);
			}
		},
		
		
		/*!	public function
			Moves along a path presented by a pegasus, which was previously speculative
			but is now confirmed. In order for this method to be called, we must have found
			a Pegasus at an event; thus, we know we will end at an *event*.
			Params:
				-pathToTake: [ConnectionRef] specifies each connection reference tocross
		*/
		followPegasus: function(pathToTake)
		{
			// If we are a Pegasus, we just add the path to the end
			// of our own, and then inform the parent
			if (this.isPegasus())
			{
				// If this Pegasus is at an And-Join, we need to remove it in order
				// to prevent deleting this entire sub-Pegasi tree and root!
				var currentNode = getNodeByRef(this.currentNodeRef);
				
				if (currentNode instanceof AndJoinNode)
					currentNode.removeUniqueAttendee(this);
				// ADDED BY MATTHEW SHELLEY ON FEBRUARY 21, 2013!
			
				this.parent.followPegasus(this.connectionRefsTakenByPegasus.concat(pathToTake));
				return;
			}
			
			// Otherwise, as a Royal Guard we need to walk the path given
			for (var conn = 0; conn < pathToTake.length; conn++)
			{
				// Note that the connection is *leaving* our current node!
				
				// Fetch the current node, which will be overwritten when we most
				var currentNode = getNodeByRef(this.currentNodeRef);
				
				// With And-Forks, we need to create Royal Guards for paths not taken
				if (currentNode instanceof AndForkNode)
				{
					// Fetch all outgoing connection of the And-Fork
					var legalConnectionRefs = currentNode.getNextConnectionRefs();
					
					// Traverse each edge to make a new Royal Guard
					for (var afconn = 0; afconn < legalConnectionRefs.length; afconn++)
					{
						// Do not create a Royal Guard for the path taken by *this* Royal Guard
						if (!legalConnectionRefs[afconn].isEqualTo(pathToTake[conn]))
						{
							// Create Royal Guard at the And-Fork, and then move it along the connection
							var royalGuard = createRoyalGuard(this.currentNodeRef, this.stubNodeRefStack);
							royalGuard.followConnectionRef(legalConnectionRefs[afconn]);
							
							// We don't have to call trot() because all Royal Guards are
							// moved again after this function is called.
						}
					}
				}
				// With And-Joins, we need to delete whomever is remaining
				else if (currentNode instanceof AndJoinNode)
				{
					// We may have a Royal Guard who needs to remove itself from the And-Join
					// ADDED BY MATTHEW SHELLEY ON FEBRUARY 23, 2013
					currentNode.removeUniqueAttendee(this);
					
					// Let's destroy absolutely every other attendee, but not this one (since it's not really there)
					currentNode.destroyAbsolutelyAllWaiting();
				}
				// With StubNodes, we need to push onto the stub node ref stack
				// Code added on February 19, 2013 by Matthew Shelley
				else if (currentNode instanceof StubNode)
					this.stubNodeRefStack.push(this.currentNodeRef);
				// With End Nodes, it makes sense to pop the stack as well
				// FEATURE NOT TESTED! ADDED February 23, 2013 by Matthew Shelley
				else if (currentNode instanceof EndPointNode)
					this.stubNodeRefStack.pop();
				
				// Move this Royal Guard alongs its connection
				this.followConnectionRef(pathToTake[conn]);
			}
			
			// Finally, we fetch the current node, which is an event, and step forward
			// We do this to bypass the event 'block' in the normal traverse() method
			var currentNode = getNodeByRef(this.currentNodeRef);
			var legalConnectionRefs = currentNode.getNextConnectionRefs();
			this.followConnectionRef(legalConnectionRefs[0]);
			
			// It may seem like we could copy this code to the onEventCall() method, but
			// that method would be handled by the Pegasus and not its Royal Guard
			
			// Okay, we can destroy all of our sub-Pegasi now
			this.rainbowFactory(); // Added February 8 to fix problem with "concurrent loops" example
		},
		
		
		/*!	public function
			Display an alert message containing Royal Guard data
		*/
		showDebugMessage: function()
		{
			// String of Pegasi IDs for debugging
			var pegasi_ids_array = [];
			for (var p = 0; p < this.pegasi.length; p++)
				pegasi_ids_array.push(this.pegasi[p].getUniqueId());
			var pegasi_ids_str = pegasi_ids_array.join(',');
			
		
			// Build debug string
			var debugString = (this.isPegasus() ? "Pegasus" : "Royal Guard") + "\n===========\n"
				+ "id: " + this.uniqueId + "\n"
				+ "#pegasi: " + this.pegasi.length + "\n"
				+ "ids of pegasi: [" + pegasi_ids_str + "]"
			
			console.log(debugString);
		}
	});
	
	
	// Private variables and their manipulation --
	
	/*!	private object / associative array
		Royal Guards represent the current positions within threads.
		The associative array is keyed by their unique id and stores the reference.
	*/
	var m_royalGuards = {};
	
	
	/*!	private function
		Create a Royal Guard, and then return it
		Params:
			-initalNodeRef: reference to the node at which to start
			-stubNodeRefStack [optional]: a stack of stub node references
		Returns:
			-RoyalGuard
	*/
	var createRoyalGuard = function(initalNodeRef, stubNodeRefStack)
	{
		// Create the Royal Guard
		var royalGuard = new RoyalGuardOrPegasus(initalNodeRef, stubNodeRefStack);
		
		// Fetch its unique id, and then add it to the associative array
		m_royalGuards[royalGuard.getUniqueId()] = royalGuard;
		
		// Return the Royal Guard so it can be immediately used elsewhere
		return royalGuard;
	};
	
	
	/*!	private function
		Destroy a royal guard given its unique id
		Params:
			-guardUniqueId: unique id of Royal Guard (read: not Pegasus) to destroy
	*/
	var destroyRoyalGuardByUniqueId = function(guardUniqueId)
	{
		// Destroy the royal guard if it exists
		if (m_royalGuards.hasOwnProperty(guardUniqueId))
		{
			m_royalGuards[guardUniqueId].destroy();
			delete m_royalGuards[guardUniqueId];
		}
	};
	
	
	/*!	private int
		Counter for each RoyalGuard and Pegasus so we can uniquely identify
		them, such as within And-Joins. Honestly, I'd prefer to use pointer
		addresses but they don't exist in JavaScript
	*/
	var m_uniqueIdForRoyalGuardsAndPegasi = 0;
	
	
	/*!	private function
		Get the next unique id for guards, incrementing the counter
	*/
	getNextUniqueIdForRoyalGuardsAndPegasi = function()
	{
		return m_uniqueIdForRoyalGuardsAndPegasi++;
	};
	
	
	/*!	private array
		The array of *every single* event in the game, but only the definitions.
		We can use these definitions to look up events when necessary.
	*/
	var m_events = []; // EVERY SINGLE EVENT IN THE GAME
	
	
	/*!	private object / associative array
		An associative array that returns the id of an event within m_events,
		given its unique name. Such names come from responsibilities.
	*/
	var m_eventNamesToIds = {};
	
	
	/*!	private array
		An array of all the event names for events that are currently legal to call.
		This feature is used so designers can determine how to handle sequence breaking.
	*/
	var m_legalEventNames = [];
	
	
	/*!	private array
		The array of all spec diagrams
	*/
	var m_specDiagrams = [];
	
	
	/*!	private object / associative array
		A collection of settings - the defaults are given here
	*/
	var m_settings = {}; // to be defined in init()
	

	// Public access --
	
	return {
		/*!	constructor
			Initialize the Narrative Manager by passing in the .jucm file and a scenario.
			Params:
				-jucmFile: a .jucm file, which is really XML definining a Use Case Map
				-scenarioName: a unique name of the scenario to use to start the narrative
				-eventsFile: [optional] a file containing scripts for all events
				-settings: [optional] a collection of settings to be overridden;
					settings differ because they are used beyond the init function
			Notes:
				If no scenarios are provided, the narrative manager can't do anything because
				it doesn't know where to begin.
		*/
		init: function(jucmFile, scenarioName, eventsFile, settings)
		{
			// Though this method is typically called just once, in our tesing tool
			// we allow it to be called multiple times to switch UCM examples.
			// For this reason, we wish to overwrite the data for this namespace.
			
			// Destroy all previous Royal Guards
			for (var rg in m_royalGuards)
			{
				if (m_royalGuards.hasOwnProperty(rg))
					destroyRoyalGuardByUniqueId(rg);
			}
			
			// Reduce the associative array, for clarity
			m_royalGuards = {};
			
			// Reset the counter
			m_uniqueIdForRoyalGuardsAndPegasi = 0;
			
			// Delete all events
			m_events.length = 0;
			
			// Empty event id to name
			m_eventNamesToIds = {};
			
			// Delete all legal event names
			m_legalEventNames.length = 0;
			
			// Delete all spec diagrams
			m_specDiagrams.length = 0;
			
			// Reset settings - probably not necessary
			m_settings =
			{
				onEventCall: SP_NM_ON_EVENT_CALL.MOVE_FIRST,
				onLoadCallback: null, // function to be called when the Narrative Manager loads the .jucm file
				onPreloadEventCallback: null,
				onUnloadEventCallback: null,
				//onIllegalEventCallback: null
			};
			
			// Delete all global variables and enums
			// Doing so avoids variables being saved when we switch UCMs
			ScriptedPixels.GameData.destroyAllGlobalVariablesAndEnums();
			
			// --
			
			// Override any settings given
			if (settings !== undefined)
			{
				// Override each individual setting
				for (var s in settings)
				{
					// Is the setting valid? Does it exist in our defaults?
					if (settings.hasOwnProperty(s) && m_settings.hasOwnProperty(s))
						m_settings[s] = settings[s];
				}
			}
		
			// Read in the .jucm file
			$.ajax({
				type: "GET",
				url: jucmFile,
				dataType: "xml",
				success: function(xml)
				{
					// Preliminary variables for storing information
					var scenario = {initializations: {}, startPoints: []};
					var variables = [];
					var enums = [];
					var responsibilities = []; // events
					var rawSpecDiagrams = []; // maps, aka stubs
					
					
					// PHASE 1: READ IN ALL NECESSARY DATA
			
					// Read <ucmspec>...</ucmspec> to get variables and enums
					var $ucmspecXML = $(xml).find('ucmspec').first();
					
					// Fetch the scenario
					var $scenarioXML = $ucmspecXML.find('scenarios[name="' + scenarioName + '"]');
					
					$scenarioXML.children('initializations').each(function()
					{
						// Associatve array stored by the variable index!
						// This is not necessarily an indexed array!
						// Not all variables will necessarily be given!
						
						// Fetch the variable index to use as a key
						var varIndex = parseInt(/\.([0-9]+)$/.exec($(this).attr('variable'))[1]);
						
						// Store the value with the index as a key
						scenario.initializations[varIndex] = $(this).attr('value');
					});
					
					$scenarioXML.children('startPoints').each(function()
					{
						scenario.startPoints.push(
						{
							enabled: $(this).attr('enabled'), // what is this for?
							startPoint: $(this).attr('startPoint') // I could just use this value alone
						});
					});
					
					// Store variables
					$ucmspecXML.children('variables').each(function()
					{
						variables.push(
						{
							name: $(this).attr('name'),
							type: $(this).attr('type'), // may be empty, in which case we have a boolean
							enumerationType: $(this).attr('enumerationType') // may be empty, otherwise references an enum by its index
						});
					});
					
					// Store enums
					$ucmspecXML.children('enumerationTypes').each(function()
					{
						enums.push(
						{
							name: $(this).attr('name'),
							values: $(this).attr('values'), // separated by commas
						});
					});
					
					
					// Read <urndef>...</urndef>
					var $urndefXML = $(xml).find('urndef').first();
					
					// Store responsibilities, which will actually be events
					$urndefXML.children('responsibilities').each(function()
					{
						responsibilities.push(
						{
							name: $(this).attr('name'),
							expression: $(this).attr('expression'), // am I keeping this or not? it's like a postcondition...
							respRefs: $(this).attr('respRefs') // responsibilities *can* exist in multiple places as duplicates!
							// it is possible to not have any references
						});
					});
					
					// Spec Diagrams
					$urndefXML.children('specDiagrams').each(function()
					{
						// Create a raw spec diagram
						var rawSpecDiagram = {rawNodes: [], rawConnections: []};
						
						// Store each raw node
						$(this).children('nodes').each(function()
						{
							var rawNode = {
								type: $(this).attr('xsi:type'),
								pred: $(this).attr('pred'), // may be empty, as with start point
								succ: $(this).attr('succ') // may be emtpy, as with end points
							};
							
							// A few properties are not supported
							
							// Start nodes have optional preconditions - that we do not currently support
							if (rawNode.type == "ucm.map:StartPoint") // MAKE A CONSTANT
							{
								rawNode.precondExpr = $(this).children('precondition').first().attr('expression');
								rawNode.inBindings = $(this).attr('inBindings');
							}
							// End nodes have optional postconditions - though I probably won't use them at all!
							else if (rawNode.type == "ucm.map:EndPoint") // MAKE A CONSTANT
							{
								var outBindings =
									$(this).attr('outBindings') !== undefined ?
									$(this).attr('outBindings') : "";
							
								rawNode.postcondExpr = $(this).children('postcondition').first().attr('expression');
								rawNode.outBindings = outBindings; // may be multiple?
							}
							// RespRef nodes refer to responsibilites
							if (rawNode.type == "ucm.map:RespRef") // MAKE A CONSTANT
							{
								rawNode.respDef = $(this).attr('respDef');
							}
							// Stubs have bindings
							else if (rawNode.type == "ucm.map:Stub") // MAKE A CONSTANT
							{
								// Fetch the bindings element
								var $bindings = $(this).children('bindings');
								
								// Add bindings attribute to the node								
								rawNode.bindings = {
									plugin: $bindings.attr('plugin'),
									incoming: [],
									outgoing: [],
									precondExpr: $bindings.find('precondition').first().attr('expression') // not sure why or how these are used
								};
								
								// Append incoming
								$bindings.children('in').each(function()
								{
									rawNode.bindings.incoming.push(
									{
										startPoint: $(this).attr('startPoint'),
										stubEntry: $(this).attr('stubEntry') // what is this used for?
									});
								});
								
								// Append outgoing
								$bindings.children('out').each(function()
								{
									rawNode.bindings.outgoing.push(
									{
										endPoint: $(this).attr('endPoint'),
										stubExit: $(this).attr('stubExit') // what is this used for?
									});
								});
							}
							
							// Add the node to the spec diagram
							rawSpecDiagram.rawNodes.push(rawNode);
						});
						
						// Store each raw connection
						$(this).children('connections').each(function()
						{
							// Is there a condition?
							var conditionExpr =
								$(this).find('condition').size() > 0 ?
								$(this).find('condition').first().attr('expression') :
								"";
						
							// Add the raw connection
							rawSpecDiagram.rawConnections.push(
							{
								type: $(this).attr('xsi:type'),
								source: $(this).attr('source'),
								target: $(this).attr('target'),
								inBindings: $(this).attr('inBindings'), // entering a stub
								outBindings: $(this).attr('outBindings'), // leaving a stub
								conditionExpr: conditionExpr
							});
						});
						
						// Now, store the raw spec diagram
						rawSpecDiagrams.push(rawSpecDiagram);
					});
					
					
					// PHASE 2: CREATE ENUMS, VARIABLES, AND INITIALIZE SCENARIO
					
					// Create ENUM data types
					for (var e = 0; e < enums.length; e++)
						ScriptedPixels.GameData.createEnumType(enums[e].name, enums[e].values);
						
					// Create variables with initial values from the scenario
					for (var v = 0; v < variables.length; v++)
					{
						// Determine the variable type, which may be an enum
						var varType;
						
						// Integer?
						if (/^int/i.test(variables[v].type))
							varType = "Int"; // USE A CONSTANT
						// Enum?
						else if (/^enum/i.test(variables[v].type))
						{
							// Which enum are we using?
							// "//@ucmspec/@enumerationTypes.0" -> use the first enum type
							// So, we just need the number after the last '.' to use as an index
							var enumIndex = parseInt(/\.([0-9]+)$/.exec(variables[v].enumerationType)[1]);
							
							// Set the type based on the enum
							varType = enums[enumIndex].name;
						}
						// Default to Bool
						else
							varType = "Bool";
					
						// Create the global variable, possibly with an initial value from the scenario
						if (scenario.initializations.hasOwnProperty(v))
						{
							// Do we have an enum?
							if (varType != "Bool" && varType != "Int") // SHOULD USE CONSTANTS
							{
								// Modify value for enums
								ScriptedPixels.GameData.createGlobalVariable(
									variables[v].name, varType,
									varType + "." + scenario.initializations[v]);
							}
							else
							{
								// Standard variable
								ScriptedPixels.GameData.createGlobalVariable(
									variables[v].name, varType,
									scenario.initializations[v]); // v is a key, not an index
							}
						}
						else
							ScriptedPixels.GameData.createGlobalVariable(variables[v].name, varType);
					}
					
					
					// PHASE 3: CREATE ALL EVENTS
					
					// Create each event from a responsibility
					// We also want to store a lookup by the unique name
					for (var r = 0; r < responsibilities.length; r++)
					{
						m_events.push(new Event(responsibilities[r], r));
						m_eventNamesToIds[responsibilities[r].name] = r;
					}
					
					
					// PHASE 4: CREATE SPEC DIAGRAMS WITH NODES AND CONNECTIONS
					
					// Create spec diagrams, which are individual maps (e.g. stubs)
					// We just pass in the raw data from above, and the constructor will do the rest
					// Note that this phase also creates nodes and connections
					for (var rsd = 0; rsd < rawSpecDiagrams.length; rsd++)
						m_specDiagrams.push(new SpecDiagram(rawSpecDiagrams[rsd]));
					
					
					// PHASE 5: PLACE ROYAL GUARDS AND BEGIN TRAVERSAL
					
					// Place a Royal Guard at each start point and then move it along
					for (var sp = 0; sp < scenario.startPoints.length; sp++)
					{
						// Create Royal Guard at the start point
						var royalGuard = createRoyalGuard(new NodeRef(scenario.startPoints[sp].startPoint));
						
						// Move the Royal Guard along
						royalGuard.trot();
					}
					
					
					// PHASE 6: LOAD EVENTS FILE TO SAVE EVENT SCRIPTS
					
					// Was an events file given to read in?
					if (eventsFile === undefined || eventsFile == "")
					{
						// If there wasn't, we still need to run the callback
						if (m_settings.onLoadCallback != null)
							m_settings.onLoadCallback();
						
						return; // abort if there wasn't
					}
					
					// Read in the .jucm file
					$.ajax({
						type: "GET",
						url: eventsFile,
						dataType: "xml",
						success: function(xml)
						{
							// Read <eventscripts>...</eventscripts> to get variables and enums
							var $eventscriptsXML = $(xml).find('eventscripts').first();
						
							// Read each <eventscript ...>...</eventscript> to get scripts
							$eventscriptsXML.children('eventscript').each(function()
							{
								// Fetch the event id and the script
								var eventName = $(this).attr('event');
								var script = $(this).text();
								
								// Assign script to an event, if possible
								if (m_eventNamesToIds.hasOwnProperty(eventName))
									m_events[m_eventNamesToIds[eventName]].assignScript(script);
							});
							
							// Finally, we run a callback function
							if (m_settings.onLoadCallback != null)
								m_settings.onLoadCallback();
						}
					});
				}
			});
		},
		
		
		/*!	public function
			Try to call an event, and then update the narrative structure
			Params:
				-eventId: unique index of the event to call
			Returns:
				-true: event was called, and will now act out
				-false: event was not called
		*/
		tryToCallEventById: function(eventId)
		{
			// Is the event index valid? Abort if not
			if (eventId < 0 || eventId >= m_events.length)
			{
				//console.log("Unable to call event: invalid event index (" + eventId + " of " + m_events.length + ")");
				return false; // unable to call event - ERROR MESSAGE INSTEAD?
			}
			
			// Is the event legal to call?
			if (!m_events[eventId].isLegalToCall())
			{
				//console.log("Unable to call event: the given event is not legal (" + eventId + ")");
				return false;
			}
			
			// Call the event, which will later move one or all of its attendees
			m_events[eventId].call();
			
			// While the event will now start to process, it is necessary
			// that we inform the caller we were able to call it
			return true;
		},
		
		
		/*!	public function
			This method simply converts an event name into an event id,
			and then calls the above method.
			Params:
				-eventName: unique event name
			Returns:
				-true: event was called, and will now act out
				-false: event was not called
		*/
		tryToCallEventByName: function(eventName)
		{		
			// Is the event name valid?
			if (m_eventNamesToIds.hasOwnProperty(eventName))
				return this.tryToCallEventById(m_eventNamesToIds[eventName]);
			
			// Error message
			//console.log("Unable to call event: invalid event name (" + eventName + ")");
			return false;
		},
		
		
		/*!	public function
			Fetch the array of legal event names
			Returns:
				-[string]: array of legal event names
		*/
		fetchAllLegalEventNames: function()
		{
			// Return a copy of the array, so it is not modified outside
			return m_legalEventNames.slice(0);
		}
	};
}();