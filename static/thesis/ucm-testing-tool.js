// Copyright (c) 2013, Matthew Shelley. All rights reserved.

// DEMO-SPECIFIC CONSTANTS --

var JQ_INPUT_EVENT = "#input-event";
var JQ_SELECT_UCM = "#select-ucm";
var JQ_SELECT_SUBMAP = "#select-submap";
var JQ_UCM_DISPLAY = "#ucm-display";
var NM_DEFAULT_SCENARIO = "Default Scenario"; // used by all examples
var PATH_TO_EXAMPLES = "nmdemo-example-ucms/";
var PATH_TO_EXAMPLE_IMAGES = PATH_TO_EXAMPLES  + "images/";
var FILENAME_EVENT_SCRIPTS = "event-scripts.xml"; // all examples will use this file
var INPUT_EVENT_DEFAULT_TEXT = "Type name, then press enter...";
var INPUT_EVENT_BEFORE_CLICK_CLASS = "init"; // initial class before being clicked


/*!	namespace
	A demo that runs the UCM Narrative Manager on user-selected UCM files.
*/
var UCMNarrativeManagerDemo = function()
{
	// Private structures / classes --
	
	/*!	private struct
		A simple object that defines a selectable example.
	*/
	var Example = Class.extend(
	{
		/*!	constructor
			Create an example
			Params:
				-jucmFilename: UCM file to be used by the Narrative Manager
		*/
		init: function(jucmFilename)
		{
			// Store the filename
			this.jucmFilename = jucmFilename;
			
			// Start with an empty array of submaps
			this.submaps = [];
		},
		
		
		/*!	public function
			Add a new submap for this example.
			Params:
				-_label: to appear in the select box
				-_imageFilename: image to display
		*/
		addSubmap: function(_label, _imageFilename)
		{
			// Push a simple object
			this.submaps.push({label: _label, imageFilename: _imageFilename});
		},
		
		
		/*!	public function
			Get filename of the .jucm file
			Returns:
				-string
		*/
		getJucmFilename: function()
		{
			return this.jucmFilename;
		},
		
		
		/*!	public function
			Get the number of submaps
			Returns:
				-int
		*/
		getSubmapCount: function()
		{
			return this.submaps.length;
		},
		
		
		/*!	public function
			Get the label of a submap, given its index
			Params:
				-submapIndex: index to a submap
			Returns:
				-string
		*/
		getSubmapLabel: function(submapIndex)
		{
			// Is the index valid?
			if (submapIndex < 0 || submapIndex >= this.submaps.length)
				return "";
			return this.submaps[submapIndex].label;
		},
		
		
		/*!	public function
			Fetch the filename for a submap given its index
			Params:
				-submapIndex: index of a submap
			Returns;
				-string: filename of the image, or empty if invalid
		*/
		getSubmapImageFilename: function(submapIndex)
		{
			// Is the index valid?
			if (submapIndex < 0 || submapIndex >= this.submaps.length)
				return "";
			return this.submaps[submapIndex].imageFilename;
		}
	});
	

	// Private variables --
	
	/*!	private array
		List of example objects
	*/
	var m_examples = [];
	
	
	/*!	private int
		Current example index
	*/
	var m_currentExampleIndex = -1;

	
	// Public access --
	
	return {
		/*!	constructor
			Initialize the demo
		*/
		init: function()
		{
			// Create examples
			var example1 = new Example("01-simple_event_path.jucm");
			example1.addSubmap("Top Level", "01-Top_Level.png");
			m_examples.push(example1);
			
			var example2 = new Example("02-simple_or_fork.jucm");
			example2.addSubmap("Top Level", "02-Top_Level.png");
			m_examples.push(example2);
			
			var example3 = new Example("03-deep_or_forks.jucm");
			example3.addSubmap("Top Level", "03-Top_Level.png");
			m_examples.push(example3);
			
			var example4 = new Example("04-or_fork_or_join.jucm");
			example4.addSubmap("Top Level", "04-Top_Level.png");
			m_examples.push(example4);
			
			var example5 = new Example("05-simple_and_fork.jucm");
			example5.addSubmap("Top Level", "05-Top_Level.png");
			m_examples.push(example5);
			
			var example6 = new Example("06-and_fork_and_join.jucm");
			example6.addSubmap("Top Level", "06-Top_Level.png");
			m_examples.push(example6);
			
			var example7 = new Example("07-simple_loop.jucm");
			example7.addSubmap("Top Level", "07-Top_Level.png");
			m_examples.push(example7);
			
			var example8 = new Example("08-extended_loop.jucm");
			example8.addSubmap("Top Level", "08-Top_Level.png");
			m_examples.push(example8);
			
			var example9 = new Example("09-concurrent_loop.jucm");
			example9.addSubmap("Top Level", "09-Top_Level.png");
			m_examples.push(example9);
			
			var example10 = new Example("10-simple_stubs.jucm");
			example10.addSubmap("Top Level", "10-Top_Level.png");
			example10.addSubmap("Stub 1", "10-Stub_1.png");
			example10.addSubmap("Stub 2", "10-Stub_2.png");
			m_examples.push(example10);
			
			var example11 = new Example("11-complex_stubs.jucm");
			example11.addSubmap("Top Level", "11-Top_Level.png");
			example11.addSubmap("Difficult Route", "11-Difficult_Route.png");
			example11.addSubmap("Middle", "11-Middle.png");
			m_examples.push(example11);
			
			var example12 = new Example("12-conditional_or_fork.jucm");
			example12.addSubmap("Top Level", "12-Top_Level.png");
			m_examples.push(example12);
			
			var example13 = new Example("13-waiting_place.jucm");
			example13.addSubmap("Top Level", "13-Top_Level.png");
			m_examples.push(example13);
			
			var example14 = new Example("14-conditional_or_fork_2.jucm");
			example14.addSubmap("Top Level", "14-Top_Level.png");
			m_examples.push(example14);
			
			var example15 = new Example("15-multiple_start_points.jucm");
			example15.addSubmap("Top Level", "15-Top_Level.png");
			m_examples.push(example15);
			
			var example16 = new Example("16-sidequest.jucm");
			example16.addSubmap("Top Level", "16-Top_Level.png");
			m_examples.push(example16);
			
			var example17 = new Example("17-duplicate_events.jucm");
			example17.addSubmap("Top Level", "17-Top_Level.png");
			example17.addSubmap("Stub", "17-Stub.png");
			m_examples.push(example17);
			
			var example18 = new Example("18-pegasus_and_fork.jucm");
			example18.addSubmap("Top Level", "18-Top_Level.png");
			m_examples.push(example18);
			
			var example19 = new Example("19-pegasus_stub.jucm");
			example19.addSubmap("Top Level", "19-Top_Level.png");
			example19.addSubmap("Stub", "19-Stub.png");
			m_examples.push(example19);
			
			var exampleGTA4 = new Example("GTA4_Missions.jucm");
			exampleGTA4.addSubmap("Top Level", "GTA4_Missions-Top_Level.png");
			m_examples.push(exampleGTA4);
			
			var exampleSM64 = new Example("Super_Mario_64.jucm");
			exampleSM64.addSubmap("Top Level", "Super_Mario_64-Top Level.png");
			exampleSM64.addSubmap("3+ Stars", "Super_Mario_64-3+ Stars.png");
			exampleSM64.addSubmap("Basement", "Super_Mario_64-Basement.png");
			exampleSM64.addSubmap("Second Floor", "Super_Mario_64-Second Floor.png");
			m_examples.push(exampleSM64);
			
			var exampleALttP = new Example("A_Link_to_the_Past.jucm");
			exampleALttP.addSubmap("Top Level", "A_Link_to_the_Past-Top Level.png");
			exampleALttP.addSubmap("Hyrule Castle", "A_Link_to_the_Past-Hyrule Castle.png");
			exampleALttP.addSubmap("Pendant 1", "A_Link_to_the_Past-Pendant 1.png");
			exampleALttP.addSubmap("Pendant 2", "A_Link_to_the_Past-Pendant 2.png");
			exampleALttP.addSubmap("Pendant 3", "A_Link_to_the_Past-Pendant 3.png");
			exampleALttP.addSubmap("Crystal 1", "A_Link_to_the_Past-Crystal 1.png");
			exampleALttP.addSubmap("Crystal 2", "A_Link_to_the_Past-Crystal 2.png");
			exampleALttP.addSubmap("Crystal 3", "A_Link_to_the_Past-Crystal 3.png");
			exampleALttP.addSubmap("Crystal 4", "A_Link_to_the_Past-Crystal 4.png");
			exampleALttP.addSubmap("Crystal 5", "A_Link_to_the_Past-Crystal 5.png");
			exampleALttP.addSubmap("Crystal 6", "A_Link_to_the_Past-Crystal 6.png");
			exampleALttP.addSubmap("Crystal 7", "A_Link_to_the_Past-Crystal 7.png");
			m_examples.push(exampleALttP);
			
			var exampleDemoGame = new Example("demo_game.jucm");
			exampleDemoGame.addSubmap("Top Level", "demo_game-Top_Level.png");
			exampleDemoGame.addSubmap("Multiple Switches", "demo_game-Multiple_Switches.png");
			m_examples.push(exampleDemoGame);
			
			// --
			
			// Set the initial text and class for the call event input
			$(JQ_INPUT_EVENT).attr('value', INPUT_EVENT_DEFAULT_TEXT);
			$(JQ_INPUT_EVENT).addClass(INPUT_EVENT_BEFORE_CLICK_CLASS);
			
			// When the input is first clicked, let's remove the class and text
			$(JQ_INPUT_EVENT).click(function()
			{
				// First click? If so, remove the text and class
				if ($(this).hasClass(INPUT_EVENT_BEFORE_CLICK_CLASS))
				{
					$(this).attr('value', '');
					$(this).removeClass(INPUT_EVENT_BEFORE_CLICK_CLASS);
				}
			});
			
			// When enter is pressed while the input is in used...
			$(JQ_INPUT_EVENT).keypress(function(e)
			{
				// Get code
				var code = (e.keyCode ? e.keyCode : e.which);
				
				// Enter key?
				if (code == 13)
				{
					// Try to call the event name
					if (!ScriptedPixels.NarrativeManager.tryToCallEventByName($(this).val()))
						alert("Unable to call event! It is either illegal or does not exist.");
					
					// Switch back to the init state
					$(JQ_INPUT_EVENT).attr('value', INPUT_EVENT_DEFAULT_TEXT);
					$(JQ_INPUT_EVENT).addClass(INPUT_EVENT_BEFORE_CLICK_CLASS);
					
					// Remove focus
					$(this).blur();
				}
			});
			
			// --
			
			// Populate the UCM select
			for (var ex = 0; ex < m_examples.length; ex++)
			{
				// Create the selection option
				var $select_option = $(document.createElement("option"));
				$select_option.attr("value", ex);
				$select_option.html(m_examples[ex].getJucmFilename());
				
				// Append the option to the select menu
				$(JQ_SELECT_UCM).append($select_option);
			}
			
			// Closure for "this"
			var _this = this;
			
			// Append callback to UCM select
			$(JQ_SELECT_UCM).change(function()
			{
				// Change the example
				_this.changeExample($(this).val());
			});
			
			// Append callback to submap select
			$(JQ_SELECT_SUBMAP).change(function()
			{
				// Change the example
				_this.changeSubmapImage($(this).val());
			});
			
			// By default we load the first UCM
			this.changeExample(0);
		},
		
		
		/*!	public function
			Change the current UCM file, given a valid index
			Params:
				-exampleIndex: index of the example to show
		*/
		changeExample: function(exampleIndex)
		{
			// Reject invalid indices
			if (exampleIndex < 0 || exampleIndex >= m_examples.length)
				return;
				
			// Update the example index
			m_currentExampleIndex = exampleIndex;
			
			// Drop current submap options
			$(JQ_SELECT_SUBMAP).empty();
			
			// Change the submap options
			for (var sm = 0; sm < m_examples[m_currentExampleIndex].getSubmapCount(); sm++)
			{
				// Create the selection option
				var $select_option = $(document.createElement("option"));
				$select_option.attr("value", sm);
				$select_option.html(m_examples[m_currentExampleIndex].getSubmapLabel(sm));
				
				// Append the option to the select menu
				$(JQ_SELECT_SUBMAP).append($select_option);
			}
			
			// If there is only one submap, let's just disable the select box
			// Doing so makes it obvious when multiple submaps exist
			$(JQ_SELECT_SUBMAP).prop("disabled", m_examples[m_currentExampleIndex].getSubmapCount() == 1);
			
			// Load the first sub-map
			this.changeSubmapImage(0);
			
			// Initialize the Narrative Manager
			ScriptedPixels.NarrativeManager.init(
				PATH_TO_EXAMPLES + m_examples[m_currentExampleIndex].getJucmFilename(),
				NM_DEFAULT_SCENARIO,
				PATH_TO_EXAMPLES + FILENAME_EVENT_SCRIPTS);
				//{onEventCall: SP_NM_ON_EVENT_CALL.MOVE_ALL});
		},
		
		
		/*!	public function
			Change the submap being displayed for the current UCM
			Params:
				submapIndex: index to a sub map image
		*/
		changeSubmapImage: function(submapIndex)
		{
			// Fetch the image for the submap
			var imageFilename = m_examples[m_currentExampleIndex].getSubmapImageFilename(submapIndex); // this method can validate
			
			// Destroy all current content in the UCM display div
			$(JQ_UCM_DISPLAY).empty();
			
			// Do we have a valid image filename?
			if (imageFilename != "")
			{
				// Create the submap image
				var $submap_image = $(document.createElement("img"));
				$submap_image.attr("src", PATH_TO_EXAMPLE_IMAGES + imageFilename);
				
				// Now, add the new image
				$(JQ_UCM_DISPLAY).append($submap_image);
			}
			else
			{
				// Error!
				$(JQ_UCM_DISPLAY).append("Sorry, the image for this submap could not be displayed.");
			}
		}
	};
}();


/*!	global
	Initialize the UCM Narrative Manager Demo when the page is done loading
*/
$(document).ready(function()
{
	// Initialize the demo
	UCMNarrativeManagerDemo.init();
	
	// Call the ScriptManager every 10 milliseconds
	setInterval(function() {ScriptedPixels.ScriptManager.update(0.01);}, 10);
});