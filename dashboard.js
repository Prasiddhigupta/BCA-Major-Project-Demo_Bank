// ── HELPERS ───────────────────────────────────────────────────
let currentAccount = null;
let selectedLoanType = 'Personal';
let selectedLoanRate = 10.5;

const fmt = n => '₹' + parseFloat(n||0).toLocaleString('en-IN', {minimumFractionDigits:2, maximumFractionDigits:2});

function fmtDate(d) {
  return new Date(d).toLocaleString('en-IN', {day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
}

function genTxnId()    { return 'TXN' + Date.now() + Math.floor(Math.random()*1000); }
function genLoanId()   { return 'LN' + Date.now().toString().slice(-8); }
function genRequestId(){ return 'REQ' + Date.now().toString().slice(-8); }

// ── STORAGE ────────────────────────────────────────────────────
function getUsers()             { return JSON.parse(localStorage.getItem('nb_users') || '[]'); }
function saveUsers(u)           { localStorage.setItem('nb_users', JSON.stringify(u)); }
function getTxns(acc)           { return JSON.parse(localStorage.getItem('nb_tx_' + acc) || '[]'); }
function saveTxns(acc, t)       { localStorage.setItem('nb_tx_' + acc, JSON.stringify(t)); }
function getLoans(acc)          { return JSON.parse(localStorage.getItem('nb_loans_' + acc) || '[]'); }
function saveLoans(acc, l)      { localStorage.setItem('nb_loans_' + acc, JSON.stringify(l)); }
function getAllLoanRequests()    { return JSON.parse(localStorage.getItem('nb_loan_requests') || '[]'); }
function saveAllLoanRequests(r) { localStorage.setItem('nb_loan_requests', JSON.stringify(r)); }

function hashPass(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h) ^ str.charCodeAt(i);
  return (h >>> 0).toString(16);
}

// ── SEED DEMO USER & ADMIN ─────────────────────────────────────
(function seedDemo() {
  const users = getUsers();
  const ACC = 'ACC1000000001';

  // Seed admin account
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
      { TxnID: 'TXN001', Type: 'Credit', Amount: 50000, Balance: 50000, Description: 'Account Opening Bonus', DateTime: fmtDate(now - 86400000*30), Status: 'Success' },
      { TxnID: 'TXN002', Type: 'Credit', Amount: 15000, Balance: 65000, Description: 'Salary - January 2024', DateTime: fmtDate(now - 86400000*28), Status: 'Success' },
      { TxnID: 'TXN003', Type: 'Debit', Amount: 8500, Balance: 56500, Description: 'Online Shopping - Amazon', DateTime: fmtDate(now - 86400000*25), Status: 'Success' },
      { TxnID: 'TXN004', Type: 'Debit', Amount: 2200, Balance: 54300, Description: 'Electricity Bill Payment', DateTime: fmtDate(now - 86400000*22), Status: 'Success' },
      { TxnID: 'TXN005', Type: 'Credit', Amount: 15000, Balance: 69300, Description: 'Salary - February 2024', DateTime: fmtDate(now - 86400000*14), Status: 'Success' },
      { TxnID: 'TXN006', Type: 'Debit', Amount: 45000, Balance: 24300, Description: 'Rent Payment - Flat 204', DateTime: fmtDate(now - 86400000*12), Status: 'Success' },
      { TxnID: 'TXN007', Type: 'Debit', Amount: 1800, Balance: 22500, Description: 'Grocery - DMart', DateTime: fmtDate(now - 86400000*10), Status: 'Success' },
      { TxnID: 'TXN008', Type: 'Credit', Amount: 5000, Balance: 27500, Description: 'UPI Received - Rahul', DateTime: fmtDate(now - 86400000*7), Status: 'Success' },
      { TxnID: 'TXN009', Type: 'Debit', Amount: 3500, Balance: 24000, Description: 'OTT & Mobile Recharge', DateTime: fmtDate(now - 86400000*5), Status: 'Success' },
      { TxnID: 'TXN010', Type: 'Debit', Amount: 22000, Balance: 2000, Description: 'Personal Loan EMI', DateTime: fmtDate(now - 86400000*2), Status: 'Success' },
    ];
    saveTxns(ACC, txns);

    // Seed existing loans as already-approved loan requests
    const existingRequests = getAllLoanRequests();
    const seedRequests = [
      {
        RequestID: 'LN20240115',
        AccountNo: ACC,
        LoanType: 'Personal',
        Amount: 200000,
        Rate: 10.5,
        Tenure: 24,
        EMI: 9280.50,
        Status: 'Approved',
        AppliedOn: fmtDate(now - 86400000*60),
        DecidedOn: fmtDate(now - 86400000*59)
      },
      {
        RequestID: 'LN20240210',
        AccountNo: ACC,
        LoanType: 'Education',
        Amount: 75000,
        Rate: 8.0,
        Tenure: 12,
        EMI: 6529.16,
        Status: 'Approved',
        AppliedOn: fmtDate(now - 86400000*45),
        DecidedOn: fmtDate(now - 86400000*44)
      }
    ];
    seedRequests.forEach(r => { if (!existingRequests.find(x => x.RequestID === r.RequestID)) existingRequests.push(r); });
    saveAllLoanRequests(existingRequests);

    const loans = [
      {
        LoanID: 'LN20240115', LoanType: 'Personal', Principal: 200000, Rate: 10.5, Tenure: 24, EMI: 9280.50,
        Status: 'Active', AppliedOn: fmtDate(now - 86400000*60),
        Transactions: [
          { Date: fmtDate(now - 86400000*60), Description: 'Loan Disbursement', Amount: 200000, Type: 'Credit' },
          { Date: fmtDate(now - 86400000*30), Description: 'EMI Payment #1', Amount: 9280.50, Type: 'Debit' },
          { Date: fmtDate(now - 86400000*2), Description: 'EMI Payment #2', Amount: 9280.50, Type: 'Debit' },
        ]
      },
      {
        LoanID: 'LN20240210', LoanType: 'Education', Principal: 75000, Rate: 8.0, Tenure: 12, EMI: 6529.16,
        Status: 'Active', AppliedOn: fmtDate(now - 86400000*45),
        Transactions: [
          { Date: fmtDate(now - 86400000*45), Description: 'Loan Disbursement', Amount: 75000, Type: 'Credit' },
          { Date: fmtDate(now - 86400000*15), Description: 'EMI Payment #1', Amount: 6529.16, Type: 'Debit' },
        ]
      }
    ];
    saveLoans(ACC, loans);
  } else {
    saveUsers(users);
  }
})();

// ── INIT ───────────────────────────────────────────────────────
function init() {
  const accNo = localStorage.getItem('nb_session');
  if (!accNo) { window.location.href = 'index.html'; return; }
  currentAccount = accNo;
  const users = getUsers();
  const user = users.find(u => u.account === accNo);
  if (!user) { window.location.href = 'index.html'; return; }
  populateUI(user);
  renderTransactions();
  renderLoans();
}

function getUser() {
  const users = getUsers();
  return users.find(u => u.account === currentAccount);
}

function updateUser(updates) {
  const users = getUsers();
  const idx = users.findIndex(u => u.account === currentAccount);
  if (idx === -1) return;
  Object.assign(users[idx], updates);
  saveUsers(users);
}

// ── POPULATE UI ────────────────────────────────────────────────
function populateUI(user) {
  const b = user.balance;
  document.getElementById('sidebarInitial').textContent = user.name[0];
  document.getElementById('sidebarName').textContent = user.name;
  document.getElementById('sidebarAcc').textContent = user.account;
  document.getElementById('topBarBalance').textContent = fmt(b);
  document.getElementById('balanceMain').textContent = fmt(b);
  document.getElementById('accTypeMain').textContent = user.accountType + ' Account';
  ['deposit','withdraw','transfer'].forEach(t => {
    const el = document.getElementById(t + 'BalShow');
    if (el) el.textContent = fmt(b);
    const acc = document.getElementById(t + 'AccShow');
    if (acc) acc.textContent = user.account;
  });
  document.getElementById('depositTypeShow').textContent = user.accountType;
  document.getElementById('profileInitial').textContent = user.name[0];
  document.getElementById('profileName').textContent = user.name;
  document.getElementById('profileEmail').textContent = user.email;
  document.getElementById('profilePhone').textContent = '📞 ' + user.phone;
  document.getElementById('profileAcc').textContent = user.account;
  document.getElementById('pAccType').textContent = user.accountType;
  document.getElementById('pBalance').textContent = fmt(b);
  document.getElementById('pSince').textContent = user.created;
  document.getElementById('pStatus').textContent = user.status;
  document.getElementById('pAddress').textContent = user.address || '—';
}

function refreshBalance() {
  const user = getUser();
  if (!user) return;
  const b = user.balance;
  document.getElementById('topBarBalance').textContent = fmt(b);
  document.getElementById('balanceMain').textContent = fmt(b);
  document.getElementById('pBalance').textContent = fmt(b);
  ['deposit','withdraw','transfer'].forEach(t => {
    const el = document.getElementById(t + 'BalShow');
    if (el) el.textContent = fmt(b);
  });
}

// ── TRANSACTIONS ───────────────────────────────────────────────
function renderTransactions() {
  const txns = getTxns(currentAccount);
  let credits = 0, debits = 0;
  txns.forEach(t => {
    if (t.Type === 'Credit') credits += parseFloat(t.Amount || 0);
    else debits += parseFloat(t.Amount || 0);
  });
  document.getElementById('totalCredits').textContent = fmt(credits);
  document.getElementById('totalDebits').textContent = fmt(debits);
  document.getElementById('txCount').textContent = txns.length + ' records';

  const el = document.getElementById('recentTxList');
  const recent = [...txns].reverse().slice(0, 6);
  if (!recent.length) { el.innerHTML = '<div class="loading">No transactions yet.</div>'; }
  else {
    el.innerHTML = recent.map(t => `
      <div class="tx-item">
        <div class="tx-icon ${t.Type.toLowerCase()}">${t.Type === 'Credit' ? '↓' : '↑'}</div>
        <div class="tx-info">
          <div class="tx-desc">${t.Description || t.Type}</div>
          <div class="tx-date">${t.DateTime}</div>
        </div>
        <div class="tx-amount ${t.Type.toLowerCase()}">${t.Type === 'Credit' ? '+' : '-'}${fmt(t.Amount)}</div>
      </div>`).join('');
  }

  const tbody = document.getElementById('allTxBody');
  if (!txns.length) { tbody.innerHTML = '<tr><td colspan="7" class="loading">No transactions found.</td></tr>'; return; }
  tbody.innerHTML = [...txns].reverse().map(t => `
    <tr>
      <td style="font-family:monospace;font-size:12px">${t.TxnID}</td>
      <td><span style="padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;background:${t.Type === 'Credit' ? 'rgba(46,125,50,0.1)' : 'rgba(229,57,53,0.08)'};color:${t.Type === 'Credit' ? '#2E7D32' : '#E53935'}">${t.Type}</span></td>
      <td style="font-weight:600;color:${t.Type === 'Credit' ? '#2E7D32' : '#E53935'}">${t.Type === 'Credit' ? '+' : '-'}${fmt(t.Amount)}</td>
      <td>${fmt(t.Balance)}</td>
      <td>${t.Description || '—'}</td>
      <td style="font-size:12px;color:var(--text-muted)">${t.DateTime}</td>
      <td><span style="color:#2E7D32;font-size:12px">✓ ${t.Status}</span></td>
    </tr>`).join('');
}

function addTransaction(type, amount, desc, newBalance) {
  const txns = getTxns(currentAccount);
  txns.push({ TxnID: genTxnId(), Type: type, Amount: amount, Balance: newBalance, Description: desc, DateTime: fmtDate(Date.now()), Status: 'Success' });
  saveTxns(currentAccount, txns);
  renderTransactions();
}

// ── DEPOSIT ────────────────────────────────────────────────────
function doDeposit() {
  const amount = parseFloat(document.getElementById('depositAmt').value);
  const desc = document.getElementById('depositDesc').value.trim() || 'Cash Deposit';
  if (!amount || amount <= 0) { showAlert('depositAlert', 'Enter a valid amount.', 'error'); return; }
  const user = getUser();
  const newBal = user.balance + amount;
  updateUser({ balance: newBal });
  addTransaction('Credit', amount, desc, newBal);
  refreshBalance();
  showAlert('depositAlert', `✓ ${fmt(amount)} deposited successfully! New Balance: ${fmt(newBal)}`, 'success');
  document.getElementById('depositAmt').value = '';
  document.getElementById('depositDesc').value = '';
}

// ── WITHDRAW ───────────────────────────────────────────────────
function doWithdraw() {
  const amount = parseFloat(document.getElementById('withdrawAmt').value);
  const desc = document.getElementById('withdrawDesc').value.trim() || 'Withdrawal';
  if (!amount || amount <= 0) { showAlert('withdrawAlert', 'Enter a valid amount.', 'error'); return; }
  const user = getUser();
  if (amount > user.balance) { showAlert('withdrawAlert', `Insufficient balance. Available: ${fmt(user.balance)}`, 'error'); return; }
  const newBal = user.balance - amount;
  updateUser({ balance: newBal });
  addTransaction('Debit', amount, desc, newBal);
  refreshBalance();
  showAlert('withdrawAlert', `✓ ${fmt(amount)} withdrawn successfully! New Balance: ${fmt(newBal)}`, 'success');
  document.getElementById('withdrawAmt').value = '';
  document.getElementById('withdrawDesc').value = '';
}

// ── TRANSFER ───────────────────────────────────────────────────
function doTransfer() {
  const toAccount = document.getElementById('transferTo').value.trim();
  const amount = parseFloat(document.getElementById('transferAmt').value);
  const note = document.getElementById('transferNote').value.trim() || 'Fund Transfer';
  if (!toAccount || !amount || amount <= 0) { showAlert('transferAlert', 'Fill all fields correctly.', 'error'); return; }
  const users = getUsers();
  const recipient = users.find(u => u.account === toAccount);
  if (!recipient) { showAlert('transferAlert', 'Recipient account not found. Check the account number.', 'error'); return; }
  if (toAccount === currentAccount) { showAlert('transferAlert', 'Cannot transfer to your own account.', 'error'); return; }
  const user = getUser();
  if (amount > user.balance) { showAlert('transferAlert', `Insufficient balance. Available: ${fmt(user.balance)}`, 'error'); return; }

  const newSenderBal = user.balance - amount;
  updateUser({ balance: newSenderBal });
  addTransaction('Debit', amount, `Transfer to ${recipient.name} (${toAccount}) - ${note}`, newSenderBal);

  const recipIdx = users.findIndex(u => u.account === toAccount);
  const newRecipBal = users[recipIdx].balance + amount;
  users[recipIdx].balance = newRecipBal;
  saveUsers(users);
  const recipTxns = getTxns(toAccount);
  recipTxns.push({ TxnID: genTxnId(), Type: 'Credit', Amount: amount, Balance: newRecipBal, Description: `Transfer from ${user.name} (${currentAccount}) - ${note}`, DateTime: fmtDate(Date.now()), Status: 'Success' });
  saveTxns(toAccount, recipTxns);

  refreshBalance();
  showAlert('transferAlert', `✓ ${fmt(amount)} sent to ${recipient.name}! New Balance: ${fmt(newSenderBal)}`, 'success');
  document.getElementById('transferTo').value = '';
  document.getElementById('transferAmt').value = '';
  document.getElementById('transferNote').value = '';
}

// ── LOANS ──────────────────────────────────────────────────────
function selectLoan(el, type, rate) {
  document.querySelectorAll('.loan-type-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  selectedLoanType = type;
  selectedLoanRate = rate;
  document.getElementById('loanType').value = type;
  document.getElementById('loanRate').value = rate;
  document.getElementById('loanRateInp').value = rate;
  calcEMI();
}

function calcEMI() {
  const p = parseFloat(document.getElementById('loanAmt').value) || 0;
  const r = parseFloat(document.getElementById('loanRateInp').value) / 100 / 12;
  const n = parseInt(document.getElementById('loanTenure').value) || 12;
  if (!p) { document.getElementById('emiResult').classList.remove('show'); return; }
  const emi = r ? (p * r * Math.pow(1+r,n)) / (Math.pow(1+r,n)-1) : p/n;
  const total = emi * n;
  document.getElementById('emiAmt').textContent = fmt(emi);
  document.getElementById('totalPayable').textContent = fmt(total);
  document.getElementById('totalInterest').textContent = fmt(total - p);
  document.getElementById('emiResult').classList.add('show');
}

// ── APPLY LOAN — now sends to Admin for approval ───────────────
function applyLoan() {
  const amount = parseFloat(document.getElementById('loanAmt').value);
  const rate = parseFloat(document.getElementById('loanRateInp').value);
  const tenure = parseInt(document.getElementById('loanTenure').value);
  const loanType = document.getElementById('loanType').value;
  if (!amount || amount <= 0) { showAlert('loanAlert', 'Enter a valid loan amount.', 'error'); return; }
  if (!rate || rate <= 0) { showAlert('loanAlert', 'Enter a valid interest rate.', 'error'); return; }
  if (!tenure || tenure < 1) { showAlert('loanAlert', 'Enter a valid tenure.', 'error'); return; }

  const r = rate / 100 / 12;
  const emi = r ? (amount * r * Math.pow(1+r,tenure)) / (Math.pow(1+r,tenure)-1) : amount/tenure;
  const requestId = genRequestId();

  // Save to global loan requests (admin inbox)
  const allRequests = getAllLoanRequests();
  allRequests.push({
    RequestID: requestId,
    AccountNo: currentAccount,
    LoanType: loanType,
    Amount: amount,
    Rate: rate,
    Tenure: tenure,
    EMI: emi,
    Status: 'Pending',
    AppliedOn: fmtDate(Date.now())
  });
  saveAllLoanRequests(allRequests);

  renderLoans();
  showAlert('loanAlert', `⏳ Loan application ${requestId} submitted! Awaiting admin approval. You'll see the status in "My Loans" below.`, 'success');
  document.getElementById('loanAmt').value = '';
  document.getElementById('emiResult').classList.remove('show');
}

function renderLoans() {
  // Show user's loan requests with live status
  const allRequests = getAllLoanRequests().filter(r => r.AccountNo === currentAccount);
  const activeLoanCount = allRequests.filter(r => r.Status === 'Approved').length;
  document.getElementById('loanCount').textContent = activeLoanCount + ' active';
  const el = document.getElementById('myLoansList');

  if (!allRequests.length) { el.innerHTML = '<div class="loading">No loan applications yet.</div>'; return; }

  const statusColor = { Pending:'#E65100', Approved:'#2E7D32', Rejected:'#C62828' };
  const statusBg    = { Pending:'rgba(255,152,0,0.1)', Approved:'rgba(46,125,50,0.1)', Rejected:'rgba(229,57,53,0.08)' };
  const statusIcon  = { Pending:'⏳', Approved:'✅', Rejected:'❌' };

  let html = '';
  [...allRequests].reverse().forEach(r => {
    html += `
      <div style="border-bottom:1px solid var(--border)">
        <table class="data-table">
          <thead><tr><th>Request ID</th><th>Type</th><th>Principal</th><th>EMI/mo</th><th>Rate</th><th>Status</th></tr></thead>
          <tbody>
            <tr>
              <td style="font-size:11px;font-family:monospace">${r.RequestID}</td>
              <td>${r.LoanType}</td>
              <td>${fmt(r.Amount)}</td>
              <td style="color:var(--red);font-weight:600">${fmt(r.EMI)}</td>
              <td>${r.Rate}%</td>
              <td>
                <span style="padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;background:${statusBg[r.Status]};color:${statusColor[r.Status]}">
                  ${statusIcon[r.Status]} ${r.Status}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
        <div style="padding:10px 16px;background:var(--off-white);border-top:1px solid var(--border);font-size:12px;color:var(--text-muted)">
          Applied: ${r.AppliedOn}
          ${r.Status === 'Pending' ? ' &nbsp;•&nbsp; <strong style="color:#E65100">Under review by bank admin</strong>' : ''}
          ${r.Status === 'Approved' ? ` &nbsp;•&nbsp; <strong style="color:#2E7D32">Approved on ${r.DecidedOn||'—'} • Amount credited to your account</strong>` : ''}
          ${r.Status === 'Rejected' ? ` &nbsp;•&nbsp; <strong style="color:#C62828">Rejected on ${r.DecidedOn||'—'}${r.RejectReason ? ': ' + r.RejectReason : ''}</strong>` : ''}
        </div>
      </div>`;
  });
  el.innerHTML = html;
}

// ── NAV ────────────────────────────────────────────────────────
function showSection(name) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('section-' + name).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(item => {
    if (item.getAttribute('onclick') && item.getAttribute('onclick').includes("'" + name + "'")) item.classList.add('active');
  });
  const titles = { overview:'Overview', transactions:'Transaction History', deposit:'Deposit Funds', withdraw:'Withdraw Funds', transfer:'Fund Transfer', loans:'Loan Services', profile:'My Profile' };
  document.getElementById('pageTitle').textContent = titles[name] || name;
  if (name === 'loans') renderLoans();
}

// ── ALERT ──────────────────────────────────────────────────────
function showAlert(id, msg, type) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.className = 'alert ' + type;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 6000);
}

// ── LOGOUT ─────────────────────────────────────────────────────
function doLogout() { localStorage.removeItem('nb_session'); }

// ── START ──────────────────────────────────────────────────────
init();
