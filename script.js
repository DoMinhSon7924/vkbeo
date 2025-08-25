
const YT_URL = "https://youtu.be/6nmBx1Rzc6w?si=jNNV5oPLFTca6TXL";

window.requestAnimationFrame =
  window.__requestAnimationFrame ||
  window.requestAnimationFrame ||
  window.webkitRequestAnimationFrame ||
  window.mozRequestAnimationFrame ||
  window.oRequestAnimationFrame ||
  window.msRequestAnimationFrame ||
  (function () {
    return function (callback, element) {
      var lastTime = element && element.__lastTime || 0;
      var currTime = Date.now();
      var timeToCall = Math.max(1, 33 - (currTime - lastTime));
      window.setTimeout(callback, timeToCall);
      if (element) element.__lastTime = currTime + timeToCall;
    };
  })();

window.isDevice = (/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i
  .test(((navigator.userAgent || navigator.vendor || window.opera)).toLowerCase()));

let loaded = false;


function getYouTubeId(url) {
  if (!url) return "";

  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtube\.com\/shorts\/|youtu\.be\/)([A-Za-z0-9_-]{6,})/,
    /[?&]v=([A-Za-z0-9_-]{6,})/
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m && m[1]) return m[1];
  }

  if (/^[A-Za-z0-9_-]{6,}$/.test(url)) return url;
  return "";
}

let ytPlayer = null;
let ytVideoId = getYouTubeId(YT_URL);

window.onYouTubeIframeAPIReady = function () {
  if (!ytVideoId) return;
  ytPlayer = new YT.Player('yt-player', {
    width: 200,
    height: 113,
    videoId: ytVideoId,
    playerVars: {
      autoplay: 1,     
      controls: 0,
      loop: 1,
      playlist: ytVideoId,
      modestbranding: 1,
      rel: 0,
      playsinline: 1,   
      origin: window.location.origin
    },
    events: {
      onReady: (e) => {
        try {
          e.target.mute();    
          e.target.setVolume(50);
          e.target.playVideo();
        } catch (_) {}
      }
    }
  });
};

// Mo khoa audio khi user tuong tac
function unlockYouTubeAudio() {
  if (ytPlayer && ytPlayer.unMute) {
    try {
      ytPlayer.unMute();
      ytPlayer.setVolume(70);
    } catch (_) {}
  }
  window.removeEventListener('click', unlockYouTubeAudio);
  window.removeEventListener('touchstart', unlockYouTubeAudio, { passive: true });
  window.removeEventListener('keydown', unlockYouTubeAudio);
}

// ====== Animation trai tim + text ======
var init = function () {
  if (loaded) return;
  loaded = true;

  // Dang ky mo khoa am thanh khi tuong tac
  window.addEventListener('click', unlockYouTubeAudio);
  window.addEventListener('touchstart', unlockYouTubeAudio, { passive: true });
  window.addEventListener('keydown', unlockYouTubeAudio);

  const mobile = window.isDevice;
  const koef = mobile ? 0.5 : 1;
  const canvas = document.getElementById('heart');
  const ctx = canvas.getContext('2d');

  let width = canvas.width = koef * innerWidth;
  let height = canvas.height = koef * innerHeight;
  const rand = Math.random;

  ctx.fillStyle = "rgba(0,0,0,1)";
  ctx.fillRect(0, 0, width, height);

  const heartPosition = function (rad) {
    return [
      Math.pow(Math.sin(rad), 3),
      -(15 * Math.cos(rad) - 5 * Math.cos(2 * rad) - 2 * Math.cos(3 * rad) - Math.cos(4 * rad))
    ];
  };
  const scaleAndTranslate = (p, sx, sy, dx, dy) => ([dx + p[0] * sx, dy + p[1] * sy]);

  window.addEventListener('resize', function () {
    width = canvas.width = koef * innerWidth;
    height = canvas.height = koef * innerHeight;
    ctx.fillStyle = "rgba(0,0,0,1)";
    ctx.fillRect(0, 0, width, height);
  });

  const traceCount = mobile ? 20 : 50;
  const pointsOrigin = [];
  let i;
  const dr = mobile ? 0.3 : 0.1;

  for (i = 0; i < Math.PI * 2; i += dr) pointsOrigin.push(scaleAndTranslate(heartPosition(i), 210, 13, 0, 0));
  for (i = 0; i < Math.PI * 2; i += dr) pointsOrigin.push(scaleAndTranslate(heartPosition(i), 150, 9, 0, 0));
  for (i = 0; i < Math.PI * 2; i += dr) pointsOrigin.push(scaleAndTranslate(heartPosition(i), 90, 5, 0, 0));
  const heartPointsCount = pointsOrigin.length;

  const targetPoints = [];
  const pulse = function (kx, ky) {
    for (i = 0; i < pointsOrigin.length; i++) {
      targetPoints[i] = [];
      targetPoints[i][0] = kx * pointsOrigin[i][0] + width / 2;
      targetPoints[i][1] = ky * pointsOrigin[i][1] + height / 2;
    }
  };

  const e = [];
  for (i = 0; i < heartPointsCount; i++) {
    const x = rand() * width;
    const y = rand() * height;
    e[i] = {
      vx: 0, vy: 0, R: 2,
      speed: rand() + 5,
      q: ~~(rand() * heartPointsCount),
      D: 2 * (i % 2) - 1,
      force: 0.2 * rand() + 0.7,
      f: "hsla(0," + ~~(40 * rand() + 60) + "%," + ~~(60 * rand() + 20) + "%,.3)",
      trace: []
    };
    for (let k = 0; k < traceCount; k++) e[i].trace[k] = { x, y };
  }

  const config = { traceK: 0.4, timeDelta: 0.01 };

  //
