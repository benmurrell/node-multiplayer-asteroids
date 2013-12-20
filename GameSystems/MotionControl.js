////////////////////////////////////////////////////////////////////////////////
// MotionControl.js
//
// MotionControl system for multiplayer asteroids game
//
// Copyright (C) 2013 Ben Murrell
////////////////////////////////////////////////////////////////////////////////

( function() {

var merge = require( '../public/lib/merge.js' );

// Expose constructor
module.exports = MotionControl;

////////////////////////////////////////////////////////////////////////////////
// Constructor for MotionControl system of multiplayer asteroids
//
// Moves players according to their input
////////////////////////////////////////////////////////////////////////////////
function MotionControl( aOptions ) {
    var self = this;

    // Defaults
    self.playerTurnRate = 1;
    self.playerAcceleration = 1;

    // Merge in options
    merge( self, aOptions );

    ////////////////////////////////////////////////////////////////////////////////
    // Update motion controlled GameObjs by the given number of ms
    ////////////////////////////////////////////////////////////////////////////////
    self.update = function( aObjectList, aDeltaT ) {
        for( var i = 0; i < aObjectList.length; i++ ) {
            var obj = aObjectList[i];

            if( obj.health > 0 ) {
                // Update heading
                obj.heading += Math.min( obj.controlState.right, 1 ) * self.playerTurnRate * aDeltaT;
                obj.heading -= Math.min( obj.controlState.left, 1 ) * self.playerTurnRate * aDeltaT;
                obj.heading %= 360;

                // Update acceleration
                obj.a.x = Math.cos( obj.heading * Math.PI / 180 ) * self.playerAcceleration * Math.min( obj.controlState.up, 1 );
                obj.a.y = Math.sin( obj.heading * Math.PI / 180 ) * self.playerAcceleration * Math.min( obj.controlState.up, 1 );
            }
            else {
                obj.a.x = 0;
                obj.a.y = 0;
            }
        }
    }; // End update()

} // End MotionControl()

})();
