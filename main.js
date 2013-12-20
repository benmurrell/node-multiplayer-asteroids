////////////////////////////////////////////////////////////////////////////////
// main.js
//
// Entry point for multiplayer asteroids game server
//
// Copyright (C) 2013 Ben Murrell
////////////////////////////////////////////////////////////////////////////////

var express = require( 'express' );
var path = require( 'path' );

// Create express app to serve up html based visualizer & control clients
var expressApp = express();
expressApp.configure( function() {
    expressApp.use( express.logger( 'dev' ) );
    expressApp.use( express.static( path.join( __dirname, 'public' ) ) );
});

// Start serving express app
var server = require( 'http' ).createServer( expressApp ).listen( 8080 );

// Create socket.io server, listen on same port/ip as express http server
var io = require( 'socket.io' ).listen( server );
io.set( 'log level', 1 );

// Create game instance
var AsteroidsGame = require( './asteroids.js' );
var game = new AsteroidsGame();

// Pass new connections to the game
io.sockets.on( 'connection', function ( aSocket ) {
    game.onConnect( aSocket );
});
