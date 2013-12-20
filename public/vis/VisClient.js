////////////////////////////////////////////////////////////////////////////////
// VisClient.js
//
// Visualizer client for multiplayer asteroids game
//
// Credits:
//  * Images from http://flaticons.net/
//  * Sounds created with http://www.bfxr.net/
//  * WebAudio.js from https://github.com/jeromeetienne/webaudio.js
//
// Copyright (C) 2013 Ben Murrell
////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////
// Constructor - create a new visualizer client instance
////////////////////////////////////////////////////////////////////////////////
function VisClient( aOptions ) {
    var self = this;

    var options = {
        type: 'vis',
        name: 'default-vis',
        showNames: true
    };

    ////////////////////////////////////////////////////////////////////////////
    // Private Data
    ////////////////////////////////////////////////////////////////////////////
    // Create node to show state in JSON
    self.stateTextNode = document.createTextNode( "No state yet" );
    document.body.appendChild( self.stateTextNode );

    // Create node to show bottom boundary
    self.verticalBoundaryNode = document.createElement( 'div' );
    self.verticalBoundaryNode.className = 'boundary';
    self.verticalBoundaryNode.style.width = 800;
    self.verticalBoundaryNode.style.height = 100;
    self.verticalBoundaryNode.style.left = 0;
    document.body.appendChild( self.verticalBoundaryNode );

    // Create node to show right boundary
    self.horizontalBoundaryNode = document.createElement( 'div' );
    self.horizontalBoundaryNode.className = 'boundary';
    self.horizontalBoundaryNode.style.width = 100;
    self.horizontalBoundaryNode.style.height = 400;
    self.horizontalBoundaryNode.style.top = 0;
    document.body.appendChild( self.horizontalBoundaryNode );

    // Init audio library & load sounds
    if( WebAudio.isAvailable ) {
        var webAudio = new WebAudio();
        self.playerShootSound = webAudio.createSound().load( 'resources/sound/shoot.wav' );
        self.playerAccelerateSound = webAudio.createSound().load( 'resources/sound/accelerate.wav' ).volume(0.3);
        self.playerDeadSound = webAudio.createSound().load( 'resources/sound/player-dead.wav' );
        self.playerSpawnSound = webAudio.createSound().load( 'resources/sound/player-spawn.wav' );
        self.damagedSound = webAudio.createSound().load( 'resources/sound/damage.wav' );
    }

    // Game Objects being drawn, indexed by guid
    self.gameObjs = {};

    ////////////////////////////////////////////////////////////////////////////
    // Handlers
    ////////////////////////////////////////////////////////////////////////////

    ////////////////////////////////////////////////////////////////////////////
    // Handle connect event
    ////////////////////////////////////////////////////////////////////////////
    self.onConnect = function() {
        self.socket.emit( 'player-type', options.type );
        self.socket.emit( 'player-name', options.name );
    }; // End onConnect()

    ////////////////////////////////////////////////////////////////////////////
    // Handle disconnect event
    ////////////////////////////////////////////////////////////////////////////
    self.onDisconnect = function() {

        // Clean up objects
        for( var guid in self.gameObjs ) {
            document.body.removeChild( self.gameObjs[guid].getElement() );
            self.gameObjs[guid].destroy();
        }
        self.gameObjs = {};

        self.stateTextNode.nodeValue = "Disconnected!";
    }; // End onDisconnect()

    ////////////////////////////////////////////////////////////////////////////
    // Toggle whether or not names are shown above players
    ////////////////////////////////////////////////////////////////////////////
    self.onToggleShowNames = function( aKeyState ) {
        if( aKeyState.toggleShowNames === 1 ) {
            options.showNames = !options.showNames;

            for( var guid in self.gameObjs ) {
                var obj = self.gameObjs[guid];

                if( obj.state.type === 'player' ) {
                    obj.showName( options.showNames );
                }
            }
        }
    }; // End toggleShowNames()

    ////////////////////////////////////////////////////////////////////////////
    // Handle state update message
    ////////////////////////////////////////////////////////////////////////////
    self.onStateUpdate = function( aState ) {

        // Update displayed JSON
        // self.stateTextNode.nodeValue = JSON.stringify( aState );
        self.stateTextNode.nodeValue = "";

        // Update boundaries
        self.verticalBoundaryNode.style.width = aState.xMax;
        self.verticalBoundaryNode.style.top = aState.yMax;

        self.horizontalBoundaryNode.style.height = aState.yMax + 100;
        self.horizontalBoundaryNode.style.left = aState.xMax;

        // Update local gameobjects with new state
        self.updateObjects( self.gameObjs, aState.objs, {
            'player': { objClass: 'player-red', showName: options.showNames, showHealth: true, createSound: self.playerSpawnSound, deadSound: self.playerDeadSound, accelerateSound: self.playerAccelerateSound },
            'asteroid': { objClass: 'asteroid-small', showName: false, showHealth: true, damagedSound: self.damagedSound, deadSound: self.damagedSound },
            'bullet': { objClass: 'bullet', showName: false, showHealth: false, createSound: self.playerShootSound }
        });

        // Schedule a new frame draw in 15ms
        setTimeout( self.predictMotion, 15, 15 );

    }; // End onStateUpdate()

    ////////////////////////////////////////////////////////////////////////////
    // Private Functions
    ////////////////////////////////////////////////////////////////////////////

    ////////////////////////////////////////////////////////////////////////////
    // Update aLocalObjects to match the state in aStateList, create new objects
    // with the options in aNewObjOptions
    ////////////////////////////////////////////////////////////////////////////
    self.updateObjects = function( aLocalObjects, aStateList, aNewObjOptionsMap ) {
        // Mark all objects as not seen in this update
        for( var guid in aLocalObjects ) {
            aLocalObjects[guid].seen = false;
        }

        // For each object in the new state, update the local object or create a new local object
        for( var i = 0; i <  aStateList.length; ++i ) {
            var obj = aLocalObjects[aStateList[i].guid];

            // If the we don't have a local representation of this object, create one
            if( obj === undefined ) {
                var type = aStateList[i].type;
                var objectOptions = aNewObjOptionsMap[type];

                // Create object with options for the type of the remote object
                if( objectOptions !== undefined ) {
                    obj = new GameObj( aStateList[i], objectOptions );

                    // Add object to local state
                    document.body.appendChild( obj.getElement() );
                    aLocalObjects[obj.state.guid] = obj;
                }
                else {
                    console.warn( "Unknown game object type'" + type + "' received." );
                }
            }

            // Update local object with remote state
            if( obj !== undefined ) {
                obj.update( aStateList[i] );
                obj.seen = true;
            }
        }

        // Remove objects that were not seen in this update
        for( var guid in aLocalObjects ) {
            if( !aLocalObjects[guid].seen ) {
                document.body.removeChild( aLocalObjects[guid].getElement() );
                aLocalObjects[guid].destroy();
                delete aLocalObjects[guid];
            }
        }
    }; // End updateObjects()

    ////////////////////////////////////////////////////////////////////////////
    // Run the same simulation as the server to predict where something would be
    // between frames for higher framerate than server tickrate
    ////////////////////////////////////////////////////////////////////////////
    self.predictMotion = function( aTime ) {
        // Move GameObjs
        for( var guid in self.gameObjs ) {
            var obj = self.gameObjs[guid].state;

            // Change velocity according to acceleration
            obj.v.x = obj.v.x + obj.a.x * aTime;
            obj.v.y = obj.v.y + obj.a.y * aTime;

            // Apply velocity limits
            var v = Math.sqrt( obj.v.x * obj.v.x + obj.v.y * obj.v.y );
            if( v > obj.vMax ) {
                var uVx = obj.v.x / v;
                var uVy = obj.v.y / v;

                obj.v.x = uVx * obj.vMax;
                obj.v.y = uVy * obj.vMax;
            }

            // Apply friction if the object isn't accelerating
            if( obj.friction > 0 && obj.a.x === 0 && obj.a.y === 0 ) {

                if( v > 0.0025 ) {
                    var uVx = obj.v.x / v;
                    var uVy = obj.v.y / v;
                    v = v - obj.friction * aTime;

                    obj.v.x = uVx * v;
                    obj.v.y = uVy * v;
                }
                else {
                    obj.v.x = 0;
                    obj.v.y = 0;
                }
            }

            // Change position according to velocity
            obj.pos.x = obj.pos.x + obj.v.x * aTime;
            obj.pos.y = obj.pos.y + obj.v.y * aTime;

            // Wrap position
            if( obj.pos.x < 0 ) {
                obj.pos.x += self.xMax;
            }
            if( obj.pos.y < 0 ) {
                obj.pos.y += self.yMax;
            }
            obj.pos.x %= self.xMax;
            obj.pos.y %= self.yMax;

            // Update visually
            self.gameObjs[guid].update( obj );
        }
    }; // End predictMotion()

    ////////////////////////////////////////////////////////////////////////////
    // Action!
    ////////////////////////////////////////////////////////////////////////////

    // Merge default options with incoming options
    merge( options, aOptions );

    // Connect to server
    self.socket = io.connect();

    // Connect our handlers
    self.socket.on( 'connect', self.onConnect );
    self.socket.on( 'disconnect', self.onDisconnect );
    self.socket.on( 'state-update', self.onStateUpdate );

    // Set up KeyboardManager
    self.keyboardManager = new KeyboardManager( {
        keyBinding: {
            'N': 'toggleShowNames'
        },

        onKeyStateChange: self.onToggleShowNames
    });
} // End VisClient()
