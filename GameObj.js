////////////////////////////////////////////////////////////////////////////////
// GameObj.js
//
// Data container for game object state in multiplayer asteroids game
//
// Copyright (C) 2013 Ben Murrell
////////////////////////////////////////////////////////////////////////////////

( function() {

var merge = require( './public/lib/merge.js' );

// Expose constructor
module.exports = GameObj;

////////////////////////////////////////////////////////////////////////////////
// Constructs a new GameObj with the given state merged over the default state
// and the given transmit mask merged with the default transmit mask.
//
// The transmit mask is used to determine what to send to clients vs what is
// only used by the server.
////////////////////////////////////////////////////////////////////////////////
function GameObj( aState, aTransmit ) {
    var self = this;

    // Default State
    var defaultState = {
        guid: -1,
        name: 'unnamed',

        type: '',

        size: 64,

        m: 5,

        heading: 0,
        pos: {
            x: 32,
            y: 32
        },
        v: {
            x: 0,
            y: 0
        },
        vMax: 0,
        a: {
            x: 0,
            y: 0
        },
        friction: 0,

        health: 100,
        maxHealth: 100,

        controlState: { up: 0, down: 0, left: 0, right: 0, shoot: 0 },
        nextShot: 0,
        numBullets: 0
    };

    // Things we should transmit to remote representations of this object
    self.transmit = {
        guid: true,
        type: true,

        size: true,

        heading: true,
        pos: true,
        v: true,
        a: true,
        friction: true,

        health: true,
        maxHealth: true
    };

    // Merge state with default state
    merge( defaultState, aState );

    // Move state into this object
    merge( self, defaultState );

    // Merge in transmission info
    merge( self.transmit, aTransmit );

    // Error check transmission info
    for( var key in self.transmit ) {
        if( self[key] === undefined ) {
            console.warn( 'New object wants to transmit "' + key + '" but doesn\'t have it in state.' );
        }
    }
} // End GameObj()

})();
