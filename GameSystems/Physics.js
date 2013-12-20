////////////////////////////////////////////////////////////////////////////////
// Physics.js
//
// Physics system for multiplayer asteroids game
//
// Copyright (C) 2013 Ben Murrell
////////////////////////////////////////////////////////////////////////////////

( function() {

var merge = require( '../public/lib/merge.js' );

// Expose constructor
module.exports = Physics;

////////////////////////////////////////////////////////////////////////////////
// Constructor for Physics system of multiplayer asteroids
//
// All units used are assumed to be per millisecond. Wraps positions so things
// stay within xMax/yMax.
////////////////////////////////////////////////////////////////////////////////
function Physics( aOptions ) {
    var self = this;

    // Defaults
    self.xMax = 100;
    self.yMax = 100;

    // Merge in options
    merge( self, aOptions );

    ////////////////////////////////////////////////////////////////////////////////
    // Step the physics simulation forward for all objects in the given list by the
    // given number of ms
    ////////////////////////////////////////////////////////////////////////////////
    self.update = function( aObjectList, aDeltaT ) {

        // Move GameObjs
        for( var i = 0; i < aObjectList.length; i++ ) {
            var obj = aObjectList[i];

            // Change velocity according to acceleration
            obj.v.x = obj.v.x + obj.a.x * aDeltaT;
            obj.v.y = obj.v.y + obj.a.y * aDeltaT;

            // Apply velocity limits
            var v = Math.sqrt( obj.v.x * obj.v.x + obj.v.y * obj.v.y );
            if( v > obj.vMax ) {
                var uVx = obj.v.x / v;
                var uVy = obj.v.y / v;

                obj.v.x = uVx * obj.vMax;
                obj.v.y = uVy * obj.vMax;
                v = obj.vMax;
            }

            // Apply friction if the object isn't accelerating
            if( obj.friction > 0 && obj.a.x === 0 && obj.a.y === 0 ) {

                if( v > 0.0025 ) {
                    var uVx = obj.v.x / v;
                    var uVy = obj.v.y / v;
                    v = v - obj.friction * aDeltaT;

                    obj.v.x = uVx * v;
                    obj.v.y = uVy * v;
                }
                else {
                    obj.v.x = 0;
                    obj.v.y = 0;
                }
            }

            // Change position according to velocity
            obj.pos.x = obj.pos.x + obj.v.x * aDeltaT;
            obj.pos.y = obj.pos.y + obj.v.y * aDeltaT;

            // Wrap position
            if( obj.pos.x < 0 ) {
                obj.pos.x += self.xMax;
            }
            if( obj.pos.y < 0 ) {
                obj.pos.y += self.yMax;
            }
            obj.pos.x %= self.xMax;
            obj.pos.y %= self.yMax;
        } // End moving

    }; // End update()

} // End Physics()

} )();
