# Kaltura Virtual Reality Player
A proof of concept to demonstrate the [Kaltura Player](https://developer.kaltura.com/player/web/getting-started-web) inside of WebVR player using the https://aframe.io/ VR framework. 

## Demo:

[Click here for demo](https://kaltura-vpaas.github.io/webvr-kaltura-demo/readme-assets/blender-example.html)

![main](readme-assets/main.jpg)



## Requirements:

1. [Nodejs](https://nodejs.org/en/)
2. [Kaltura VPaaS account](https://corp.kaltura.com/video-paas/registration?utm_campaign=Meetabout&utm_medium=affiliates&utm_source=GitHub)

## Getting Started:

1. Copy env.template to .env and fill in your information as per its instructions.
2. Run: npm install
3. Run: npm start
4. Navigate to http://localhost:3000

# Examples:

###  Proof of Concept

[Proof of concept demo](https://kaltura-vpaas.github.io/webvr-kaltura-demo/readme-assets/poc.html) 

![poc](readme-assets/poc.jpg)

This is the bare minimum of code to run a Kaltura player inside of an aframe WebVR scene. 

First the Kaltura Player code is retrieved for your account: 

```ejs
<script src="https://cdnapisec.kaltura.com/p/<%=process.env.PARTNER_ID%>/embedPlaykitJs/uiconf_id/<%=process.env.PLAYER_ID%>"></script> 
```

Next, take a look at the body:

```html
<body>
  <!-- Kaltura Player -->
  <div id="video-player" style="display: none"></div>

  <a-scene raycaster cursor="rayOrigin: mouse">
    <!-- some static objects -->
    <a-sky color="#BDC9C1"></a-sky>
    <a-plane position="0 0 -4" rotation="-90 0 0" width="4" height="4" color="#7BC8A4"></a-plane>
    <a-box position="-1 0.5 -3" rotation="0 45 0" color="#4CC3D9"></a-box>
    <a-sphere position="3 1.25 -5" radius="1.25" color="#EF2D5E"></a-sphere>

    <!-- The video box-->
    <a-box 3dvid position="0 2 -4" rotation="20 40 25" width="4" height="2" ></a-box>
  </a-scene>

</body>
```

First a div `video-player` is created to inject the Kaltura player into, but it is not actually displayed, this will be explained later.

Next, some static `aframe` objects are created, these are not necessary, but show how this the Kaltura player can be injected into a scene of any complexity or a simple one like this example. 

Finally, the `aframe` object that will become the video player: 

```html
<a-box 3dvid position="0 2 -4" rotation="20 40 25" width="4" height="2" ></a-box>

This is a normal `aframe` box object. However, notice the `3dvid` attribute. This is an arbitrary string with no special meaning used to identify this box for `aframe`

Next, the box will be combined with the video:

​```javascript
 AFRAME.registerComponent("3dvid", {
```

Notice the `3dvid` tag from the html is used to identify and register the specific box component with `aframe`

Next the Kaltura player is loaded as it would normally be in any context:

```javascript
         const config = {
            playback: {
              autoplay: true,
              allowMutedAutoPlay: true
            },
            log: { level: "DEBUG" },
            targetId: "video-player",
            provider: {
              partnerId: "<%=process.env.PARTNER_ID%>",
              uiConfId: "<%=process.env.PLAYER_ID%>"
            },
            text: {
              useNativeTextTrack: true
            }
          };
          player = KalturaPlayer.setup(config);
        } catch (e) {
          console.error(e.message);
        }

        player.loadMedia({ entryId: '<%=process.env.ENTRY_ID%>' });
```

Now, through a clever use of `three.js` and the `<canvas>` element each frame of the Kaltura video is captured, buffered through the canvas and drawn onto the `aframe` box element:

```javascript
          // create threejs texture which is mapping canvas to texture
          videoTexture = new THREE.Texture(videoImage);
          videoTexture.minFilter = THREE.LinearFilter;
          videoTexture.magFilter = THREE.LinearFilter;

          // create material from texture
          var movieMaterial = new THREE.MeshBasicMaterial({
            map: videoTexture,
            side: THREE.DoubleSide,
          });

          // assign material to this object's mash
          this.el.getObject3D("mesh").material = movieMaterial;
```

The video is explicitly configured to auto-play on page load, covered above:

```javascript
            playback: {
              autoplay: true,
              allowMutedAutoPlay: true
            },
```

And due to browsers muting video that autoplays, an event listener is created to unmute the video when the user clicks anywhere:

```javascript
    document.addEventListener('click', function (evt) {
      player.muted = false;
    });
```



### Captions Example

[Captions Demo](https://kaltura-vpaas.github.io/webvr-kaltura-demo/readme-assets/captions.html)

![captions](readme-assets/captions.jpg)

Normally, the Kaltura player handles captions out of the box at the [API](https://developer.kaltura.com/workflows/Enrich_and_Organize_Metadata) level and also simply through the [KMC](https://kmc.kaltura.com/index.php/kmcng/login)

However, in the context of this WebVR example, some extra work must be done to make captions work. 

The captions example builds off the proof of concept example above.

First, the captions must be explicitly loaded into the player: 

```javascript
        //Load media and external text track
        player.setMedia({
          sources: {
            captions: [
              {
                url: "en.srt",
                label: "English",
                language: "en",
                default: true
              }, {
                url: "fr.srt",
                label: "French",
                language: "fr",
                default: true
              },
            ]
          }
        });
```

These srt files are included in this example and served locally. 

Some extra configuration is needed to load the default captions. This could be altered to auto-detect the default system language via javascript `navigator.language` 

```javascript
        //Select the default track when tracks are loaded
        player.addEventListener(player.Event.TRACKS_CHANGED, () => {
          let languageTrack = player.getTracks("TEXT").find(track => track.language === "en");
          player.selectTrack(languageTrack);

          // set track id based on langauge
          let textTracks = player.getVideoElement().textTracks;
          console.log("textTracks", textTracks);
          var languageToShow = "playkit-external-track";
          for (let i = 0, len = textTracks.length; i < len; i++) {
            console.log("language", textTracks[i].language);
            if (textTracks[i].language == languageToShow) {
              console.log("track to show", i);
              trackToShow = i;
            }
          }
        });
```

Finally, through some math, the text is drawn in the correct location:

```javascript
            //videoImageContext.font = `${fontSize}px Arial`;
            // measures how wide the text is going to be in pixels
            var textWidth = videoImageContext.measureText(text).width;

            //will draw and 50% transparent white box behind the text to make the text better visible
            videoImageContext.fillStyle = "rgba(255, 255, 255, 0.5)";
            videoImageContext.fillRect(
              1280 / 2 - (textWidth * marginTextBoxOffset) / 2,
              (720 / 8) * 7 - (fontSize * marginTextBoxOffset) / 2,
              textWidth * marginTextBoxOffset,
              fontSize * marginTextBoxOffset
            );

            // draw text
            videoImageContext.fillStyle = "black";
            videoImageContext.fillText(text, 1280 / 2, (720 / 8) * 7);
```



### Blender WebVR Example:

[Blender demo](https://kaltura-vpaas.github.io/webvr-kaltura-demo/readme-assets/blender-example.html)

![main](readme-assets/main.jpg)

Most 3d scenes are created in 3d creation application like the popular free and open source [Blender](https://www.blender.org/)

In this example, Blender was used to create a scene that integrates the video player from the above examples into a more real-world use case. 

#### Setup

1. Install Blender:  [Blender](https://www.blender.org/)
2. Install the Blender aframe exporter: https://github.com/silverslade/aframe_blender_exporter

A free, opensource ready-made scene was downloaded from https://sketchfab.com/feed (you'll want to install the importer plugin for Blender)

In the scene, a placeholder cube was created in the same dimensions (16:9) as the video and placed exactly where the video will appear in the final scene. 

![blender_cube](readme-assets/blender_cube.jpg)

Once you are satisfied with you scene, use the aframe exporter to export an aframe scene:

# ![blender_aframe](readme-assets/blender_aframe.jpg) 

In the `index.html` produced by the aframe exporter,  find the cube asset you created as a placeholder, and change it to an `aframe` box. You will have to experiment with dimensions of the box between `height`, `width` and `depth` , but the position will be correct:

```html
 <a-box test height="7.2" depth="12.8" position="-13.982090950012207 8.457517623901367 2.251915454864502"
      visible="true" shadow="cast: false"></a-box>
```

As you see above, the `test` identifier was given to the box, and the same `aframe` registration code was used to initialize this box and make it a playing video. 

# Contributing

Thank you for helping Kaltura grow! If you'd like to contribute please follow these steps:

* Use the repository issues tracker to report bugs or feature requests
* Read [Contributing Code to the Kaltura Platform](https://github.com/kaltura/platform-install-packages/blob/master/doc/Contributing-to-the-Kaltura-Platform.md)
* Sign the [Kaltura Contributor License Agreement](https://agentcontribs.kaltura.org/)

# Where to get help
* Join the [Kaltura Community Forums](https://forum.kaltura.org/) to ask questions or start discussions
* Read the [Code of conduct](https://forum.kaltura.org/faq) and be patient and respectful

# Get in touch
You can learn more about Kaltura and start a free trial at: http://corp.kaltura.com    
Contact us via Twitter [@Kaltura](https://twitter.com/Kaltura) or email: community@kaltura.com  
We'd love to hear from you!

# License and Copyright Information
All code in this project is released under the [AGPLv3 license](http://www.gnu.org/licenses/agpl-3.0.html) unless a different license for a particular library is specified in the applicable library path.   

Copyright © Kaltura Inc. All rights reserved.   
Authors and contributors: See [GitHub contributors list](https://github.com/kaltura/YOURREPONAME/graphs/contributors).  

### Open Source Libraries Used

https://aframe.io/ 

https://threejs.org/

https://www.blender.org/

https://github.com/silverslade/aframe_blender_exporter