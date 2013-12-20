////////////////////////////////////////////////////////////////////////////////
// KeyboardManager.js
//
// Keyboard state manager class
//
// Copyright (C) 2013 Ben Murrell
////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////
// Constructor - create a new KeyboardManager instance
////////////////////////////////////////////////////////////////////////////////
function KeyboardManager( aOptions ) {
    var self = this;

    // Default options
    var options = {
        keyBinding: {
            'W': 'up',
            'S': 'down',
            'D': 'right',
            'A': 'left'
        },
        keyState: {},
        onKeyStateChange: null,
        target: window
    };

    ////////////////////////////////////////////////////////////////////////////
    // Private Data
    ////////////////////////////////////////////////////////////////////////////
    self.paused = false; //!< Whether or not we're taking keyboard input

    ////////////////////////////////////////////////////////////////////////////
    // Public Functions
    ////////////////////////////////////////////////////////////////////////////

    ////////////////////////////////////////////////////////////////////////////
    // Pause the handling of keyboard input
    ////////////////////////////////////////////////////////////////////////////
    self.pause = function( aPause ) {
        if( typeof( aPause ) === 'undefined' ) {
            aPause = true;
        }

        if( aPause ) {
            options.target.removeEventListener( 'keydown', self.onHandleKeyStateChange );
            options.target.removeEventListener( 'keyup', self.onHandleKeyStateChange );
            self.paused = true;
        }
        else if( self.paused ) {
            options.target.addEventListener( 'keydown', self.onHandleKeyStateChange );
            options.target.addEventListener( 'keyup', self.onHandleKeyStateChange );
            self.paused = false;
        }
    }; // End pause()

    ////////////////////////////////////////////////////////////////////////////
    // Handlers
    ////////////////////////////////////////////////////////////////////////////

    ////////////////////////////////////////////////////////////////////////////
    // Handle keyboard event
    ////////////////////////////////////////////////////////////////////////////
    self.onHandleKeyStateChange = function( aEvent ) {
        var newState = ( aEvent.type === 'keydown' ? 1 : 0 );
        var boundKey = options.keyBinding[ String.fromCharCode( aEvent.keyCode ) ];

        // Key not bound?
        if( !boundKey ) {
            return;
        }

        // Update & emit state if changed
        if( self.keyState[boundKey] !== newState ) {
            self.keyState[boundKey] = newState;

            if( typeof( self.onKeyStateChange ) === 'function' ) {
                self.onKeyStateChange( self.keyState );
            }
        }
    }; // End onHandleKeyStateChange()

    ////////////////////////////////////////////////////////////////////////////
    // Action!
    ////////////////////////////////////////////////////////////////////////////

    // Merge default options with incoming options
    merge( options, aOptions );
    self.onKeyStateChange = options.onKeyStateChange;

    // Set up initial key state
    for( var k in options.keyBinding ) {
        options.keyState[options.keyBinding[k]] = options.keyState[options.keyBinding[k]] || 0;
    }
    self.keyState = options.keyState;

    // Set keyboard handlers for app
    options.target.addEventListener( 'keydown', self.onHandleKeyStateChange );
    options.target.addEventListener( 'keyup', self.onHandleKeyStateChange );

} // End KeyboardManager()
