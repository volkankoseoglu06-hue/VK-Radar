(() => {
  const video = document.getElementById("cameraVideo");
  const stage = document.getElementById("videoStage");
  const placeholder = document.getElementById("cameraPlaceholder");
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
  let cameraStream = null;
  let watchId = null;
  let lastAlertAt = 0;
  let lastSpeed = null;

  function setMessage(text) { message.textContent = text; }

  async function startCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMessage("Bu tarayıcı kamera erişimini desteklemiyor veya sayfa HTTPS üzerinden açılmamış. GitHub Pages bağlantısını kullan.");
      return;
    }
    startButton.disabled = true;
    setMessage("Kamera izni bekleniyor…");
    try {
      cameraStream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      video.srcObject = cameraStream;
      await video.play();
      stage.classList.add("active");
      stateLabel.textContent = "AÇIK";
      startButton.disabled = true;
      stopButton.disabled = false;
      document.querySelector(".live-dot").style.background = "var(--cyan)";
      setMessage("Kamera açık. Bu sürüm yalnızca görüntü önizlemesi sağlar; henüz araç algılama veya gerçek hız ölçümü yapmaz.");
    } catch (error) {
      const detail = error && error.name === "NotAllowedError"
        ? "Kamera izni verilmedi. Tarayıcı ayarlarından kamera iznini açıp tekrar dene."
        : error && error.name === "NotFoundError"
          ? "Kullanılabilir kamera bulunamadı."
          : "Kamera açılamadı. HTTPS kullandığını ve başka bir uygulamanın kamerayı meşgul etmediğini kontrol et.";
      setMessage(detail);
    } finally {
      startButton.disabled = !!cameraStream;
    }
  }

  function stopCamera() {
    if (cameraStream) cameraStream.getTracks().forEach(track => track.stop());
    cameraStream = null;
    video.pause();
    video.srcObject = null;
    stage.classList.remove("active");
    stateLabel.textContent = "KAPALI";
    startButton.disabled = false;
    stopButton.disabled = true;
    document.querySelector(".live-dot").style.background = "";
    setMessage("Kamera kapatıldı. Açmak için kamera düğmesine yeniden bas.");
  }

  function announce(text) {
    if (!voiceAlertToggle.checked || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "tr-TR";
    utterance.rate = 1;
    window.speechSynthesis.speak(utterance);
  }

  function startLocationSpeedAlert() {
    if (!("geolocation" in navigator)) {
      locationMessage.textContent = "Bu tarayıcı GPS konum erişimini desteklemiyor.";
      return;
    }
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
      enableLocationButton.textContent = "GPS ve hız uyarısını etkinleştir";
      locationMessage.textContent = "GPS hız takibi durduruldu.";
      return;
    }
    enableLocationButton.disabled = true;
    locationMessage.textContent = "Konum izni bekleniyor…";
    watchId = navigator.geolocation.watchPosition(position => {
      const speedMs = position.coords.speed;
      if (speedMs === null || !Number.isFinite(speedMs)) {
        locationMessage.textContent = "Konum alındı ancak cihaz geçerli bir GPS hız değeri sağlamıyor.";
        return;
      }
      lastSpeed = Math.round(speedMs * 3.6);
      const limit = Number(alertLimit.value) || 50;
      locationMessage.textContent = "GPS hızı: " + lastSpeed + " km/sa. Bu değer telefon GPS'inden gelir; araç kamerası ölçümü değildir.";
      if (speedAlertToggle.checked && lastSpeed > limit && Date.now() - lastAlertAt > 20000) {
        lastAlertAt = Date.now();
        announce("Dikkat. Hızınız " + lastSpeed + " kilometre. Seçtiğiniz sınır " + limit + " kilometre.");
      }
      enableLocationButton.textContent = "GPS takibini durdur";
      enableLocationButton.disabled = false;
    }, error => {
      const errors = {
        1: "Konum izni verilmedi. Tarayıcı ayarlarından konum iznini aç.",
        2: "Konum belirlenemedi. GPS sinyalini kontrol et.",
        3: "Konum isteği zaman aşımına uğradı. Tekrar dene."
      };
      locationMessage.textContent = errors[error.code] || "Konum alınamadı.";
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      watchId = null;
      enableLocationButton.textContent = "GPS ve hız uyarısını etkinleştir";
      enableLocationButton.disabled = false;
    }, { enableHighAccuracy: true, maximumAge: 1000, timeout: 15000 });
    enableLocationButton.disabled = false;
  }

  function updateClock() {
    clockLabel.textContent = new Intl.DateTimeFormat("tr-TR", {
      hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false
    }).format(new Date());
  }

  enableLocationButton.addEventListener("click", startLocationSpeedAlert);
  document.querySelectorAll(".report-button").forEach(button => {
    button.addEventListener("click", () => {
      locationMessage.textContent = button.dataset.report + ": Bu bildirim seçeneği arayüz prototipidir; sunucuya veya diğer sürücülere gönderilmez.";
    });
  });
  startButton.addEventListener("click", startCamera);
  stopButton.addEventListener("click", stopCamera);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && cameraStream) stopCamera();
  });
  window.addEventListener("pagehide", () => {
    stopCamera();
    if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    watchId = null;
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  });
  updateClock();
  setInterval(updateClock, 1000);
})();