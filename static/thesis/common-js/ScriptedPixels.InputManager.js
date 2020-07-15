// Copyright (c) 2013, Matthew Shelley. All rights reserved.

/*!	singleton class
	Handle keyboard input
*/
ScriptedPixels.InputManager = function()
{
	// Private variables --

	/*!	private
		Associative array of keys with boolean values where
		true indicates first press, false indicates repeat
	*/
	m_keysForCurrentFrame = {}; // associative array by character code
	
	
	/*!	private
		The most-recently updated associative array of keys, which
		overrides the current frame's key when the frame finishes
	*/
	m_keysFromEventCallbacks = {};
	
	
	// Public access --
	
	return {
		/*!	private, callback
			Record a key that was just pushed
			Params:
				-event: returned from jQuery method
		*/
		keydownCallback: function(event)
		{
			m_keysFromEventCallbacks[event.which] = true; // true indicates first press
			event.stopPropagation();
			return false;
		},
		
		
		/*!	private, callback
			Remove a key that was just released
			Params:
				-event: returned from jQuery method
		*/
		keyupCallback: function(event)
		{
			delete m_keysFromEventCallbacks[event.which];
			event.stopPropagation();
			return false;
		},
		
	
		/*!	public, to be called only from ScriptedPixels once per frame!
			Update keys after a frame/tick/update
		*/
		updateKeysAfterFrame: function()
		{		
			// Delete keys which have been removed
			for (var delkey in m_keysForCurrentFrame)
			{
				if (!m_keysFromEventCallbacks.hasOwnProperty(delkey))
					delete m_keysForCurrentFrame[delkey];
			}
			
			// Update keys which remain - or add a new key, if necessary
			for (var updatekey in m_keysFromEventCallbacks)
			{
				// Did this key exist before?
				if (m_keysForCurrentFrame.hasOwnProperty(updatekey))
					m_keysForCurrentFrame[updatekey] = false; // no longer first press
				else
					m_keysForCurrentFrame[updatekey] = true; // create and set as first press
			} // I could reduce this code, but it's more obvious to understand this way
			
			// Keep in mind that these arrays will be very small! At most they should be 3 keys,
			// but realistically only 1 or 2 at a given moment!
		},
		
		
		/*!	public
			Check if a key is down
			Params:
				-key: key to check
			Returns:
				-boolean, true|false if key is down
		*/
		isKeyDown: function(key)
		{
			// True if the key exists
			return (m_keysForCurrentFrame.hasOwnProperty(key));
		},
		
		
		/*!	public
			Check if a key has been held down for more than one frame
			Params:
				-key: key to check
			Returns:
				-boolean, true|false if held for more than one frame
		*/
		isKeyRepeat: function(key)
		{
			return (this.isKeyDown(key) && !m_keysForCurrentFrame[key]);
		},
		
		
		/*!	public
			Check if a key has *just* been pushed down on this particular frame
			Params:
				-key: key to check
			Returns:
				-boolean, true|false if held for more than one frame
		*/
		isKeyJustPressed: function(key)
		{
			return (this.isKeyDown(key) && m_keysForCurrentFrame[key]);
		},
		
		
		/*!	public
			Check if a key is up - the exact opposite of isKeyDown()
			Params:
				-key: key to check
			Returns:
				-boolean, true|false if key is down
		*/
		isKeyUp: function(key)
		{
			return !this.isKeyDown(key);
		}
	};
}();