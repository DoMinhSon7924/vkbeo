// ====== requestAnimationFrame fallback ======
window.requestAnimationFrame =
  window.__requestAnimationFrame ||
  window.requestAnimationFrame ||
  window.webkitRequestAnimationFrame ||
  window.mozRequestAnimationFrame ||
  window.oRequestAnimationFrame ||
  window.msRequestAnimationFrame ||
  (function () {
    return function (callback, element) {
      var lastTime = element.__lastTime;
      if (lastTime === undefined) lastTime = 0;
      var currTime = Date.now();
      var timeToCall = Math.max(1, 33 - (currTime - lastTime));
      window.setTimeout(callback, timeToCall);
      element.__lastTime = currTime + timeToCall;
    };
  })();

window.isDevice = (/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i
  .test(((navigator.userAgent || navigator.vendor || window.opera)).toLowerCase()));

let loaded = false;

var init = function () {
  if (loaded) return;
  loaded = true;

  // ====== Nhac nen: co gang autoplay + fallback ======
  const audio = document.getElementById('bgm');
  const tryPlay = () => {
    audio.play().catch(() => {
      // De trong: trinh duyet co the chan; se bat lai khi user tuong tac
    });
  };
  tryPlay();

  // Fallback: neu bi chan, se play khi user tuong tac lan dau
  const unlockAudio = () => {
    audio.play().finally(() => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio, { passive: true });
      window.removeEventListener('keydown', unlockAudio);
    });
  };
  window.addEventListener('click', unlockAudio);
  window.addEventListener('touchstart', unlockAudio, { passive: true });
  window.addEventListener('keydown', unlockAudio);

  // ====== Canvas & Heart ======
  const mobile = window.isDevice;
  const koef = mobile ? 0.5 : 1;
  const canvas = document.getElementById('heart');
  const ctx = canvas.getContext('2d');

  let width = canvas.width = koef * innerWidth;
  let height = canvas.height = koef * innerHeight;
  const rand = Math.random;

  ctx.fillStyle = "rgba(0,0,0,1)";
  ctx.fillRect(0, 0, width, height);

  // Toa do hinh trai tim (parametric)
  const heartPosition = function (rad) {
    return [
      Math.pow(Math.sin(rad), 3),
      -(15 * Math.cos(rad) - 5 * Math.cos(2 * rad) - 2 * Math.cos(3 * rad) - Math.cos(4 * rad))
    ];
  };
  const scaleAndTranslate = (pos, sx, sy, dx, dy) => ([dx + pos[0] * sx, dy + pos[1] * sy]);

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
      vx: 0,
      vy: 0,
      R: 2,
      speed: rand() + 5,
      q: ~~(rand() * heartPointsCount),
      D: 2 * (i % 2) - 1,
      force: 0.2 * rand() + 0.7,
      f: "hsla(0," + ~~(40 * rand() + 60) + "%," + ~~(60 * rand() + 20) + "%,.3)",
      trace: []
    };
    for (let k = 0; k < traceCount; k++) e[i].trace[k] = { x, y };
  }

  const config = {
    traceK: 0.4,
    timeDelta: 0.01
  };

  // ====== Text "I love you": hien tu tu dong bo nhip trai tim ======
  const LOVE_TEXT = "I love you";
  let textAlpha = 0;          // do trong suot hien thi (0..1)
  let textProgress = 0;       // do dai chu duoc hien (0..LOVE_TEXT.length)
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp01 = (v) => Math.max(0, Math.min(1, v));

  function drawLoveText(syncValue) {
    // syncValue ~ (1+n)/2 tu 0..1 dong bo nhip tim
    // Tien do chu (so ky tu) va do trong suot tang theo syncValue (co lam muot)
    textAlpha = lerp(textAlpha, syncValue, 0.08);
    const targetChars = Math.floor(lerp(0, LOVE_TEXT.length, syncValue));
    textProgress = lerp(textProgress, targetChars, 0.25);

    // Ve chu
    ctx.save();
    ctx.globalAlpha = textAlpha;

    // Co chu ty le theo man hinh
    const base = Math.min(width, height);
    const fontSize = Math.max(24, Math.round(base * 0.10)); // 10% chieu ngan nhat
    ctx.font = `${fontSize}px "Poppins", "Segoe UI", Roboto, Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Bong do nhe de noi bat
    ctx.shadowColor = "rgba(255, 0, 80, 0.6)";
    ctx.shadowBlur = Math.round(fontSize * 0.3);

    // Mau chu hong trang
    const grad = ctx.createLinearGradient(width/2 - fontSize, 0, width/2 + fontSize, 0);
    grad.addColorStop(0, "#fff0f5");
    grad.addColorStop(1, "#ffc0cb");
    ctx.fillStyle = grad;

    const textToShow = LOVE_TEXT.slice(0, Math.max(0, Math.floor(textProgress)));
    // Vi tri: ngay duoi tam trai tim mot chut
    const y = height * 0.65;
    ctx.fillText(textToShow, width / 2, y);
    ctx.restore();
  }

  let time = 0;
  const loop = function () {
    const n = -Math.cos(time);           // 0..2⟶ sau khi chuan hoa ve 0..1
    pulse((1 + n) * 0.5, (1 + n) * 0.5); // nhip trai tim
    // Tang toc/lam cham giong code goc
    time += ((Math.sin(time)) < 0 ? 9 : (n > 0.8) ? 0.2 : 1) * config.timeDelta;

    // Nen mo de tao vet keo
    ctx.fillStyle = "rgba(0,0,0,.1)";
    ctx.fillRect(0, 0, width, height);

    // Particles
    for (i = e.length; i--;) {
      const u = e[i];
      const q = targetPoints[u.q];
      const dx = u.trace[0].x - q[0];
      const dy = u.trace[0].y - q[1];
      const length = Math.sqrt(dx * dx + dy * dy);

      if (10 > length) {
        if (0.95 < Math.random()) {
          u.q = ~~(Math.random() * heartPointsCount);
        } else {
          if (0.99 < Math.random()) u.D *= -1;
          u.q += u.D;
          u.q %= heartPointsCount;
          if (0 > u.q) u.q += heartPointsCount;
        }
      }

      u.vx += -dx / (length || 1) * u.speed;
      u.vy += -dy / (length || 1) * u.speed;
      u.trace[0].x += u.vx;
      u.trace[0].y += u.vy;
      u.vx *= u.force;
      u.vy *= u.force;

      for (let k = 0; k < u.trace.length - 1;) {
        const T = u.trace[k];
        const N = u.trace[++k];
        N.x -= config.traceK * (N.x - T.x);
        N.y -= config.traceK * (N.y - T.y);
      }

      ctx.fillStyle = u.f;
      for (let k = 0; k < u.trace.length; k++) {
        ctx.fillRect(u.trace[k].x, u.trace[k].y, 1, 1);
      }
    }

    // Ve chu "I love you" dong bo nhip trai tim
    const syncValue = clamp01((1 + n) * 0.5); // 0..1
    drawLoveText(syncValue);

    window.requestAnimationFrame(loop, canvas);
  };

  loop();
};

const s = document.readyState;
if (s === 'complete' || s === 'loaded' || s === 'interactive') init();
else document.addEventListener('DOMContentLoaded', init, false);
