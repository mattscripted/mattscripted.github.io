// Copyright (c) 2013, Matthew Shelley. All rights reserved.

// THIS FILE HAS NOT BEEN FULLY TESTED

/*!	struct
	Represents a 2D point or vector
	Params:
		-x
		-y
*/
function Vector2(x, y)
{
	/*!	public
		Coordinates or magnitude
	*/
	this.x = x ? parseFloat(x) : 0;
	this.y = y ? parseFloat(y) : 0;
	
	
	/*!	public
		Create a copy of this vector without a reference
	*/
	this.copy = function()
	{
		return new Vector2(this.x, this.y);
	};
	
	
	/*!	public
		Check if two vectors are 'nearly' equivalent
		Params:
			-other: vector to check against this one
		Returns:
			-boolean
	*/
	this.equals = function(other)
	{
		return (this.x >= other.x - EPSILON && this.x <= other.x + EPSILON &&
			this.y >= other.y - EPSILON && this.y <= other.y + EPSILON);
	};
	
	
	/*!	public
		Add vector to this one
		Params:
			-other: vector whose values are to be added to this one
	*/
	this.addVector2 = function(other)
	{
		this.x += other.x;
		this.y += other.y;
	};
	
	
	/*!	public
		Subtract vector from this one
		Params:
			-other: vector whose values are to be subtracted from this one
	*/
	this.subtractVector2 = function(other)
	{
		this.x -= other.x;
		this.y -= other.y;
	};
	
	
	/*!	public
		Get the magnitude of the vector
		Returns:
			-float: length
	*/
	this.magnitude = function()
	{
		return Math.sqrt((this.x * this.x) + (this.y * this.y));
	};
	
	
	/*!	public
		Return the normal of this vector
		Params:
			-[optional] clockwise: how to determine the normal (as there are two sides!)
		Returns:
			-vector of normal
	*/
	this.normal = function(clockwise)
	{
		if (clockwise != undefined && clockwise == true) // not undefined and true
		{
			var result = new Vector2(this.y, -this.x);
			result.normalize();
			return result;		
		}
		
		var result = new Vector2(-this.y, this.x);
		result.normalize();
		return result;
	};
	
	
	/*!	public
		Normalize the vector to be of length 1
	*/
	this.normalize = function()
	{
		// Get the length
		var length = this.magnitude();
		
		// Avoid division by 0 error, if the values are too close to 0
		if (Math.abs(length) <= EPSILON)
		{
			// Just set the values to 0, because it's unclear what should be done
			this.x = 0;
			this.y = 0;
		}
		else
		{
			// Otherwise, just divide by the length
			this.x /= length;
			this.y /= length;
		}		
	};
	
	
	/*!	public
		Resize vector to be a specific length
		Params:
			-length: new length of the vector
	*/
	this.resize = function(length)
	{
		// Normalize vector
		this.normalize();
		
		// Resize each component, if it is larger than EPSILON
		this.x = (Math.abs(this.x) <= EPSILON ? 0.0 : this.x * length);
		this.y = (Math.abs(this.y) <= EPSILON ? 0.0 : this.y * length);
	};
	
	
	/*!	public
		Scale vector by a given amount
		Params:
			-scaleBy
	*/
	this.scale = function(scaleBy)
	{
		// Scale each component, if it is larger than EPSILON
		this.x = (Math.abs(this.x) <= EPSILON ? 0.0 : this.x * scaleBy);
		this.y = (Math.abs(this.y) <= EPSILON ? 0.0 : this.y * scaleBy);
	};
	
	
	/*!	public
		Dot product
		Param:
			-proj: projection vector
		Returns:
			-dot product of this vector onto the other
	*/
	this.dot = function(proj)
	{
		return (this.x * proj.x + this.y * proj.y);
	};
	
	
	/*!	public
		Display debug information in an alert
	*/
	this.debug = function()
	{
		alert("X: " + this.x + "; Y: " + this.y);
	};
}


/*!	public
	Static method for adding two vectors
	Params:
		-vec1: first vector
		-vec2: second vector
	Returns:
		-Vector2
*/
Vector2.add = function(vec1, vec2)
{
	return new Vector2(vec1.x + vec2.x, vec1.y + vec2.y);
};


/*!	public
	Static method for subtracting one vector from another
	Params:
		-vec1: first vector
		-vec2: second vector
	Returns:
		-Vector2: vec1 - vec2
*/
Vector2.subtract = function(vec1, vec2)
{
	return new Vector2(vec1.x - vec2.x, vec1.y - vec2.y);
};


/*!	public
	Static method for multiplying a vector
	Params:
		-vec: vector to be multiplied by
		-mult: scalar to multiply by
	Returns:
		-a new vector
*/
Vector2.multiply = function(vec, mult)
{
	return new Vector2(vec.x * mult, vec.y * mult);
};


/*!	public
	Static method for dividing a vector
	Params:
		-vec: vector to be divided by
		-divisor: scalar to divide by
	Returns:
		-a new vector
*/
Vector2.divide = function(vec, divisor)
{
	return new Vector2(vec.x / divisor, vec.y / divisor);
};