// ==== requestAnimationFrame fallback ====
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

var init = function () {
    if (loaded) return;
    loaded = true;

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

 // ==== Text "vk miu miu bel" tren cung, font Fantasy ====
const LOVE_TEXT = "vk miu miu bel";

function drawLoveText(syncValue) {
  // alpha theo nhip tim
  const minA = 0.25;
  const maxA = 0.95;
  const alpha = minA + (maxA - minA) * syncValue;

  ctx.save();
  ctx.globalAlpha = alpha;

  const base = Math.min(width, height);
  const fontSize = Math.max(28, Math.round(base * 0.09)); // chu to hon chut
  ctx.font = `${fontSize}px Fantasy`;
  ctx.textAlign = "center";
  ctx.textBaseline = "top"; // can tren

  // bong mo hong
  ctx.shadowColor = "rgba(255, 0, 120, 0.7)";
  ctx.shadowBlur = Math.round(fontSize * 0.35);

  const grad = ctx.createLinearGradient(width/2 - fontSize, 0, width/2 + fontSize, 0);
  grad.addColorStop(0, "#ffe0f0");
  grad.addColorStop(1, "#ff66cc");
  ctx.fillStyle = grad;

  const y = height * 0.08; // tren cung (khoang 8% chieu cao man hinh)
  ctx.fillText(LOVE_TEXT, width / 2, y);

  ctx.restore();
}

    let time = 0;
    const loop = function () {
        const n = -Math.cos(time);
        pulse((1 + n) * 0.5, (1 + n) * 0.5);
        time += ((Math.sin(time)) < 0 ? 9 : (n > 0.8) ? 0.2 : 1) * config.timeDelta;

        ctx.fillStyle = "rgba(0,0,0,.1)";
        ctx.fillRect(0, 0, width, height);

        for (i = e.length; i--;) {
            const u = e[i];
            const q = targetPoints[u.q];
            const dx = u.trace[0].x - q[0];
            const dy = u.trace[0].y - q[1];
            const length = Math.sqrt(dx * dx + dy * dy) || 1;

            if (10 > length) {
                if (0.95 < Math.random()) {
                    u.q = ~~(Math.random() * heartPointsCount);
                } else {
                    if (0.99 < Math.random()) u.D *= -1;
                    u.q += u.D;
                    u.q %= heartPointsCount;
                    if (u.q < 0) u.q += heartPointsCount;
                }
            }

            u.vx += -dx / length * u.speed;
            u.vy += -dy / length * u.speed;
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

        const syncValue = (1 + n) * 0.5; // 0..1
        drawLoveText(syncValue);

        window.requestAnimationFrame(loop, canvas);
    };

    loop();
};

const s = document.readyState;
if (s === 'complete' || s === 'loaded' || s === 'interactive') init();
else document.addEventListener('DOMContentLoaded', init, false);
