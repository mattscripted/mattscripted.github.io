// Copyright (c) 2013, Matthew Shelley. All rights reserved.

// Constants --

// Canvas and Rendering -- 
var TILE_SIZE_PX = 32; // 32 x 32 pixels per tile
var TORCH_MASK_ENABLED = true;
var WALK_THROUGH_WALLS = false; // used to allow sequence breaking by passing barriers
var SWITCHES_ALWAYS_ENABLED = false;


// Math --
var EPSILON = 0.001 // values within [-0.001, 0.001] will be considered 0


// Objects --
var DEFAULT_OBJECT_SPEED = 4; // tiles per second
var DELAY_FOR_DIRECTION_CHANGE = 125; // milliseconds before direction change for player
var DIR_FACE =
{
	NORTH: 0,
	EAST: 1,
	SOUTH: 2,
	WEST: 3
};


// Switches --
var SWITCH_FRAME_BORDER = 8; // 8px for the entire border thickness, i.e. each side is half this amount