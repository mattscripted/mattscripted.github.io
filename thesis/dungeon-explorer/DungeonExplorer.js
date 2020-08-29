// Copyright (c) 2013, Matthew Shelley. All rights reserved.

/*!	namespace
	The entire "Dungeon Explorer" demo is contained within this namespace
*/
var DungeonExplorer = function()
{
	// Private variables --
	
	/*!	private Room
		There is a single room in this demo that takes up the entire screen.
	*/
	var m_room = null;
	
	
	/*!	private Player
		The player object is persistent, and would not belong to a specific room
	*/
	var m_player = null;
	
	
	/*!	private int
		Index of the current canvas buffer
	*/
	var m_canvasBufferIndex = 0;
	
	
	/*!	private int?
		Time in milliseconds since the last update, otherwise -1 at start
	*/
	var m_lastUpdateTime = -1;
	
	
	/*!	private int
		The number of torches that have been found. Torches affect
		the radius of the visible area around the player.
	*/
	var m_numTorchesFound = 0;
	
	// We do not store the variable for the number of coins, as it is
	// handled by our ScriptManager and Narrative Manager
	
	
	/*!	private associative array
		A fast way to look up a switch id given an event name. This object
		is useful for preload() and unload() in O(1) time, instead of O(n).
	*/
	var m_eventNamesToSwitchIds = {};
	
	
	/*!	private bool
		A flag that should only ever be true once. When true, we can call
		the "Found All Coins" event. We add this feature simply to prevent
		repeated calls, which would be rejected. Ideally, I would have called
		the event after it was preloaded.
	*/
	var m_allowFoundAllCoinsOnce = false;
	

	// OBJECTS --
	
	/*!	private class
		A simple class to represent static objects, which can be walked over
	*/
	var Object = Class.extend(
	{
		/*!	constructor
			Create an object from an XML definition
			Params:
				-$xml: xml definition
		*/
		init: function($xml)
		{
			// unique id of the object
			this.objectId = $xml.attr('id');
			
			// Actual position in tiles, which contains some floating value;
			// this position is used while the entity moves from one tile to another.
			// Note that this position refers to the top-left coordinate of the enity's bounding box.
			this.actualTilePosition = new Vector2($xml.attr('tilex'), parseInt($xml.attr('tiley')));
			
			// Request tile position where the entity would like to move to, or is moving towards.
			// This position may be reverted if there an obstacle at the desired tile.
			// Note that this position refers to the top-left coordinate of the enity's bounding box.
			this.requestedTilePosition = this.actualTilePosition.copy();
			
			// The maximum speed at which an entity can travel between tiles
			this.speed = DEFAULT_OBJECT_SPEED;
			
			// Should this object be treated as collidable?
			this.collidable = false; // by default, all objects can be passed through
		},
		
		
		/*!	public function
			Tell the room to destroy this object
		*/
		destroy: function()
		{
			m_room.destroyObjectById(this.objectId);
		},
		
		
		/*!	public function
			Is this object collidable?
			Returns:
				-boolean
		*/
		isCollidable: function()
		{
			return this.collidable;
		},
		
		
		/*!	public function
			Get actual tile position
			Returns:
				-Vector2
		*/
		getActualTilePosition: function()
		{
			return this.actualTilePosition.copy();
		},
		
		
		/*!	public function
			Get actual tile position
			Returns:
				-Vector2
		*/
		getRequestedTilePosition: function()
		{
			return this.requestedTilePosition.copy();
		},
		
		
		/*!	public function
			Set the position of this object
			Params:
				-tilex: x position
				-tiley: y position
		*/
		setPosition: function(tilex, tiley)
		{
			// We need to update both position values!
			this.actualTilePosition = new Vector2(tilex, tiley);
			this.requestedTilePosition = this.actualTilePosition.copy();
		},
		
		
		/*!	public function
			Get the center point (in pixels) of the tile this object is located within
			Returns:
				-Vector2
		*/
		getCenterPixelPosition: function()
		{
			return new Vector2((this.actualTilePosition.x + 0.5) * TILE_SIZE_PX,
				(this.actualTilePosition.y + 0.5) * TILE_SIZE_PX);
		},
		
		
		/*!	public function
			Request that the entity move to the left one tile
		*/
		attemptToMoveLeft: function()
		{
			// We can only move if the entity has come to rest at a tile
			if (this.requestedTilePosition.equals(this.actualTilePosition))
			{
				// Set the direction facing
				this.directionFacing = DIR_FACE.WEST;
			
				// Check if the new tile is free before attempting to move there
				if (!m_room.isCollisionAt(Math.floor(this.actualTilePosition.x - 1), Math.floor(this.actualTilePosition.y)))
					this.requestedTilePosition.x = Math.floor(this.actualTilePosition.x - 1);
			}
		},
		
		
		/*!	public
			Request that the entity move to the right one tile
		*/
		attemptToMoveRight: function()
		{
			// We can only move if the entity has come to rest at a tile
			if (this.requestedTilePosition.equals(this.actualTilePosition))
			{
				// Set the direction facing
				this.directionFacing = DIR_FACE.EAST;
			
				// Check if the new tile is free before attempting to move there
				if (!m_room.isCollisionAt(Math.floor(this.actualTilePosition.x + 1), Math.floor(this.actualTilePosition.y)))
					this.requestedTilePosition.x = Math.floor(this.actualTilePosition.x + 1);
			}
		},
		
		
		/*!	public
			Request that the entity move up one tile
		*/
		attemptToMoveUp: function()
		{
			// We can only move if the entity has come to rest at a tile
			if (this.requestedTilePosition.equals(this.actualTilePosition))
			{
				// Set the direction facing
				this.directionFacing = DIR_FACE.NORTH;
			
				// Check if the new tile is free before attempting to move there
				if (!m_room.isCollisionAt(Math.floor(this.actualTilePosition.x), Math.floor(this.actualTilePosition.y - 1)))
					this.requestedTilePosition.y = Math.floor(this.actualTilePosition.y - 1);
			}
		},
		
		
		/*!	public
			Request that the entity move down one tile
		*/
		attemptToMoveDown: function()
		{
			// We can only move if the entity has come to rest at a tile
			if (this.requestedTilePosition.equals(this.actualTilePosition))
			{
				// Set the direction facing
				this.directionFacing = DIR_FACE.SOUTH;
			
				// Check if the new tile is free before attempting to move there
				if (!m_room.isCollisionAt(Math.floor(this.actualTilePosition.x), Math.floor(this.actualTilePosition.y + 1)))
					this.requestedTilePosition.y = Math.floor(this.actualTilePosition.y + 1);
			}
		},
		
		
		/*!	public function
			Additional helper method to call before step()
		*/
		onStepStart: function()
		{
			// Nothing to do... alter through polymorphism...
		},
		
		
		/*!	public function
			Step the object forward for one update
			Params:
				-dt_sec: time since last update in seconds
		*/
		step: function(dt_sec)
		{
			// Calculate vector from current location to target
			var actualToTarget = Vector2.subtract(this.requestedTilePosition, this.actualTilePosition);
			
			// It is assumed that the requestedTilePosition is valid!
			
			// If we will travel past the target, then let's snap to it
			// Otherwise, add a scaled portion of the vector the target
			if (this.speed * dt_sec > actualToTarget.magnitude())
				this.actualTilePosition = this.requestedTilePosition.copy();
			else
			{
				// Resize and add vector
				actualToTarget.resize(this.speed * dt_sec);
				this.actualTilePosition.addVector2(actualToTarget);
			}
		},
		
		
		/*!	public function
			Render the object to the canvas
		*/
		draw: function()
		{
			// Nothing to do, handle through polymorphism
		},
		
		
		/*!	public function
			Callback for when the player steps into the same tile as this object
		*/
		onPlayerOver: function()
		{
			// Nothing to do, handle through polymorphism
		}
	});
	
	
	/*!	private class
		Coins are collected by the player to unlock the ending.
		The player's goal is to collect coins to escape.
	*/
	var Coin = Object.extend(
	{
		/*!	public callback
			When the player steps into the same tile at this coin,
			we increment the global coin count and destroy this object
		*/
		onPlayerOver: function()
		{
			// Inform the Narrative Manager that coin has been collected
			if (ScriptedPixels.NarrativeManager.tryToCallEventByName("Collect Coin"))
			{
				// Destroy the coin on pickup
				this.destroy();
			}
		},
		
		
		/*!	public function
			Render the object to the canvas
			Params:
				-canvasId: id of the canvas to draw to
		*/
		draw: function(canvasId)
		{
			// Draw a yellow circle
			$(canvasId).drawArc({
				fillStyle: "#FFF200",
				x: (this.actualTilePosition.x + 0.5) * TILE_SIZE_PX,
				y: (this.actualTilePosition.y + 0.5) * TILE_SIZE_PX,
				radius: TILE_SIZE_PX / 4.0,
			});
		}
	});
	
	
	/*!	private class
		Torches increase the light around the player, making it easier to see
	*/
	var Torch = Object.extend(
	{
		/*!	public callback
			When the player steps into the same tile at this torch,
			we increment the torch count and destroy this object
		*/
		onPlayerOver: function()
		{
			m_numTorchesFound++;
			this.destroy();
		},
		
	
		/*!	public function
			Render the object to the canvas
			Params:
				-canvasId: id of the canvas to draw to
		*/
		draw: function(canvasId)
		{
			// Draw an orange triangle
			$(canvasId).drawPolygon({
				fillStyle: "#ff8827",
				x: (this.actualTilePosition.x + 0.5) * TILE_SIZE_PX,
				y: (this.actualTilePosition.y + 0.5) * TILE_SIZE_PX,
				radius: TILE_SIZE_PX / 4.0,
				sides: 3
			});
		}
	});
	
	
	/*!	private class
		Switches remove barriers blocking the player's progress.
		These switches reference events, to show our Narrative Manager in use :)
		
		Switches start off disabled, and then become enabled but not activated.
		Afterward, they can become disabled again or enabled and activated.
		Once a switch is activated, it cannot be disabled.
	*/
	var Switch = Object.extend(
	{
		/*!	constructor
			Create a switch, which references an event
			Params:
				-$xml: xml definition
		*/
		init: function($xml)
		{
			// Base constructor
			this._super($xml);
			
			// Fetch the associated eventn ame
			this.eventName = $xml.attr('eventname');
		
			// Is this switch enabled? By default, no, not until an event preloads it.
			this.enabled = SWITCHES_ALWAYS_ENABLED;
			
			// Has the switch been activated?
			this.activated = false;
			
			// Barrier to remove
			this.barrierToRemove = $xml.attr('removebarrier');
		},
		
		
		/*!	public function
			If a switch is not activated, change its enabled state.
			If a switch is enabled, it can become activated.
			Params:
				-enabled: turn on or off
		*/
		tryToSetEnabled: function(enabled)
		{
			// To test sequence breaking, we optionally disallow switches from ever being disabled
			if (SWITCHES_ALWAYS_ENABLED)
				this.enabled = true;
		
			// If the switch has been activated, it cannot be disabled
			this.enabled = (this.activated || enabled);
			
			//console.log("Switch (id: " + this.objectId + ") become " + (this.enabled ? "enabled" : "disabled"));
		},
		
		
		/*!	public callback
			When the player steps into the same tile at this torch,
			we increment the torch count and destroy this object
		*/
		onPlayerOver: function()
		{
			// Only when the switch is enabled but not activated can it become activated
			// when the player walks atop it. Otherwise, we do nothing.
			// Furthermore, a switch can only become activated when the Narrative Manager
			// considers its associated event legal to call.
			if ((this.enabled || SWITCHES_ALWAYS_ENABLED) && !this.activated)
			{
				// Try to call the event
				if (ScriptedPixels.NarrativeManager.tryToCallEventByName(this.eventName))
				{
					// The event was called successfully, so let's activate the switch
					this.activated = true;
					
					// Remove the associated barrier
					m_room.destroyObjectById(this.barrierToRemove);
				}
				else
				{
					// The player is trying to sequence break! Let's handle it...

					// Fetch all legal events
					var legalEventNames = ScriptedPixels.NarrativeManager.fetchAllLegalEventNames();
					
					// Move the player as we have detected sequence breaking
					handleSequenceBreaking(legalEventNames);
				}
			}
		},
		
		
		/*!	public function
			Render the switch to the canvas, based on one of three states
			Params:
				-canvasId: id of the canvas to draw to
		*/
		draw: function(canvasId)
		{
			// State 1: disabled
			if (!this.enabled && !SWITCHES_ALWAYS_ENABLED)
			{
				// Draw the disabled frame
				$(canvasId).drawRect({
					fillStyle: "#444",
					width: TILE_SIZE_PX,
					height: TILE_SIZE_PX,
					fromCenter: false,
					x: this.actualTilePosition.x * TILE_SIZE_PX,
					y: this.actualTilePosition.y * TILE_SIZE_PX
				});
				
				// Draw the inactive button
				$(canvasId).drawRect({
					fillStyle: "#888",
					width: TILE_SIZE_PX - SWITCH_FRAME_BORDER,
					height: TILE_SIZE_PX - SWITCH_FRAME_BORDER,
					x: (this.actualTilePosition.x + 0.5) * TILE_SIZE_PX,
					y: (this.actualTilePosition.y + 0.5) * TILE_SIZE_PX
				});
			}
			// State 2: Enabled, but not yet activated
			else if (!this.activated)
			{
				// Draw the disabled frame
				$(canvasId).drawRect({
					fillStyle: "#bbb",
					width: TILE_SIZE_PX,
					height: TILE_SIZE_PX,
					fromCenter: false,
					x: this.actualTilePosition.x * TILE_SIZE_PX,
					y: this.actualTilePosition.y * TILE_SIZE_PX
				});
				
				// Draw the inactive button
				$(canvasId).drawRect({
					fillStyle: "#00b", // note the colour is not the same as before!
					width: TILE_SIZE_PX - SWITCH_FRAME_BORDER,
					height: TILE_SIZE_PX - SWITCH_FRAME_BORDER,
					x: (this.actualTilePosition.x + 0.5) * TILE_SIZE_PX,
					y: (this.actualTilePosition.y + 0.5) * TILE_SIZE_PX
				});
			}
			// State 3: Switch has been activated
			else if (this.activated)
			{
				// Draw the disabled frame
				$(canvasId).drawRect({
					fillStyle: "#bbb",
					width: TILE_SIZE_PX,
					height: TILE_SIZE_PX,
					fromCenter: false,
					x: this.actualTilePosition.x * TILE_SIZE_PX,
					y: this.actualTilePosition.y * TILE_SIZE_PX
				});
				
				// Draw the inactive button
				$(canvasId).drawRect({
					fillStyle: "#004", // note the colour is not the same as before!
					width: TILE_SIZE_PX - SWITCH_FRAME_BORDER,
					height: TILE_SIZE_PX - SWITCH_FRAME_BORDER,
					x: (this.actualTilePosition.x + 0.5) * TILE_SIZE_PX,
					y: (this.actualTilePosition.y + 0.5) * TILE_SIZE_PX
				});
			}
		}
	});
	
	
	/*!	private class
		Barriers can be destroyed by switches.
	*/
	var Barrier = Object.extend(
	{
		/*!	constructor
			Create a barrier
			Params:
				-$xml: xml definition
		*/
		init: function($xml)
		{
			// Base constructor
			this._super($xml);
			
			// This object is collidable!
			this.collidable = true;
		},
		
		
		/*!	public function
			Draw the barrier to the canvas
			Params:
				-canvasId: canvas to draw to
		*/
		draw: function(canvasId)
		{
			// Draw the barrier with two lines crossing through
			$(canvasId).drawRect({
				fillStyle: "#888",
				width: TILE_SIZE_PX,
				height: TILE_SIZE_PX,
				fromCenter: false,
				x: this.actualTilePosition.x * TILE_SIZE_PX,
				y: this.actualTilePosition.y * TILE_SIZE_PX
			})
			.drawLine({
				strokeStyle: "#000",
				strokeWidth: 2,
				x1: this.actualTilePosition.x * TILE_SIZE_PX, y1: this.actualTilePosition.y * TILE_SIZE_PX,
				x2: (this.actualTilePosition.x + 1.0) * TILE_SIZE_PX, y2: (this.actualTilePosition.y + 1.0) * TILE_SIZE_PX
			})
			.drawLine({
				strokeStyle: "#000",
				strokeWidth: 2,
				x1: this.actualTilePosition.x * TILE_SIZE_PX, y1: (this.actualTilePosition.y + 1.0) * TILE_SIZE_PX,
				x2: (this.actualTilePosition.x + 1.0) * TILE_SIZE_PX, y2: this.actualTilePosition.y * TILE_SIZE_PX
			});
		}
	});
	
	
	/*!	private class
		A trigger activates an event only once when the player steps on it.
		Once the associated event completes, the trigger cannot be reactivated.
	*/
	var Trigger = Object.extend(
	{
		/*!	constructor
			Create a trigger, which references an event
			Params:
				-$xml: xml definition
		*/
		init: function($xml)
		{
			// Base constructor
			this._super($xml);
			
			// Fetch the associated eventn ame
			this.eventName = $xml.attr('eventname');
			
			// Has the event been called?
			this.hasBeenCalledOnce = false;
		},
		
		
		/*! public function
			Trigger the event when the player is over the trigger.
			We can only trigger the event once.
		*/
		onPlayerOver: function()
		{
			// Has the event been called yet?
			// Try to call the event
			if (!this.hasBeenCalledOnce)
			{
				// Try to call the event
				if (ScriptedPixels.NarrativeManager.tryToCallEventByName(this.eventName))
				{
					// Prevent the trigger from being used again
					this.hasBeenCalledOnce = true;
				}
				else
				{
					// The player is trying to sequence break! Let's handle it...

					// Fetch all legal events
					var legalEventNames = ScriptedPixels.NarrativeManager.fetchAllLegalEventNames();
					
					// Move the player as we have detected sequence breaking
					handleSequenceBreaking(legalEventNames);
				}
			}
		}
	});
	
	
	/*!	private class
		The player is the only movable object in the game
	*/
	var Player = Object.extend(
	{
		/*!	constructor
			Create the player
			Params:
				-$xml: xml definition
		*/
		init: function($xml)
		{
			// Base constructor
			this._super($xml);
			
			//Time since change of direction
			this.lastDirectionChangeTime = -1;
			
			// Direction the player is facing
			this.directionFacing = DIR_FACE.SOUTH;
		},
		
		
		/*!	public function
			Set the direction of the player
			Params:
				-direction: see DIR_FACE for possible values
		*/
		setDirection: function(direction)
		{
			this.directionFacing = direction;
		},
		
		
		/*!	public function
			Additional helper method to call before the player steps
		*/
		onStepStart: function()
		{
			// Check the current time in milliseconds
			var currentTimeMs = (new Date()).getTime();
			
			// When the player changes direction, they FIRST turn around.
			// Afterward the player move forward in their new direction!
			if (ScriptedPixels.InputManager.isKeyDown(SP_IN_VKEYS.ARROW_LEFT))
			{
				// Is the player already facing left?
				if (this.directionFacing == DIR_FACE.WEST)
				{
					// Has the timer been satisfied?
					if (currentTimeMs - this.lastDirectionChangeTime > DELAY_FOR_DIRECTION_CHANGE)
						this.attemptToMoveLeft();
				}
				else
				{
					// Face left and set a timer until the player can move
					this.directionFacing = DIR_FACE.WEST;
					this.lastDirectionChangeTime = new Date();
				}
			}
			else if (ScriptedPixels.InputManager.isKeyDown(SP_IN_VKEYS.ARROW_RIGHT))
			{
				// Is the player already facing right?
				if (this.directionFacing == DIR_FACE.EAST)
				{
					// Has the timer been satisfied?
					if (currentTimeMs - this.lastDirectionChangeTime > DELAY_FOR_DIRECTION_CHANGE)
						this.attemptToMoveRight();
				}
				else
				{
					// Face left and set a timer until the player can move
					this.directionFacing = DIR_FACE.EAST;
					this.lastDirectionChangeTime = new Date();
				}
			}
			else if (ScriptedPixels.InputManager.isKeyDown(SP_IN_VKEYS.ARROW_UP))
			{
				// Is the player already facing up?
				if (this.directionFacing == DIR_FACE.NORTH)
				{
					// Has the timer been satisfied?
					if (currentTimeMs - this.lastDirectionChangeTime > DELAY_FOR_DIRECTION_CHANGE)
						this.attemptToMoveUp();
				}
				else
				{
					// Face left and set a timer until the player can move
					this.directionFacing = DIR_FACE.NORTH;
					this.lastDirectionChangeTime = new Date();
				}
			}
			else if (ScriptedPixels.InputManager.isKeyDown(SP_IN_VKEYS.ARROW_DOWN))
			{
				// Is the player already facing down?
				if (this.directionFacing == DIR_FACE.SOUTH)
				{
					// Has the timer been satisfied?
					if (currentTimeMs - this.lastDirectionChangeTime > DELAY_FOR_DIRECTION_CHANGE)
						this.attemptToMoveDown();
				}
				else
				{
					// Face left and set a timer until the player can move
					this.directionFacing = DIR_FACE.SOUTH;
					this.lastDirectionChangeTime = new Date();
				}
			}
		},
		
		
		/*!	public function
			Draw the player to the game canvas
			Params:
				-canvasId: canvas to draw to
		*/
		draw: function(canvasId)
		{
			// Draw an orange triangle
			$(canvasId).drawArc({
				fillStyle: "#000088",
				x: (this.actualTilePosition.x + 0.5) * TILE_SIZE_PX,
				y: (this.actualTilePosition.y + 0.5) * TILE_SIZE_PX,
				radius: TILE_SIZE_PX / 2.5,
			});
			
			// Draw a character to indicate the direction
			var directionLabel;	
			if (this.directionFacing == DIR_FACE.NORTH) directionLabel = '^';
			else if (this.directionFacing == DIR_FACE.EAST) directionLabel = '>';
			else if (this.directionFacing == DIR_FACE.WEST) directionLabel = '<';
			else directionLabel = 'v';
			
			$(canvasId).drawText({
				fillStyle: "#fff",
				x: (this.actualTilePosition.x + 0.5) * TILE_SIZE_PX,
				y: (this.actualTilePosition.y + 0.5) * TILE_SIZE_PX,
				font: "16pt Verdana, sans-serif",
				text: directionLabel
			});
		}
	});

	
	// ROOM --
	
	/*!	private class
		A room contains objects, a background image, and set of collidable tiles.
	*/
	var Room = Class.extend(
	{
		/*!	constructor
			Create the room and its objects given an XML definition
			Params:
				-$xml: definition
		*/
		init: function($xml)
		{
			// Closure for internal functions
			var _this = this;
		
			// Is the room ready for use?
			this.ready = false;
			
			// Store room width and height in tiles
			this.widthInTiles = $xml.attr('tilewidth');
			this.heightInTiles = $xml.attr('tileheight');
			
			// Load the background image
			this.backgroundImageSource = $xml.attr('backgroundimage');
			
			// Preload the image, and update the ready flag when it has been loaded
			$("<img/>")
				.attr("src", this.backgroundImageSource)
				.load(function() {_this.ready = true;});
				
			// Store a 1D array of collision booleans
			this.collisions = [];
			
			// Fetch the raw string of collision data; leave only 0s and 1
			// then convert to an array of strings
			var collisionRawString = $xml.children('collisiontiles').first().text();
			var collisionsAsStrings = collisionRawString.replace(/[^01]/g, '').split('');

			// Convert the values to boolean for the final array
			for (var c = 0; c < collisionsAsStrings.length; c++)
				 this.collisions.push(collisionsAsStrings[c] == '1');	
				
			// Store all objects in an associative array, keyed by their unique id
			this.objects = [];

			var $objectsXML = $xml.find('objects').first();
			$objectsXML.children('object').each(function()
			{
				// Fetch the object type and unique id
				var objectId = $(this).attr('id');
				var objectType = $(this).attr('type');
				
				switch (objectType)
				{
				case "Coin":
					_this.objects[objectId] = new Coin($(this));
					break;
				case "Torch":
					_this.objects[objectId] = new Torch($(this));
					break;
				case "Switch":
					_this.objects[objectId] = new Switch($(this));
					break;
				case "Barrier":
					_this.objects[objectId] = new Barrier($(this));
					break;
				case "Trigger":
					_this.objects[objectId] = new Trigger($(this));
					break;
				}
			});
		},
		
		
		/*!	public function
			Update the room for a single frame.
			Params:
				-dt_sec: time in seconds since last update
		*/
		update: function(dt_sec)
		{
			// Call onStepStart() for all objects and the player
			for (var obj in this.objects)
			{
				if (this.objects.hasOwnProperty(obj))
					this.objects[obj].onStepStart();
			}
			
			if (m_player != null)
				m_player.onStepStart();
				
			// Step all objects and the player
			for (var obj in this.objects)
			{
				if (this.objects.hasOwnProperty(obj))
					this.objects[obj].step(dt_sec);
			}
			
			if (m_player != null)
				m_player.step(dt_sec);
				
			// Has the player stepped on an object?
			if (m_player != null)
			{
				for (var obj in this.objects)
				{
					if (this.objects.hasOwnProperty(obj) &&
						m_player.getRequestedTilePosition().equals(this.objects[obj].getRequestedTilePosition()))
						this.objects[obj].onPlayerOver();
				}
			}
		},
		
		
		/*!	public function
			Draw the room and all of its objects. We also
			handle a mask around the player.
			Params:
				-canvasId: id of the canvas to draw to
		*/
		draw: function(canvasId)
		{
			// Is the torch mask enabled? Sometimes it's disabled for debugging
			if (TORCH_MASK_ENABLED)
			{
				// Draw a black overlay, in which a mask will be cut out
				$(canvasId).drawRect({
					fillStyle: "#000",
					width: SP_CANVAS_WIDTH,
					height: SP_CANVAS_HEIGHT,
					fromCenter: false,
					x: 0, y: 0
				});
				
				// Create the mask, for the player's sight
				var sightCenter = m_player.getCenterPixelPosition();
	
				$(canvasId).drawArc({
					fillStyle: "#000",
					x: sightCenter.x, y: sightCenter.y,
					radius: TILE_SIZE_PX * Math.sqrt(m_numTorchesFound + 2),
					mask: true
				});
			}
			
			// Draw background image
			$(canvasId).drawImage({
				source: this.backgroundImageSource,
				x: 0, y: 0,
				fromCenter: false,
			});
			
			// Draw all objects
			for (var obj in this.objects)
			{
				// Ask the object if it is located at (tilex, tiley)
				if (this.objects.hasOwnProperty(obj))
					this.objects[obj].draw(canvasId);
			}
			
			// Draw player
			if (m_player != null)
				m_player.draw(canvasId);
				
			// Remove the mask on the room
			if (TORCH_MASK_ENABLED)
				$(canvasId).restoreCanvas();
		},
		
		
		/*!	public function
			Fetch an object given its unique id
			Params:
				-objectId
			Returns:
				-Object: if found
				-null: otherwise
		*/
		getObjectById: function(objectId)
		{
			if (this.objects.hasOwnProperty(objectId))
				return this.objects[objectId];
			return null;
		},
		
		
		/*!	public function
			Destroy an object given its unique id
			Params:
				-objectId
			Returns:
				-true: object was destroyed
				-false: otherwise
		*/
		destroyObjectById: function(objectId)
		{
			// Does the object exist?
			if (this.objects.hasOwnProperty(objectId))
			{
				// Delete the object
				delete this.objects[objectId];
			
				// Object found and deleted
				return true;
			}
			
			// Object not found!
			return false;
		},
		

		/*!	public boolean
			Is there a collision at tile (x,y)? Also accounts for entities there.
			Params:
				-int tilex: x tile
				-int tiley: y tile
			Returns:
				-boolean: true if a collision exists, false otherwise
		*/
		isCollisionAt: function(tilex, tiley)
		{
			// Was a valid tile given? If not, assume a collision as we are off the map
			if (tilex < 0 || tilex >= this.widthInTiles || tiley < 0 || tiley >= this.heightInTiles)
				return true; // We always disallow walking off the map!
				
			// If walk-through-walls is on, we ignore all collisions
			if (WALK_THROUGH_WALLS)
				return false;
			
			// Is the current tile collidable?
			if (this.collisions[(tiley * this.widthInTiles) + tilex])
				return true;
				
			// Otherwise, let's check all objects
			// We can ignore a 'self' check, because the player is treated separately
			// Also, the player is only the object that would ask about a collision
			for (var obj in this.objects)
			{
				// Requested entity tile position
				var objectPosition;
				
				// Check if an entity wants to be at that tile queried
				if (this.objects.hasOwnProperty(obj) && this.objects[obj].isCollidable())
				{
					entityPosition = this.objects[obj].getRequestedTilePosition();
					
					if (entityPosition.x == tilex && entityPosition.y == tiley)
						return true;
				}
			}
			
			// By default, no collision
			return false;
		}
	});
	
	
	// GAME LOOP --
	
	/*!	private function
		The majority of the game happens in this loop. Due to the simple
		nature of our game, we make the game loop very trivial.
	*/
	var gameLoop = function()
	{
		// How long since the last frame? First frame is treated as 0
		dt_sec = ((m_lastUpdateTime < 0) ? 0 : (new Date()).getTime() - m_lastUpdateTime) / 1000.0;
		
		// Update state
		updateState(dt_sec);
		
		// Render frame
		renderFrame();
		
		// Store the new update time
		m_lastUpdateTime = (new Date()).getTime();
	};
	
	
	/*!	private
		Update game state
		Params:
			-dt_sec: time in seconds since last call
	*/	
	var updateState = function(dt_sec)
	{
		// Toggle 'constants' for debugging and demonstration purposes
		if (ScriptedPixels.InputManager.isKeyJustPressed('Q'.charCodeAt(0)))
			TORCH_MASK_ENABLED = !TORCH_MASK_ENABLED;
		else if (ScriptedPixels.InputManager.isKeyJustPressed('W'.charCodeAt(0)))
			WALK_THROUGH_WALLS = !WALK_THROUGH_WALLS;
		else if (ScriptedPixels.InputManager.isKeyJustPressed('E'.charCodeAt(0)))
			SWITCHES_ALWAYS_ENABLED = !SWITCHES_ALWAYS_ENABLED;
		
		// Update the ScriptManager
		if (!ScriptedPixels.ScriptManager.update(dt_sec))
		{
			// We only update the room, if the ScriptManager was not busy
			if (m_room != null)
				m_room.update(dt_sec);
				
			// Have we just found all coins? We can just try to call the event :)
			if (m_allowFoundAllCoinsOnce)
			{
				//console.log("FOUND ALL COINS ONCE");
				ScriptedPixels.NarrativeManager.tryToCallEventByName("Found All Coins");
				m_allowFoundAllCoinsOnce = false;
			}
		}
		
		// Update key states
		ScriptedPixels.InputManager.updateKeysAfterFrame();
	};
	
	
	/*!	private
		Render a single frame to a double-buffered canvas
	*/
	var renderFrame = function()
	{
		// Swap canvas buffer
		m_canvasBufferIndex = 1 - m_canvasBufferIndex; // toggles between 0 and 1
		var currentCanvasId = SP_CANVAS_BUFFER_IDS[m_canvasBufferIndex];
		
		// Clear frame
		$(currentCanvasId).clearCanvas();
		
		// Save state for reversion
		$(currentCanvasId).saveCanvas();
		
		// Draw room
		if (m_room != null)
			m_room.draw(currentCanvasId);
			
		// Occasionally, the ScriptManager likes to draw
		ScriptedPixels.ScriptManager.draw(currentCanvasId);
		
		// Restore canvas state/matric
		$(currentCanvasId).restoreCanvas();
		
		// Now that the drawing has completed, hide the previous buffer and show the updated one
		$(SP_CANVAS_BUFFER_IDS[1-m_canvasBufferIndex]).hide();
		$(SP_CANVAS_BUFFER_IDS[m_canvasBufferIndex]).show();
	};
	
	
	// Narrative Manager callbacks --
	
	/*!	private function
		Preload an event, given the name of one
		Params:
			-eventName: string for an event name
	*/
	var preloadEventByName = function(eventName)
	{
		//console.log("Dungeon Explorer wants to preload: " + eventName);
		
		// Is the event associated with a switch?
		if (m_eventNamesToSwitchIds.hasOwnProperty(eventName))
		{
			// Enable the switch, if we can access it
			if (m_room != null)
			{
				// Fetch switch
				var switchObject = m_room.getObjectById(m_eventNamesToSwitchIds[eventName]);
				
				if (switchObject != null)
					switchObject.tryToSetEnabled(true);
			}
			
			return;
		}
		
		// Have we just found all coins?
		if (eventName == "Found All Coins")
			m_allowFoundAllCoinsOnce = true;
			
		// Remove a barrier for the end of the game
		if (eventName == "End Game")
		{
			//console.log("TRY TO REMOVE FINAL BARRIER");
			if (m_room != null)
				m_room.destroyObjectById("Barrier-Final");
		}
		
		// Other events could be handled here as well :p
	};
	
	
	/*!	private function
		Unload an event, given the name of one
		Params:
			-eventName: string for an event name
	*/
	var unloadEventByName = function(eventName)
	{
		//console.log("Dungeon Explorer wants to unload: " + eventName);
		
		// Is the event associated with a switch?
		if (m_eventNamesToSwitchIds.hasOwnProperty(eventName))
		{
			// Disable the switch, if we can access it
			if (m_room != null)
			{
				// Fetch switch
				var switchObject = m_room.getObjectById(m_eventNamesToSwitchIds[eventName]);
				
				if (switchObject != null)
					switchObject.tryToSetEnabled(false);
			}
		}
	};
	
	
	/*!	private function
		Handle sequence breaking, given an array of legal event names, by moving
		the player to a location associated with the first event.
		Params:
			-legalEventNames: an array of all current legal events
	*/
	var handleSequenceBreaking = function(legalEventNames)
	{
		// For now, we just reset the player to the starting position
		ScriptedPixels.ScriptManager.run("SHOW_MESSAGE:\n\tSequence breaking detected!\n\tReturning to start position...");
		
		if (m_player != null)
		{
			m_player.setPosition(1, 1);
			m_player.setDirection(DIR_FACE.SOUTH);
		}
	};
	
	
	// Public access --

	return {
		/*! constructor
			Initialize the game, just once!
			Params:
				-gameDataFile: xml file containing game data
		*/
		init: function(gameDataFile)
		{
			// Read in the game data file
			$.ajax({
				type: "GET",
				url: gameDataFile,
				dataType: "xml",
				success: function(xml)
				{
					// Read in <gamedata>...</gamedata>
					var $gamedataXML = $(xml).find('gamedata').first();
					
					// Read in <room>...</room>
					var $roomXML = $gamedataXML.find('room').first();
					
					// Create the room by passing in the XML
					m_room = new Room($roomXML);
					
					// Fetch <playerstart ... />
					var $playerstartXML = $gamedataXML.find('playerstart').first();
					
					// Create the player at the start position
					m_player = new Player($gamedataXML.find('playerstart').first());
					
					// Read in <narrative ... />
					var $narrativeXML = $gamedataXML.find('narrative').first();
					
					// Fetch all switches that are associated with events
					// We do this so we know which switches to handle with O(1) lookup
					$roomXML.find('object[type="Switch"]').each(function()
					{
						m_eventNamesToSwitchIds[$(this).attr('eventname')] = $(this).attr('id');
					});
					
					
					// Launch Narrative Manager
					ScriptedPixels.NarrativeManager.init(
						$narrativeXML.attr('jucmfile'),
						$narrativeXML.attr('scenarioname'),
						$narrativeXML.attr('eventsfile'),
						{
							onLoadCallback: function()
							{
								// Register callbacks for input
								$(document).keydown(function(event) {ScriptedPixels.InputManager.keydownCallback(event);});
								$(document).keyup(function(event) {ScriptedPixels.InputManager.keyupCallback(event);});
								
								// Launch the game loop - slightly modified from:
								// http://nokarma.org/2011/02/02/javascript-game-development-the-game-loop/index.html
								if (window.webkitRequestAnimationFrame)
								{
									window.onEachFrame = function(cb)
									{
										var _cb = function() {cb(); window.webkitRequestAnimationFrame(_cb);}
										_cb();
									};
								}
								else if (window.mozRequestAnimationFrame)
								{
									window.onEachFrame = function(cb)
									{
										var _cb = function() {cb(); window.mozRequestAnimationFrame(_cb);}
										_cb();
									};
								}
								else
								{
									window.onEachFrame = function(cb) {setInterval(cb, 30);}; // ~30 fps
								}
								
								// Register the game loop
								window.onEachFrame(gameLoop);
								
								// Once the demo has been setup, let's call our first event :)
								ScriptedPixels.NarrativeManager.tryToCallEventByName("Instructions");
							},
							
							onPreloadEventCallback: function(eventName)
							{
								preloadEventByName(eventName);
							},
							
							onUnloadEventCallback: function(eventName)
							{
								unloadEventByName(eventName);
							}
						}
					);
				}
			});
		}
	};
}();