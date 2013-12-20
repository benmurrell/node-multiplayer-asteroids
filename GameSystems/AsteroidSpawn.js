////////////////////////////////////////////////////////////////////////////////
// AsteroidSpawn.js
//
// AsteroidSpawn system for multiplayer asteroids game
//
// Copyright (C) 2013 Ben Murrell
////////////////////////////////////////////////////////////////////////////////

( function() {

var merge = require( '../public/lib/merge.js' );
var GameObj = require( '../GameObj.js' );

// Expose constructor
module.exports = AsteroidSpawn;

////////////////////////////////////////////////////////////////////////////////
// Constructor for AsteroidSpawn system of multiplayer asteroids
//
// Spawns asteroids according to game rules
////////////////////////////////////////////////////////////////////////////////
function AsteroidSpawn( aOptions, aGame ) {
    var self = this;

    // Game, used for guid counter & asteroid count
    var game = aGame;

    // Defaults
    self.asteroidSpawnTime = 1;
    self.asteroidSpeed = 1;
    self.bigAsteroidSize = 1;
    self.bigAsteroidMass = 1;
    self.bigAsteroidHealth = 1;
    self.xMax = 1;
    self.yMax = 1;

    // Merge in options
    merge( self, aOptions );

    ////////////////////////////////////////////////////////////////////////////
    // Private Data
    ////////////////////////////////////////////////////////////////////////////
    self.nextAsteroidSpawn = 0;

    ////////////////////////////////////////////////////////////////////////////
    // Spawn asteroids if game logic dictates that we should
    ////////////////////////////////////////////////////////////////////////////
    self.update = function( aObjectList, aDeltaT ) {

        self.nextAsteroidSpawn -= aDeltaT;
        self.nextAsteroidSpawn = Math.max( 0, self.nextAsteroidSpawn );

        if( game.numAsteroids < game.maxAsteroids && self.nextAsteroidSpawn <= 0 ) {

            // Create asteroid
            var newHeading = Math.random() * 360;
            var newAsteroid = new GameObj({
                guid: game.idCounter++,
                type: 'asteroid',
                health: self.bigAsteroidHealth,
                maxHealth: self.bigAsteroidHealth,
                pos: {
                    x: Math.random() * self.xMax,
                    y: Math.random() * self.yMax
                },
                heading: newHeading,
                v: {
                    x: self.asteroidSpeed * Math.cos( newHeading * Math.PI / 180 ),
                    y: self.asteroidSpeed * Math.sin( newHeading * Math.PI / 180 )
                },
                vMax: 999,
                m: self.bigAsteroidMass,
                size: self.bigAsteroidSize
            });

            aObjectList.push( newAsteroid );
            game.numAsteroids++;

            self.nextAsteroidSpawn = self.asteroidSpawnTime;
        } // End asteroid spawning
    }; // End update()

} // End AsteroidSpawn()

})();
