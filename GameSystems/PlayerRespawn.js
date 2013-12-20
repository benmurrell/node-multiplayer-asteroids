////////////////////////////////////////////////////////////////////////////////
// PlayerRespawn.js
//
// PlayerRespawn system for multiplayer asteroids game
//
// Copyright (C) 2013 Ben Murrell
////////////////////////////////////////////////////////////////////////////////

( function() {

var merge = require( '../public/lib/merge.js' );

// Expose constructor
module.exports = PlayerRespawn;

////////////////////////////////////////////////////////////////////////////////
// Constructor for PlayerRespawn system of multiplayer asteroids
//
// Respawns players if they have been dead long enough
////////////////////////////////////////////////////////////////////////////////
function PlayerRespawn( aOptions ) {
    var self = this;

    // Defaults
    self.playerMaxHealth = 1;

    // Merge in options
    merge( self, aOptions );

    ////////////////////////////////////////////////////////////////////////////
    // Respawn players if they should be
    ////////////////////////////////////////////////////////////////////////////
    self.update = function( aObjectList, aDeltaT ) {
        for( var i = 0; i < aObjectList.length; i++ ) {
            var obj = aObjectList[i];

            if( obj.type === 'player-dead' ) {
                obj.respawnTime -= aDeltaT;
                obj.respawnTime = Math.max( 0, obj.respawnTime );

                if( obj.health <= 0 && obj.respawnTime <= 0 ) {
                    obj.pos.x = obj.size / 2;
                    obj.pos.y = obj.size / 2;
                    obj.health = self.playerMaxHealth;
                    obj.v.x = 0;
                    obj.v.y = 0;
                    obj.numBullets = 0;

                    // Reset max health since we set it to 0 so health system doesn't keep removing us
                    obj.maxHealth = self.playerMaxHealth;

                    // Change type back to player so we collide again
                    obj.type = 'player';
                }
            }
        }
    }; // End update()

} // End PlayerRespawn()

})();
