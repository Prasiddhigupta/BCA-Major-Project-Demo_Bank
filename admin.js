// ── HELPERS ───────────────────────────────────────────────────
const fmt = n => '₹' + parseFloat(n||0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2});
function fmtDate(d){ return new Date(d).toLocaleString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}); }
function genTxnId(){ return 'TXN' + Date.now() + Math.floor(Math.random()*1000); }

// ── STORAGE ───────────────────────────────────────────────────
function getUsers()             { return JSON.parse(localStorage.getItem('nb_users')         || '[]'); }
function saveUsers(u)           { localStorage.setItem('nb_users', JSON.stringify(u)); }
function getTxns(acc)           { return JSON.parse(localStorage.getItem('nb_tx_'    + acc)  || '[]'); }
function saveTxns(acc,t)        { localStorage.setItem('nb_tx_'    + acc, JSON.stringify(t)); }
function getLoans(acc)          { return JSON.parse(localStorage.getItem('nb_loans_' + acc)  || '[]'); }
function saveLoans(acc,l)       { localStorage.setItem('nb_loans_' + acc, JSON.stringify(l)); }
function getAllLoanRequests()    { return JSON.parse(localStorage.getItem('nb_loan_requests') || '[]'); }
function saveAllLoanRequests(r) { localStorage.setItem('nb_loan_requests', JSON.stringify(r)); }

let currentLoanTab     = 'pending';
let viewingUserAccount = null;

// ── INIT ──────────────────────────────────────────────────────
function init() {
  const session = localStorage.getItem('nb_admin_session');
  if (!session || session !== 'ADMIN001') {
    window.location.href = 'index.html';
    return;
  }
  refreshOverview();
  updatePendingBadge();
}

function adminLogout() {
  localStorage.removeItem('nb_admin_session');
}

// ── PENDING BADGE ─────────────────────────────────────────────
function updatePendingBadge() {
  const pending = getAllLoanRequests().filter(r => r.Status === 'Pending').length;
  const badge = document.getElementById('pendingBadge');
  if (pending > 0) { badge.textContent = pending; badge.style.display = 'inline-block'; }
  else              { badge.style.display = 'none'; }
}

// ── OVERVIEW ──────────────────────────────────────────────────
function refreshOverview() {
  const users = getUsers().filter(u => !u.isAdmin);
  let totalDeposits = 0, totalTxns = 0, activeCount = 0;
  users.forEach(u => {
    getTxns(u.account).forEach(t => { if (t.Type === 'Credit') totalDeposits += parseFloat(t.Amount||0); });
    totalTxns += getTxns(u.account).length;
    if (u.status === 'Active') activeCount++;
  });

  const allRequests  = getAllLoanRequests();
  const pendingLoans = allRequests.filter(r => r.Status === 'Pending');
  const approvedLoans= allRequests.filter(r => r.Status === 'Approved');
  const totalLoanVal = approvedLoans.reduce((s,r) => s + parseFloat(r.Amount||0), 0);

  document.getElementById('statTotalAccounts').textContent = users.length;
  document.getElementById('statTotalDeposits').textContent = fmt(totalDeposits);
  document.getElementById('statActiveLoans').textContent   = approvedLoans.length;
  document.getElementById('statPendingLoans').textContent  = pendingLoans.length;
  document.getElementById('statTotalTxns').textContent     = totalTxns;
  document.getElementById('statActiveAccounts').textContent= activeCount;
  document.getElementById('statTotalLoanVal').textContent  = fmt(totalLoanVal);

  // Pending loans quick view (up to 3)
  const el = document.getElementById('overviewPendingLoans');
  if (!pendingLoans.length) {
    el.innerHTML = '<div class="empty-state"><div class="empty-icon">✅</div><p>No pending loan approvals</p></div>';
  } else {
    el.innerHTML = pendingLoans.slice(0,3).map(r => {
      const user = getUsers().find(u => u.account === r.AccountNo) || {};
      return `
        <div style="display:flex;align-items:center;gap:16px;padding:14px 0;border-bottom:1px solid var(--border)">
          <div style="width:36px;height:36px;border-radius:10px;background:rgba(255,152,0,0.12);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">⏳</div>
          <div style="flex:1">
            <div style="font-size:14px;font-weight:600;color:var(--text-dark)">${user.name||'Unknown'} — ${r.LoanType} Loan</div>
            <div style="font-size:12px;color:var(--text-muted);margin-top:2px">${r.AccountNo} • Applied: ${r.AppliedOn}</div>
          </div>
          <div style="font-family:'Playfair Display',serif;font-size:16px;font-weight:700;color:var(--text-dark)">${fmt(r.Amount)}</div>
          <div style="display:flex;gap:8px">
            <button class="btn btn-sm btn-approve" onclick="quickAction('${r.RequestID}','Approved')">✓ Approve</button>
            <button class="btn btn-sm btn-reject"  onclick="openLoanModal('${r.RequestID}','reject')">✗ Reject</button>
          </div>
        </div>`;
    }).join('') + (pendingLoans.length > 3
      ? `<div style="text-align:center;padding:14px 0;font-size:13px;color:var(--text-muted)">+${pendingLoans.length-3} more pending — <a href="#" onclick="showSection('loanenquiry')" style="color:#7A5800;text-decoration:none;font-weight:600">View All</a></div>`
      : '');
  }

  // Recent accounts table (last 5)
  const recent = [...users].reverse().slice(0,5);
  document.getElementById('recentAccountsBody').innerHTML = recent.length
    ? recent.map((u,i) => `
      <tr>
        <td style="font-weight:600;color:var(--text-muted)">${i+1}</td>
        <td style="font-weight:600">${u.name}</td>
        <td style="font-size:12px;color:var(--text-muted)">${u.account}</td>
        <td><span class="status-badge status-pending">${u.accountType}</span></td>
        <td style="font-family:'Playfair Display',serif;font-weight:600">${fmt(u.balance)}</td>
        <td><span class="status-badge ${u.status==='Active'?'status-active':'status-inactive'}">${u.status}</span></td>
        <td style="font-size:12px;color:var(--text-muted)">${u.created||'—'}</td>
        <td><button class="btn btn-sm btn-view" onclick="viewUserDetail('${u.account}')">View</button></td>
      </tr>`).join('')
    : '<tr><td colspan="8" class="loading">No accounts found.</td></tr>';
}

// ── ALL ACCOUNTS ──────────────────────────────────────────────
let allUsersCache = [];
function renderAllAccounts() {
  const users = getUsers().filter(u => !u.isAdmin);
  allUsersCache = users;
  document.getElementById('accountCountBadge').textContent = users.length + ' users';
  renderAccountsTable(users);
}

function renderAccountsTable(users) {
  const tbody = document.getElementById('allAccountsBody');
  if (!users.length) { tbody.innerHTML = '<tr><td colspan="9" class="loading">No accounts found.</td></tr>'; return; }
  tbody.innerHTML = users.map((u,i) => `
    <tr>
      <td style="font-weight:600;color:var(--text-muted)">${i+1}</td>
      <td>
        <div style="display:flex;align-items:center;gap:10px">
          <div style="width:32px;height:32px;border-radius:8px;background:var(--yellow-dim);display:flex;align-items:center;justify-content:center;font-family:'Playfair Display',serif;font-weight:700;color:#7A5800;font-size:14px;flex-shrink:0">${u.name[0]}</div>
          <div>
            <div style="font-weight:600;font-size:13px">${u.name}</div>
            <div style="font-size:11px;color:var(--text-muted)">${u.email}</div>
          </div>
        </div>
      </td>
      <td style="font-size:12px;color:var(--text-muted)">${u.email}</td>
      <td style="font-size:13px">${u.phone||'—'}</td>
      <td style="font-family:monospace;font-size:12px">${u.account}</td>
      <td>${u.accountType}</td>
      <td style="font-family:'Playfair Display',serif;font-weight:600">${fmt(u.balance)}</td>
      <td><span class="status-badge ${u.status==='Active'?'status-active':'status-inactive'}">${u.status}</span></td>
      <td>
        <div style="display:flex;gap:6px">
          <button class="btn btn-sm btn-view" onclick="viewUserDetail('${u.account}')">View</button>
          <button class="btn btn-sm ${u.status==='Active'?'btn-reject':'btn-approve'}"
            onclick="openStatusModal('${u.account}','${u.status==='Active'?'Inactive':'Active'}')">
            ${u.status==='Active'?'Deactivate':'Activate'}
          </button>
        </div>
      </td>
    </tr>`).join('');
}

function filterAccounts() {
  const q = document.getElementById('accountSearch').value.toLowerCase();
  renderAccountsTable(allUsersCache.filter(u =>
    u.name.toLowerCase().includes(q) ||
    u.email.toLowerCase().includes(q) ||
    (u.account||'').toLowerCase().includes(q) ||
    (u.phone||'').includes(q)
  ));
}

// ── ALL TRANSACTIONS ───────────────────────────────────────────
function renderAllTransactions() {
  const filterType = document.getElementById('txFilterType')?.value || '';
  const users      = getUsers().filter(u => !u.isAdmin);
  let allTxns = [];
  users.forEach(u => {
    getTxns(u.account).forEach(t => allTxns.push({...t, _userName:u.name, _account:u.account}));
  });
  allTxns.sort((a,b) => b.TxnID > a.TxnID ? 1 : -1);
  if (filterType) allTxns = allTxns.filter(t => t.Type === filterType);

  document.getElementById('allTxCountBadge').textContent = allTxns.length + ' records';
  const tbody = document.getElementById('allTransactionsBody');
  if (!allTxns.length) { tbody.innerHTML = '<tr><td colspan="8" class="loading">No transactions found.</td></tr>'; return; }
  tbody.innerHTML = allTxns.map(t => `
    <tr>
      <td style="font-family:monospace;font-size:11px">${t.TxnID}</td>
      <td><span style="font-weight:600;font-size:13px;cursor:pointer;color:var(--text-dark)" onclick="viewUserDetail('${t._account}')">${t._userName}</span></td>
      <td style="font-size:12px;color:var(--text-muted);font-family:monospace">${t._account}</td>
      <td><span style="padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;background:${t.Type==='Credit'?'rgba(46,125,50,0.1)':'rgba(229,57,53,0.08)'};color:${t.Type==='Credit'?'#2E7D32':'#E53935'}">${t.Type}</span></td>
      <td style="font-weight:600;color:${t.Type==='Credit'?'#2E7D32':'#E53935'}">${t.Type==='Credit'?'+':'-'}${fmt(t.Amount)}</td>
      <td style="font-size:12px;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${t.Description||'—'}</td>
      <td style="font-size:12px;color:var(--text-muted)">${t.DateTime}</td>
      <td><span style="color:#2E7D32;font-size:12px">✓ ${t.Status}</span></td>
    </tr>`).join('');
}

// ── LOAN ENQUIRY ──────────────────────────────────────────────
function switchLoanTab(tab) {
  currentLoanTab = tab;
  ['pending','approved','rejected'].forEach(t => {
    document.getElementById('loanTab' + t.charAt(0).toUpperCase() + t.slice(1))
      .classList.toggle('active', t === tab);
  });
  renderLoanTab();
}

function renderLoanEnquirySummary() {
  const all = getAllLoanRequests();
  const p = all.filter(r => r.Status === 'Pending').length;
  const a = all.filter(r => r.Status === 'Approved').length;
  const r = all.filter(r => r.Status === 'Rejected').length;
  document.getElementById('leSummaryPending').textContent  = p;
  document.getElementById('leSummaryApproved').textContent = a;
  document.getElementById('leSummaryRejected').textContent = r;
}

function renderLoanTab() {
  renderLoanEnquirySummary();
  const requests = getAllLoanRequests();
  const statusMap = { pending:'Pending', approved:'Approved', rejected:'Rejected' };
  const filtered  = requests.filter(r => r.Status === statusMap[currentLoanTab]);

  document.getElementById('pendingCount').textContent  = requests.filter(r => r.Status === 'Pending').length;
  document.getElementById('approvedCount').textContent = requests.filter(r => r.Status === 'Approved').length;
  document.getElementById('rejectedCount').textContent = requests.filter(r => r.Status === 'Rejected').length;

  const el = document.getElementById('loanTabContent');
  if (!filtered.length) {
    const icons = { pending:'📭', approved:'✅', rejected:'❌' };
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">${icons[currentLoanTab]}</div><p>No ${currentLoanTab} loan applications</p></div>`;
    return;
  }

  const loanTypeIcon = {Personal:'👤',Home:'🏠',Vehicle:'🚗',Education:'🎓',Business:'💼',Gold:'✦'};
  el.innerHTML = filtered.map(r => {
    const user = getUsers().find(u => u.account === r.AccountNo) || {};
    const icon = loanTypeIcon[r.LoanType] || '♦';
    return `
      <div class="loan-app-card">
        <div class="loan-app-header">
          <div style="display:flex;align-items:center;gap:12px">
            <div style="width:40px;height:40px;border-radius:10px;background:var(--yellow-dim);display:flex;align-items:center;justify-content:center;font-size:20px">${icon}</div>
            <div>
              <div style="font-family:'Playfair Display',serif;font-size:16px;font-weight:600">
                ${r.LoanType} Loan — <span style="color:var(--black)">${fmt(r.Amount)}</span>
              </div>
              <div style="font-size:12px;color:var(--text-muted);margin-top:2px">
                <span style="cursor:pointer;color:#7A5800;font-weight:600" onclick="viewUserDetail('${r.AccountNo}')">${user.name||r.AccountNo}</span>
                &nbsp;•&nbsp; ${r.AccountNo} &nbsp;•&nbsp; Applied: ${r.AppliedOn}
              </div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:10px">
            <span class="status-badge status-${r.Status.toLowerCase()}">${r.Status}</span>
            <span style="font-family:monospace;font-size:11px;color:var(--text-muted)">${r.RequestID}</span>
          </div>
        </div>

        <div class="loan-app-body">
          <div class="loan-stat-item">
            <div class="loan-stat-label">Principal</div>
            <div class="loan-stat-val">${fmt(r.Amount)}</div>
          </div>
          <div class="loan-stat-item">
            <div class="loan-stat-label">Interest Rate</div>
            <div class="loan-stat-val">${r.Rate}% p.a.</div>
          </div>
          <div class="loan-stat-item">
            <div class="loan-stat-label">Tenure</div>
            <div class="loan-stat-val">${r.Tenure} months</div>
          </div>
          <div class="loan-stat-item">
            <div class="loan-stat-label">Monthly EMI</div>
            <div class="loan-stat-val" style="color:var(--red)">${fmt(r.EMI)}</div>
          </div>
          <div class="loan-stat-item">
            <div class="loan-stat-label">Account Type</div>
            <div class="loan-stat-val" style="font-size:13px">${user.accountType||'—'}</div>
          </div>
        </div>

        ${r.Status === 'Rejected' && r.RejectReason
          ? `<div style="padding:0 20px 14px"><div class="rejection-note">❌ Rejection Reason: ${r.RejectReason}</div></div>`
          : ''}
        ${r.Status === 'Approved'
          ? `<div style="padding:0 20px 14px"><div style="background:rgba(46,125,50,0.07);border:1px solid rgba(46,125,50,0.2);border-radius:8px;padding:10px 14px;font-size:12px;color:#2E7D32">✅ Approved on ${r.DecidedOn||'—'} • Amount disbursed to account</div></div>`
          : ''}
        ${r.Status === 'Pending'
          ? `<div class="loan-app-actions">
               <button class="btn btn-sm btn-view"    onclick="viewUserDetail('${r.AccountNo}')">View Profile</button>
               <button class="btn btn-sm btn-approve" onclick="openLoanModal('${r.RequestID}','approve')">✓ Approve Loan</button>
               <button class="btn btn-sm btn-reject"  onclick="openLoanModal('${r.RequestID}','reject')">✗ Reject Loan</button>
             </div>`
          : ''}
      </div>`;
  }).join('');
}

// ── QUICK ACTION (from overview) ──────────────────────────────
function quickAction(requestId, action) {
  if (action === 'Approved') decideLoan(requestId, 'Approved', '');
}

// ── LOAN MODAL ────────────────────────────────────────────────
function openLoanModal(requestId, action) {
  const req = getAllLoanRequests().find(r => r.RequestID === requestId);
  if (!req) return;
  const user      = getUsers().find(u => u.account === req.AccountNo) || {};
  const isApprove = action === 'approve';

  document.getElementById('loanModalTitle').textContent = isApprove
    ? '✅ Approve Loan Application'
    : '❌ Reject Loan Application';

  document.getElementById('loanModalDetails').innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <div><div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:var(--text-muted);margin-bottom:3px">Applicant</div><div style="font-weight:600">${user.name||'—'}</div></div>
      <div><div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:var(--text-muted);margin-bottom:3px">Account</div><div style="font-family:monospace;font-size:13px">${req.AccountNo}</div></div>
      <div><div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:var(--text-muted);margin-bottom:3px">Loan Type</div><div style="font-weight:600">${req.LoanType}</div></div>
      <div><div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:var(--text-muted);margin-bottom:3px">Amount</div><div style="font-family:'Playfair Display',serif;font-size:16px;font-weight:700;color:${isApprove?'#2E7D32':'#C62828'}">${fmt(req.Amount)}</div></div>
      <div><div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:var(--text-muted);margin-bottom:3px">EMI / Month</div><div style="font-weight:600">${fmt(req.EMI)}</div></div>
      <div><div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:var(--text-muted);margin-bottom:3px">Tenure</div><div style="font-weight:600">${req.Tenure} months</div></div>
    </div>`;

  document.getElementById('rejectReasonWrap').style.display = isApprove ? 'none' : 'block';
  document.getElementById('rejectReason').value = '';

  const btn = document.getElementById('loanModalAction');
  btn.textContent  = isApprove ? 'Approve & Disburse' : 'Reject Application';
  btn.className    = 'btn ' + (isApprove ? 'btn-approve' : 'btn-reject');
  btn.onclick = () => {
    const reason = document.getElementById('rejectReason').value.trim();
    if (!isApprove && !reason) { alert('Please enter a rejection reason.'); return; }
    decideLoan(requestId, isApprove ? 'Approved' : 'Rejected', reason);
    closeModal('loanModal');
  };

  document.getElementById('loanModal').classList.add('open');
}

function decideLoan(requestId, decision, rejectReason) {
  const requests = getAllLoanRequests();
  const idx      = requests.findIndex(r => r.RequestID === requestId);
  if (idx === -1) return;

  requests[idx].Status    = decision;
  requests[idx].DecidedOn = fmtDate(Date.now());
  if (rejectReason) requests[idx].RejectReason = rejectReason;
  saveAllLoanRequests(requests);

  if (decision === 'Approved') {
    const req   = requests[idx];
    const users = getUsers();
    const uIdx  = users.findIndex(u => u.account === req.AccountNo);
    if (uIdx !== -1) {
      const newBal       = users[uIdx].balance + req.Amount;
      users[uIdx].balance = newBal;
      saveUsers(users);

      const txns = getTxns(req.AccountNo);
      txns.push({
        TxnID: genTxnId(), Type:'Credit', Amount:req.Amount, Balance:newBal,
        Description:`${req.LoanType} Loan Approved & Disbursed (${req.RequestID})`,
        DateTime: fmtDate(Date.now()), Status:'Success'
      });
      saveTxns(req.AccountNo, txns);

      const loans = getLoans(req.AccountNo);
      loans.push({
        LoanID:req.RequestID, LoanType:req.LoanType, Principal:req.Amount,
        Rate:req.Rate, Tenure:req.Tenure, EMI:req.EMI,
        Status:'Active', AppliedOn:req.AppliedOn,
        Transactions:[{ Date:fmtDate(Date.now()), Description:'Loan Disbursement (Admin Approved)', Amount:req.Amount, Type:'Credit' }]
      });
      saveLoans(req.AccountNo, loans);
    }
  }

  updatePendingBadge();
  refreshOverview();
  if (document.getElementById('section-loanenquiry').classList.contains('active')) renderLoanTab();
  showToast(decision === 'Approved'
    ? `✅ Loan approved & ${fmt(requests[idx].Amount)} disbursed!`
    : '❌ Loan application rejected.');
}

// ── USER DETAIL ───────────────────────────────────────────────
function viewUserDetail(account) {
  viewingUserAccount = account;
  document.getElementById('nav-userdetail').style.display = 'flex';
  const user = getUsers().find(u => u.account === account);
  document.getElementById('navUserName').textContent = user ? user.name.split(' ')[0] : 'User';
  showSection('userdetail');
  renderUserDetail(account);
}

function renderUserDetail(account) {
  const users = getUsers();
  const user  = users.find(u => u.account === account);
  if (!user) { document.getElementById('userDetailContent').innerHTML = '<div class="loading">User not found.</div>'; return; }

  const txns        = getTxns(account);
  const allRequests = getAllLoanRequests().filter(r => r.AccountNo === account);
  let credits = 0, debits = 0;
  txns.forEach(t => { if (t.Type==='Credit') credits += parseFloat(t.Amount||0); else debits += parseFloat(t.Amount||0); });

  document.getElementById('userDetailContent').innerHTML = `
    <!-- Profile Header -->
    <div class="profile-card" style="margin-bottom:20px">
      <div style="display:flex;align-items:flex-start;justify-content:space-between">
        <div style="display:flex;align-items:center;gap:20px">
          <div class="profile-avatar">${user.name[0]}</div>
          <div>
            <div class="profile-name">${user.name}</div>
            <div class="profile-detail">📧 ${user.email}</div>
            <div class="profile-detail">📞 ${user.phone||'—'}</div>
            <div class="profile-detail">📍 ${user.address||'—'}</div>
            <div class="profile-acc">${user.account}</div>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:10px">
          <span class="status-badge ${user.status==='Active'?'status-active':'status-inactive'}" style="font-size:13px;padding:6px 14px">${user.status}</span>
          <button class="btn btn-sm ${user.status==='Active'?'btn-reject':'btn-approve'}"
            onclick="openStatusModal('${user.account}','${user.status==='Active'?'Inactive':'Active'}')">
            ${user.status==='Active'?'Deactivate Account':'Activate Account'}
          </button>
        </div>
      </div>
    </div>

    <!-- Stats row -->
    <div class="cards-row" style="grid-template-columns:repeat(4,1fr);margin-bottom:20px">
      <div class="stat-card highlight">
        <div class="stat-icon">💰</div>
        <div class="stat-label">Balance</div>
        <div class="stat-value">${fmt(user.balance)}</div>
        <div class="stat-sub">${user.accountType}</div>
      </div>
      <div class="stat-card" style="--card-accent:rgba(46,125,50,0.08)">
        <div class="stat-icon">📈</div>
        <div class="stat-label">Total Credits</div>
        <div class="stat-value" style="font-size:20px">${fmt(credits)}</div>
        <div class="stat-sub">${txns.filter(t=>t.Type==='Credit').length} transactions</div>
      </div>
      <div class="stat-card" style="--card-accent:rgba(229,57,53,0.06)">
        <div class="stat-icon">📉</div>
        <div class="stat-label">Total Debits</div>
        <div class="stat-value" style="font-size:20px">${fmt(debits)}</div>
        <div class="stat-sub">${txns.filter(t=>t.Type==='Debit').length} transactions</div>
      </div>
      <div class="stat-card" style="--card-accent:rgba(255,193,7,0.08)">
        <div class="stat-icon">♦</div>
        <div class="stat-label">Loan Applications</div>
        <div class="stat-value" style="font-size:20px">${allRequests.length}</div>
        <div class="stat-sub">${allRequests.filter(r=>r.Status==='Approved').length} approved</div>
      </div>
    </div>

    <div class="grid-2" style="margin-bottom:20px">
      <!-- Account Info -->
      <div class="card">
        <div class="card-header"><div class="card-title">Account Information</div></div>
        <div class="card-body">
          <div class="info-grid">
            <div class="info-item"><div class="info-item-label">Full Name</div><div class="info-item-value">${user.name}</div></div>
            <div class="info-item"><div class="info-item-label">Account No.</div><div class="info-item-value" style="font-family:monospace;font-size:13px">${user.account}</div></div>
            <div class="info-item"><div class="info-item-label">Account Type</div><div class="info-item-value">${user.accountType}</div></div>
            <div class="info-item"><div class="info-item-label">Member Since</div><div class="info-item-value">${user.created||'—'}</div></div>
            <div class="info-item" style="grid-column:1/-1"><div class="info-item-label">Email</div><div class="info-item-value">${user.email}</div></div>
            <div class="info-item" style="grid-column:1/-1"><div class="info-item-label">Address</div><div class="info-item-value">${user.address||'—'}</div></div>
          </div>
        </div>
      </div>

      <!-- Loan History -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">Loan Applications</div>
          <span class="badge badge-gold">${allRequests.length} total</span>
        </div>
        <div class="card-body" style="padding:0">
          ${allRequests.length
            ? allRequests.map(r => `
              <div style="display:flex;align-items:center;gap:12px;padding:14px 16px;border-bottom:1px solid var(--border)">
                <div style="flex:1">
                  <div style="font-size:13px;font-weight:600">${r.LoanType} Loan — ${fmt(r.Amount)}</div>
                  <div style="font-size:11px;color:var(--text-muted);margin-top:2px">${r.RequestID} • ${r.AppliedOn}</div>
                  ${r.RejectReason ? `<div style="font-size:11px;color:#C62828;margin-top:3px">Reason: ${r.RejectReason}</div>` : ''}
                </div>
                <span class="status-badge status-${r.Status.toLowerCase()}">${r.Status}</span>
              </div>`).join('')
            : '<div class="empty-state" style="padding:24px"><div class="empty-icon" style="font-size:28px">📭</div><p>No loan applications</p></div>'}
        </div>
      </div>
    </div>

    <!-- Transactions table -->
    <div class="card">
      <div class="card-header">
        <div class="card-title">Transaction History</div>
        <span class="badge badge-gold">${txns.length} records</span>
      </div>
      <div class="card-body" style="padding:0">
        <table class="data-table">
          <thead>
            <tr><th>Txn ID</th><th>Type</th><th>Amount</th><th>Balance After</th><th>Description</th><th>Date & Time</th><th>Status</th></tr>
          </thead>
          <tbody>
            ${txns.length
              ? [...txns].reverse().map(t => `
                <tr>
                  <td style="font-family:monospace;font-size:11px">${t.TxnID}</td>
                  <td><span style="padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;background:${t.Type==='Credit'?'rgba(46,125,50,0.1)':'rgba(229,57,53,0.08)'};color:${t.Type==='Credit'?'#2E7D32':'#E53935'}">${t.Type}</span></td>
                  <td style="font-weight:600;color:${t.Type==='Credit'?'#2E7D32':'#E53935'}">${t.Type==='Credit'?'+':'-'}${fmt(t.Amount)}</td>
                  <td>${fmt(t.Balance)}</td>
                  <td style="font-size:12px;max-width:220px">${t.Description||'—'}</td>
                  <td style="font-size:12px;color:var(--text-muted)">${t.DateTime}</td>
                  <td><span style="color:#2E7D32;font-size:12px">✓ ${t.Status}</span></td>
                </tr>`).join('')
              : '<tr><td colspan="7" class="loading">No transactions.</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// ── STATUS MODAL ──────────────────────────────────────────────
function openStatusModal(account, newStatus) {
  const user = getUsers().find(u => u.account === account) || {};
  document.getElementById('statusModalTitle').textContent =
    (newStatus === 'Active' ? 'Activate' : 'Deactivate') + ' Account';
  document.getElementById('statusModalMsg').textContent =
    `Are you sure you want to ${newStatus === 'Active' ? 'activate' : 'deactivate'} ${user.name}'s account (${account})?`;
  const confirmBtn = document.getElementById('statusModalConfirm');
  confirmBtn.className  = 'btn ' + (newStatus === 'Active' ? 'btn-approve' : 'btn-reject');
  confirmBtn.textContent = newStatus === 'Active' ? 'Yes, Activate' : 'Yes, Deactivate';
  confirmBtn.onclick = () => {
    const users = getUsers();
    const idx   = users.findIndex(u => u.account === account);
    if (idx !== -1) { users[idx].status = newStatus; saveUsers(users); }
    closeModal('statusModal');
    showToast(`Account ${account} has been ${newStatus === 'Active' ? 'activated' : 'deactivated'}.`);
    refreshOverview();
    if (document.getElementById('section-accounts').classList.contains('active')) renderAllAccounts();
    if (document.getElementById('section-userdetail').classList.contains('active') && viewingUserAccount === account) renderUserDetail(account);
  };
  document.getElementById('statusModal').classList.add('open');
}

function closeModal(id) { document.getElementById(id).classList.remove('open'); }

// ── NAVIGATION ────────────────────────────────────────────────
function showSection(name) {
  document.querySelectorAll('.section').forEach(s  => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n  => n.classList.remove('active'));
  document.getElementById('section-' + name)?.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(item => {
    if (item.getAttribute('onclick')?.includes("'" + name + "'")) item.classList.add('active');
  });
  const titles = {
    overview:'Admin Overview', accounts:'All Accounts',
    transactions:'All Transactions', loanenquiry:'Loan Enquiry', userdetail:'User Profile'
  };
  document.getElementById('pageTitle').textContent = titles[name] || name;

  if (name === 'accounts')     renderAllAccounts();
  if (name === 'transactions') renderAllTransactions();
  if (name === 'loanenquiry')  { renderLoanTab(); updatePendingBadge(); }
  if (name === 'overview')     refreshOverview();
  if (name === 'userdetail' && viewingUserAccount) renderUserDetail(viewingUserAccount);
}

// ── TOAST ─────────────────────────────────────────────────────
function showToast(msg) {
  let toast = document.getElementById('adminToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'adminToast';
    toast.style.cssText = 'position:fixed;bottom:28px;right:28px;background:#0A0A0A;color:white;padding:14px 20px;border-radius:10px;font-size:13px;font-family:"DM Sans",sans-serif;z-index:9999;box-shadow:0 8px 24px rgba(0,0,0,0.3);border-left:3px solid var(--yellow);max-width:320px;transition:opacity 0.3s';
    document.body.appendChild(toast);
  }
  toast.textContent  = msg;
  toast.style.opacity = '1';
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => { toast.style.opacity = '0'; }, 3500);
}

// ── START ─────────────────────────────────────────────────────
init();
