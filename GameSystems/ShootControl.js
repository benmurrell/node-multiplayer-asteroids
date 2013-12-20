////////////////////////////////////////////////////////////////////////////////
// ShootControl.js
//
// ShootControl system for multiplayer asteroids game
//
// Copyright (C) 2013 Ben Murrell
////////////////////////////////////////////////////////////////////////////////

( function() {

var merge = require( '../public/lib/merge.js' );
var GameObj = require( '../GameObj.js' );

// Expose constructor
module.exports = ShootControl;

////////////////////////////////////////////////////////////////////////////////
// Constructor for ShootControl system of multiplayer asteroids
//
// Shoots bullets according to player input
////////////////////////////////////////////////////////////////////////////////
function ShootControl( aOptions, aGame ) {
    var self = this;

    // Save game, used for guid counter
    var game = aGame;

    // Defaults
    self.maxBulletsPerPlayer = 1;
    self.timeBetweenShots = 1;
    self.bulletDuration = 1;
    self.bulletSpeed = 1;
    self.bulletMass = 1;
    self.bulletSize = 1;
    self.xMax = 1;
    self.yMax = 1;

    // Merge in options
    merge( self, aOptions );

    ////////////////////////////////////////////////////////////////////////////
    // Shoot bullets if player input + game logic says we should
    ////////////////////////////////////////////////////////////////////////////
    self.update = function( aObjectList, aDeltaT ) {
        for( var i = 0; i < aObjectList.length; i++ ) {
            var obj = aObjectList[i];

            obj.nextShot -= aDeltaT;
            obj.nextShot = Math.max( 0, obj.nextShot );

            // Shoot button currently pressed?
            if( obj.controlState.shoot && obj.health > 0 ) {

                // Shoot if we've waited long enough
                if( obj.nextShot <= 0 && obj.numBullets < self.maxBulletsPerPlayer ) {

                    var dvX = Math.cos( obj.heading * Math.PI / 180 );
                    var dvY = Math.sin( obj.heading * Math.PI / 180 );

                    // Create bullet
                    var newBullet = new GameObj({
                        guid: game.idCounter++,
                        type: 'bullet',
                        despawnTime: self.bulletDuration,
                        pos: {
                            x: obj.pos.x + dvX * obj.size/2,
                            y: obj.pos.y + dvY * obj.size/2
                        },
                        heading: obj.heading,
                        v: {
                            x: obj.v.x + self.bulletSpeed * dvX,
                            y: obj.v.y + self.bulletSpeed * dvY
                        },
                        m: self.bulletMass,
                        vMax: 999,
                        size: self.bulletSize,
                        owner: obj.guid
                    }, {
                        despawnTime: true,
                        owner: true,
                        health: false,
                        maxHealth: false
                    });

                    // Wrap position
                    if( newBullet.pos.x < 0 ) {
                        newBullet.pos.x += self.xMax;
                    }
                    if( newBullet.pos.y < 0 ) {
                        newBullet.pos.y += self.yMax;
                    }
                    newBullet.pos.x %= self.xMax;
                    newBullet.pos.y %= self.yMax;

                    aObjectList.push( newBullet );

                    // Set time till next shot
                    obj.nextShot = self.timeBetweenShots;
                    obj.numBullets++;
                }
            }
        }
    }; // End update()

} // End ShootControl()

})();
