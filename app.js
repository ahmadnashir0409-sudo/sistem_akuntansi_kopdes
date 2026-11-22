
const SUPABASE_URL = "https://YOUR-NEW-DAIBOEK-PROJECT.supabase.co";
const SUPABASE_KEY = "YOUR_NEW_DAIBOEK_PUBLISHABLE_KEY";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
window.daiboekSupabase = supabaseClient;
const modules = {
  keuangan: ["💰", "Pencatatan Keuangan", "Pencatatan pemasukan, pengeluaran, dan transaksi kas."],
  coa: ["📚", "Chart of Accounts", "Pengelolaan daftar akun dan kode perkiraan."],
  jurnal: ["📖", "Jurnal Umum", "Pencatatan jurnal debit dan kredit."],
  "buku-besar": ["📒", "Buku Besar", "Riwayat mutasi dan saldo setiap akun."],
  laporan: ["📊", "Laporan Keuangan", "Neraca, laba rugi, dan laporan arus kas."],
  "utang-piutang": ["💳", "Utang & Piutang", "Pengelolaan kewajiban dan tagihan koperasi."],
  bank: ["🏦", "Rekonsiliasi Bank", "Pencocokan catatan kas dengan rekening bank."],
  invoice: ["🧾", "Invoice", "Pembuatan dan pengelolaan faktur."],
  toko: ["🛒", "Transaksi Toko", "Pencatatan penjualan dan transaksi toko."],
  simpanan: ["👥", "Simpanan & Pinjaman", "Pengelolaan simpanan anggota dan pinjaman."],
  persediaan: ["📦", "Persediaan Barang", "Pengelolaan stok masuk dan stok keluar."],
  bulanan: ["📅", "Laporan Bulanan", "Rekapitulasi keuangan setiap bulan."],
  monitoring: ["🛡️", "Monitoring Manajer", "Pemantauan aktivitas dan kondisi keuangan."],
  "rumus-kamus": ["📚", "Rumus Excel & Kamus Akuntansi", "Pusat referensi rumus spreadsheet dan istilah akuntansi."],
  pengaturan: ["⚙️", "Pengaturan", "Pengaturan sistem dan pengguna."]
};

let coaCache = [];
let financialAccountsCache = [];
let journalRowCount = 0;
let financialType = "pemasukan";

// CSS TAMBAHAN
const style = document.createElement("style");
style.textContent = `
#loginScreen{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;background:#f5f6fa;font-family:Arial,sans-serif}
.login-card{width:100%;max-width:410px;background:white;padding:35px;border-radius:16px;box-shadow:0 10px 40px rgba(0,0,0,.08)}
.login-logo{width:58px;height:58px;background:#00a968;color:white;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:bold;margin-bottom:20px}
.login-card h2{color:#222;margin:0 0 8px}.login-card p{color:#777;font-size:14px;margin-bottom:25px}
.login-card label{display:block;font-size:13px;font-weight:bold;margin:15px 0 7px;color:#444}
.login-card input{width:100%;box-sizing:border-box;padding:13px;border:1px solid #ddd;border-radius:8px;font-size:15px}
.login-card button{width:100%;padding:14px;margin-top:22px;border:none;border-radius:8px;background:#00a968;color:white;font-size:15px;font-weight:bold;cursor:pointer}
.login-card button:disabled{opacity:.6;cursor:wait}#loginError{color:#00a968;font-size:13px;margin-top:14px}
#logoutButton{border:1px solid #ddd;background:white;padding:8px 12px;border-radius:7px;cursor:pointer;margin-left:15px}
.erp-content{margin-top:25px;width:100%}
.erp-toolbar{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:18px}
.erp-button{background:#00a968;color:white;border:0;padding:11px 16px;border-radius:8px;cursor:pointer;font-weight:600}
.erp-button:disabled{opacity:.6;cursor:wait}.erp-button.secondary{background:#eee;color:#444}
.erp-form{display:none;background:white;border:1px solid #eee;border-radius:12px;padding:20px;margin-bottom:20px}
.erp-form h3{margin-top:0}.erp-field label{display:block;font-size:13px;font-weight:bold;margin-bottom:7px;color:#555}
.erp-field input,.erp-field select{box-sizing:border-box;width:100%;padding:11px;border:1px solid #ddd;border-radius:7px;background:white;font-size:14px}
.erp-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
.erp-table-wrap{width:100%;overflow-x:auto;background:white;border:1px solid #eee;border-radius:12px}
.erp-table{width:100%;border-collapse:collapse;min-width:650px}
.erp-table th,.erp-table td{padding:13px 15px;text-align:left;border-bottom:1px solid #eee;font-size:13px;white-space:nowrap}
.erp-table th{background:#fafafa;color:#555}.erp-table tr:last-child td{border-bottom:0}
.erp-message{font-size:13px;margin:12px 0}.erp-error{color:#00a968}.erp-success{color:#18743b}
.erp-muted{color:#777;font-size:13px}.erp-actions{display:flex;gap:10px;margin-top:18px}
.erp-actions button{border:0;border-radius:7px;padding:11px 16px;cursor:pointer;font-weight:bold}
.erp-status{display:inline-block;padding:5px 9px;border-radius:20px;background:#e8f7ed;color:#18743b;font-size:11px;font-weight:bold}
.journal-line{display:grid;grid-template-columns:1.1fr 1.5fr 1fr 1fr auto;gap:9px;align-items:end;padding:12px 0;border-bottom:1px solid #eee}
.journal-line .erp-field{min-width:0}.journal-line input,.journal-line select{min-width:0;width:100%;box-sizing:border-box}
.journal-remove{border:0;background:#fee;color:#00a968;padding:10px;border-radius:7px;cursor:pointer}
.journal-totals{display:flex;justify-content:flex-end;gap:25px;flex-wrap:wrap;margin-top:18px;font-size:14px}
.journal-total{font-weight:bold}.journal-balance{margin-top:12px;font-size:13px;font-weight:bold}
.financial-summary{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-bottom:20px}
.financial-card{background:white;border:1px solid #eee;border-radius:12px;padding:18px}
.financial-card small{color:#777;display:block;margin-bottom:9px}.financial-card strong{font-size:20px;color:#222}
.financial-tabs{display:flex;gap:10px;margin-bottom:18px}
.financial-tabs button{border:1px solid #ddd;background:white;color:#555;padding:10px 18px;border-radius:8px;cursor:pointer;font-weight:bold}
.financial-tabs button.active{background:#00a968;color:white;border-color:#00a968}
.financial-note{background:#fff8e8;border:1px solid #f1dfb7;color:#75551c;padding:12px;border-radius:8px;font-size:12px;margin-bottom:16px}
.ledger-filter{display:grid;grid-template-columns:2fr 1fr 1fr auto;gap:12px;align-items:end;background:white;border:1px solid #eee;border-radius:12px;padding:18px;margin-bottom:20px}
.ledger-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:20px}
.ledger-card{background:white;border:1px solid #eee;border-radius:12px;padding:16px;min-width:0}
.ledger-card small{display:block;color:#777;margin-bottom:8px}.ledger-card strong{font-size:17px;color:#222;overflow-wrap:anywhere}
.ledger-opening{background:#fff8e8;color:#75551c;padding:13px;border-radius:8px;margin-bottom:15px;font-size:13px}
.report-filter{display:grid;grid-template-columns:1fr 1fr auto;gap:12px;align-items:end;background:white;border:1px solid #eee;border-radius:12px;padding:18px;margin-bottom:20px}
.report-summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-bottom:22px}
.report-card{background:white;border:1px solid #eee;border-radius:12px;padding:18px;min-width:0}
.report-card small{display:block;color:#777;margin-bottom:9px}
.report-card strong{font-size:20px;color:#222;overflow-wrap:anywhere}
.report-card.profit{border-left:4px solid #18743b}
.report-card.loss{border-left:4px solid #00a968}
.report-section-title{margin:25px 0 12px;font-size:16px}
.report-total-row{font-weight:bold;background:#fafafa}
.report-empty{padding:18px;text-align:center;color:#777}
.journal-detail-button{border:1px solid #00a968;background:#fff;color:#00a968;padding:7px 10px;border-radius:7px;cursor:pointer;font-weight:600;font-size:12px}
.journal-detail-button:hover{background:#fff4f4}
.ledger-clickable-row{cursor:pointer}
.ledger-clickable-row:hover{background:#fff7f7}
.ledger-clickable-row:focus{outline:2px solid #00a968;outline-offset:-2px}
.ledger-clickable-row td:last-child{white-space:nowrap}

.journal-detail-overlay{position:fixed;inset:0;background:rgba(0,0,0,.48);z-index:99999;display:flex;align-items:center;justify-content:center;padding:18px}
.journal-detail-dialog{width:min(850px,100%);max-height:90vh;overflow:auto;background:#fff;border-radius:14px;padding:22px;box-shadow:0 15px 50px rgba(0,0,0,.2)}
.journal-detail-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:16px}
.journal-detail-close{border:0;background:#eee;border-radius:8px;padding:9px 13px;cursor:pointer}
.journal-detail-meta{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-bottom:16px}
.journal-detail-meta div{background:#fafafa;border:1px solid #eee;border-radius:8px;padding:11px;font-size:13px}
.journal-detail-meta small{display:block;color:#777;margin-bottom:5px}
.journal-detail-total{display:flex;justify-content:flex-end;gap:22px;flex-wrap:wrap;font-weight:700;margin-top:15px}
@media(max-width:600px){.journal-detail-dialog{padding:15px}.journal-detail-meta{grid-template-columns:1fr}}

@media(max-width:700px){
 .erp-grid{grid-template-columns:1fr}
 .journal-line{grid-template-columns:1fr 1fr;border:1px solid #eee;border-radius:9px;padding:12px;margin-bottom:12px}
 .journal-line .account-field,.journal-line .description-field{grid-column:1/-1}
 .journal-remove{grid-column:1/-1}
 .ledger-filter{grid-template-columns:1fr}
 .ledger-summary{grid-template-columns:1fr 1fr}
 .report-filter{grid-template-columns:1fr}
 .report-summary{grid-template-columns:1fr}
}
@media(max-width:600px){.financial-summary{grid-template-columns:1fr}}
`;
document.head.appendChild(style);

const balanceAccountDetailStyle=document.createElement("style");
balanceAccountDetailStyle.textContent=`
.balance-account-clickable{cursor:pointer}
.balance-account-clickable:hover{background:#fff5f5}
.balance-account-clickable:focus{outline:2px solid #00a968;outline-offset:-2px}
.balance-detail-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:99998;display:flex;align-items:center;justify-content:center;padding:16px}
.balance-detail-dialog{width:min(1050px,100%);max-height:90vh;overflow:auto;background:#fff;border-radius:14px;padding:22px;box-shadow:0 15px 50px rgba(0,0,0,.2)}
.balance-detail-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:15px}
.balance-detail-close{border:0;background:#eee;border-radius:8px;padding:9px 13px;cursor:pointer}
.balance-detail-summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:14px 0}
.balance-detail-summary>div{background:#fafafa;border:1px solid #eee;border-radius:9px;padding:12px}
.balance-detail-summary small{display:block;color:#777;margin-bottom:6px}
.balance-detail-summary strong{font-size:15px}
@media(max-width:650px){.balance-detail-dialog{padding:14px}.balance-detail-summary{grid-template-columns:1fr}}
`;
document.head.appendChild(balanceAccountDetailStyle);

// ==========================================
// DASHBOARD - DATA DARI SUPABASE
// ==========================================

const dashboardStyle = document.createElement("style");
dashboardStyle.textContent = `
.dashboard-chart-wrap {
  background:white;
  border:1px solid #eee;
  border-radius:12px;
  padding:20px;
  overflow-x:auto;
}
.dashboard-chart {
  display:flex;
  align-items:flex-end;
  justify-content:space-around;
  gap:12px;
  min-height:220px;
  min-width:320px;
  padding-top:15px;
}
.dashboard-chart-group {
  flex:1;
  min-width:35px;
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:flex-end;
  height:200px;
}
.dashboard-bars {
  height:170px;
  display:flex;
  align-items:flex-end;
  justify-content:center;
  gap:4px;
  width:100%;
}
.dashboard-bar {
  width:35%;
  min-height:2px;
  border-radius:5px 5px 0 0;
}
.dashboard-bar.income {background:#16a36a}
.dashboard-bar.expense {background:#d34b55}
.dashboard-chart-label {
  font-size:11px;
  color:#777;
  margin-top:8px;
}
.dashboard-legend {
  display:flex;
  gap:18px;
  flex-wrap:wrap;
  margin-top:15px;
  font-size:12px;
  color:#666;
}
.dashboard-legend span {
  display:flex;
  align-items:center;
  gap:6px;
}
.dashboard-dot {
  width:9px;
  height:9px;
  border-radius:3px;
  display:inline-block;
}
.dashboard-error {
  color:#00a968;
  font-size:13px;
  padding:12px 0;
}
`;
document.head.appendChild(dashboardStyle);

async function getAllFinancialTransactions() {
  const all = [];
  const pageSize = 500;
  let from = 0;

  while (true) {
    const {data,error} = await supabaseClient
      .from("financial_transactions")
      .select("id,tanggal,jenis,akun_kas_id,akun_lawan_id,nominal,keterangan,journal_id,created_at")
      .order("tanggal",{ascending:false})
      .range(from,from+pageSize-1);

    if (error) throw error;
    all.push(...(data || []));
    if (!data || data.length < pageSize) break;
    from += pageSize;
  }
  return all;
}

async function getDashboardCashBalance() {
  const {data:accounts,error:accountError} = await supabaseClient
    .from("accounts")
    .select("id,kode_akun,nama_akun")
    .in("kode_akun",["1101","1102"]);

  if (accountError) throw accountError;
  const accountIds = (accounts || []).map(a=>a.id);
  if (!accountIds.length) return 0;

  let balance = 0;
  let from = 0;
  const pageSize = 500;

  while (true) {
    const {data,error} = await supabaseClient
      .from("journal_lines")
      .select("account_id,debit,kredit,journal_entries!inner(status)")
      .in("account_id",accountIds)
      .eq("journal_entries.status","posted")
      .range(from,from+pageSize-1);

    if (error) throw error;
    (data || []).forEach(line=>{
      balance += Number(line.debit || 0) - Number(line.kredit || 0);
    });
    if (!data || data.length < pageSize) break;
    from += pageSize;
  }
  return balance;
}

function dashboardMonthKey(date) {
  return date.getFullYear()+"-"+String(date.getMonth()+1).padStart(2,"0");
}

function renderDashboardChart(transactions) {
  const chart = document.getElementById("dashboardChart");
  const periodSelect = document.getElementById("dashboardPeriod");
  if (!chart) return;

  const months = Number(periodSelect?.value || 1);
  const now = new Date();
  const start = new Date(now.getFullYear(),now.getMonth()-months+1,1);
  const totals = {};

  for (let i=0;i<months;i++) {
    const date = new Date(start.getFullYear(),start.getMonth()+i,1);
    totals[dashboardMonthKey(date)] = {
      label:date.toLocaleDateString("id-ID",{month:"short"}),
      income:0,
      expense:0
    };
  }

  transactions.forEach(item=>{
    const date = new Date(item.tanggal+"T00:00:00");
    const key = dashboardMonthKey(date);
    if (!totals[key]) return;
    if (item.jenis==="pemasukan") totals[key].income += Number(item.nominal);
    else if (item.jenis==="pengeluaran") totals[key].expense += Number(item.nominal);
  });

  const values = Object.values(totals);
  const maximum = Math.max(1,...values.map(x=>Math.max(x.income,x.expense)));

  chart.className = "dashboard-chart-wrap";
  chart.innerHTML = `
    <div class="dashboard-chart">
      ${values.map(item=>{
        const incomeHeight = item.income/maximum*100;
        const expenseHeight = item.expense/maximum*100;
        return `
          <div class="dashboard-chart-group">
            <div class="dashboard-bars">
              <div class="dashboard-bar income" style="height:${incomeHeight}%" title="Pemasukan: ${formatRupiah(item.income)}"></div>
              <div class="dashboard-bar expense" style="height:${expenseHeight}%" title="Pengeluaran: ${formatRupiah(item.expense)}"></div>
            </div>
            <div class="dashboard-chart-label">${escapeHTML(item.label)}</div>
          </div>`;
      }).join("")}
    </div>
    <div class="dashboard-legend">
      <span><i class="dashboard-dot" style="background:#16a36a"></i>Pemasukan</span>
      <span><i class="dashboard-dot" style="background:#d34b55"></i>Pengeluaran</span>
    </div>`;
}

function renderDashboardRecent(transactions) {
  const container = document.getElementById("dashboardRecentTransactions");
  if (!container) return;

  const latest = [...transactions]
    .sort((a,b)=>{
      const dateCompare = String(b.tanggal).localeCompare(String(a.tanggal));
      if (dateCompare !== 0) return dateCompare;
      return String(b.created_at || "").localeCompare(String(a.created_at || ""));
    }).slice(0,5);

  if (!latest.length) {
    container.innerHTML = `<tr><td colspan="5">Belum ada transaksi keuangan.</td></tr>`;
    return;
  }

  container.innerHTML = latest.map(item=>`
    <tr>
      <td>${escapeHTML(item.tanggal)}</td>
      <td>${item.jenis==="pemasukan"?"Pemasukan":"Pengeluaran"}</td>
      <td>${escapeHTML(item.keterangan)}</td>
      <td>${formatRupiah(item.nominal)}</td>
      <td><span class="erp-status">Posted</span></td>
    </tr>
  `).join("");
}

async function loadDashboard() {
  const incomeElement = document.getElementById("dashboardIncome");
  if (!incomeElement) return;
  incomeElement.textContent = "Memuat...";

  try {
    const [transactions,cashBalance] = await Promise.all([
      getAllFinancialTransactions(),
      getDashboardCashBalance()
    ]);

    const income = transactions.filter(x=>x.jenis==="pemasukan").reduce((sum,x)=>sum+Number(x.nominal),0);
    const expense = transactions.filter(x=>x.jenis==="pengeluaran").reduce((sum,x)=>sum+Number(x.nominal),0);

    incomeElement.textContent = formatRupiah(income);
    const expenseElement = document.getElementById("dashboardExpense");
    if (expenseElement) expenseElement.textContent = formatRupiah(expense);
    const cashElement = document.getElementById("dashboardCash");
    if (cashElement) cashElement.textContent = formatRupiah(cashBalance);
    const countElement = document.getElementById("dashboardTransactionCount");
    if (countElement) countElement.textContent = transactions.length;

    renderDashboardChart(transactions);
    renderDashboardRecent(transactions);
  } catch (error) {
    console.error("Dashboard error:",error);
    incomeElement.textContent = "Gagal memuat";
    ["dashboardExpense","dashboardCash","dashboardTransactionCount"].forEach(id=>{
      const element = document.getElementById(id);
      if (element) element.textContent = "-";
    });
    const chart = document.getElementById("dashboardChart");
    if (chart) chart.innerHTML = `<div class="dashboard-error">Dashboard gagal mengambil data. Periksa hak akses database dan koneksi Supabase.</div>`;
    const recent = document.getElementById("dashboardRecentTransactions");
    if (recent) recent.innerHTML = `<tr><td colspan="5">Gagal memuat transaksi.</td></tr>`;
  }
}

document.getElementById("dashboardPeriod")?.addEventListener("change",async ()=>{
  await loadDashboard();
});

// LOGIN
const loginScreen = document.createElement("div");
loginScreen.id = "loginScreen";
loginScreen.innerHTML = `
  <div class="login-card">
    <div class="login-logo">D</div>
    <h2>DAIBOEK</h2>
    <p>by NUSA PIXEL · ACCOUNTING SYSTEM</p>
    <form id="loginForm">
      <label>Email</label><input type="email" id="loginEmail" required autocomplete="username">
      <label>Password</label><input type="password" id="loginPassword" required autocomplete="current-password">
      <button type="submit" id="loginButton">Masuk ke Sistem</button>
      <div id="loginError" role="alert"></div>
    </form>
  </div>`;
document.body.prepend(loginScreen);

const layout = document.querySelector(".layout");
if (layout) layout.style.display = "none";

const loginForm = document.getElementById("loginForm");
const loginButton = document.getElementById("loginButton");
const loginError = document.getElementById("loginError");

loginForm.addEventListener("submit", async event => {
  event.preventDefault();
  loginButton.disabled = true;
  loginButton.textContent = "Memeriksa akun...";
  loginError.textContent = "";

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;
  const {data,error} = await supabaseClient.auth.signInWithPassword({email,password});

  if (error) {
    loginError.textContent = "Login gagal. Periksa email dan password.";
    loginButton.disabled = false;
    loginButton.textContent = "Masuk ke Sistem";
    return;
  }
  await loadUserProfile(data.user);
});

async function loadUserProfile(user) {
  const {data:profile,error} = await supabaseClient
    .from("profiles").select("nama_lengkap, role").eq("id",user.id).single();

  if (error || !profile) {
    await supabaseClient.auth.signOut();
    loginError.textContent = "Profil pengguna tidak ditemukan.";
    loginButton.disabled = false;
    loginButton.textContent = "Masuk ke Sistem";
    return;
  }

  loginScreen.style.display = "none";
  if (layout) layout.style.display = "";

  window.currentUser = {id:user.id,nama:profile.nama_lengkap,role:profile.role};

  const userInfo = document.querySelector(".user-info");
  const avatar = document.querySelector(".avatar");
  if (userInfo) {
    userInfo.replaceChildren(document.createTextNode(profile.nama_lengkap));
    const role = document.createElement("small");
    role.textContent = profile.role.replaceAll("_"," ");
    userInfo.append(role);
  }
  if (avatar) avatar.textContent = profile.nama_lengkap.charAt(0).toUpperCase();
  addLogoutButton();
  applyRoleMenuVisibility();
  const allowedPages=KDMP_ROLE_PAGES[profile.role]||["dashboard","rumus-kamus"];
  const defaultPage=allowedPages.includes("dashboard")?"dashboard":(allowedPages[0]||"dashboard");
  const defaultButton=[...document.querySelectorAll(".menu button")].find(button=>
    button.getAttribute("onclick")?.includes("'"+defaultPage+"'")
  );
  window.showPage(defaultPage,defaultButton);
}

function addLogoutButton() {
  const topActions = document.querySelector(".top-actions");
  if (!topActions || document.getElementById("logoutButton")) return;
  const button = document.createElement("button");
  button.id = "logoutButton";
  button.textContent = "Keluar";
  button.addEventListener("click", async () => {
    const {error} = await supabaseClient.auth.signOut();
    if (error) { alert("Gagal keluar. Silakan coba lagi."); return; }
    window.location.reload();
  });
  topActions.appendChild(button);
}

// FUNGSI UMUM
function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  })[character]);
}
function capitalize(value) { return value ? value.charAt(0).toUpperCase()+value.slice(1) : "-"; }
function formatRupiah(value) {
  return new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(value || 0);
}
function todayDate() {
  const now = new Date();
  const local = new Date(now.getTime()-now.getTimezoneOffset()*60000);
  return local.toISOString().slice(0,10);
}
function firstDayOfMonth() { return todayDate().slice(0,8)+"01"; }

// CHART OF ACCOUNTS
function setupCOA() {
  const page = document.getElementById("modulePage");
  if (!page || document.getElementById("coaContent")) return;
  const section = document.createElement("section");
  section.id = "coaContent";
  section.className = "erp-content";
  section.innerHTML = `
    <div class="erp-toolbar">
      <div class="erp-muted" id="coaSummary">Memuat akun...</div>
      <button class="erp-button" id="coaAddButton">+ Tambah Akun</button>
    </div>
    <div class="erp-form" id="coaForm">
      <h3>Tambah Akun Baru</h3>
      <form id="coaCreateForm">
        <div class="erp-grid">
          <div class="erp-field"><label>Kode Akun</label><input id="coaCode" required maxlength="20" placeholder="Contoh: 1105"></div>
          <div class="erp-field"><label>Nama Akun</label><input id="coaName" required maxlength="100"></div>
          <div class="erp-field"><label>Kategori</label><select id="coaCategory">
            <option value="aset">Aset</option><option value="kewajiban">Kewajiban</option><option value="ekuitas">Ekuitas</option><option value="pendapatan">Pendapatan</option><option value="beban">Beban</option>
          </select></div>
          <div class="erp-field"><label>Saldo Normal</label><select id="coaNormal"><option value="debit">Debit</option><option value="kredit">Kredit</option></select></div>
        </div>
        <div id="coaMessage" class="erp-message"></div>
        <div class="erp-actions"><button class="erp-button" id="coaSaveButton">Simpan Akun</button><button type="button" class="erp-button secondary" id="coaCancelButton">Batal</button></div>
      </form>
    </div>
    <div class="erp-table-wrap"><table class="erp-table">
      <thead><tr><th>Kode Akun</th><th>Nama Akun</th><th>Kategori</th><th>Saldo Normal</th><th>Status</th></tr></thead>
      <tbody id="coaTableBody"></tbody>
    </table></div>`;
  page.appendChild(section);

  document.getElementById("coaAddButton").addEventListener("click",()=>document.getElementById("coaForm").style.display="block");
  document.getElementById("coaCancelButton").addEventListener("click",()=>{
    document.getElementById("coaForm").style.display="none";
    document.getElementById("coaCreateForm").reset();
  });
  document.getElementById("coaCreateForm").addEventListener("submit",createCOAAccount);
  if (window.currentUser?.role!=="manajer") document.getElementById("coaAddButton").style.display="none";
}

async function loadCOA() {
  setupCOA();
  const summary=document.getElementById("coaSummary"),body=document.getElementById("coaTableBody");
  if (!summary||!body) return;
  summary.textContent="Memuat akun...";
  const {data,error}=await supabaseClient.from("accounts")
    .select("id,kode_akun,nama_akun,kategori,saldo_normal,aktif").order("kode_akun");
  if (error) {
    summary.textContent="Gagal mengambil akun.";
    body.innerHTML=`<tr><td colspan="5">${escapeHTML(error.message)}</td></tr>`;
    return;
  }
  coaCache=data||[];
  summary.textContent=`Total ${coaCache.length} akun terdaftar`;
  body.replaceChildren();
  coaCache.forEach(account=>{
    const row=document.createElement("tr");
    [account.kode_akun,account.nama_akun,capitalize(account.kategori),capitalize(account.saldo_normal),account.aktif?"Aktif":"Nonaktif"].forEach((value,index)=>{
      const cell=document.createElement("td");
      cell.textContent=value;
      if(index===4&&account.aktif){
        const badge=document.createElement("span");
        badge.className="erp-status";badge.textContent="Aktif";cell.replaceChildren(badge);
      }
      row.appendChild(cell);
    });
    body.appendChild(row);
  });
}

async function createCOAAccount(event) {
  event.preventDefault();
  if(window.currentUser?.role!=="manajer") return;
  const button=document.getElementById("coaSaveButton"),message=document.getElementById("coaMessage");
  button.disabled=true;
  const {error}=await supabaseClient.from("accounts").insert({
    kode_akun:document.getElementById("coaCode").value.trim(),
    nama_akun:document.getElementById("coaName").value.trim(),
    kategori:document.getElementById("coaCategory").value,
    saldo_normal:document.getElementById("coaNormal").value
  });
  button.disabled=false;
  if(error){message.className="erp-message erp-error";message.textContent=error.message;return;}
  message.className="erp-message erp-success";message.textContent="Akun berhasil ditambahkan.";
  document.getElementById("coaCreateForm").reset();
  await loadCOA();
}

// ==========================================
// PENCATATAN KEUANGAN
// ==========================================
function setupFinancial() {
  const page=document.getElementById("modulePage");
  if(!page||document.getElementById("financialContent")) return;
  const section=document.createElement("section"); section.id="financialContent";section.className="erp-content";
  section.innerHTML=`
    <div class="financial-summary">
      <div class="financial-card"><small>Total Pemasukan</small><strong id="financialIncome">Rp0</strong></div>
      <div class="financial-card"><small>Total Pengeluaran</small><strong id="financialExpense">Rp0</strong></div>
    </div>
    <div class="erp-toolbar"><div><h3 style="margin:0 0 5px">Transaksi Keuangan</h3><div class="erp-muted">Catat pemasukan dan pengeluaran KDMP.</div></div><div style="display:flex;gap:10px;flex-wrap:wrap"><button type="button" class="erp-button secondary" id="financialOpenReportsButton">📊 Lihat Laporan Keuangan</button><button class="erp-button" id="financialNewButton">+ Catat Transaksi</button></div></div>
    <div class="erp-form" id="financialForm"><h3 id="financialFormTitle">Catat Pemasukan</h3>
      <div class="financial-tabs"><button type="button" id="financialIncomeTab" class="active">Pemasukan</button><button type="button" id="financialExpenseTab">Pengeluaran</button></div>
      <div class="financial-note">Transaksi yang disimpan akan otomatis membentuk jurnal debit dan kredit.</div>
      <form id="financialCreateForm"><div class="erp-grid">
        <div class="erp-field"><label>Tanggal Transaksi</label><input type="date" id="financialDate" required></div>
        <div class="erp-field"><label>Nominal (Rp)</label><input type="number" id="financialAmount" min="1" step="0.01" required placeholder="Contoh: 500000"></div>
        <div class="erp-field"><label>Akun Kas / Bank</label><select id="financialCashAccount" required><option value="">Memuat akun...</option></select></div>
        <div class="erp-field"><label id="financialCounterpartLabel">Akun Pendapatan</label><select id="financialCounterpartAccount" required><option value="">Pilih akun</option></select></div>
        <div class="erp-field" style="grid-column:1/-1"><label>Keterangan Transaksi</label><input id="financialDescription" required maxlength="500" placeholder="Contoh: Penjualan barang toko"></div>
      </div><div id="financialMessage" class="erp-message"></div>
      <div class="erp-actions"><button type="submit" class="erp-button" id="financialSaveButton">Simpan Transaksi</button><button type="button" class="erp-button secondary" id="financialCancelButton">Batal</button></div></form>
    </div>
    <h3>Riwayat Transaksi</h3><div class="erp-table-wrap"><table class="erp-table"><thead><tr><th>Tanggal</th><th>Jenis</th><th>Keterangan</th><th>Akun Kas/Bank</th><th>Akun Lawan</th><th>Nominal</th><th>Nomor Jurnal</th></tr></thead><tbody id="financialHistoryBody"><tr><td colspan="7">Memuat transaksi...</td></tr></tbody></table></div>`;
  page.appendChild(section);
  document.getElementById("financialNewButton").addEventListener("click",openFinancialForm);
  document.getElementById("financialOpenReportsButton").addEventListener("click",()=>{
    if(typeof window.showPage==="function") window.showPage("laporan");
  });
  document.getElementById("financialIncomeTab").addEventListener("click",()=>setFinancialType("pemasukan"));
  document.getElementById("financialExpenseTab").addEventListener("click",()=>setFinancialType("pengeluaran"));
  document.getElementById("financialCancelButton").addEventListener("click",closeFinancialForm);
  document.getElementById("financialCreateForm").addEventListener("submit",saveFinancialTransaction);
  if(!["manajer","admin_keuangan"].includes(window.currentUser?.role)) document.getElementById("financialNewButton").style.display="none";
}

function setFinancialType(type) {
  financialType=type;
  const incomeTab=document.getElementById("financialIncomeTab"),expenseTab=document.getElementById("financialExpenseTab");
  incomeTab.classList.toggle("active",type==="pemasukan");expenseTab.classList.toggle("active",type==="pengeluaran");
  document.getElementById("financialFormTitle").textContent=type==="pemasukan"?"Catat Pemasukan":"Catat Pengeluaran";
  document.getElementById("financialCounterpartLabel").textContent=type==="pemasukan"?"Akun Pendapatan":"Akun Beban";
  loadFinancialAccountOptions();
}

function loadFinancialAccountOptions() {
  const cashSelect=document.getElementById("financialCashAccount"), counterpartSelect=document.getElementById("financialCounterpartAccount");
  if(!cashSelect||!counterpartSelect)return;
  const cashAccounts=financialAccountsCache.filter(a=>a.aktif&&a.kategori==="aset"&&/(kas|bank)/i.test(a.nama_akun));
  const targetCategory=financialType==="pemasukan"?"pendapatan":"beban";
  const counterpartAccounts=financialAccountsCache.filter(a=>a.aktif&&a.kategori===targetCategory);
  cashSelect.innerHTML='<option value="">Pilih akun kas/bank</option>'+cashAccounts.map(a=>`<option value="${escapeHTML(a.id)}">${escapeHTML(a.kode_akun)} - ${escapeHTML(a.nama_akun)}</option>`).join("");
  counterpartSelect.innerHTML=`<option value="">Pilih akun ${financialType==="pemasukan"?"pendapatan":"beban"}</option>`+counterpartAccounts.map(a=>`<option value="${escapeHTML(a.id)}">${escapeHTML(a.kode_akun)} - ${escapeHTML(a.nama_akun)}</option>`).join("");
  if(!cashAccounts.length)cashSelect.innerHTML='<option value="">Akun Kas/Bank belum tersedia</option>';
  if(!counterpartAccounts.length)counterpartSelect.innerHTML='<option value="">Akun belum tersedia</option>';
}

async function openFinancialForm() {
  const button=document.getElementById("financialNewButton");button.disabled=true;
  const {data,error}=await supabaseClient.from("accounts").select("id,kode_akun,nama_akun,kategori,aktif").eq("aktif",true).order("kode_akun");
  button.disabled=false;if(error){alert("Gagal memuat akun: "+error.message);return;}
  financialAccountsCache=data||[];
  document.getElementById("financialCreateForm").reset();document.getElementById("financialDate").value=todayDate();
  document.getElementById("financialMessage").textContent="";setFinancialType("pemasukan");
  document.getElementById("financialForm").style.display="block";
  if(!financialAccountsCache.some(a=>a.aktif&&a.kategori==="aset"&&/(kas|bank)/i.test(a.nama_akun))){
    const msg=document.getElementById("financialMessage");msg.textContent="Belum ada akun dengan nama Kas atau Bank. Periksa Chart of Accounts.";msg.className="erp-message erp-error";
  }
}

function closeFinancialForm(){document.getElementById("financialForm").style.display="none";}

async function saveFinancialTransaction(event) {
  event.preventDefault();
  const button=document.getElementById("financialSaveButton"),message=document.getElementById("financialMessage");
  if(!["manajer","admin_keuangan"].includes(window.currentUser?.role)){message.textContent="Akses tidak diizinkan.";message.className="erp-message erp-error";return;}
  const date=document.getElementById("financialDate").value,amount=Number(document.getElementById("financialAmount").value);
  const cashAccount=document.getElementById("financialCashAccount").value,counterpartAccount=document.getElementById("financialCounterpartAccount").value;
  const description=document.getElementById("financialDescription").value.trim();
  if(!date||!cashAccount||!counterpartAccount||!description||!Number.isFinite(amount)||amount<=0){message.textContent="Lengkapi semua data dengan benar.";message.className="erp-message erp-error";return;}
  if(cashAccount===counterpartAccount){message.textContent="Akun kas dan akun lawan tidak boleh sama.";message.className="erp-message erp-error";return;}
  button.disabled=true;button.textContent="Menyimpan transaksi...";message.textContent="";
  const {error}=await supabaseClient.rpc("catat_transaksi_keuangan",{p_tanggal:date,p_jenis:financialType,p_akun_kas_id:cashAccount,p_akun_lawan_id:counterpartAccount,p_nominal:amount,p_keterangan:description});
  button.disabled=false;button.textContent="Simpan Transaksi";
  if(error){message.textContent="Gagal menyimpan transaksi: "+error.message;message.className="erp-message erp-error";return;}
  document.getElementById("financialCreateForm").reset();closeFinancialForm();await loadFinancialHistory();
  alert("Transaksi berhasil disimpan dan jurnal otomatis sudah dibuat!");
}

async function loadFinancialHistory() {
  const body=document.getElementById("financialHistoryBody");if(!body)return;
  body.innerHTML='<tr><td colspan="7">Memuat transaksi...</td></tr>';
  const {data:transactions,error}=await supabaseClient.from("financial_transactions")
    .select("id,tanggal,jenis,akun_kas_id,akun_lawan_id,nominal,keterangan,journal_id")
    .order("tanggal",{ascending:false}).limit(100);
  if(error){body.innerHTML=`<tr><td colspan="7">${escapeHTML(error.message)}</td></tr>`;return;}
  if(!transactions?.length){
    body.innerHTML='<tr><td colspan="7">Belum ada transaksi keuangan.</td></tr>';
    document.getElementById("financialIncome").textContent=formatRupiah(0);
    document.getElementById("financialExpense").textContent=formatRupiah(0);
    return;
  }
  const [{data:accounts},{data:journals}]=await Promise.all([
    supabaseClient.from("accounts").select("id,kode_akun,nama_akun"),
    supabaseClient.from("journal_entries").select("id,nomor_jurnal")
  ]);
  const accountMap=new Map((accounts||[]).map(a=>[a.id,a])),journalMap=new Map((journals||[]).map(j=>[j.id,j.nomor_jurnal]));
  const income=transactions.filter(x=>x.jenis==="pemasukan").reduce((s,x)=>s+Number(x.nominal),0);
  const expense=transactions.filter(x=>x.jenis==="pengeluaran").reduce((s,x)=>s+Number(x.nominal),0);
  document.getElementById("financialIncome").textContent=formatRupiah(income);
  document.getElementById("financialExpense").textContent=formatRupiah(expense);
  body.replaceChildren();
  transactions.forEach(item=>{
    const cash=accountMap.get(item.akun_kas_id),counter=accountMap.get(item.akun_lawan_id),row=document.createElement("tr");
    const values=[item.tanggal,item.jenis==="pemasukan"?"Pemasukan":"Pengeluaran",item.keterangan,cash?`${cash.kode_akun} - ${cash.nama_akun}`:"-",counter?`${counter.kode_akun} - ${counter.nama_akun}`:"-",formatRupiah(item.nominal),journalMap.get(item.journal_id)||"-"];
    values.forEach(value=>{const cell=document.createElement("td");cell.textContent=value;row.appendChild(cell);});
    body.appendChild(row);
  });
}

// ==========================================
// JURNAL UMUM
// ==========================================
function setupJournal() {
  const page=document.getElementById("modulePage");
  if(!page||document.getElementById("journalContent"))return;
  const section=document.createElement("section");section.id="journalContent";section.className="erp-content";
  section.innerHTML=`
    <div class="erp-toolbar"><div><h3 style="margin:0 0 5px">Jurnal Umum</h3><div class="erp-muted">Catat transaksi dengan sistem debit dan kredit.</div></div><button class="erp-button" id="journalNewButton">+ Buat Jurnal</button></div>
    <div class="erp-form" id="journalForm"><h3>Buat Jurnal Baru</h3><form id="journalCreateForm">
      <div class="erp-grid"><div class="erp-field"><label>Tanggal</label><input type="date" id="journalDate" required></div>
      <div class="erp-field"><label>Keterangan</label><input id="journalDescription" required placeholder="Contoh: Pembelian perlengkapan toko"></div></div>
      <h4 style="margin:22px 0 8px">Rincian Jurnal</h4><div class="erp-muted">Setiap baris hanya boleh diisi debit atau kredit.</div><div id="journalLines"></div>
      <button type="button" class="erp-button secondary" id="journalAddLine" style="margin-top:14px">+ Tambah Baris</button>
      <div class="journal-totals"><div>Total Debit: <span id="journalDebitTotal" class="journal-total">Rp0</span></div><div>Total Kredit: <span id="journalCreditTotal" class="journal-total">Rp0</span></div></div>
      <div id="journalBalance" class="journal-balance"></div><div id="journalMessage" class="erp-message"></div>
      <div class="erp-actions"><button type="submit" class="erp-button" id="journalSaveButton">Simpan dan Posting</button><button type="button" class="erp-button secondary" id="journalCancelButton">Batal</button></div>
    </form></div>
    <h3>Riwayat Jurnal</h3><div class="erp-table-wrap"><table class="erp-table"><thead><tr><th>Nomor Jurnal</th><th>Tanggal</th><th>Keterangan</th><th>Status</th><th>Total Debit</th><th>Total Kredit</th><th>Aksi</th></tr></thead><tbody id="journalHistoryBody"><tr><td colspan="7">Memuat riwayat jurnal...</td></tr></tbody></table></div>`;
  page.appendChild(section);
  document.getElementById("journalNewButton").addEventListener("click",openJournalForm);
  document.getElementById("journalAddLine").addEventListener("click",addJournalLine);
  document.getElementById("journalCancelButton").addEventListener("click",closeJournalForm);
  document.getElementById("journalCreateForm").addEventListener("submit",saveJournal);
  document.getElementById("journalDate").value=todayDate();
  if(!["manajer","admin_keuangan"].includes(window.currentUser?.role))document.getElementById("journalNewButton").style.display="none";
}

async function openJournalForm() {
  const {data,error}=await supabaseClient.from("accounts").select("id,kode_akun,nama_akun,aktif").eq("aktif",true).order("kode_akun");
  if(error){alert("Gagal memuat daftar akun: "+error.message);return;}
  coaCache=data||[];if(coaCache.length<2){alert("Minimal harus tersedia dua akun aktif.");return;}
  document.getElementById("journalForm").style.display="block";document.getElementById("journalCreateForm").reset();
  document.getElementById("journalDate").value=todayDate();document.getElementById("journalLines").replaceChildren();journalRowCount=0;
  addJournalLine();addJournalLine();updateJournalTotals();document.getElementById("journalMessage").textContent="";document.getElementById("journalBalance").textContent="";
}
function closeJournalForm(){document.getElementById("journalForm").style.display="none";}

function addJournalLine() {
  const container=document.getElementById("journalLines"),row=document.createElement("div");row.className="journal-line";row.dataset.row=String(++journalRowCount);
  const options=coaCache.map(a=>`<option value="${escapeHTML(a.id)}">${escapeHTML(a.kode_akun)} - ${escapeHTML(a.nama_akun)}</option>`).join("");
  row.innerHTML=`<div class="erp-field account-field"><label>Akun</label><select class="line-account" required><option value="">Pilih akun</option>${options}</select></div>
    <div class="erp-field description-field"><label>Keterangan</label><input class="line-description" placeholder="Keterangan baris"></div>
    <div class="erp-field"><label>Debit (Rp)</label><input class="line-debit" type="number" min="0" step="0.01" value="0"></div>
    <div class="erp-field"><label>Kredit (Rp)</label><input class="line-credit" type="number" min="0" step="0.01" value="0"></div><button type="button" class="journal-remove" title="Hapus baris">Hapus</button>`;
  row.querySelector(".line-debit").addEventListener("input",()=>{if(Number(row.querySelector(".line-debit").value)>0)row.querySelector(".line-credit").value="0";updateJournalTotals();});
  row.querySelector(".line-credit").addEventListener("input",()=>{if(Number(row.querySelector(".line-credit").value)>0)row.querySelector(".line-debit").value="0";updateJournalTotals();});
  row.querySelector(".journal-remove").addEventListener("click",()=>{if(container.children.length<=2){alert("Jurnal minimal harus memiliki dua baris.");return;}row.remove();updateJournalTotals();});
  container.appendChild(row);
}

function updateJournalTotals() {
  const rows=[...document.querySelectorAll(".journal-line")];
  const debit=rows.reduce((s,r)=>s+Number(r.querySelector(".line-debit").value||0),0);
  const credit=rows.reduce((s,r)=>s+Number(r.querySelector(".line-credit").value||0),0);
  document.getElementById("journalDebitTotal").textContent=formatRupiah(debit);
  document.getElementById("journalCreditTotal").textContent=formatRupiah(credit);
  const balance=document.getElementById("journalBalance");
  if(debit>0&&Math.abs(debit-credit)<0.005){balance.textContent="✓ Debit dan kredit seimbang.";balance.className="journal-balance erp-success";}
  else{balance.textContent="Belum seimbang. Selisih: "+formatRupiah(Math.abs(debit-credit));balance.className="journal-balance erp-error";}
}

async function saveJournal(event) {
  event.preventDefault();
  const button=document.getElementById("journalSaveButton"),message=document.getElementById("journalMessage");
  if(!["manajer","admin_keuangan"].includes(window.currentUser?.role)){message.textContent="Akses tidak diizinkan.";message.className="erp-message erp-error";return;}
  const rows=[...document.querySelectorAll(".journal-line")];if(rows.length<2){message.textContent="Jurnal minimal memiliki dua baris.";message.className="erp-message erp-error";return;}
  const lines=[];
  for(const row of rows){
    const accountId=row.querySelector(".line-account").value,debit=Number(row.querySelector(".line-debit").value||0),credit=Number(row.querySelector(".line-credit").value||0),description=row.querySelector(".line-description").value.trim();
    if(!accountId||!Number.isFinite(debit)||!Number.isFinite(credit)||debit<0||credit<0||(debit>0&&credit>0)||(debit===0&&credit===0)){
      message.textContent="Periksa akun dan nilai debit/kredit setiap baris.";message.className="erp-message erp-error";return;
    }
    lines.push({account_id:accountId,keterangan:description||null,debit,kredit:credit});
  }
  const totalDebit=lines.reduce((s,l)=>s+l.debit,0),totalCredit=lines.reduce((s,l)=>s+l.kredit,0);
  if(totalDebit<=0||Math.abs(totalDebit-totalCredit)>=0.005){message.textContent="Total debit dan kredit harus sama dan lebih dari nol.";message.className="erp-message erp-error";return;}
  const date=document.getElementById("journalDate").value,description=document.getElementById("journalDescription").value.trim();
  if(!date||!description){message.textContent="Tanggal dan keterangan transaksi wajib diisi.";message.className="erp-message erp-error";return;}
  button.disabled=true;button.textContent="Menyimpan jurnal...";
  const journalNumber="JU-"+date.replaceAll("-","")+"-"+Date.now().toString().slice(-6);
  const {data:header,error:headerError}=await supabaseClient.from("journal_entries").insert({nomor_jurnal:journalNumber,tanggal:date,keterangan:description,status:"draft",created_by:window.currentUser.id}).select("id").single();
  if(headerError){button.disabled=false;button.textContent="Simpan dan Posting";message.textContent="Gagal membuat jurnal: "+headerError.message;message.className="erp-message erp-error";return;}
  const {error:lineError}=await supabaseClient.from("journal_lines").insert(lines.map(line=>({...line,journal_id:header.id})));
  if(lineError){await supabaseClient.from("journal_entries").delete().eq("id",header.id);button.disabled=false;button.textContent="Simpan dan Posting";message.textContent="Gagal menyimpan rincian: "+lineError.message;message.className="erp-message erp-error";return;}
  const {error:postError}=await supabaseClient.from("journal_entries").update({status:"posted"}).eq("id",header.id);
  if(postError){await supabaseClient.from("journal_entries").delete().eq("id",header.id);button.disabled=false;button.textContent="Simpan dan Posting";message.textContent="Jurnal belum berhasil diposting: "+postError.message;message.className="erp-message erp-error";return;}
  button.disabled=false;button.textContent="Simpan dan Posting";document.getElementById("journalCreateForm").reset();document.getElementById("journalLines").replaceChildren();closeJournalForm();await loadJournalHistory();
}

async function loadJournalHistory() {
  const body=document.getElementById("journalHistoryBody");if(!body)return;
  body.innerHTML='<tr><td colspan="7">Memuat riwayat jurnal...</td></tr>';
  const {data:entries,error}=await supabaseClient.from("journal_entries").select("id,nomor_jurnal,tanggal,keterangan,status").order("tanggal",{ascending:false}).limit(50);
  if(error){body.innerHTML=`<tr><td colspan="7">${escapeHTML(error.message)}</td></tr>`;return;}
  if(!entries?.length){body.innerHTML='<tr><td colspan="7">Belum ada jurnal.</td></tr>';return;}
  const ids=entries.map(e=>e.id);
  const {data:lines,error:lineError}=await supabaseClient.from("journal_lines").select("journal_id,debit,kredit").in("journal_id",ids);
  if(lineError){body.innerHTML=`<tr><td colspan="7">${escapeHTML(lineError.message)}</td></tr>`;return;}
  body.replaceChildren();
  entries.forEach(entry=>{
    const related=(lines||[]).filter(l=>l.journal_id===entry.id),debit=related.reduce((s,l)=>s+Number(l.debit),0),credit=related.reduce((s,l)=>s+Number(l.kredit),0),row=document.createElement("tr");
    [entry.nomor_jurnal,entry.tanggal,entry.keterangan,entry.status,formatRupiah(debit),formatRupiah(credit)].forEach((value,index)=>{
      const cell=document.createElement("td");cell.textContent=value;
      if(index===3&&entry.status==="posted"){const badge=document.createElement("span");badge.className="erp-status";badge.textContent="Posted";cell.replaceChildren(badge);}
      row.appendChild(cell);
    });
    const actionCell=document.createElement("td");
    const detailButton=document.createElement("button");
    detailButton.type="button";
    detailButton.className="journal-detail-button";
    detailButton.textContent="Lihat Detail";
    detailButton.addEventListener("click",()=>openJournalDetail(entry.id));
    actionCell.appendChild(detailButton);
    row.appendChild(actionCell);
    body.appendChild(row);
  });
}

// ==========================================
// DETAIL JURNAL (READ ONLY)
// ==========================================
async function openJournalDetail(journalId) {
  if (!journalId) { alert("ID jurnal tidak ditemukan."); return; }
  let overlay=document.getElementById("journalDetailOverlay");
  if (!overlay) {
    overlay=document.createElement("div");
    overlay.id="journalDetailOverlay";
    overlay.className="journal-detail-overlay";
    overlay.innerHTML=`
      <div class="journal-detail-dialog" role="dialog" aria-modal="true" aria-labelledby="journalDetailTitle">
        <div class="journal-detail-head">
          <div><h3 id="journalDetailTitle" style="margin:0 0 5px">Detail Jurnal</h3><div class="erp-muted" id="journalDetailMessage">Memuat rincian jurnal...</div></div>
          <button type="button" class="journal-detail-close" id="journalDetailClose">Tutup ✕</button>
        </div>
        <div id="journalDetailContent"></div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener("click",event=>{ if(event.target===overlay)overlay.style.display="none"; });
    overlay.querySelector("#journalDetailClose").addEventListener("click",()=>overlay.style.display="none");
  }
  overlay.style.display="flex";
  const message=document.getElementById("journalDetailMessage");
  const content=document.getElementById("journalDetailContent");
  message.textContent="Memuat rincian jurnal...";
  content.innerHTML="";
  try {
    const [{data:entry,error:entryError},{data:lines,error:lineError}]=await Promise.all([
      supabaseClient.from("journal_entries").select("id,nomor_jurnal,tanggal,keterangan,status").eq("id",journalId).single(),
      supabaseClient.from("journal_lines").select("account_id,keterangan,debit,kredit").eq("journal_id",journalId)
    ]);
    if(entryError)throw entryError;
    if(lineError)throw lineError;
    const accountIds=[...new Set((lines||[]).map(line=>line.account_id).filter(Boolean))];
    let accounts=[];
    if(accountIds.length) {
      const {data,error}=await supabaseClient.from("accounts").select("id,kode_akun,nama_akun").in("id",accountIds);
      if(error)throw error;
      accounts=data||[];
    }
    const accountMap=new Map(accounts.map(account=>[account.id,account]));
    const totalDebit=(lines||[]).reduce((sum,line)=>sum+Number(line.debit||0),0);
    const totalCredit=(lines||[]).reduce((sum,line)=>sum+Number(line.kredit||0),0);
    const rows=(lines||[]).map(line=>{
      const account=accountMap.get(line.account_id);
      const name=account?`${account.kode_akun} - ${account.nama_akun}`:"Akun tidak ditemukan";
      return `<tr><td>${escapeHTML(name)}</td><td>${escapeHTML(line.keterangan||"-")}</td><td style="text-align:right">${formatRupiah(line.debit)}</td><td style="text-align:right">${formatRupiah(line.kredit)}</td></tr>`;
    }).join("");
    document.getElementById("journalDetailTitle").textContent="Detail Jurnal "+(entry.nomor_jurnal||"");
    message.textContent="Rincian jurnal berhasil dimuat.";
    content.innerHTML=`
      <div class="journal-detail-meta">
        <div><small>Nomor Jurnal</small><strong>${escapeHTML(entry.nomor_jurnal||"-")}</strong></div>
        <div><small>Tanggal</small><strong>${escapeHTML(entry.tanggal||"-")}</strong></div>
        <div><small>Keterangan</small><strong>${escapeHTML(entry.keterangan||"-")}</strong></div>
        <div><small>Status</small><strong>${escapeHTML(entry.status||"-")}</strong></div>
      </div>
      <div class="erp-table-wrap"><table class="erp-table" style="min-width:620px">
        <thead><tr><th>Akun</th><th>Keterangan Baris</th><th style="text-align:right">Debit</th><th style="text-align:right">Kredit</th></tr></thead>
        <tbody>${rows||'<tr><td colspan="4">Belum ada rincian jurnal.</td></tr>'}</tbody>
      </table></div>
      <div class="journal-detail-total"><span>Total Debit: ${formatRupiah(totalDebit)}</span><span>Total Kredit: ${formatRupiah(totalCredit)}</span></div>`;
  } catch(error) {
    console.error("Detail jurnal error:",error);
    message.textContent="Gagal memuat detail jurnal: "+(error.message||"Kesalahan tidak diketahui");
    content.innerHTML='<div class="erp-message erp-error">Rincian jurnal tidak dapat ditampilkan.</div>';
  }
}
window.openJournalDetail=openJournalDetail;

// ==========================================
// BUKU BESAR
// ==========================================
function setupLedger() {
  const page=document.getElementById("modulePage");
  if(!page||document.getElementById("ledgerContent"))return;
  const section=document.createElement("section");section.id="ledgerContent";section.className="erp-content";
  section.innerHTML=`
    <div class="ledger-filter">
      <div class="erp-field"><label>Pilih Akun</label><select id="ledgerAccount"><option value="">Memuat akun...</option></select></div>
      <div class="erp-field"><label>Dari Tanggal</label><input type="date" id="ledgerStart"></div>
      <div class="erp-field"><label>Sampai Tanggal</label><input type="date" id="ledgerEnd"></div>
      <button class="erp-button" id="ledgerSearchButton">Tampilkan</button>
    </div>
    <div id="ledgerMessage" class="erp-message erp-muted">Pilih akun dan rentang tanggal untuk melihat buku besar.</div>
    <div class="ledger-summary">
      <div class="ledger-card"><small>Saldo Awal</small><strong id="ledgerOpening">Rp0</strong></div>
      <div class="ledger-card"><small>Total Debit</small><strong id="ledgerDebit">Rp0</strong></div>
      <div class="ledger-card"><small>Total Kredit</small><strong id="ledgerCredit">Rp0</strong></div>
      <div class="ledger-card"><small>Saldo Akhir</small><strong id="ledgerClosing">Rp0</strong></div>
    </div>
    <div class="ledger-opening" id="ledgerAccountInfo">Pilih akun untuk melihat rincian mutasinya.</div>
    <div class="erp-table-wrap ledger-table-wrap"><table class="erp-table ledger-table">
      <thead><tr><th>Tanggal</th><th>Nomor Jurnal</th><th>Keterangan</th><th>Debit</th><th>Kredit</th><th>Saldo Berjalan</th><th>Aksi</th></tr></thead>
      <tbody id="ledgerTableBody"><tr><td colspan="6">Belum ada data yang ditampilkan.</td></tr></tbody>
    </table></div>`;
  page.appendChild(section);
  document.getElementById("ledgerStart").value=firstDayOfMonth();
  document.getElementById("ledgerEnd").value=todayDate();
  document.getElementById("ledgerSearchButton").addEventListener("click",loadLedger);
  loadLedgerAccounts();
}

async function loadLedgerAccounts() {
  const select=document.getElementById("ledgerAccount");if(!select)return;
  select.innerHTML='<option value="">Memuat akun...</option>';
  const {data,error}=await supabaseClient.from("accounts").select("id,kode_akun,nama_akun,kategori,saldo_normal,aktif").order("kode_akun");
  if(error){select.innerHTML='<option value="">Gagal memuat akun</option>';document.getElementById("ledgerMessage").textContent=error.message;return;}
  coaCache=data||[];
  const active=coaCache.filter(a=>a.aktif);
  select.innerHTML='<option value="">Pilih akun...</option>'+active.map(a=>`<option value="${escapeHTML(a.id)}">${escapeHTML(a.kode_akun)} - ${escapeHTML(a.nama_akun)}</option>`).join("");
  const cash=active.find(a=>a.kode_akun==="1101")||active[0];
  if(cash){select.value=cash.id;await loadLedger();}
}

function signedLedgerAmount(debit,credit,normal) {
  return normal==="kredit" ? credit-debit : debit-credit;
}
function displayLedgerBalance(amount,normal) {
  const abnormal=amount<0;
  return (abnormal?"(Saldo abnormal) ":"")+formatRupiah(Math.abs(amount));
}

async function loadLedger() {
  const select=document.getElementById("ledgerAccount"),body=document.getElementById("ledgerTableBody");
  if(!select||!body)return;
  const account=coaCache.find(a=>a.id===select.value);
  const start=document.getElementById("ledgerStart").value,end=document.getElementById("ledgerEnd").value;
  const message=document.getElementById("ledgerMessage"),button=document.getElementById("ledgerSearchButton");
  if(!account){message.textContent="Pilih akun terlebih dahulu.";message.className="erp-message erp-error";return;}
  if(!start||!end||start>end){message.textContent="Periksa rentang tanggal. Tanggal awal tidak boleh melewati tanggal akhir.";message.className="erp-message erp-error";return;}
  button.disabled=true;button.textContent="Memuat...";
  message.textContent="Mengambil mutasi jurnal yang sudah diposting...";message.className="erp-message erp-muted";
  body.innerHTML='<tr><td colspan="7">Memuat mutasi...</td></tr>';
  try {
    const allLines=[];let from=0;const pageSize=500;
    while(true) {
      const {data,error}=await supabaseClient.from("journal_lines")
        .select("account_id,journal_id,debit,kredit,journal_entries!inner(tanggal,nomor_jurnal,keterangan,status,created_at)")
        .eq("account_id",account.id).eq("journal_entries.status","posted")
        .lte("journal_entries.tanggal",end).range(from,from+pageSize-1);
      if(error)throw error;
      allLines.push(...(data||[]));
      if(!data||data.length<pageSize)break;
      from+=pageSize;
    }
    const movements=allLines.map(line=>{
      const j=line.journal_entries;
      return {journalId:line.journal_id,date:j.tanggal,createdAt:j.created_at||"",number:j.nomor_jurnal,description:j.keterangan,debit:Number(line.debit),credit:Number(line.kredit)};
    }).sort((a,b)=>{
      const dateCompare=String(a.date).localeCompare(String(b.date));
      if(dateCompare!==0)return dateCompare;
      const timeCompare=String(a.createdAt).localeCompare(String(b.createdAt));
      if(timeCompare!==0)return timeCompare;
      return String(a.number).localeCompare(String(b.number));
    });
    const openingLines=movements.filter(m=>m.date<start);
    const periodLines=movements.filter(m=>m.date>=start&&m.date<=end);
    const openingNet=openingLines.reduce((s,m)=>s+signedLedgerAmount(m.debit,m.credit,account.saldo_normal),0);
    const totalDebit=periodLines.reduce((s,m)=>s+m.debit,0);
    const totalCredit=periodLines.reduce((s,m)=>s+m.credit,0);
    let running=openingNet;
    document.getElementById("ledgerOpening").textContent=displayLedgerBalance(openingNet,account.saldo_normal);
    document.getElementById("ledgerDebit").textContent=formatRupiah(totalDebit);
    document.getElementById("ledgerCredit").textContent=formatRupiah(totalCredit);
    document.getElementById("ledgerAccountInfo").textContent=`${account.kode_akun} - ${account.nama_akun} | ${capitalize(account.kategori)} | Saldo normal ${capitalize(account.saldo_normal)} | Periode ${start} s.d. ${end}`;
    body.replaceChildren();
    if(!periodLines.length) body.innerHTML='<tr><td colspan="7">Tidak ada mutasi pada periode ini.</td></tr>';
    else {
      // Hitung saldo berjalan secara kronologis (tertua ke terbaru),
      // simpan saldo setiap transaksi, lalu tampilkan terbaru di bagian atas.
      const balanceAfterMovement=new Map();
      periodLines.forEach(m=>{
        running+=signedLedgerAmount(m.debit,m.credit,account.saldo_normal);
        balanceAfterMovement.set(m.journalId,running);
      });

      [...periodLines].reverse().forEach(m=>{
      const balanceAfter=balanceAfterMovement.get(m.journalId);
      const row=document.createElement("tr");
      row.className="ledger-clickable-row";
      row.title="Klik untuk membuka detail jurnal";
      row.tabIndex=0;
      row.setAttribute("role","button");
      row.setAttribute("aria-label","Buka detail jurnal "+(m.number||""));
      row.addEventListener("click",event=>{
        if(event.target.closest("button"))return;
        openJournalDetail(m.journalId);
      });
      row.addEventListener("keydown",event=>{
        if(event.key==="Enter"||event.key===" "){
          event.preventDefault();
          openJournalDetail(m.journalId);
        }
      });
      [m.date,m.number,m.description,formatRupiah(m.debit),formatRupiah(m.credit),displayLedgerBalance(balanceAfter,account.saldo_normal)].forEach(value=>{
        const cell=document.createElement("td");cell.textContent=value;row.appendChild(cell);
      });
      const actionCell=document.createElement("td");
      const detailButton=document.createElement("button");
      detailButton.type="button";
      detailButton.className="journal-detail-button";
      detailButton.textContent="Lihat";
      detailButton.addEventListener("click",()=>openJournalDetail(m.journalId));
      actionCell.appendChild(detailButton);
      row.appendChild(actionCell);
      body.appendChild(row);
      });
    }
    document.getElementById("ledgerClosing").textContent=displayLedgerBalance(running,account.saldo_normal);
    message.textContent=`Buku Besar berhasil dimuat. ${periodLines.length} mutasi ditemukan.`;
    message.className="erp-message erp-success";
  } catch(error) {
    body.innerHTML=`<tr><td colspan="7">${escapeHTML(error.message||"Gagal memuat Buku Besar.")}</td></tr>`;
    message.textContent="Gagal memuat Buku Besar: "+(error.message||"Kesalahan tidak diketahui");
    message.className="erp-message erp-error";
  } finally {
    button.disabled=false;button.textContent="Tampilkan";
  }
}

// ==========================================
// LAPORAN LABA RUGI
// ==========================================

function setupReports() {
  const page=document.getElementById("modulePage");
  if(!page||document.getElementById("reportContent"))return;

  const section=document.createElement("section");
  section.id="reportContent";
  section.className="erp-content";

  section.innerHTML=`
    <div class="report-filter">
      <div class="erp-field">
        <label>Dari Tanggal</label>
        <input type="date" id="reportStart">
      </div>
      <div class="erp-field">
        <label>Sampai Tanggal</label>
        <input type="date" id="reportEnd">
      </div>
      <button class="erp-button" id="reportSearchButton">Tampilkan Laporan</button>
    </div>

    <div id="reportMessage" class="erp-message erp-muted">
      Pilih periode untuk melihat laporan laba rugi.
    </div>

    <div class="report-summary">
      <div class="report-card">
        <small>Total Pendapatan</small>
        <strong id="reportIncome">Rp0</strong>
      </div>
      <div class="report-card">
        <small>Total Beban</small>
        <strong id="reportExpense">Rp0</strong>
      </div>
      <div class="report-card profit" id="reportProfitCard">
        <small id="reportProfitLabel">Surplus / Defisit</small>
        <strong id="reportProfit">Rp0</strong>
      </div>
    </div>

    <h3 class="report-section-title">Rincian Pendapatan</h3>
    <div class="erp-table-wrap">
      <table class="erp-table">
        <thead>
          <tr><th>Kode Akun</th><th>Nama Akun</th><th>Jumlah Pendapatan</th></tr>
        </thead>
        <tbody id="reportIncomeBody">
          <tr><td colspan="3">Belum ada data.</td></tr>
        </tbody>
        <tfoot id="reportIncomeFoot"></tfoot>
      </table>
    </div>

    <h3 class="report-section-title">Rincian Beban</h3>
    <div class="erp-table-wrap">
      <table class="erp-table">
        <thead>
          <tr><th>Kode Akun</th><th>Nama Akun</th><th>Jumlah Beban</th></tr>
        </thead>
        <tbody id="reportExpenseBody">
          <tr><td colspan="3">Belum ada data.</td></tr>
        </tbody>
        <tfoot id="reportExpenseFoot"></tfoot>
      </table>
    </div>

    <div class="financial-note" style="margin-top:18px">
      Laporan laba rugi dihitung dari jurnal berstatus Posted. Nilai surplus atau defisit merupakan hasil periode sebelum pembagian SHU dan alokasi sesuai ketentuan koperasi.
    </div>

    <h3 class="report-section-title" style="margin-top:32px">Neraca</h3>
    <div class="financial-note">Neraca menampilkan saldo akun sampai tanggal akhir yang dipilih, berdasarkan jurnal berstatus Posted.</div>
    <div id="balanceSheetMessage" class="erp-message erp-muted">Neraca akan dimuat bersama laporan laba rugi.</div>
    <div class="report-summary">
      <div class="report-card"><small>Total Aset</small><strong id="balanceTotalAssets">Rp0</strong></div>
      <div class="report-card"><small>Total Kewajiban</small><strong id="balanceTotalLiabilities">Rp0</strong></div>
      <div class="report-card"><small>Total Ekuitas + SHU Berjalan</small><strong id="balanceTotalEquity">Rp0</strong></div>
    </div>
    <div class="erp-table-wrap">
      <table class="erp-table">
        <thead><tr><th>Kode Akun</th><th>Nama Akun</th><th>Kelompok</th><th>Saldo</th></tr></thead>
        <tbody id="balanceSheetBody"><tr><td colspan="4">Belum ada data.</td></tr></tbody>
        <tfoot id="balanceSheetFoot"></tfoot>
      </table>
    </div>
    <div id="balanceSheetCheck" class="financial-note" style="margin-top:14px;font-weight:bold"></div>

    <h3 class="report-section-title" style="margin-top:32px">Laporan Arus Kas</h3>
    <div class="financial-note">Arus kas dihitung dari perubahan akun Kas dan Bank (akun 1101 dan 1102 atau nama akun yang mengandung Kas/Bank) pada jurnal berstatus Posted.</div>
    <div id="cashFlowMessage" class="erp-message erp-muted">Arus kas akan dimuat bersama laporan keuangan.</div>
    <div class="report-summary">
      <div class="report-card"><small>Saldo Kas Awal</small><strong id="cashFlowOpening">Rp0</strong></div>
      <div class="report-card"><small>Kas Bersih Periode</small><strong id="cashFlowNet">Rp0</strong></div>
      <div class="report-card profit"><small>Saldo Kas Akhir</small><strong id="cashFlowClosing">Rp0</strong></div>
    </div>
    <div class="erp-table-wrap">
      <table class="erp-table">
        <thead><tr><th>Aktivitas</th><th>Penerimaan</th><th>Pengeluaran</th><th>Arus Bersih</th></tr></thead>
        <tbody id="cashFlowBody"><tr><td colspan="4">Belum ada data.</td></tr></tbody>
        <tfoot id="cashFlowFoot"></tfoot>
      </table>
    </div>
    <div class="financial-note" style="margin-top:12px">Catatan: pengelompokan aktivitas menggunakan akun lawan dalam jurnal. Akun aset tetap (kode 12xx) diklasifikasikan sebagai investasi; kewajiban dan ekuitas sebagai pendanaan; akun lainnya sebagai operasional. Transfer antar Kas/Bank tidak dihitung sebagai arus kas bersih.</div>
  `;

  page.appendChild(section);

  document.getElementById("reportStart").value=firstDayOfMonth();
  document.getElementById("reportEnd").value=todayDate();

  document.getElementById("reportSearchButton").addEventListener("click",async()=>{
    await loadIncomeStatement();
    await loadBalanceSheet();
    await loadCashFlow();
  });
}

async function loadBalanceSheet() {
  const end=document.getElementById("reportEnd")?.value;
  const message=document.getElementById("balanceSheetMessage");
  const body=document.getElementById("balanceSheetBody");
  const foot=document.getElementById("balanceSheetFoot");
  const check=document.getElementById("balanceSheetCheck");
  if(!end||!message||!body)return;
  message.textContent="Menghitung saldo Neraca...";
  message.className="erp-message erp-muted";
  body.innerHTML='<tr><td colspan="4">Memuat saldo akun...</td></tr>';
  check.textContent="";
  try {
    const {data:accounts,error:accountError}=await supabaseClient
      .from("accounts")
      .select("id,kode_akun,nama_akun,kategori,saldo_normal");
    if(accountError)throw accountError;
    coaCache=accounts||[];

    const allLines=[];
    let from=0;
    const pageSize=500;
    while(true) {
      const {data,error}=await supabaseClient
        .from("journal_lines")
        .select("account_id,debit,kredit,journal_entries!inner(tanggal,status)")
        .eq("journal_entries.status","posted")
        .lte("journal_entries.tanggal",end)
        .range(from,from+pageSize-1);
      if(error)throw error;
      allLines.push(...(data||[]));
      if(!data||data.length<pageSize)break;
      from+=pageSize;
    }

    const totals=new Map((accounts||[]).map(account=>[account.id,0]));
    allLines.forEach(line=>{
      if(!totals.has(line.account_id))return;
      const account=(accounts||[]).find(item=>item.id===line.account_id);
      if(!account)return;
      const debit=Number(line.debit||0),credit=Number(line.kredit||0);
      const balance=String(account.saldo_normal||"").toLowerCase()==="kredit" ? credit-debit : debit-credit;
      totals.set(account.id,totals.get(account.id)+balance);
    });

    const rows=(accounts||[]).map(account=>({...account,saldo:totals.get(account.id)||0}));
    const assets=rows.filter(a=>a.kategori==="aset");
    const liabilities=rows.filter(a=>a.kategori==="kewajiban");
    const equity=rows.filter(a=>a.kategori==="ekuitas");
    const income=rows.filter(a=>a.kategori==="pendapatan");
    const expenses=rows.filter(a=>a.kategori==="beban");
    const sum=list=>list.reduce((total,a)=>total+a.saldo,0);
    const totalAssets=sum(assets);
    const totalLiabilities=sum(liabilities);
    const totalEquity=sum(equity);
    const currentSurplus=sum(income)-sum(expenses);
    const equityWithSurplus=totalEquity+currentSurplus;
    const difference=totalAssets-(totalLiabilities+equityWithSurplus);

    document.getElementById("balanceTotalAssets").textContent=formatRupiah(totalAssets);
    document.getElementById("balanceTotalLiabilities").textContent=formatRupiah(totalLiabilities);
    document.getElementById("balanceTotalEquity").textContent=formatRupiah(equityWithSurplus);
    body.replaceChildren();
    const groups=[
      {label:"ASET",items:assets,total:totalAssets},
      {label:"KEWAJIBAN",items:liabilities,total:totalLiabilities},
      {label:"EKUITAS",items:equity,total:totalEquity}
    ];
    groups.forEach(group=>{
      const heading=document.createElement("tr");
      const headingCell=document.createElement("td");headingCell.colSpan=4;headingCell.textContent=group.label;headingCell.style.fontWeight="bold";heading.appendChild(headingCell);body.appendChild(heading);
      group.items.forEach(account=>{
        const row=document.createElement("tr");
        row.className="balance-account-clickable";
        row.tabIndex=0;
        row.setAttribute("role","button");
        row.title="Klik untuk melihat rincian buku besar akun ini";
        row.setAttribute("aria-label",`Lihat rincian akun ${account.kode_akun} ${account.nama_akun}`);
        row.addEventListener("click",()=>openBalanceAccountDetail(account.id,end));
        row.addEventListener("keydown",event=>{
          if(event.key==="Enter"||event.key===" "){
            event.preventDefault();
            openBalanceAccountDetail(account.id,end);
          }
        });
        [account.kode_akun,account.nama_akun,group.label,formatRupiah(account.saldo)].forEach(value=>{const cell=document.createElement("td");cell.textContent=value;row.appendChild(cell);});
        body.appendChild(row);
      });
      const totalRow=document.createElement("tr");totalRow.className="report-total-row";
      ["","TOTAL "+group.label,"",formatRupiah(group.total)].forEach(value=>{const cell=document.createElement("td");cell.textContent=value;totalRow.appendChild(cell);});
      body.appendChild(totalRow);
    });
    const surplusRow=document.createElement("tr");surplusRow.className="report-total-row";
    ["","Surplus / Defisit Berjalan","",formatRupiah(currentSurplus)].forEach(value=>{const cell=document.createElement("td");cell.textContent=value;surplusRow.appendChild(cell);});
    body.appendChild(surplusRow);
    foot.innerHTML=`<tr class="report-total-row"><td colspan="3">TOTAL KEWAJIBAN + EKUITAS + SHU BERJALAN</td><td>${formatRupiah(totalLiabilities+equityWithSurplus)}</td></tr>`;
    check.textContent=Math.abs(difference)<0.01 ? "NERACA SEIMBANG — Selisih Rp0" : "NERACA BELUM SEIMBANG — Selisih: "+formatRupiah(difference);
    check.style.color=Math.abs(difference)<0.01 ? "#15803d" : "#b91c1c";
    message.textContent="Neraca berhasil dimuat sampai tanggal "+end+".";
    message.className="erp-message erp-success";
  } catch(error) {
    console.error("Neraca error:",error);
    body.innerHTML='<tr><td colspan="4">Gagal mengambil data Neraca.</td></tr>';
    message.textContent="Gagal memuat Neraca: "+(error.message||"Kesalahan tidak diketahui");
    message.className="erp-message erp-error";
  }
}

async function openBalanceAccountDetail(accountId,endDate) {
  const account=(coaCache||[]).find(item=>item.id===accountId);
  let overlay=document.getElementById("balanceAccountDetailOverlay");
  if(!overlay) {
    overlay=document.createElement("div");
    overlay.id="balanceAccountDetailOverlay";
    overlay.className="balance-detail-overlay";
    overlay.innerHTML=`
      <div class="balance-detail-dialog" role="dialog" aria-modal="true" aria-labelledby="balanceAccountDetailTitle">
        <div class="balance-detail-head">
          <div>
            <h3 id="balanceAccountDetailTitle" style="margin:0 0 5px">Rincian Akun Neraca</h3>
            <div class="erp-muted" id="balanceAccountDetailMessage">Memuat rincian...</div>
          </div>
          <button type="button" class="balance-detail-close" id="balanceAccountDetailClose">Tutup ✕</button>
        </div>
        <div class="balance-detail-summary">
          <div><small>Total Debit</small><strong id="balanceDetailDebit">Rp0</strong></div>
          <div><small>Total Kredit</small><strong id="balanceDetailCredit">Rp0</strong></div>
          <div><small>Saldo Akhir</small><strong id="balanceDetailClosing">Rp0</strong></div>
        </div>
        <div class="erp-table-wrap">
          <table class="erp-table" style="min-width:850px">
            <thead><tr><th>Tanggal</th><th>Nomor Jurnal</th><th>Keterangan</th><th>Debit</th><th>Kredit</th><th>Saldo Berjalan</th><th>Aksi</th></tr></thead>
            <tbody id="balanceAccountDetailBody"><tr><td colspan="7">Memuat...</td></tr></tbody>
          </table>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener("click",event=>{
      if(event.target===overlay) overlay.style.display="none";
    });
    overlay.querySelector("#balanceAccountDetailClose").addEventListener("click",()=>overlay.style.display="none");
  }
  overlay.style.display="flex";
  const message=document.getElementById("balanceAccountDetailMessage");
  const body=document.getElementById("balanceAccountDetailBody");
  const debitEl=document.getElementById("balanceDetailDebit");
  const creditEl=document.getElementById("balanceDetailCredit");
  const closingEl=document.getElementById("balanceDetailClosing");
  if(!account) {
    message.textContent="Akun tidak ditemukan pada daftar akun.";
    body.innerHTML='<tr><td colspan="7">Akun tidak ditemukan.</td></tr>';
    return;
  }
  document.getElementById("balanceAccountDetailTitle").textContent=`Rincian ${account.kode_akun} - ${account.nama_akun}`;
  message.textContent="Mengambil seluruh mutasi jurnal Posted sampai tanggal "+endDate+"...";
  body.innerHTML='<tr><td colspan="7">Memuat mutasi akun...</td></tr>';
  debitEl.textContent="Memuat...";
  creditEl.textContent="Memuat...";
  closingEl.textContent="Memuat...";
  try {
    const allLines=[];
    let from=0;
    const pageSize=500;
    while(true) {
      const {data,error}=await supabaseClient.from("journal_lines")
        .select("account_id,journal_id,debit,kredit,journal_entries!inner(tanggal,nomor_jurnal,keterangan,status)")
        .eq("account_id",accountId)
        .eq("journal_entries.status","posted")
        .lte("journal_entries.tanggal",endDate)
        .range(from,from+pageSize-1);
      if(error) throw error;
      allLines.push(...(data||[]));
      if(!data||data.length<pageSize) break;
      from+=pageSize;
    }
    const movements=allLines.map(line=>({
      journalId:line.journal_id,
      date:line.journal_entries?.tanggal||"",
      number:line.journal_entries?.nomor_jurnal||"-",
      description:line.journal_entries?.keterangan||"-",
      debit:Number(line.debit||0),
      credit:Number(line.kredit||0)
    })).sort((a,b)=>a.date.localeCompare(b.date)||a.number.localeCompare(b.number));
    const normal=String(account.saldo_normal||"debit").toLowerCase();
    const signed=(m)=>normal==="kredit"?m.credit-m.debit:m.debit-m.credit;
    const totalDebit=movements.reduce((sum,m)=>sum+m.debit,0);
    const totalCredit=movements.reduce((sum,m)=>sum+m.credit,0);
    let running=0;
    body.replaceChildren();
    if(!movements.length) {
      body.innerHTML='<tr><td colspan="7">Belum ada mutasi jurnal Posted untuk akun ini.</td></tr>';
    } else {
      movements.forEach(m=>{
        running+=signed(m);
        const row=document.createElement("tr");
        [m.date,m.number,m.description,formatRupiah(m.debit),formatRupiah(m.credit),(running<0?"(Saldo abnormal) ":"")+formatRupiah(Math.abs(running))].forEach(value=>{
          const cell=document.createElement("td");
          cell.textContent=value;
          row.appendChild(cell);
        });
        const actionCell=document.createElement("td");
        const button=document.createElement("button");
        button.type="button";
        button.className="journal-detail-button";
        button.textContent="Lihat Jurnal";
        button.disabled=!m.journalId;
        button.addEventListener("click",()=>openJournalDetail(m.journalId));
        actionCell.appendChild(button);
        row.appendChild(actionCell);
        body.appendChild(row);
      });
    }
    debitEl.textContent=formatRupiah(totalDebit);
    creditEl.textContent=formatRupiah(totalCredit);
    closingEl.textContent=(running<0?"(Saldo abnormal) ":"")+formatRupiah(Math.abs(running));
    message.textContent=`${movements.length} mutasi ditemukan sampai ${endDate}. Klik "Lihat Jurnal" untuk membuka rincian debit dan kredit.`;
  } catch(error) {
    console.error("Rincian akun Neraca error:",error);
    body.innerHTML=`<tr><td colspan="7">${escapeHTML(error.message||"Gagal memuat rincian akun.")}</td></tr>`;
    message.textContent="Gagal memuat rincian akun: "+(error.message||"Kesalahan tidak diketahui");
    debitEl.textContent="-";
    creditEl.textContent="-";
    closingEl.textContent="-";
  }
}

async function loadCashFlow() {
  const start=document.getElementById("reportStart")?.value;
  const end=document.getElementById("reportEnd")?.value;
  const message=document.getElementById("cashFlowMessage");
  const body=document.getElementById("cashFlowBody");
  const foot=document.getElementById("cashFlowFoot");
  if(!message||!body||!foot)return;
  if(!start||!end||start>end){
    message.textContent="Periksa tanggal laporan Arus Kas.";
    message.className="erp-message erp-error";
    return;
  }
  message.textContent="Menghitung arus kas dari jurnal Posted...";
  message.className="erp-message erp-muted";
  body.innerHTML='<tr><td colspan="4">Memuat data...</td></tr>';
  try {
    const {data:accounts,error:accountError}=await supabaseClient
      .from("accounts")
      .select("id,kode_akun,nama_akun,kategori,saldo_normal");
    if(accountError)throw accountError;
    const accountMap=new Map((accounts||[]).map(a=>[a.id,a]));
    const cashAccounts=(accounts||[]).filter(a=>
      a.kategori==="aset" && (/^(1101|1102)$/.test(String(a.kode_akun||"")) || /(kas|bank)/i.test(String(a.nama_akun||"")))
    );
    const cashIds=new Set(cashAccounts.map(a=>a.id));
    if(!cashIds.size)throw new Error("Akun Kas/Bank tidak ditemukan. Periksa akun 1101 dan 1102.");

    const allLines=[];
    let from=0;
    const pageSize=500;
    while(true){
      const {data,error}=await supabaseClient
        .from("journal_lines")
        .select("account_id,journal_id,debit,kredit,journal_entries!inner(tanggal,status)")
        .eq("journal_entries.status","posted")
        .lte("journal_entries.tanggal",end)
        .range(from,from+pageSize-1);
      if(error)throw error;
      allLines.push(...(data||[]));
      if(!data||data.length<pageSize)break;
      from+=pageSize;
    }

    const journals=new Map();
    allLines.forEach(line=>{
      const journalId=line.journal_id;
      if(!journalId)return;
      const date=line.journal_entries?.tanggal;
      if(!date)return;
      if(!journals.has(journalId))journals.set(journalId,{date,lines:[]});
      journals.get(journalId).lines.push(line);
    });

    let opening=0;
    const buckets={
      operasional:{label:"Operasional",inflow:0,outflow:0},
      investasi:{label:"Investasi",inflow:0,outflow:0},
      pendanaan:{label:"Pendanaan",inflow:0,outflow:0}
    };
    journals.forEach(journal=>{
      let cashDelta=0;
      const counterparts=[];
      journal.lines.forEach(line=>{
        const debit=Number(line.debit||0),credit=Number(line.kredit||0);
        if(cashIds.has(line.account_id))cashDelta+=debit-credit;
        else {
          const account=accountMap.get(line.account_id);
          if(account)counterparts.push({account,amount:Math.abs(debit-credit)});
        }
      });
      if(journal.date<start){opening+=cashDelta;return;}
      if(journal.date>end||Math.abs(cashDelta)<0.005)return;
      // Pick the strongest non-cash counterpart to classify the journal.
      counterparts.sort((a,b)=>b.amount-a.amount);
      const counterpart=counterparts[0]?.account;
      let type="operasional";
      if(counterpart){
        const code=String(counterpart.kode_akun||"");
        const category=String(counterpart.kategori||"").toLowerCase();
        if(/^12/.test(code))type="investasi";
        else if(category==="kewajiban"||category==="ekuitas")type="pendanaan";
      }
      if(cashDelta>0) buckets[type].inflow+=cashDelta;
      else buckets[type].outflow+=Math.abs(cashDelta);
    });

    const totalIn=Object.values(buckets).reduce((n,b)=>n+b.inflow,0);
    const totalOut=Object.values(buckets).reduce((n,b)=>n+b.outflow,0);
    const net=totalIn-totalOut;
    const closing=opening+net;
    document.getElementById("cashFlowOpening").textContent=formatRupiah(opening);
    document.getElementById("cashFlowNet").textContent=formatRupiah(net);
    document.getElementById("cashFlowClosing").textContent=formatRupiah(closing);
    body.replaceChildren();
    Object.values(buckets).forEach(bucket=>{
      const row=document.createElement("tr");
      [bucket.label,formatRupiah(bucket.inflow),formatRupiah(bucket.outflow),formatRupiah(bucket.inflow-bucket.outflow)].forEach(value=>{
        const cell=document.createElement("td");cell.textContent=value;row.appendChild(cell);
      });
      body.appendChild(row);
    });
    foot.innerHTML=`<tr class="report-total-row"><td>TOTAL ARUS KAS</td><td>${formatRupiah(totalIn)}</td><td>${formatRupiah(totalOut)}</td><td>${formatRupiah(net)}</td></tr>`;
    message.textContent=`Arus Kas berhasil dimuat untuk periode ${start} sampai ${end}.`;
    message.className="erp-message erp-success";
  } catch(error){
    console.error("Laporan Arus Kas error:",error);
    body.innerHTML='<tr><td colspan="4">Gagal mengambil data Arus Kas.</td></tr>';
    message.textContent="Gagal memuat Arus Kas: "+(error.message||"Kesalahan tidak diketahui");
    message.className="erp-message erp-error";
  }
}

async function loadIncomeStatement() {
  const start=document.getElementById("reportStart")?.value;
  const end=document.getElementById("reportEnd")?.value;
  const button=document.getElementById("reportSearchButton");
  const message=document.getElementById("reportMessage");
  const incomeBody=document.getElementById("reportIncomeBody");
  const expenseBody=document.getElementById("reportExpenseBody");

  if(!start||!end||start>end) {
    message.textContent="Periksa tanggal laporan. Tanggal awal tidak boleh melewati tanggal akhir.";
    message.className="erp-message erp-error";
    return;
  }

  button.disabled=true;
  button.textContent="Memuat...";
  message.textContent="Mengambil data jurnal yang sudah diposting...";
  message.className="erp-message erp-muted";

  incomeBody.innerHTML='<tr><td colspan="3">Memuat data...</td></tr>';
  expenseBody.innerHTML='<tr><td colspan="3">Memuat data...</td></tr>';

  try {
    const {data:accounts,error:accountError}=await supabaseClient
      .from("accounts")
      .select("id,kode_akun,nama_akun,kategori,saldo_normal,aktif")
      .in("kategori",["pendapatan","beban"])
      .eq("aktif",true)
      .order("kode_akun");

    if(accountError)throw accountError;

    const allLines=[];
    let from=0;
    const pageSize=500;

    while(true) {
      const {data,error}=await supabaseClient
        .from("journal_lines")
        .select("account_id,debit,kredit,journal_entries!inner(tanggal,status)")
        .eq("journal_entries.status","posted")
        .gte("journal_entries.tanggal",start)
        .lte("journal_entries.tanggal",end)
        .range(from,from+pageSize-1);

      if(error)throw error;

      allLines.push(...(data||[]));

      if(!data||data.length<pageSize)break;
      from+=pageSize;
    }

    const totals=new Map();

    (accounts||[]).forEach(account=>{
      totals.set(account.id,0);
    });

    allLines.forEach(line=>{
      if(!totals.has(line.account_id))return;

      const account=(accounts||[]).find(a=>a.id===line.account_id);
      if(!account)return;

      let amount=0;

      if(account.kategori==="pendapatan") {
        amount=Number(line.kredit||0)-Number(line.debit||0);
      } else if(account.kategori==="beban") {
        amount=Number(line.debit||0)-Number(line.kredit||0);
      }

      totals.set(account.id,totals.get(account.id)+amount);
    });

    const incomeAccounts=(accounts||[])
      .filter(a=>a.kategori==="pendapatan")
      .map(a=>({...a,total:totals.get(a.id)||0}));

    const expenseAccounts=(accounts||[])
      .filter(a=>a.kategori==="beban")
      .map(a=>({...a,total:totals.get(a.id)||0}));

    const totalIncome=incomeAccounts.reduce((sum,a)=>sum+a.total,0);
    const totalExpense=expenseAccounts.reduce((sum,a)=>sum+a.total,0);
    const profit=totalIncome-totalExpense;

    document.getElementById("reportIncome").textContent=formatRupiah(totalIncome);
    document.getElementById("reportExpense").textContent=formatRupiah(totalExpense);
    document.getElementById("reportProfit").textContent=formatRupiah(Math.abs(profit));

    const profitCard=document.getElementById("reportProfitCard");
    const profitLabel=document.getElementById("reportProfitLabel");

    if(profit>=0) {
      profitCard.className="report-card profit";
      profitLabel.textContent="Surplus Periode";
    } else {
      profitCard.className="report-card loss";
      profitLabel.textContent="Defisit Periode";
    }

    incomeBody.replaceChildren();
    const incomeRows=incomeAccounts.filter(a=>a.total!==0);

    if(!incomeRows.length) {
      incomeBody.innerHTML='<tr><td colspan="3" class="report-empty">Belum ada pendapatan pada periode ini.</td></tr>';
    } else {
      incomeRows.forEach(account=>{
        const row=document.createElement("tr");
        [account.kode_akun,account.nama_akun,formatRupiah(account.total)].forEach(value=>{
          const cell=document.createElement("td");
          cell.textContent=value;
          row.appendChild(cell);
        });
        incomeBody.appendChild(row);
      });
    }

    document.getElementById("reportIncomeFoot").innerHTML=`
      <tr class="report-total-row">
        <td colspan="2">TOTAL PENDAPATAN</td>
        <td>${formatRupiah(totalIncome)}</td>
      </tr>`;

    expenseBody.replaceChildren();
    const expenseRows=expenseAccounts.filter(a=>a.total!==0);

    if(!expenseRows.length) {
      expenseBody.innerHTML='<tr><td colspan="3" class="report-empty">Belum ada beban pada periode ini.</td></tr>';
    } else {
      expenseRows.forEach(account=>{
        const row=document.createElement("tr");
        [account.kode_akun,account.nama_akun,formatRupiah(account.total)].forEach(value=>{
          const cell=document.createElement("td");
          cell.textContent=value;
          row.appendChild(cell);
        });
        expenseBody.appendChild(row);
      });
    }

    document.getElementById("reportExpenseFoot").innerHTML=`
      <tr class="report-total-row">
        <td colspan="2">TOTAL BEBAN</td>
        <td>${formatRupiah(totalExpense)}</td>
      </tr>`;

    message.textContent=`Laporan berhasil dimuat untuk periode ${start} sampai ${end}.`;
    message.className="erp-message erp-success";

  } catch(error) {
    console.error("Laporan laba rugi error:",error);
    incomeBody.innerHTML='<tr><td colspan="3">Gagal mengambil data laporan.</td></tr>';
    expenseBody.innerHTML='<tr><td colspan="3">Gagal mengambil data laporan.</td></tr>';
    message.textContent="Gagal memuat laporan: "+(error.message||"Kesalahan tidak diketahui");
    message.className="erp-message erp-error";
  } finally {
    button.disabled=false;
    button.textContent="Tampilkan Laporan";
  }
}

// ==========================================
// NAVIGASI
// ==========================================
function showPage(page,button) {
  document.querySelectorAll(".page").forEach(element=>element.style.display="none");
  const dashboard=document.getElementById("dashboard"),modulePage=document.getElementById("modulePage");

  if(page==="dashboard") {
    dashboard.style.display="block";
    document.getElementById("pageTitle").textContent="Dashboard";
    loadDashboard();
  } else if(modules[page]) {
    modulePage.style.display="block";
    const data=modules[page];
    document.getElementById("moduleIcon").textContent=data[0];
    document.getElementById("moduleName").textContent=data[1];
    document.getElementById("moduleDescription").textContent=data[2];
    document.getElementById("pageTitle").textContent=data[1];

    const visibility={
      keuangan:"financialContent",
      coa:"coaContent",
      jurnal:"journalContent",
      "buku-besar":"ledgerContent",
      laporan:"reportContent"
    };

    Object.entries(visibility).forEach(([key,id])=>{
      const element=document.getElementById(id);
      if(element)element.style.display=page===key?"block":"none";
    });

    if(page==="keuangan"){setupFinancial();loadFinancialHistory();}
    if(page==="coa")loadCOA();
    if(page==="jurnal"){setupJournal();loadJournalHistory();}
    if(page==="buku-besar"){setupLedger();if(document.getElementById("ledgerAccount")?.value)loadLedger();}
    if(page==="laporan"){setupReports();loadIncomeStatement();loadBalanceSheet();loadCashFlow();}
  }

  document.querySelectorAll(".menu button").forEach(element=>element.classList.remove("active"));
  if(button)button.classList.add("active");
  else document.querySelectorAll(".menu button").forEach(element=>{
    if(element.getAttribute("onclick")?.includes("'"+page+"'"))element.classList.add("active");
  });

  document.getElementById("sidebar").classList.remove("open");
  window.scrollTo(0,0);
}

function toggleSidebar(){document.getElementById("sidebar").classList.toggle("open");}
window.showPage=showPage;
window.toggleSidebar=toggleSidebar;
// =====================================
// MODUL REKONSILIASI BANK KDMP
// =====================================

async function setupBankReconciliation() {
  const client = window.daiboekSupabase;
  const modulePage = document.getElementById("modulePage");

  let content = document.getElementById("bankContent");

  if (!content) {
    content = document.createElement("div");
    content.id = "bankContent";
    content.className = "page";
    modulePage.appendChild(content);
  }

  content.style.display = "block";

  content.innerHTML = `
    <div class="erp-card">
      <h2>🏦 Rekonsiliasi Bank</h2>
      <p>Cocokkan saldo rekening bank dengan catatan jurnal KDMP.</p>

      <div class="form-grid">
        <div>
          <label>Akun Kas / Bank</label>
          <select id="bankAccount" class="erp-input">
            <option value="">Memuat akun...</option>
          </select>
        </div>

        <div>
          <label>Tanggal Awal</label>
          <input type="date" id="bankStart" class="erp-input">
        </div>

        <div>
          <label>Tanggal Akhir</label>
          <input type="date" id="bankEnd" class="erp-input">
        </div>

        <div>
          <label>Saldo Akhir Menurut Rekening Bank</label>
          <input type="number" id="bankStatementBalance"
            class="erp-input" placeholder="Contoh: 5000000">
        </div>
      </div>

      <button class="btn-primary" onclick="calculateBankReconciliation()">
        Hitung Rekonsiliasi
      </button>
    </div>

    <div id="bankResult"></div>

    <div class="erp-card">
      <h3>Tambah Mutasi Rekening</h3>

      <div class="form-grid">
        <div>
          <label>Tanggal</label>
          <input type="date" id="bankMutationDate" class="erp-input">
        </div>

        <div>
          <label>Jenis Mutasi</label>
          <select id="bankMutationType" class="erp-input">
            <option value="deposit">Setoran / Uang Masuk</option>
            <option value="withdrawal">Penarikan / Uang Keluar</option>
          </select>
        </div>

        <div>
          <label>Keterangan</label>
          <input id="bankMutationDescription" class="erp-input"
            placeholder="Contoh: Setoran tunai">
        </div>

        <div>
          <label>Nominal</label>
          <input type="number" id="bankMutationAmount"
            class="erp-input" placeholder="Masukkan nominal">
        </div>
      </div>

      <button class="btn-primary" onclick="saveBankMutation()">
        Simpan Mutasi
      </button>
    </div>

    <div class="erp-card">
      <h3>Riwayat Rekonsiliasi</h3>
      <div id="bankHistory">Memuat data...</div>
    </div>

    <div class="erp-card">
      <h3>Mutasi Rekening Periode Ini</h3>
      <div id="bankMutations">Pilih akun dan periode terlebih dahulu.</div>
    </div>
  `;

  document.getElementById("bankStart").value =
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString().slice(0, 10);

  document.getElementById("bankEnd").value =
    new Date().toISOString().slice(0, 10);

  document.getElementById("bankMutationDate").value =
    new Date().toISOString().slice(0, 10);

  const { data, error } = await client
    .from("accounts")
    .select("*")
    .order("kode_akun");

  if (error) {
    document.getElementById("bankAccount").innerHTML =
      `<option value="">Gagal memuat akun</option>`;
    console.error(error);
    return;
  }

  const accounts = (data || []).filter(account =>
    /kas|bank/i.test(
      String(account.nama_akun || account.name || "")
    )
  );

  document.getElementById("bankAccount").innerHTML =
    `<option value="">Pilih akun kas/bank</option>` +
    accounts.map(account => `
      <option value="${account.id}">
        ${escapeHTML(account.kode_akun || "")}
        - ${escapeHTML(account.nama_akun || account.name || "")}
      </option>
    `).join("");

  await loadBankReconciliations();
}

async function calculateBankReconciliation() {
  const client = window.daiboekSupabase;
  const accountId = document.getElementById("bankAccount").value;
  const start = document.getElementById("bankStart").value;
  const end = document.getElementById("bankEnd").value;
  const statementBalance = Number(
    document.getElementById("bankStatementBalance").value
  );

  const result = document.getElementById("bankResult");

  if (!accountId || !start || !end) {
    alert("Pilih akun dan periode rekonsiliasi terlebih dahulu.");
    return;
  }

  if (start > end) {
    alert("Tanggal awal tidak boleh melewati tanggal akhir.");
    return;
  }

  if (!Number.isFinite(statementBalance)) {
    alert("Masukkan saldo akhir rekening bank.");
    return;
  }

  result.innerHTML = "Menghitung saldo...";

  const { data, error } = await client
    .from("journal_lines")
    .select(`
      debit,
      kredit,
      journal_entries!inner (
        tanggal,
        nomor_jurnal,
        keterangan,
        status
      )
    `)
    .eq("account_id", accountId)
    .lte("journal_entries.tanggal", end);

  if (error) {
    result.innerHTML =
      `<p class="error">Gagal mengambil jurnal: ${escapeHTML(error.message)}</p>`;
    return;
  }

  const postedLines = (data || []).filter(line =>
    String(line.journal_entries?.status || "").toLowerCase() === "posted"
  );

  const bookBalance = postedLines.reduce((total, line) =>
    total + Number(line.debit || 0) - Number(line.kredit || 0), 0
  );

  const difference = statementBalance - bookBalance;

  const periodLines = postedLines.filter(line =>
    line.journal_entries.tanggal >= start &&
    line.journal_entries.tanggal <= end
  );

  const rupiah = value => formatRupiah(value);

  result.innerHTML = `
    <div class="erp-card">
      <h3>Hasil Rekonsiliasi</h3>

      <div class="financial-summary">
        <div class="summary-card">
          <span>Saldo Menurut Buku</span>
          <h3>${rupiah(bookBalance)}</h3>
        </div>

        <div class="summary-card">
          <span>Saldo Menurut Bank</span>
          <h3>${rupiah(statementBalance)}</h3>
        </div>

        <div class="summary-card">
          <span>Selisih</span>
          <h3>${rupiah(difference)}</h3>
        </div>
      </div>

      <p>
        ${Math.abs(difference) < 0.005
          ? "✅ Saldo buku dan rekening bank sudah seimbang."
          : "⚠️ Masih terdapat selisih antara saldo buku dan saldo bank."}
      </p>

      <h3>Jurnal Periode Ini</h3>

      <div class="table-responsive">
        <table class="erp-table">
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>No. Jurnal</th>
              <th>Keterangan</th>
              <th>Debit</th>
              <th>Kredit</th>
            </tr>
          </thead>
          <tbody>
            ${periodLines.map(line => `
              <tr>
                <td>${escapeHTML(line.journal_entries.tanggal || "")}</td>
                <td>${escapeHTML(line.journal_entries.nomor_jurnal || "")}</td>
                <td>${escapeHTML(line.journal_entries.keterangan || "")}</td>
                <td>${rupiah(line.debit)}</td>
                <td>${rupiah(line.kredit)}</td>
              </tr>
            `).join("") || `
              <tr><td colspan="5">Belum ada jurnal pada periode ini.</td></tr>
            `}
          </tbody>
        </table>
      </div>

      <button type="button" class="btn-primary" id="bankSaveReconciliationButton">
        Simpan Rekonsiliasi
      </button>
    </div>
  `;

  // Pasang event langsung setelah tombol dibuat agar selalu bisa diklik.
  const saveButton = document.getElementById("bankSaveReconciliationButton");
  if (saveButton) {
    saveButton.addEventListener("click", async function () {
      if (saveButton.disabled) return;
      saveButton.disabled = true;
      saveButton.textContent = "Menyimpan...";
      try {
        await saveBankReconciliation(
          accountId, start, end, statementBalance, bookBalance, difference
        );
      } catch (error) {
        console.error("Gagal menyimpan rekonsiliasi:", error);
        alert("Gagal menyimpan rekonsiliasi: " + (error.message || error));
      } finally {
        saveButton.disabled = false;
        saveButton.textContent = "Simpan Rekonsiliasi";
      }
    });
  }
}

async function saveBankMutation() {
  const client = window.daiboekSupabase;
  const accountId = document.getElementById("bankAccount").value;
  const date = document.getElementById("bankMutationDate").value;
  const type = document.getElementById("bankMutationType").value;
  const description = document.getElementById("bankMutationDescription").value;
  const amount = Number(document.getElementById("bankMutationAmount").value);

  if (!accountId || !date || !amount || amount <= 0) {
    alert("Lengkapi akun, tanggal, dan nominal mutasi.");
    return;
  }

  const { data: header, error: headerError } = await client
    .from("bank_reconciliations")
    .select("id")
    .eq("account_id", accountId)
    .eq("period_start", document.getElementById("bankStart").value)
    .eq("period_end", document.getElementById("bankEnd").value)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (headerError || !header) {
    alert("Buat dan simpan rekonsiliasi periode ini terlebih dahulu.");
    return;
  }

  const { error } = await client
    .from("bank_reconciliation_items")
    .insert({
      reconciliation_id: header.id,
      item_type: type,
      transaction_date: date,
      description,
      amount,
      matched: false
    });

  if (error) {
    alert("Gagal menyimpan mutasi: " + error.message);
    return;
  }

  alert("Mutasi rekening berhasil disimpan.");
  document.getElementById("bankMutationDescription").value = "";
  document.getElementById("bankMutationAmount").value = "";
  await loadBankMutations(header.id);
}

async function saveBankReconciliation(
  accountId, start, end, statementBalance, bookBalance, difference
) {
  const client = window.daiboekSupabase;
  if (!client) throw new Error("Koneksi database belum siap.");
  if (!accountId || !start || !end) throw new Error("Akun dan periode wajib dipilih.");
  if (![statementBalance, bookBalance, difference].every(Number.isFinite)) {
    throw new Error("Nominal rekonsiliasi tidak valid.");
  }

  const { data: userData, error: userError } = await client.auth.getUser();
  if (userError) throw userError;

  const { data, error } = await client
    .from("bank_reconciliations")
    .insert({
      account_id: accountId,
      period_start: start,
      period_end: end,
      statement_ending_balance: statementBalance,
      book_balance: bookBalance,
      difference,
      status: Math.abs(difference) < 0.005 ? "balanced" : "draft",
      created_by: userData.user?.id || null
    })
    .select("id")
    .single();

  if (error) throw error;
  if (!data?.id) throw new Error("Data tersimpan tetapi ID rekonsiliasi tidak diterima.");

  alert("Rekonsiliasi berhasil disimpan.");
  await loadBankReconciliations();
  await loadBankMutations(data.id);
  return data;
}

async function loadBankReconciliations() {
  const client = window.daiboekSupabase;
  const target = document.getElementById("bankHistory");
  if (!target) return;

  const { data, error } = await client
    .from("bank_reconciliations")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    target.innerHTML = "Gagal memuat riwayat: " + escapeHTML(error.message);
    return;
  }

  target.innerHTML = `
    <div class="table-responsive">
      <table class="erp-table">
        <thead>
          <tr>
            <th>Periode</th>
            <th>Saldo Bank</th>
            <th>Saldo Buku</th>
            <th>Selisih</th>
            <th>Status</th>
            <th>Mutasi</th>
          </tr>
        </thead>
        <tbody>
          ${(data || []).map(item => `
            <tr>
              <td>${escapeHTML(item.period_start)} s/d ${escapeHTML(item.period_end)}</td>
              <td>${formatRupiah(item.statement_ending_balance)}</td>
              <td>${formatRupiah(item.book_balance)}</td>
              <td>${formatRupiah(item.difference)}</td>
              <td>${item.status === "balanced" ? "Seimbang" : "Belum seimbang"}</td>
              <td>
                <button class="btn-secondary"
                  onclick="loadBankMutations('${item.id}')">
                  Lihat
                </button>
              </td>
            </tr>
          `).join("") || `
            <tr><td colspan="6">Belum ada riwayat rekonsiliasi.</td></tr>
          `}
        </tbody>
      </table>
    </div>
  `;
}

async function loadBankMutations(reconciliationId) {
  const client = window.daiboekSupabase;
  const target = document.getElementById("bankMutations");
  if (!target) return;

  target.innerHTML = "Memuat mutasi dan jurnal yang tersedia...";

  const { data: header, error: headerError } = await client
    .from("bank_reconciliations")
    .select("id, account_id, period_start, period_end")
    .eq("id", reconciliationId)
    .single();

  if (headerError || !header) {
    target.innerHTML = `<p class="error">Gagal memuat periode rekonsiliasi: ${escapeHTML(headerError?.message || "Data tidak ditemukan")}</p>`;
    return;
  }

  const { data: items, error } = await client
    .from("bank_reconciliation_items")
    .select("*")
    .eq("reconciliation_id", reconciliationId)
    .order("transaction_date", { ascending: false });

  if (error) {
    target.innerHTML = "Gagal memuat mutasi: " + escapeHTML(error.message);
    return;
  }

  const { data: journalLines, error: journalError } = await client
    .from("journal_lines")
    .select(`
      id, debit, kredit,
      journal_entries!inner (tanggal, nomor_jurnal, keterangan, status)
    `)
    .eq("account_id", header.account_id)
    .gte("journal_entries.tanggal", header.period_start)
    .lte("journal_entries.tanggal", header.period_end);

  if (journalError) {
    target.innerHTML = `<p class="error">Gagal memuat jurnal: ${escapeHTML(journalError.message)}</p>`;
    return;
  }

  const postedLines = (journalLines || []).filter(line =>
    String(line.journal_entries?.status || "").toLowerCase() === "posted"
  );
  const usedJournalIds = new Set((items || [])
    .filter(item => item.matched_journal_line_id)
    .map(item => item.matched_journal_line_id));

  const rupiah = value => formatRupiah(value);
  target.innerHTML = `
    <div class="table-responsive">
      <table class="erp-table">
        <thead>
          <tr>
            <th>Tanggal</th>
            <th>Jenis</th>
            <th>Keterangan</th>
            <th>Nominal</th>
            <th>Status</th>
            <th>Jurnal yang Cocok</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          ${(items || []).map(item => {
            const isDeposit = item.item_type === "deposit";
            const candidates = postedLines.filter(line => {
              if (usedJournalIds.has(line.id) && line.id !== item.matched_journal_line_id) return false;
              const journalAmount = Number((isDeposit ? line.debit : line.kredit) || 0);
              const oppositeAmount = Number((isDeposit ? line.kredit : line.debit) || 0);
              return Math.abs(journalAmount - Number(item.amount || 0)) < 0.005 && oppositeAmount < 0.005;
            });
            const selectId = `bankMatchSelect_${item.id}`;
            const alreadyMatched = Boolean(item.matched && item.matched_journal_line_id);
            return `
              <tr>
                <td>${escapeHTML(item.transaction_date || "")}</td>
                <td>${isDeposit ? "Setoran" : "Penarikan"}</td>
                <td>${escapeHTML(item.description || "-")}</td>
                <td>${rupiah(item.amount)}</td>
                <td>${alreadyMatched ? "✅ Cocok" : "Belum dicocokkan"}</td>
                <td>
                  ${alreadyMatched
                    ? "Jurnal sudah ditautkan"
                    : `<select id="${selectId}" class="erp-input" style="min-width:220px">
                        <option value="">${candidates.length ? "Pilih jurnal yang sesuai" : "Tidak ada jurnal yang cocok"}</option>
                        ${candidates.map(line => `<option value="${line.id}">${escapeHTML(line.journal_entries?.tanggal || "")} | ${escapeHTML(line.journal_entries?.nomor_jurnal || "Jurnal")} | ${rupiah(isDeposit ? line.debit : line.kredit)}</option>`).join("")}
                      </select>`}
                </td>
                <td>
                  ${alreadyMatched
                    ? "Selesai"
                    : `<button type="button" class="btn-secondary" ${candidates.length ? "" : "disabled"} onclick="matchBankMutation('${item.id}', '${selectId}')">Cocokkan</button>`}
                </td>
              </tr>
            `;
          }).join("") || `<tr><td colspan="7">Belum ada mutasi rekening.</td></tr>`}
        </tbody>
      </table>
    </div>
    <p class="form-hint">Mutasi setoran harus cocok dengan debit akun bank, sedangkan penarikan harus cocok dengan kredit akun bank. Nominal dan periode harus sesuai.</p>
  `;
}

async function matchBankMutation(itemId, selectId) {
  const client = window.daiboekSupabase;
  const select = document.getElementById(selectId);
  const journalLineId = select?.value;
  if (!journalLineId) {
    alert("Pilih jurnal yang sesuai terlebih dahulu.");
    return;
  }

  const { data: item, error: itemError } = await client
    .from("bank_reconciliation_items")
    .select("id, reconciliation_id, item_type, amount, matched")
    .eq("id", itemId)
    .single();
  if (itemError || !item) {
    alert("Mutasi tidak ditemukan: " + (itemError?.message || ""));
    return;
  }
  if (item.matched) {
    alert("Mutasi ini sudah dicocokkan.");
    return;
  }

  const { data: header, error: headerError } = await client
    .from("bank_reconciliations")
    .select("account_id, period_start, period_end")
    .eq("id", item.reconciliation_id)
    .single();
  if (headerError || !header) {
    alert("Data rekonsiliasi tidak ditemukan.");
    return;
  }

  const { data: line, error: lineError } = await client
    .from("journal_lines")
    .select(`id, account_id, debit, kredit, journal_entries!inner (tanggal, status)`)
    .eq("id", journalLineId)
    .single();
  if (lineError || !line) {
    alert("Baris jurnal tidak ditemukan.");
    return;
  }

  const entry = line.journal_entries;
  const expectedAmount = item.item_type === "deposit" ? Number(line.debit || 0) : Number(line.kredit || 0);
  const oppositeAmount = item.item_type === "deposit" ? Number(line.kredit || 0) : Number(line.debit || 0);
  const valid = line.account_id === header.account_id &&
    String(entry?.status || "").toLowerCase() === "posted" &&
    entry.tanggal >= header.period_start && entry.tanggal <= header.period_end &&
    Math.abs(expectedAmount - Number(item.amount || 0)) < 0.005 &&
    oppositeAmount < 0.005;

  if (!valid) {
    alert("Jurnal tidak cocok. Pastikan akun, periode, arah debit/kredit, dan nominal sama dengan mutasi.");
    return;
  }

  const { data: updated, error: updateError } = await client
    .from("bank_reconciliation_items")
    .update({ matched: true, matched_journal_line_id: journalLineId })
    .eq("id", itemId)
    .eq("matched", false)
    .select("id")
    .maybeSingle();

  if (updateError) {
    alert("Gagal mencocokkan mutasi: " + updateError.message);
    return;
  }
  if (!updated) {
    alert("Mutasi sudah berubah atau sudah dicocokkan. Muat ulang daftar mutasi.");
    return;
  }

  alert("Mutasi berhasil dicocokkan dengan jurnal.");
  await loadBankMutations(item.reconciliation_id);
}

const originalBankShowPage = window.showPage;

window.showPage = function(page, button) {
  const bankContent = document.getElementById("bankContent");

  if (bankContent) {
    bankContent.style.display = page === "bank" ? "block" : "none";
  }

  originalBankShowPage(page, button);

  if (page === "bank") {
    setupBankReconciliation();
  }
};

// ==========================================
// PERIKSA SESSION
// ==========================================
async function checkLoginSession() {
  const {data,error}=await supabaseClient.auth.getSession();
  if(error){loginError.textContent="Tidak dapat memeriksa sesi login.";return;}
  if(data.session)await loadUserProfile(data.session.user);
}
checkLoginSession();

// =============================================
// MODUL INVOICE KOPERASI DESA
// =============================================

let invoiceRows = [];
let invoiceProducts = [];

const invoiceStyle = document.createElement("style");
invoiceStyle.textContent = `
.invoice-wrap{display:grid;gap:18px}
.invoice-summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
.invoice-stat{background:#fff;border:1px solid #eee;border-radius:12px;padding:17px}
.invoice-stat small{display:block;color:#777;margin-bottom:8px}
.invoice-stat strong{font-size:20px;color:#222}
.invoice-panel{background:#fff;border:1px solid #eee;border-radius:12px;padding:20px}
.invoice-panel h3{margin-top:0}
.invoice-form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px}
.invoice-form-grid .full{grid-column:1/-1}
.invoice-panel input,.invoice-panel textarea,.invoice-panel select{
 box-sizing:border-box;width:100%;padding:11px;border:1px solid #ddd;
 border-radius:7px;font:inherit;background:white
}
.invoice-panel label{display:block;font-size:13px;font-weight:bold;color:#555;margin-bottom:7px}
.invoice-items{width:100%;border-collapse:collapse;min-width:650px}
.invoice-items th,.invoice-items td{padding:10px;border-bottom:1px solid #eee;text-align:left}
.invoice-items input{min-width:80px}
.invoice-items select{min-width:230px}.inv-stock-info{display:block;color:#687386;font-size:11px;margin-top:5px}.inv-stock-info.low{color:#b42318;font-weight:bold}
.invoice-total{text-align:right;margin-top:16px;font-weight:bold;font-size:18px}
.invoice-action{border:0;border-radius:7px;padding:9px 13px;cursor:pointer;font-weight:bold}
.invoice-primary{background:#00a968;color:#fff}
.invoice-secondary{background:#f1f1f1;color:#444}
.invoice-danger{background:#fee;color:#00a968}
.invoice-status{padding:5px 9px;border-radius:20px;background:#f1f1f1;font-size:11px}
.invoice-status.paid{background:#e8f7ed;color:#18743b}
.invoice-status.sent{background:#eaf2ff;color:#2860a8}
.invoice-status.overdue{background:#fee;color:#00a968}
.invoice-message{font-size:13px;margin-top:12px}
.invoice-payment-box{margin-top:22px;padding:16px;border:1px solid #eee;border-radius:10px;background:#fafafa}
.invoice-payment-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.invoice-payment-grid label{display:block;margin-bottom:6px;font-size:12px;font-weight:bold;color:#555}
.invoice-payment-grid input,.invoice-payment-grid select{box-sizing:border-box;width:100%;padding:10px;border:1px solid #ddd;border-radius:7px;background:white}
.invoice-payment-table{width:100%;border-collapse:collapse;margin-top:12px}
.invoice-payment-table th,.invoice-payment-table td{padding:9px;border-bottom:1px solid #e8e8e8;text-align:left;font-size:12px}
.invoice-status.partial{background:#fff4d8;color:#8a5a00}
.invoice-status.unpaid{background:#fff0e6;color:#a34b12}
@media(max-width:650px){
 .invoice-summary{grid-template-columns:1fr}
 .invoice-form-grid{grid-template-columns:1fr}
 .invoice-form-grid .full{grid-column:auto}
 .invoice-panel{padding:14px}
 .invoice-payment-grid{grid-template-columns:1fr}
}
@media print{
 body *{visibility:hidden!important}
 #invoicePrintArea,#invoicePrintArea *{visibility:visible!important}
 #invoicePrintArea{position:absolute;left:0;top:0;width:100%;padding:25px}
 .no-print{display:none!important}
}
`;
document.head.appendChild(invoiceStyle);

function setupInvoice() {
 const page=document.getElementById("modulePage");
 if(!page)return;

 let section=document.getElementById("invoiceContent");
 if(section)return;

 section=document.createElement("section");
 section.id="invoiceContent";
 section.className="erp-content invoice-wrap";

 section.innerHTML=`
  <div class="invoice-summary">
   <div class="invoice-stat">
    <small>Total Invoice</small>
    <strong id="invoiceCount">0</strong>
   </div>
   <div class="invoice-stat">
    <small>Total Tagihan</small>
    <strong id="invoiceTotal">Rp0</strong>
   </div>
   <div class="invoice-stat">
    <small>Belum Dibayar</small>
    <strong id="invoiceUnpaid">Rp0</strong>
   </div>
  </div>

  <div class="invoice-panel">
   <div class="erp-toolbar">
    <div>
     <h3>🧾 Daftar Invoice</h3>
     <div class="erp-muted">Kelola invoice penjualan kepada pelanggan dan pembelian dari pemasok KDMP.</div>
    </div>
    <button class="invoice-action invoice-primary" id="invoiceNewButton">
     + Buat Invoice
    </button>
   </div>
   <div id="invoiceMessage" class="invoice-message"></div>
  </div>

  <div class="invoice-panel" id="invoiceFormPanel" style="display:none">
   <h3>Buat Invoice Baru</h3>

   <form id="invoiceForm">
    <div class="invoice-form-grid">
     <div class="full">
      <label>Jenis Invoice</label>
      <select id="invType">
       <option value="penjualan">Invoice Penjualan</option>
       <option value="pembelian">Invoice Pembelian</option>
      </select>
     </div>
     <div>
      <label id="invCounterpartyLabel">Nama Pelanggan</label>
      <input id="invCustomer" maxlength="150" placeholder="Opsional — default Pelanggan Umum / Pemasok Umum">
     </div>
     <div>
      <label>Nomor Telepon</label>
      <input id="invPhone" placeholder="08xxxxxxxxxx">
     </div>
     <div>
      <label>Email</label>
      <input id="invEmail" type="email" placeholder="Email pelanggan">
     </div>
     <div>
      <label>Tanggal Invoice</label>
      <input id="invDate" type="date" required>
     </div>
     <div>
      <label>Jatuh Tempo</label>
      <input id="invDueDate" type="date">
     </div>
     <div class="full">
      <label id="invAddressLabel">Alamat Pelanggan</label>
      <textarea id="invAddress" rows="2" placeholder="Alamat pelanggan"></textarea>
     </div>
    </div>

    <h3 style="margin-top:25px">Rincian Barang / Jasa</h3>
    <div style="overflow-x:auto">
     <table class="invoice-items">
      <thead>
       <tr>
        <th>Nama Barang / Jasa</th>
        <th>Jumlah</th>
        <th>Satuan</th>
        <th>Harga</th>
        <th>Total</th>
        <th></th>
       </tr>
      </thead>
      <tbody id="invoiceItemRows"></tbody>
     </table>
    </div>

    <button type="button" class="invoice-action invoice-secondary"
      id="invoiceAddItem" style="margin-top:12px">
      + Tambah Barang
    </button>

    <div class="invoice-form-grid" style="margin-top:20px">
     <div>
      <label>Diskon (Rp)</label>
      <input id="invDiscount" type="number" min="0" value="0">
     </div>
     <div>
      <label>Pajak (Rp)</label>
      <input id="invTax" type="number" min="0" value="0">
     </div>
     <div class="full">
      <label>Catatan</label>
      <textarea id="invNotes" rows="2" placeholder="Catatan tambahan"></textarea>
     </div>
    </div>

    <div class="invoice-total">
     Total: <span id="invoiceGrandTotal">Rp0</span>
    </div>

    <div id="invoiceFormMessage" class="invoice-message"></div>

    <div class="erp-actions">
     <button type="submit" class="invoice-action invoice-primary" id="invoiceSaveButton">
      Simpan Invoice
     </button>
     <button type="button" class="invoice-action invoice-secondary" id="invoiceCancelButton">
      Batal
     </button>
    </div>
   </form>
  </div>

  <div class="invoice-panel">
   <h3>Riwayat Invoice</h3>
   <div style="overflow-x:auto">
    <table class="erp-table">
     <thead>
      <tr>
       <th>Nomor Invoice</th>
       <th>Tanggal</th>
       <th>Pelanggan / Pemasok</th>
       <th>Total</th>
       <th>Status</th>
       <th>Aksi</th>
      </tr>
     </thead>
     <tbody id="invoiceHistoryBody">
      <tr><td colspan="6">Memuat invoice...</td></tr>
     </tbody>
    </table>
   </div>
  </div>

  <div id="invoiceDetailPanel" class="invoice-panel" style="display:none"></div>
 `;

 page.appendChild(section);

 document.getElementById("invoiceNewButton").addEventListener("click",openInvoiceForm);
 document.getElementById("invoiceAddItem").addEventListener("click",addInvoiceItem);
 document.getElementById("invoiceCancelButton").addEventListener("click",closeInvoiceForm);
 document.getElementById("invoiceForm").addEventListener("submit",saveInvoice);
 document.getElementById("invType").addEventListener("change",updateInvoiceType);
 document.getElementById("invDiscount").addEventListener("input",updateInvoiceTotal);
 document.getElementById("invTax").addEventListener("input",updateInvoiceTotal);

 loadInvoiceHistory();
}

function updateInvoiceType() {
 const type=document.getElementById("invType").value;
 const isPurchase=type==="pembelian";
 document.getElementById("invCounterpartyLabel").textContent=
  isPurchase?"Nama Pemasok (opsional)":"Nama Pelanggan (opsional)";
 document.getElementById("invAddressLabel").textContent=
  isPurchase?"Alamat Pemasok":"Alamat Pelanggan";
 document.getElementById("invCustomer").placeholder=
  isPurchase?"Opsional - kosongkan untuk Pemasok Umum":"Opsional - kosongkan untuk Pelanggan Umum";
 document.querySelectorAll("#invoiceItemRows tr").forEach(row=>{
  const productId=row.querySelector(".inv-product")?.value;
  const product=invoiceProducts.find(item=>item.id===productId);
  if(product)row.querySelector(".inv-price").value=
   Number(isPurchase?product.purchase_price:product.selling_price)||0;
 });
 updateInvoiceTotal();
}

async function openInvoiceForm() {
 const form=document.getElementById("invoiceForm");
 form.reset();
 document.getElementById("invoiceFormPanel").style.display="block";
 document.getElementById("invoiceDetailPanel").style.display="none";
 document.getElementById("invDate").value=todayDate();
 document.getElementById("invType").value="penjualan";
 updateInvoiceType();
 document.getElementById("invoiceFormMessage").textContent="";
 document.getElementById("invoiceItemRows").replaceChildren();
 const formMessage=document.getElementById("invoiceFormMessage");
 formMessage.textContent="Memuat daftar barang dari Persediaan...";
 try{
  await loadInvoiceProducts();
  addInvoiceItem();
  formMessage.textContent="Pilih barang dari master Persediaan Barang.";
  formMessage.className="invoice-message";
 }catch(error){
  formMessage.textContent="Gagal memuat persediaan: "+error.message;
  formMessage.className="invoice-message erp-error";
 }
 document.getElementById("invoiceFormPanel").scrollIntoView({behavior:"smooth"});
}

function closeInvoiceForm() {
 document.getElementById("invoiceFormPanel").style.display="none";
}

async function loadInvoiceProducts() {
 const {data,error}=await supabaseClient
  .from("inventory_products")
  .select("id,product_code,product_name,unit,current_stock,purchase_price,selling_price,is_active")
  .eq("is_active",true)
  .order("product_name",{ascending:true});
 if(error)throw error;
 invoiceProducts=data||[];
}

function invoiceProductOptions(selectedId="") {
 return '<option value="">Pilih barang dari Persediaan</option>'+invoiceProducts.map(product=>{
  const stock=Number(product.current_stock||0);
  return `<option value="${escapeHTML(product.id)}" ${product.id===selectedId?"selected":""}>${escapeHTML(product.product_code||"")} - ${escapeHTML(product.product_name)} (Stok: ${stock} ${escapeHTML(product.unit||"")})</option>`;
 }).join("");
}

function setInvoiceRowProduct(row) {
 const productId=row.querySelector(".inv-product").value;
 const product=invoiceProducts.find(item=>item.id===productId);
 const type=document.getElementById("invType").value;
 const unitInput=row.querySelector(".inv-unit");
 const priceInput=row.querySelector(".inv-price");
 const stockInfo=row.querySelector(".inv-stock-info");
 const nameInput=row.querySelector(".inv-description");
 if(!product){
  nameInput.value="";
  unitInput.value="";
  priceInput.value=0;
  stockInfo.textContent="Pilih barang dari master Persediaan Barang.";
  stockInfo.className="inv-stock-info";
  updateInvoiceTotal();
  return;
 }
 nameInput.value=product.product_name;
 unitInput.value=product.unit||"pcs";
 priceInput.value=Number(type==="pembelian"?product.purchase_price:product.selling_price)||0;
 const stock=Number(product.current_stock||0);
 stockInfo.textContent="Kode: "+(product.product_code||"-")+" | Stok tersedia: "+stock+" "+(product.unit||"");
 stockInfo.className="inv-stock-info"+(stock<=0?" low":"");
 updateInvoiceTotal();
}

function addInvoiceItem() {
 const body=document.getElementById("invoiceItemRows");
 const row=document.createElement("tr");
 row.innerHTML=`
  <td>
   <select class="inv-product" required>${invoiceProductOptions()}</select>
   <input class="inv-description" type="hidden" required>
   <small class="inv-stock-info">Pilih barang dari master Persediaan Barang.</small>
  </td>
  <td><input class="inv-quantity" type="number" min="0.01" step="0.01" value="1"></td>
  <td><input class="inv-unit" readonly></td>
  <td><input class="inv-price" type="number" min="0" step="1" value="0"></td>
  <td class="inv-line-total">Rp0</td>
  <td><button type="button" class="invoice-action invoice-danger">×</button></td>
 `;
 row.querySelector(".inv-product").addEventListener("change",()=>setInvoiceRowProduct(row));
 row.querySelectorAll(".inv-quantity,.inv-price").forEach(input=>input.addEventListener("input",updateInvoiceTotal));
 row.querySelector("button").addEventListener("click",()=>{
  if(body.children.length<=1){alert("Invoice minimal harus memiliki satu barang.");return;}
  row.remove();
  updateInvoiceTotal();
 });
 body.appendChild(row);
 updateInvoiceTotal();
}

function getInvoiceItems() {
 return [...document.querySelectorAll("#invoiceItemRows tr")].map(row=>{
  const productId=row.querySelector(".inv-product").value;
  const product=invoiceProducts.find(item=>item.id===productId);
  const description=product?.product_name||"";
  const quantity=Number(row.querySelector(".inv-quantity").value);
  const unit=product?.unit||"pcs";
  const price=Number(row.querySelector(".inv-price").value);
  return {
   product_id:productId,
   description,
   quantity,
   unit,
   unit_price:price,
   line_total:quantity*price
  };
 });
}

function calculateInvoiceTotal() {
 const items=getInvoiceItems();
 const subtotal=items.reduce((sum,item)=>sum+item.line_total,0);
 const discount=Number(document.getElementById("invDiscount").value||0);
 const tax=Number(document.getElementById("invTax").value||0);
 return {
  items,
  subtotal,
  discount,
  tax,
  total:Math.max(0,subtotal-discount+tax)
 };
}

function updateInvoiceTotal() {
 const result=calculateInvoiceTotal();

 document.querySelectorAll("#invoiceItemRows tr").forEach((row,index)=>{
  const item=result.items[index];
  row.querySelector(".inv-line-total").textContent=formatRupiah(item?.line_total||0);
 });

 document.getElementById("invoiceGrandTotal").textContent=formatRupiah(result.total);
}

async function saveInvoice(event) {
 event.preventDefault();

 const message=document.getElementById("invoiceFormMessage");
 const button=document.getElementById("invoiceSaveButton");
 const type=document.getElementById("invType").value;

 if(!["manajer","admin_keuangan"].includes(window.currentUser?.role)){
  message.textContent="Akses tidak diizinkan.";
  message.className="invoice-message erp-error";
  return;
 }

 const result=calculateInvoiceTotal();
 const date=document.getElementById("invDate").value;
 const dueDate=document.getElementById("invDueDate").value;
 const enteredCounterparty=document.getElementById("invCustomer").value.trim();
 const counterparty=enteredCounterparty||(type==="pembelian"?"Pemasok Umum":"Pelanggan Umum");

 if(!["penjualan","pembelian"].includes(type)){
  message.textContent="Pilih jenis invoice yang benar.";
  message.className="invoice-message erp-error";
  return;
 }

 if(!date || (dueDate && dueDate<date)){
  message.textContent="Periksa tanggal invoice dan tanggal jatuh tempo.";
  message.className="invoice-message erp-error";
  return;
 }

 if(!result.items.length || result.items.some(item=>
  !item.description || !Number.isFinite(item.quantity) ||
  item.quantity<=0 || !Number.isFinite(item.unit_price) ||
  item.unit_price<0
 )){
  message.textContent="Periksa rincian barang dan harga.";
  message.className="invoice-message erp-error";
  return;
 }

 if(result.items.some(item=>!item.product_id)){
  message.textContent="Pilih barang dari daftar Persediaan Barang untuk setiap baris invoice.";
  message.className="invoice-message erp-error";
  return;
 }

 if(type==="penjualan"){
  const grouped=new Map();
  result.items.forEach(item=>grouped.set(item.product_id,(grouped.get(item.product_id)||0)+item.quantity));
  for(const [productId,quantity] of grouped){
   const product=invoiceProducts.find(p=>p.id===productId);
   if(!product){message.textContent="Barang tidak ditemukan di Persediaan.";message.className="invoice-message erp-error";return;}
   if(quantity>Number(product.current_stock||0)){
    message.textContent="Stok "+product.product_name+" tidak cukup. Tersedia "+Number(product.current_stock||0)+" "+(product.unit||"")+".";
    message.className="invoice-message erp-error";return;
   }
  }
 }

 if(result.discount<0 || result.tax<0 || result.discount>result.subtotal){
  message.textContent="Diskon atau pajak tidak valid.";
  message.className="invoice-message erp-error";
  return;
 }

 button.disabled=true;
 button.textContent="Menyimpan...";

 try {
  const invoiceNumber="INV-"+date.replaceAll("-","")+"-"+Date.now().toString().slice(-5);
  const isPurchase=type==="pembelian";

  const invoiceData={
   invoice_number:invoiceNumber,
   invoice_type:type,
   customer_name:counterparty,
   supplier_name:isPurchase?counterparty:null,
   customer_phone:document.getElementById("invPhone").value.trim()||null,
   customer_email:document.getElementById("invEmail").value.trim()||null,
   customer_address:document.getElementById("invAddress").value.trim()||null,
   issue_date:date,
   due_date:dueDate||null,
   subtotal:result.subtotal,
   discount:result.discount,
   tax:result.tax,
   total:result.total,
   paid_amount:0,
   payment_status:"belum_dibayar",
   status:"sent",
   notes:document.getElementById("invNotes").value.trim()||null,
   created_by:window.currentUser.id
  };

  const {data:invoice,error}=await supabaseClient
   .from("invoices")
   .insert(invoiceData)
   .select("id")
   .single();

  if(error)throw error;

  const itemRows=result.items.map(item=>({
   invoice_id:invoice.id,
   ...item
  }));

  const {error:itemError}=await supabaseClient
   .from("invoice_items")
   .insert(itemRows);

  if(itemError){
   await supabaseClient.from("invoices").delete().eq("id",invoice.id);
   throw itemError;
  }

  // Buat jurnal otomatis setelah header dan rincian invoice berhasil tersimpan.
  // RPC dibuat idempoten di database berdasarkan invoice_id.
  let journalWarning="";
  const {error:journalError}=await supabaseClient.rpc("record_invoice_journal",{
   p_invoice_id:invoice.id
  });
  if(journalError){
   journalWarning=" Invoice tersimpan, tetapi jurnal otomatis belum berhasil dibuat: "+journalError.message;
  }

  message.textContent=(isPurchase?"Invoice pembelian":"Invoice penjualan")+
   " berhasil dibuat: "+invoiceNumber+journalWarning;
  message.className="invoice-message "+(journalWarning?"erp-error":"erp-success");

  closeInvoiceForm();
  await loadInvoiceHistory();

 } catch(error) {
  message.textContent="Gagal menyimpan invoice: "+error.message;
  message.className="invoice-message erp-error";
 } finally {
  button.disabled=false;
  button.textContent="Simpan Invoice";
 }
}

async function loadInvoiceHistory() {
 const body=document.getElementById("invoiceHistoryBody");
 if(!body)return;

 body.innerHTML='<tr><td colspan="6">Memuat invoice...</td></tr>';

 const {data,error}=await supabaseClient
  .from("invoices")
  .select("*")
  .order("created_at",{ascending:false})
  .limit(100);

 if(error){
  body.innerHTML=`<tr><td colspan="6">${escapeHTML(error.message)}</td></tr>`;
  return;
 }

 const invoices=data||[];
 const total=invoices.reduce((sum,item)=>sum+Number(item.total||0),0);
 const unpaid=invoices.reduce((sum,item)=>sum+Math.max(0,Number(item.total||0)-Number(item.paid_amount||0)),0);

 document.getElementById("invoiceCount").textContent=invoices.length;
 document.getElementById("invoiceTotal").textContent=formatRupiah(total);
 document.getElementById("invoiceUnpaid").textContent=formatRupiah(unpaid);

 if(!invoices.length){
  body.innerHTML='<tr><td colspan="6">Belum ada invoice.</td></tr>';
  return;
 }

 body.replaceChildren();

 invoices.forEach(invoice=>{
  const row=document.createElement("tr");

  const isPurchase=invoice.invoice_type==="pembelian";
  const values=[
   invoice.invoice_number,
   invoice.issue_date,
   (isPurchase?"Pemasok: ":"Pelanggan: ")+(isPurchase?(invoice.supplier_name||invoice.customer_name):invoice.customer_name),
   formatRupiah(invoice.total)
  ];

  values.forEach(value=>{
   const cell=document.createElement("td");
   cell.textContent=value;
   row.appendChild(cell);
  });

  const statusCell=document.createElement("td");
  const badge=document.createElement("span");
  const paid=Number(invoice.paid_amount||0);
  const remaining=Math.max(0,Number(invoice.total||0)-paid);
  const paymentStatus=invoice.payment_status || (remaining<=0?"lunas":paid>0?"dibayar_sebagian":"belum_dibayar");
  badge.className="invoice-status "+(paymentStatus==="lunas"?"paid":paymentStatus==="dibayar_sebagian"?"partial":"unpaid");
  badge.textContent=paymentStatus==="lunas"?"Lunas":paymentStatus==="dibayar_sebagian"?"Dibayar Sebagian":"Belum Dibayar";
  statusCell.appendChild(badge);
  row.appendChild(statusCell);

  const actionCell=document.createElement("td");
  const detailButton=document.createElement("button");
  detailButton.className="invoice-action invoice-secondary";
  detailButton.textContent="Detail";
  detailButton.addEventListener("click",()=>showInvoiceDetail(invoice.id));
  actionCell.appendChild(detailButton);
  row.appendChild(actionCell);

  body.appendChild(row);
 });
}

function invoicePaymentStatus(invoice) {
 const paid=Number(invoice.paid_amount||0);
 const total=Number(invoice.total||0);
 if(total>0 && paid>=total) return "lunas";
 if(paid>0) return "dibayar_sebagian";
 return "belum_dibayar";
}

async function submitInvoicePayment(invoiceId) {
 const message=document.getElementById("invoicePaymentMessage");
 const button=document.getElementById("invoicePaymentSaveButton");
 if(!message || !button) return;

 if(!["manajer","admin_keuangan"].includes(window.currentUser?.role)){
  message.textContent="Akses tidak diizinkan.";
  message.className="invoice-message erp-error";
  return;
 }

 const amount=Number(document.getElementById("invoicePaymentAmount").value);
 const paymentDate=document.getElementById("invoicePaymentDate").value;
 const paymentMethod=document.getElementById("invoicePaymentMethod").value;
 const notes=document.getElementById("invoicePaymentNotes").value.trim()||null;

 if(!Number.isFinite(amount)||amount<=0){
  message.textContent="Masukkan nominal pembayaran lebih dari nol.";
  message.className="invoice-message erp-error";
  return;
 }
 if(!paymentDate){
  message.textContent="Tanggal pembayaran wajib diisi.";
  message.className="invoice-message erp-error";
  return;
 }

 button.disabled=true;
 button.textContent="Menyimpan...";
 try {
  const {data,error}=await supabaseClient.rpc("record_invoice_payment",{
   p_invoice_id:invoiceId,
   p_amount:amount,
   p_payment_date:paymentDate,
   p_payment_method:paymentMethod,
   p_notes:notes
  });
  if(error) throw error;
  message.textContent="Pembayaran berhasil dicatat. Sisa tagihan: "+formatRupiah(data.remaining);
  message.className="invoice-message erp-success";
  await loadInvoiceHistory();
  await showInvoiceDetail(invoiceId);
 } catch(error) {
  message.textContent="Gagal mencatat pembayaran: "+error.message;
  message.className="invoice-message erp-error";
 } finally {
  button.disabled=false;
  button.textContent="Simpan Pembayaran";
 }
}

async function showInvoiceDetail(id) {
 const panel=document.getElementById("invoiceDetailPanel");
 panel.style.display="block";
 panel.innerHTML="Memuat detail invoice...";

 const {data:invoice,error}=await supabaseClient
  .from("invoices").select("*").eq("id",id).single();

 if(error){
  panel.textContent="Gagal memuat invoice: "+error.message;
  return;
 }

 const {data:items,error:itemError}=await supabaseClient
  .from("invoice_items").select("*").eq("invoice_id",id);

 if(itemError){
  panel.textContent="Gagal memuat rincian: "+itemError.message;
  return;
 }

 const {data:payments,error:paymentError}=await supabaseClient
  .from("invoice_payments")
  .select("*")
  .eq("invoice_id",id)
  .order("payment_date",{ascending:false});

 const paymentRows=(payments||[]).map(payment=>`
  <tr>
   <td>${escapeHTML(payment.payment_date||"-")}</td>
   <td>${escapeHTML(payment.payment_method||"-")}</td>
   <td>${formatRupiah(payment.amount)}</td>
   <td>${escapeHTML(payment.notes||"-")}</td>
  </tr>
 `).join("");

 const rows=(items||[]).map(item=>`
  <tr>
   <td>${escapeHTML(item.description)}</td>
   <td>${item.quantity} ${escapeHTML(item.unit||"")}</td>
   <td>${formatRupiah(item.unit_price)}</td>
   <td>${formatRupiah(item.line_total)}</td>
  </tr>
 `).join("");

 panel.innerHTML=`
  <div id="invoicePrintArea">
   <div style="display:flex;justify-content:space-between;gap:15px;flex-wrap:wrap">
    <div>
     <h2 style="color:#00a968;margin-bottom:5px">KOPERASI DESA</h2>
     <p>INVOICE / FAKTUR TAGIHAN</p>
    </div>
    <div>
     <h3>${escapeHTML(invoice.invoice_number)}</h3>
     <p>Tanggal: ${escapeHTML(invoice.issue_date)}</p>
     <p>Jatuh tempo: ${escapeHTML(invoice.due_date||"-")}</p>
    </div>
   </div>
   <hr>
   <h3>${invoice.invoice_type==="pembelian"?"Tagihan dari pemasok:":"Ditagihkan kepada:"}</h3>
   <strong>${escapeHTML(invoice.invoice_type==="pembelian"?(invoice.supplier_name||invoice.customer_name):invoice.customer_name)}</strong>
   <p>${escapeHTML(invoice.customer_address||"-")}</p>
   <p>${escapeHTML(invoice.customer_phone||"-")}</p>
   <div style="overflow-x:auto;margin-top:20px">
    <table class="invoice-items">
     <thead><tr><th>Barang / Jasa</th><th>Jumlah</th><th>Harga</th><th>Total</th></tr></thead>
     <tbody>${rows}</tbody>
    </table>
   </div>
   <div style="text-align:right;margin-top:20px;line-height:2">
    Subtotal: ${formatRupiah(invoice.subtotal)}<br>
    Diskon: ${formatRupiah(invoice.discount)}<br>
    Pajak: ${formatRupiah(invoice.tax)}<br>
    <strong style="font-size:20px">TOTAL: ${formatRupiah(invoice.total)}</strong><br>
    Dibayar: ${formatRupiah(invoice.paid_amount)}<br>
    <strong>Sisa Tagihan: ${formatRupiah(Math.max(0,Number(invoice.total)-Number(invoice.paid_amount||0)))}</strong><br>
    <strong>Status: ${invoicePaymentStatus(invoice)==="lunas"?"Lunas":invoicePaymentStatus(invoice)==="dibayar_sebagian"?"Dibayar Sebagian":"Belum Dibayar"}</strong>
   </div>
   <p style="margin-top:25px">Catatan: ${escapeHTML(invoice.notes||"-")}</p>
  </div>
  <div class="invoice-payment-box no-print">
   <h3>Riwayat Pembayaran</h3>
   ${paymentError?`<p class="invoice-message erp-error">Gagal memuat riwayat pembayaran: ${escapeHTML(paymentError.message)}</p>`:""}
   <div style="overflow-x:auto">
    <table class="invoice-payment-table">
     <thead><tr><th>Tanggal</th><th>Metode</th><th>Nominal</th><th>Catatan</th></tr></thead>
     <tbody>${paymentRows||'<tr><td colspan="4">Belum ada pembayaran.</td></tr>'}</tbody>
    </table>
   </div>
   ${invoicePaymentStatus(invoice)!=="lunas"?`
    <h3 style="margin-top:20px">Catat Pembayaran</h3>
    <div class="invoice-payment-grid">
     <div><label>Nominal Pembayaran (Rp)</label><input id="invoicePaymentAmount" type="number" min="1" max="${Math.max(0,Number(invoice.total)-Number(invoice.paid_amount||0))}" step="1" placeholder="Masukkan nominal"></div>
     <div><label>Tanggal Pembayaran</label><input id="invoicePaymentDate" type="date" value="${todayDate()}"></div>
     <div><label>Metode Pembayaran</label><select id="invoicePaymentMethod"><option value="tunai">Tunai</option><option value="transfer">Transfer Bank</option><option value="qris">QRIS</option><option value="lainnya">Lainnya</option></select></div>
     <div><label>Catatan</label><input id="invoicePaymentNotes" placeholder="Opsional"></div>
    </div>
    <div id="invoicePaymentMessage" class="invoice-message"></div>
    <button class="invoice-action invoice-primary" id="invoicePaymentSaveButton" type="button" style="margin-top:12px">Simpan Pembayaran</button>
   `:`<p class="invoice-message erp-success">Invoice sudah lunas.</p>`}
  </div>
  <div class="erp-actions no-print">
   <button class="invoice-action invoice-primary" id="invoicePrintButton">Cetak Invoice</button>
   <button class="invoice-action invoice-secondary" id="invoiceCloseDetail">Tutup</button>
  </div>
 `;

 if(document.getElementById("invoicePaymentSaveButton")){
  document.getElementById("invoicePaymentSaveButton").addEventListener("click",()=>submitInvoicePayment(id));
 }
 document.getElementById("invoicePrintButton").addEventListener("click",()=>window.print());
 document.getElementById("invoiceCloseDetail").addEventListener("click",()=>{
  panel.style.display="none";
 });

 panel.scrollIntoView({behavior:"smooth"});
}

// Hubungkan menu Invoice ke navigasi yang sudah ada
const previousInvoiceShowPage=window.showPage;

window.showPage=function(page,button){
 const invoiceContent=document.getElementById("invoiceContent");
 if(invoiceContent)invoiceContent.style.display="none";

 previousInvoiceShowPage(page,button);

 if(page==="invoice"){
  setupInvoice();
  const content=document.getElementById("invoiceContent");
  if(content)content.style.display="block";
  loadInvoiceHistory();
 }
};

// ==========================================
// MODUL MANAJEMEN OPERASIONAL HARIAN KDMP
// ==========================================

// Tambahkan modul ke daftar navigasi ERP
modules.operasional = [
  "🏢",
  "Operasional Harian",
  "Pencatatan kegiatan dan aktivitas harian koperasi."
];

// CSS operasional
const operationalStyle = document.createElement("style");
operationalStyle.textContent = `
.operational-summary{
  display:grid;
  grid-template-columns:repeat(3,minmax(0,1fr));
  gap:14px;
  margin-bottom:20px;
}
.operational-card{
  background:white;
  border:1px solid #eee;
  border-radius:12px;
  padding:18px;
}
.operational-card small{
  display:block;
  color:#777;
  margin-bottom:8px;
}
.operational-card strong{
  font-size:22px;
  color:#222;
}
.operational-filter{
  display:flex;
  gap:12px;
  flex-wrap:wrap;
  align-items:end;
  background:white;
  border:1px solid #eee;
  border-radius:12px;
  padding:16px;
  margin-bottom:18px;
}
.operational-filter .erp-field{
  flex:1;
  min-width:180px;
}
.operational-filter input,
.operational-filter select,
.operational-form input,
.operational-form select,
.operational-form textarea{
  box-sizing:border-box;
  width:100%;
  padding:11px;
  border:1px solid #ddd;
  border-radius:7px;
  background:white;
  font:inherit;
}
.operational-form textarea{
  min-height:90px;
  resize:vertical;
}
.operational-form{
  display:none;
  background:white;
  border:1px solid #eee;
  border-radius:12px;
  padding:20px;
  margin-bottom:20px;
}
.operational-form-grid{
  display:grid;
  grid-template-columns:repeat(2,minmax(0,1fr));
  gap:14px;
}
.operational-form .erp-field{
  margin-bottom:14px;
}
.operational-form label{
  display:block;
  font-size:13px;
  font-weight:bold;
  margin-bottom:7px;
  color:#555;
}
.operational-table-wrap{
  overflow-x:auto;
  background:white;
  border:1px solid #eee;
  border-radius:12px;
}
.operational-table{
  width:100%;
  min-width:850px;
  border-collapse:collapse;
}
.operational-table th,
.operational-table td{
  padding:13px;
  border-bottom:1px solid #eee;
  text-align:left;
  font-size:13px;
}
.operational-table th{
  background:#fafafa;
  color:#555;
}
.operational-type{
  display:inline-block;
  padding:5px 9px;
  border-radius:20px;
  background:#f1f1f1;
  font-size:11px;
  font-weight:bold;
}
.operational-empty{
  padding:25px;
  text-align:center;
  color:#777;
}
@media(max-width:650px){
  .operational-summary{grid-template-columns:1fr;}
  .operational-form-grid{grid-template-columns:1fr;}
  .operational-filter{display:grid;grid-template-columns:1fr;}
}
`;
document.head.appendChild(operationalStyle);

// Membuat tombol menu
(function addOperationalMenu(){
  const menu = document.querySelector(".menu");
  if(!menu || document.getElementById("operationalMenuButton")) return;

  const button = document.createElement("button");
  button.id = "operationalMenuButton";
  button.type = "button";
  button.innerHTML = `
    <span>🏢</span>
    <span>Operasional Harian</span>
  `;
  button.addEventListener("click",()=>{
    window.showPage("operasional",button);
  });
  menu.appendChild(button);
})();

// Membuat tampilan modul
function setupOperational(){
  const page = document.getElementById("modulePage");

  if(!page || document.getElementById("operationalContent")) return;

  const section = document.createElement("section");
  section.id = "operationalContent";
  section.className = "erp-content";

  section.innerHTML = `
    <div class="operational-toolbar erp-toolbar">
      <div>
        <h3>Manajemen Operasional Harian</h3>
        <p class="erp-muted">
          Catat kegiatan, pembukaan, penutupan, dan kendala koperasi.
        </p>
      </div>
      <button class="erp-button" id="operationalAddButton">
        + Tambah Kegiatan
      </button>
    </div>

    <div class="operational-summary">
      <div class="operational-card">
        <small>Total Kegiatan Hari Ini</small>
        <strong id="operationalTotal">0</strong>
      </div>
      <div class="operational-card">
        <small>Kegiatan Selesai</small>
        <strong id="operationalDone">0</strong>
      </div>
      <div class="operational-card">
        <small>Kegiatan Tertunda</small>
        <strong id="operationalPending">0</strong>
      </div>
    </div>

    <form id="operationalForm" class="operational-form">
      <h3 id="operationalFormTitle">Tambah Kegiatan Operasional</h3>

      <div class="operational-form-grid">
        <div class="erp-field">
          <label>Tanggal Kegiatan</label>
          <input type="date" id="operationalDate" required>
        </div>

        <div class="erp-field">
          <label>Jenis Kegiatan</label>
          <select id="operationalType" required>
            <option value="pembukaan">Pembukaan Koperasi</option>
            <option value="penutupan">Penutupan Koperasi</option>
            <option value="kegiatan">Kegiatan Operasional</option>
            <option value="kendala">Kendala Operasional</option>
          </select>
        </div>

        <div class="erp-field">
          <label>Nama Kegiatan</label>
          <input type="text" id="operationalTitle"
            placeholder="Contoh: Pemeriksaan kebersihan toko" required>
        </div>

        <div class="erp-field">
          <label>Penanggung Jawab</label>
          <input type="text" id="operationalResponsible"
            placeholder="Nama petugas" required>
        </div>

        <div class="erp-field">
          <label>Status Kegiatan</label>
          <select id="operationalStatus" required>
            <option value="selesai">Selesai</option>
            <option value="proses">Dalam Proses</option>
            <option value="tertunda">Tertunda</option>
          </select>
        </div>
      </div>

      <div class="erp-field">
        <label>Keterangan Kegiatan</label>
        <textarea id="operationalDescription"
          placeholder="Tuliskan rincian kegiatan atau kendala..."></textarea>
      </div>

      <div id="operationalMessage" class="erp-message"></div>

      <div class="erp-actions">
        <button type="submit" class="erp-button"
          id="operationalSaveButton">Simpan Kegiatan</button>
        <button type="button" class="erp-button secondary"
          id="operationalCancelButton">Batal</button>
      </div>
    </form>

    <div class="operational-filter">
      <div class="erp-field">
        <label>Filter Tanggal</label>
        <input type="date" id="operationalFilterDate">
      </div>
      <div class="erp-field">
        <label>Jenis Kegiatan</label>
        <select id="operationalFilterType">
          <option value="">Semua Kegiatan</option>
          <option value="pembukaan">Pembukaan</option>
          <option value="penutupan">Penutupan</option>
          <option value="kegiatan">Kegiatan Operasional</option>
          <option value="kendala">Kendala</option>
        </select>
      </div>
      <button class="erp-button" id="operationalFilterButton">
        Tampilkan
      </button>
      <button class="erp-button secondary" id="operationalResetButton">
        Reset
      </button>
    </div>

    <h3>Riwayat Kegiatan Operasional</h3>

    <div id="operationalHistoryMessage"
      class="erp-message erp-muted">Memuat riwayat...</div>

    <div class="operational-table-wrap">
      <table class="operational-table">
        <thead>
          <tr>
            <th>Tanggal</th>
            <th>Jenis</th>
            <th>Nama Kegiatan</th>
            <th>Penanggung Jawab</th>
            <th>Status</th>
            <th>Keterangan</th>
          </tr>
        </thead>
        <tbody id="operationalHistoryBody">
          <tr><td colspan="6">Memuat data...</td></tr>
        </tbody>
      </table>
    </div>
  `;

  page.appendChild(section);

  document.getElementById("operationalDate").value = todayDate();
  document.getElementById("operationalFilterDate").value = todayDate();

  document.getElementById("operationalAddButton")
    .addEventListener("click",openOperationalForm);

  document.getElementById("operationalCancelButton")
    .addEventListener("click",closeOperationalForm);

  document.getElementById("operationalForm")
    .addEventListener("submit",saveOperational);

  document.getElementById("operationalFilterButton")
    .addEventListener("click",loadOperationalHistory);

  document.getElementById("operationalResetButton")
    .addEventListener("click",()=>{
      document.getElementById("operationalFilterDate").value="";
      document.getElementById("operationalFilterType").value="";
      loadOperationalHistory();
    });
}

function openOperationalForm(){
  const form = document.getElementById("operationalForm");
  document.getElementById("operationalForm").reset();
  document.getElementById("operationalDate").value=todayDate();
  document.getElementById("operationalFormTitle").textContent =
    "Tambah Kegiatan Operasional";
  document.getElementById("operationalMessage").textContent="";
  form.style.display="block";
  form.scrollIntoView({behavior:"smooth",block:"start"});
}

function closeOperationalForm(){
  document.getElementById("operationalForm").style.display="none";
}

async function saveOperational(event){
  event.preventDefault();

  const button=document.getElementById("operationalSaveButton");
  const message=document.getElementById("operationalMessage");

  if(!window.currentUser?.id){
    message.textContent="Sesi pengguna tidak ditemukan. Silakan login ulang.";
    message.className="erp-message erp-error";
    return;
  }

  const record={
    activity_date:document.getElementById("operationalDate").value,
    activity_type:document.getElementById("operationalType").value,
    title:document.getElementById("operationalTitle").value.trim(),
    responsible_name:document.getElementById("operationalResponsible").value.trim(),
    status:document.getElementById("operationalStatus").value,
    description:document.getElementById("operationalDescription").value.trim() || null,
    created_by:window.currentUser.id
  };

  if(!record.activity_date || !record.title || !record.responsible_name){
    message.textContent="Tanggal, nama kegiatan, dan penanggung jawab wajib diisi.";
    message.className="erp-message erp-error";
    return;
  }

  button.disabled=true;
  button.textContent="Menyimpan...";

  const {error}=await supabaseClient
    .from("operational_daily_logs")
    .insert(record);

  button.disabled=false;
  button.textContent="Simpan Kegiatan";

  if(error){
    message.textContent="Gagal menyimpan: "+error.message;
    message.className="erp-message erp-error";
    return;
  }

  message.textContent="Kegiatan berhasil disimpan.";
  message.className="erp-message erp-success";

  document.getElementById("operationalForm").reset();
  document.getElementById("operationalDate").value=todayDate();

  closeOperationalForm();
  await loadOperationalHistory();
}

async function loadOperationalHistory(){
  const body=document.getElementById("operationalHistoryBody");
  const message=document.getElementById("operationalHistoryMessage");

  if(!body)return;

  body.innerHTML='<tr><td colspan="6">Memuat data...</td></tr>';
  message.textContent="Mengambil data operasional...";
  message.className="erp-message erp-muted";

  const date=document.getElementById("operationalFilterDate").value;
  const type=document.getElementById("operationalFilterType").value;

  let query=supabaseClient
    .from("operational_daily_logs")
    .select("*")
    .order("activity_date",{ascending:false})
    .order("created_at",{ascending:false})
    .limit(200);

  if(date)query=query.eq("activity_date",date);
  if(type)query=query.eq("activity_type",type);

  const {data,error}=await query;

  if(error){
    body.innerHTML=`<tr><td colspan="6">${escapeHTML(error.message)}</td></tr>`;
    message.textContent="Gagal memuat data operasional.";
    message.className="erp-message erp-error";
    return;
  }

  const records=data||[];

  const today=todayDate();
  const todayRecords=records.filter(x=>x.activity_date===today);

  document.getElementById("operationalTotal").textContent=todayRecords.length;
  document.getElementById("operationalDone").textContent=
    todayRecords.filter(x=>x.status==="selesai").length;
  document.getElementById("operationalPending").textContent=
    todayRecords.filter(x=>x.status==="tertunda").length;

  if(!records.length){
    body.innerHTML='<tr><td colspan="6" class="operational-empty">Belum ada kegiatan operasional.</td></tr>';
    message.textContent="Belum ada data untuk filter yang dipilih.";
    message.className="erp-message erp-muted";
    return;
  }

  const labels={
    pembukaan:"Pembukaan",
    penutupan:"Penutupan",
    kegiatan:"Kegiatan",
    kendala:"Kendala"
  };

  const statuses={
    selesai:"Selesai",
    proses:"Dalam Proses",
    tertunda:"Tertunda"
  };

  body.innerHTML=records.map(item=>`
    <tr>
      <td>${escapeHTML(item.activity_date)}</td>
      <td><span class="operational-type">${labels[item.activity_type]||"-"}</span></td>
      <td>${escapeHTML(item.title)}</td>
      <td>${escapeHTML(item.responsible_name)}</td>
      <td>${escapeHTML(statuses[item.status]||item.status)}</td>
      <td>${escapeHTML(item.description||"-")}</td>
    </tr>
  `).join("");

  message.textContent=`Berhasil memuat ${records.length} kegiatan.`;
  message.className="erp-message erp-success";
}

// Hubungkan modul dengan navigasi utama ERP
const previousOperationalShowPage=window.showPage;

window.showPage=function(page,button){
  const operationalContent=document.getElementById("operationalContent");

  if(operationalContent){
    operationalContent.style.display="none";
  }

  previousOperationalShowPage(page,button);

  if(page==="operasional"){
    setupOperational();

    const content=document.getElementById("operationalContent");
    if(content)content.style.display="block";

    loadOperationalHistory();
  }
};

// ==========================================
// MODUL TRANSAKSI TOKO - KOPERASI DESA
// ==========================================

const tokoStyle = document.createElement("style");
tokoStyle.textContent = `
.toko-box{background:white;border:1px solid #e8e8e8;border-radius:12px;padding:20px;margin-bottom:18px}
.toko-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
.toko-field{margin-bottom:13px}
.toko-field label{display:block;font-size:13px;font-weight:600;margin-bottom:7px;color:#555}
.toko-field input,.toko-field select{width:100%;box-sizing:border-box;padding:11px;border:1px solid #ddd;border-radius:7px;font:inherit;background:white}
.toko-table-wrap{overflow-x:auto}
.toko-table{width:100%;min-width:650px;border-collapse:collapse}
.toko-table th,.toko-table td{padding:11px;border-bottom:1px solid #eee;text-align:left;font-size:13px}
.toko-table th{background:#fafafa}
.toko-table input{width:100%;box-sizing:border-box;padding:9px;border:1px solid #ddd;border-radius:6px}
.toko-total{display:flex;justify-content:space-between;padding:8px 0}
.toko-grand-total{font-size:22px;font-weight:800;color:#00a968}
.toko-stat-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-bottom:18px}
.toko-stat{background:white;border:1px solid #eee;border-radius:10px;padding:16px}
.toko-stat small{display:block;color:#777;margin-bottom:7px}
.toko-stat strong{font-size:19px}
.toko-btn{border:0;border-radius:7px;padding:10px 15px;background:#00a968;color:white;font-weight:600;cursor:pointer}
.toko-btn.secondary{background:#eee;color:#333}
.toko-btn.danger{background:#fee2e2;color:#991b1b}
.toko-actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:15px}
.toko-history{overflow-x:auto;background:white;border:1px solid #eee;border-radius:10px}
.toko-history table{width:100%;min-width:650px;border-collapse:collapse}
.toko-history th,.toko-history td{padding:12px;border-bottom:1px solid #eee;text-align:left;font-size:13px}
.toko-history th{background:#fafafa}
.toko-status{display:inline-block;padding:4px 8px;border-radius:20px;font-size:11px;font-weight:700;white-space:nowrap}
.toko-status.selesai{background:#dcfce7;color:#166534}
.toko-status.diproses{background:#fef3c7;color:#92400e}
.toko-status.gagal{background:#fee2e2;color:#991b1b}
.toko-status.dibatalkan{background:#eee;color:#555}
.toko-btn.cancel-sale{background:#fff0f0;color:#00a968;border:1px solid #e7b7bc}.toko-btn.cancel-sale:disabled{opacity:.55;cursor:wait}
@media(max-width:650px){
 .toko-grid{grid-template-columns:1fr}
 .toko-stat-grid{grid-template-columns:1fr}
 .toko-box{padding:13px}
}
`;
document.head.appendChild(tokoStyle);

let tokoItems = [];
let tokoProductsCache = [];

function setupToko(){
  const page=document.getElementById("modulePage");
  if(!page || document.getElementById("tokoContent"))return;

  const section=document.createElement("section");
  section.id="tokoContent";
  section.className="erp-content";

  section.innerHTML=`
    <div class="erp-toolbar">
      <div>
        <h3>Kasir Transaksi Toko</h3>
        <p class="erp-muted">Pencatatan penjualan dan pembayaran Koperasi Desa.</p>
      </div>
    </div>

    <div class="toko-stat-grid">
      <div class="toko-stat">
        <small>Transaksi Hari Ini</small>
        <strong id="tokoStatCount">0</strong>
      </div>
      <div class="toko-stat">
        <small>Omzet Hari Ini</small>
        <strong id="tokoStatOmzet">Rp0</strong>
      </div>
      <div class="toko-stat">
        <small>Rata-rata Transaksi</small>
        <strong id="tokoStatAverage">Rp0</strong>
      </div>
    </div>

    <div class="toko-box">
      <h3>Transaksi Penjualan Baru</h3>

      <div class="toko-grid">
        <div class="toko-field">
          <label>Nama Pelanggan (Opsional)</label>
          <input id="tokoCustomer" placeholder="Pelanggan umum">
        </div>
        <div class="toko-field">
          <label>Metode Pembayaran</label>
          <select id="tokoPayment">
            <option value="tunai">Tunai</option>
            <option value="transfer">Transfer Bank</option>
            <option value="qris">QRIS</option>
          </select>
        </div>
      </div>

      <h4>Rincian Barang</h4>
      <div class="toko-table-wrap">
        <table class="toko-table">
          <thead>
            <tr>
              <th>Nama Barang</th>
              <th>Jumlah</th>
              <th>Satuan</th>
              <th>Harga (Rp)</th>
              <th>Total</th>
              <th></th>
            </tr>
          </thead>
          <tbody id="tokoItemsBody"></tbody>
        </table>
      </div>

      <div class="toko-actions">
        <button type="button" class="toko-btn secondary" id="tokoAddItem">
          + Tambah Barang
        </button>
      </div>

      <div class="toko-grid" style="margin-top:18px">
        <div class="toko-field">
          <label>Diskon (Rp)</label>
          <input type="number" id="tokoDiscount" min="0" value="0">
        </div>
        <div class="toko-field">
          <label>Uang Diterima (Rp)</label>
          <input type="number" id="tokoPaid" min="0" value="0">
        </div>
      </div>

      <div style="max-width:400px;margin-left:auto">
        <div class="toko-total">
          <span>Subtotal</span>
          <strong id="tokoSubtotal">Rp0</strong>
        </div>
        <div class="toko-total">
          <span>Diskon</span>
          <strong id="tokoDiscountDisplay">Rp0</strong>
        </div>
        <div class="toko-total" style="border-top:1px solid #ddd;padding-top:13px">
          <span>Total Belanja</span>
          <strong class="toko-grand-total" id="tokoGrandTotal">Rp0</strong>
        </div>
        <div class="toko-total">
          <span>Kembalian</span>
          <strong id="tokoChange">Rp0</strong>
        </div>
      </div>

      <div class="toko-field" style="margin-top:12px">
        <label>Catatan (Opsional)</label>
        <input id="tokoNotes" placeholder="Catatan transaksi">
      </div>

      <div id="tokoMessage" class="erp-message"></div>

      <div class="toko-actions">
        <button type="button" class="toko-btn" id="tokoSave">
          Simpan Transaksi
        </button>
        <button type="button" class="toko-btn secondary" id="tokoReset">
          Reset Form
        </button>
      </div>
    </div>

    <div class="toko-box">
      <h3>Riwayat Penjualan</h3>
      <div class="toko-grid">
        <div class="toko-field">
          <label>Filter Tanggal</label>
          <input type="date" id="tokoFilterDate">
        </div>
        <div class="toko-field" style="display:flex;align-items:end">
          <button class="toko-btn" id="tokoFilterButton">Tampilkan</button>
          <button class="toko-btn secondary" id="tokoRefresh" style="margin-left:8px">Reset</button>
        </div>
      </div>
      <div id="tokoHistoryMessage" class="erp-muted"></div>
      <div class="toko-history">
        <table>
          <thead>
            <tr>
              <th>Nomor Transaksi</th>
              <th>Tanggal</th>
              <th>Pelanggan</th>
              <th>Pembayaran</th>
              <th>Total</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody id="tokoHistoryBody">
            <tr><td colspan="7">Memuat data...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  page.appendChild(section);

  document.getElementById("tokoAddItem").onclick=addTokoItem;
  document.getElementById("tokoDiscount").oninput=calculateTokoTotal;
  document.getElementById("tokoPaid").oninput=calculateTokoTotal;
  document.getElementById("tokoSave").onclick=saveTokoSale;
  document.getElementById("tokoReset").onclick=resetTokoForm;
  document.getElementById("tokoFilterButton").onclick=loadTokoHistory;
  document.getElementById("tokoRefresh").onclick=()=>{
    document.getElementById("tokoFilterDate").value="";
    loadTokoHistory();
  };

  loadTokoProducts();
  loadTokoHistory();
}

async function loadTokoProducts(){
  const body=document.getElementById("tokoItemsBody");
  const message=document.getElementById("tokoMessage");
  if(body)body.innerHTML='<tr><td colspan="6">Memuat daftar barang persediaan...</td></tr>';

  try{
    const {data,error}=await supabaseClient
      .from("inventory_products")
      .select("id,product_code,product_name,unit,current_stock,selling_price,purchase_price")
      .eq("is_active",true)
      .order("product_name",{ascending:true});
    if(error)throw error;

    tokoProductsCache=(data||[]).filter(product=>Number(product.current_stock||0)>0);
    tokoItems=[];
    addTokoItem();

    if(!tokoProductsCache.length && message){
      message.textContent="Belum ada barang aktif dengan stok tersedia. Tambahkan stok melalui menu Persediaan Barang.";
      message.className="erp-message erp-error";
    }else if(message){
      message.textContent="";
      message.className="erp-message";
    }
  }catch(error){
    console.error("Gagal memuat barang untuk kasir:",error);
    if(body)body.innerHTML='<tr><td colspan="6">Gagal memuat daftar barang. Periksa koneksi dan hak akses Persediaan Barang.</td></tr>';
    if(message){
      message.textContent="Daftar barang tidak berhasil dimuat: "+(error.message||"Kesalahan tidak diketahui");
      message.className="erp-message erp-error";
    }
  }
}

function addTokoItem(){
  tokoItems.push({
    productId:"",
    name:"",
    quantity:1,
    unit:"",
    price:0
  });
  renderTokoItems();
}

function renderTokoItems(){
  const body=document.getElementById("tokoItemsBody");
  if(!body)return;

  body.innerHTML=tokoItems.map((item,index)=>`
    <tr>
      <td>
        <select aria-label="Pilih nama barang"
          onchange="updateTokoItem(${index},'productId',this.value)">
          <option value="">Pilih barang...</option>
          ${tokoProductsCache.map(product=>`
            <option value="${escapeHTML(product.id)}" ${item.productId===product.id?"selected":""}>
              ${escapeHTML(product.product_code)} - ${escapeHTML(product.product_name)} (Stok: ${Number(product.current_stock||0)} ${escapeHTML(product.unit||"")})
            </option>
          `).join("")}
        </select>
      </td>
      <td>
        <input type="number" min="0.001" step="0.001"
          value="${item.quantity}"
          oninput="updateTokoItem(${index},'quantity',this.value)">
      </td>
      <td>
        <input type="text" value="${escapeHTML(item.unit)}" readonly
          aria-label="Satuan dari master persediaan">
      </td>
      <td>
        <input type="number" min="0" step="1"
          value="${item.price}" readonly
          aria-label="Harga jual dari master persediaan">
      </td>
      <td id="tokoLine${index}">${formatRupiah(item.quantity*item.price)}</td>
      <td>
        <button class="toko-btn danger" type="button"
          onclick="removeTokoItem(${index})">X</button>
      </td>
    </tr>
  `).join("");

  calculateTokoTotal();
}

window.updateTokoItem=function(index,field,value){
  if(!tokoItems[index])return;

  if(field==="productId"){
    const product=tokoProductsCache.find(item=>item.id===value);
    tokoItems[index].productId=product?.id||"";
    tokoItems[index].name=product?.product_name||"";
    tokoItems[index].unit=product?.unit||"";
    tokoItems[index].price=Number(product?.selling_price||0);
    renderTokoItems();
    return;
  }else if(field==="quantity"){
    tokoItems[index].quantity=Math.max(0,Number(value)||0);
  }

  const line=document.getElementById("tokoLine"+index);
  if(line){
    line.textContent=formatRupiah(
      tokoItems[index].quantity*tokoItems[index].price
    );
  }
  calculateTokoTotal();
};

window.removeTokoItem=function(index){
  tokoItems.splice(index,1);
  renderTokoItems();
};

function calculateTokoTotal(){
  const subtotal=tokoItems.reduce(
    (sum,item)=>sum+(item.quantity*item.price),0
  );

  const discount=Math.max(
    0,Number(document.getElementById("tokoDiscount")?.value)||0
  );

  const total=Math.max(0,subtotal-discount);
  const paid=Math.max(
    0,Number(document.getElementById("tokoPaid")?.value)||0
  );

  document.getElementById("tokoSubtotal").textContent=formatRupiah(subtotal);
  document.getElementById("tokoDiscountDisplay").textContent=formatRupiah(discount);
  document.getElementById("tokoGrandTotal").textContent=formatRupiah(total);
  document.getElementById("tokoChange").textContent=formatRupiah(Math.max(0,paid-total));

  return {subtotal,discount,total,paid,change:Math.max(0,paid-total)};
}

function resetTokoForm(){
  tokoItems=[];
  document.getElementById("tokoCustomer").value="";
  document.getElementById("tokoPayment").value="tunai";
  document.getElementById("tokoDiscount").value=0;
  document.getElementById("tokoPaid").value=0;
  document.getElementById("tokoNotes").value="";
  document.getElementById("tokoMessage").textContent="";
  addTokoItem();
}

function makeTokoSaleNumber(){
  const now=new Date();
  const date=now.toISOString().slice(0,10).replace(/-/g,"");
  const time=now.getTime().toString().slice(-6);
  return "TRX-"+date+"-"+time;
}

async function saveTokoSale(){
  const button=document.getElementById("tokoSave");
  const message=document.getElementById("tokoMessage");
  if(!button||button.disabled)return;

  const totals=calculateTokoTotal();
  const items=tokoItems.filter(item=>
    item.productId && item.name.trim() &&
    Number(item.quantity)>0 && Number(item.price)>=0
  );

  if(!window.currentUser?.id){
    message.textContent="Sesi login tidak ditemukan. Silakan login ulang.";
    message.className="erp-message erp-error";
    return;
  }

  if(!["manajer","kasir"].includes(window.currentUser.role)){
    message.textContent="Transaksi toko hanya dapat disimpan oleh Manajer atau Kasir.";
    message.className="erp-message erp-error";
    return;
  }

  if(!items.length){
    message.textContent="Pilih minimal satu barang dari master Persediaan Barang.";
    message.className="erp-message erp-error";
    return;
  }

  if(totals.discount>totals.subtotal || totals.paid<totals.total || totals.total<=0){
    message.textContent=totals.discount>totals.subtotal
      ? "Diskon tidak boleh lebih besar dari subtotal."
      : totals.paid<totals.total
        ? "Uang diterima belum mencukupi total belanja."
        : "Total transaksi harus lebih dari nol.";
    message.className="erp-message erp-error";
    return;
  }

  button.disabled=true;
  button.textContent="Memproses transaksi secara aman...";

  try{
    const saleNumber=makeTokoSaleNumber();
    const sale={
      sale_number:saleNumber,
      customer_name:document.getElementById("tokoCustomer").value.trim()||"Pelanggan Umum",
      payment_method:document.getElementById("tokoPayment").value,
      subtotal:Number(totals.subtotal.toFixed(2)),
      discount:Number(totals.discount.toFixed(2)),
      total:Number(totals.total.toFixed(2)),
      paid_amount:Number(totals.paid.toFixed(2)),
      change_amount:Number(totals.change.toFixed(2)),
      notes:document.getElementById("tokoNotes").value.trim()||null,
      created_by:window.currentUser.id
    };

    const rpcItems=items.map(item=>({
      product_id:item.productId,
      quantity:Number(item.quantity),
      unit_price:Number(item.price)
    }));

    // Satu RPC database menangani header, detail, penguncian stok,
    // mutasi persediaan, dan jurnal dalam satu transaksi PostgreSQL.
    // Jika satu langkah gagal, seluruh transaksi database otomatis rollback.
    const {data:saleId,error}=await supabaseClient.rpc(
      "proses_penjualan_toko_atomik",
      {p_sale:sale,p_items:rpcItems}
    );
    if(error)throw error;
    if(!saleId)throw new Error("Database tidak mengembalikan ID transaksi.");

    const [{data:savedSale,error:savedSaleError},{data:savedItems,error:savedItemsError}]=await Promise.all([
      supabaseClient.from("store_sales").select("*").eq("id",saleId).single(),
      supabaseClient.from("store_sale_items").select("*").eq("sale_id",saleId).order("created_at",{ascending:true})
    ]);
    if(savedSaleError)throw savedSaleError;
    if(savedItemsError)throw savedItemsError;

    message.textContent="Transaksi berhasil disimpan secara atomik: "+saleNumber+". Stok dan jurnal telah diproses oleh database.";
    message.className="erp-message erp-success";
    resetTokoForm();
    await loadTokoHistory();
    if(typeof loadInventoryProducts==="function")await loadInventoryProducts();
    if(typeof loadInventoryMovements==="function")await loadInventoryMovements();
    if(typeof loadDashboard==="function")await loadDashboard();
    printTokoReceipt(savedSale,savedItems||[]);
  }catch(error){
    console.error("Transaksi toko gagal:",error);
    message.textContent="Transaksi tidak disimpan: "+(error.message||"Terjadi kesalahan.");
    message.className="erp-message erp-error";
    await loadTokoHistory();
    if(typeof loadInventoryProducts==="function")await loadInventoryProducts();
    if(typeof loadInventoryMovements==="function")await loadInventoryMovements();
  }finally{
    button.disabled=false;
    button.textContent="Simpan Transaksi";
  }
}

async function loadTokoHistory(){
  const body=document.getElementById("tokoHistoryBody");
  const message=document.getElementById("tokoHistoryMessage");
  if(!body)return;

  body.innerHTML='<tr><td colspan="7">Memuat data...</td></tr>';
  const date=document.getElementById("tokoFilterDate").value;

  let query=supabaseClient
    .from("store_sales")
    .select("*")
    .order("sale_date",{ascending:false})
    .limit(200);

  if(date){
    query=query.gte("sale_date",date+"T00:00:00")
      .lt("sale_date",date+"T23:59:59.999");
  }

  const {data,error}=await query;
  if(error){
    body.innerHTML=`<tr><td colspan="7">${escapeHTML(error.message)}</td></tr>`;
    message.textContent="Gagal mengambil riwayat transaksi.";
    return;
  }

  const sales=data||[];
  const today=new Date().toISOString().slice(0,10);
  const completedToday=sales.filter(s=>
    String(s.sale_date).slice(0,10)===today &&
    String(s.status||"").toLowerCase()==="selesai"
  );
  const omzet=completedToday.reduce((sum,s)=>sum+Number(s.total||0),0);

  document.getElementById("tokoStatCount").textContent=completedToday.length;
  document.getElementById("tokoStatOmzet").textContent=formatRupiah(omzet);
  document.getElementById("tokoStatAverage").textContent=
    formatRupiah(completedToday.length?omzet/completedToday.length:0);

  if(!sales.length){
    body.innerHTML='<tr><td colspan="7" style="text-align:center;padding:20px">Belum ada transaksi penjualan.</td></tr>';
    message.textContent="Belum ada riwayat transaksi.";
    return;
  }

  const paymentLabels={tunai:"Tunai",transfer:"Transfer",qris:"QRIS"};
  const statusLabels={selesai:"Selesai",diproses:"Diproses",gagal:"Gagal",dibatalkan:"Dibatalkan"};
  body.innerHTML=sales.map(sale=>{
    const status=String(sale.status||"").toLowerCase();
    const isCompleted=status==="selesai";
    return `
      <tr>
        <td>${escapeHTML(sale.sale_number||"-")}</td>
        <td>${sale.sale_date?new Date(sale.sale_date).toLocaleString("id-ID"):"-"}</td>
        <td>${escapeHTML(sale.customer_name||"Pelanggan Umum")}</td>
        <td>${paymentLabels[sale.payment_method]||"-"}</td>
        <td>${formatRupiah(sale.total)}</td>
        <td><span class="toko-status ${["selesai","diproses","gagal","dibatalkan"].includes(status)?status:"gagal"}">${statusLabels[status]||"Status tidak dikenal"}</span></td>
        <td>
          ${isCompleted
            ? `<button class="toko-btn secondary" onclick="printTokoReceiptById('${sale.id}')">Cetak</button>
               ${window.currentUser?.role==="manajer"
                 ? `<button type="button" class="toko-btn cancel-sale" data-cancel-sale="${escapeHTML(sale.id)}" data-sale-number="${escapeHTML(sale.sale_number||"")}">Batalkan</button>`
                 : ""}`
            : '<span class="erp-muted">-</span>'}
        </td>
      </tr>
    `;
  }).join("");

  body.querySelectorAll("[data-cancel-sale]").forEach(button=>{
    button.addEventListener("click",()=>{
      cancelTokoSale(button.dataset.cancelSale,button.dataset.saleNumber,button);
    });
  });

  const completedCount=sales.filter(s=>String(s.status||"").toLowerCase()==="selesai").length;
  message.textContent="Menampilkan "+sales.length+" transaksi; "+completedCount+" selesai. Transaksi gagal/diproses tidak masuk omzet.";
}

// PEMBATALAN TRANSAKSI TOKO
// Proses stok dan jurnal dijalankan secara atomik melalui RPC database.
async function cancelTokoSale(saleId,saleNumber,button){
  if(window.currentUser?.role!=="manajer"){
    alert("Hanya Manajer KDMP yang dapat membatalkan transaksi.");
    return;
  }
  if(!saleId)return;
  const reason=prompt("Alasan pembatalan transaksi "+(saleNumber||"ini")+":","Pembatalan transaksi");
  if(reason===null)return;
  if(!reason.trim()){
    alert("Alasan pembatalan wajib diisi.");
    return;
  }
  if(reason.trim().length>500){
    alert("Alasan pembatalan maksimal 500 karakter.");
    return;
  }
  const confirmed=confirm(
    "Yakin batalkan transaksi "+(saleNumber||"ini")+"?\\n"+
    "Stok akan dikembalikan dan jurnal penjualan akan dibuatkan jurnal pembalik.\\n"+
    "Tindakan ini tidak dapat diulang."
  );
  if(!confirmed)return;
  if(button){button.disabled=true;button.textContent="Memproses...";}
  try{
    const {data,error}=await supabaseClient.rpc("batalkan_transaksi_toko",{
      p_sale_id:saleId,
      p_reason:reason.trim()
    });
    if(error)throw error;
    if(data?.success===false)throw new Error(data.message||"Pembatalan tidak berhasil.");
    const journalText=data?.journal_reversed
      ? " Jurnal pembalik berhasil dibuat."
      : " Perhatian: jurnal penjualan tidak ditemukan; periksa jurnal secara manual.";
    alert("Transaksi "+(saleNumber||"")+" berhasil dibatalkan. Stok telah dikembalikan."+journalText);
    await loadTokoHistory();
    if(typeof loadInventoryProducts==="function")await loadInventoryProducts();
    if(typeof loadInventoryMovements==="function")await loadInventoryMovements();
    if(typeof loadDashboard==="function")await loadDashboard();
  }catch(error){
    console.error("Pembatalan transaksi toko gagal:",error);
    alert("Pembatalan gagal: "+(error.message||"Kesalahan tidak diketahui")+
      "\\nPastikan SQL fitur pembatalan sudah dijalankan di Supabase.");
    if(button){button.disabled=false;button.textContent="Batalkan";}
  }
}
window.cancelTokoSale=cancelTokoSale;

window.printTokoReceiptById=async function(id){
  const {data:sale,error}=await supabaseClient
    .from("store_sales")
    .select("*")
    .eq("id",id)
    .single();

  if(error){
    alert("Gagal mengambil transaksi: "+error.message);
    return;
  }
  if(String(sale.status||"").toLowerCase()!=="selesai"){
    alert("Transaksi ini berstatus "+(sale.status||"tidak diketahui")+" dan tidak dapat dicetak sebagai penjualan berhasil.");
    return;
  }

  const {data:items,itemError}=await supabaseClient
    .from("store_sale_items")
    .select("*")
    .eq("sale_id",id);

  if(itemError){
    alert("Gagal mengambil rincian barang.");
    return;
  }

  printTokoReceipt(sale,items||[]);
};

function printTokoReceipt(sale,items){
  const win=window.open("","_blank","width=420,height=650");

  if(!win){
    alert("Izinkan pop-up browser untuk mencetak struk.");
    return;
  }

  const rows=items.map(item=>`
    <tr>
      <td>${escapeHTML(item.product_name)}<br>
      ${item.quantity} ${escapeHTML(item.unit)} x ${formatRupiah(item.unit_price)}</td>
      <td style="text-align:right">${formatRupiah(item.line_total)}</td>
    </tr>
  `).join("");

  win.document.write(`
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>Struk ${escapeHTML(sale.sale_number)}</title>
      <style>
        body{font-family:Arial,sans-serif;width:300px;margin:20px auto;font-size:12px;color:#111}
        h2{text-align:center;font-size:18px;margin-bottom:4px}
        p{text-align:center;margin:4px}
        table{width:100%;border-collapse:collapse;margin-top:15px}
        td{padding:6px 0;border-bottom:1px dashed #ccc;vertical-align:top}
        .total{font-weight:bold;font-size:15px}
        .center{text-align:center;margin-top:20px}
        @media print{button{display:none}}
      </style>
    </head>
    <body>
      <h2>KOPERASI DESA</h2>
      <p>Struk Penjualan</p>
      <hr>
      <p style="text-align:left">No: ${escapeHTML(sale.sale_number)}</p>
      <p style="text-align:left">Tanggal: ${new Date(sale.sale_date).toLocaleString("id-ID")}</p>
      <p style="text-align:left">Pelanggan: ${escapeHTML(sale.customer_name||"Pelanggan Umum")}</p>
      <hr>
      <table>${rows}</table>
      <hr>
      <p style="text-align:right">Subtotal: ${formatRupiah(sale.subtotal)}</p>
      <p style="text-align:right">Diskon: ${formatRupiah(sale.discount)}</p>
      <p class="total" style="text-align:right">TOTAL: ${formatRupiah(sale.total)}</p>
      <p style="text-align:right">Bayar: ${formatRupiah(sale.paid_amount)}</p>
      <p style="text-align:right">Kembali: ${formatRupiah(sale.change_amount)}</p>
      <p class="center">Terima kasih telah berbelanja!</p>
      <script>window.onload=function(){window.print()}<\/script>
    </body>
    </html>
  `);

  win.document.close();
}

// Hubungkan ke menu toko yang sudah ada
const previousTokoShowPage=window.showPage;

window.showPage=function(page,button){
  const content=document.getElementById("tokoContent");

  if(content)content.style.display="none";

  previousTokoShowPage(page,button);

  if(page==="toko"){
    setupToko();
    const toko=document.getElementById("tokoContent");
    if(toko)toko.style.display="block";
    loadTokoHistory();
  }
};
document.getElementById("operationalMenuButton")?.remove();

// ==========================================
// MODUL DATA ANGGOTA KOPERASI DESA
// ==========================================

const memberStyle = document.createElement("style");
memberStyle.textContent = `
.member-wrap{display:grid;gap:17px}
.member-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:13px}
.member-card{background:white;border:1px solid #e9e9e9;border-radius:12px;padding:17px}
.member-card small{display:block;color:#777;margin-bottom:8px}
.member-card strong{font-size:22px}
.member-panel{background:white;border:1px solid #e9e9e9;border-radius:12px;padding:20px}
.member-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px}
.member-field{margin-bottom:13px}
.member-field label{display:block;font-size:13px;font-weight:600;margin-bottom:7px;color:#555}
.member-field input,.member-field select,.member-field textarea{
  width:100%;box-sizing:border-box;padding:11px;border:1px solid #ddd;
  border-radius:7px;font:inherit;background:white
}
.member-actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:12px}
.member-btn{border:0;border-radius:7px;padding:10px 15px;background:#00a968;color:white;font-weight:600;cursor:pointer}
.member-btn.gray{background:#eee;color:#333}
.member-btn:disabled{opacity:.6;cursor:not-allowed}
.member-search{max-width:360px;width:100%;padding:11px;border:1px solid #ddd;border-radius:7px}
.member-table-wrap{overflow-x:auto;border:1px solid #eee;border-radius:10px}
.member-table{width:100%;min-width:750px;border-collapse:collapse}
.member-table th,.member-table td{padding:12px;border-bottom:1px solid #eee;text-align:left;font-size:13px}
.member-table th{background:#fafafa;color:#666}
.member-status{display:inline-block;padding:5px 9px;border-radius:20px;background:#e8f8ef;color:#16834e;font-size:11px;font-weight:bold}
.member-status.inactive{background:#fee2e2;color:#991b1b}
.member-message{font-size:13px;margin:10px 0}
@media(max-width:650px){
 .member-stats{grid-template-columns:1fr}
 .member-grid{grid-template-columns:1fr}
 .member-panel{padding:14px}
}
`;
document.head.appendChild(memberStyle);

let memberCache = [];
let editingMemberId = null;

function setupMemberManagement(){
  const page = document.getElementById("modulePage");
  if(!page || document.getElementById("memberContent")) return;

  const section = document.createElement("section");
  section.id = "memberContent";
  section.className = "erp-content";

  section.innerHTML = `
    <div class="member-wrap">

      <div class="erp-toolbar">
        <div>
          <h3>Data Anggota Koperasi</h3>
          <p class="erp-muted">Kelola identitas dan status keanggotaan Koperasi Desa.</p>
        </div>
        <button class="member-btn" id="memberAddButton">+ Tambah Anggota</button>
      </div>

      <div class="member-stats">
        <div class="member-card">
          <small>Total Anggota</small>
          <strong id="memberTotal">0</strong>
        </div>
        <div class="member-card">
          <small>Anggota Aktif</small>
          <strong id="memberActive">0</strong>
        </div>
        <div class="member-card">
          <small>Anggota Nonaktif</small>
          <strong id="memberInactive">0</strong>
        </div>
      </div>

      <div class="member-panel" id="memberFormPanel" style="display:none">
        <h3 id="memberFormTitle">Tambah Anggota Baru</h3>

        <form id="memberForm">
          <div class="member-grid">
            <div class="member-field">
              <label>Nomor Anggota</label>
              <input id="memberNumber" required placeholder="Contoh: KDMP-0001">
            </div>

            <div class="member-field">
              <label>Nama Lengkap</label>
              <input id="memberName" required placeholder="Nama sesuai identitas">
            </div>

            <div class="member-field">
              <label>Nomor HP</label>
              <input id="memberPhone" placeholder="08xxxxxxxxxx">
            </div>

            <div class="member-field">
              <label>NIK (Opsional)</label>
              <input id="memberNIK" maxlength="16" inputmode="numeric"
                placeholder="16 digit NIK">
            </div>

            <div class="member-field">
              <label>Tanggal Bergabung</label>
              <input id="memberJoinDate" type="date" required>
            </div>

            <div class="member-field">
              <label>Status Anggota</label>
              <select id="memberStatus">
                <option value="aktif">Aktif</option>
                <option value="nonaktif">Nonaktif</option>
              </select>
            </div>
          </div>

          <div class="member-field">
            <label>Alamat</label>
            <textarea id="memberAddress" rows="3"
              placeholder="Alamat lengkap anggota"></textarea>
          </div>

          <div class="member-field">
            <label>Catatan (Opsional)</label>
            <textarea id="memberNotes" rows="2"
              placeholder="Catatan tambahan"></textarea>
          </div>

          <div id="memberFormMessage" class="member-message"></div>

          <div class="member-actions">
            <button type="submit" class="member-btn" id="memberSaveButton">
              Simpan Anggota
            </button>
            <button type="button" class="member-btn gray" id="memberCancelButton">
              Batal
            </button>
          </div>
        </form>
      </div>

      <div class="member-panel">
        <div class="erp-toolbar">
          <div>
            <h3>Daftar Anggota</h3>
            <p class="erp-muted">Data anggota yang terdaftar di koperasi.</p>
          </div>
          <input class="member-search" id="memberSearch"
            placeholder="Cari nama atau nomor anggota...">
        </div>

        <div id="memberListMessage" class="member-message">
          Memuat data anggota...
        </div>

        <div class="member-table-wrap">
          <table class="member-table">
            <thead>
              <tr>
                <th>No. Anggota</th>
                <th>Nama Lengkap</th>
                <th>Nomor HP</th>
                <th>Tanggal Bergabung</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody id="memberTableBody">
              <tr><td colspan="7">Memuat data...</td></tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `;

  page.appendChild(section);

  document.getElementById("memberAddButton").onclick =
    openMemberForm;

  document.getElementById("memberCancelButton").onclick =
    closeMemberForm;

  document.getElementById("memberForm").onsubmit =
    saveMember;

  document.getElementById("memberSearch").oninput =
    filterMembers;

  loadMembers();
}

function openMemberForm(member=null){
  editingMemberId = member?.id || null;

  const form = document.getElementById("memberForm");
  form.reset();

  document.getElementById("memberFormTitle").textContent =
    member ? "Edit Data Anggota" : "Tambah Anggota Baru";

  document.getElementById("memberNumber").value =
    member?.member_number || "";

  document.getElementById("memberName").value =
    member?.full_name || "";

  document.getElementById("memberPhone").value =
    member?.phone || "";

  document.getElementById("memberNIK").value =
    member?.national_id || "";

  document.getElementById("memberAddress").value =
    member?.address || "";

  document.getElementById("memberJoinDate").value =
    member?.join_date || new Date().toISOString().slice(0,10);

  document.getElementById("memberStatus").value =
    member?.status || "aktif";

  document.getElementById("memberNotes").value =
    member?.notes || "";

  document.getElementById("memberFormMessage").textContent = "";

  document.getElementById("memberFormPanel").style.display = "block";
  document.getElementById("memberFormPanel").scrollIntoView({
    behavior:"smooth"
  });
}

function closeMemberForm(){
  document.getElementById("memberFormPanel").style.display = "none";
  editingMemberId = null;
}

async function saveMember(event){
  event.preventDefault();

  const button = document.getElementById("memberSaveButton");
  const message = document.getElementById("memberFormMessage");

  const number = document.getElementById("memberNumber").value.trim();
  const name = document.getElementById("memberName").value.trim();
  const nik = document.getElementById("memberNIK").value.trim();

  if(!number || !name){
    message.textContent = "Nomor anggota dan nama wajib diisi.";
    return;
  }

  if(nik && !/^\d{16}$/.test(nik)){
    message.textContent = "NIK harus terdiri dari 16 digit angka.";
    return;
  }

  const record = {
    member_number:number,
    full_name:name,
    national_id:nik || null,
    phone:document.getElementById("memberPhone").value.trim() || null,
    address:document.getElementById("memberAddress").value.trim() || null,
    join_date:document.getElementById("memberJoinDate").value,
    status:document.getElementById("memberStatus").value,
    notes:document.getElementById("memberNotes").value.trim() || null,
    updated_at:new Date().toISOString()
  };

  button.disabled = true;
  button.textContent = "Menyimpan...";

  try{
    if(editingMemberId){
      const {error} = await supabaseClient
        .from("cooperative_members")
        .update(record)
        .eq("id",editingMemberId);

      if(error) throw error;

    }else{
      record.created_by = window.currentUser?.id || null;

      const {error} = await supabaseClient
        .from("cooperative_members")
        .insert(record);

      if(error) throw error;
    }

    closeMemberForm();
    await loadMembers();

    alert("Data anggota berhasil disimpan.");

  }catch(error){
    message.textContent = "Gagal menyimpan: " + error.message;
    message.style.color = "#b91c1c";

  }finally{
    button.disabled = false;
    button.textContent = "Simpan Anggota";
  }
}

async function loadMembers(){
  const body = document.getElementById("memberTableBody");
  if(!body) return;

  body.innerHTML = '<tr><td colspan="6">Memuat data...</td></tr>';

  const {data,error} = await supabaseClient
    .from("cooperative_members")
    .select("*")
    .order("created_at",{ascending:false});

  if(error){
    body.innerHTML =
      `<tr><td colspan="6">${escapeHTML(error.message)}</td></tr>`;

    document.getElementById("memberListMessage").textContent =
      "Gagal memuat data anggota.";

    return;
  }

  memberCache = data || [];
  renderMembers(memberCache);

  document.getElementById("memberTotal").textContent =
    memberCache.length;

  document.getElementById("memberActive").textContent =
    memberCache.filter(m=>m.status==="aktif").length;

  document.getElementById("memberInactive").textContent =
    memberCache.filter(m=>m.status==="nonaktif").length;

  document.getElementById("memberListMessage").textContent =
    memberCache.length + " anggota terdaftar.";
}

function renderMembers(members){
  const body = document.getElementById("memberTableBody");
  if(!body) return;

  if(!members.length){
    body.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center;padding:25px">
          Belum ada anggota terdaftar. Klik Tambah Anggota untuk memulai.
        </td>
      </tr>
    `;
    return;
  }

  body.innerHTML = members.map(member=>`
    <tr>
      <td><strong>${escapeHTML(member.member_number)}</strong></td>
      <td>${escapeHTML(member.full_name)}</td>
      <td>${escapeHTML(member.phone || "-")}</td>
      <td>${escapeHTML(member.join_date || "-")}</td>
      <td>
        <span class="member-status ${member.status==="aktif"?"":"inactive"}">
          ${member.status==="aktif"?"Aktif":"Nonaktif"}
        </span>
      </td>
      <td>
        <button class="member-btn gray"
          onclick="editMemberData('${member.id}')">
          Edit
        </button>
        <button class="member-btn"
          onclick="toggleMemberStatus('${member.id}')">
          ${member.status==="aktif"?"Nonaktifkan":"Aktifkan"}
        </button>
      </td>
    </tr>
  `).join("");
}

function filterMembers(){
  const keyword = document.getElementById("memberSearch")
    .value.toLowerCase().trim();

  const filtered = memberCache.filter(member=>
    String(member.member_number).toLowerCase().includes(keyword) ||
    String(member.full_name).toLowerCase().includes(keyword) ||
    String(member.phone || "").toLowerCase().includes(keyword)
  );

  renderMembers(filtered);
}

window.editMemberData = function(id){
  const member = memberCache.find(m=>m.id===id);
  if(member) openMemberForm(member);
};

window.toggleMemberStatus = async function(id){
  const member = memberCache.find(m=>m.id===id);
  if(!member) return;

  const nextStatus = member.status==="aktif"?"nonaktif":"aktif";

  if(!confirm(
    `Ubah status ${member.full_name} menjadi ${nextStatus}?`
  )) return;

  const {error} = await supabaseClient
    .from("cooperative_members")
    .update({
      status:nextStatus,
      updated_at:new Date().toISOString()
    })
    .eq("id",id);

  if(error){
    alert("Gagal mengubah status: "+error.message);
    return;
  }

  await loadMembers();
};

// Hubungkan ke menu Simpanan & Pinjaman yang sudah ada.
const previousMemberShowPage = window.showPage;

window.showPage = function(page,button){
  const content = document.getElementById("memberContent");

  if(content) content.style.display = "none";

  previousMemberShowPage(page,button);

  if(page==="simpanan"){
    setupMemberManagement();

    const memberContent = document.getElementById("memberContent");
    if(memberContent) memberContent.style.display = "block";

    loadMembers();
  }
};

// ==========================================
// MODUL TRANSAKSI SIMPANAN ANGGOTA
// Tetap di dalam menu Simpanan & Pinjaman
// ==========================================

const savingsStyle = document.createElement("style");
savingsStyle.textContent = `
.sav-wrap{display:grid;gap:17px;margin-top:24px}
.sav-panel{background:white;border:1px solid #e9e9e9;border-radius:12px;padding:20px}
.sav-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px}
.sav-field{margin-bottom:13px}
.sav-field label{display:block;font-size:13px;font-weight:600;margin-bottom:7px;color:#555}
.sav-field input,.sav-field select,.sav-field textarea{
 width:100%;box-sizing:border-box;padding:11px;border:1px solid #ddd;
 border-radius:7px;font:inherit;background:white
}
.sav-btn{border:0;border-radius:7px;padding:10px 15px;background:#00a968;color:white;font-weight:600;cursor:pointer}
.sav-btn.gray{background:#eee;color:#333}
.sav-btn:disabled{opacity:.6;cursor:not-allowed}
.sav-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:13px}
.sav-card{background:white;border:1px solid #e9e9e9;border-radius:12px;padding:17px}
.sav-card small{display:block;color:#777;margin-bottom:8px}
.sav-card strong{font-size:19px}
.sav-table-wrap{overflow-x:auto;border:1px solid #eee;border-radius:10px}
.sav-table{width:100%;min-width:750px;border-collapse:collapse}
.sav-table th,.sav-table td{padding:12px;border-bottom:1px solid #eee;text-align:left;font-size:13px}
.sav-table th{background:#fafafa;color:#666}
.sav-message{font-size:13px;margin:10px 0}
.sav-positive{color:#16834e;font-weight:600}
.sav-negative{color:#b91c1c;font-weight:600}
@media(max-width:650px){
 .sav-grid,.sav-stats{grid-template-columns:1fr}
 .sav-panel{padding:14px}
}
`;
document.head.appendChild(savingsStyle);

let savingsTransactionsCache = [];

function setupSavingsManagement(){
  const parent=document.getElementById("memberContent");
  if(!parent || document.getElementById("savingsContent"))return;

  const section=document.createElement("div");
  section.id="savingsContent";
  section.className="sav-wrap";

  section.innerHTML=`
    <div>
      <h2>Transaksi Simpanan</h2>
      <p class="erp-muted">Pencatatan simpanan pokok, wajib, dan sukarela anggota.</p>
    </div>

    <div class="sav-stats">
      <div class="sav-card">
        <small>Total Simpanan Pokok</small>
        <strong id="savTotalPokok">Rp0</strong>
      </div>
      <div class="sav-card">
        <small>Total Simpanan Wajib</small>
        <strong id="savTotalWajib">Rp0</strong>
      </div>
      <div class="sav-card">
        <small>Total Simpanan Sukarela</small>
        <strong id="savTotalSukarela">Rp0</strong>
      </div>
    </div>

    <div class="sav-panel">
      <h3>Catat Transaksi Simpanan</h3>
      <form id="savingsForm">
        <div class="sav-grid">
          <div class="sav-field">
            <label>Anggota</label>
            <select id="savMember" required>
              <option value="">Pilih anggota</option>
            </select>
          </div>
          <div class="sav-field">
            <label>Jenis Simpanan</label>
            <select id="savType" required>
              <option value="pokok">Simpanan Pokok</option>
              <option value="wajib">Simpanan Wajib</option>
              <option value="sukarela">Simpanan Sukarela</option>
            </select>
          </div>
          <div class="sav-field">
            <label>Jenis Transaksi</label>
            <select id="savTransactionType" required>
              <option value="setoran">Setoran</option>
              <option value="penarikan">Penarikan</option>
            </select>
          </div>
          <div class="sav-field">
            <label>Nominal (Rp)</label>
            <input id="savAmount" type="number" min="1" step="1" required placeholder="Masukkan nominal">
          </div>
          <div class="sav-field">
            <label>Tanggal Transaksi</label>
            <input id="savDate" type="date" required>
          </div>
          <div class="sav-field">
            <label>Metode Pembayaran</label>
            <select id="savPaymentMethod">
              <option value="tunai">Tunai</option>
              <option value="transfer">Transfer</option>
              <option value="qris">QRIS</option>
            </select>
          </div>
        </div>
        <div class="sav-field">
          <label>Keterangan (Opsional)</label>
          <input id="savNotes" placeholder="Contoh: Setoran simpanan bulan November">
        </div>
        <div id="savFormMessage" class="sav-message"></div>
        <button type="submit" class="sav-btn" id="savSaveButton">Simpan Transaksi</button>
      </form>
    </div>

    <div class="sav-panel">
      <h3>Saldo Simpanan Anggota</h3>
      <div class="sav-message" id="savBalanceMessage">Memuat saldo...</div>
      <div class="sav-table-wrap">
        <table class="sav-table">
          <thead>
            <tr>
              <th>Nomor Anggota</th>
              <th>Nama Anggota</th>
              <th>Simpanan Pokok</th>
              <th>Simpanan Wajib</th>
              <th>Simpanan Sukarela</th>
              <th>Total Saldo</th>
            </tr>
          </thead>
          <tbody id="savBalanceBody">
            <tr><td colspan="6">Memuat...</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="sav-panel">
      <h3>Riwayat Transaksi Simpanan</h3>
      <div class="sav-message" id="savHistoryMessage">Memuat riwayat...</div>
      <div class="sav-table-wrap">
        <table class="sav-table">
          <thead>
            <tr>
              <th>Nomor Transaksi</th>
              <th>Tanggal</th>
              <th>Anggota</th>
              <th>Jenis Simpanan</th>
              <th>Transaksi</th>
              <th>Nominal</th>
              <th>Metode</th>
            </tr>
          </thead>
          <tbody id="savHistoryBody">
            <tr><td colspan="7">Memuat...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  parent.appendChild(section);
  const savingsForm=document.getElementById("savingsForm");
  if(savingsForm)savingsForm.hidden=!["manajer","admin_keuangan"].includes(window.currentUser?.role);

  document.getElementById("savDate").value=
    new Date().toISOString().slice(0,10);

  document.getElementById("savingsForm").onsubmit=
    saveSavingsTransaction;

  loadSavingsMembers();
  loadSavingsTransactions();
}

async function loadSavingsMembers(){
  const select=document.getElementById("savMember");
  if(!select)return;

  const {data,error}=await supabaseClient
    .from("cooperative_members")
    .select("id,member_number,full_name,status")
    .eq("status","aktif")
    .order("full_name");

  if(error){
    document.getElementById("savFormMessage").textContent=
      "Gagal memuat anggota: "+error.message;
    return;
  }

  select.innerHTML='<option value="">Pilih anggota</option>';

  (data||[]).forEach(member=>{
    const option=document.createElement("option");
    option.value=member.id;
    option.textContent=member.member_number+" - "+member.full_name;
    select.appendChild(option);
  });

  if(!data?.length){
    document.getElementById("savFormMessage").textContent=
      "Belum ada anggota aktif. Tambahkan anggota terlebih dahulu.";
  }
}

async function saveSavingsTransaction(event){
  event.preventDefault();
  if(!["manajer","admin_keuangan"].includes(window.currentUser?.role)){
    const denied=document.getElementById("savFormMessage");
    if(denied)denied.textContent="Hanya Manajer atau Admin Keuangan yang dapat mencatat transaksi simpanan.";
    return;
  }

  const button=document.getElementById("savSaveButton");
  const message=document.getElementById("savFormMessage");

  const memberId=document.getElementById("savMember").value;
  const savingsType=document.getElementById("savType").value;
  const transactionType=document.getElementById("savTransactionType").value;
  const amount=Number(document.getElementById("savAmount").value);
  const date=document.getElementById("savDate").value;

  if(!memberId){
    message.textContent="Pilih anggota terlebih dahulu.";
    return;
  }

  if(!Number.isFinite(amount)||amount<=0){
    message.textContent="Nominal harus lebih besar dari nol.";
    return;
  }

  if(!date){
    message.textContent="Tanggal transaksi wajib diisi.";
    return;
  }

  button.disabled=true;
  button.textContent="Menyimpan...";

  try{
    // Ambil seluruh transaksi anggota untuk menghitung saldo jenis simpanan.
    const {data:existing,error:balanceError}=await supabaseClient
      .from("member_savings_transactions")
      .select("transaction_type,amount")
      .eq("member_id",memberId)
      .eq("savings_type",savingsType);

    if(balanceError)throw balanceError;

    const currentBalance=(existing||[]).reduce((sum,item)=>{
      const value=Number(item.amount)||0;
      return sum+(item.transaction_type==="setoran"?value:-value);
    },0);

    if(transactionType==="penarikan"&&amount>currentBalance){
      throw new Error(
        "Saldo "+savingsType+" tidak mencukupi. Saldo tersedia: "+
        formatRupiah(currentBalance)
      );
    }

    const transactionNumber=
      "SMP-"+Date.now()+"-"+Math.floor(Math.random()*1000);

    const record={
      transaction_number:transactionNumber,
      member_id:memberId,
      savings_type:savingsType,
      transaction_type:transactionType,
      amount:amount,
      transaction_date:new Date(date+"T12:00:00").toISOString(),
      payment_method:document.getElementById("savPaymentMethod").value,
      notes:document.getElementById("savNotes").value.trim()||null,
      created_by:window.currentUser?.id||null
    };

    const {error}=await supabaseClient
      .from("member_savings_transactions")
      .insert(record);

    if(error)throw error;

    document.getElementById("savingsForm").reset();
    document.getElementById("savDate").value=
      new Date().toISOString().slice(0,10);

    message.textContent="Transaksi berhasil disimpan. Nomor: "+transactionNumber;
    message.style.color="#16834e";

    await loadSavingsTransactions();

    alert("Transaksi simpanan berhasil disimpan.");

  }catch(error){
    message.textContent="Gagal menyimpan: "+error.message;
    message.style.color="#b91c1c";
  }finally{
    button.disabled=false;
    button.textContent="Simpan Transaksi";
  }
}

async function loadSavingsTransactions(){
  const historyBody=document.getElementById("savHistoryBody");
  if(!historyBody)return;

  historyBody.innerHTML='<tr><td colspan="7">Memuat...</td></tr>';

  const {data,error}=await supabaseClient
    .from("member_savings_transactions")
    .select("*, cooperative_members(member_number,full_name)")
    .order("transaction_date",{ascending:false})
    .limit(500);

  if(error){
    historyBody.innerHTML=
      `<tr><td colspan="7">${escapeHTML(error.message)}</td></tr>`;
    document.getElementById("savHistoryMessage").textContent=
      "Gagal memuat riwayat transaksi.";
    return;
  }

  savingsTransactionsCache=data||[];

  renderSavingsHistory();
  renderSavingsBalances();
}

function renderSavingsHistory(){
  const body=document.getElementById("savHistoryBody");
  if(!body)return;

  if(!savingsTransactionsCache.length){
    body.innerHTML=
      '<tr><td colspan="7" style="text-align:center;padding:20px">Belum ada transaksi simpanan.</td></tr>';
  }else{
    const types={
      pokok:"Simpanan Pokok",
      wajib:"Simpanan Wajib",
      sukarela:"Simpanan Sukarela"
    };

    body.innerHTML=savingsTransactionsCache.map(item=>{
      const member=item.cooperative_members||{};
      const deposit=item.transaction_type==="setoran";

      return `
        <tr>
          <td>${escapeHTML(item.transaction_number)}</td>
          <td>${new Date(item.transaction_date).toLocaleDateString("id-ID")}</td>
          <td>${escapeHTML(member.full_name||"-")}<br><small>${escapeHTML(member.member_number||"")}</small></td>
          <td>${types[item.savings_type]||item.savings_type}</td>
          <td class="${deposit?"sav-positive":"sav-negative"}">${deposit?"Setoran":"Penarikan"}</td>
          <td>${formatRupiah(item.amount)}</td>
          <td>${escapeHTML(item.payment_method||"-")}</td>
        </tr>
      `;
    }).join("");
  }

  document.getElementById("savHistoryMessage").textContent=
    savingsTransactionsCache.length+" transaksi terakhir ditampilkan.";
}

function renderSavingsBalances(){
  const body=document.getElementById("savBalanceBody");
  if(!body)return;

  const members=memberCache||[];
  const balances={pokok:0,wajib:0,sukarela:0};
  const memberBalances={};

  members.forEach(member=>{
    memberBalances[member.id]={
      member,
      pokok:0,
      wajib:0,
      sukarela:0
    };
  });

  savingsTransactionsCache.forEach(item=>{
    const value=Number(item.amount)||0;
    const signed=item.transaction_type==="setoran"?value:-value;

    if(balances[item.savings_type]!==undefined){
      balances[item.savings_type]+=signed;
    }

    if(memberBalances[item.member_id]&&
       memberBalances[item.member_id][item.savings_type]!==undefined){
      memberBalances[item.member_id][item.savings_type]+=signed;
    }
  });

  document.getElementById("savTotalPokok").textContent=
    formatRupiah(balances.pokok);
  document.getElementById("savTotalWajib").textContent=
    formatRupiah(balances.wajib);
  document.getElementById("savTotalSukarela").textContent=
    formatRupiah(balances.sukarela);

  const rows=Object.values(memberBalances);

  if(!rows.length){
    body.innerHTML=
      '<tr><td colspan="6" style="text-align:center;padding:20px">Belum ada data anggota.</td></tr>';
  }else{
    body.innerHTML=rows.map(row=>{
      const total=row.pokok+row.wajib+row.sukarela;
      return `
        <tr>
          <td>${escapeHTML(row.member.member_number)}</td>
          <td>${escapeHTML(row.member.full_name)}</td>
          <td>${formatRupiah(row.pokok)}</td>
          <td>${formatRupiah(row.wajib)}</td>
          <td>${formatRupiah(row.sukarela)}</td>
          <td><strong>${formatRupiah(total)}</strong></td>
        </tr>
      `;
    }).join("");
  }

  document.getElementById("savBalanceMessage").textContent=
    rows.length+" anggota ditampilkan. Saldo dihitung dari riwayat transaksi.";
}

// Perbarui saldo setelah data anggota dimuat.
const previousMemberLoaderForSavings=loadMembers;

loadMembers=async function(){
  await previousMemberLoaderForSavings();
  if(document.getElementById("savingsContent")){
    renderSavingsBalances();
  }
};

// Sambungkan bagian simpanan ke halaman yang sama.
const previousSavingsShowPage=window.showPage;

window.showPage=function(page,button){
  previousSavingsShowPage(page,button);

  if(page==="simpanan"){
    setupSavingsManagement();
    loadSavingsMembers();
    loadSavingsTransactions();
  }
};

// ==========================================
// MODUL PINJAMAN ANGGOTA KDMP
// ==========================================

const loanStyle = document.createElement("style");
loanStyle.textContent = `
.loan-wrap{display:grid;gap:17px;margin-top:25px}
.loan-panel{background:white;border:1px solid #e9e9e9;border-radius:12px;padding:20px}
.loan-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px}
.loan-field{margin-bottom:13px}
.loan-field label{display:block;font-size:13px;font-weight:600;margin-bottom:7px;color:#555}
.loan-field input,.loan-field select,.loan-field textarea{width:100%;box-sizing:border-box;padding:11px;border:1px solid #ddd;border-radius:7px;font:inherit;background:white}
.loan-btn{border:0;border-radius:7px;padding:10px 15px;background:#00a968;color:white;font-weight:600;cursor:pointer;margin:2px}
.loan-btn.gray{background:#eee;color:#333}
.loan-btn.green{background:#16834e}
.loan-btn:disabled{opacity:.6;cursor:not-allowed}
.loan-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:13px}
.loan-card{background:white;border:1px solid #e9e9e9;border-radius:12px;padding:17px}
.loan-card small{display:block;color:#777;margin-bottom:8px}
.loan-card strong{font-size:19px}
.loan-table-wrap{overflow-x:auto;border:1px solid #eee;border-radius:10px}
.loan-table{width:100%;min-width:850px;border-collapse:collapse}
.loan-table th,.loan-table td{padding:12px;border-bottom:1px solid #eee;text-align:left;font-size:13px}
.loan-table th{background:#fafafa;color:#666}
.loan-message{font-size:13px;margin:10px 0}
.loan-tag{display:inline-block;padding:5px 9px;border-radius:20px;background:#fff2d8;color:#946200;font-size:11px;font-weight:bold}
.loan-tag.approved{background:#e8f8ef;color:#16834e}
.loan-tag.rejected{background:#fee2e2;color:#991b1b}
@media(max-width:650px){.loan-grid,.loan-stats{grid-template-columns:1fr}.loan-panel{padding:14px}}
`;
document.head.appendChild(loanStyle);

let loanCache = [];

function setupLoanManagement(){
  const parent=document.getElementById("memberContent");
  if(!parent || document.getElementById("loanContent"))return;

  const section=document.createElement("div");
  section.id="loanContent";
  section.className="loan-wrap";

  section.innerHTML=`
    <div>
      <h2>Pinjaman Anggota</h2>
      <p class="erp-muted">Pengajuan, persetujuan manajer, pencairan, dan jadwal angsuran.</p>
    </div>

    <div class="loan-stats">
      <div class="loan-card">
        <small>Total Pengajuan</small>
        <strong id="loanCount">0</strong>
      </div>
      <div class="loan-card">
        <small>Pinjaman Disetujui / Dicairkan</small>
        <strong id="loanApprovedCount">0</strong>
      </div>
      <div class="loan-card">
        <small>Total Nilai Pinjaman Dicairkan</small>
        <strong id="loanTotalDisbursed">Rp0</strong>
      </div>
    </div>

    <div class="loan-panel">
      <h3>Pengaturan Jasa Pinjaman</h3>
      <p class="erp-muted">Pengaturan awal. Nilai jasa harus mengikuti keputusan resmi pengurus.</p>
      <div class="loan-grid">
        <div class="loan-field">
          <label>Metode Perhitungan</label>
          <select id="loanDefaultMethod">
            <option value="menurun">Menurun berdasarkan sisa pokok</option>
            <option value="tetap">Tetap berdasarkan pokok awal</option>
          </select>
        </div>
        <div class="loan-field">
          <label>Jasa per Bulan (%)</label>
          <input id="loanDefaultRate" type="number" min="0" max="100" step="0.01" value="0">
        </div>
      </div>
      <button class="loan-btn" id="loanSaveSettings">Simpan Pengaturan</button>
      <div id="loanSettingsMessage" class="loan-message"></div>
    </div>

    <div class="loan-panel">
      <h3>Pengajuan Pinjaman Baru</h3>
      <form id="loanForm">
        <div class="loan-grid">
          <div class="loan-field">
            <label>Anggota</label>
            <select id="loanMember" required>
              <option value="">Pilih anggota</option>
            </select>
          </div>
          <div class="loan-field">
            <label>Jumlah Pinjaman (Rp)</label>
            <input id="loanPrincipal" type="number" min="1" step="1" required placeholder="Contoh: 5000000">
          </div>
          <div class="loan-field">
            <label>Tenor (Bulan)</label>
            <input id="loanTerm" type="number" min="1" max="120" step="1" required value="12">
          </div>
          <div class="loan-field">
            <label>Metode Jasa</label>
            <select id="loanMethod">
              <option value="menurun">Menurun</option>
              <option value="tetap">Tetap</option>
            </select>
          </div>
          <div class="loan-field">
            <label>Jasa per Bulan (%)</label>
            <input id="loanRate" type="number" min="0" max="100" step="0.01" required value="0">
          </div>
          <div class="loan-field">
            <label>Tanggal Pengajuan</label>
            <input id="loanApplicationDate" type="date" required>
          </div>
        </div>
        <div class="loan-field">
          <label>Tujuan Pinjaman</label>
          <textarea id="loanPurpose" rows="2" placeholder="Jelaskan tujuan penggunaan pinjaman"></textarea>
        </div>
        <div class="loan-field">
          <label>Catatan</label>
          <textarea id="loanNotes" rows="2" placeholder="Catatan tambahan"></textarea>
        </div>
        <div id="loanFormMessage" class="loan-message"></div>
        <button type="submit" class="loan-btn" id="loanSubmitButton">Ajukan Pinjaman</button>
      </form>
    </div>

    <div class="loan-panel">
      <h3>Daftar Pinjaman</h3>
      <div id="loanListMessage" class="loan-message">Memuat data pinjaman...</div>
      <div class="loan-table-wrap">
        <table class="loan-table">
          <thead>
            <tr>
              <th>Nomor Pinjaman</th>
              <th>Anggota</th>
              <th>Pokok Pinjaman</th>
              <th>Tenor</th>
              <th>Jasa</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody id="loanTableBody">
            <tr><td colspan="7">Memuat data...</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="loan-panel">
      <h3>Jadwal Angsuran</h3>
      <div id="loanScheduleMessage" class="loan-message">
        Pilih pinjaman yang sudah dicairkan untuk melihat jadwal angsuran.
      </div>
      <div class="loan-table-wrap">
        <table class="loan-table">
          <thead>
            <tr>
              <th>Angsuran</th>
              <th>Jatuh Tempo</th>
              <th>Pokok</th>
              <th>Jasa</th>
              <th>Total Tagihan</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody id="loanScheduleBody">
            <tr><td colspan="6">Belum ada jadwal.</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  parent.appendChild(section);
  const loanForm=document.getElementById("loanForm");
  if(loanForm)loanForm.hidden=!["manajer","admin_keuangan"].includes(window.currentUser?.role);

  document.getElementById("loanApplicationDate").value=todayDate();
  document.getElementById("loanForm").onsubmit=saveLoanApplication;
  document.getElementById("loanSaveSettings").onclick=saveLoanSettings;
  document.getElementById("loanDefaultMethod").onchange=()=>{
    document.getElementById("loanMethod").value=
      document.getElementById("loanDefaultMethod").value;
  };
  document.getElementById("loanDefaultRate").oninput=()=>{
    document.getElementById("loanRate").value=
      document.getElementById("loanDefaultRate").value;
  };

  loadLoanMembers();
  loadLoanSettings();
  loadLoans();
}

async function loadLoanMembers(){
  const select=document.getElementById("loanMember");
  if(!select)return;

  const {data,error}=await supabaseClient
    .from("cooperative_members")
    .select("id,member_number,full_name")
    .eq("status","aktif")
    .order("full_name");

  if(error){
    document.getElementById("loanFormMessage").textContent=
      "Gagal memuat anggota: "+error.message;
    return;
  }

  select.innerHTML='<option value="">Pilih anggota</option>';

  (data||[]).forEach(member=>{
    const option=document.createElement("option");
    option.value=member.id;
    option.textContent=member.member_number+" - "+member.full_name;
    select.appendChild(option);
  });
}

async function loadLoanSettings(){
  const {data,error}=await supabaseClient
    .from("cooperative_finance_settings")
    .select("*")
    .eq("id",1)
    .single();

  if(error){
    document.getElementById("loanSettingsMessage").textContent=
      "Gagal memuat pengaturan: "+error.message;
    return;
  }

  document.getElementById("loanDefaultMethod").value=
    data.default_interest_method;

  document.getElementById("loanMethod").value=
    data.default_interest_method;

  document.getElementById("loanDefaultRate").value=
    data.default_monthly_interest_rate;

  document.getElementById("loanRate").value=
    data.default_monthly_interest_rate;
}

async function saveLoanSettings(){
  if(window.currentUser?.role!=="manajer"){
    alert("Hanya manajer yang dapat mengubah pengaturan jasa pinjaman.");
    return;
  }

  const method=document.getElementById("loanDefaultMethod").value;
  const rate=Number(document.getElementById("loanDefaultRate").value);

  if(!Number.isFinite(rate)||rate<0||rate>100){
    alert("Persentase jasa harus antara 0 sampai 100.");
    return;
  }

  const button=document.getElementById("loanSaveSettings");
  const message=document.getElementById("loanSettingsMessage");
  button.disabled=true;
  button.textContent="Menyimpan...";

  try{
    const {error}=await supabaseClient
      .from("cooperative_finance_settings")
      .update({
        default_interest_method:method,
        default_monthly_interest_rate:rate,
        updated_by:window.currentUser.id,
        updated_at:new Date().toISOString()
      })
      .eq("id",1);

    if(error)throw error;

    document.getElementById("loanMethod").value=method;
    document.getElementById("loanRate").value=rate;
    message.textContent="Pengaturan jasa berhasil disimpan.";
    message.style.color="#16834e";

  }catch(error){
    message.textContent="Gagal menyimpan: "+error.message;
    message.style.color="#b91c1c";
  }finally{
    button.disabled=false;
    button.textContent="Simpan Pengaturan";
  }
}

async function saveLoanApplication(event){
  event.preventDefault();
  if(!["manajer","admin_keuangan"].includes(window.currentUser?.role)){
    const denied=document.getElementById("loanFormMessage");
    if(denied)denied.textContent="Hanya Manajer atau Admin Keuangan yang dapat mengajukan pinjaman.";
    return;
  }

  const message=document.getElementById("loanFormMessage");
  const button=document.getElementById("loanSubmitButton");

  const memberId=document.getElementById("loanMember").value;
  const principal=Number(document.getElementById("loanPrincipal").value);
  const term=Number(document.getElementById("loanTerm").value);
  const rate=Number(document.getElementById("loanRate").value);
  const method=document.getElementById("loanMethod").value;
  const date=document.getElementById("loanApplicationDate").value;

  if(!memberId){
    message.textContent="Pilih anggota terlebih dahulu.";
    return;
  }

  if(!Number.isFinite(principal)||principal<=0||
     !Number.isInteger(term)||term<1||term>120||
     !Number.isFinite(rate)||rate<0||rate>100||!date){
    message.textContent="Periksa kembali jumlah pinjaman, tenor, jasa, dan tanggal.";
    return;
  }

  button.disabled=true;
  button.textContent="Mengirim pengajuan...";

  try{
    const loanNumber="PJM-"+Date.now();

    const {error}=await supabaseClient
      .from("member_loans")
      .insert({
        loan_number:loanNumber,
        member_id:memberId,
        application_date:date,
        principal_amount:principal,
        term_months:term,
        interest_method:method,
        monthly_interest_rate:rate,
        purpose:document.getElementById("loanPurpose").value.trim()||null,
        notes:document.getElementById("loanNotes").value.trim()||null,
        status:"diajukan",
        created_by:window.currentUser?.id||null
      });

    if(error)throw error;

    document.getElementById("loanForm").reset();
    document.getElementById("loanApplicationDate").value=todayDate();
    document.getElementById("loanTerm").value=12;
    document.getElementById("loanMethod").value=
      document.getElementById("loanDefaultMethod").value;
    document.getElementById("loanRate").value=
      document.getElementById("loanDefaultRate").value;

    message.textContent="Pengajuan berhasil dibuat: "+loanNumber;
    message.style.color="#16834e";

    await loadLoans();
    alert("Pengajuan pinjaman berhasil disimpan dan menunggu persetujuan manajer.");

  }catch(error){
    message.textContent="Gagal mengajukan pinjaman: "+error.message;
    message.style.color="#b91c1c";
  }finally{
    button.disabled=false;
    button.textContent="Ajukan Pinjaman";
  }
}

async function loadLoans(){
  const body=document.getElementById("loanTableBody");
  if(!body)return;

  body.innerHTML='<tr><td colspan="7">Memuat data...</td></tr>';

  const {data,error}=await supabaseClient
    .from("member_loans")
    .select("*, cooperative_members(member_number,full_name)")
    .order("created_at",{ascending:false});

  if(error){
    body.innerHTML=`<tr><td colspan="7">${escapeHTML(error.message)}</td></tr>`;
    return;
  }

  loanCache=data||[];
  renderLoans();
}

function renderLoans(){
  const body=document.getElementById("loanTableBody");
  if(!body)return;

  const approved=loanCache.filter(x=>
    ["disetujui","dicairkan","lunas"].includes(x.status)
  );

  document.getElementById("loanCount").textContent=loanCache.length;
  document.getElementById("loanApprovedCount").textContent=approved.length;
  document.getElementById("loanTotalDisbursed").textContent=
    formatRupiah(loanCache
      .filter(x=>["dicairkan","lunas"].includes(x.status))
      .reduce((sum,x)=>sum+Number(x.principal_amount),0));

  if(!loanCache.length){
    body.innerHTML='<tr><td colspan="7" style="text-align:center;padding:20px">Belum ada pengajuan pinjaman.</td></tr>';
    document.getElementById("loanListMessage").textContent="Belum ada data pinjaman.";
    return;
  }

  const statusLabels={
    diajukan:"Menunggu Persetujuan",
    disetujui:"Disetujui",
    ditolak:"Ditolak",
    dicairkan:"Sudah Dicairkan",
    lunas:"Lunas",
    dibatalkan:"Dibatalkan"
  };

  body.innerHTML=loanCache.map(loan=>{
    const member=loan.cooperative_members||{};
    const manager=window.currentUser?.role==="manajer";

    let actions="";

    if(loan.status==="diajukan"&&manager){
      actions=`
        <button class="loan-btn green" onclick="approveLoan('${loan.id}')">Setujui</button>
        <button class="loan-btn gray" onclick="rejectLoan('${loan.id}')">Tolak</button>
      `;
    }else if(loan.status==="disetujui"&&manager){
      actions=`<button class="loan-btn green" onclick="disburseLoan('${loan.id}')">Cairkan</button>`;
    }else if(["dicairkan","lunas"].includes(loan.status)){
      actions=`<button class="loan-btn gray" onclick="viewLoanSchedule('${loan.id}')">Jadwal</button>`;
    }else{
      actions="-";
    }

    const tagClass=loan.status==="disetujui"||loan.status==="dicairkan"||loan.status==="lunas"
      ?"approved":loan.status==="ditolak"?"rejected":"";

    return `
      <tr>
        <td><strong>${escapeHTML(loan.loan_number)}</strong></td>
        <td>${escapeHTML(member.full_name||"-")}<br><small>${escapeHTML(member.member_number||"")}</small></td>
        <td>${formatRupiah(loan.principal_amount)}</td>
        <td>${loan.term_months} bulan</td>
        <td>${Number(loan.monthly_interest_rate)}% / bulan<br><small>${loan.interest_method==="menurun"?"Menurun":"Tetap"}</small></td>
        <td><span class="loan-tag ${tagClass}">${statusLabels[loan.status]||loan.status}</span></td>
        <td>${actions}</td>
      </tr>
    `;
  }).join("");

  document.getElementById("loanListMessage").textContent=
    loanCache.length+" pengajuan pinjaman tercatat.";
}

window.approveLoan=async function(id){
  if(window.currentUser?.role!=="manajer"){
    alert("Hanya manajer yang boleh menyetujui pinjaman.");
    return;
  }

  const loan=loanCache.find(x=>x.id===id);
  if(!loan||loan.status!=="diajukan")return;

  if(!confirm("Setujui pengajuan "+loan.loan_number+"?"))return;

  const {error}=await supabaseClient
    .from("member_loans")
    .update({
      status:"disetujui",
      approved_by:window.currentUser.id,
      approved_at:new Date().toISOString(),
      updated_at:new Date().toISOString()
    })
    .eq("id",id)
    .eq("status","diajukan");

  if(error){
    alert("Gagal menyetujui: "+error.message);
    return;
  }

  await loadLoans();
  alert("Pinjaman berhasil disetujui. Selanjutnya dapat dicairkan.");
};

window.rejectLoan=async function(id){
  if(window.currentUser?.role!=="manajer"){
    alert("Hanya manajer yang boleh menolak pinjaman.");
    return;
  }

  const reason=prompt("Masukkan alasan penolakan pinjaman:");
  if(reason===null)return;

  const {error}=await supabaseClient
    .from("member_loans")
    .update({
      status:"ditolak",
      approved_by:window.currentUser.id,
      approved_at:new Date().toISOString(),
      rejection_reason:reason,
      updated_at:new Date().toISOString()
    })
    .eq("id",id)
    .eq("status","diajukan");

  if(error){
    alert("Gagal menolak: "+error.message);
    return;
  }

  await loadLoans();
  alert("Pengajuan pinjaman ditolak.");
};

function addMonthsToDate(dateString,months){
  const date=new Date(dateString+"T12:00:00");
  const originalDay=date.getDate();
  date.setDate(1);
  date.setMonth(date.getMonth()+months);
  const lastDay=new Date(date.getFullYear(),date.getMonth()+1,0).getDate();
  date.setDate(Math.min(originalDay,lastDay));
  return date.toISOString().slice(0,10);
}

function calculateLoanSchedule(loan){
  const principal=Number(loan.principal_amount);
  const term=Number(loan.term_months);
  const rate=Number(loan.monthly_interest_rate)/100;
  const method=loan.interest_method;

  const basePrincipal=Math.floor(principal/term);
  let remaining=principal;
  const schedule=[];

  for(let i=1;i<=term;i++){
    const principalDue=i===term
      ?remaining
      :basePrincipal;

    const interestDue=method==="menurun"
      ?remaining*rate
      :principal*rate;

    const roundedPrincipal=Math.round(principalDue);
    const roundedInterest=Math.round(interestDue);

    schedule.push({
      installment_number:i,
      due_date:addMonthsToDate(loan.disbursed_at.slice(0,10),i),
      principal_due:roundedPrincipal,
      service_due:roundedInterest,
      total_due:roundedPrincipal+roundedInterest,
      paid_amount:0,
      status:"belum_bayar"
    });

    remaining-=principalDue;
  }

  return schedule;
}

window.disburseLoan=async function(id){
  if(window.currentUser?.role!=="manajer"){
    alert("Hanya manajer yang boleh mencairkan pinjaman.");
    return;
  }

  const loan=loanCache.find(x=>x.id===id);
  if(!loan||loan.status!=="disetujui")return;

  if(!confirm(
    "Cairkan pinjaman "+loan.loan_number+
    " sebesar "+formatRupiah(loan.principal_amount)+"?"
  ))return;

  try{
    const disbursedAt=new Date().toISOString();

    const {data:updated,error:updateError}=await supabaseClient
      .from("member_loans")
      .update({
        status:"dicairkan",
        disbursed_by:window.currentUser.id,
        disbursed_at:disbursedAt,
        updated_at:disbursedAt
      })
      .eq("id",id)
      .eq("status","disetujui")
      .select()
      .single();

    if(updateError)throw updateError;

    const schedule=calculateLoanSchedule(updated);

    const records=schedule.map(item=>({
      ...item,
      loan_id:id
    }));

    const {error:scheduleError}=await supabaseClient
      .from("loan_installments")
      .insert(records);

    if(scheduleError){
      // Kembalikan status jika pembuatan jadwal gagal.
      await supabaseClient
        .from("member_loans")
        .update({
          status:"disetujui",
          disbursed_by:null,
          disbursed_at:null,
          updated_at:new Date().toISOString()
        })
        .eq("id",id);

      throw scheduleError;
    }

    await loadLoans();
    await viewLoanSchedule(id);

    alert("Pinjaman berhasil dicairkan dan jadwal angsuran dibuat.");

  }catch(error){
    alert("Gagal mencairkan pinjaman: "+error.message);
  }
};

window.viewLoanSchedule=async function(loanId){
  const body=document.getElementById("loanScheduleBody");
  const message=document.getElementById("loanScheduleMessage");

  body.innerHTML='<tr><td colspan="6">Memuat jadwal...</td></tr>';

  const {data,error}=await supabaseClient
    .from("loan_installments")
    .select("*")
    .eq("loan_id",loanId)
    .order("installment_number");

  if(error){
    message.textContent="Gagal memuat jadwal: "+error.message;
    return;
  }

  if(!data?.length){
    body.innerHTML='<tr><td colspan="6">Belum ada jadwal angsuran.</td></tr>';
    message.textContent="Jadwal belum tersedia.";
    return;
  }

  body.innerHTML=data.map(item=>`
    <tr>
      <td>Angsuran ke-${item.installment_number}</td>
      <td>${escapeHTML(item.due_date)}</td>
      <td>${formatRupiah(item.principal_due)}</td>
      <td>${formatRupiah(item.service_due)}</td>
      <td><strong>${formatRupiah(item.total_due)}</strong></td>
      <td>${escapeHTML(item.status)}</td>
    </tr>
  `).join("");

  message.textContent=data.length+" jadwal angsuran ditemukan.";
};

// Hubungkan ke halaman Simpanan & Pinjaman yang sudah ada.
const previousLoanShowPage=window.showPage;

window.showPage=function(page,button){
  previousLoanShowPage(page,button);

  if(page==="simpanan"){
    setupLoanManagement();
    loadLoanMembers();
    loadLoanSettings();
    loadLoans();
  }
};

/* ==========================================
   PEMBAYARAN ANGSURAN PINJAMAN KDMP
   ========================================== */

let selectedInstallmentForPayment = null;

function setupLoanPaymentUI() {
  const scheduleBody = document.getElementById("loanScheduleBody");
  if (!scheduleBody) return;

  const table = scheduleBody.closest("table");
  if (table && table.querySelector("thead tr")) {
    const header = table.querySelector("thead tr");
    if (!header.querySelector(".loan-payment-header")) {
      const th = document.createElement("th");
      th.className = "loan-payment-header";
      th.textContent = "Aksi";
      header.appendChild(th);
    }
  }

  if (document.getElementById("loanPaymentFormPanel")) return;

  const schedulePanel = scheduleBody.closest(".loan-panel");
  if (!schedulePanel) return;

  const panel = document.createElement("div");
  panel.id = "loanPaymentFormPanel";
  panel.className = "loan-panel";
  panel.style.display = "none";

  panel.innerHTML = `
    <h3>Bayar Angsuran</h3>
    <p id="loanPaymentInfo" class="loan-message"></p>

    <form id="loanPaymentForm">
      <div class="loan-grid">
        <div class="loan-field">
          <label>Nominal Pembayaran (Rp)</label>
          <input
            id="loanPaymentAmount"
            type="number"
            min="1"
            step="1"
            required
            placeholder="Masukkan nominal"
          >
        </div>

        <div class="loan-field">
          <label>Metode Pembayaran</label>
          <select id="loanPaymentMethod" required>
            <option value="tunai">Tunai</option>
            <option value="transfer">Transfer</option>
            <option value="qris">QRIS</option>
          </select>
        </div>
      </div>

      <div class="loan-field">
        <label>Catatan</label>
        <textarea
          id="loanPaymentNotes"
          rows="2"
          placeholder="Catatan pembayaran (opsional)"
        ></textarea>
      </div>

      <div id="loanPaymentMessage" class="loan-message"></div>

      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button type="submit" class="loan-btn" id="loanPaymentSubmit">
          Simpan Pembayaran
        </button>
        <button
          type="button"
          class="loan-btn gray"
          onclick="closeLoanPaymentForm()"
        >
          Batal
        </button>
      </div>
    </form>
  `;

  schedulePanel.appendChild(panel);

  const history = document.createElement("div");
  history.id = "loanPaymentHistoryPanel";
  history.className = "loan-panel";
  history.innerHTML = `
    <h3>Riwayat Pembayaran Angsuran</h3>
    <div id="loanPaymentHistoryMessage" class="loan-message">
      Pilih jadwal pinjaman untuk melihat riwayat pembayaran.
    </div>
    <div class="loan-table-wrap">
      <table class="loan-table">
        <thead>
          <tr>
            <th>Nomor Pembayaran</th>
            <th>Angsuran</th>
            <th>Tanggal</th>
            <th>Metode</th>
            <th>Nominal</th>
            <th>Catatan</th>
          </tr>
        </thead>
        <tbody id="loanPaymentHistoryBody">
          <tr><td colspan="6">Belum ada riwayat.</td></tr>
        </tbody>
      </table>
    </div>
  `;

  schedulePanel.after(history);

  document.getElementById("loanPaymentForm").onsubmit =
    saveLoanInstallmentPayment;
}

window.closeLoanPaymentForm = function () {
  const panel = document.getElementById("loanPaymentFormPanel");
  if (panel) panel.style.display = "none";

  selectedInstallmentForPayment = null;
};

window.openLoanPaymentForm = function (
  installmentId,
  installmentNumber,
  totalDue,
  paidAmount
) {
  setupLoanPaymentUI();

  const remaining = Number(totalDue) - Number(paidAmount);

  if (remaining <= 0) {
    alert("Angsuran ini sudah lunas.");
    return;
  }

  selectedInstallmentForPayment = installmentId;

  document.getElementById("loanPaymentInfo").innerHTML =
    "Angsuran ke-" + installmentNumber +
    "<br>Total tagihan: <strong>" + formatRupiah(totalDue) +
    "</strong><br>Sudah dibayar: <strong>" + formatRupiah(paidAmount) +
    "</strong><br>Sisa tagihan: <strong>" + formatRupiah(remaining) +
    "</strong>";

  document.getElementById("loanPaymentAmount").value = remaining;
  document.getElementById("loanPaymentAmount").max = remaining;
  document.getElementById("loanPaymentMethod").value = "tunai";
  document.getElementById("loanPaymentNotes").value = "";
  document.getElementById("loanPaymentMessage").textContent = "";

  const panel = document.getElementById("loanPaymentFormPanel");
  panel.style.display = "block";
  panel.scrollIntoView({ behavior: "smooth", block: "center" });
};

async function saveLoanInstallmentPayment(event) {
  event.preventDefault();
  if(!["manajer","admin_keuangan"].includes(window.currentUser?.role)){
    const denied=document.getElementById("loanPaymentMessage");
    if(denied)denied.textContent="Hanya Manajer atau Admin Keuangan yang dapat mencatat pembayaran angsuran.";
    return;
  }

  const installmentId = selectedInstallmentForPayment;
  if (!installmentId) {
    alert("Pilih angsuran terlebih dahulu.");
    return;
  }

  const amount = Number(
    document.getElementById("loanPaymentAmount").value
  );

  const method = document.getElementById("loanPaymentMethod").value;
  const notes = document.getElementById("loanPaymentNotes").value.trim();
  const message = document.getElementById("loanPaymentMessage");
  const button = document.getElementById("loanPaymentSubmit");

  if (!Number.isFinite(amount) || amount <= 0) {
    message.textContent = "Nominal pembayaran harus lebih dari nol.";
    return;
  }

  button.disabled = true;
  button.textContent = "Menyimpan...";

  try {
    const paymentNumber =
      "ANG-" + Date.now() + "-" +
      Math.floor(Math.random() * 1000);

    const { data, error } = await supabaseClient.rpc(
      "pay_loan_installment",
      {
        p_payment_number: paymentNumber,
        p_installment_id: installmentId,
        p_amount: amount,
        p_payment_method: method,
        p_notes: notes || null
      }
    );

    if (error) throw error;

    message.textContent =
      "Pembayaran berhasil disimpan. Nomor: " + paymentNumber;
    message.style.color = "#16834e";

    selectedInstallmentForPayment = null;

    await loadLoans();

    if (window.activeLoanScheduleId) {
      await window.viewLoanSchedule(window.activeLoanScheduleId);
    }

    alert(
      "Pembayaran angsuran berhasil dicatat!\n" +
      "Nomor: " + paymentNumber +
      "\nNominal: " + formatRupiah(amount)
    );

    document.getElementById("loanPaymentFormPanel").style.display = "none";

  } catch (error) {
    message.textContent = "Gagal menyimpan pembayaran: " + error.message;
    message.style.color = "#b91c1c";
  } finally {
    button.disabled = false;
    button.textContent = "Simpan Pembayaran";
  }
}

window.viewLoanSchedule = async function (loanId) {
  setupLoanPaymentUI();

  window.activeLoanScheduleId = loanId;

  const body = document.getElementById("loanScheduleBody");
  const message = document.getElementById("loanScheduleMessage");

  body.innerHTML =
    '<tr><td colspan="7">Memuat jadwal...</td></tr>';

  document.getElementById("loanPaymentFormPanel").style.display = "none";

  const { data, error } = await supabaseClient
    .from("loan_installments")
    .select("*")
    .eq("loan_id", loanId)
    .order("installment_number");

  if (error) {
    message.textContent = "Gagal memuat jadwal: " + error.message;
    return;
  }

  if (!data || !data.length) {
    body.innerHTML =
      '<tr><td colspan="7">Belum ada jadwal angsuran.</td></tr>';
    message.textContent = "Jadwal belum tersedia.";
    return;
  }

  let totalTagihan = 0;
  let totalTerbayar = 0;
  let totalSisa = 0;

  body.innerHTML = data.map(item => {
    const due = Number(item.total_due);
    const paid = Number(item.paid_amount);
    const remaining = Math.max(0, due - paid);

    totalTagihan += due;
    totalTerbayar += paid;
    totalSisa += remaining;

    const status = remaining <= 0
      ? "Lunas"
      : item.status === "terlambat"
        ? "Terlambat"
        : paid > 0
          ? "Sebagian"
          : "Belum Bayar";

    const action = remaining > 0
      ? `<button
          class="loan-btn green"
          onclick="openLoanPaymentForm(
            '${item.id}',
            ${item.installment_number},
            ${due},
            ${paid}
          )"
        >Bayar</button>`
      : '<span class="loan-tag approved">Lunas</span>';

    return `
      <tr>
        <td>Angsuran ke-${item.installment_number}</td>
        <td>${escapeHTML(item.due_date)}</td>
        <td>${formatRupiah(item.principal_due)}</td>
        <td>${formatRupiah(item.service_due)}</td>
        <td><strong>${formatRupiah(due)}</strong></td>
        <td>${escapeHTML(status)}</td>
        <td>${action}</td>
      </tr>
    `;
  }).join("");

  message.innerHTML = `
    Total tagihan: <strong>${formatRupiah(totalTagihan)}</strong>
    &nbsp; | &nbsp;
    Sudah dibayar: <strong>${formatRupiah(totalTerbayar)}</strong>
    &nbsp; | &nbsp;
    Sisa tagihan: <strong>${formatRupiah(totalSisa)}</strong>
  `;

  await loadLoanPaymentHistory(data);
};

async function loadLoanPaymentHistory(installments) {
  const body = document.getElementById("loanPaymentHistoryBody");
  const message = document.getElementById("loanPaymentHistoryMessage");

  if (!body || !message) return;

  const ids = installments.map(item => item.id);

  if (!ids.length) {
    body.innerHTML =
      '<tr><td colspan="6">Belum ada riwayat pembayaran.</td></tr>';
    return;
  }

  const { data, error } = await supabaseClient
    .from("loan_installment_payments")
    .select("*")
    .in("installment_id", ids)
    .order("payment_date", { ascending: false });

  if (error) {
    body.innerHTML =
      `<tr><td colspan="6">${escapeHTML(error.message)}</td></tr>`;
    message.textContent = "Gagal memuat riwayat pembayaran.";
    return;
  }

  if (!data || !data.length) {
    body.innerHTML =
      '<tr><td colspan="6">Belum ada pembayaran yang tercatat.</td></tr>';
    message.textContent = "Belum ada riwayat pembayaran.";
    return;
  }

  const installmentNumbers = {};
  installments.forEach(item => {
    installmentNumbers[item.id] = item.installment_number;
  });

  body.innerHTML = data.map(payment => `
    <tr>
      <td>${escapeHTML(payment.payment_number)}</td>
      <td>Angsuran ke-${installmentNumbers[payment.installment_id] || "-"}</td>
      <td>${escapeHTML(
        new Date(payment.payment_date).toLocaleString("id-ID")
      )}</td>
      <td>${escapeHTML(payment.payment_method)}</td>
      <td><strong>${formatRupiah(payment.amount)}</strong></td>
      <td>${escapeHTML(payment.notes || "-")}</td>
    </tr>
  `).join("");

  message.textContent = data.length + " transaksi pembayaran tercatat.";
};

/* ==========================================
   NAVIGASI KOTAK SIMPANAN & PINJAMAN
   ========================================== */

const savingsMenuStyle = document.createElement("style");

savingsMenuStyle.textContent = `
.simpanan-menu{
  display:grid;
  grid-template-columns:repeat(2,minmax(0,1fr));
  gap:16px;
  margin:24px 0;
}
.simpanan-menu-card{
  border:1px solid #e8e8e8;
  background:#fff;
  border-radius:14px;
  padding:22px 16px;
  min-height:125px;
  text-align:left;
  cursor:pointer;
  transition:.2s;
  display:flex;
  flex-direction:column;
  justify-content:center;
  gap:9px;
  box-shadow:0 2px 8px rgba(0,0,0,.035);
}
.simpanan-menu-card:hover{
  border-color:#00a968;
  transform:translateY(-2px);
  box-shadow:0 5px 15px rgba(167,25,37,.10);
}
.simpanan-menu-icon{
  font-size:29px;
}
.simpanan-menu-title{
  font-size:15px;
  font-weight:700;
  color:#252525;
}
.simpanan-menu-desc{
  font-size:12px;
  color:#777;
  line-height:1.5;
}
.simpanan-back-button{
  border:0;
  background:#f3f3f3;
  color:#333;
  border-radius:8px;
  padding:10px 15px;
  font-weight:600;
  cursor:pointer;
  margin-bottom:16px;
}
.simpanan-menu-heading{
  margin:5px 0 5px;
  color:#222;
  font-size:19px;
}
.simpanan-menu-subtitle{
  color:#777;
  font-size:13px;
  margin:0 0 18px;
}
@media(max-width:420px){
  .simpanan-menu{gap:10px}
  .simpanan-menu-card{padding:17px 12px;min-height:115px}
  .simpanan-menu-title{font-size:13px}
  .simpanan-menu-desc{font-size:11px}
}
`;

document.head.appendChild(savingsMenuStyle);

function setupSavingsMainMenu() {
  const parent = document.getElementById("memberContent");
  if (!parent) return;

  if (document.getElementById("savingsMainMenu")) return;

  const menu = document.createElement("div");
  menu.id = "savingsMainMenu";

  menu.innerHTML = `
    <h2 class="simpanan-menu-heading">Simpanan & Pinjaman</h2>
    <p class="simpanan-menu-subtitle">
      Pilih pekerjaan yang ingin dilakukan.
    </p>

    <div class="simpanan-menu">

      <button class="simpanan-menu-card"
        onclick="openSavingsSection('tambah')">
        <span class="simpanan-menu-icon">➕</span>
        <span class="simpanan-menu-title">Tambah Anggota</span>
        <span class="simpanan-menu-desc">
          Daftarkan anggota koperasi baru.
        </span>
      </button>

      <button class="simpanan-menu-card"
        onclick="openSavingsSection('anggota')">
        <span class="simpanan-menu-icon">👥</span>
        <span class="simpanan-menu-title">Data Anggota</span>
        <span class="simpanan-menu-desc">
          Lihat, cari, dan kelola data anggota.
        </span>
      </button>

      <button class="simpanan-menu-card"
        onclick="openSavingsSection('simpanan')">
        <span class="simpanan-menu-icon">💰</span>
        <span class="simpanan-menu-title">Transaksi Simpanan</span>
        <span class="simpanan-menu-desc">
          Setoran, penarikan, saldo, dan riwayat simpanan.
        </span>
      </button>

      <button class="simpanan-menu-card"
        onclick="openSavingsSection('pinjaman')">
        <span class="simpanan-menu-icon">🤝</span>
        <span class="simpanan-menu-title">Pinjaman Anggota</span>
        <span class="simpanan-menu-desc">
          Pengajuan, persetujuan, pencairan, angsuran, dan riwayat pinjaman.
        </span>
      </button>

    </div>
  `;

  parent.prepend(menu);

  // Tombol kembali ke menu utama
  const memberWrap = parent.querySelector(".member-wrap");
  if (memberWrap) {
    addSavingsBackButton(memberWrap);
  }

  const savingsContent = document.getElementById("savingsContent");
  if (savingsContent) {
    addSavingsBackButton(savingsContent);
  }

  const loanContent = document.getElementById("loanContent");
  if (loanContent) {
    addSavingsBackButton(loanContent);
  }

  showSavingsMainMenu();
}

function addSavingsBackButton(section) {
  if (!section || section.querySelector(".simpanan-back-button")) return;

  const button = document.createElement("button");
  button.className = "simpanan-back-button";
  button.type = "button";
  button.textContent = "← Kembali ke Menu Simpanan & Pinjaman";
  button.onclick = showSavingsMainMenu;

  section.prepend(button);
}

window.showSavingsMainMenu = function() {
  const menu = document.getElementById("savingsMainMenu");
  const memberWrap = document.querySelector("#memberContent .member-wrap");
  const savings = document.getElementById("savingsContent");
  const loan = document.getElementById("loanContent");

  if (menu) menu.style.display = "block";
  if (memberWrap) memberWrap.style.display = "none";
  if (savings) savings.style.display = "none";
  if (loan) loan.style.display = "none";

  const form = document.getElementById("memberFormPanel");
  if (form) form.style.display = "none";

  window.scrollTo(0, 0);
};

window.openSavingsSection = function(section) {
  const menu = document.getElementById("savingsMainMenu");
  const memberWrap = document.querySelector("#memberContent .member-wrap");
  const savings = document.getElementById("savingsContent");
  const loan = document.getElementById("loanContent");

  if (menu) menu.style.display = "none";
  if (memberWrap) memberWrap.style.display = "none";
  if (savings) savings.style.display = "none";
  if (loan) loan.style.display = "none";

  if (section === "tambah" || section === "anggota") {
    if (memberWrap) memberWrap.style.display = "block";

    const form = document.getElementById("memberFormPanel");

    if (section === "tambah") {
      if (typeof openMemberForm === "function") {
        openMemberForm();
      } else {
        document.getElementById("memberAddButton")?.click();
      }
    } else if (form) {
      form.style.display = "none";
    }

    loadMembers();
  }

  if (section === "simpanan") {
    if (savings) savings.style.display = "grid";
    loadSavingsMembers();
    loadSavingsTransactions();
  }

  if (section === "pinjaman") {
    if (loan) loan.style.display = "grid";
    loadLoanMembers();
    loadLoanSettings();
    loadLoans();
  }

  window.scrollTo(0, 0);
};

// Jalankan menu setelah seluruh modul lama selesai dimuat.
const previousFinalSavingsShowPage = window.showPage;

window.showPage = function(page, button) {
  previousFinalSavingsShowPage(page, button);

  if (page === "simpanan") {
    setupSavingsMainMenu();
    showSavingsMainMenu();
  }
};

// ==========================================
// DASHBOARD MANAJER - MONITORING TAMBAHAN
// ==========================================

const managerDashboardStyle = document.createElement("style");
managerDashboardStyle.textContent = `
.manager-dashboard-grid {
  display:grid;
  grid-template-columns:repeat(3,minmax(0,1fr));
  gap:15px;
  margin:22px 0;
}
.manager-info-card {
  background:#fff;
  border:1px solid #eee;
  border-radius:13px;
  padding:19px;
  min-width:0;
}
.manager-info-top {
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap:8px;
  margin-bottom:13px;
}
.manager-info-title {
  color:#666;
  font-size:13px;
  font-weight:600;
}
.manager-info-icon {
  width:36px;
  height:36px;
  border-radius:10px;
  display:flex;
  align-items:center;
  justify-content:center;
  background:#fff1f2;
  font-size:18px;
}
.manager-info-value {
  font-size:23px;
  font-weight:750;
  color:#252525;
  overflow-wrap:anywhere;
}
.manager-info-note {
  font-size:12px;
  color:#888;
  margin-top:8px;
}
.manager-info-card.warning .manager-info-value {
  color:#00a968;
}
.manager-dashboard-message {
  font-size:12px;
  color:#888;
  margin-top:15px;
}
@media(max-width:850px) {
  .manager-dashboard-grid {
    grid-template-columns:repeat(2,minmax(0,1fr));
  }
}
@media(max-width:520px) {
  .manager-dashboard-grid {
    grid-template-columns:1fr;
  }
}
`;
document.head.appendChild(managerDashboardStyle);

function setupManagerDashboardCards() {
  const dashboard = document.getElementById("dashboard");
  if (!dashboard || document.getElementById("managerDashboardCards")) return;

  const stats = dashboard.querySelector(".stats");
  if (!stats) return;

  const section = document.createElement("div");
  section.id = "managerDashboardCards";
  section.innerHTML = `
    <div style="margin:25px 0 12px">
      <h3 style="margin:0 0 5px;color:#292929">Monitoring Manajer</h3>
      <p style="margin:0;color:#888;font-size:13px">
        Ringkasan tagihan, persetujuan, dan kondisi pembukuan koperasi
      </p>
    </div>

    <div class="manager-dashboard-grid">

      <div class="manager-info-card">
        <div class="manager-info-top">
          <span class="manager-info-title">Sisa Tagihan Angsuran</span>
          <span class="manager-info-icon">💳</span>
        </div>
        <div class="manager-info-value" id="managerOutstandingAmount">Memuat...</div>
        <div class="manager-info-note" id="managerOutstandingCount">
          Menghitung angsuran belum lunas
        </div>
      </div>

      <div class="manager-info-card">
        <div class="manager-info-top">
          <span class="manager-info-title">Menunggu Persetujuan</span>
          <span class="manager-info-icon">📝</span>
        </div>
        <div class="manager-info-value" id="managerPendingLoans">-</div>
        <div class="manager-info-note">
          Pengajuan pinjaman anggota
        </div>
      </div>

      <div class="manager-info-card warning">
        <div class="manager-info-top">
          <span class="manager-info-title">Peringatan Pembukuan</span>
          <span class="manager-info-icon">⚠️</span>
        </div>
        <div class="manager-info-value" id="managerBookkeepingWarnings">-</div>
        <div class="manager-info-note" id="managerBookkeepingDetail">
          Memeriksa kondisi pembukuan
        </div>
      </div>

    </div>

    <div class="manager-dashboard-message" id="managerDashboardMessage">
      Memuat monitoring...
    </div>
  `;

  stats.insertAdjacentElement("afterend", section);
}

async function loadManagerDashboardCards() {
  setupManagerDashboardCards();

  const outstandingElement = document.getElementById("managerOutstandingAmount");
  if (!outstandingElement) return;

  const pendingElement = document.getElementById("managerPendingLoans");
  const warningElement = document.getElementById("managerBookkeepingWarnings");
  const outstandingCountElement = document.getElementById("managerOutstandingCount");
  const detailElement = document.getElementById("managerBookkeepingDetail");
  const messageElement = document.getElementById("managerDashboardMessage");

  outstandingElement.textContent = "Memuat...";
  pendingElement.textContent = "Memuat...";
  warningElement.textContent = "Memuat...";

  try {
    const results = await Promise.all([
      supabaseClient
        .from("loan_installments")
        .select("id,total_due,paid_amount,status,due_date")
        .neq("status", "lunas"),

      supabaseClient
        .from("member_loans")
        .select("id", { count: "exact", head: true })
        .eq("status", "diajukan"),

      supabaseClient
        .from("journal_entries")
        .select("id", { count: "exact", head: true })
        .eq("status", "draft")
    ]);

    const installmentResult = results[0];
    const pendingResult = results[1];
    const draftResult = results[2];

    if (installmentResult.error) throw installmentResult.error;
    if (pendingResult.error) throw pendingResult.error;
    if (draftResult.error) throw draftResult.error;

    const installments = installmentResult.data || [];
    const today = todayDate();

    const unpaid = installments.filter(item =>
      Number(item.total_due || 0) > Number(item.paid_amount || 0)
    );

    const outstanding = unpaid.reduce((sum, item) =>
      sum + Math.max(
        0,
        Number(item.total_due || 0) - Number(item.paid_amount || 0)
      ), 0);

    const overdue = unpaid.filter(item =>
      item.due_date && item.due_date < today
    ).length;

    const pending = pendingResult.count || 0;
    const drafts = draftResult.count || 0;
    const warnings = overdue + drafts;

    outstandingElement.textContent = formatRupiah(outstanding);
    outstandingCountElement.textContent =
      unpaid.length + " angsuran masih memiliki sisa tagihan";

    pendingElement.textContent = pending;

    warningElement.textContent = warnings;
    detailElement.textContent =
      drafts + " jurnal draft • " + overdue + " angsuran terlambat";

    if (messageElement) {
      messageElement.textContent =
        "Monitoring berhasil diperbarui.";
      messageElement.style.color = "#18743b";
    }

  } catch (error) {
    console.error("Monitoring dashboard:", error);

    outstandingElement.textContent = "Gagal";
    pendingElement.textContent = "Gagal";
    warningElement.textContent = "Gagal";

    outstandingCountElement.textContent =
      "Data tagihan belum dapat dibaca";

    detailElement.textContent =
      "Data pembukuan belum dapat dibaca";

    if (messageElement) {
      messageElement.textContent =
        "Monitoring gagal dimuat: " + (error.message || "Periksa koneksi database.");
      messageElement.style.color = "#00a968";
    }
  }
}

// Hubungkan monitoring dengan navigasi dashboard.
const previousManagerDashboardShowPage = window.showPage;

window.showPage = function(page, button) {
  previousManagerDashboardShowPage(page, button);

  if (page === "dashboard") {
    loadManagerDashboardCards();
  }
};

// ==========================================
// NOTIFIKASI PENGAJUAN PINJAMAN - DASHBOARD
// ==========================================

const pendingLoanStyle = document.createElement("style");

pendingLoanStyle.textContent = `
.pending-loan-panel {
  background:#fff;
  border:1px solid #eee;
  border-radius:13px;
  padding:20px;
  margin:20px 0;
}
.pending-loan-header {
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap:12px;
  margin-bottom:15px;
}
.pending-loan-header h3 {
  margin:0;
  color:#292929;
  font-size:17px;
}
.pending-loan-count {
  background:#fff1f2;
  color:#00a968;
  padding:6px 11px;
  border-radius:20px;
  font-size:12px;
  font-weight:700;
}
.pending-loan-item {
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap:15px;
  padding:14px 0;
  border-top:1px solid #eee;
}
.pending-loan-item strong {
  display:block;
  color:#292929;
  font-size:14px;
}
.pending-loan-item small {
  display:block;
  color:#888;
  margin-top:5px;
}
.pending-loan-amount {
  font-weight:700;
  color:#00a968;
  margin-bottom:8px;
  text-align:right;
}
.pending-loan-button {
  background:#00a968;
  color:white;
  border:0;
  padding:8px 12px;
  border-radius:7px;
  cursor:pointer;
  font-size:12px;
}
.pending-loan-empty {
  color:#888;
  font-size:13px;
  padding:15px 0;
}
@media(max-width:550px) {
  .pending-loan-item {
    align-items:flex-start;
    flex-direction:column;
  }
  .pending-loan-amount {
    text-align:left;
  }
}
`;

document.head.appendChild(pendingLoanStyle);

function setupPendingLoanPanel() {
  const dashboard = document.getElementById("dashboard");

  if (!dashboard || document.getElementById("pendingLoanPanel")) return;

  const panel = document.createElement("div");
  panel.id = "pendingLoanPanel";
  panel.className = "pending-loan-panel";

  panel.innerHTML = `
    <div class="pending-loan-header">
      <h3>🔔 Pengajuan Pinjaman Terbaru</h3>
      <span class="pending-loan-count" id="pendingLoanBadge">
        Memuat...
      </span>
    </div>

    <div id="pendingLoanList">
      <div class="pending-loan-empty">
        Memeriksa pengajuan pinjaman...
      </div>
    </div>
  `;

  const monitoring = document.getElementById("managerDashboardCards");

  if (monitoring) {
    monitoring.insertAdjacentElement("afterend", panel);
  } else {
    const stats = dashboard.querySelector(".stats");
    if (stats) stats.insertAdjacentElement("afterend", panel);
  }
}

async function loadPendingLoanNotifications() {
  if (window.currentUser?.role !== "manajer") return;

  setupPendingLoanPanel();

  const list = document.getElementById("pendingLoanList");
  const badge = document.getElementById("pendingLoanBadge");

  if (!list || !badge) return;

  list.innerHTML = `
    <div class="pending-loan-empty">Memuat pengajuan...</div>
  `;

  try {
    const { data, error } = await supabaseClient
      .from("member_loans")
      .select(`
        id,
        loan_number,
        principal_amount,
        application_date,
        cooperative_members (
          full_name,
          member_number
        )
      `)
      .eq("status", "diajukan")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const loans = data || [];

    badge.textContent = loans.length + " menunggu";

    if (!loans.length) {
      list.innerHTML = `
        <div class="pending-loan-empty">
          <span style="color:#16834e;font-weight:600">
            ✓ Tidak ada pengajuan pinjaman yang menunggu persetujuan.
          </span>
        </div>
      `;
      return;
    }

    list.innerHTML = loans.map(loan => {
      const member = loan.cooperative_members || {};

      return `
        <div class="pending-loan-item">
          <div>
            <strong>${escapeHTML(member.full_name || "Anggota")}</strong>
            <small>
              ${escapeHTML(member.member_number || "-")}
              • ${escapeHTML(loan.loan_number)}
            </small>
            <small>
              Tanggal pengajuan:
              ${escapeHTML(loan.application_date || "-")}
            </small>
          </div>

          <div>
            <div class="pending-loan-amount">
              ${formatRupiah(loan.principal_amount)}
            </div>
            <button
              class="pending-loan-button"
              onclick="openPendingLoanPage()"
            >
              Buka Pengajuan
            </button>
          </div>
        </div>
      `;
    }).join("");

  } catch (error) {
    console.error("Notifikasi pengajuan:", error);

    badge.textContent = "Gagal memuat";

    list.innerHTML = `
      <div class="pending-loan-empty" style="color:#00a968">
        Gagal membaca pengajuan: ${escapeHTML(error.message)}
      </div>
    `;
  }
}

window.openPendingLoanPage = function() {
  window.showPage("simpanan");
};

// Hubungkan dengan navigasi dashboard yang sudah ada.
const previousPendingLoanShowPage = window.showPage;

window.showPage = function(page, button) {
  previousPendingLoanShowPage(page, button);

  if (page === "dashboard") {
    loadPendingLoanNotifications();
  }
};

// Muat notifikasi setelah halaman siap.
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    loadPendingLoanNotifications();
  });
} else {
  loadPendingLoanNotifications();
}

/* ==================================================
   PUSAT PENARIKAN DATA - KOPERASI DESA
   Lokasi: Monitoring Manajer
   Format: Excel XLSX
================================================== */

const exportCenterStyle = document.createElement("style");

exportCenterStyle.textContent = `
.export-center {
  background:#fff;
  border:1px solid #e9e9e9;
  border-radius:14px;
  padding:25px;
  margin-top:22px;
}
.export-center h3 {
  margin:0 0 7px;
  color:#292929;
}
.export-description {
  color:#777;
  font-size:13px;
  margin-bottom:22px;
}
.export-grid {
  display:grid;
  grid-template-columns:repeat(2,minmax(0,1fr));
  gap:18px;
}
.export-field label {
  display:block;
  font-size:13px;
  font-weight:650;
  margin-bottom:8px;
  color:#444;
}
.export-field select,
.export-field input {
  width:100%;
  box-sizing:border-box;
  padding:12px;
  border:1px solid #ddd;
  border-radius:8px;
  background:#fff;
  font-size:14px;
}
.export-format {
  margin-top:20px;
  background:#f5faf6;
  border:1px solid #dcefe0;
  border-radius:9px;
  padding:15px;
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap:10px;
}
.export-format strong {
  color:#18743b;
}
.export-button {
  margin-top:20px;
  background:#00a968;
  color:white;
  border:0;
  border-radius:8px;
  padding:13px 20px;
  font-weight:700;
  cursor:pointer;
  width:100%;
}
.export-button:disabled {
  opacity:.6;
  cursor:wait;
}
.export-message {
  margin-top:15px;
  font-size:13px;
  color:#777;
  line-height:1.6;
}
.export-message.success {color:#16834e}
.export-message.error {color:#00a968}
@media(max-width:650px) {
  .export-grid {grid-template-columns:1fr}
  .export-center {padding:17px}
}
`;

document.head.appendChild(exportCenterStyle);

function setupExportCenter() {
  const parent = document.getElementById("modulePage");
  if (!parent || document.getElementById("exportCenter")) return;

  const section = document.createElement("section");
  section.id = "exportCenter";
  section.className = "export-center";

  section.innerHTML = `
    <h3>📥 Pusat Penarikan Data</h3>

    <div class="export-description">
      Pilih jenis laporan dan periode. Sistem akan mengambil
      data terkait dan menyusunnya menjadi file Excel.
    </div>

    <div class="export-grid">

      <div class="export-field">
        <label>Jenis Laporan</label>
        <select id="exportReport">
          <option value="laba">Laporan Laba Rugi</option>
          <option value="hpp">Laporan HPP</option>
          <option value="invoice">Invoice</option>
          <option value="kas">Arus Kas & Bank</option>
          <option value="utang">Utang dan Piutang</option>
          <option value="simpanan">Simpanan & Pinjaman</option>
          <option value="persediaan">Persediaan Barang</option>
        </select>
      </div>

      <div class="export-field">
        <label>Periode Penarikan</label>
        <select id="exportPeriod">
          <option value="mingguan">Mingguan</option>
          <option value="bulanan" selected>Bulanan</option>
          <option value="tahunan">Tahunan</option>
          <option value="khusus">Tanggal Khusus</option>
        </select>
      </div>

    </div>

    <div id="exportReferenceWrap" class="export-field"
      style="margin-top:18px">
      <label id="exportReferenceLabel">Pilih Bulan</label>
      <input type="month" id="exportReference">
    </div>

    <div id="exportCustomDates" class="export-grid"
      style="display:none;margin-top:18px">

      <div class="export-field">
        <label>Tanggal Awal</label>
        <input type="date" id="exportStart">
      </div>

      <div class="export-field">
        <label>Tanggal Akhir</label>
        <input type="date" id="exportEnd">
      </div>

    </div>

    <div class="export-format">
      <div>
        <strong>📗 Excel Workbook</strong>
        <div style="font-size:12px;color:#777;margin-top:4px">
          File siap dibuka dan dirapikan di Microsoft Excel.
        </div>
      </div>
      <strong>.XLSX</strong>
    </div>

    <button class="export-button" id="exportDownloadButton">
      ↓ Tarik Data Excel
    </button>

    <div id="exportMessage" class="export-message">
      Silakan pilih laporan dan periode penarikan.
    </div>
  `;

  parent.appendChild(section);

  document.getElementById("exportPeriod").addEventListener(
    "change",
    updateExportPeriod
  );

  document.getElementById("exportReference").value =
    new Date().toISOString().slice(0,7);

  document.getElementById("exportDownloadButton").onclick =
    downloadKDMPReport;
}

function updateExportPeriod() {
  const period = document.getElementById("exportPeriod").value;
  const referenceWrap = document.getElementById("exportReferenceWrap");
  const customDates = document.getElementById("exportCustomDates");
  const label = document.getElementById("exportReferenceLabel");
  const input = document.getElementById("exportReference");

  customDates.style.display = period === "khusus" ? "grid" : "none";
  referenceWrap.style.display = period === "khusus" ? "none" : "block";

  if (period === "mingguan") {
    label.textContent = "Pilih Tanggal Acuan Minggu";
    input.type = "date";
    input.value = new Date().toISOString().slice(0,10);
  } else if (period === "bulanan") {
    label.textContent = "Pilih Bulan";
    input.type = "month";
    input.value = new Date().toISOString().slice(0,7);
  } else if (period === "tahunan") {
    label.textContent = "Pilih Tahun";
    input.type = "number";
    input.min = "2000";
    input.max = "2100";
    input.value = new Date().getFullYear();
  }
}

function getExportDateRange() {
  const period = document.getElementById("exportPeriod").value;
  const reference = document.getElementById("exportReference").value;

  let start, end;

  if (period === "khusus") {
    start = document.getElementById("exportStart").value;
    end = document.getElementById("exportEnd").value;

    if (!start || !end || start > end) {
      throw new Error("Periksa tanggal awal dan tanggal akhir.");
    }
  } else if (period === "bulanan") {
    if (!/^\d{4}-\d{2}$/.test(reference)) {
      throw new Error("Pilih bulan terlebih dahulu.");
    }

    start = reference + "-01";
    const [year, month] = reference.split("-").map(Number);
    end = new Date(year, month, 0).toISOString().slice(0,10);

  } else if (period === "tahunan") {
    if (!reference || Number(reference) < 2000) {
      throw new Error("Tahun laporan tidak valid.");
    }

    start = reference + "-01-01";
    end = reference + "-12-31";

  } else {
    if (!reference) throw new Error("Pilih tanggal acuan.");

    const date = new Date(reference + "T12:00:00");
    const day = date.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;

    date.setDate(date.getDate() + mondayOffset);
    start = date.toISOString().slice(0,10);

    date.setDate(date.getDate() + 6);
    end = date.toISOString().slice(0,10);
  }

  return {start,end};
}

async function loadKDMPExcelLibrary() {
  if (window.XLSX) return;

  await new Promise((resolve,reject) => {
    const script = document.createElement("script");
    script.src =
      "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";

    script.onload = resolve;
    script.onerror = () =>
      reject(new Error("Library Excel gagal dimuat. Periksa koneksi internet."));

    document.head.appendChild(script);
  });
}

function makeKDMPWorkbook(sheets, fileName) {
  const workbook = XLSX.utils.book_new();

  sheets.forEach(sheet => {
    const worksheet = XLSX.utils.json_to_sheet(sheet.rows);

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      sheet.name.slice(0,31)
    );

    const keys = Object.keys(sheet.rows[0] || {});
    worksheet["!cols"] = keys.map(key => ({
      wch: Math.max(
        15,
        Math.min(35,key.length + 5)
      )
    }));
  });

  XLSX.writeFile(workbook,fileName);
}

async function fetchExportTable(table, select="*") {
  const {data,error} = await supabaseClient
    .from(table)
    .select(select)
    .limit(5000);

  if (error) throw new Error(table + ": " + error.message);

  return data || [];
}

function filterExportDate(rows, fields, start, end) {
  return rows.filter(row => {
    const field = fields.find(name => row[name] != null);
    if (!field) return false;

    const date = String(row[field]).slice(0,10);
    return date >= start && date <= end;
  });
}

async function buildKDMPReport(type,start,end) {
  const emptySheet = (name, rows, message) => ({
    name,
    rows: rows.length ? rows : [{ Informasi: message || "Tidak ada data pada periode yang dipilih." }]
  });

  if (type === "laba" || type === "hpp") {
    const {data,error} = await supabaseClient
      .from("journal_lines")
      .select(`
        debit,kredit,keterangan,
        accounts(kode_akun,nama_akun,kategori),
        journal_entries!inner(tanggal,nomor_jurnal,keterangan,status)
      `)
      .gte("journal_entries.tanggal",start)
      .lte("journal_entries.tanggal",end);
    if (error) throw error;

    let rows = (data || []).filter(line => line.journal_entries?.status === "posted");
    if (type === "hpp") {
      rows = rows.filter(line => /harga pokok|hpp/i.test(
        (line.accounts?.nama_akun || "") + " " + (line.accounts?.kode_akun || "")
      ));
    } else {
      rows = rows.filter(line => ["pendapatan","beban","penghasilan"].includes(
        String(line.accounts?.kategori || "").toLowerCase()
      ));
    }
    const detail = rows.map(line => ({
      Tanggal:line.journal_entries.tanggal,
      Nomor_Jurnal:line.journal_entries.nomor_jurnal,
      Kode_Akun:line.accounts?.kode_akun || "",
      Nama_Akun:line.accounts?.nama_akun || "",
      Kategori:line.accounts?.kategori || "",
      Keterangan:line.keterangan || line.journal_entries.keterangan || "",
      Debit:Number(line.debit || 0), Kredit:Number(line.kredit || 0)
    }));
    return [emptySheet(type === "hpp" ? "Rincian HPP" : "Rincian Laba Rugi", detail,
      type === "hpp" ? "Tidak ditemukan akun HPP pada jurnal terposting di periode ini." : "Tidak ditemukan akun pendapatan/beban pada jurnal terposting di periode ini.")];
  }

  if (type === "kas") {
    const [transactions,reconciliations] = await Promise.all([
      fetchExportTable("financial_transactions", "tanggal,jenis,nominal,keterangan,akun_kas_id,akun_lawan_id,journal_id"),
      fetchExportTable("bank_reconciliations", "*")
    ]);
    const tx = filterExportDate(transactions,["tanggal"],start,end).map(x => ({
      Tanggal:x.tanggal, Jenis:x.jenis, Keterangan:x.keterangan || "",
      Nominal:Number(x.nominal || 0), ID_Akun_Kas:x.akun_kas_id || "",
      ID_Akun_Lawan:x.akun_lawan_id || "", ID_Jurnal:x.journal_id || ""
    }));
    const rec = (reconciliations || []).filter(x =>
      String(x.period_start || "") <= end && String(x.period_end || "") >= start
    );
    const recIds = rec.map(x => x.id);
    let items = [];
    if (recIds.length) {
      const {data,error} = await supabaseClient.from("bank_reconciliation_items")
        .select("*").in("reconciliation_id",recIds);
      if (error) throw error;
      items = (data || []).filter(x => x.transaction_date >= start && x.transaction_date <= end);
    }
    return [
      emptySheet("Transaksi Kas",tx),
      emptySheet("Rekonsiliasi Bank",rec.map(x => ({
        Periode_Mulai:x.period_start, Periode_Selesai:x.period_end,
        Saldo_Rekening:Number(x.statement_ending_balance || 0),
        Saldo_Buku:Number(x.book_balance || 0), Selisih:Number(x.difference || 0), Status:x.status || ""
      }))),
      emptySheet("Mutasi Rekonsiliasi",items.map(x => ({
        Tanggal:x.transaction_date, Jenis:x.item_type, Keterangan:x.description || "",
        Nominal:Number(x.amount || 0), Cocok:x.matched ? "Ya" : "Belum", ID_Rekonsiliasi:x.reconciliation_id
      })))
    ];
  }

  if (type === "invoice") {
    const invoices = await fetchExportTable("invoices", "*");
    const rows = filterExportDate(invoices,["issue_date"],start,end);
    const ids = rows.map(x => x.id);
    let items = [];
    if (ids.length) {
      const {data,error} = await supabaseClient.from("invoice_items").select("*").in("invoice_id",ids);
      if (error) throw error;
      items = data || [];
    }
    return [
      emptySheet("Invoice",rows.map(x => ({
        Nomor_Invoice:x.invoice_number, Tanggal:x.issue_date, Jatuh_Tempo:x.due_date || "",
        Pelanggan:x.customer_name, Telepon:x.customer_phone || "", Email:x.customer_email || "",
        Alamat:x.customer_address || "", Subtotal:Number(x.subtotal || 0),
        Diskon:Number(x.discount || 0), Pajak:Number(x.tax || 0), Total:Number(x.total || 0),
        Terbayar:Number(x.paid_amount || 0), Sisa:Math.max(0,Number(x.total || 0)-Number(x.paid_amount || 0)),
        Status:x.status || "", Catatan:x.notes || ""
      }))),
      emptySheet("Rincian Invoice",items.map(x => ({
        ID_Invoice:x.invoice_id, Deskripsi:x.description || "", Jumlah:Number(x.quantity || 0),
        Satuan:x.unit || "", Harga_Satuan:Number(x.unit_price || 0), Total_Baris:Number(x.line_total || 0)
      })))
    ];
  }

  if (type === "utang") {
    const [documents,partners] = await Promise.all([
      fetchExportTable("ar_ap_documents", "id,nomor,jenis,partner_id,tanggal,jatuh_tempo,keterangan,total,terbayar,status"),
      fetchExportTable("business_partners", "id,nama,jenis,telepon,alamat")
    ]);
    const rows = filterExportDate(documents,["tanggal"],start,end);
    const partnerMap = new Map(partners.map(x => [x.id,x]));
    const ids = rows.map(x => x.id);
    let payments = [];
    if (ids.length) {
      const {data,error} = await supabaseClient.from("ar_ap_payments")
        .select("document_id,tanggal,nominal,metode,keterangan").in("document_id",ids)
        .gte("tanggal",start).lte("tanggal",end);
      if (error) throw error;
      payments = data || [];
    }
    const docMap = new Map(rows.map(x => [x.id,x]));
    return [
      emptySheet("Daftar Tagihan",rows.map(x => {
        const partner = partnerMap.get(x.partner_id) || {};
        return { Nomor:x.nomor, Jenis:x.jenis, Pihak_Terkait:partner.nama || "",
          Telepon:partner.telepon || "", Tanggal:x.tanggal, Jatuh_Tempo:x.jatuh_tempo || "",
          Keterangan:x.keterangan || "", Total:Number(x.total || 0), Terbayar:Number(x.terbayar || 0),
          Sisa:Math.max(0,Number(x.total || 0)-Number(x.terbayar || 0)), Status:x.status || "" };
      })),
      emptySheet("Riwayat Pembayaran",payments.map(x => ({
        Tanggal:x.tanggal, Nomor_Tagihan:docMap.get(x.document_id)?.nomor || "",
        Jenis:docMap.get(x.document_id)?.jenis || "", Nominal:Number(x.nominal || 0),
        Metode:x.metode || "", Keterangan:x.keterangan || ""
      })))
    ];
  }

  if (type === "simpanan") {
    const [savings,loans,installments,payments] = await Promise.all([
      fetchExportTable("member_savings_transactions", "transaction_number,member_id,transaction_date,savings_type,transaction_type,amount,payment_method,notes"),
      fetchExportTable("member_loans", "loan_number,member_id,application_date,principal_amount,term_months,monthly_interest_rate,status"),
      fetchExportTable("loan_installments", "loan_id,installment_number,due_date,principal_due,service_due,total_due,paid_amount,status"),
      fetchExportTable("loan_installment_payments", "payment_number,installment_id,amount,payment_date,payment_method,notes")
    ]);
    const fs = filterExportDate(savings,["transaction_date"],start,end);
    const fl = filterExportDate(loans,["application_date"],start,end);
    const fi = filterExportDate(installments,["due_date"],start,end);
    const installmentIds = new Set(fi.map(x => x.id));
    const fp = filterExportDate(payments,["payment_date"],start,end);
    return [
      emptySheet("Transaksi Simpanan",fs.map(x => ({ Nomor:x.transaction_number, ID_Anggota:x.member_id,
        Tanggal:x.transaction_date, Jenis_Simpanan:x.savings_type, Transaksi:x.transaction_type,
        Nominal:Number(x.amount || 0), Metode:x.payment_method || "", Catatan:x.notes || "" }))),
      emptySheet("Pinjaman",fl.map(x => ({ Nomor:x.loan_number, ID_Anggota:x.member_id,
        Tanggal:x.application_date, Pokok:Number(x.principal_amount || 0), Tenor_Bulan:x.term_months,
        Jasa_Bulanan:Number(x.monthly_interest_rate || 0), Status:x.status || "" }))),
      emptySheet("Jadwal Angsuran",fi.map(x => ({ ID_Pinjaman:x.loan_id,
        Angsuran_Ke:x.installment_number, Jatuh_Tempo:x.due_date, Pokok:Number(x.principal_due || 0),
        Jasa:Number(x.service_due || 0), Total:Number(x.total_due || 0),
        Terbayar:Number(x.paid_amount || 0), Status:x.status || "" }))),
      emptySheet("Pembayaran Angsuran",fp.map(x => ({ Nomor_Pembayaran:x.payment_number,
        ID_Angsuran:x.installment_id, Tanggal:x.payment_date, Nominal:Number(x.amount || 0),
        Metode:x.payment_method || "", Catatan:x.notes || "" })))
    ];
  }

  if (type === "persediaan") {
    const [products,movements] = await Promise.all([
      fetchExportTable("inventory_products", "id,product_code,product_name,category,unit,current_stock,purchase_price,selling_price,minimum_stock,is_active"),
      fetchExportTable("inventory_movements", "movement_number,product_id,movement_type,quantity,stock_before,stock_after,unit_cost,movement_date,reference_number,notes")
    ]);
    const activeProducts = products.filter(x => x.is_active !== false);
    const productMap = new Map(activeProducts.map(x => [x.id,x]));
    const periodMovements = filterExportDate(movements,["movement_date"],start,end);
    return [
      emptySheet("Mutasi Persediaan",periodMovements.map(x => {
        const product = productMap.get(x.product_id) || {};
        return { Nomor_Mutasi:x.movement_number, Tanggal:x.movement_date,
          Kode_Barang:product.product_code || "", Nama_Barang:product.product_name || "",
          Jenis_Mutasi:x.movement_type, Jumlah:Number(x.quantity || 0),
          Stok_Sebelum:Number(x.stock_before || 0), Stok_Sesudah:Number(x.stock_after || 0),
          Harga_Pokok_Satuan:Number(x.unit_cost || 0), Referensi:x.reference_number || "", Catatan:x.notes || "" };
      })),
      emptySheet("Snapshot Stok Saat Ini",activeProducts.map(x => ({
        Kode_Barang:x.product_code || "", Nama_Barang:x.product_name || "", Kategori:x.category || "",
        Stok_Saat_Ini:Number(x.current_stock || 0), Satuan:x.unit || "",
        Harga_Beli:Number(x.purchase_price || 0), Nilai_Stok:Number(x.current_stock || 0)*Number(x.purchase_price || 0),
        Harga_Jual:Number(x.selling_price || 0), Stok_Minimum:Number(x.minimum_stock || 0)
      })))
    ];
  }

  throw new Error("Jenis laporan tidak dikenal.");
}

async function downloadKDMPReport() {
  const button = document.getElementById("exportDownloadButton");
  const message = document.getElementById("exportMessage");

  try {
    if (window.currentUser?.role !== "manajer") {
      throw new Error("Fitur penarikan laporan hanya untuk manajer.");
    }

    const type = document.getElementById("exportReport").value;
    const period = document.getElementById("exportPeriod").value;
    const range = getExportDateRange();

    button.disabled = true;
    button.textContent = "Menyiapkan data...";
    message.className = "export-message";
    message.textContent = "Mengambil data dari database...";

    const sheets = await buildKDMPReport(
      type,range.start,range.end
    );

    await loadKDMPExcelLibrary();

    const reportNames = {
      laba:"Laporan_Laba_Rugi",
      hpp:"Laporan_HPP",
      invoice:"Invoice",
      kas:"Arus_Kas_Bank",
      utang:"Utang_Piutang",
      simpanan:"Simpanan_Pinjaman",
      persediaan:"Persediaan_Barang"
    };

    const fileName =
      "KDMP_" + reportNames[type] + "_" +
      range.start + "_sampai_" + range.end + ".xlsx";

    makeKDMPWorkbook(sheets,fileName);

    message.className = "export-message success";
    message.textContent =
      "Berhasil! File Excel " + fileName +
      " sudah disiapkan. Periode " +
      range.start + " sampai " + range.end + ".";

  } catch(error) {
    console.error("Ekspor KDMP:",error);
    message.className = "export-message error";
    message.textContent = "Gagal menarik data: " + error.message;

  } finally {
    button.disabled = false;
    button.textContent = "↓ Tarik Data Excel";
  }
}

// Hubungkan ke halaman Monitoring Manajer.
const previousExportCenterShowPage = window.showPage;

window.showPage = function(page,button) {
  previousExportCenterShowPage(page,button);

  if (page === "monitoring") {
    setupExportCenter();

    const section = document.getElementById("exportCenter");
    if (section) section.style.display = "block";
  } else {
    const section = document.getElementById("exportCenter");
    if (section) section.style.display = "none";
  }
};

/* =====================================================
   MODUL PERSEDIAAN BARANG
   KOPERASI DESA
===================================================== */

const inventoryStyle = document.createElement("style");

inventoryStyle.textContent = `
.inventory-wrap{display:grid;gap:18px;margin-top:20px}
.inventory-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:13px}
.inventory-card{background:#fff;border:1px solid #eee;border-radius:12px;padding:17px}
.inventory-card small{display:block;color:#777;margin-bottom:9px}
.inventory-card strong{font-size:20px;color:#292929;overflow-wrap:anywhere}
.inventory-panel{background:#fff;border:1px solid #e9e9e9;border-radius:12px;padding:20px}
.inventory-toolbar{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:16px}
.inventory-toolbar h3{margin:0}
.inventory-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:13px}
.inventory-field{margin-bottom:13px}
.inventory-field label{display:block;font-size:13px;font-weight:650;color:#555;margin-bottom:7px}
.inventory-field input,.inventory-field select,.inventory-field textarea{
 width:100%;box-sizing:border-box;padding:11px;border:1px solid #ddd;
 border-radius:7px;background:white;font:inherit
}
.inventory-field textarea{min-height:65px}
.inventory-actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:12px}
.inventory-btn{border:0;border-radius:8px;padding:10px 15px;background:#00a968;color:white;font-weight:650;cursor:pointer}
.inventory-btn.gray{background:#eee;color:#333}
.inventory-btn:disabled{opacity:.6;cursor:wait}
.inventory-search{max-width:350px;width:100%;padding:11px;border:1px solid #ddd;border-radius:7px}
.inventory-table-wrap{width:100%;max-width:100%;overflow-x:auto;border:1px solid #eee;border-radius:9px}
.inventory-table{width:100%;min-width:0;border-collapse:collapse;table-layout:fixed}
.inventory-table th,.inventory-table td{padding:7px 5px;border-bottom:1px solid #eee;text-align:left;font-size:9px;line-height:1.3;vertical-align:middle;white-space:normal;overflow-wrap:anywhere}
.inventory-table th{background:#fafafa;color:#666;font-weight:700}
.inventory-products-table th:nth-child(1){width:8%}
.inventory-products-table th:nth-child(2){width:13%}
.inventory-products-table th:nth-child(3){width:10%}
.inventory-products-table th:nth-child(4),.inventory-products-table th:nth-child(5){width:8%}
.inventory-products-table th:nth-child(6){width:7%}
.inventory-products-table th:nth-child(7){width:10%}
.inventory-products-table th:nth-child(8){width:12%}
.inventory-products-table th:nth-child(9){width:9%}
.inventory-products-table th:nth-child(10){width:7%}
.inventory-products-table td:last-child{white-space:nowrap}
.inventory-products-table td button{padding:5px 7px!important;font-size:10px!important}
.inventory-movements-table th:nth-child(1){width:10%}
.inventory-movements-table th:nth-child(2){width:8%}
.inventory-movements-table th:nth-child(3){width:14%}
.inventory-movements-table th:nth-child(4){width:10%}
.inventory-movements-table th:nth-child(5){width:7%}
.inventory-movements-table th:nth-child(6){width:10%}
.inventory-movements-table th:nth-child(7){width:10%}
.inventory-movements-table th:nth-child(8){width:21%}
.inventory-movements-table th:nth-child(9){width:10%}
.inventory-movements-table td:nth-child(9){white-space:nowrap}
.inventory-movements-table td:nth-child(9) .inventory-btn{padding:6px 8px;font-size:10px;white-space:nowrap}
.inventory-stock-opening{color:#64748b;font-variant-numeric:tabular-nums}
.inventory-stock-closing{color:#166534;font-variant-numeric:tabular-nums}
.inventory-badge{padding:5px 9px;border-radius:20px;background:#e8f8ef;color:#16834e;font-size:11px;font-weight:700}
.inventory-badge.low{background:#fff0d9;color:#a45b00}
.inventory-message{font-size:13px;margin-top:12px;line-height:1.5}
.inventory-error{color:#00a968}
.inventory-success{color:#16834e}
.inventory-hidden{display:none!important}
@media(max-width:900px){
 .inventory-stats{grid-template-columns:repeat(2,minmax(0,1fr))}
 .inventory-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
}
@media(max-width:700px){
 .inventory-table-wrap{overflow-x:auto}
 .inventory-table{min-width:760px;table-layout:auto}
 .inventory-table th,.inventory-table td{padding:7px 6px;font-size:10px}
}
@media(max-width:550px){
 .inventory-grid{grid-template-columns:1fr}
 .inventory-panel{padding:14px}
}
`;

document.head.appendChild(inventoryStyle);

let inventoryEditId = null;

function inventoryMoney(value){
  return new Intl.NumberFormat("id-ID",{
    style:"currency",
    currency:"IDR",
    maximumFractionDigits:0
  }).format(Number(value||0));
}

function inventoryEscape(value){
  return String(value??"").replace(/[&<>"']/g,char=>({
    "&":"&amp;",
    "<":"&lt;",
    ">":"&gt;",
    '"':"&quot;",
    "'":"&#039;"
  })[char]);
}

function inventoryNumber(prefix){
  const date=new Date().toISOString().slice(0,10).replace(/-/g,"");
  return prefix+"-"+date+"-"+Date.now().toString().slice(-6);
}

function setupInventoryManagement(){
  const parent=document.getElementById("modulePage");
  if(!parent)return;

  if(document.getElementById("inventoryContent"))return;

  const oldPanel=parent.querySelector(".panel");
  if(oldPanel)oldPanel.classList.add("inventory-original-panel");

  const section=document.createElement("div");
  section.id="inventoryContent";
  section.className="inventory-wrap";

  section.innerHTML=`
    <div class="inventory-stats">
      <div class="inventory-card">
        <small>Total Jenis Barang</small>
        <strong id="invTotalProducts">0</strong>
      </div>
      <div class="inventory-card">
        <small>Total Stok Tersedia</small>
        <strong id="invTotalStock">0</strong>
      </div>
      <div class="inventory-card">
        <small>Nilai Persediaan</small>
        <strong id="invStockValue">Rp0</strong>
      </div>
      <div class="inventory-card">
        <small>Barang Stok Menipis</small>
        <strong id="invLowStock">0</strong>
      </div>
    </div>

    <div class="inventory-panel">
      <div class="inventory-toolbar">
        <div>
          <h3>📦 Data Barang</h3>
          <small style="color:#777">Master data persediaan KDMP</small>
        </div>
        <button class="inventory-btn" onclick="showInventoryForm()">
          + Tambah Barang
        </button>
      </div>

      <div id="inventoryProductForm" class="inventory-hidden">
        <hr style="border:0;border-top:1px solid #eee;margin:18px 0">
        <h3 id="inventoryFormTitle">Tambah Barang Baru</h3>

        <div class="inventory-grid">
          <div class="inventory-field">
            <label>Kode Barang</label>
            <input id="invCode" placeholder="Contoh: BRG-001">
          </div>
          <div class="inventory-field">
            <label>Nama Barang</label>
            <input id="invName" placeholder="Nama barang">
          </div>
          <div class="inventory-field">
            <label>Kategori</label>
            <input id="invCategory" placeholder="Contoh: Sembako">
          </div>
          <div class="inventory-field">
            <label>Satuan</label>
            <input id="invUnit" placeholder="pcs, kg, liter, dus">
          </div>
          <div class="inventory-field">
            <label>Harga Beli per Satuan</label>
            <input id="invPurchase" type="number" min="0" step="0.01" value="0">
          </div>
          <div class="inventory-field">
            <label>Harga Jual per Satuan</label>
            <input id="invSelling" type="number" min="0" step="0.01" value="0">
          </div>
          <div class="inventory-field">
            <label>Stok Minimum</label>
            <input id="invMinimum" type="number" min="0" step="0.001" value="0">
          </div>
          <div class="inventory-field" id="invInitialStockWrap">
            <label>Stok Awal</label>
            <input id="invInitialStock" type="number" min="0" step="0.001" value="0">
          </div>
          <div class="inventory-field">
            <label>Catatan</label>
            <input id="invNotes" placeholder="Catatan barang">
          </div>
        </div>

        <div class="inventory-actions">
          <button class="inventory-btn" id="invSaveProduct" onclick="saveInventoryProduct()">
            Simpan Barang
          </button>
          <button class="inventory-btn gray" onclick="hideInventoryForm()">
            Batal
          </button>
        </div>
        <div id="invProductMessage" class="inventory-message"></div>
      </div>
    </div>

    <div class="inventory-panel">
      <div class="inventory-toolbar">
        <h3>Daftar Persediaan</h3>
        <input id="invSearch" class="inventory-search"
          placeholder="Cari kode atau nama barang..."
          oninput="filterInventoryProducts()">
      </div>

      <div class="inventory-table-wrap inventory-products-table-wrap">
        <table class="inventory-table inventory-products-table">
          <thead>
            <tr>
              <th>KODE</th>
              <th>NAMA BARANG</th>
              <th>KATEGORI</th>
              <th>STOK AWAL</th>
              <th>STOK AKHIR</th>
              <th>SATUAN</th>
              <th>HARGA BELI</th>
              <th>NILAI STOK</th>
              <th>STATUS</th>
              <th>AKSI</th>
            </tr>
          </thead>
          <tbody id="invProductBody">
            <tr><td colspan="10">Memuat data barang...</td></tr>
          </tbody>
        </table>
      </div>
      <div id="invProductListMessage" class="inventory-message"></div>
    </div>

    <div class="inventory-panel">
      <div class="inventory-toolbar">
        <div>
          <h3>🔄 Pencatatan Mutasi Stok</h3>
          <small style="color:#777">Catat barang masuk atau keluar</small>
        </div>
      </div>

      <div class="inventory-grid">
        <div class="inventory-field">
          <label>Jenis Mutasi</label>
          <select id="invMovementType">
            <option value="masuk">Barang Masuk</option>
            <option value="keluar">Barang Keluar</option>
            <option value="penyesuaian_masuk">Penyesuaian Stok Masuk</option>
            <option value="penyesuaian_keluar">Penyesuaian Stok Keluar</option>
          </select>
        </div>

        <div class="inventory-field">
          <label>Pilih Barang</label>
          <select id="invMovementProduct">
            <option value="">Pilih barang</option>
          </select>
        </div>

        <div class="inventory-field">
          <label>Jumlah</label>
          <input id="invMovementQty" type="number" min="0.001" step="0.001">
        </div>

        <div class="inventory-field">
          <label>Harga Beli per Satuan (untuk barang masuk)</label>
          <input id="invMovementCost" type="number" min="0" step="0.01" value="0">
        </div>

        <div class="inventory-field">
          <label>Tanggal Mutasi</label>
          <input id="invMovementDate" type="date">
        </div>

        <div class="inventory-field">
          <label>Nomor Referensi</label>
          <input id="invMovementReference" placeholder="Nomor nota / bukti">
        </div>
      </div>

      <div class="inventory-field">
        <label>Keterangan</label>
        <textarea id="invMovementNotes" placeholder="Keterangan mutasi barang"></textarea>
      </div>

      <div class="inventory-actions">
        <button class="inventory-btn" id="invSaveMovement" onclick="saveInventoryMovement()">
          Simpan Mutasi Stok
        </button>
      </div>

      <div id="invMovementMessage" class="inventory-message"></div>
    </div>

    <div class="inventory-panel">
      <div class="inventory-toolbar">
        <h3>📋 Riwayat Mutasi Stok</h3>
        <button class="inventory-btn gray" onclick="loadInventoryMovements()">
          ↻ Muat Ulang
        </button>
      </div>

      <div class="inventory-table-wrap inventory-movements-table-wrap">
        <table class="inventory-table inventory-movements-table">
          <thead>
            <tr>
              <th>NOMOR</th>
              <th>TANGGAL</th>
              <th>BARANG</th>
              <th>JENIS</th>
              <th>JUMLAH</th>
              <th>HARGA SATUAN</th>
              <th>REFERENSI</th>
              <th>KETERANGAN</th>
              <th>AKSI</th>
            </tr>
          </thead>
          <tbody id="invMovementBody">
            <tr><td colspan="9">Memuat riwayat...</td></tr>
          </tbody>
        </table>
      </div>
      <div id="invMovementListMessage" class="inventory-message"></div>
    </div>
  `;

  parent.appendChild(section);

  document.getElementById("invMovementDate").value =
    new Date().toISOString().slice(0,10);

  loadInventoryProducts();
  loadInventoryMovements();
}

window.showInventoryForm=function(){
  inventoryEditId=null;
  document.getElementById("inventoryFormTitle").textContent="Tambah Barang Baru";
  document.getElementById("invInitialStockWrap").style.display="block";

  [
    "invCode","invName","invCategory","invUnit","invNotes"
  ].forEach(id=>document.getElementById(id).value="");

  [
    "invPurchase","invSelling","invMinimum","invInitialStock"
  ].forEach(id=>document.getElementById(id).value=0);

  document.getElementById("invProductMessage").textContent="";
  document.getElementById("inventoryProductForm").classList.remove("inventory-hidden");
  document.getElementById("invCode").focus();
};

window.hideInventoryForm=function(){
  document.getElementById("inventoryProductForm").classList.add("inventory-hidden");
};

window.saveInventoryProduct=async function(){
  if(!["manajer","admin_gudang"].includes(window.currentUser?.role)){
    alert("Hanya Manajer atau Admin Gudang yang dapat mengelola master barang.");
    return;
  }
  const button=document.getElementById("invSaveProduct");
  const message=document.getElementById("invProductMessage");

  const code=document.getElementById("invCode").value.trim();
  const name=document.getElementById("invName").value.trim();
  const category=document.getElementById("invCategory").value.trim();
  const unit=document.getElementById("invUnit").value.trim()||"pcs";
  const purchase=Number(document.getElementById("invPurchase").value)||0;
  const selling=Number(document.getElementById("invSelling").value)||0;
  const minimum=Number(document.getElementById("invMinimum").value)||0;
  const initial=Number(document.getElementById("invInitialStock").value)||0;
  const notes=document.getElementById("invNotes").value.trim();

  if(!code||!name){
    message.textContent="Kode dan nama barang wajib diisi.";
    message.className="inventory-message inventory-error";
    return;
  }

  if(purchase<0||selling<0||minimum<0||initial<0){
    message.textContent="Nominal dan jumlah stok tidak boleh negatif.";
    message.className="inventory-message inventory-error";
    return;
  }

  const payload={
    product_code:code,
    product_name:name,
    category:category||null,
    unit,
    purchase_price:purchase,
    selling_price:selling,
    minimum_stock:minimum,
    notes:notes||null
  };

  button.disabled=true;
  button.textContent="Menyimpan...";

  try{
    if(inventoryEditId){
      const {error}=await supabaseClient
        .from("inventory_products")
        .update(payload)
        .eq("id",inventoryEditId);

      if(error)throw error;

      message.textContent="Data barang berhasil diperbarui.";
    }else{
      payload.created_by=window.currentUser?.id||null;

      const {data:product,error}=await supabaseClient
        .from("inventory_products")
        .insert(payload)
        .select()
        .single();

      if(error)throw error;

      if(initial>0){
        const {error:movementError}=await supabaseClient
          .from("inventory_movements")
          .insert({
            movement_number:inventoryNumber("STOKAWAL"),
            product_id:product.id,
            movement_type:"stok_awal",
            quantity:initial,
            stock_before:0,
            stock_after:initial,
            unit_cost:purchase,
            movement_date:new Date().toISOString().slice(0,10),
            notes:"Pencatatan stok awal barang",
            created_by:window.currentUser?.id||null
          });

        if(movementError){
          throw new Error(
            "Barang sudah dibuat, tetapi pencatatan stok awal gagal: "+
            movementError.message
          );
        }
      }

      message.textContent="Barang berhasil ditambahkan.";
    }

    message.className="inventory-message inventory-success";
    hideInventoryForm();
    await loadInventoryProducts();
    await loadInventoryMovements();

  }catch(error){
    message.textContent="Gagal menyimpan barang: "+error.message;
    message.className="inventory-message inventory-error";
  }finally{
    button.disabled=false;
    button.textContent="Simpan Barang";
  }
};

window.editInventoryProduct=function(id){
  supabaseClient.from("inventory_products")
    .select("*")
    .eq("id",id)
    .single()
    .then(({data,error})=>{
      if(error){
        alert("Gagal mengambil data barang: "+error.message);
        return;
      }

      inventoryEditId=id;

      document.getElementById("inventoryFormTitle").textContent="Edit Data Barang";
      document.getElementById("invInitialStockWrap").style.display="none";

      document.getElementById("invCode").value=data.product_code||"";
      document.getElementById("invName").value=data.product_name||"";
      document.getElementById("invCategory").value=data.category||"";
      document.getElementById("invUnit").value=data.unit||"pcs";
      document.getElementById("invPurchase").value=data.purchase_price||0;
      document.getElementById("invSelling").value=data.selling_price||0;
      document.getElementById("invMinimum").value=data.minimum_stock||0;
      document.getElementById("invNotes").value=data.notes||"";

      document.getElementById("invProductMessage").textContent="";
      document.getElementById("inventoryProductForm").classList.remove("inventory-hidden");
      document.getElementById("inventoryProductForm").scrollIntoView({behavior:"smooth"});
    });
};

async function loadInventoryProducts(){
  const body=document.getElementById("invProductBody");
  if(!body)return;

  body.innerHTML='<tr><td colspan="10">Memuat data barang...</td></tr>';

  const {data,error}=await supabaseClient
    .from("inventory_products")
    .select("*")
    .eq("is_active",true)
    .order("product_name");

  if(error){
    body.innerHTML=`<tr><td colspan="10">${inventoryEscape(error.message)}</td></tr>`;
    document.getElementById("invProductListMessage").textContent=
      "Gagal memuat data persediaan.";
    return;
  }

  const products=data||[];
  const productIds=products.map(p=>p.id);
  const openingStockByProduct=new Map();

  // Ambil seluruh mutasi agar stok awal tidak salah akibat batas 200 riwayat.
  // Mutasi paling awal menjadi dasar saldo awal setiap barang.
  if(productIds.length){
    let from=0;
    const pageSize=500;
    while(true){
      const {data:movements,error:movementError}=await supabaseClient
        .from("inventory_movements")
        .select("product_id,movement_type,quantity,stock_before,stock_after,movement_date,created_at")
        .in("product_id",productIds)
        .order("movement_date",{ascending:true})
        .order("created_at",{ascending:true})
        .range(from,from+pageSize-1);

      if(movementError){
        document.getElementById("invProductListMessage").textContent=
          "Data barang dimuat, tetapi riwayat untuk menghitung stok awal gagal: "+movementError.message;
        break;
      }

      for(const movement of movements||[]){
        if(openingStockByProduct.has(movement.product_id))continue;
        const opening=movement.movement_type==="stok_awal"
          ? Number(movement.stock_after??movement.quantity??0)
          : Number(movement.stock_before??0);
        openingStockByProduct.set(movement.product_id,opening);
      }

      if(!movements||movements.length<pageSize)break;
      from+=pageSize;
    }
  }

  const totalStock=products.reduce((sum,p)=>sum+Number(p.current_stock||0),0);
  const stockValue=products.reduce(
    (sum,p)=>sum+(Number(p.current_stock||0)*Number(p.purchase_price||0)),0
  );
  const lowStock=products.filter(p=>
    Number(p.current_stock||0)<=Number(p.minimum_stock||0)
  ).length;

  document.getElementById("invTotalProducts").textContent=products.length;
  document.getElementById("invTotalStock").textContent=
    totalStock.toLocaleString("id-ID");
  document.getElementById("invStockValue").textContent=inventoryMoney(stockValue);
  document.getElementById("invLowStock").textContent=lowStock;

  const select=document.getElementById("invMovementProduct");
  const selected=select.value;

  select.innerHTML='<option value="">Pilih barang</option>'+
    products.map(p=>`
      <option value="${p.id}">
        ${inventoryEscape(p.product_code)} - ${inventoryEscape(p.product_name)}
        (Stok: ${Number(p.current_stock||0)})
      </option>
    `).join("");

  if(products.some(p=>p.id===selected))select.value=selected;

  if(!products.length){
    body.innerHTML='<tr><td colspan="10" style="text-align:center;padding:25px">Belum ada barang. Silakan tambah barang pertama.</td></tr>';
  }else{
    body.innerHTML=products.map(p=>{
      const stock=Number(p.current_stock||0);
      const minimum=Number(p.minimum_stock||0);
      const low=stock<=minimum;
      const hasOpening=openingStockByProduct.has(p.id);
      const opening=hasOpening?openingStockByProduct.get(p.id):null;

      return `
        <tr>
          <td>${inventoryEscape(p.product_code)}</td>
          <td><strong>${inventoryEscape(p.product_name)}</strong></td>
          <td>${inventoryEscape(p.category||"-")}</td>
          <td class="inventory-stock-opening">${hasOpening?opening.toLocaleString("id-ID"):'<span title="Belum ada riwayat mutasi">—</span>'}</td>
          <td class="inventory-stock-closing"><strong>${stock.toLocaleString("id-ID")}</strong></td>
          <td>${inventoryEscape(p.unit)}</td>
          <td>${inventoryMoney(p.purchase_price)}</td>
          <td>${inventoryMoney(stock*Number(p.purchase_price||0))}</td>
          <td>
            <span class="inventory-badge ${low?"low":""}">
              ${low?"Stok Menipis":"Aman"}
            </span>
          </td>
          <td>
            <button class="inventory-btn gray"
              onclick="editInventoryProduct('${p.id}')">Edit</button>
          </td>
        </tr>
      `;
    }).join("");
  }

  const openingUnknown=products.filter(p=>!openingStockByProduct.has(p.id)).length;
  document.getElementById("invProductListMessage").textContent=
    "Berhasil memuat "+products.length+" jenis barang. Stok akhir mengikuti saldo aktual; "+
    (openingUnknown?openingUnknown+" barang belum memiliki riwayat untuk menentukan stok awal.":"stok awal dihitung dari mutasi paling awal.");
}

window.filterInventoryProducts=function(){
  const query=document.getElementById("invSearch").value.toLowerCase();

  document.querySelectorAll("#invProductBody tr").forEach(row=>{
    row.style.display=row.textContent.toLowerCase().includes(query)?"":"none";
  });
};


window.saveInventoryMovement=async function(){
  if(!["manajer","admin_gudang"].includes(window.currentUser?.role)){
    alert("Hanya Manajer atau Admin Gudang yang dapat mencatat mutasi stok.");
    return;
  }
  const button=document.getElementById("invSaveMovement");
  const message=document.getElementById("invMovementMessage");

  const productId=document.getElementById("invMovementProduct").value;
  const type=document.getElementById("invMovementType").value;
  const quantity=Number(document.getElementById("invMovementQty").value);
  const cost=Number(document.getElementById("invMovementCost").value)||0;
  const date=document.getElementById("invMovementDate").value;
  const reference=document.getElementById("invMovementReference").value.trim();
  const notes=document.getElementById("invMovementNotes").value.trim();

  if(!productId||!date||!quantity||quantity<=0){
    message.textContent="Pilih barang, tanggal, dan jumlah mutasi yang benar.";
    message.className="inventory-message inventory-error";
    return;
  }

  if(cost<0){
    message.textContent="Harga beli tidak boleh negatif.";
    message.className="inventory-message inventory-error";
    return;
  }

  if(type==="masuk"&&cost<=0){
    message.textContent="Harga beli wajib diisi untuk barang masuk.";
    message.className="inventory-message inventory-error";
    return;
  }

  button.disabled=true;
  button.textContent="Menyimpan...";

  try{
    const {data:product,error:productError}=await supabaseClient
      .from("inventory_products")
      .select("id,current_stock,purchase_price")
      .eq("id",productId)
      .single();

    if(productError)throw productError;

    const stockBefore=Number(product.current_stock||0);
    let stockAfter=stockBefore;

    if(type==="masuk"||type==="penyesuaian_masuk"){
      stockAfter=stockBefore+quantity;
    }else{
      stockAfter=stockBefore-quantity;
    }

    if(stockAfter<0){
      throw new Error("Stok tidak mencukupi. Stok tersedia: "+stockBefore);
    }

    const {data:movement,error:movementError}=await supabaseClient
      .from("inventory_movements")
      .insert({
        movement_number:inventoryNumber("MUT"),
        product_id:productId,
        movement_type:type,
        quantity:quantity,
        stock_before:stockBefore,
        stock_after:stockAfter,
        unit_cost:cost,
        movement_date:date,
        reference_number:reference||null,
        notes:notes||null,
        created_by:window.currentUser?.id||null
      })
      .select("id")
      .single();

    if(movementError)throw movementError;

    // Trigger inventory_movements memperbarui current_stock.
    // Di sini hanya harga beli yang perlu diperbarui secara terpisah.
    if(type==="masuk"&&cost>0){
      const {error:updatePriceError}=await supabaseClient
        .from("inventory_products")
        .update({purchase_price:cost})
        .eq("id",productId);
      if(updatePriceError){
        throw new Error("Mutasi stok tercatat, tetapi pembaruan harga beli gagal: "+updatePriceError.message);
      }
    }

    message.textContent=
      "Mutasi berhasil disimpan. Stok berubah dari "+
      stockBefore+" menjadi "+stockAfter+".";
    message.className="inventory-message inventory-success";

    document.getElementById("invMovementQty").value="";
    document.getElementById("invMovementCost").value=0;
    document.getElementById("invMovementReference").value="";
    document.getElementById("invMovementNotes").value="";

    await loadInventoryProducts();
    await loadInventoryMovements();

  }catch(error){
    message.textContent="Gagal menyimpan mutasi: "+error.message;
    message.className="inventory-message inventory-error";
  }finally{
    button.disabled=false;
    button.textContent="Simpan Mutasi Stok";
  }
};

window.loadInventoryMovements=async function(){
  const body=document.getElementById("invMovementBody");
  if(!body)return;

  body.innerHTML='<tr><td colspan="9">Memuat riwayat...</td></tr>';

  const {data,error}=await supabaseClient
    .from("inventory_movements")
    .select(`
      id,
      movement_number,
      product_id,
      movement_type,
      quantity,
      unit_cost,
      movement_date,
      stock_before,
      stock_after,
      reference_number,
      notes,
      created_by,
      created_at,
      inventory_products(product_code,product_name,unit)
    `)
    .order("movement_date",{ascending:false})
    .order("created_at",{ascending:false})
    .limit(200);

  if(error){
    body.innerHTML=`<tr><td colspan="9">${inventoryEscape(error.message)}</td></tr>`;
    document.getElementById("invMovementListMessage").textContent=
      "Gagal memuat riwayat mutasi.";
    return;
  }

  const movements=data||[];

  const labels={
    stok_awal:"Stok Awal",
    masuk:"Barang Masuk",
    keluar:"Barang Keluar",
    penyesuaian_masuk:"Penyesuaian Masuk",
    penyesuaian_keluar:"Penyesuaian Keluar"
  };

  if(!movements.length){
    body.innerHTML='<tr><td colspan="9" style="text-align:center;padding:22px">Belum ada riwayat mutasi barang.</td></tr>';
  }else{
    body.innerHTML=movements.map(item=>`
      <tr>
        <td>${inventoryEscape(item.movement_number)}</td>
        <td>${inventoryEscape(item.movement_date)}</td>
        <td>
          ${inventoryEscape(item.inventory_products?.product_code||"-")}
          - ${inventoryEscape(item.inventory_products?.product_name||"-")}
        </td>
        <td>${labels[item.movement_type]||inventoryEscape(item.movement_type)}</td>
        <td>${Number(item.quantity).toLocaleString("id-ID")}
          ${inventoryEscape(item.inventory_products?.unit||"")}
        </td>
        <td>${inventoryMoney(item.unit_cost)}</td>
        <td>${inventoryEscape(item.reference_number||"-")}</td>
        <td>${inventoryEscape(item.notes||"-")}</td>
        <td><button type="button" class="inventory-btn gray" onclick="showInventoryMovementDetail('${inventoryEscape(item.id)}')">Detail</button></td>
      </tr>
    `).join("");
  }

  document.getElementById("invMovementListMessage").textContent=
    "Menampilkan "+movements.length+" riwayat mutasi terakhir.";
};

// Detail mutasi stok: hanya membaca data, tidak mengubah atau menghapus riwayat.
window.showInventoryMovementDetail=async function(movementId){
  if(!movementId)return;
  const {data:item,error}=await supabaseClient
    .from("inventory_movements")
    .select(`
      id, movement_number, product_id, movement_type, quantity, unit_cost,
      movement_date, stock_before, stock_after, reference_number, notes,
      created_by, created_at,
      inventory_products(product_code,product_name,unit)
    `)
    .eq("id",movementId)
    .single();

  if(error||!item){
    alert("Detail mutasi tidak dapat dimuat: "+(error?.message||"Data tidak ditemukan."));
    return;
  }

  const labels={
    stok_awal:"Stok Awal", masuk:"Barang Masuk", keluar:"Barang Keluar",
    penyesuaian_masuk:"Penyesuaian Masuk", penyesuaian_keluar:"Penyesuaian Keluar"
  };
  const product=item.inventory_products||{};
  const unit=product.unit||"";
  const dateValue=item.created_at||item.movement_date;
  const dateText=dateValue?new Date(dateValue).toLocaleString("id-ID"):"-";
  const fields=[
    ["Nomor Mutasi",item.movement_number],
    ["Tanggal Mutasi",item.movement_date],
    ["Waktu Pencatatan",dateText],
    ["Kode Barang",product.product_code],
    ["Nama Barang",product.product_name],
    ["Jenis Mutasi",labels[item.movement_type]||item.movement_type],
    ["Jumlah",Number(item.quantity).toLocaleString("id-ID")+" "+unit],
    ["Stok Sebelum",item.stock_before==null?"Belum tersedia":Number(item.stock_before).toLocaleString("id-ID")+" "+unit],
    ["Stok Sesudah",item.stock_after==null?"Belum tersedia":Number(item.stock_after).toLocaleString("id-ID")+" "+unit],
    ["Harga Satuan",inventoryMoney(item.unit_cost)],
    ["Nilai Mutasi",inventoryMoney(Number(item.quantity||0)*Number(item.unit_cost||0))],
    ["Nomor Referensi",item.reference_number||"-"],
    ["ID Pengguna Pencatat",item.created_by||"-"],
    ["Keterangan",item.notes||"-"]
  ];

  let modal=document.getElementById("inventoryMovementDetailModal");
  if(!modal){
    modal=document.createElement("div");
    modal.id="inventoryMovementDetailModal";
    modal.style.cssText="position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:18px;";
    modal.innerHTML=`<div role="dialog" aria-modal="true" aria-labelledby="inventoryMovementDetailTitle" style="background:#fff;width:min(680px,100%);max-height:90vh;overflow:auto;border-radius:14px;padding:20px;box-shadow:0 15px 50px rgba(0,0,0,.25)">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px">
        <h3 id="inventoryMovementDetailTitle" style="margin:0">Detail Mutasi Stok</h3>
        <button type="button" onclick="closeInventoryMovementDetail()" aria-label="Tutup detail" style="border:0;border-radius:8px;padding:8px 12px;cursor:pointer;background:#f1f1f1">✕</button>
      </div>
      <div id="inventoryMovementDetailContent"></div>
      <p style="font-size:12px;color:#777;margin:14px 0 0">Informasi ini bersifat riwayat/audit. Detail mutasi tidak dapat diedit atau dihapus dari panel ini.</p>
      <div style="display:flex;justify-content:flex-end;margin-top:16px"><button type="button" class="inventory-btn gray" onclick="closeInventoryMovementDetail()">Tutup</button></div>
    </div>`;
    modal.addEventListener("click",event=>{if(event.target===modal)window.closeInventoryMovementDetail();});
    document.body.appendChild(modal);
  }
  document.getElementById("inventoryMovementDetailContent").innerHTML=`<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px">${fields.map(([label,value])=>
    `<div style="padding:11px;border:1px solid #eee;border-radius:9px;min-width:0"><div style="font-size:11px;color:#777;margin-bottom:5px">${inventoryEscape(label)}</div><div style="font-size:13px;font-weight:600;overflow-wrap:anywhere">${inventoryEscape(value==null||value===""?"-":String(value))}</div></div>`
  ).join("")}</div>`;
  modal.style.display="flex";
};

window.closeInventoryMovementDetail=function(){
  const modal=document.getElementById("inventoryMovementDetailModal");
  if(modal)modal.style.display="none";
};

// Hubungkan modul ke navigasi utama.
// Mempertahankan seluruh wrapper showPage sebelumnya.
const previousInventoryShowPage=window.showPage;

window.showPage=function(page,button){
  const oldInventory=document.getElementById("inventoryContent");
  const oldPanel=document.querySelector("#modulePage .inventory-original-panel");

  if(oldInventory)oldInventory.style.display="none";
  if(oldPanel)oldPanel.style.display="";

  previousInventoryShowPage(page,button);

  if(page==="persediaan"){
    setupInventoryManagement();

    const content=document.getElementById("inventoryContent");
    const panel=document.querySelector("#modulePage .inventory-original-panel");

    if(content)content.style.display="grid";
    if(panel)panel.style.display="none";

    loadInventoryProducts();
    loadInventoryMovements();
  }
};

// =============================================
// MODUL UTANG & PIUTANG TERINTEGRASI DENGAN INVOICE
// =============================================
const debtReceivableStyle = document.createElement("style");
debtReceivableStyle.textContent = `
.debt-wrap{display:grid;gap:18px;margin-top:22px}
.debt-summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:13px}
.debt-card{background:#fff;border:1px solid #eee;border-radius:12px;padding:18px}
.debt-card small{display:block;color:#777;margin-bottom:8px}
.debt-card strong{font-size:20px;color:#222}
.debt-panel{background:#fff;border:1px solid #eee;border-radius:12px;padding:18px}
.debt-panel h3{margin:0 0 14px}
.debt-table-wrap{overflow-x:auto}
.debt-table{width:100%;min-width:900px;border-collapse:collapse}
.debt-table th,.debt-table td{padding:11px;border-bottom:1px solid #eee;text-align:left;font-size:12px;white-space:nowrap}
.debt-table th{background:#fafafa;color:#555}
.debt-status{display:inline-block;padding:5px 9px;border-radius:20px;background:#fff0e6;color:#a34b12;font-size:11px;font-weight:700}
.debt-status.partial{background:#fff4d8;color:#8a5a00}
.debt-status.overdue{background:#fee;color:#00a968}
.debt-status.paid{background:#e8f7ed;color:#18743b}
.debt-btn{border:0;border-radius:7px;padding:8px 11px;background:#00a968;color:#fff;font-weight:600;cursor:pointer}
.debt-muted{color:#777;font-size:13px}
@media(max-width:700px){.debt-summary{grid-template-columns:1fr}.debt-panel{padding:13px}}
`;
document.head.appendChild(debtReceivableStyle);

function setupDebtReceivable(){
 const parent=document.getElementById("modulePage");
 if(!parent)return;
 let section=document.getElementById("debtReceivableContent");
 if(!section){
  section=document.createElement("section");
  section.id="debtReceivableContent";
  section.className="erp-content debt-wrap";
  section.innerHTML=`
   <div class="debt-summary">
    <div class="debt-card"><small>Total Piutang Pelanggan</small><strong id="debtReceivableTotal">Rp0</strong></div>
    <div class="debt-card"><small>Total Utang Pemasok</small><strong id="debtPayableTotal">Rp0</strong></div>
    <div class="debt-card"><small>Total Tagihan Terlambat</small><strong id="debtOverdueTotal">Rp0</strong></div>
   </div>
   <div class="debt-panel">
    <div class="erp-toolbar">
     <div><h3>💳 Ringkasan Utang & Piutang</h3><p class="debt-muted">Data otomatis diambil dari Invoice Penjualan dan Invoice Pembelian.</p></div>
     <button type="button" class="debt-btn" id="debtRefreshButton">Muat Ulang</button>
    </div>
    <div id="debtMessage" class="debt-muted">Memuat data tagihan...</div>
   </div>
   <div class="debt-panel">
    <h3>Piutang Pelanggan</h3>
    <div class="debt-table-wrap"><table class="debt-table"><thead><tr><th>Nomor Invoice</th><th>Pelanggan</th><th>Tanggal</th><th>Jatuh Tempo</th><th>Total</th><th>Dibayar</th><th>Sisa Piutang</th><th>Status</th><th>Aksi</th></tr></thead><tbody id="debtReceivableBody"><tr><td colspan="9">Memuat...</td></tr></tbody></table></div>
   </div>
   <div class="debt-panel">
    <h3>Utang Pemasok</h3>
    <div class="debt-table-wrap"><table class="debt-table"><thead><tr><th>Nomor Invoice</th><th>Pemasok</th><th>Tanggal</th><th>Jatuh Tempo</th><th>Total</th><th>Dibayar</th><th>Sisa Utang</th><th>Status</th><th>Aksi</th></tr></thead><tbody id="debtPayableBody"><tr><td colspan="9">Memuat...</td></tr></tbody></table></div>
   </div>`;
  parent.appendChild(section);
  document.getElementById("debtRefreshButton").addEventListener("click",loadDebtReceivable);
 }
 section.style.display="block";
 loadDebtReceivable();
}

function debtStatus(invoice,remaining){
 if(remaining<=0)return {label:"Lunas",className:"paid"};
 if(invoice.due_date && invoice.due_date<todayDate())return {label:"Terlambat",className:"overdue"};
 if(Number(invoice.paid_amount||0)>0)return {label:"Dibayar Sebagian",className:"partial"};
 return {label:"Belum Dibayar",className:""};
}

function renderDebtRows(rows,bodyId,partyType){
 const body=document.getElementById(bodyId);
 if(!body)return;
 if(!rows.length){body.innerHTML='<tr><td colspan="9">Belum ada tagihan terbuka.</td></tr>';return;}
 body.replaceChildren();
 rows.forEach(invoice=>{
  const total=Number(invoice.total||0);
  const paid=Number(invoice.paid_amount||0);
  const remaining=Math.max(0,total-paid);
  const status=debtStatus(invoice,remaining);
  const party=partyType==="pembelian"?(invoice.supplier_name||invoice.customer_name||"-"):(invoice.customer_name||"-");
  const values=[invoice.invoice_number||"-",party,invoice.issue_date||"-",invoice.due_date||"-",formatRupiah(total),formatRupiah(paid),formatRupiah(remaining)];
  const row=document.createElement("tr");
  values.forEach(value=>{const cell=document.createElement("td");cell.textContent=value;row.appendChild(cell);});
  const statusCell=document.createElement("td");
  const badge=document.createElement("span");badge.className="debt-status "+status.className;badge.textContent=status.label;statusCell.appendChild(badge);row.appendChild(statusCell);
  const actionCell=document.createElement("td");
  const action=document.createElement("button");action.type="button";action.className="debt-btn";action.textContent="Buka Invoice";
  action.addEventListener("click",()=>{
   window.showPage("invoice");
   if(typeof showInvoiceDetail==="function")showInvoiceDetail(invoice.id);
  });
  actionCell.appendChild(action);row.appendChild(actionCell);body.appendChild(row);
 });
}

async function loadDebtReceivable(){
 const message=document.getElementById("debtMessage");
 if(!message)return;
 message.textContent="Memuat data tagihan...";
 const {data,error}=await supabaseClient.from("invoices").select("*").order("issue_date",{ascending:false});
 if(error){message.textContent="Gagal memuat utang & piutang: "+error.message;message.className="invoice-message erp-error";return;}
 const invoices=data||[];
 const receivables=invoices.filter(item=>(item.invoice_type||"penjualan")==="penjualan" && Number(item.total||0)>Number(item.paid_amount||0));
 const payables=invoices.filter(item=>item.invoice_type==="pembelian" && Number(item.total||0)>Number(item.paid_amount||0));
 const outstanding=item=>Math.max(0,Number(item.total||0)-Number(item.paid_amount||0));
 const receivableTotal=receivables.reduce((sum,item)=>sum+outstanding(item),0);
 const payableTotal=payables.reduce((sum,item)=>sum+outstanding(item),0);
 const overdueTotal=invoices.filter(item=>item.due_date && item.due_date<todayDate()).reduce((sum,item)=>sum+outstanding(item),0);
 document.getElementById("debtReceivableTotal").textContent=formatRupiah(receivableTotal);
 document.getElementById("debtPayableTotal").textContent=formatRupiah(payableTotal);
 document.getElementById("debtOverdueTotal").textContent=formatRupiah(overdueTotal);
 renderDebtRows(receivables,"debtReceivableBody","penjualan");
 renderDebtRows(payables,"debtPayableBody","pembelian");
 message.textContent="Menampilkan "+receivables.length+" piutang terbuka dan "+payables.length+" utang terbuka. Pembayaran mengikuti data Invoice.";
 message.className="debt-muted";
}

const previousDebtReceivableShowPage=window.showPage;
window.showPage=function(page,button){
 const debtContent=document.getElementById("debtReceivableContent");
 if(debtContent)debtContent.style.display="none";
 previousDebtReceivableShowPage(page,button);
 if(page==="utang-piutang")setupDebtReceivable();
};
// FIX: HUBUNGKAN TOMBOL REKONSILIASI BANK
window.calculateBankReconciliation = calculateBankReconciliation;
window.saveBankMutation = saveBankMutation;
window.saveBankReconciliation = saveBankReconciliation;


// ==========================================
// PENGATURAN DASAR: PROFIL KOPERASI & TEMA
// Data profil dan tema versi awal disimpan lokal di browser.
// ==========================================
const kdmpSettingsStyle=document.createElement("style");
kdmpSettingsStyle.textContent=`
#settingsContent{display:none}
.settings-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
.settings-card{background:#fff;border:1px solid #eceef2;border-radius:13px;padding:20px;margin-bottom:16px}
.settings-card h3{margin:0 0 7px;font-size:16px;color:#252a34}
.settings-help{font-size:12px;color:#858b98;margin:0 0 16px;line-height:1.5}
.settings-field{display:flex;flex-direction:column;gap:6px;margin-bottom:13px}
.settings-field label{font-size:12px;font-weight:700;color:#606775}
.settings-field input,.settings-field textarea{width:100%;border:1px solid #dfe3e9;border-radius:8px;padding:10px 11px;font:inherit;font-size:13px;background:#fff;color:#252a34}
.settings-field textarea{min-height:75px;resize:vertical}
.settings-field select{width:100%;border:1px solid #dfe3e9;border-radius:8px;padding:10px 11px;font:inherit;font-size:13px;background:#fff;color:#252a34}
#inviteUserMessage{font-size:12px;margin-top:12px;line-height:1.5;min-height:18px}
#inviteUserMessage.success{color:#13834f}
#inviteUserMessage.error{color:#b42318}
.settings-btn:disabled{opacity:.6;cursor:wait}
.settings-actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:8px}
.settings-btn{border:0;border-radius:8px;padding:10px 15px;background:#00a968;color:#fff;font-weight:700;font-size:12px;cursor:pointer}
.settings-btn.secondary{background:#eef0f3;color:#4d5562}
.settings-logo-preview{width:76px;height:76px;border:1px dashed #cbd0d8;border-radius:12px;display:grid;place-items:center;overflow:hidden;background:#fafafa;color:#888;font-size:11px;margin-bottom:10px}
.settings-logo-preview img{width:100%;height:100%;object-fit:contain}
.settings-theme-row{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:12px 14px;border:1px solid #e2e5eb;border-radius:10px;background:#fafbfc;max-width:420px}
.settings-theme-state{display:flex;align-items:center;gap:9px;min-width:0}
.settings-theme-state .theme-icon{font-size:19px;line-height:1}
.settings-theme-state strong{display:block;font-size:13px;color:#333}
.settings-theme-state small{display:block;color:#858b98;margin-top:2px;font-size:11px}
.settings-theme-switch{position:relative;flex:0 0 46px;width:46px;height:26px;border:0;border-radius:20px;background:#c5cad2;padding:0;cursor:pointer;transition:background .2s ease}
.settings-theme-switch::after{content:"";position:absolute;top:3px;left:3px;width:20px;height:20px;border-radius:50%;background:#fff;box-shadow:0 1px 3px #0003;transition:transform .2s ease}
.settings-theme-switch[aria-checked="true"]{background:#00a968}
.settings-theme-switch[aria-checked="true"]::after{transform:translateX(20px)}
.settings-theme-switch:focus-visible{outline:3px solid #e6a0a7;outline-offset:3px}
#settingsMessage{font-size:12px;margin-top:10px;min-height:17px}
body[data-kdmp-theme="dark"]{--bg:#151922;--text:#edf0f5;--white:#202633;--border:#343c4b;--muted:#a4adbb;background:#151922;color:#edf0f5}
body[data-kdmp-theme="dark"] .sidebar,body[data-kdmp-theme="dark"] .topbar,body[data-kdmp-theme="dark"] .settings-card,body[data-kdmp-theme="dark"] .erp-content,body[data-kdmp-theme="dark"] .erp-card,body[data-kdmp-theme="dark"] .card,body[data-kdmp-theme="dark"] .panel{background:#202633!important;color:#edf0f5!important;border-color:#343c4b!important}
body[data-kdmp-theme="dark"] .menu button{color:#c2c9d4}
body[data-kdmp-theme="dark"] .menu button:hover,body[data-kdmp-theme="dark"] .menu button.active{background:#42242b;color:#ffb8c0}
body[data-kdmp-theme="dark"] .settings-card h3,body[data-kdmp-theme="dark"] .settings-field label{color:#edf0f5}
body[data-kdmp-theme="dark"] .settings-help,body[data-kdmp-theme="dark"] .settings-field input,body[data-kdmp-theme="dark"] .settings-field textarea{background:#151922;color:#edf0f5;border-color:#424b5b}
body[data-kdmp-theme="dark"] .settings-theme-row{background:#151922;border-color:#424b5b}
body[data-kdmp-theme="dark"] .settings-theme-state strong{color:#edf0f5}
body[data-kdmp-theme="dark"] .settings-theme-state small{color:#a4adbb}
body[data-kdmp-theme="dark"] table th{background:#252d3a!important;color:#dce2eb!important}
body[data-kdmp-theme="dark"] table td{color:#e1e6ee;border-color:#343c4b!important}
/* Persediaan: panel abu-abu lembut dengan teks gelap agar data tetap terbaca */
body[data-kdmp-theme="dark"] .inventory-card,
body[data-kdmp-theme="dark"] .inventory-panel,
body[data-kdmp-theme="dark"] .inventory-table-wrap{
  background:#d9dce2!important;
  border-color:#c2c7d0!important;
  color:#17191e!important;
}
body[data-kdmp-theme="dark"] .inventory-card small,
body[data-kdmp-theme="dark"] .inventory-card strong,
body[data-kdmp-theme="dark"] .inventory-panel,
body[data-kdmp-theme="dark"] .inventory-panel h3,
body[data-kdmp-theme="dark"] .inventory-field label,
body[data-kdmp-theme="dark"] .inventory-table td,
body[data-kdmp-theme="dark"] .inventory-stock-opening{
  color:#17191e!important;
}
body[data-kdmp-theme="dark"] .inventory-table th{
  background:#c5cad3!important;
  color:#20242b!important;
  border-color:#b7bdc7!important;
}
body[data-kdmp-theme="dark"] .inventory-table td{
  background:#d9dce2!important;
  color:#17191e!important;
  border-color:#c2c7d0!important;
}
body[data-kdmp-theme="dark"] .inventory-field input,
body[data-kdmp-theme="dark"] .inventory-field select,
body[data-kdmp-theme="dark"] .inventory-field textarea,
body[data-kdmp-theme="dark"] .inventory-search{
  background:#eef0f3!important;
  color:#17191e!important;
  border-color:#b8bec8!important;
}
body[data-kdmp-theme="dark"] .inventory-field input::placeholder,
body[data-kdmp-theme="dark"] .inventory-search::placeholder{
  color:#626975!important;
}
body[data-kdmp-theme="dark"] .inventory-stock-closing{color:#166534!important}
@media(max-width:700px){.settings-grid{grid-template-columns:1fr}.settings-card{padding:15px}}
`;

const aboutBrandStyle=document.createElement("style");
aboutBrandStyle.textContent=`
.about-brand-card{display:flex;align-items:flex-start;gap:18px;overflow:hidden;position:relative;background:linear-gradient(135deg,#fff 0%,#fff8f8 100%);border-color:#f0d9dc}
.about-brand-mark{flex:0 0 58px;width:58px;height:58px;border-radius:16px;display:grid;place-items:center;background:linear-gradient(145deg,#00a968,#761421);color:#fff;font-size:29px;font-weight:800;box-shadow:0 8px 20px rgba(137,20,34,.18)}
.about-brand-content{min-width:0}
.about-brand-eyebrow{font-size:10px;letter-spacing:1.6px;font-weight:800;color:#00a968}
.about-brand-content h3{font-size:25px;letter-spacing:1px;margin:5px 0 2px;color:#252a34}
.about-brand-tagline{margin:0 0 12px;font-size:12px;font-weight:700;color:#00a968}
.about-brand-description{max-width:760px;margin:0;color:#687080;font-size:13px;line-height:1.65}
.about-brand-divider{height:1px;background:#eadde0;margin:16px 0}
.about-brand-credit{display:flex;gap:8px;align-items:baseline;flex-wrap:wrap;margin:6px 0;font-size:12px}
.about-brand-credit span{color:#858b98;min-width:115px}
.about-brand-credit strong{color:#252a34}
.about-brand-footer{margin:14px 0 0;color:#9298a3;font-size:11px;font-style:italic}
body[data-kdmp-theme="dark"] .about-brand-card{background:linear-gradient(135deg,#202633 0%,#2b222b 100%);border-color:#45404b}
body[data-kdmp-theme="dark"] .about-brand-content h3,body[data-kdmp-theme="dark"] .about-brand-credit strong{color:#edf0f5}
body[data-kdmp-theme="dark"] .about-brand-description{color:#c0c7d2}
body[data-kdmp-theme="dark"] .about-brand-divider{background:#45404b}
@media(max-width:600px){.about-brand-card{gap:13px;padding:15px}.about-brand-mark{flex-basis:48px;width:48px;height:48px;border-radius:13px;font-size:24px}.about-brand-content h3{font-size:22px}.about-brand-credit{display:block}.about-brand-credit span{display:block;margin-bottom:2px}}
`;
document.head.appendChild(aboutBrandStyle);

document.head.appendChild(kdmpSettingsStyle);

function getKDMPProfile(){
  try{return JSON.parse(localStorage.getItem("kdmp_erp_profile")||"{}");}
  catch(_){return {};}
}
function applyKDMPTheme(theme){
  const selected=theme==="dark"?"dark":"light";
  document.body.setAttribute("data-kdmp-theme",selected);
  try{localStorage.setItem("kdmp_erp_theme",selected);}catch(_){}
  const toggle=document.getElementById("settingsThemeSwitch");
  if(toggle)toggle.setAttribute("aria-checked",String(selected==="dark"));
  const label=document.getElementById("settingsThemeLabel");
  if(label)label.textContent=selected==="dark"?"Mode Gelap":"Mode Terang";
  const icon=document.getElementById("settingsThemeIcon");
  if(icon)icon.textContent=selected==="dark"?"🌙":"☀️";
}
(function initKDMPTheme(){
  let saved="light";
  try{saved=localStorage.getItem("kdmp_erp_theme")||"light";}catch(_){}
  document.body.setAttribute("data-kdmp-theme",saved==="dark"?"dark":"light");
})();

function setupSettings(){
  const parent=document.getElementById("modulePage");
  if(!parent)return;
  let section=document.getElementById("settingsContent");
  if(!section){
    section=document.createElement("section");
    section.id="settingsContent";
    section.className="erp-content";
    section.innerHTML=`
      <div class="settings-card">
        <h3>🏢 Profil Koperasi</h3>
        <p class="settings-help">Atur identitas koperasi yang ditampilkan pada aplikasi dan dokumen.</p>
        <div class="settings-grid">
          <div>
            <div class="settings-logo-preview" id="settingsLogoPreview">Logo</div>
            <div class="settings-field"><label>Logo Koperasi</label><input type="file" id="settingsLogoFile" accept="image/png,image/jpeg,image/webp"></div>
          </div>
          <div>
            <div class="settings-field"><label>Nama Koperasi</label><input id="settingsOrgName" maxlength="120" placeholder="Nama koperasi"></div>
            <div class="settings-field"><label>Email Koperasi</label><input id="settingsOrgEmail" type="email" maxlength="160" placeholder="email@koperasi.id"></div>
          </div>
          <div class="settings-field"><label>Nomor Telepon</label><input id="settingsOrgPhone" maxlength="40" placeholder="Nomor kontak"></div>
          <div class="settings-field"><label>Alamat</label><textarea id="settingsOrgAddress" maxlength="500" placeholder="Alamat lengkap koperasi"></textarea></div>
        </div>
        <div class="settings-actions"><button type="button" class="settings-btn" id="settingsSaveProfile">Simpan Profil</button><button type="button" class="settings-btn secondary" id="settingsResetProfile">Pulihkan Default</button></div>
        <div id="settingsMessage"></div>
      </div>
      <div class="settings-card" id="settingsInviteCard">
        <h3>👥 Undang Pengguna Koperasi</h3>
        <p class="settings-help">Buat akun pengguna yang hanya dapat dibuat atas persetujuan Manajer. Tentukan email, password awal, dan hak akses pengguna.</p>
        <div class="settings-grid">
          <div class="settings-field"><label for="inviteUserEmail">Email Pengguna</label><input id="inviteUserEmail" type="email" maxlength="254" autocomplete="off" placeholder="nama@email.com"></div>
          <div class="settings-field"><label for="inviteUserPassword">Password Awal</label><input id="inviteUserPassword" type="password" minlength="6" maxlength="72" autocomplete="new-password" placeholder="Tentukan password pengguna"></div>
          <div class="settings-field"><label for="inviteUserRole">Jabatan / Hak Akses</label><select id="inviteUserRole"><option value="admin_keuangan">Admin Keuangan</option><option value="kasir">Kasir</option><option value="admin_gudang">Admin Gudang</option><option value="pengurus">Pengurus</option></select></div>
        </div>
        <div class="settings-actions"><button type="button" class="settings-btn" id="inviteUserSend">Kirim Undangan</button></div>
        <div id="inviteUserMessage" aria-live="polite"></div>
      </div>
      <div class="settings-card">
        <h3>🎨 Tampilan Aplikasi</h3>
        <p class="settings-help">Pilih tampilan terang atau gelap. Pilihan akan diingat pada perangkat dan browser ini.</p>
        <div class="settings-theme-row">
          <div class="settings-theme-state">
            <span class="theme-icon" id="settingsThemeIcon">🌙</span>
            <div><strong id="settingsThemeLabel">Mode Gelap</strong><small>Geser saklar untuk mengganti tema</small></div>
          </div>
          <button type="button" class="settings-theme-switch" id="settingsThemeSwitch" role="switch" aria-label="Ganti mode tampilan" aria-checked="false"></button>
        </div>
      </div>
      <div class="settings-card">
        <h3>ℹ️ Informasi Penyimpanan</h3>
        <p class="settings-help">Versi awal ini menyimpan profil dan pilihan tema di browser/perangkat yang digunakan. Sinkronisasi profil ke Supabase untuk seluruh pengguna akan dibuat pada tahap integrasi berikutnya.</p>
      </div>
      <div class="settings-card about-brand-card">
        <div class="about-brand-mark">D</div>
        <div class="about-brand-content">
          <span class="about-brand-eyebrow">ABOUT THIS APPLICATION</span>
          <h3>DAIBOEK</h3>
          <p class="about-brand-tagline">ERP & Financial Management System</p>
          <p class="about-brand-description">DAIBOEK dikembangkan sebagai sistem pengelolaan operasional dan keuangan yang membantu pencatatan, pemantauan, serta pengambilan keputusan secara lebih terstruktur.</p>
          <div class="about-brand-divider"></div>
          <div class="about-brand-credit"><span>Dikembangkan oleh</span><strong>Ahmad Nashirudin</strong></div>
          <div class="about-brand-credit"><span>Studio pengembang</span><strong>Nusa Pixel</strong></div>
          <p class="about-brand-footer">Dibuat dengan semangat untuk menghadirkan solusi digital yang bermanfaat.</p>
        </div>
      </div>`;
    parent.appendChild(section);
    const profile=getKDMPProfile();
    document.getElementById("settingsOrgName").value=profile.name||"Koperasi Desa";
    document.getElementById("settingsOrgEmail").value=profile.email||"";
    document.getElementById("settingsOrgPhone").value=profile.phone||"";
    document.getElementById("settingsOrgAddress").value=profile.address||"";
    if(profile.logo){document.getElementById("settingsLogoPreview").innerHTML=`<img src="${profile.logo}" alt="Logo koperasi">`;}
    document.getElementById("settingsLogoFile").addEventListener("change",event=>{
      const file=event.target.files?.[0];if(!file)return;
      if(file.size>1024*1024){event.target.value="";document.getElementById("settingsMessage").textContent="Ukuran logo maksimal 1 MB.";return;}
      const reader=new FileReader();reader.onload=()=>{section.dataset.pendingLogo=String(reader.result||"");document.getElementById("settingsLogoPreview").innerHTML=`<img src="${reader.result}" alt="Pratinjau logo">`;};reader.readAsDataURL(file);
    });
    document.getElementById("settingsSaveProfile").addEventListener("click",()=>{
      const name=document.getElementById("settingsOrgName").value.trim();
      if(!name){document.getElementById("settingsMessage").textContent="Nama koperasi wajib diisi.";return;}
      const old=getKDMPProfile();
      const profile={name,email:document.getElementById("settingsOrgEmail").value.trim(),phone:document.getElementById("settingsOrgPhone").value.trim(),address:document.getElementById("settingsOrgAddress").value.trim(),logo:section.dataset.pendingLogo||old.logo||""};
      try{localStorage.setItem("kdmp_erp_profile",JSON.stringify(profile));document.getElementById("settingsMessage").textContent="Profil berhasil disimpan di perangkat ini.";document.getElementById("settingsMessage").style.color="#159765";}
      catch(error){document.getElementById("settingsMessage").textContent="Gagal menyimpan. Ukuran logo mungkin terlalu besar.";document.getElementById("settingsMessage").style.color="#00a968";}
    });
    document.getElementById("settingsResetProfile").addEventListener("click",()=>{
      if(!confirm("Pulihkan profil ke default Koperasi Desa?"))return;
      localStorage.removeItem("kdmp_erp_profile");section.dataset.pendingLogo="";
      document.getElementById("settingsOrgName").value="Koperasi Desa";
      document.getElementById("settingsOrgEmail").value="";document.getElementById("settingsOrgPhone").value="";document.getElementById("settingsOrgAddress").value="";
      document.getElementById("settingsLogoPreview").textContent="Logo";document.getElementById("settingsLogoFile").value="";
      document.getElementById("settingsMessage").textContent="Profil default dipulihkan.";
    });
    document.getElementById("settingsThemeSwitch").addEventListener("click",()=>{
      const isDark=document.getElementById("settingsThemeSwitch").getAttribute("aria-checked")==="true";
      applyKDMPTheme(isDark?"light":"dark");
    });
    const inviteButton=document.getElementById("inviteUserSend");
    inviteButton.addEventListener("click",async()=>{
      const emailInput=document.getElementById("inviteUserEmail");
      const passwordInput=document.getElementById("inviteUserPassword");
      const roleInput=document.getElementById("inviteUserRole");
      const message=document.getElementById("inviteUserMessage");
      const email=emailInput.value.trim().toLowerCase();
      const password=passwordInput.value;
      const role=roleInput.value;
      message.className="";
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
        message.textContent="Masukkan alamat email yang valid.";
        message.className="error";
        emailInput.focus();
        return;
      }
      if(password.length<6){
        message.textContent="Password awal minimal 6 karakter.";
        message.className="error";
        passwordInput.focus();
        return;
      }
      const user=window.currentUser;
      if(!user?.id){
        message.textContent="Sesi login tidak ditemukan. Silakan login ulang.";
        message.className="error";
        return;
      }
      inviteButton.disabled=true;
      inviteButton.textContent="Mengirim undangan...";
      message.textContent="Memeriksa akses Manajer dan mengirim email...";
      try{
        const {data:memberships,error:membershipError}=await supabaseClient
          .from("cooperative_memberships")
          .select("cooperative_id")
          .eq("user_id",user.id)
          .eq("role","manajer")
          .eq("status","active")
          .limit(2);
        if(membershipError)throw new Error("Gagal memeriksa akses Manajer: "+membershipError.message);
        if(!memberships?.length)throw new Error("Akun ini belum terdaftar sebagai Manajer aktif koperasi.");
        if(memberships.length>1)throw new Error("Akun Manajer terdaftar di lebih dari satu koperasi. Pemilihan koperasi perlu diaktifkan sebelum undangan dikirim agar pengguna masuk ke koperasi yang benar.");
        const cooperativeId=memberships[0].cooperative_id;
        if(!cooperativeId)throw new Error("ID koperasi tidak ditemukan pada keanggotaan Manajer.");
        const {data,error}=await supabaseClient.functions.invoke("invite-user",{
          body:{cooperative_id:cooperativeId,email,password,role}
        });
        if(error){
          let detail="";
          try{detail=await error.context.clone().text();}catch(_){}
          let parsed=null;try{parsed=JSON.parse(detail);}catch(_){}
          throw new Error(parsed?.message||detail||error.message||"Undangan gagal dikirim.");
        }
        if(!data?.success)throw new Error(data?.message||"Undangan gagal dikirim.");
        message.textContent="Akun berhasil dibuat dan email akses dikirim ke "+email+". Minta pengguna memeriksa Inbox dan folder Spam.";
        message.className="success";
        emailInput.value="";
        passwordInput.value="";
      }catch(error){
        console.error("Invite user:",error);
        message.textContent=error.message||"Terjadi kesalahan saat mengirim undangan.";
        message.className="error";
      }finally{
        inviteButton.disabled=false;
        inviteButton.textContent="Kirim Undangan";
      }
    });
  }
  section.style.display="block";
  let theme="light";try{theme=localStorage.getItem("kdmp_erp_theme")||"light";}catch(_){}
  const toggle=document.getElementById("settingsThemeSwitch");
  if(toggle)toggle.setAttribute("aria-checked",String(theme==="dark"));
  const label=document.getElementById("settingsThemeLabel");
  if(label)label.textContent=theme==="dark"?"Mode Gelap":"Mode Terang";
  const icon=document.getElementById("settingsThemeIcon");
  if(icon)icon.textContent=theme==="dark"?"🌙":"☀️";
}

const kdmpOriginalShowPageForSettings=window.showPage;
window.showPage=function(page,button){
  const settings=document.getElementById("settingsContent");
  if(settings)settings.style.display="none";
  kdmpOriginalShowPageForSettings(page,button);
  if(page==="pengaturan")setupSettings();
};


// =====================================================
// REFERENSI DAIBOEK: RUMUS EXCEL & KAMUS AKUNTANSI
// =====================================================
const referenceExcelData = [
  {name:"SUM",category:"Matematika",syntax:"=SUM(number1, [number2], …)",example:"=SUM(B2:B10)",description:"Menjumlahkan seluruh angka dalam satu atau beberapa rentang.",use:"Menjumlahkan total pemasukan, pengeluaran, simpanan, atau penjualan."},
  {name:"AVERAGE",category:"Statistik",syntax:"=AVERAGE(number1, [number2], …)",example:"=AVERAGE(C2:C13)",description:"Menghitung nilai rata-rata dari sekumpulan angka.",use:"Menghitung rata-rata penjualan atau biaya per bulan."},
  {name:"MIN",category:"Statistik",syntax:"=MIN(number1, [number2], …)",example:"=MIN(D2:D20)",description:"Menampilkan nilai paling kecil dalam rentang.",use:"Mencari transaksi atau nilai penjualan terendah."},
  {name:"MAX",category:"Statistik",syntax:"=MAX(number1, [number2], …)",example:"=MAX(D2:D20)",description:"Menampilkan nilai paling besar dalam rentang.",use:"Mencari transaksi atau nilai penjualan tertinggi."},
  {name:"COUNT",category:"Statistik",syntax:"=COUNT(value1, [value2], …)",example:"=COUNT(A2:A100)",description:"Menghitung jumlah sel yang berisi angka.",use:"Menghitung banyaknya entri numerik."},
  {name:"COUNTA",category:"Statistik",syntax:"=COUNTA(value1, [value2], …)",example:"=COUNTA(A2:A100)",description:"Menghitung jumlah sel yang tidak kosong.",use:"Menghitung jumlah baris data yang telah diisi."},
  {name:"IF",category:"Logika",syntax:"=IF(logical_test, value_if_true, value_if_false)",example:'=IF(E2>=1000000,"Besar","Normal")',description:"Menghasilkan nilai berbeda berdasarkan suatu kondisi.",use:"Memberi label transaksi berdasarkan batas nominal."},
  {name:"AND",category:"Logika",syntax:"=AND(logical1, [logical2], …)",example:"=AND(B2>0,C2=\"Aktif\")",description:"Menghasilkan TRUE jika seluruh kondisi terpenuhi.",use:"Memeriksa beberapa syarat sekaligus."},
  {name:"OR",category:"Logika",syntax:"=OR(logical1, [logical2], …)",example:"=OR(C2=\"Tunai\",C2=\"Transfer\")",description:"Menghasilkan TRUE jika minimal satu kondisi terpenuhi.",use:"Memeriksa apakah transaksi memakai salah satu metode tertentu."},
  {name:"IFERROR",category:"Logika",syntax:"=IFERROR(value, value_if_error)",example:'=IFERROR(B2/C2,0)',description:"Mengganti hasil rumus yang menghasilkan error dengan nilai alternatif.",use:"Menghindari tampilan error pada perhitungan rasio."},
  {name:"SUMIF",category:"Perhitungan Bersyarat",syntax:"=SUMIF(range, criteria, [sum_range])",example:'=SUMIF(B2:B100,"Pemasukan",C2:C100)',description:"Menjumlahkan nilai yang memenuhi satu kriteria.",use:"Menjumlahkan transaksi berdasarkan jenisnya."},
  {name:"SUMIFS",category:"Perhitungan Bersyarat",syntax:"=SUMIFS(sum_range, criteria_range1, criteria1, …)",example:'=SUMIFS(D2:D100,B2:B100,"Penjualan",C2:C100,"Tunai")',description:"Menjumlahkan nilai berdasarkan beberapa kriteria sekaligus.",use:"Merekap penjualan berdasarkan jenis dan metode pembayaran."},
  {name:"COUNTIF",category:"Perhitungan Bersyarat",syntax:"=COUNTIF(range, criteria)",example:'=COUNTIF(B2:B100,"Lunas")',description:"Menghitung jumlah sel yang memenuhi satu kriteria.",use:"Menghitung jumlah invoice berstatus lunas."},
  {name:"COUNTIFS",category:"Perhitungan Bersyarat",syntax:"=COUNTIFS(criteria_range1, criteria1, …)",example:'=COUNTIFS(B2:B100,"Belum Lunas",C2:C100,"Jatuh Tempo")',description:"Menghitung data yang memenuhi beberapa kriteria.",use:"Menghitung tagihan belum lunas yang sudah jatuh tempo."},
  {name:"VLOOKUP",category:"Pencarian Data",syntax:"=VLOOKUP(lookup_value, table_array, col_index_num, [range_lookup])",example:"=VLOOKUP(A2,$H$2:$J$100,3,FALSE)",description:"Mencari nilai pada kolom pertama tabel dan mengambil data dari kolom lain di baris yang sama.",use:"Mengambil nama barang atau harga berdasarkan kode barang."},
  {name:"XLOOKUP",category:"Pencarian Data",syntax:"=XLOOKUP(lookup_value, lookup_array, return_array, [if_not_found])",example:'=XLOOKUP(A2,H2:H100,J2:J100,"Tidak ditemukan")',description:"Mencari nilai pada suatu rentang dan mengembalikan nilai yang sejajar; dapat mencari ke kiri maupun kanan.",use:"Mencari nama, satuan, atau harga barang dari kode barang."},
  {name:"INDEX",category:"Pencarian Data",syntax:"=INDEX(array, row_num, [column_num])",example:"=INDEX(C2:C100,5)",description:"Mengambil nilai pada posisi baris dan kolom tertentu dalam rentang.",use:"Mengambil data berdasarkan posisi hasil pencarian."},
  {name:"MATCH",category:"Pencarian Data",syntax:"=MATCH(lookup_value, lookup_array, [match_type])",example:"=MATCH(A2,H2:H100,0)",description:"Mengembalikan posisi relatif suatu nilai dalam rentang.",use:"Menemukan posisi kode akun atau kode barang."},
  {name:"TODAY",category:"Tanggal & Waktu",syntax:"=TODAY()",example:"=TODAY()",description:"Menghasilkan tanggal hari ini sesuai tanggal sistem.",use:"Membandingkan tanggal jatuh tempo dengan hari ini."},
  {name:"EOMONTH",category:"Tanggal & Waktu",syntax:"=EOMONTH(start_date, months)",example:"=EOMONTH(A2,0)",description:"Menghasilkan tanggal hari terakhir pada bulan yang ditentukan.",use:"Menentukan akhir periode laporan bulanan."},
  {name:"DATEDIF",category:"Tanggal & Waktu",syntax:"=DATEDIF(start_date, end_date, unit)",example:'=DATEDIF(A2,TODAY(),"d")',description:"Menghitung selisih antara dua tanggal dalam satuan hari, bulan, atau tahun.",use:"Menghitung umur piutang atau lama keanggotaan."},
  {name:"ROUND",category:"Matematika",syntax:"=ROUND(number, num_digits)",example:"=ROUND(B2,2)",description:"Membulatkan angka ke jumlah digit yang ditentukan.",use:"Membulatkan hasil rasio atau perhitungan nominal."},
  {name:"SUBTOTAL",category:"Rekapitulasi",syntax:"=SUBTOTAL(function_num, ref1, …)",example:"=SUBTOTAL(9,D2:D100)",description:"Menghitung subtotal dengan fungsi tertentu dan dapat mengabaikan baris yang difilter.",use:"Menjumlahkan data yang sedang terlihat setelah filter."},
  {name:"PMT",category:"Keuangan",syntax:"=PMT(rate, nper, pv, [fv], [type])",example:"=PMT(12%/12,12,-12000000)",description:"Menghitung pembayaran berkala untuk pinjaman dengan suku bunga dan jumlah periode tetap.",use:"Simulasi angsuran pinjaman. Pastikan periode bunga dan periode angsuran konsisten."},
  {name:"PV",category:"Keuangan",syntax:"=PV(rate, nper, pmt, [fv], [type])",example:"=PV(1%,12,-1000000)",description:"Menghitung nilai sekarang dari serangkaian pembayaran atau arus kas dengan tingkat bunga tetap.",use:"Analisis nilai kini arus kas."},
  {name:"FV",category:"Keuangan",syntax:"=FV(rate, nper, pmt, [pv], [type])",example:"=FV(1%,12,-500000,0)",description:"Menghitung nilai masa depan suatu investasi berdasarkan pembayaran dan tingkat bunga tetap.",use:"Simulasi perkembangan tabungan atau investasi."},
  {name:"TEXT",category:"Pengolahan Teks",syntax:"=TEXT(value, format_text)",example:'=TEXT(A2,"dd mmmm yyyy")',description:"Mengubah angka atau tanggal menjadi teks dengan format tertentu.",use:"Menampilkan tanggal atau angka dengan format laporan."},
  {name:"LEFT",category:"Pengolahan Teks",syntax:"=LEFT(text, [num_chars])",example:"=LEFT(A2,4)",description:"Mengambil sejumlah karakter dari sisi kiri teks.",use:"Mengambil awalan kode akun atau kode barang."},
  {name:"RIGHT",category:"Pengolahan Teks",syntax:"=RIGHT(text, [num_chars])",example:"=RIGHT(A2,3)",description:"Mengambil sejumlah karakter dari sisi kanan teks.",use:"Mengambil akhiran nomor dokumen."},
  {name:"CONCAT",category:"Pengolahan Teks",syntax:"=CONCAT(text1, [text2], …)",example:'=CONCAT(A2," - ",B2)',description:"Menggabungkan teks dari beberapa sel atau nilai.",use:"Menggabungkan kode dan nama akun/barang."}
];

const referenceAccountingData = [
  {name:"Aset",category:"Unsur Laporan Keuangan",definition:"Sumber daya ekonomi yang dikuasai entitas sebagai akibat peristiwa masa lalu dan diharapkan memberi manfaat ekonomi di masa depan.",function:"Menunjukkan sumber daya yang digunakan koperasi untuk menjalankan kegiatan.",example:"Kas, rekening bank, piutang anggota, persediaan barang, dan peralatan."},
  {name:"Liabilitas",category:"Unsur Laporan Keuangan",definition:"Kewajiban kini entitas yang timbul dari peristiwa masa lalu dan penyelesaiannya diperkirakan mengakibatkan arus keluar sumber daya.",function:"Menunjukkan kewajiban koperasi kepada pihak lain.",example:"Utang usaha, pinjaman bank, dan kewajiban yang masih harus dibayar."},
  {name:"Ekuitas",category:"Unsur Laporan Keuangan",definition:"Hak residual atas aset setelah dikurangi seluruh liabilitas.",function:"Menunjukkan bagian kekayaan bersih yang menjadi hak pemilik atau anggota sesuai ketentuan entitas.",example:"Simpanan pokok, simpanan wajib, dan cadangan sesuai kebijakan serta standar yang berlaku."},
  {name:"Pendapatan",category:"Unsur Laporan Keuangan",definition:"Arus masuk manfaat ekonomi atau peningkatan aset/penurunan liabilitas yang meningkatkan ekuitas, selain kontribusi pemilik/anggota dalam kapasitasnya sebagai pemilik.",function:"Mengukur hasil kegiatan usaha selama periode tertentu.",example:"Pendapatan penjualan barang dan pendapatan jasa."},
  {name:"Beban",category:"Unsur Laporan Keuangan",definition:"Penurunan manfaat ekonomi selama periode pelaporan yang menurunkan ekuitas, selain distribusi kepada pemilik/anggota.",function:"Mencatat sumber daya yang digunakan untuk menghasilkan pendapatan dan menjalankan kegiatan.",example:"Beban listrik, gaji, transportasi, dan penyusutan."},
  {name:"Debit",category:"Dasar Akuntansi",definition:"Sisi kiri dalam format akun atau jurnal.",function:"Dampaknya bergantung pada jenis akun; umumnya menambah aset dan beban, serta mengurangi liabilitas, ekuitas, dan pendapatan.",example:"Pembelian perlengkapan secara tunai: debit perlengkapan, kredit kas."},
  {name:"Kredit",category:"Dasar Akuntansi",definition:"Sisi kanan dalam format akun atau jurnal.",function:"Dampaknya bergantung pada jenis akun; umumnya menambah liabilitas, ekuitas, dan pendapatan, serta mengurangi aset dan beban.",example:"Penerimaan pendapatan tunai: debit kas, kredit pendapatan."},
  {name:"Jurnal Umum",category:"Proses Akuntansi",definition:"Catatan kronologis transaksi yang menunjukkan akun yang didebit dan dikredit.",function:"Menjadi catatan awal untuk mengklasifikasikan transaksi sebelum diposting ke buku besar.",example:"Mencatat pembelian persediaan, pembayaran beban, atau penerimaan pendapatan."},
  {name:"Buku Besar",category:"Proses Akuntansi",definition:"Kumpulan akun yang merangkum mutasi debit, kredit, dan saldo masing-masing akun.",function:"Menunjukkan pergerakan dan saldo setiap akun.",example:"Buku besar kas memperlihatkan saldo awal, penerimaan, pengeluaran, dan saldo akhir kas."},
  {name:"Neraca Saldo",category:"Laporan & Analisis",definition:"Daftar saldo akun buku besar pada tanggal tertentu yang disajikan dalam kolom debit dan kredit.",function:"Membantu memeriksa keseimbangan pencatatan debit dan kredit sebelum penyusunan laporan.",example:"Total saldo debit harus sama dengan total saldo kredit; keseimbangan tidak otomatis menjamin semua transaksi benar."},
  {name:"Neraca / Laporan Posisi Keuangan",category:"Laporan & Analisis",definition:"Laporan yang menyajikan aset, liabilitas, dan ekuitas pada tanggal tertentu.",function:"Menunjukkan posisi keuangan entitas pada suatu tanggal.",example:"Saldo kas, persediaan, utang usaha, dan ekuitas pada akhir bulan."},
  {name:"Laporan Laba Rugi",category:"Laporan & Analisis",definition:"Laporan yang menyajikan pendapatan dan beban selama suatu periode.",function:"Menilai hasil kinerja keuangan selama periode pelaporan.",example:"Pendapatan dikurangi beban menghasilkan surplus atau defisit/laba atau rugi sesuai konteks entitas."},
  {name:"Laporan Arus Kas",category:"Laporan & Analisis",definition:"Laporan arus kas masuk dan keluar yang dikelompokkan menurut aktivitas operasi, investasi, dan pendanaan.",function:"Menilai kemampuan entitas menghasilkan dan menggunakan kas.",example:"Penerimaan dari pelanggan, pembelian peralatan, dan penerimaan pinjaman."},
  {name:"HPP (Harga Pokok Penjualan)",category:"Persediaan & Penjualan",definition:"Biaya persediaan yang menjadi beban ketika barang terkait dijual.",function:"Mengukur biaya langsung barang yang terjual dan menjadi dasar perhitungan laba kotor.",example:"Barang dengan HPP Rp3.000 yang dijual Rp5.000 menghasilkan laba kotor Rp2.000 sebelum beban lain."},
  {name:"Laba Kotor",category:"Persediaan & Penjualan",definition:"Selisih antara penjualan neto dan harga pokok penjualan.",function:"Menunjukkan hasil penjualan setelah memperhitungkan biaya barang yang terjual, sebelum beban operasional lainnya.",example:"Penjualan Rp10 juta dikurangi HPP Rp6 juta menghasilkan laba kotor Rp4 juta."},
  {name:"Gross Profit Margin",category:"Rasio & Profitabilitas",definition:"Persentase laba kotor terhadap penjualan neto.",function:"Mengukur bagian penjualan yang tersisa setelah HPP diperhitungkan.",example:"(Penjualan − HPP) ÷ Penjualan × 100%. Penjualan Rp5.000 dan HPP Rp3.000 menghasilkan margin kotor 40%."},
  {name:"Net Profit Margin",category:"Rasio & Profitabilitas",definition:"Persentase laba atau surplus bersih terhadap pendapatan/penjualan neto sesuai basis laporan yang digunakan.",function:"Mengukur bagian pendapatan yang tersisa setelah seluruh beban yang relevan diperhitungkan.",example:"Laba bersih Rp1 juta ÷ penjualan neto Rp10 juta × 100% = 10%."},
  {name:"Markup",category:"Rasio & Profitabilitas",definition:"Persentase kenaikan harga jual terhadap biaya atau harga pokok.",function:"Membantu menetapkan harga jual berdasarkan biaya dan target kenaikan.",example:"(Harga jual − HPP) ÷ HPP × 100%. HPP Rp3.000 dan harga jual Rp5.000 menghasilkan markup 66,67%."},
  {name:"BEP (Break-Even Point)",category:"Rasio & Profitabilitas",definition:"Titik impas ketika total pendapatan sama dengan total biaya sehingga hasilnya nol.",function:"Membantu mengetahui jumlah penjualan minimum untuk menutup biaya pada asumsi tertentu.",example:"BEP unit = biaya tetap ÷ (harga jual per unit − biaya variabel per unit)."},
  {name:"Rekonsiliasi Bank",category:"Proses Akuntansi",definition:"Proses mencocokkan saldo dan transaksi menurut catatan entitas dengan rekening koran bank.",function:"Mengidentifikasi transaksi belum tercatat, biaya bank, setoran dalam perjalanan, atau perbedaan lainnya.",example:"Mencocokkan saldo buku bank dengan saldo rekening koran pada tanggal yang sama."},
  {name:"Piutang",category:"Akun & Modal Kerja",definition:"Hak entitas untuk menerima kas atau manfaat ekonomi dari pihak lain.",function:"Mencatat tagihan yang belum diterima pembayarannya.",example:"Penjualan kredit kepada pelanggan yang belum dilunasi."},
  {name:"Utang",category:"Akun & Modal Kerja",definition:"Kewajiban entitas untuk menyerahkan kas atau sumber daya lain kepada pihak lain.",function:"Memantau kewajiban pembayaran dan tanggal jatuh tempo.",example:"Pembelian barang secara kredit dari pemasok."},
  {name:"Akrual",category:"Dasar Akuntansi",definition:"Dasar pencatatan yang mengakui transaksi ketika hak atau kewajiban timbul, bukan semata-mata saat kas diterima atau dibayar.",function:"Mencerminkan pendapatan dan beban pada periode terjadinya sesuai ketentuan yang berlaku.",example:"Beban listrik bulan ini diakui meskipun tagihan dibayar bulan berikutnya."},
  {name:"Penyusutan",category:"Aset & Pengelolaan",definition:"Alokasi sistematis jumlah yang dapat disusutkan dari aset tetap selama umur manfaatnya.",function:"Membebankan biaya penggunaan aset tetap secara teratur selama masa manfaat.",example:"Penyusutan peralatan toko sesuai metode dan estimasi umur manfaat yang ditetapkan."},
  {name:"SHU (Sisa Hasil Usaha)",category:"Koperasi",definition:"Hasil usaha koperasi dalam satu tahun buku setelah pendapatan dikurangi beban, penyusutan, kewajiban, dan komponen lain sesuai ketentuan yang berlaku.",function:"Menunjukkan hasil usaha koperasi yang selanjutnya penggunaannya diputuskan sesuai AD/ART dan peraturan koperasi.",example:"SHU tahunan dibahas dalam rapat anggota dan dialokasikan sesuai ketentuan koperasi."},
  {name:"Simpanan Pokok",category:"Koperasi",definition:"Sejumlah uang yang wajib dibayarkan anggota pada saat masuk menjadi anggota, sesuai ketentuan koperasi.",function:"Merupakan salah satu komponen modal koperasi berdasarkan ketentuan dan kebijakan yang berlaku.",example:"Anggota menyetorkan simpanan pokok sesuai nominal yang ditetapkan dalam AD/ART."},
  {name:"Simpanan Wajib",category:"Koperasi",definition:"Simpanan yang wajib dibayar anggota secara berkala sesuai ketentuan koperasi.",function:"Mendukung penghimpunan modal koperasi secara berkala.",example:"Anggota membayar simpanan wajib setiap bulan sesuai keputusan koperasi."},
  {name:"Modal Kerja",category:"Akun & Modal Kerja",definition:"Sumber daya jangka pendek yang digunakan untuk mendukung kegiatan operasional sehari-hari; sering dianalisis melalui aset lancar dikurangi liabilitas jangka pendek.",function:"Menilai kemampuan entitas memenuhi kebutuhan operasional dan kewajiban jangka pendek.",example:"Modal kerja bersih = aset lancar − liabilitas jangka pendek."},
  {name:"Rasio Lancar (Current Ratio)",category:"Rasio & Profitabilitas",definition:"Perbandingan aset lancar dengan liabilitas jangka pendek.",function:"Mengukur kemampuan jangka pendek memenuhi kewajiban lancar.",example:"Aset lancar Rp20 juta ÷ liabilitas lancar Rp10 juta = 2 kali."}
];

function escapeReferenceHTML(value){
  return String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
}

function setupReferenceLibrary(){
  const parent=document.getElementById("modulePage");
  if(!parent)return;
  let section=document.getElementById("referenceLibraryContent");
  if(!section){
    section=document.createElement("section");
    section.id="referenceLibraryContent";
    section.className="page erp-content reference-library";
    section.innerHTML=`
      <div class="reference-hero">
        <div class="reference-hero-icon">📚</div>
        <div><span class="reference-eyebrow">PUSAT REFERENSI DAIBOEK</span><h2>Rumus Excel & Kamus Akuntansi</h2><p>Temukan rumus spreadsheet dan pahami istilah akuntansi dengan contoh yang dekat dengan kegiatan koperasi.</p></div>
      </div>
      <div class="reference-tabs" role="tablist" aria-label="Jenis referensi">
        <button type="button" class="reference-tab active" data-reference-tab="excel" role="tab" aria-selected="true">📊 Rumus Excel</button>
        <button type="button" class="reference-tab" data-reference-tab="accounting" role="tab" aria-selected="false">📖 Kamus Akuntansi</button>
      </div>
      <div class="reference-toolbar">
        <div class="reference-search"><span>⌕</span><input id="referenceSearch" type="search" placeholder="Cari rumus, istilah, atau fungsi..." autocomplete="off"><button type="button" id="referenceClearSearch" aria-label="Hapus pencarian">×</button></div>
        <select id="referenceCategory" aria-label="Filter kategori"><option value="all">Semua kategori</option></select>
      </div>
      <div class="reference-meta"><span id="referenceCount">Memuat referensi...</span><span>Materi referensi · Versi awal</span></div>
      <div id="referenceCards" class="reference-cards"></div>
      <div id="referenceDetail" class="reference-detail" hidden></div>
      <div class="reference-note"><strong>Catatan:</strong> Contoh rumus menggunakan nama fungsi Excel berbahasa Inggris dan pemisah koma. Pada beberapa pengaturan regional, Excel menggunakan titik koma. Pastikan rumus diuji pada salinan data sebelum digunakan untuk pembukuan resmi.</div>`;
    parent.appendChild(section);
    section.querySelectorAll("[data-reference-tab]").forEach(button=>button.addEventListener("click",()=>{
      section.querySelectorAll("[data-reference-tab]").forEach(tab=>{const active=tab===button;tab.classList.toggle("active",active);tab.setAttribute("aria-selected",String(active));});
      document.getElementById("referenceDetail").hidden=true;
      renderReferenceLibrary();
    }));
    document.getElementById("referenceSearch").addEventListener("input",()=>{document.getElementById("referenceDetail").hidden=true;renderReferenceLibrary();});
    document.getElementById("referenceCategory").addEventListener("change",()=>{document.getElementById("referenceDetail").hidden=true;renderReferenceLibrary();});
    document.getElementById("referenceClearSearch").addEventListener("click",()=>{document.getElementById("referenceSearch").value="";renderReferenceLibrary();});
    document.getElementById("referenceCards").addEventListener("click",event=>{
      const button=event.target.closest("[data-reference-index]");if(!button)return;
      const isExcel=document.querySelector('[data-reference-tab].active')?.dataset.referenceTab==="excel";
      const list=isExcel?referenceExcelData:referenceAccountingData;
      showReferenceDetail(list[Number(button.dataset.referenceIndex)],isExcel);
    });
    document.getElementById("referenceDetail").addEventListener("click",async event=>{
      const copyButton=event.target.closest("[data-copy-reference]");
      if(copyButton){
        const text=copyButton.dataset.copyReference||"";
        try{await navigator.clipboard.writeText(text);copyButton.textContent="Tersalin ✓";}
        catch(_){const area=document.createElement("textarea");area.value=text;document.body.appendChild(area);area.select();try{document.execCommand("copy");copyButton.textContent="Tersalin ✓";}catch(__){copyButton.textContent="Salin manual";}area.remove();}
      }
      if(event.target.closest("[data-reference-back]"))document.getElementById("referenceDetail").hidden=true;
    });
  }
  section.style.display="block";
  renderReferenceLibrary();
}

function renderReferenceLibrary(){
  const active=document.querySelector('[data-reference-tab].active')?.dataset.referenceTab||"excel";
  const isExcel=active==="excel";
  const data=isExcel?referenceExcelData:referenceAccountingData;
  const query=(document.getElementById("referenceSearch")?.value||"").trim().toLocaleLowerCase("id-ID");
  const category=document.getElementById("referenceCategory");
  const categories=[...new Set(data.map(item=>item.category))].sort((a,b)=>a.localeCompare(b,"id"));
  const currentCategory=category?.dataset.kind===active?category.value:"all";
  if(category){category.dataset.kind=active;category.innerHTML='<option value="all">Semua kategori</option>'+categories.map(item=>`<option value="${escapeReferenceHTML(item)}">${escapeReferenceHTML(item)}</option>`).join("");category.value=categories.includes(currentCategory)?currentCategory:"all";}
  const selectedCategory=category?.value||"all";
  const filtered=data.map((item,index)=>({...item,index})).filter(item=>{
    const haystack=Object.values(item).join(" ").toLocaleLowerCase("id-ID");
    return (selectedCategory==="all"||item.category===selectedCategory)&&(!query||haystack.includes(query));
  });
  const count=document.getElementById("referenceCount");if(count)count.textContent=`Menampilkan ${filtered.length} dari ${data.length} ${isExcel?"rumus":"istilah"}`;
  const cards=document.getElementById("referenceCards");if(!cards)return;
  cards.innerHTML=filtered.length?filtered.map(item=>`
    <button type="button" class="reference-card" data-reference-index="${item.index}">
      <span class="reference-card-top"><span class="reference-category">${escapeReferenceHTML(item.category)}</span><span class="reference-arrow">↗</span></span>
      <strong>${escapeReferenceHTML(item.name)}</strong>
      <span class="reference-card-description">${escapeReferenceHTML(isExcel?item.description:item.definition)}</span>
      ${isExcel?`<code>${escapeReferenceHTML(item.example)}</code>`:""}
      <span class="reference-card-link">Lihat detail →</span>
    </button>`).join(""):`<div class="reference-empty"><strong>Tidak ada hasil yang cocok.</strong><span>Coba kata kunci atau kategori lain.</span></div>`;
}

function showReferenceDetail(item,isExcel){
  const detail=document.getElementById("referenceDetail");if(!detail)return;
  detail.innerHTML=isExcel?`
    <div class="reference-detail-head"><button type="button" class="reference-back" data-reference-back>← Kembali ke daftar</button><span class="reference-category">${escapeReferenceHTML(item.category)}</span></div>
    <h3>${escapeReferenceHTML(item.name)}</h3><p>${escapeReferenceHTML(item.description)}</p>
    <div class="reference-detail-block"><span>Sintaks</span><code>${escapeReferenceHTML(item.syntax)}</code><button type="button" data-copy-reference="${escapeReferenceHTML(item.syntax)}">Salin sintaks</button></div>
    <div class="reference-detail-block"><span>Contoh rumus</span><code>${escapeReferenceHTML(item.example)}</code><button type="button" data-copy-reference="${escapeReferenceHTML(item.example)}">Salin rumus</button></div>
    <div class="reference-detail-block"><span>Penerapan di koperasi</span><p>${escapeReferenceHTML(item.use)}</p></div>`:`
    <div class="reference-detail-head"><button type="button" class="reference-back" data-reference-back>← Kembali ke daftar</button><span class="reference-category">${escapeReferenceHTML(item.category)}</span></div>
    <h3>${escapeReferenceHTML(item.name)}</h3>
    <div class="reference-detail-block"><span>Pengertian</span><p>${escapeReferenceHTML(item.definition)}</p></div>
    <div class="reference-detail-block"><span>Fungsi</span><p>${escapeReferenceHTML(item.function)}</p></div>
    <div class="reference-detail-block"><span>Contoh</span><p>${escapeReferenceHTML(item.example)}</p></div>`;
  detail.hidden=false;
  detail.scrollIntoView({behavior:"smooth",block:"nearest"});
}

const referencePreviousShowPage=window.showPage;
window.showPage=function(page,button){
  const reference=document.getElementById("referenceLibraryContent");
  if(reference)reference.style.display="none";
  referencePreviousShowPage(page,button);
  if(page==="rumus-kamus")setupReferenceLibrary();
};


// Centralized frontend page permissions. Database RLS remains the security boundary.
const KDMP_ROLE_PAGES={
  manajer:["dashboard",...Object.keys(modules)],
  admin_keuangan:[
    "dashboard","keuangan","coa","jurnal","buku-besar","laporan",
    "utang-piutang","bank","invoice","simpanan","bulanan","rumus-kamus"
  ],
  kasir:["toko","rumus-kamus"],
  admin_gudang:["persediaan","rumus-kamus"],
  pengurus:["dashboard","buku-besar","laporan","simpanan","bulanan","monitoring","rumus-kamus"]
};

function kdmpCanAccessPage(page,role=window.currentUser?.role){
  const allowed=KDMP_ROLE_PAGES[role]||[];
  return allowed.includes(page);
}

function applyRoleMenuVisibility(){
  const role=window.currentUser?.role;
  document.querySelectorAll(".menu button").forEach(button=>{
    const match=button.getAttribute("onclick")?.match(/showPage\(['"]([^'"]+)['"]/);
    if(!match)return;
    button.hidden=!kdmpCanAccessPage(match[1],role);
  });
  const inviteCard=document.getElementById("settingsInviteCard");
  if(inviteCard)inviteCard.hidden=role!=="manajer";
}

const kdmpShowPageBeforeRoleGuard=window.showPage;
window.showPage=function(page,button){
  if(!kdmpCanAccessPage(page)){
    console.warn("Akses menu ditolak untuk role:",window.currentUser?.role,"halaman:",page);
    return;
  }
  return kdmpShowPageBeforeRoleGuard(page,button);
};
