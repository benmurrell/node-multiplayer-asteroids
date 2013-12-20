////////////////////////////////////////////////////////////////////////////////
// BulletTimeLimit.js
//
// BulletTimeLimit system for multiplayer asteroids game
//
// Copyright (C) 2013 Ben Murrell
////////////////////////////////////////////////////////////////////////////////

( function() {

// Expose constructor
module.exports = BulletTimeLimit;

////////////////////////////////////////////////////////////////////////////////
// Constructor for BulletTimeLimit system of multiplayer asteroids
//
// Destroys bullets that have a time limit
////////////////////////////////////////////////////////////////////////////////
function BulletTimeLimit() {
    var self = this;

    ////////////////////////////////////////////////////////////////////////////
    // Step the bullet time limit system forward by the given number of ms
    ////////////////////////////////////////////////////////////////////////////
    self.update = function( aObjectList, aDeltaT ) {
        for( var i = aObjectList.length - 1; i >= 0; i-- ) {
            var obj = aObjectList[i];

            // If a despawn time is specified...
            if( obj.despawnTime !== undefined ) {

                // If the despawn time has passed...
                obj.despawnTime -= aDeltaT
                if( obj.despawnTime <= 0 ) {

                    // Remove object
                    aObjectList.splice( i, 1 );

                    // Reduce bullet count for owner
                    for( var j = 0; j < aObjectList.length; j++ ){
                        if( aObjectList[j].guid === obj.owner ) {
                            aObjectList[j].numBullets--;
                        }
                    }
                }
            }
        }
    }; // End update()

} // End BulletTimeLimit()

})();
