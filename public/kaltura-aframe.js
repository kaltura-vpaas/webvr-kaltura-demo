function loadKalturaWebVR(boxId, videoSource, entryId, partnerId, playerId, ks) {

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
                this.player = KalturaPlayer.setup(config);
            } catch (e) {
                console.error(e.message);
            }

            this.player.loadMedia({ entryId: entryId });
            this.player.crossOrigin = "anonymous";

            this.player.ready().then((res) => {
                // create canvas where the images of video are going to be drawn
                this.videoImage = document.createElement("canvas");
                this.videoImage.width = 1280;
                this.videoImage.height = 720;
                this.videoImageContext = this.videoImage.getContext("2d");

                this.videoImageContext.fillStyle = "#000000";
                this.videoImageContext.fillRect(0, 0, this.videoImage.width, this.videoImage.height);

                // setup text parameters for subtitles
                this.videoImageContext.font = "50px Arial";
                this.videoImageContext.textAlign = "center";
                this.videoImageContext.textBaseline = "middle";

                // create threejs texture which is mapping canvas to texture
                this.videoTexture = new THREE.Texture(this.videoImage);
                this.videoTexture.minFilter = THREE.LinearFilter;
                this.videoTexture.magFilter = THREE.LinearFilter;

                // create material from texture
                var movieMaterial = new THREE.MeshBasicMaterial({
                    map: this.videoTexture,
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
            if (!this.player.paused
                && this.videoImageContext
                && this.player.getVideoElement()) {

                // draw video image
                this.videoImageContext.drawImage(this.player.getVideoElement(), 0, 0, 1280, 720);


                if (this.videoTexture) {
                    // make sure to tell the video texture that needs update on every frame
                    this.videoTexture.needsUpdate = true;
                }
            }
        },
        remove: function () { },
        pause: function () { },
        play: function () { },
    });
}

function initVidClick(boxDomId, videoSource, boxComponent) {
    var targetEl = document.querySelector("#" + boxDomId);
    var player = targetEl.components[boxComponent].player;
   
    targetEl.addEventListener('click', function () {
        $("#mainscene").hide();
        $("#" + videoSource).show();
        $("#back2vr").show();
        player.muted = false;
    });

    $("#back2vr").click(function () {
        $("#" + videoSource).hide();
        $("#back2vr").hide();
        $("#mainscene").show();
        player.muted = true;
    });
}