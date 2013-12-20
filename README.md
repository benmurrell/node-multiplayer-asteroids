Node Multiplayer Asteroids
==========================

This ia a node.js implementation of a multiplayer asteroids game that is playable in the browser.

The game was developed such that the game is controlled from a separate browser instance than it is viewed in. This was done so that a single display could be used while multiple players used their mobile devices to control their ship on the screen.

Install
-------

To install the server, clone the repository then install the node dependences with:

```
npm install
```

Run
---

### Server

To run the server, run:

```
node main.js
```

### Visualizer

To run the visualizer, connect to the server (running on port 8080) in your web browser and click "Watch".

![ScreenShot](/screenshots/visualizer.png)

Pressing 'n' toggles whether player names are shown or not.

### Control

To play the game, connect to the server (running on port 8080) in your web browser and click "Play".

![ScreenShot](/screenshots/control.png)

In a browser that supports touch events, the four colored rectangles along the bottom of the screen allow you to turn, accelerate, and shoot.

Keyboard controls are also supported, use the standard WASD for movement and space for shooting.

Notes
-----

### Compatibility
Since this is a personal project, browser compatibility is not a priority. Development and testing was done in:

*    Chrome: OS X, Windows, iOS
*    Safari: iOS

I have also seen the control client run on an older Android phone.

In theory, as long as your browser supports socket.io and CSS3 3D transforms, the game should work on your browser. Again, since this is a personal project, I haven't used all of the browser prefixes so I only expect the game to work in webkit based browsers.

### Performance
This was done as a personal proof of concept project, so there are probably many areas where performance gains could be made. This is certainly the case when looking at the amount of bandwidth used when updating the state of the clients! Currently, it uses about 20KB/s per visualizer client and 7KB/s per control client.

### Credits
 * Images were generated at http://flaticons.net/

 * Sounds were created with the help of http://www.bfxr.net/

 * https://github.com/jeromeetienne/webaudio.js was used as an audio abstraction layer, but had to be modified to work in iOS