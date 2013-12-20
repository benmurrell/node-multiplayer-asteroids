////////////////////////////////////////////////////////////////////////////////
// Death.js
//
// Death system for multiplayer asteroids game
//
// Copyright (C) 2013 Ben Murrell
////////////////////////////////////////////////////////////////////////////////

( function() {

var merge = require( '../public/lib/merge.js' );
var GameObj = require( '../GameObj.js' );

// Expose constructor
module.exports = Death;

////////////////////////////////////////////////////////////////////////////////
// Constructor for Death system of multiplayer asteroids
//
// Removes objects whose health is <= 0. Splits asteroids.
////////////////////////////////////////////////////////////////////////////////
function Death( aOptions, aGame ) {
    var self = this;

    // Game, used for guid counter & asteroid count
    var game = aGame;

    // Defaults
    self.smallAsteroidSize = 1;
    self.smallAsteroidMass = 1;
    self.smallAsteroidHealth = 1;

    // Merge in options
    merge( self, aOptions );

    ////////////////////////////////////////////////////////////////////////////
    // Handle death of objects based on their health
    ////////////////////////////////////////////////////////////////////////////
    self.update = function( aObjectList ) {
        // Do health based updates
        for( var i = aObjectList.length - 1; i >= 0; i-- ) {
            var obj = aObjectList[i];

            // Something destroyed?
            if( obj.health <= 0  && obj.maxHealth > 0 ) {
                aObjectList.splice( i, 1 );

                // Respawn in 3s
                if( obj.type === 'player' ) {
                    obj.respawnTime = 3000;

                    // Also manipulate object so it's "dead"
                    obj.maxHealth = 0;
                    obj.v.x  = 0;
                    obj.v.y = 0;
                    obj.a.x = 0;
                    obj.a.y = 0;
                    obj.type = 'player-dead';
                    aObjectList.push( obj );
                }

                if( obj.type === 'asteroid' ) {
                    game.numAsteroids--;

                    // Break into smaller pieces...
                    if( obj.size > self.smallAsteroidSize ) {
                        var v = Math.sqrt( obj.v.x * obj.v.x + obj.v.y * obj.v.y );

                        var rightAsteroid = new GameObj({
                            guid: game.idCounter++,
                            type: 'asteroid',
                            health: self.smallAsteroidHealth,
                            maxHealth: self.smallAsteroidHealth,
                            pos: {
                                x: obj.pos.x,
                                y: obj.pos.y
                            },
                            heading: obj.heading + 45,
                            v: {
                                x: Math.cos( ( obj.heading + 45 ) * Math.PI / 180 ) * v,
                                y: Math.sin( ( obj.heading + 45 ) * Math.PI / 180 ) * v
                            },
                            vMax: obj.vmax,
                            m: self.smallAsteroidMass,
                            size: self.smallAsteroidSize
                        });

                        game.numAsteroids++;
                        aObjectList.push( rightAsteroid );

                        var leftAsteroid = new GameObj({
                            guid: game.idCounter++,
                            type: 'asteroid',
                            health: self.smallAsteroidHealth,
                            maxHealth: self.smallAsteroidHealth,
                            pos: {
                                x: obj.pos.x,
                                y: obj.pos.y
                            },
                            heading: obj.heading - 45,
                            v: {
                                x: Math.cos( ( obj.heading - 45 ) * Math.PI / 180 ) * v,
                                y: Math.sin( ( obj.heading - 45 ) * Math.PI / 180 ) * v
                            },
                            vMax: obj.vmax,
                            m: self.smallAsteroidMass,
                            size: self.smallAsteroidSize
                        });

                        aObjectList.push( leftAsteroid );
                        game.numAsteroids++;
                    }
                }

                // Decrease owner's bullet count
                if( obj.type === 'bullet' ) {
                    for( var p = 0; p < aObjectList.length; p++ ){
                        if( aObjectList[p].guid === obj.owner ) {
                            aObjectList[p].numBullets--;
                        }
                    }
                }
            }
        }
    }; // End update()

} // End Death()

})();
