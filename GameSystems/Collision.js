////////////////////////////////////////////////////////////////////////////////
// Collision.js
//
// Collision system for multiplayer asteroids game
//
// Copyright (C) 2013 Ben Murrell
////////////////////////////////////////////////////////////////////////////////

( function() {

var merge = require( '../public/lib/merge.js' );

// Expose constructor
module.exports = Collision;

////////////////////////////////////////////////////////////////////////////////
// Constructor for Collision system
//
// Detections collisions based on object diameter & center points. Makes one
// callback per object intersection, and includes a correction vector for how
// to move the objects so they no longer intersect.
////////////////////////////////////////////////////////////////////////////////
function Collision( aConfig ) {
    var self = this;

    // Default config
    self.bulletDamage = 1;

    // Merge in config
    merge( self, aConfig );

    ////////////////////////////////////////////////////////////////////////////
    // Private Data
    ////////////////////////////////////////////////////////////////////////////

    // Handlers for collisions
    self.handlers = {};

    ////////////////////////////////////////////////////////////////////////////
    // Public functions
    ////////////////////////////////////////////////////////////////////////////

    ////////////////////////////////////////////////////////////////////////////
    // Check for collisions between objects in the given list & dispatch
    // calls to collision handlers when necessary
    ////////////////////////////////////////////////////////////////////////////
    self.update = function( aObjectList ) {
        self.doCollision( aObjectList );
    }; // End update()

    ////////////////////////////////////////////////////////////////////////////
    // Set the handler for a collision between the given types,
    // also sets the converse handler
    //
    // Handlers should be of the form:
    // function( aLeftObj, aRightObj, aCorrectionVector )
    ////////////////////////////////////////////////////////////////////////////
    self.setHandler = function( aLeftType, aRightType, aHandler ) {
        self.handlers[aLeftType] = self.handlers[aLeftType] || {};

        self.handlers[aLeftType][aRightType] = aHandler;

        // Only set converse when object types are not the same
        if( aLeftType !== aRightType ) {
            self.handlers[aRightType] = self.handlers[aRightType] || {};
            self.handlers[aRightType][aLeftType] = function( aRight, aLeft, aCorrectionVector ) {
                aHandler( aLeft, aRight, { x: -aCorrectionVector.x, y: -aCorrectionVector.y } );
            };
        }
    }; // End setHandler()

    ////////////////////////////////////////////////////////////////////////////
    // Perform a fully elastic collision between the two objects
    //
    // Does not modify positions or headings, just determines the resulting
    // velocity vectors of the objects. Depends on objects having position,
    // mass, and velocity
    ////////////////////////////////////////////////////////////////////////////
    self.elasticCollision = function( aLeft, aRight ) {
        // Determine contact angle
        var contactAngle = Math.atan2( aLeft.pos.y - aRight.pos.y, aLeft.pos.x - aRight.pos.x );

        // Determine velocities after collision - http://en.wikipedia.org/wiki/Elastic_collision
        var vLeft = Math.sqrt( aLeft.v.x * aLeft.v.x + aLeft.v.y * aLeft.v.y );
        var thetaLeft = Math.atan2( aLeft.v.y, aLeft.v.x );

        var vRight = Math.sqrt( aRight.v.x * aRight.v.x + aRight.v.y * aRight.v.y );
        var thetaRight = Math.atan2( aRight.v.y, aRight.v.x );

        // elastic collision with mass
        var vLeftNew = {
            x: ( vLeft * Math.cos( thetaLeft - contactAngle ) * ( aLeft.m - aRight.m ) + 2 * aRight.m * vRight * Math.cos( thetaRight - contactAngle ) ) / ( aLeft.m + aRight.m ) * Math.cos( contactAngle ) + vLeft * Math.sin( thetaLeft - contactAngle ) * Math.cos( contactAngle + Math.PI / 2 ),
            y: ( vLeft * Math.cos( thetaLeft - contactAngle ) * ( aLeft.m - aRight.m ) + 2 * aRight.m * vRight * Math.cos( thetaRight - contactAngle ) ) / ( aLeft.m + aRight.m ) * Math.sin( contactAngle ) + vLeft * Math.sin( thetaLeft - contactAngle ) * Math.sin( contactAngle + Math.PI / 2 )
        };

        var vRightNew = {
            x: ( vRight * Math.cos( thetaRight - contactAngle ) * ( aRight.m - aLeft.m ) + 2 * aLeft.m * vLeft * Math.cos( thetaLeft - contactAngle ) ) / ( aRight.m + aLeft.m ) * Math.cos( contactAngle ) + vRight * Math.sin( thetaRight - contactAngle ) * Math.cos( contactAngle + Math.PI / 2 ),
            y: ( vRight * Math.cos( thetaRight - contactAngle ) * ( aRight.m - aLeft.m ) + 2 * aLeft.m * vLeft * Math.cos( thetaLeft - contactAngle ) ) / ( aRight.m + aLeft.m ) * Math.sin( contactAngle ) + vRight * Math.sin( thetaRight - contactAngle ) * Math.sin( contactAngle + Math.PI / 2 )
        };

        aLeft.v = vLeftNew;
        aRight.v = vRightNew;
    }; // End elasticCollision()

    ////////////////////////////////////////////////////////////////////////////
    // Private functions
    ////////////////////////////////////////////////////////////////////////////

    ////////////////////////////////////////////////////////////////////////////
    // Get the handler for a collision between the given types
    ////////////////////////////////////////////////////////////////////////////
    self.getHandler = function ( aLeftType, aRightType ) {
        var handler = self.handlers[aLeftType];

        if( handler !== undefined ) {
            handler = handler[aRightType];
        }

        return handler;
    }; // End getHandler()

    ////////////////////////////////////////////////////////////////////////////
    // Do collision between all objects in list, call matching collision
    // ballbacks when collisions occur.
    //
    // For each intersection of objects in the list, only one callback will
    // be made
    ////////////////////////////////////////////////////////////////////////////
    self.doCollision = function( aList ) {
        for( var i = aList.length - 1; i >= 0; i-- ) {
            var left = aList[i];

            for( var j = i - 1; j >= 0; j-- ) {
                var right = aList[j];

                var dx = left.pos.x - right.pos.x;
                var dy = left.pos.y - right.pos.y;

                // We're all circles
                var minDist = left.size/2 + right.size/2;

                // Too close to each other?
                if( ( dx * dx + dy * dy ) <= ( minDist * minDist ) ) {

                    // Determine correction vector for left object to get out of right object
                    var angle = Math.atan2( dy, dx );
                    dS = minDist - Math.sqrt( dx * dx + dy * dy );
                    var posCorrection = {
                        x: Math.cos( angle ) * dS,
                        y: Math.sin( angle ) * dS
                    };

                    var handler = self.getHandler( left.type, right.type );
                    if( handler ) {
                        handler( left, right, posCorrection );
                    }
                    else {
                        // console.log( "Unhandled collision: " + left.type + " vs " + right.type );
                    }
                }

            } // end j
        } // end i
    }; // End doCollision()

    ////////////////////////////////////////////////////////////////////////////
    // Handlers
    ////////////////////////////////////////////////////////////////////////////

    ////////////////////////////////////////////////////////////////////////////
    // Handle collision between bullets & asteroids
    ////////////////////////////////////////////////////////////////////////////
    var onBulletAsteroidCollision = function( aBullet, aAsteroid ) {
        // Damage asteroid
        aAsteroid.health -= self.bulletDamage;

        // Damage bullet
        aBullet.health = 0;

        // Modify asteroid trajectory
        aAsteroid.v.x = ( aAsteroid.v.x * aAsteroid.m + aBullet.v.x * aBullet.m ) / ( aAsteroid.m + aBullet.m );
        aAsteroid.v.y = ( aAsteroid.v.y * aAsteroid.m + aBullet.v.y * aBullet.m ) / ( aAsteroid.m + aBullet.m );

        aAsteroid.heading = Math.atan2( aAsteroid.v.y, aAsteroid.v.x ) * 180 / Math.PI;
    }; // End onBulletAsteroidCollision()

    ////////////////////////////////////////////////////////////////////////////
    // Handle collisions between asteroids & asteroids
    ////////////////////////////////////////////////////////////////////////////
    var onAsteroidAsteroidCollision = function( aLeft, aRight, aCorrection ) {
        // Correct position so we're not intersecting
        aLeft.pos.x += aCorrection.x;
        aLeft.pos.y += aCorrection.y;

        // Perform elastic collision
        self.elasticCollision( aLeft, aRight );

        // Determine headings after collision
        aLeft.heading = Math.atan2( aLeft.v.y, aLeft.v.x ) * 180 / Math.PI;
        aRight.heading = Math.atan2( aRight.v.y, aRight.v.x ) * 180 / Math.PI;
    }; // End onAsteroidAsteroidCollision()

    ////////////////////////////////////////////////////////////////////////////
    // Handle collisions between players & asteroids
    ////////////////////////////////////////////////////////////////////////////
    var onPlayerAsteroidCollision = function( aLeft, aRight, aCorrection ) {
        // Correct position so we're not intersecting
        aLeft.pos.x += aCorrection.x;
        aLeft.pos.y += aCorrection.y;

        // Perform elastic collision
        self.elasticCollision( aLeft, aRight );

        // Determine asteroid heading after collision
        aRight.heading = Math.atan2( aRight.v.y, aRight.v.x ) * 180 / Math.PI;

        // Damage player & asteroid
        aLeft.health -= aRight.m;
        aRight.health -= aLeft.m;
    }; // End onPlayerAsteroidCollision()

    ////////////////////////////////////////////////////////////////////////////
    // Action!
    ////////////////////////////////////////////////////////////////////////////

    // Set handlers for the collisions in multiplayer asteroids game
    self.setHandler( 'asteroid', 'asteroid', onAsteroidAsteroidCollision );
    self.setHandler( 'bullet', 'asteroid', onBulletAsteroidCollision );
    self.setHandler( 'player', 'asteroid', onPlayerAsteroidCollision );

} // End Collision()

})();
