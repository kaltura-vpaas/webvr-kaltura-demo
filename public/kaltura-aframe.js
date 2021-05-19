function loadKalturaWebVR(boxId, videoSource,entryId, partnerId, playerId, ks ) {
    var videoImage, videoImageContext, videoTexture, player;

    AFRAME.registerComponent(boxId, {
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

            //instantiate player
            try {
                const config = {
                    playback: {
                        autoplay: true,
                        allowMutedAutoPlay: true
                    },
                    log: { level: "DEBUG" },
                    targetId: videoSource,
                    provider: {
                        partnerId: partnerId,
                        uiConfId: playerId,
                        ks: ks
                    },
                    text: {
                        useNativeTextTrack: true
                    }
                };
                player = KalturaPlayer.setup(config);
            } catch (e) {
                console.error(e.message);
            }

            player.loadMedia({ entryId: entryId });
            player.crossOrigin = "anonymous";

            player.ready().then((res) => {
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
            });

        },
        update: function () { },
        tick: function () {
            // on every frame, check if new video frame is loaded and draw the image onto canvas
            // protect against race conditions where videoImageContext or player.getVideoElement()
            // not defined yet
            if (!player.paused
                && videoImageContext
                && player.getVideoElement()) {

                // draw video image
                videoImageContext.drawImage(player.getVideoElement(), 0, 0, 1280, 720);

                var video = player.getVideoElement();
                if (videoTexture) {
                    // make sure to tell the video texture that needs update on every frame
                    videoTexture.needsUpdate = true;
                }
            }
        },
        remove: function () { },
        pause: function () { },
        play: function () { },
    });
}

function initVidClick(boxDomId, videoSource) {
    var targetEl = document.querySelector("#" + boxDomId);
    targetEl.addEventListener('click', function () {
        console.log("EGG");
        $("#mainscene").hide();
        $("#"+videoSource).show();
        $("#back2vr").show();
    });

    $("#back2vr").click(function () {
        $("#"+videoSource).hide();
        $("#back2vr").hide();
        $("#mainscene").show();
    });
}