
const video = document.getElementById('video');
const overlay = document.getElementById('overlay');
const octx = overlay.getContext('2d');
const canvas = document.getElementById('headbandCanvas');
const ctx = canvas.getContext('2d');
const textInput = document.getElementById('textInput');
const patternSelect = document.getElementById('patternSelect');
const patternColor = document.getElementById('patternColor');
const repeatCount = document.getElementById('repeatCount');

// 繪製織帶樣式
function drawHeadbandPreview() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = patternColor.value;
  const repeat = parseInt(repeatCount.value);
  for (let i = 0; i < repeat; i++) {
    if (patternSelect.value === "moon") {
      ctx.beginPath();
      ctx.arc(30 + i * 50, 25, 10, 0, Math.PI * 2);
      ctx.fill();
    } else if (patternSelect.value === "vstripe") {
      ctx.save();
      ctx.translate(i * 50, 0);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(20, 50);
      ctx.lineWidth = 4;
      ctx.strokeStyle = patternColor.value + "AA";
      ctx.stroke();
      ctx.restore();
    }
  }
  ctx.fillStyle = "#000";
  ctx.font = "bold 14px sans-serif";
  ctx.fillText(textInput.value, 10, 45);
}

[textInput, patternSelect, patternColor, repeatCount].forEach(el =>
  el.addEventListener("input", drawHeadbandPreview)
);

drawHeadbandPreview();

// 啟動相機
navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
  video.srcObject = stream;
});

// 載入 face-api 模型並開始追蹤
Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri("https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights"),
  faceapi.nets.faceExpressionNet.loadFromUri,
  faceapi.nets.faceLandmark68Net.loadFromUri("https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights")

]).then(startTracking);

// 泡泡資料
const bubbles = [];
const bunnyEmoji = "🐰";

function drawBubbles(ctx) {
  for (let i = bubbles.length - 1; i >= 0; i--) {
    let b = bubbles[i];
    ctx.font = "24px serif";
    ctx.globalAlpha = b.alpha;
    ctx.fillText(bunnyEmoji, b.x, b.y);
    b.y -= 1.2;
    b.alpha -= 0.005;
    if (b.alpha <= 0) bubbles.splice(i, 1);
  }
  ctx.globalAlpha = 1.0;
}


function startTracking() {
  video.addEventListener("play", () => {
    const render = async () => {
      const result = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions();
      octx.clearRect(0, 0, overlay.width, overlay.height);
      if (result) {
        const left = result.landmarks.getLeftEyeBrow()[0];
        const right = result.landmarks.getRightEyeBrow()[4];
        const width = right.x - left.x + 40;
        const x = left.x - 20;
        const y = left.y - 40;

        // 套用織帶圖像
        octx.drawImage(canvas, x, y, width, 30);
      }
      
      if (result.expressions && result.expressions.mouthOpen > 0.7) {
        bubbles.push({ x: overlay.width / 2 + (Math.random() * 100 - 50), y: overlay.height - 50, alpha: 1 });
      }
      drawBubbles(octx);
      requestAnimationFrame(render);

    };
    render();
  });
}
