// ── TAB SWITCHER ──────────────────────────────────────────────
function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach((btn, i) => {
    btn.classList.toggle('active', tab === 'login' ? i === 0 : i === 1);
  });
  document.getElementById('loginPanel').classList.toggle('active', tab === 'login');
  document.getElementById('registerPanel').classList.toggle('active', tab === 'register');
}

// ── ALERT HELPER ──────────────────────────────────────────────
function showAlert(id, msg, type, shakeFields) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = (type === 'error' ? '&#10007; ' : '&#10003; ') + msg;
  el.className = `alert ${type}`;
  el.style.display = 'flex';
  el.classList.remove('shake');
  void el.offsetWidth;
  el.classList.add('shake');
  if (type === 'error' && shakeFields) {
    shakeFields.forEach(fid => {
      const inp = document.getElementById(fid);
      if (!inp) return;
      inp.classList.add('field-error', 'shake');
      setTimeout(() => inp.classList.remove('shake'), 500);
      inp.addEventListener('input', () => inp.classList.remove('field-error'), { once: true });
    });
  }
}

// ── STORAGE HELPERS ───────────────────────────────────────────
function getUsers()  { return JSON.parse(localStorage.getItem('nb_users') || '[]'); }
function saveUsers(u){ localStorage.setItem('nb_users', JSON.stringify(u)); }  
function getTxns(acc){ return JSON.parse(localStorage.getItem('nb_tx_' + acc) || '[]'); }
function saveTxns(acc, t){ localStorage.setItem('nb_tx_' + acc, JSON.stringify(t)); }
function getLoans(acc){ return JSON.parse(localStorage.getItem('nb_loans_' + acc) || '[]'); }
function saveLoans(acc, l){ localStorage.setItem('nb_loans_' + acc, JSON.stringify(l)); }
function getAllLoanRequests()    { return JSON.parse(localStorage.getItem('nb_loan_requests') || '[]'); }
function saveAllLoanRequests(r) { localStorage.setItem('nb_loan_requests', JSON.stringify(r)); }

function hashPass(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h) ^ str.charCodeAt(i);
  return (h >>> 0).toString(16);
}

function genAccNo() {
  const users = getUsers();
  const max = users.reduce((m, u) => {
    const n = parseInt((u.account || '').replace('ACC', '')) || 1000000000;
    return n > m ? n : m;
  }, 1000000000);
  return 'ACC' + (max + 1);
}

function genTxnId()  { return 'TXN' + Date.now() + Math.floor(Math.random()*1000); }
function genLoanId() { return 'LN' + Date.now().toString().slice(-8); }

function fmtDate(d) {
  return new Date(d).toLocaleString('en-IN', {day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
}

// ── SEED DEMO DATA ────────────────────────────────────────────
(function seedDemo() {
  let users = getUsers();
  const ACC = 'ACC1000000001';

  // Seed admin
  if (!users.find(u => u.email === 'admin@demobank.com')) {
    users.push({
      id: 'ADMIN001',
      name: 'Bank Administrator',
      email: 'admin@demobank.com',
      phone: '9000000000',
      password: hashPass('admin123'),
      account: 'ADMIN',
      accountType: 'Admin',
      balance: 0,
      status: 'Active',
      address: 'DemoBank HQ',
      created: '2023-01-01',
      isAdmin: true
    });
  }

  // Seed demo customer
  if (!users.find(u => u.email === 'arjun@demo.com')) {
    users.push({
      id: 'USR001',
      name: 'Arjun Sharma',
      email: 'arjun@demo.com',
      phone: '9876543210',
      password: hashPass('demo123'),
      account: ACC,
      accountType: 'Savings',
      balance: 2000,
      status: 'Active',
      address: '123 MG Road, Agra, UP',
      created: '2023-01-15'
    });
    saveUsers(users);

    const now = Date.now();
    const txns = [
      { TxnID:'TXN001', Type:'Credit', Amount:50000, Balance:50000,  Description:'Account Opening Bonus',      DateTime:fmtDate(now-86400000*30), Status:'Success' },
      { TxnID:'TXN002', Type:'Credit', Amount:15000, Balance:65000,  Description:'Salary - January 2024',      DateTime:fmtDate(now-86400000*28), Status:'Success' },
      { TxnID:'TXN003', Type:'Debit',  Amount:8500,  Balance:56500,  Description:'Online Shopping - Amazon',   DateTime:fmtDate(now-86400000*25), Status:'Success' },
      { TxnID:'TXN004', Type:'Debit',  Amount:2200,  Balance:54300,  Description:'Electricity Bill Payment',   DateTime:fmtDate(now-86400000*22), Status:'Success' },
      { TxnID:'TXN005', Type:'Credit', Amount:15000, Balance:69300,  Description:'Salary - February 2024',     DateTime:fmtDate(now-86400000*14), Status:'Success' },
      { TxnID:'TXN006', Type:'Debit',  Amount:45000, Balance:24300,  Description:'Rent Payment - Flat 204',    DateTime:fmtDate(now-86400000*12), Status:'Success' },
      { TxnID:'TXN007', Type:'Debit',  Amount:1800,  Balance:22500,  Description:'Grocery - DMart',            DateTime:fmtDate(now-86400000*10), Status:'Success' },
      { TxnID:'TXN008', Type:'Credit', Amount:5000,  Balance:27500,  Description:'UPI Received - Rahul',       DateTime:fmtDate(now-86400000*7),  Status:'Success' },
      { TxnID:'TXN009', Type:'Debit',  Amount:3500,  Balance:24000,  Description:'OTT & Mobile Recharge',      DateTime:fmtDate(now-86400000*5),  Status:'Success' },
      { TxnID:'TXN010', Type:'Debit',  Amount:22000, Balance:2000,   Description:'Personal Loan EMI',          DateTime:fmtDate(now-86400000*2),  Status:'Success' },
    ];
    saveTxns(ACC, txns);

    // Seed loan requests (already approved)
    const existingRequests = getAllLoanRequests();
    const seedReqs = [
      { RequestID:'LN20240115', AccountNo:ACC, LoanType:'Personal',  Amount:200000, Rate:10.5, Tenure:24, EMI:9280.50,  Status:'Approved', AppliedOn:fmtDate(now-86400000*60), DecidedOn:fmtDate(now-86400000*59) },
      { RequestID:'LN20240210', AccountNo:ACC, LoanType:'Education', Amount:75000,  Rate:8.0,  Tenure:12, EMI:6529.16,  Status:'Approved', AppliedOn:fmtDate(now-86400000*45), DecidedOn:fmtDate(now-86400000*44) }
    ];
    seedReqs.forEach(r => { if (!existingRequests.find(x => x.RequestID === r.RequestID)) existingRequests.push(r); });
    saveAllLoanRequests(existingRequests);

    const loans = [
      {
        LoanID:'LN20240115', LoanType:'Personal', Principal:200000, Rate:10.5, Tenure:24, EMI:9280.50,
        Status:'Active', AppliedOn:fmtDate(now-86400000*60),
        Transactions:[
          { Date:fmtDate(now-86400000*60), Description:'Loan Disbursement', Amount:200000, Type:'Credit' },
          { Date:fmtDate(now-86400000*30), Description:'EMI Payment #1',    Amount:9280.50, Type:'Debit' },
          { Date:fmtDate(now-86400000*2),  Description:'EMI Payment #2',    Amount:9280.50, Type:'Debit' },
        ]
      },
      {
        LoanID:'LN20240210', LoanType:'Education', Principal:75000, Rate:8.0, Tenure:12, EMI:6529.16,
        Status:'Active', AppliedOn:fmtDate(now-86400000*45),
        Transactions:[
          { Date:fmtDate(now-86400000*45), Description:'Loan Disbursement', Amount:75000,  Type:'Credit' },
          { Date:fmtDate(now-86400000*15), Description:'EMI Payment #1',    Amount:6529.16, Type:'Debit' },
        ]
      }
    ];
    saveLoans(ACC, loans);
  } else {
    saveUsers(users);
  }
})();

// ── LOGIN ─────────────────────────────────────────────────────
function doLogin() {
  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPass').value;
  if (!email || !password) {
    showAlert('loginAlert', 'Please fill all fields.', 'error',
      [!email ? 'loginEmail' : null, !password ? 'loginPass' : null].filter(Boolean));
    return;
  }
  const btn = document.querySelector('#loginPanel .btn-primary');
  btn.textContent = 'Signing in...';
  btn.disabled = true;

  const users     = getUsers();
  const emailMatch = users.find(u => u.email === email);
  const user       = emailMatch && emailMatch.password === hashPass(password) ? emailMatch : null;

  setTimeout(() => {
    if (user) {
      if (user.status !== 'Active') {
        showAlert('loginAlert', 'Your account is inactive. Contact support.', 'error');
      } else if (user.isAdmin) {
        // Admin → admin panel
        localStorage.setItem('nb_admin_session', user.id);
        showAlert('loginAlert', 'Admin login successful! Redirecting…', 'success');
        setTimeout(() => { window.location.href = 'admin.html'; }, 800);
        return;
      } else {
        // Customer → dashboard
        localStorage.setItem('nb_session', user.account);
        showAlert('loginAlert', 'Login successful! Redirecting…', 'success');
        setTimeout(() => { window.location.href = 'dashboard.html'; }, 800);
        return;
      }
    } else if (!emailMatch) {
      showAlert('loginAlert', 'No account found with this email address.', 'error', ['loginEmail']);
    } else {
      showAlert('loginAlert', 'Incorrect password. Please try again.', 'error', ['loginPass']);
    }
    btn.innerHTML = 'Sign In to Dashboard<div class="gold-line"></div>';
    btn.disabled = false;
  }, 400);
}

// ── REGISTER ──────────────────────────────────────────────────
function doRegister() {
  const name        = document.getElementById('regName').value.trim();
  const phone       = document.getElementById('regPhone').value.trim();
  const email       = document.getElementById('regEmail').value.trim();
  const password    = document.getElementById('regPass').value;
  const accountType = document.getElementById('regAccType').value;
  const city        = document.getElementById('regCity').value.trim();

  if (!name || !phone || !email || !password) {
    const missing = [!name&&'regName',!phone&&'regPhone',!email&&'regEmail',!password&&'regPass'].filter(Boolean);
    showAlert('regAlert', 'Please fill all required fields.', 'error', missing);
    return;
  }
  if (password.length < 6) {
    showAlert('regAlert', 'Password must be at least 6 characters.', 'error', ['regPass']);
    return;
  }

  const btn = document.querySelector('#registerPanel .btn-primary');
  btn.textContent = 'Creating account…';
  btn.disabled = true;

  const users = getUsers();
  if (users.find(u => u.email === email)) {
    showAlert('regAlert', 'This email is already registered. Please sign in.', 'error', ['regEmail']);
    btn.innerHTML = 'Create My Account<div class="gold-line"></div>';
    btn.disabled = false;
    return;
  }

  const accNo = genAccNo();
  users.push({
    id: 'USR' + String(users.length + 1).padStart(3,'0'),
    name, email, phone,
    password: hashPass(password),
    account: accNo,
    accountType,
    balance: 0,
    status: 'Active',
    address: city,
    created: new Date().toISOString().slice(0,10)
  });
  saveUsers(users);
  showAlert('regAlert', `Account created! Your number: ${accNo}. Switching to login…`, 'success');
  setTimeout(() => {
    switchTab('login');
    btn.innerHTML = 'Create My Account<div class="gold-line"></div>';
    btn.disabled = false;
  }, 2500);
}
