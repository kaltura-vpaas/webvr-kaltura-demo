AFRAME.registerComponent("button", {
    init: function () {
      this.playerEl = document.getElementById("example-video");
      this.el.addEventListener("click", () => {
        this.playerEl.player.play();
      });
    },
  });

  var container, scene, camera, renderer;
  var video, videoImage, videoImageContext, videoTexture, player;
  var trackToShow = -1;
  AFRAME.registerComponent("test", {
    schema: {
      color: { default: "green" },
      size: { type: "int", default: 5 },
      position: { type: "vec3", default: { x: 0, y: 0, z: 0 } },
      rotation: { type: "vec3", default: { x: 20, y: 40, z: 25 } },
    },
    init: function () {
      // sets a-box color to green
      this.el.setAttribute("color", this.data.color);
      // color coding debugging. if the a-box color is
      // green : there was an error in init script
      // white : the video either finished (no loop) or did not load
      // first frame of video : autoplay did not initiate and needs to have manual click
      // random frame in video : for live video playback, the stream stopped

      //instanciate player
      try {
        const config = {
          log: { level: "DEBUG" },
          targetId: "video-player",
          provider: {
            partnerId: "1726172",
            uiConfId: "44567811"
          },
          text: {
            useNativeTextTrack: true
          }
        };
        player = KalturaPlayer.setup(config);
      } catch (e) {
        console.error(e.message);
      }

      //Load media and external text track
      player.setMedia({
        sources: {
          progressive: [{
            url: "https://player.vimeo.com/external/433152966.sd.mp4?s=6d17fb621d8bc43ff5325c17eec1bf4345bd8623&profile_id=139&oauth2_token_id=1358402963",
            mimetype: "video/mp4"  
          }],
          type: "Vod",
          captions: [{
            url: "https://mlgmsod.akamaized.net/media/delivery/8d/fb/8dfbb38e-d6ec-4c59-b079-790df9b31141/_iIC3VcgCfI.en/_iIC3VcgCfI.en_00000001.vtt",
            label: "English",
            language: "lv",
            default: true
          }]
        }
      });
      player.crossOrigin = "anonymous";
      player.play();

     /* //Select the default track when tracks are loaded
      player.addEventListener(player.Event.TRACKS_CHANGED, () => {
        let languageTrack = player.getTracks("TEXT").find(track => track.language === "lv");
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
      });*/
    
      // create canvas where the images of video are going to be drawn
      videoImage = document.createElement("canvas");
      videoImage.width = 1280;
      videoImage.height = 720;
      videoImageContext = videoImage.getContext("2d");

      videoImageContext.fillStyle = "#000000";
      videoImageContext.fillRect(0, 0, videoImage.width, videoImage.height);

      // setup text parameters for subtitles
      videoImageContext.font = "50px Arial";
      videoImageContext.textAlign = "center";
      videoImageContext.textBaseline = "middle";

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
    },
    update: function () {},
    tick: function () {
      // on every frame, check if new video frame is loaded and draw the image onto canvas
      if (!player.paused) {
        // draw video image
        videoImageContext.drawImage(player.getVideoElement(), 0, 0, 1280, 720);

        var video = player.getVideoElement();

        // will attempt to retrieve subtitles if language track is set and active cue(text to display) available for this frame
        if (
          trackToShow > -1 &&
          "activeCues" in video.textTracks[trackToShow] &&
          video.textTracks[trackToShow].activeCues &&
          video.textTracks[trackToShow].activeCues.length > 0
        ) {
          //console.log('track in video, ', video.textTracks[trackToShow].activeCues[0].text, video.textTracks[trackToShow].activeCues.length)
          //console.log(video.textTracks)
          var fontSize = parseInt(videoImageContext.font);
          var marginTextBoxOffset = 1.2;
          var text = video.textTracks[trackToShow].activeCues[0].text;

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
        }

        if (videoTexture) {
          // make sure to tell the video texture that needs update on every frame
          videoTexture.needsUpdate = true;
        }
      }
    },
    remove: function () {},
    pause: function () {},
    play: function () {},
  });