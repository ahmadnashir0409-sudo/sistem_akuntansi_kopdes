
const dbARAP = window.dagboekSupabase;

const arapStyle = document.createElement("style");
arapStyle.textContent = `
.arap-cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-bottom:20px}
.arap-card{background:white;border:1px solid #eee;border-radius:12px;padding:17px}
.arap-card small{display:block;color:#777;margin-bottom:8px}
.arap-card strong{font-size:19px;overflow-wrap:anywhere}
.arap-tabs{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px}
.arap-tabs button{border:1px solid #ddd;background:white;padding:10px 15px;border-radius:8px;cursor:pointer;font-weight:bold}
.arap-tabs button.active{background:#a71925;color:white;border-color:#a71925}
.arap-form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px}
.arap-form-grid label{display:block;font-size:13px;font-weight:bold;margin-bottom:7px}
.arap-form-grid input,.arap-form-grid select{width:100%;box-sizing:border-box;padding:11px;border:1px solid #ddd;border-radius:7px}
.arap-status{padding:5px 9px;border-radius:20px;background:#fff4dc;color:#8a6100;font-size:11px;font-weight:bold}
.arap-status.lunas{background:#e8f7ed;color:#18743b}
.arap-status.sebagian{background:#eaf2ff;color:#2459a6}
.arap-actions{display:flex;gap:8px;flex-wrap:wrap}
.arap-small-btn{border:0;background:#a71925;color:white;padding:7px 10px;border-radius:6px;cursor:pointer}
.arap-small-btn:disabled{opacity:.5}
.arap-message{font-size:13px;margin:12px 0}
@media(max-width:650px){.arap-cards{grid-template-columns:1fr}.arap-form-grid{grid-template-columns:1fr}}
`;
document.head.appendChild(arapStyle);

let arapPartners = [];
let arapDocuments = [];

function arapMoney(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

function arapEscape(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;"
  })[c]);
}

function arapDate() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString().slice(0, 10);
}

function setupARAP() {
  const page = document.getElementById("modulePage");
  if (!page || document.getElementById("arapContent")) return;

  const section = document.createElement("section");
  section.id = "arapContent";
  section.className = "erp-content";

  section.innerHTML = `
    <div class="arap-cards">
      <div class="arap-card"><small>Total Utang Belum Lunas</small><strong id="arapTotalDebt">Rp0</strong></div>
      <div class="arap-card"><small>Total Piutang Belum Lunas</small><strong id="arapTotalReceivable">Rp0</strong></div>
      <div class="arap-card"><small>Total Tagihan Aktif</small><strong id="arapTotalCount">0</strong></div>
    </div>

    <div class="arap-tabs">
      <button type="button" class="active" data-arap-tab="piutang">Piutang</button>
      <button type="button" data-arap-tab="utang">Utang</button>
      <button type="button" data-arap-tab="mitra">Pelanggan & Supplier</button>
    </div>

    <div id="arapDocumentPanel">
      <div class="erp-toolbar">
        <div>
          <h3 style="margin:0 0 5px" id="arapPanelTitle">Daftar Piutang</h3>
          <div class="erp-muted">Kelola tagihan dan pembayaran koperasi.</div>
        </div>
        <button class="erp-button" id="arapAddDocument">+ Buat Tagihan</button>
      </div>

      <div class="erp-form" id="arapDocumentForm">
        <h3 id="arapDocumentFormTitle">Buat Tagihan</h3>
        <form id="arapDocumentCreateForm">
          <div class="arap-form-grid">
            <div><label>Jenis Tagihan</label>
              <select id="arapType">
                <option value="piutang">Piutang</option>
                <option value="utang">Utang</option>
              </select>
            </div>
            <div><label>Pelanggan / Supplier</label>
              <select id="arapPartner" required><option value="">Pilih pihak terkait</option></select>
            </div>
            <div><label>Nomor Tagihan</label><input id="arapNumber" required maxlength="50"></div>
            <div><label>Tanggal Tagihan</label><input type="date" id="arapDate" required></div>
            <div><label>Jatuh Tempo</label><input type="date" id="arapDueDate"></div>
            <div><label>Nominal (Rp)</label><input type="number" id="arapAmount" min="1" step="0.01" required></div>
            <div style="grid-column:1/-1"><label>Keterangan</label><input id="arapDescription" maxlength="500" placeholder="Keterangan tagihan"></div>
          </div>
          <div id="arapDocumentMessage" class="arap-message"></div>
          <div class="erp-actions">
            <button type="submit" class="erp-button" id="arapDocumentSave">Simpan Tagihan</button>
            <button type="button" class="erp-button secondary" id="arapDocumentCancel">Batal</button>
          </div>
        </form>
      </div>

      <div class="erp-table-wrap">
        <table class="erp-table">
          <thead><tr>
            <th>Nomor</th><th>Pihak Terkait</th><th>Tanggal</th>
            <th>Jatuh Tempo</th><th>Total</th><th>Terbayar</th>
            <th>Sisa</th><th>Status</th><th>Aksi</th>
          </tr></thead>
          <tbody id="arapDocumentBody"><tr><td colspan="9">Memuat data...</td></tr></tbody>
        </table>
      </div>
    </div>

    <div id="arapPartnerPanel" style="display:none">
      <div class="erp-toolbar">
        <div><h3 style="margin:0 0 5px">Pelanggan & Supplier</h3>
        <div class="erp-muted">Daftar pihak yang memiliki transaksi dengan koperasi.</div></div>
        <button class="erp-button" id="arapAddPartner">+ Tambah Pihak</button>
      </div>

      <div class="erp-form" id="arapPartnerForm">
        <h3>Tambah Pelanggan / Supplier</h3>
        <form id="arapPartnerCreateForm">
          <div class="arap-form-grid">
            <div><label>Nama</label><input id="arapPartnerName" required maxlength="150"></div>
            <div><label>Jenis</label>
              <select id="arapPartnerType">
                <option value="pelanggan">Pelanggan</option>
                <option value="supplier">Supplier</option>
                <option value="keduanya">Keduanya</option>
              </select>
            </div>
            <div><label>Nomor Telepon</label><input id="arapPartnerPhone" maxlength="30"></div>
            <div><label>Alamat</label><input id="arapPartnerAddress" maxlength="300"></div>
          </div>
          <div id="arapPartnerMessage" class="arap-message"></div>
          <div class="erp-actions">
            <button type="submit" class="erp-button" id="arapPartnerSave">Simpan Pihak</button>
            <button type="button" class="erp-button secondary" id="arapPartnerCancel">Batal</button>
          </div>
        </form>
      </div>

      <div class="erp-table-wrap">
        <table class="erp-table">
          <thead><tr><th>Nama</th><th>Jenis</th><th>Telepon</th><th>Alamat</th></tr></thead>
          <tbody id="arapPartnerBody"><tr><td colspan="4">Memuat data...</td></tr></tbody>
        </table>
      </div>
    </div>

    <div class="erp-form" id="arapPaymentForm">
      <h3>Catat Pembayaran</h3>
      <div class="erp-muted" id="arapPaymentInfo"></div>
      <form id="arapPaymentCreateForm">
        <div class="arap-form-grid" style="margin-top:15px">
          <div><label>Tanggal Pembayaran</label><input type="date" id="arapPaymentDate" required></div>
          <div><label>Nominal Pembayaran (Rp)</label><input type="number" id="arapPaymentAmount" min="1" step="0.01" required></div>
          <div><label>Metode Pembayaran</label>
            <select id="arapPaymentMethod">
              <option value="transfer">Transfer</option>
              <option value="tunai">Tunai</option>
              <option value="lainnya">Lainnya</option>
            </select>
          </div>
          <div><label>Keterangan</label><input id="arapPaymentDescription" maxlength="300"></div>
        </div>
        <div id="arapPaymentMessage" class="arap-message"></div>
        <div class="erp-actions">
          <button type="submit" class="erp-button" id="arapPaymentSave">Simpan Pembayaran</button>
          <button type="button" class="erp-button secondary" id="arapPaymentCancel">Batal</button>
        </div>
      </form>
    </div>

    <h3 style="margin-top:25px">Riwayat Pembayaran</h3>
    <div class="erp-table-wrap">
      <table class="erp-table">
        <thead><tr><th>Tanggal</th><th>Nomor Tagihan</th><th>Jenis</th><th>Nominal</th><th>Metode</th><th>Keterangan</th></tr></thead>
        <tbody id="arapPaymentHistory"><tr><td colspan="6">Pilih tagihan untuk melihat riwayat pembayaran.</td></tr></tbody>
      </table>
    </div>
  `;

  page.appendChild(section);

  section.querySelectorAll("[data-arap-tab]").forEach(button => {
    button.addEventListener("click", () => switchARAPTab(button.dataset.arapTab));
  });

  document.getElementById("arapAddDocument").addEventListener("click", openARAPDocumentForm);
  document.getElementById("arapDocumentCancel").addEventListener("click", () => {
    document.getElementById("arapDocumentForm").style.display = "none";
  });
  document.getElementById("arapDocumentCreateForm").addEventListener("submit", saveARAPDocument);
  document.getElementById("arapType").addEventListener("change", loadARAPPartnerOptions);

  document.getElementById("arapAddPartner").addEventListener("click", () => {
    document.getElementById("arapPartnerForm").style.display = "block";
  });
  document.getElementById("arapPartnerCancel").addEventListener("click", () => {
    document.getElementById("arapPartnerForm").style.display = "none";
  });
  document.getElementById("arapPartnerCreateForm").addEventListener("submit", saveARAPPartner);

  document.getElementById("arapPaymentCancel").addEventListener("click", () => {
    document.getElementById("arapPaymentForm").style.display = "none";
  });
  document.getElementById("arapPaymentCreateForm").addEventListener("submit", saveARAPPayment);

  if (!["manajer", "admin_keuangan"].includes(window.currentUser?.role)) {
    document.getElementById("arapAddDocument").style.display = "none";
    document.getElementById("arapAddPartner").style.display = "none";
  }

  loadARAPData();
}

function switchARAPTab(tab) {
  document.querySelectorAll("[data-arap-tab]").forEach(button => {
    button.classList.toggle("active", button.dataset.arapTab === tab);
  });

  document.getElementById("arapDocumentPanel").style.display = tab === "mitra" ? "none" : "block";
  document.getElementById("arapPartnerPanel").style.display = tab === "mitra" ? "block" : "none";
  document.getElementById("arapPaymentForm").style.display = "none";

  if (tab !== "mitra") {
    document.getElementById("arapType").value = tab;
    document.getElementById("arapPanelTitle").textContent = tab === "utang" ? "Daftar Utang" : "Daftar Piutang";
    loadARAPDocuments(tab);
  } else {
    loadARAPPartners();
  }
}

async function loadARAPData() {
  await Promise.all([loadARAPPartners(), loadARAPDocuments("piutang"), loadARAPDocuments("utang")]);
  switchARAPTab("piutang");
}

async function loadARAPPartners() {
  const body = document.getElementById("arapPartnerBody");
  if (!body) return;

  const { data, error } = await dbARAP.from("business_partners")
    .select("id,nama,jenis,telepon,alamat").order("nama");

  if (error) {
    body.innerHTML = `<tr><td colspan="4">${arapEscape(error.message)}</td></tr>`;
    return;
  }

  arapPartners = data || [];
  body.innerHTML = arapPartners.length ? arapPartners.map(p => `
    <tr><td>${arapEscape(p.nama)}</td><td>${arapEscape(p.jenis)}</td>
    <td>${arapEscape(p.telepon || "-")}</td><td>${arapEscape(p.alamat || "-")}</td></tr>
  `).join("") : '<tr><td colspan="4">Belum ada pelanggan atau supplier.</td></tr>';

  loadARAPPartnerOptions();
}

async function loadARAPPartnerOptions() {
  const select = document.getElementById("arapPartner");
  if (!select) return;

  const type = document.getElementById("arapType").value;
  const accepted = type === "piutang" ? ["pelanggan", "keduanya"] : ["supplier", "keduanya"];
  const partners = arapPartners.filter(p => accepted.includes(p.jenis));

  select.innerHTML = '<option value="">Pilih pihak terkait</option>' +
    partners.map(p => `<option value="${arapEscape(p.id)}">${arapEscape(p.nama)}</option>`).join("");
}

async function saveARAPPartner(event) {
  event.preventDefault();
  if (!["manajer", "admin_keuangan"].includes(window.currentUser?.role)) return;

  const button = document.getElementById("arapPartnerSave");
  const message = document.getElementById("arapPartnerMessage");
  button.disabled = true;
  button.textContent = "Menyimpan...";

  const { error } = await dbARAP.from("business_partners").insert({
    nama: document.getElementById("arapPartnerName").value.trim(),
    jenis: document.getElementById("arapPartnerType").value,
    telepon: document.getElementById("arapPartnerPhone").value.trim() || null,
    alamat: document.getElementById("arapPartnerAddress").value.trim() || null
  });

  button.disabled = false;
  button.textContent = "Simpan Pihak";

  if (error) {
    message.className = "arap-message erp-error";
    message.textContent = "Gagal menyimpan: " + error.message;
    return;
  }

  document.getElementById("arapPartnerCreateForm").reset();
  document.getElementById("arapPartnerForm").style.display = "none";
  message.textContent = "";
  await loadARAPPartners();
  alert("Pelanggan / supplier berhasil ditambahkan.");
}

function openARAPDocumentForm() {
  if (!["manajer", "admin_keuangan"].includes(window.currentUser?.role)) return;

  const type = document.getElementById("arapType").value;
  document.getElementById("arapDocumentCreateForm").reset();
  document.getElementById("arapType").value = type;
  document.getElementById("arapDate").value = arapDate();
  document.getElementById("arapDueDate").value = "";
  document.getElementById("arapNumber").value = (type === "utang" ? "UT-" : "PT-") +
    arapDate().replaceAll("-", "") + "-" + Date.now().toString().slice(-5);
  document.getElementById("arapDocumentMessage").textContent = "";
  loadARAPPartnerOptions();
  document.getElementById("arapDocumentForm").style.display = "block";
}

async function saveARAPDocument(event) {
  event.preventDefault();
  if (!["manajer", "admin_keuangan"].includes(window.currentUser?.role)) return;

  const button = document.getElementById("arapDocumentSave");
  const message = document.getElementById("arapDocumentMessage");
  const type = document.getElementById("arapType").value;
  const amount = Number(document.getElementById("arapAmount").value);
  const partner = document.getElementById("arapPartner").value;
  const date = document.getElementById("arapDate").value;
  const dueDate = document.getElementById("arapDueDate").value;

  if (!partner || !date || !Number.isFinite(amount) || amount <= 0) {
    message.className = "arap-message erp-error";
    message.textContent = "Lengkapi pihak terkait, tanggal, dan nominal dengan benar.";
    return;
  }

  if (dueDate && dueDate < date) {
    message.className = "arap-message erp-error";
    message.textContent = "Jatuh tempo tidak boleh sebelum tanggal tagihan.";
    return;
  }

  button.disabled = true;
  button.textContent = "Menyimpan...";

  const { error } = await dbARAP.from("ar_ap_documents").insert({
    jenis: type,
    nomor: document.getElementById("arapNumber").value.trim(),
    partner_id: partner,
    tanggal: date,
    jatuh_tempo: dueDate || null,
    keterangan: document.getElementById("arapDescription").value.trim() || null,
    total: amount,
    terbayar: 0,
    status: "belum_lunas",
    created_by: window.currentUser?.id || null
  });

  button.disabled = false;
  button.textContent = "Simpan Tagihan";

  if (error) {
    message.className = "arap-message erp-error";
    message.textContent = "Gagal menyimpan tagihan: " + error.message;
    return;
  }

  document.getElementById("arapDocumentForm").style.display = "none";
  await loadARAPDocuments(type);
  alert("Tagihan berhasil disimpan.");
}

async function loadARAPDocuments(type) {
  const body = document.getElementById("arapDocumentBody");
  if (!body) return;

  body.innerHTML = '<tr><td colspan="9">Memuat data...</td></tr>';

  const { data, error } = await dbARAP.from("ar_ap_documents")
    .select("id,jenis,nomor,partner_id,tanggal,jatuh_tempo,keterangan,total,terbayar,status,business_partners(nama)")
    .eq("jenis", type)
    .order("tanggal", { ascending: false });

  if (error) {
    body.innerHTML = `<tr><td colspan="9">${arapEscape(error.message)}</td></tr>`;
    return;
  }

  arapDocuments = data || [];
  body.innerHTML = arapDocuments.length ? arapDocuments.map(doc => {
    const remaining = Number(doc.total) - Number(doc.terbayar);
    const statusClass = doc.status === "lunas" ? "lunas" :
      doc.status === "dibayar_sebagian" ? "sebagian" : "";
    const statusText = doc.status === "lunas" ? "Lunas" :
      doc.status === "dibayar_sebagian" ? "Sebagian" : "Belum Lunas";

    return `<tr>
      <td>${arapEscape(doc.nomor)}</td>
      <td>${arapEscape(doc.business_partners?.nama || "-")}</td>
      <td>${arapEscape(doc.tanggal)}</td>
      <td>${arapEscape(doc.jatuh_tempo || "-")}</td>
      <td>${arapMoney(doc.total)}</td>
      <td>${arapMoney(doc.terbayar)}</td>
      <td>${arapMoney(remaining)}</td>
      <td><span class="arap-status ${statusClass}">${statusText}</span></td>
      <td><div class="arap-actions">
        ${remaining > 0 ? `<button class="arap-small-btn" data-arap-pay="${arapEscape(doc.id)}">Bayar</button>` : ""}
        <button class="arap-small-btn" style="background:#555" data-arap-history="${arapEscape(doc.id)}">Riwayat</button>
      </div></td>
    </tr>`;
  }).join("") : '<tr><td colspan="9">Belum ada tagihan.</td></tr>';

  body.querySelectorAll("[data-arap-pay]").forEach(button => {
    button.addEventListener("click", () => openARAPPayment(button.dataset.arapPay));
  });
  body.querySelectorAll("[data-arap-history]").forEach(button => {
    button.addEventListener("click", () => loadARAPPaymentHistory(button.dataset.arapHistory));
  });

  updateARAPSummary();
}

function updateARAPSummary() {
  const debt = arapDocuments.filter(d => d.jenis === "utang" && d.status !== "lunas")
    .reduce((sum, d) => sum + Number(d.total) - Number(d.terbayar), 0);
  const receivable = arapDocuments.filter(d => d.jenis === "piutang" && d.status !== "lunas")
    .reduce((sum, d) => sum + Number(d.total) - Number(d.terbayar), 0);

  document.getElementById("arapTotalDebt").textContent = arapMoney(debt);
  document.getElementById("arapTotalReceivable").textContent = arapMoney(receivable);
  document.getElementById("arapTotalCount").textContent = arapDocuments.filter(d => d.status !== "lunas").length;
}

let arapSelectedDocument = null;

function openARAPPayment(id) {
  if (!["manajer", "admin_keuangan"].includes(window.currentUser?.role)) return;

  const doc = arapDocuments.find(d => d.id === id);
  if (!doc) return;

  arapSelectedDocument = doc;
  const remaining = Number(doc.total) - Number(doc.terbayar);

  document.getElementById("arapPaymentCreateForm").reset();
  document.getElementById("arapPaymentDate").value = arapDate();
  document.getElementById("arapPaymentAmount").max = remaining;
  document.getElementById("arapPaymentInfo").textContent =
    `${doc.nomor} | Total ${arapMoney(doc.total)} | Sudah dibayar ${arapMoney(doc.terbayar)} | Sisa ${arapMoney(remaining)}`;
  document.getElementById("arapPaymentMessage").textContent = "";
  document.getElementById("arapPaymentForm").style.display = "block";
  document.getElementById("arapPaymentForm").scrollIntoView({ behavior: "smooth", block: "start" });
}

async function saveARAPPayment(event) {
  event.preventDefault();
  if (!arapSelectedDocument || !["manajer", "admin_keuangan"].includes(window.currentUser?.role)) return;

  const button = document.getElementById("arapPaymentSave");
  const message = document.getElementById("arapPaymentMessage");
  const amount = Number(document.getElementById("arapPaymentAmount").value);
  const date = document.getElementById("arapPaymentDate").value;
  const remaining = Number(arapSelectedDocument.total) - Number(arapSelectedDocument.terbayar);

  if (!date || !Number.isFinite(amount) || amount <= 0 || amount > remaining) {
    message.className = "arap-message erp-error";
    message.textContent = "Nominal pembayaran harus lebih dari nol dan tidak boleh melebihi sisa tagihan.";
    return;
  }

  button.disabled = true;
  button.textContent = "Menyimpan...";

  const { data: payment, error: paymentError } = await dbARAP.from("ar_ap_payments").insert({
    document_id: arapSelectedDocument.id,
    tanggal: date,
    nominal: amount,
    metode: document.getElementById("arapPaymentMethod").value,
    keterangan: document.getElementById("arapPaymentDescription").value.trim() || null,
    created_by: window.currentUser?.id || null
  }).select("id").single();

  if (paymentError) {
    button.disabled = false;
    button.textContent = "Simpan Pembayaran";
    message.className = "arap-message erp-error";
    message.textContent = "Gagal menyimpan pembayaran: " + paymentError.message;
    return;
  }

  const newPaid = Number(arapSelectedDocument.terbayar) + amount;
  const newStatus = newPaid >= Number(arapSelectedDocument.total) ? "lunas" : "dibayar_sebagian";

  const { error: updateError } = await dbARAP.from("ar_ap_documents")
    .update({ terbayar: newPaid, status: newStatus })
    .eq("id", arapSelectedDocument.id)
    .eq("terbayar", arapSelectedDocument.terbayar);

  button.disabled = false;
  button.textContent = "Simpan Pembayaran";

  if (updateError) {
    message.className = "arap-message erp-error";
    message.textContent = "Pembayaran tersimpan, tetapi status tagihan gagal diperbarui. Jangan ulangi pembayaran. Hubungi administrator.";
    console.error("AR/AP update error:", updateError);
    return;
  }

  const type = arapSelectedDocument.jenis;
  document.getElementById("arapPaymentForm").style.display = "none";
  arapSelectedDocument = null;
  await loadARAPDocuments(type);
  alert("Pembayaran berhasil dicatat.");
}

async function loadARAPPaymentHistory(documentId) {
  const body = document.getElementById("arapPaymentHistory");
  body.innerHTML = '<tr><td colspan="6">Memuat riwayat...</td></tr>';

  const doc = arapDocuments.find(d => d.id === documentId);
  const { data, error } = await dbARAP.from("ar_ap_payments")
    .select("tanggal,nominal,metode,keterangan")
    .eq("document_id", documentId)
    .order("tanggal", { ascending: false });

  if (error) {
    body.innerHTML = `<tr><td colspan="6">${arapEscape(error.message)}</td></tr>`;
    return;
  }

  body.innerHTML = data?.length ? data.map(payment => `
    <tr>
      <td>${arapEscape(payment.tanggal)}</td>
      <td>${arapEscape(doc?.nomor || "-")}</td>
      <td>${doc?.jenis === "utang" ? "Utang" : "Piutang"}</td>
      <td>${arapMoney(payment.nominal)}</td>
      <td>${arapEscape(payment.metode || "-")}</td>
      <td>${arapEscape(payment.keterangan || "-")}</td>
    </tr>
  `).join("") : '<tr><td colspan="6">Belum ada pembayaran untuk tagihan ini.</td></tr>';

  body.scrollIntoView({ behavior: "smooth", block: "center" });
}

// Sambungkan ke navigasi app.js yang sudah ada.
const originalShowPageARAP = window.showPage;

if (typeof originalShowPageARAP === "function") {
  window.showPage = function(page, button) {
    const section = document.getElementById("arapContent");
    if (section) section.style.display = "none";

    originalShowPageARAP(page, button);

    if (page === "utang-piutang") {
      setupARAP();
      const arapSection = document.getElementById("arapContent");
      if (arapSection) arapSection.style.display = "block";
      switchARAPTab("piutang");
    }
  };
}
