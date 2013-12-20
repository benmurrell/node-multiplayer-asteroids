////////////////////////////////////////////////////////////////////////////////
// GameObj.js
//
// Client side representation of a game object
//
// Copyright (C) 2013 Ben Murrell
////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////
// Constructor - create a new visualized GameObj
////////////////////////////////////////////////////////////////////////////////
function GameObj( aState, aOptions ) {
    var self = this;

    ////////////////////////////////////////////////////////////////////////////
    // Private Data
    ////////////////////////////////////////////////////////////////////////////

    // Default State
    self.state = {
        guid: -1,
        name: 'default',
        pos: {
            x: 0,
            y: 0
        },
        v: {
            x: 0,
            y: 0
        },
        a: {
            x: 0,
            y: 0
        },
        size: 0,
        heading: 0,
        health: 1,
        maxHealth: 1
    };

    // Default options
    self.options = {
        objClass: 'player-red',
        showName: false,
        showHealth: false,

        createSound: null,
        damagedSound: null,
        deadSound: null,
        accelerateSound: null
    };

    ////////////////////////////////////////////////////////////////////////////
    // Public Functions
    ////////////////////////////////////////////////////////////////////////////

    ////////////////////////////////////////////////////////////////////////////
    // Update state of GameObj
    ////////////////////////////////////////////////////////////////////////////
    self.update = function( aState ) {

        // Back up previous state
        var prevState = JSON.parse( JSON.stringify( self.state ) );

        // Merge state in
        merge( self.state, aState );

        // Update displayed name
        self.nameNode.nodeValue = self.state.name;

        // Update container size & position
        self.containerDiv.style.width = self.state.size;
        self.containerDiv.style.height = self.state.size;
        self.containerDiv.style['-webkit-transform'] = 'translate3d(' + self.state.pos.x + 'px,' + self.state.pos.y + 'px,0px)';

        // Update object heading & size
        self.objNode.style['-webkit-transform'] = 'rotate(' + ( 0 + self.state.heading + 90 ) + 'deg)';
        self.objNode.style.height = self.state.size;
        self.objNode.style.width = self.state.size;

        // Update acceleration animation & sound
        if( self.state.a.x !== 0 || self.state.a.y !== 0 ) {
            self.accelNode.style.display = 'inherit';
            self.accelNode.style.width = self.state.size / 10;
            self.accelNode.style.height = self.state.size / 10 * 2;

            self.accelNode.style.top = self.state.size;
            self.accelNode.style.left = ( self.state.size - self.state.size / 10 ) / 2;

            // Start playing the accel sound if we have one & it isn't playing yet
            if( self.options.accelerateSound && self.accelSoundSource === undefined ) {
                self.options.accelerateSound.loop( true );
                self.accelSoundSource = self.options.accelerateSound.play();

            }
        }
        else {
            self.accelNode.style.display = 'none';

            // Stop playing accel sound
            if( self.accelSoundSource ) {
                self.accelSoundSource.stop();
                delete self.accelSoundSource;
            }
        }

        // Update name margin so it is above the actual object
        self.nameContainer.style.margin = ( 0 - self.nameContainer.offsetHeight ) + "px 0 0 0";

        // Update health bar
        self.healthBar.style.width = ( self.state.health / self.state.maxHealth ) * 100 + '%';

        // Play damaged sound
        if( self.state.health < prevState.health && self.options.damagedSound ) {
            self.options.damagedSound.loop(false).play();
        }

        // If health is <= 0, play dead sound & hide
        if( self.state.health <= 0 && prevState.health > 0 ) {
            if( self.options.deadSound ) {
                self.options.deadSound.loop(false).play();
            }
            self.containerDiv.style.display = 'none';
        } else if( self.state.health > 0 && prevState.health <= 0 ) {
            if( self.options.createSound ) {
                self.options.createSound.play();
            }
            self.containerDiv.style.display = 'inherit';
        }

        // Update the container margin so the object's center is located at its location
        self.containerDiv.style.margin = ( 0 - self.state.size/2 ) + 'px 0 0 ' + ( 0 - self.state.size/2 ) + 'px';
    }; // End update()

    ////////////////////////////////////////////////////////////////////////////
    // Get DOM Element that makes up this GameObj
    ////////////////////////////////////////////////////////////////////////////
    self.getElement = function() {
        return self.containerDiv;
    }; // End getElement()

    ////////////////////////////////////////////////////////////////////////////
    // Show name
    ////////////////////////////////////////////////////////////////////////////
    self.showName = function( aShow ) {
        self.nameContainer.style.display = aShow ? 'inherit' : 'none';
    }; // End showName()

    ////////////////////////////////////////////////////////////////////////////
    // Show health
    ////////////////////////////////////////////////////////////////////////////
    self.showHealth = function( aShow ) {
        self.healthContainer.style.display = aShow ? 'inherit' : 'none';
    }; // End showHealth();

    ////////////////////////////////////////////////////////////////////////////
    // Clean up anything we need to explicitly release
    ////////////////////////////////////////////////////////////////////////////
    self.destroy = function() {
        // This is our only looping sound, kill it if it is playing
        if( self.accelSoundSource ) {
            self.accelSoundSource.stop();
            delete self.accelSoundSource;
        }

        // Play death sound
        if( self.options.deadSound ) {
            self.options.deadSound.loop(false).play();
        }
    }; // End destroy()

    ////////////////////////////////////////////////////////////////////////////
    // Action!
    ////////////////////////////////////////////////////////////////////////////

    // Merge aState into our state
    merge( self.state, aState );

    // Merge aOptions into default options
    merge( self.options, aOptions );

    // Create DOM structure

    // Overall container
    self.containerDiv = document.createElement( 'div' );
    self.containerDiv.style.position = 'absolute';
    self.containerDiv.style.width = self.state.size;
    self.containerDiv.style.height = self.state.size;

    // Name
    self.nameContainer = document.createElement( 'div' );
    self.nameNode = document.createTextNode( self.state.name );
    self.nameContainer.appendChild( self.nameNode );
    self.nameContainer.className = 'player-name';
    self.nameContainer.style.margin = ( 0 - self.nameContainer.offsetHeight ) + "px 0 0 0";
    self.nameContainer.style.display = self.options.showName ? 'inherit' : 'none';

    // Health outline
    self.healthContainer = document.createElement( 'div' );
    self.healthContainer.className = 'health-container';
    self.healthContainer.style.display = self.options.showHealth ? 'inherit' : 'none';

    // Health bar
    self.healthBar = document.createElement( 'div' );
    self.healthBar.className = 'health-bar';
    self.healthBar.style.width = ( self.state.health / self.state.maxHealth ) * 100 + '%';
    self.healthContainer.appendChild( self.healthBar );

    // Actual object we're drawing
    self.objNode = document.createElement( 'div' );
    self.objNode.className = self.options.objClass;

    // Acceleration animation
    self.accelNode = document.createElement( 'div' );
    self.accelNode.className = 'accelerating';
    self.accelNode.style.display = 'none';
    self.objNode.appendChild( self.accelNode );

    // Compose
    self.containerDiv.appendChild( self.nameContainer );
    self.containerDiv.appendChild( self.objNode );
    self.containerDiv.appendChild( self.healthContainer );

    // Play creation sound if it has one
    if( self.options.createSound ) {
        self.options.createSound.play();
    }

    // Update visual state to match logical state
    self.update( self.state );
} // End GameObj()
