////////////////////////////////////////////////////////////////////////////////
// ControlClient.js
//
// Control client for multiplayer asteroids game
//
// Copyright (C) 2013 Ben Murrell
////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////
// Constructor - create a new controller client instance
////////////////////////////////////////////////////////////////////////////////
function ControlClient( aOptions ) {
    var self = this;

    var options = {
        type: 'control',
        name: 'default-control',
        drawControls: true
    };

    ////////////////////////////////////////////////////////////////////////////
    // Private Functions
    ////////////////////////////////////////////////////////////////////////////

    ////////////////////////////////////////////////////////////////////////////
    // Set the name of the player being controlled
    ////////////////////////////////////////////////////////////////////////////
    self.setName = function( aName ) {
        options.name = aName;
        self.socket.emit( 'player-name', aName );
    }; // End setName()

    ////////////////////////////////////////////////////////////////////////////
    // Set up touch events on an element so it will act like a keyboard button
    ////////////////////////////////////////////////////////////////////////////
    self.setupButton = function( aElement, aKey ) {
        function sendKey( aDown, aKey ) {
            var code = aKey.charCodeAt( 0 );

            var generatedEvent = {
                type: aDown ? 'keydown' : 'keyup',
                keyCode: code
            };

            self.keyboardManager.onHandleKeyStateChange( generatedEvent );
        }
        aElement.addEventListener( "touchstart", sendKey.bind( this, true, aKey ) );
        aElement.addEventListener( "touchend", sendKey.bind( this, false, aKey ) );

        // These events aren't implemented on iOS, disabling for now
        // aElement.addEventListener( "touchenter", sendKey.bind( this, true, aKey ) );
        // aElement.addEventListener( "touchleave", sendKey.bind( this, false, aKey ) );
    }; // End setupButton()

    ////////////////////////////////////////////////////////////////////////////
    // Handlers
    ////////////////////////////////////////////////////////////////////////////

    ////////////////////////////////////////////////////////////////////////////
    // Handle connect event
    ////////////////////////////////////////////////////////////////////////////
    self.onConnect = function() {
        self.socket.emit( 'player-type', options.type );
        self.setName( options.name );
    }; // End onConnect()

    ////////////////////////////////////////////////////////////////////////////
    // Handle key state change
    ////////////////////////////////////////////////////////////////////////////
    self.onKeyStateChange = function( aState ) {
        self.socket.emit( 'keyState', aState );

        self.keyState = aState;
    }; // End onKeyStateChange()

    ////////////////////////////////////////////////////////////////////////////
    // Handle player state update from server
    ////////////////////////////////////////////////////////////////////////////
    self.onStateUpdate = function( aState ) {
        // Update player object on screen
        self.playerObj.update({
            health: aState.health,
            maxHealth: aState.maxHealth,
            heading: aState.heading,
            a: aState.a
        });

        // Update respawn timer
        if( aState.respawnTime > 0 ) {
            self.playerObj.getElement().style.display = 'none';
            self.respawnCountdown.style.display = 'inherit';
            self.respawnCountdown.style.width = self.playerObj.state.size;
            self.respawnCountdown.style.height = self.playerObj.state.size;
            self.respawnCountdown.style.top = self.playerObj.state.pos.y - self.playerObj.state.size/2;
            self.respawnCountdown.style.left = self.playerObj.state.pos.x - self.playerObj.state.size/2;

            var displayTime = Math.ceil( aState.respawnTime / 1000 );
            $(self.respawnCountdown).text( displayTime );
        }
        else {
            self.respawnCountdown.style.display = 'none';
            self.playerObj.getElement().style.display = 'inherit';
        }

    }; // End onStateUpdate()

    ////////////////////////////////////////////////////////////////////////////
    // Action!
    ////////////////////////////////////////////////////////////////////////////

    // Merge default options with incoming options
    merge( options, aOptions );

    // Connect to server
    self.socket = io.connect();

    // Connect our handlers
    self.socket.on( 'connect', self.onConnect );

    // Set up KeyboardManager
    self.keyboardManager = new KeyboardManager( {
        keyBinding: {
            'W': 'up',
            'S': 'down',
            'D': 'right',
            'A': 'left',
            ' ': 'shoot'
        },

        onKeyStateChange: self.onKeyStateChange
    });

    // Set up play page
    {
        self.leftButton = document.createElement( 'div' );
        self.leftButton.className = 'leftButton';
        self.setupButton( self.leftButton, 'A' );

        self.rightButton = document.createElement( 'div' );
        self.rightButton.className = 'rightButton';
        self.setupButton( self.rightButton, 'D' );

        self.thrusterButton = document.createElement( 'div' );
        self.thrusterButton.className = 'thrusterButton';
        self.setupButton( self.thrusterButton, 'W' );

        self.shootButton = document.createElement( 'div' );
        self.shootButton.className = 'shootButton';
        self.setupButton( self.shootButton, ' ' );

        self.configButton = document.createElement( 'div' );
        self.configButton.className = 'configButton';

        self.shootMeter = document.createElement( 'div' );
        self.shootMeter.className = 'shootMeter';

        self.respawnCountdown = document.createElement( 'div' );
        self.respawnCountdown.className = 'respawnCountdown';
        self.respawnCountdown.style.display = 'none';

        self.playPage = document.createElement( 'div' );
        self.playPage.appendChild( self.leftButton );
        self.playPage.appendChild( self.rightButton );
        self.playPage.appendChild( self.thrusterButton );
        self.playPage.appendChild( self.shootButton );
        self.playPage.appendChild( self.shootMeter );
        self.playPage.appendChild( self.configButton );
        self.playPage.appendChild( self.respawnCountdown );

        // Create player to show on screen
        var playerSize = window.innerHeight * 0.5;
        self.playerObj = new GameObj({
            name: options.name,
            size: playerSize,
            pos: {
                x: ( window.innerWidth ) / 2,
                y: ( window.innerHeight * 0.7 ) / 2
            }
        }, {
            objClass: 'player-red',
            showHealth: true,
            showName: true
        });
        self.playPage.appendChild( self.playerObj.getElement() );
    }

    // Only update the display state if we are drawing
    if( options.drawControls ) {
        self.socket.on( 'state-update', self.onStateUpdate );

        // Adjust player on screen when window size changes
        window.addEventListener( 'resize', function() {
            var playerSize = window.innerHeight * 0.5;
            self.playerObj.update({
                size: playerSize,
                pos: {
                    x: ( window.innerWidth ) / 2,
                    y: ( window.innerHeight * 0.7 ) / 2
                }
            });

            self.respawnCountdown.style['font-size'] = ( 0.5 * window.innerHeight ) + 'px';
        });

        // Add play page to DOM
        document.body.appendChild( self.playPage );
    }

} // End ControlClient()
