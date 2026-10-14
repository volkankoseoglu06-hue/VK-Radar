const $ = (id) => document.getElementById(id);
const storageKey = "vkAnalizCleanData";
const titles = {
  standards: { eyebrow: "PARÇA ARAŞTIRMA", title: "Standart Parça Kataloğu", description: "Standart numarasını veya parça adını ara. Arama, seçtiğin üretici sitesinde açılır." },
  materials: { eyebrow: "MALZEME YÖNETİMİ", title: "Malzeme Fiyatları", description: "Ham malzeme fiyatlarını USD/kg birimiyle kaydet. Kayıtlar bu tarayıcıda saklanır." },
  weight: { eyebrow: "TEKNİK HESAPLAMA", title: "Ağırlık Hesaplama", description: "Dikdörtgen prizma, silindir veya plaka için teorik ağırlık hesabı yap." },
  bom: { eyebrow: "PARÇA LİSTESİ", title: "BOM Analizi", description: "Excel dosyanı seçerek içeriğini önizle. Bu ilk sürümde dosya sunucuya yüklenmez." }
};
let currentView = "home";
let records = loadRecords();

function loadRecords() {
  try { return JSON.parse(localStorage.getItem(storageKey) || '{"materials":[],"recent":[]}'); }
  catch { return { materials: [], recent: [] }; }
}
function saveRecords() { localStorage.setItem(storageKey, JSON.stringify(records)); }
function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
}
function addRecent(label, view) {
  records.recent = [{ label, view, date: new Date().toLocaleDateString("tr-TR") }, ...records.recent.filter(x => x.label !== label)].slice(0, 5);
  saveRecords(); renderRecent();
}
function renderRecent() {
  $("recentCount").textContent = records.recent.length + " kayıt";
  const root = $("recentList");
  if (!records.recent.length) {
    root.className = "recent-empty";
    root.innerHTML = '<span class="empty-icon">↗</span><span><strong>Henüz kayıt yok</strong><small>Çalışmaların burada listelenecek.</small></span>';
    return;
  }
  root.className = "recent-list";
  root.innerHTML = records.recent.map(r => '<button class="recent-row" data-recent-view="'+escapeHtml(r.view)+'"><span class="empty-icon">↗</span><span><strong>'+escapeHtml(r.label)+'</strong><small>'+escapeHtml(r.date)+'</small></span><b>→</b></button>').join("");
  root.querySelectorAll("[data-recent-view]").forEach(b => b.addEventListener("click", () => openView(b.dataset.recentView)));
}
function openView(view) {
  currentView = view;
  $("home").classList.add("hidden");
  $("workspace").classList.remove("hidden");
  const meta = titles[view];
  $("viewEyebrow").textContent = meta.eyebrow;
  $("viewTitle").textContent = meta.title;
  $("viewDescription").textContent = meta.description;
  const root = $("viewContent");
  if (view === "standards") renderStandards(root);
  if (view === "materials") renderMaterials(root);
  if (view === "weight") renderWeight(root);
  if (view === "bom") renderBom(root);
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function goHome() {
  currentView = "home";
  $("workspace").classList.add("hidden");
  $("home").classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}
document.querySelectorAll("[data-view]").forEach(button => button.addEventListener("click", () => openView(button.dataset.view)));
$("backHome").addEventListener("click", goHome);

function renderStandards(root) {
  root.innerHTML = '<div class="notice">Bu araç ürün fiyatlarını otomatik olarak içeri aktardığını iddia etmez. Arama, ilgili tedarikçi sitesinde yeni sekmede açılır; bulduğun ürün bilgisini ayrıca kaydedebilirsin.</div><form id="standardForm" class="simple-form"><div class="field"><label for="standardQuery">Standart numarası veya parça adı</label><input id="standardQuery" placeholder="Örn. NAS, ISO 4762, MS21042" required></div><div class="field"><label for="standardSupplier">Arama kaynağı</label><select id="standardSupplier"><option value="carrlane.com">Carr Lane</option><option value="mcmaster.com">McMaster-Carr</option><option value="misumi-ec.com">MISUMI</option><option value="google">Genel web araması</option></select></div><div class="form-actions"><button class="primary-button" type="submit">Kaynakta ara ↗</button><button class="secondary-button" id="saveStandard" type="button">Araştırma kaydı ekle</button></div></form><div id="standardFeedback"></div>';
  $("standardForm").addEventListener("submit", e => {
    e.preventDefault();
    const q = $("standardQuery").value.trim(), source = $("standardSupplier").value;
    const url = source === "google" ? "https://www.google.com/search?q=" + encodeURIComponent(q + " aviation standard part") : "https://www.google.com/search?q=" + encodeURIComponent("site:" + source + " " + q);
    window.open(url, "_blank", "noopener,noreferrer");
    addRecent("Parça araması: " + q, "standards");
  });
  $("saveStandard").addEventListener("click", () => {
    const q = $("standardQuery").value.trim();
    if (!q) { $("standardQuery").focus(); return; }
    addRecent("Parça araştırması: " + q, "standards");
    $("standardFeedback").innerHTML = '<p class="notice">Araştırma son çalışmalar listesine eklendi.</p>';
  });
}
function renderMaterials(root) {
  root.innerHTML = '<form id="materialForm" class="simple-form"><div class="field"><label for="materialName">Malzeme tanımı</label><input id="materialName" placeholder="Örn. Alüminyum 7075-T6" required></div><div class="field"><label for="materialPrice">Fiyat (USD/kg)</label><input id="materialPrice" type="number" min="0" step="0.0001" placeholder="0.00" required></div><div class="field"><label for="materialSupplier">Tedarikçi</label><input id="materialSupplier" placeholder="Firma adı"></div><div class="field"><label for="materialSource">Kaynak bağlantısı</label><input id="materialSource" type="url" placeholder="https://..."></div><div class="form-actions"><button class="primary-button" type="submit">Fiyatı kaydet</button></div></form><div class="table-wrap" id="materialsTable"></div>';
  renderMaterialsTable();
  $("materialForm").addEventListener("submit", e => {
    e.preventDefault();
    records.materials.unshift({ id: Date.now(), name: $("materialName").value.trim(), price: Number($("materialPrice").value), supplier: $("materialSupplier").value.trim(), source: $("materialSource").value.trim(), date: new Date().toLocaleDateString("tr-TR") });
    saveRecords(); renderMaterialsTable(); addRecent("Malzeme fiyatı: " + records.materials[0].name, "materials"); e.target.reset();
  });
}
function renderMaterialsTable() {
  const root = $("materialsTable");
  if (!root) return;
  if (!records.materials.length) { root.innerHTML = '<div class="empty-table">Henüz malzeme fiyatı kaydedilmedi.</div>'; return; }
  root.innerHTML = '<table><thead><tr><th>Malzeme</th><th>Fiyat</th><th>Tedarikçi</th><th>Tarih</th><th></th></tr></thead><tbody>'+records.materials.map(m => '<tr><td>'+escapeHtml(m.name)+'</td><td>$'+Number(m.price).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:4})+' / kg</td><td>'+escapeHtml(m.supplier || "—")+'</td><td>'+escapeHtml(m.date)+'</td><td><button class="secondary-button" data-delete-material="'+m.id+'">Sil</button> '+(m.source?'<a href="'+escapeHtml(m.source)+'" target="_blank" rel="noopener noreferrer">Kaynak ↗</a>':"")+'</td></tr>').join("")+'</tbody></table>';
  root.querySelectorAll("[data-delete-material]").forEach(b => b.addEventListener("click", () => { records.materials = records.materials.filter(m => m.id !== Number(b.dataset.deleteMaterial)); saveRecords(); renderMaterialsTable(); }));
}
function renderWeight(root) {
  root.innerHTML = '<div class="notice">Hesaplanan değer teoriktir. Malzeme yoğunluğu kg/m³ olarak girilir. Delikler, pahlar ve gerçek geometri ayrıca hesaba katılmaz.</div><form id="weightForm" class="simple-form"><div class="field"><label for="shape">Geometri</label><select id="shape"><option value="box">Dikdörtgen prizma / blok</option><option value="cylinder">Silindir</option><option value="plate">Plaka</option></select></div><div class="field"><label for="density">Yoğunluk (kg/m³)</label><input id="density" type="number" min="1" value="2810" required></div><div class="field"><label for="length">Uzunluk (mm)</label><input id="length" type="number" min="0.01" value="100" required></div><div class="field" id="widthField"><label for="width">Genişlik (mm)</label><input id="width" type="number" min="0.01" value="50" required></div><div class="field" id="heightField"><label for="height">Yükseklik / kalınlık (mm)</label><input id="height" type="number" min="0.01" value="10" required></div><div class="field hidden" id="diameterField"><label for="diameter">Çap (mm)</label><input id="diameter" type="number" min="0.01" value="50"></div><div class="form-actions"><button class="primary-button" type="submit">Ağırlığı hesapla</button></div></form><div id="weightResult"></div>';
  $("shape").addEventListener("change", () => { const cylinder = $("shape").value === "cylinder"; $("widthField").classList.toggle("hidden", cylinder); $("diameterField").classList.toggle("hidden", !cylinder); });
  $("weightForm").addEventListener("submit", e => {
    e.preventDefault();
    const l = Number($("length").value)/1000, d = Number($("density").value);
    const volume = $("shape").value === "cylinder" ? Math.PI*Math.pow(Number($("diameter").value)/2000,2)*l : l*(Number($("width").value)/1000)*(Number($("height").value)/1000);
    const kg = volume*d;
    $("weightResult").innerHTML = '<div class="result-card"><small>TEORİK AĞIRLIK</small><strong>'+kg.toLocaleString("tr-TR",{maximumFractionDigits:4})+' kg</strong><small>Hacim: '+(volume*1e9).toLocaleString("tr-TR",{maximumFractionDigits:2})+' mm³</small></div>';
    addRecent("Ağırlık hesabı: "+kg.toLocaleString("tr-TR",{maximumFractionDigits:3})+" kg", "weight");
  });
}
function renderBom(root) {
  root.innerHTML = '<div class="notice">Dosya yalnızca tarayıcında okunur; sunucuya gönderilmez. CSV dosyaları doğrudan önizlenebilir. XLSX dosyaları için bu sürümde Excel ayrıştırma kütüphanesi eklenmediğinden CSV olarak dışa aktarman gerekebilir.</div><div class="field"><label for="bomFile">BOM dosyası seç (CSV veya TXT)</label><input id="bomFile" type="file" accept=".csv,.txt"></div><div id="bomPreview" class="table-wrap"></div>';
  $("bomFile").addEventListener("change", async e => {
    const file = e.target.files[0]; if (!file) return;
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(x => x.trim()).slice(0,101);
    if (!lines.length) return;
    const delimiter = lines[0].includes(";") ? ";" : lines[0].includes("\t") ? "\t" : ",";
    const rows = lines.map(line => line.split(delimiter));
    $("bomPreview").innerHTML = '<p class="notice">'+escapeHtml(file.name)+' · '+Math.max(0,rows.length-1)+' satır önizleme (en fazla 100 satır)</p><table><tbody>'+rows.map((row,i) => '<tr>'+row.slice(0,12).map(cell => i===0?'<th>'+escapeHtml(cell)+'</th>':'<td>'+escapeHtml(cell)+'</td>').join("")+'</tr>').join("")+'</tbody></table>';
    addRecent("BOM önizleme: "+file.name, "bom");
  });
}
renderRecent();
