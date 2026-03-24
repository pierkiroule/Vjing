const VideoManager = (function () {
  var video = document.createElement('video');
  video.crossOrigin = 'anonymous';
  video.loop = true;
  video.muted = true;
  video.playsInline = true;

  var currentStream = null;

  function stopCurrent() {
    try {
      video.pause();
      video.srcObject = null;
      video.src = '';
    } catch (e) {}

    if (currentStream) {
      try {
        currentStream.getTracks().forEach(function (t) { t.stop(); });
      } catch (e) {}
      currentStream = null;
    }
  }

  function useVideoFile(url) {
    stopCurrent();
    if (!url) return;
    video.src = url;
    video.play().catch(function () {});
  }

  function useWebcam() {
    stopCurrent();
    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      .then(function (stream) {
        currentStream = stream;
        video.srcObject = stream;
        video.play().catch(function () {});
      })
      .catch(function () {});
  }

  function useIPCam(url) {
    stopCurrent();
    video.src = url;
    video.play().catch(function () {});
  }

  function getVideo() {
    return video;
  }

  return {
    useVideoFile: useVideoFile,
    useWebcam: useWebcam,
    useIPCam: useIPCam,
    getVideo: getVideo
  };
})();
