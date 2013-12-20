////////////////////////////////////////////////////////////////////////////////
// asteroids.js
//
// Node.js server of multiplayer asteroids game
//
// Copyright (C) 2013 Ben Murrell
////////////////////////////////////////////////////////////////////////////////

( function() {

// Expose constructor
module.exports = AsteroidsGame;

var merge = require( './public/lib/merge.js' );

var GameObj = require( './GameObj.js' );

var MotionControl   = require( './GameSystems/MotionControl.js' );
var Physics         = require( './GameSystems/Physics.js' );
var BulletTimeLimit = require( './GameSystems/BulletTimeLimit.js' );
var Collision       = require( './GameSystems/Collision.js' );
var Death           = require( './GameSystems/Death.js' );
var ShootControl    = require( './GameSystems/ShootControl.js' );
var PlayerRespawn   = require( './GameSystems/PlayerRespawn.js' );
var AsteroidSpawn   = require( './GameSystems/AsteroidSpawn.js' );

////////////////////////////////////////////////////////////////////////////////
// Constructor for multiplayer asteroids game
////////////////////////////////////////////////////////////////////////////////
function AsteroidsGame() {
    var self = this;

    ////////////////////////////////////////////////////////////////////////////
    // Private Constants / Game Config
    ////////////////////////////////////////////////////////////////////////////
    self.xMax = 800;                    //!< Horizontal size of arena
    self.yMax = 400;                    //!< Vertical size of arena

    self.playerVmax = 0.45;             //!< Maximum player velocity
    self.playerAcceleration = 0.0003;   //!< Player acceleration (as /ms^2)
    self.playerTurnRate = 0.18;         //!< Rate players turn at in degrees per ms
    self.playerMass = 7;                //!< Player mass
    self.playerSize = 48;               //!< Player size (diameter)
    self.playerFriction = 0.00015;      //!< Player friction with air
    self.playerMaxHealth = 100;         //!< Player max health

    self.maxBulletsPerPlayer = 4;       //!< Maximum bullets per player
    self.bulletDamage = 20;             //!< Damage done by a bullet to an asteroid
    self.timeBetweenShots = 500;        //!< Firing rate in ms
    self.bulletDuration = 3000;         //!< Liftetime of bullet in ms
    self.bulletSpeed = 0.09;            //!< Speed of bullet in ms
    self.bulletMass = 1;                //!< Mass of bullet
    self.bulletSize = 4;                //!< Size (diameter) of bullet

    self.asteroidSpawnTime = 6000;      //!< Minimum time between asteroid spawns
    self.asteroidSpeed = 0.06;          //!< Speed of an asteroid when spawned per ms
    self.maxAsteroids = 7;              //!< Maximum number of asteroids (no more will be spawned above this point)

    self.bigAsteroidSize = 64;          //!< Size (diameter) of a big asteroid
    self.bigAsteroidMass = 20;          //!< Mass of a big asteroid
    self.bigAsteroidHealth = 60;        //!< Initial health of a big asteroid

    self.smallAsteroidSize = 32;        //!< Size (diameter) of a small asteroid
    self.smallAsteroidMass = 3;         //!< Mass of a small asteroid
    self.smallAsteroidHealth = 20;      //!< Initial health of a small asteroid

    ////////////////////////////////////////////////////////////////////////////
    // Private Data
    ////////////////////////////////////////////////////////////////////////////
    self.idCounter = 0;

    self.gameSystems = [];      //!< List of game systems to update each tick
    self.gameObjs = [];         //!< List of game objects in current game state
    self.visualizers = [];      //!< List of connected visualizer clients
    self.controllers = [];      //!< List of connected control clients

    self.numAsteroids = 0;      //!< Number of current asteroids

    //! The game state prior to the current game state (used for delta compression)
    var lastGameState = {
        objs: []
    };

    ////////////////////////////////////////////////////////////////////////////
    // Handlers
    ////////////////////////////////////////////////////////////////////////////

    ////////////////////////////////////////////////////////////////////////////
    // Handle a new client connection
    ////////////////////////////////////////////////////////////////////////////
    self.onConnect = function( aSocket ) {
        console.log( "New connection..." );

        // Handle player-type message
        aSocket.on( 'player-type', function ( aData ) {
            if( aData === 'vis' ) {
                self.onNewVisClient( aSocket );
            }
            else if( aData === 'control' ) {
                self.onNewControlClient( aSocket );
            }
            else {
                console.warn( "Unknown player-type: " + aData );
            }
        });
    }; // End onConnect()

    ////////////////////////////////////////////////////////////////////////////
    // Handle a new visualizer client
    ////////////////////////////////////////////////////////////////////////////
    self.onNewVisClient = function( aSocket ) {
        console.log( "New vis client" );

        self.visualizers.push( aSocket );

        // Send full state to initialize client
        var gameState = self.buildGameState();
        aSocket.emit( 'state-update', gameState );

        // Handle visualizer client disconnect
        aSocket.on( 'disconnect', function() {
            console.log( "Vis disconnected" );

            var index = self.visualizers.indexOf( aSocket );
            if( index > -1 ) {
              self.visualizers.splice( index, 1 );
            }
            else {
              console.warn( "Unable to find client object for visualizer that disconnected" );
            }
        });
    }; // End onNewVisClient()

    ////////////////////////////////////////////////////////////////////////////
    // Handle a new control client
    ////////////////////////////////////////////////////////////////////////////
    self.onNewControlClient = function( aSocket ) {
        console.log( "New control client" );

        aSocket.player = new GameObj({
            guid: self.idCounter++,
            type: 'player',
            vMax: self.playerVmax,
            m: self.playerMass,
            size: self.playerSize,
            friction: self.playerFriction,
            maxHealth: self.playerMaxHealth
        },
        {
            name: true
        });

        self.controllers.push( aSocket );
        self.gameObjs.push( aSocket.player );

        aSocket.on( 'keyState', self.onControlStateUpdate.bind( self, aSocket ) );
        aSocket.on( 'player-name', function( aName ) { aSocket.player.name = aName; } );

        // Handle control client disconnect
        aSocket.on( 'disconnect', function() {
            console.log( "Controller disconnected" );
            var index = self.controllers.indexOf( aSocket );
            if( index > -1 ) {
              self.controllers.splice( index, 1 );
            }
            else {
              console.warn( "Unable to find client object for controller that disconnected" );
            }

            index = self.gameObjs.indexOf( aSocket.player );
            if( index > -1 ) {
                self.gameObjs.splice( index, 1 );
            }
            else {
                console.warn( "Unable to find game object for controller that disconnected" );
            }
        });
    }; // End onNewControlClient()

    ////////////////////////////////////////////////////////////////////////////
    // Handle a control client state update
    ////////////////////////////////////////////////////////////////////////////
    self.onControlStateUpdate = function( aSocket, aData ) {
        merge( aSocket.player.controlState, aData );
    }; // End onControlStateUpdate()

    ////////////////////////////////////////////////////////////////////////////
    // Simulate one tick of game activity
    ////////////////////////////////////////////////////////////////////////////
    self.onTick = function() {

        var now = new Date();
        var deltaT = now.getTime() - self.lastTickTime.getTime();

        // Update all of the systems
        for( var i = 0; i < self.gameSystems.length; i++ ) {
            self.gameSystems[i].update( self.gameObjs, deltaT );
        }

        // Build game state
        var gameState = self.buildGameState();

        // Determine delta to new game state
        var deltaGameState = self.buildDeltaState( lastGameState, gameState );

        // Save last game state (deep copy)
        lastGameState = JSON.parse( JSON.stringify( gameState ) );
        self.lastTickTime = now;

        // Send delta to latest game state to visualizer clients
        for( var i = self.visualizers.length - 1; i >= 0; i-- ) {
            self.visualizers[i].emit( 'state-update', deltaGameState );
        }

        // Send relevant player state to control clients so they can display it
        for( var i = self.controllers.length - 1; i >= 0; i-- ) {
            var player = self.controllers[i].player;

            var playerState = {
                nextShot: Math.max( 0, player.nextShot ),
                respawnTime: Math.max( 0, player.respawnTime ),
                health: player.health,
                maxHealth: player.maxHealth,
                a: {
                    x: player.a.x,
                    y: player.a.y
                },
                heading: player.heading
            };

            self.controllers[i].emit( 'state-update', playerState );
        }
    }; // End onTick()

    ////////////////////////////////////////////////////////////////////////////
    // Build transmittable game state based on current game state
    ////////////////////////////////////////////////////////////////////////////
    self.buildGameState = function() {
        var gameState = {
            objs: [],
            xMax: self.xMax,
            yMax: self.yMax
        };

        for( var i = 0; i < self.gameObjs.length; i++ ) {
            var obj = self.gameObjs[i];

            // Only include what is required
            var transmitObj = {};
            for( var key in obj.transmit ) {
                if( obj.transmit[key] === true ) {
                    transmitObj[key] = obj[key];
                }
            }
            gameState.objs.push( transmitObj );
        }

        return gameState;
    }; // End buildGameState()

    ////////////////////////////////////////////////////////////////////////////
    // Build a game state consisting only of the deltas to get from the previous
    // state to the current state
    //
    // Not a true delta since things that disappeared between prev & cur don't
    // cause a negative delta, they just aren't included at all
    ////////////////////////////////////////////////////////////////////////////
    self.buildDeltaState = function( aPrevState, aCurState ) {
        var deltaGameState = {
            objs: []
        };

        // For each object in the new game state...
        for( var i = 0; i < aCurState.objs.length; i++ ) {
            var obj = aCurState.objs[i];

            // Find the matching object in the old game state
            var oldObj = {};
            for( var j = 0; j < aPrevState.objs.length; j++ ) {
                if( aPrevState.objs[j].guid === obj.guid ) {
                    oldObj = aPrevState.objs[j];
                    break;
                }
            }

            // Every object will have an entry in the delta even if nothing inside
            // of it changed because of how the visualizer assumes things died if
            // they disappeared.
            var delta = {};
            delta.guid = obj.guid;

            // For each key in the object of the new state...
            for( var key in obj ) {
                // If the contents of the key aren't the same, insert into delta state
                if( JSON.stringify( obj[key] ) !== JSON.stringify( oldObj[key] ) ) {
                    delta[key] = obj[key];
                }
            }

            // Add to delta state
            deltaGameState.objs.push( delta );
        }

        return deltaGameState;
    }; // End buildDeltaState()

    ////////////////////////////////////////////////////////////////////////////
    // Action!
    ////////////////////////////////////////////////////////////////////////////

    // Init game systems
    self.motionControl = new MotionControl({
        playerAcceleration: self.playerAcceleration,
        playerTurnRate: self.playerTurnRate
    });
    self.gameSystems.push( self.motionControl );

    self.physics = new Physics({
        xMax: self.xMax,
        yMax: self.yMax
    });
    self.gameSystems.push( self.physics );

    self.bulletTimeLimit = new BulletTimeLimit();
    self.gameSystems.push( self.bulletTimeLimit );

    self.collision = new Collision({
        bulletDamage: self.bulletDamage
    });
    self.gameSystems.push( self.collision );

    self.death = new Death({
        smallAsteroidSize: self.smallAsteroidSize,
        smallAsteroidMass: self.smallAsteroidMass,
        smallAsteroidHealth: self.smallAsteroidHealth,
    }, self );
    self.gameSystems.push( self.death );

    self.shootControl = new ShootControl({
        maxBulletsPerPlayer: self.maxBulletsPerPlayer,
        timeBetweenShots: self.timeBetweenShots,
        bulletDuration: self.bulletDuration,
        bulletSpeed: self.bulletSpeed,
        bulletMass: self.bulletMass,
        bulletSize: self.bulletSize,
        xMax: self.xMax,
        yMax: self.yMax
    }, self );
    self.gameSystems.push( self.shootControl );

    self.playerRespawn = new PlayerRespawn({
        playerMaxHealth: self.playerMaxHealth
    });
    self.gameSystems.push( self.playerRespawn );

    self.asteroidSpawn = new AsteroidSpawn({
        asteroidSpawnTime: self.asteroidSpawnTime,
        asteroidSpeed: self.asteroidSpeed,
        maxAsteroids: self.maxAsteroids,
        bigAsteroidSize: self.bigAsteroidSize,
        bigAsteroidMass: self.bigAsteroidMass,
        bigAsteroidHealth: self.bigAsteroidHealth,
        xMax: self.xMax,
        yMax: self.yMax
    }, self );
    self.gameSystems.push( self.asteroidSpawn );

    // Start the game
    self.lastTickTime = new Date();
    self.interval = setInterval( self.onTick.bind( self ), 1000/30 );

} // End AsteroidsGame()

})();
