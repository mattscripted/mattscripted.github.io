// Copyright (c) 2013, Matthew Shelley. All rights reserved.

// Constants --

// ScriptPixels --

var SP_DEFAULT_VARIABLE_TYPE = "Bool";
var SP_CANVAS_WIDTH = 640;
var SP_CANVAS_HEIGHT = 480;
var SP_CANVAS_BUFFER_IDS = ["#canvas-double-buffer-1", "#canvas-double-buffer-2"];


// ScriptedPixels.InputManager --

var SP_IN_VKEYS =
{
	ARROW_LEFT: 37,
	ARROW_UP: 38,
	ARROW_RIGHT: 39,
	ARROW_DOWN: 40,
	ACTION: 90, // Z
	CANCEL: 88 // X
};


// ScriptedPixels.NarrativeManager --

var SP_NM_ON_EVENT_CALL = {MOVE_FIRST: 0, MOVE_LAST: 1, MOVE_RANDOM: 2, MOVE_ALL: 3};
var SP_NM_DEBUG_EVENTS_ELEMENT_ID = "#legal-events"; // for debugging, buttons are stored in this element, if it exists


// ScriptedPixels.ScriptManager -- 

// https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/RegExp
var SP_SM_VARIABLE_FORMAT = "\\$(?:(global)\\.)?([A-Za-z_][A-Za-z0-9_]*)"; // to be placed in a RegExp
// $(varscope).(varname)
// (varscope). is optional, otherwise uses a temp variable
// Variables are not allowed to begin with a number

// Legal commands with argumentPattern and commandClass
var SP_SM_SCRIPT_COMMANDS =
{
	SET_SPEAKER: {argumentPattern: /^\"(.*)\"$/, commandClass: "SetSpeaker"},
	CLEAR_SPEAKER: {argumentPattern: /^$/, commandClass: "ClearSpeaker"},
	SHOW_MESSAGE: {argumentPattern: /^\"(.*)\"$/, commandClass: "ShowMessage"},
	SLEEP: {argumentPattern: /^([\d]+\.?[\d]*)$/, commandClass: "Sleep"}, // does allow #. without a final digit, but that's okay...
}; // commandClass refers to object to create

var SP_SM_MESSAGE_CHARS_PER_SEC = 16; // 16 characters per second
var SP_SM_MESSAGE_BOX_HEIGHT = 128;
var SP_SM_MESSAGE_BOX_PADDING = 16; // 16px on either side of the textbox
var SP_SM_MESSAGE_LINE_HEIGHT = 32;