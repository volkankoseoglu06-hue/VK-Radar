(() => {
  const video = document.getElementById("cameraVideo");
  const stage = document.getElementById("videoStage");
  const startButton = document.getElementById("startCamera");
  const stopButton = document.getElementById("stopCamera");
  const stateLabel = document.getElementById("cameraState");
  const message = document.getElementById("cameraMessage");
  const clockLabel = document.getElementById("clockLabel");
  const locationMessage = document.getElementById("locationMessage");
  const enableLocationButton = document.getElementById("enableLocation");
  const speedAlertToggle = document.getElementById("speedAlertToggle");
  const voiceAlertToggle = document.getElementById("voiceAlertToggle");
  const alertLimit = document.getElementById("alertLimit");
  const countLabel = document.getElementById("vehicleCount");
  const cameraSpeed = document.getElementById("cameraSpeed");
  const cameraSpeedState = document.getElementById("cameraSpeedState");
  const gpsSpeed = document.getElementById("gpsSpeed");
  const gpsSpeedNote = document.getElementById("gpsSpeedNote");
  const fullscreenButton = document.getElementById("fullscreenCamera");
  const detectionNote = document.getElementById("detectionNote");
  const canvas = document.getElementById("detectionCanvas");
  const ctx = canvas.getContext("2d");
  const vehicleClasses = new Set(["car", "truck", "bus", "motorcycle"]);
  const turkishLabels = {car:"Otomobil",truck:"Kamyon",bus:"Otobüs",motorcycle:"Motosiklet"};
  let cameraStream = null, watchId = null, lastAlertAt = 0, model = null;
  let detectionActive = false, detectionBusy = false, rafId = null, lastDetectionAt = 0;

  function setMessage(text) { message.textContent = text; }

  async function loadModel() {
    if (model) return model;
    if (!window.cocoSsd || !window.tf) throw new Error("Algılama kütüphanesi yüklenemedi. İnternet bağlantısını kontrol et.");
    setMessage("Araç algılama modeli yükleniyor; ilk açılış biraz sürebilir…");
    await tf.ready();
    model = await cocoSsd.load({base:"lite_mobilenet_v2"});
    return model;
  }

  async function detectLoop(now) {
    if (!detectionActive || !cameraStream) return;
    rafId = requestAnimationFrame(detectLoop);
    if (detectionBusy || now - lastDetectionAt < 250 || video.readyState < 2 || !model) return;
    detectionBusy = true;
    lastDetectionAt = now;
    try {
      const predictions = await model.detect(video, 20, 0.45);
      const vehicles = predictions.filter(p => vehicleClasses.has(p.class) && p.score >= 0.45);
      const width = video.videoWidth, height = video.videoHeight;
      if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
      ctx.clearRect(0,0,width,height);
      ctx.lineWidth = Math.max(3, width / 320);
      ctx.font = "bold " + Math.max(16, width / 38) + "px -apple-system, sans-serif";
      vehicles.forEach(p => {
        const [x,y,w,h] = p.bbox;
        ctx.strokeStyle = "#51dfd1";
        ctx.fillStyle = "#51dfd1";
        ctx.strokeRect(x,y,w,h);
        const label = (turkishLabels[p.class] || p.class) + " " + Math.round(p.score*100) + "%";
        const labelWidth = ctx.measureText(label).width + 16;
        const labelY = Math.max(0, y - 28);
        ctx.fillRect(x,labelY,labelWidth,26);
        ctx.fillStyle = "#071522";
        ctx.fillText(label,x+8,labelY+19);
      });
      countLabel.textContent = String(vehicles.length);
      detectionNote.textContent = "Canlı algılama · " + vehicles.length + " araç";
      setMessage("Araç algılama çalışıyor. Kutular araç tespitlerini gösterir; yüzde değeri model güvenidir, hız değildir.");
    } catch (e) {
      detectionNote.textContent = "Algılama hatası";
      setMessage("Araç algılama durdu. Sayfayı yenileyip tekrar dene.");
      detectionActive = false;
    } finally { detectionBusy = false; }
  }

  async function startCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMessage("Kamera için bu sayfayı HTTPS üzerinden aç ve Safari kamera iznini kontrol et.");
      return;
    }
    startButton.disabled = true;
    setMessage("Kamera açılıyor…");
    try {
      cameraStream = await navigator.mediaDevices.getUserMedia({
        audio:false, video:{facingMode:{ideal:"environment"},width:{ideal:1280},height:{ideal:720}}
      });
      video.srcObject = cameraStream;
      await video.play();
      stage.classList.add("active");
      stateLabel.textContent = "AÇIK";
      stopButton.disabled = false;
      document.querySelector(".live-dot").style.background = "var(--cyan)";
      detectionActive = true;
      await loadModel();
      detectionNote.textContent = "Model hazır";
      setMessage("Model hazır; araçlar aranıyor…");
      rafId = requestAnimationFrame(detectLoop);
    } catch (error) {
      if (cameraStream) cameraStream.getTracks().forEach(t => t.stop());
      cameraStream = null;
      stage.classList.remove("active");
      stateLabel.textContent = "KAPALI";
      const detail = error && error.name === "NotAllowedError"
        ? "Kamera izni verilmedi. Safari ayarlarından kamera iznini aç."
        : error && error.name === "NotFoundError"
          ? "Kullanılabilir kamera bulunamadı."
          : error && error.message && error.message.includes("Algılama kütüphanesi")
            ? error.message
            : "Kamera veya model açılamadı. İnternet bağlantısını ve Safari izinlerini kontrol et.";
      setMessage(detail);
      startButton.disabled = false;
      stopButton.disabled = true;
    }
  }

  function stopCamera() {
    detectionActive = false;
    if (rafId !== null) cancelAnimationFrame(rafId);
    rafId = null;
    if (cameraStream) cameraStream.getTracks().forEach(t => t.stop());
    cameraStream = null;
    video.pause(); video.srcObject = null;
    stage.classList.remove("active");
    stateLabel.textContent = "KAPALI";
    startButton.disabled = false; stopButton.disabled = true;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    countLabel.textContent = "0";
    detectionNote.textContent = "Kamera kapalı";
    document.querySelector(".live-dot").style.background = "";
    setMessage("Kamera kapalı. Yeniden başlatmak için düğmeye bas.");
  }

  function announce(text) {
    if (!voiceAlertToggle.checked || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text); u.lang = "tr-TR"; u.rate = 1;
    window.speechSynthesis.speak(u);
  }

  function startLocationSpeedAlert() {
    if (!("geolocation" in navigator)) { locationMessage.textContent = "Bu tarayıcı GPS erişimini desteklemiyor."; return; }
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId); watchId = null;
      enableLocationButton.textContent = "GPS ve hız uyarısını etkinleştir";
      locationMessage.textContent = "GPS takibi durduruldu."; cameraSpeedState.textContent = "GPS durduruldu"; return;
    }
    locationMessage.textContent = "Konum izni bekleniyor…";
    watchId = navigator.geolocation.watchPosition(position => {
      const speedMs = position.coords.speed;
      if (speedMs === null || !Number.isFinite(speedMs)) {
        locationMessage.textContent = "GPS konumu alındı; cihaz henüz hız değeri sağlamıyor.";
        cameraSpeed.innerHTML = "— <small>km/sa</small>"; gpsSpeed.innerHTML = "— <small>km/sa</small>"; cameraSpeedState.textContent = "Hız alınamıyor"; gpsSpeedNote.textContent = "Cihaz GPS hızı sağlamıyor"; return;
      }
      const speed = Math.round(speedMs*3.6), limit = Number(alertLimit.value)||50;
      locationMessage.textContent = "Telefonun GPS hızı: " + speed + " km/sa.";
      cameraSpeed.innerHTML = speed + " <small>km/sa</small>";
      gpsSpeed.innerHTML = speed + " <small>km/sa</small>";
      cameraSpeedState.textContent = "GPS canlı";
      gpsSpeedNote.textContent = "GPS konumundan alınan hız";
      if (speedAlertToggle.checked && speed > limit && Date.now()-lastAlertAt > 20000) {
        lastAlertAt = Date.now(); announce("Dikkat. Hızınız " + speed + " kilometre. Ayarlanan sınır " + limit + ".");
      }
      enableLocationButton.textContent = "GPS takibini durdur";
    }, error => {
      locationMessage.textContent = error.code === 1 ? "Konum izni verilmedi; Safari ayarlarından izin ver." : "GPS alınamadı. Konum ayarlarını kontrol et.";
      cameraSpeedState.textContent = "GPS kapalı"; gpsSpeedNote.textContent = "GPS bağlantısı kurulamadı";
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      watchId = null; enableLocationButton.textContent = "GPS ve hız uyarısını etkinleştir";
    }, {enableHighAccuracy:true,maximumAge:1000,timeout:15000});
  }

  function updateClock() {
    clockLabel.textContent = new Intl.DateTimeFormat("tr-TR",{hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false}).format(new Date());
  }
  enableLocationButton.addEventListener("click", startLocationSpeedAlert);
  fullscreenButton.addEventListener("click", async () => {
    try {
      if (!document.fullscreenElement) {
        if (stage.requestFullscreen) await stage.requestFullscreen();
        else if (video.webkitEnterFullscreen) video.webkitEnterFullscreen();
        else { stage.classList.toggle("camera-expanded"); }
      } else await document.exitFullscreen();
    } catch (e) { stage.classList.toggle("camera-expanded"); }
    fullscreenButton.textContent = stage.classList.contains("camera-expanded") || document.fullscreenElement ? "⤢ Küçült" : "⛶ Tam ekran";
  });
  document.addEventListener("fullscreenchange", () => {
    fullscreenButton.textContent = document.fullscreenElement ? "⤢ Küçült" : "⛶ Tam ekran";
  });
  document.querySelectorAll(".report-button").forEach(button => button.addEventListener("click", () => {
    locationMessage.textContent = button.dataset.report + " bildirimi henüz paylaşılmıyor; bu yalnızca taslaktır.";
  }));
  startButton.addEventListener("click", startCamera);
  stopButton.addEventListener("click", stopCamera);
  document.addEventListener("visibilitychange", () => { if (document.hidden && cameraStream) stopCamera(); });
  window.addEventListener("pagehide", () => {
    stopCamera();
    if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    if ("speechSynthesis" in window) speechSynthesis.cancel();
  });
  updateClock(); setInterval(updateClock,1000);
})();