(() => {
  const video = document.getElementById("cameraVideo");
  const stage = document.getElementById("videoStage");
  const placeholder = document.getElementById("cameraPlaceholder");
  const startButton = document.getElementById("startCamera");
  const stopButton = document.getElementById("stopCamera");
  const stateLabel = document.getElementById("cameraState");
  const message = document.getElementById("cameraMessage");
  const clockLabel = document.getElementById("clockLabel");
  let cameraStream = null;

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

  function updateClock() {
    clockLabel.textContent = new Intl.DateTimeFormat("tr-TR", {
      hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false
    }).format(new Date());
  }

  startButton.addEventListener("click", startCamera);
  stopButton.addEventListener("click", stopCamera);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && cameraStream) stopCamera();
  });
  window.addEventListener("pagehide", stopCamera);
  updateClock();
  setInterval(updateClock, 1000);
})();