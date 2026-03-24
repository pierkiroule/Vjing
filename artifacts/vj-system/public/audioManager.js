const AudioManager = (function () {
  let audioContext = null;
  let analyser = null;
  let dataArray = null;
  let initialized = false;
  let failed = false;

  function init() {
    if (initialized) return;
    initialized = true;

    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      dataArray = new Uint8Array(analyser.frequencyBinCount);

      navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        .then(function (stream) {
          var source = audioContext.createMediaStreamSource(stream);
          source.connect(analyser);
        })
        .catch(function () {
          failed = true;
        });
    } catch (e) {
      failed = true;
    }
  }

  function getAudioLevel() {
    if (failed || !analyser || !dataArray) return 0;
    analyser.getByteFrequencyData(dataArray);
    var sum = 0;
    for (var i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    return sum / (dataArray.length * 255);
  }

  return { init: init, getAudioLevel: getAudioLevel };
})();
