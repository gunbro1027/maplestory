// --- 숫자 입력 포맷 (콤마) ---
function formatInput(el) {
  const raw = el.value.replace(/[^0-9]/g, '');
  el.value = raw ? parseInt(raw).toLocaleString('ko-KR') : '';
}

function parseInput(id) {
  return parseInt(document.getElementById(id).value.replace(/,/g, '')) || 0;
}

// --- 데이터 로드/저장 ---
let data = JSON.parse(localStorage.getItem('financeData') || '{"incomes":[],"assets":[],"liabilities":[],"investments":[]}');
// 구버전 데이터 마이그레이션
if (typeof data.income === 'number') {
  data.incomes = data.income > 0 ? [{ id: Date.now(), name: '월급', amount: data.income }] : [];
  delete data.income;
}
if (!data.investments) data.investments = [];

let investYears = 10;

function save() {
  localStorage.setItem('financeData', JSON.stringify(data));
  render();
}

// --- 수입 ---
function addIncome() {
  const name = document.getElementById('income-name').value.trim();
  const amount = parseInput('income-amount');
  if (!name || !amount) return alert('수입명과 금액을 입력해주세요.');
  data.incomes.push({ id: Date.now(), name, amount });
  document.getElementById('income-name').value = '';
  document.getElementById('income-amount').value = '';
  save();
}

function deleteIncome(id) {
  data.incomes = data.incomes.filter(i => i.id !== id);
  save();
}

// --- 투자 ---
function applyPreset() {
  const val = document.getElementById('invest-preset').value;
  if (val) document.getElementById('invest-rate').value = val;
}

function addInvestment() {
  const name = document.getElementById('invest-name').value.trim();
  const rate = parseFloat(document.getElementById('invest-rate').value);
  const monthly = parseInput('invest-monthly');
  if (!name || !rate || !monthly) return alert('투자명, 수익률, 월 투자금액을 입력해주세요.');
  data.investments.push({ id: Date.now(), name, rate, monthly });
  document.getElementById('invest-name').value = '';
  document.getElementById('invest-rate').value = '';
  document.getElementById('invest-monthly').value = '';
  document.getElementById('invest-preset').value = '';
  save();
}

function deleteInvestment(id) {
  data.investments = data.investments.filter(i => i.id !== id);
  save();
}

function setInvestYears(y, btn) {
  investYears = y;
  document.querySelectorAll('.year-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  render();
}

// 복리 계산: 월 적립식 FV = PMT × [(1+r)^n - 1] / r
function calcInvestFV(monthly, annualRate, years) {
  const r = annualRate / 100 / 12;
  const n = years * 12;
  if (r === 0) return monthly * n;
  return monthly * ((Math.pow(1 + r, n) - 1) / r);
}

// --- 자산 ---
function addAsset() {
  const name = document.getElementById('asset-name').value.trim();
  const category = document.getElementById('asset-category').value;
  const amount = parseInput('asset-amount');
  if (!name || !amount || amount < 0) return alert('자산명과 금액을 입력해주세요.');
  data.assets.push({ id: Date.now(), name, category, amount });
  document.getElementById('asset-name').value = '';
  document.getElementById('asset-amount').value = '';
  save();
}

function deleteAsset(id) {
  data.assets = data.assets.filter(a => a.id !== id);
  save();
}

// --- 부채 ---
function addLiability() {
  const name = document.getElementById('liability-name').value.trim();
  const total = parseInput('liability-total');
  const monthlyInput = document.getElementById('liability-monthly').value.replace(/,/g, '');
  const monthly = monthlyInput === '' ? 0 : parseInt(monthlyInput) || 0;
  const rate = parseFloat(document.getElementById('liability-rate').value) || 0;
  if (!name || !total) return alert('부채명과 총 부채액을 입력해주세요.');
  data.liabilities.push({ id: Date.now(), name, total, monthly, rate });
  document.getElementById('liability-name').value = '';
  document.getElementById('liability-total').value = '';
  document.getElementById('liability-monthly').value = '';
  document.getElementById('liability-rate').value = '';
  save();
}

function deleteLiability(id) {
  data.liabilities = data.liabilities.filter(l => l.id !== id);
  save();
}

// --- 숫자 표시 포맷 ---
function fmt(n) {
  return '₩' + Math.round(n).toLocaleString('ko-KR');
}

// --- 계산 ---
function calcTotals() {
  const totalIncome = data.incomes.reduce((s, i) => s + i.amount, 0);
  const totalAssets = data.assets.reduce((s, a) => s + a.amount, 0);
  const totalLiabilities = data.liabilities.reduce((s, l) => s + l.total, 0);
  const monthlyPayment = data.liabilities.reduce((s, l) => s + l.monthly, 0);
  const monthlyInterest = data.liabilities.reduce((s, l) => s + (l.total * (l.rate / 100) / 12), 0);
  const netWorth = totalAssets - totalLiabilities;
  const monthlySavings = totalIncome - monthlyPayment;
  return { totalIncome, totalAssets, totalLiabilities, monthlyPayment, monthlyInterest, netWorth, monthlySavings };
}

// --- 렌더링 ---
let growthChart = null;
let investChart = null;

function render() {
  const { totalIncome, totalAssets, totalLiabilities, monthlyPayment, monthlyInterest, netWorth, monthlySavings } = calcTotals();

  // 헤더
  document.getElementById('header-networth').textContent = fmt(netWorth);
  document.getElementById('header-saving').textContent = fmt(monthlySavings > 0 ? monthlySavings : 0);

  // 요약 카드
  document.getElementById('total-assets').textContent = fmt(totalAssets);
  document.getElementById('total-liabilities').textContent = fmt(totalLiabilities);
  document.getElementById('net-worth').textContent = fmt(netWorth);
  document.getElementById('monthly-payment').textContent = fmt(monthlyPayment);

  // 수입 목록
  const incomeList = document.getElementById('income-list');
  incomeList.innerHTML = data.incomes.length === 0
    ? '<p style="color:var(--muted);font-size:0.9rem;padding:8px 0">등록된 수입이 없습니다.</p>'
    : data.incomes.map(i => `
      <div class="item-row">
        <div class="item-info">
          <div class="item-name">${i.name}</div>
        </div>
        <div class="item-right">
          <span class="item-amount asset">${fmt(i.amount)}</span>
          <button class="btn icon" onclick="deleteIncome(${i.id})">✕</button>
        </div>
      </div>`).join('')
    + `<div class="item-row" style="border-top:1px solid var(--border);margin-top:4px">
        <div class="item-name" style="color:var(--muted)">총 월 수입</div>
        <span class="item-amount asset">${fmt(totalIncome)}</span>
      </div>`;

  // 자산 목록
  const assetList = document.getElementById('asset-list');
  assetList.innerHTML = data.assets.length === 0
    ? '<p style="color:var(--muted);font-size:0.9rem;padding:8px 0">등록된 자산이 없습니다.</p>'
    : data.assets.map(a => `
      <div class="item-row">
        <div class="item-info">
          <span class="item-badge">${a.category}</span>
          <div class="item-name">${a.name}</div>
        </div>
        <div class="item-right">
          <span class="item-amount asset">${fmt(a.amount)}</span>
          <button class="btn icon" onclick="deleteAsset(${a.id})">✕</button>
        </div>
      </div>`).join('');

  // 부채 목록
  const liabilityList = document.getElementById('liability-list');
  liabilityList.innerHTML = data.liabilities.length === 0
    ? '<p style="color:var(--muted);font-size:0.9rem;padding:8px 0">등록된 부채가 없습니다.</p>'
    : data.liabilities.map(l => {
        const monthlyInt = l.rate ? l.total * (l.rate / 100) / 12 : 0;
        const isInterestOnly = l.monthly === 0 || l.monthly <= monthlyInt;
        const debtGrowth = monthlyInt - l.monthly; // 원금 감소 없이 이자가 쌓이는 금액
        let subText = '';
        if (l.rate) {
          subText += `연 ${l.rate}% · 월 이자 ${fmt(monthlyInt)}`;
          if (l.monthly > 0) subText += ` · 월 상환 ${fmt(l.monthly)}`;
          if (isInterestOnly && debtGrowth > 0) subText += ` · ⚠ 매월 ${fmt(debtGrowth)} 부채 증가`;
          else if (l.monthly === 0) subText += ` · 이자만 발생 중 (원금 상환 없음)`;
        } else if (l.monthly > 0) {
          subText = `월 상환 ${fmt(l.monthly)}`;
        }
        return `
      <div class="item-row">
        <div class="item-info">
          <div>
            <div class="item-name">${l.name}</div>
            ${subText ? `<div class="item-sub">${subText}</div>` : ''}
          </div>
        </div>
        <div class="item-right">
          <span class="item-amount liability">${fmt(l.total)}</span>
          <button class="btn icon" onclick="deleteLiability(${l.id})">✕</button>
        </div>
      </div>`;
      }).join('');

  // 월별 요약
  document.getElementById('sum-income').textContent = fmt(totalIncome);
  document.getElementById('sum-payment').textContent = fmt(monthlyPayment);
  document.getElementById('sum-interest').textContent = fmt(monthlyInterest);
  document.getElementById('sum-savings').textContent = fmt(monthlySavings > 0 ? monthlySavings : 0);
  function projectedAsset(years) {
    const savings = monthlySavings > 0 ? monthlySavings * 12 * years : 0;
    const investFV = data.investments.reduce((s, inv) => s + calcInvestFV(inv.monthly, inv.rate, years), 0);
    // 이자만 내고 있는 부채의 누적 이자 (원금 상환 안 되는 부분)
    const debtGrowth = data.liabilities.reduce((s, l) => {
      const monthlyInt = l.rate ? l.total * (l.rate / 100) / 12 : 0;
      const unpaid = Math.max(0, monthlyInt - l.monthly); // 매월 쌓이는 미상환 이자
      return s + unpaid * 12 * years;
    }, 0);
    return netWorth + savings + investFV - debtGrowth;
  }
  document.getElementById('sum-1year').textContent = fmt(projectedAsset(1));
  document.getElementById('sum-3year').textContent = fmt(projectedAsset(3));
  document.getElementById('sum-5year').textContent = fmt(projectedAsset(5));
  document.getElementById('sum-7year').textContent = fmt(projectedAsset(7));
  document.getElementById('sum-10year').textContent = fmt(projectedAsset(10));

  // 투자 목록
  const investList = document.getElementById('invest-list');
  investList.innerHTML = data.investments.length === 0
    ? '<p style="color:var(--muted);font-size:0.9rem;padding:8px 0">등록된 투자가 없습니다.</p>'
    : data.investments.map(inv => {
        const fv10 = calcInvestFV(inv.monthly, inv.rate, 10);
        const total10 = inv.monthly * 12 * 10;
        return `
      <div class="item-row">
        <div class="item-info">
          <div>
            <div class="item-name">${inv.name} <span style="color:var(--accent);font-size:0.82rem">연 ${inv.rate}%</span></div>
            <div class="item-sub">월 ${fmt(inv.monthly)} · 10년 후 예상 ${fmt(fv10)} (수익 ${fmt(fv10 - total10)})</div>
          </div>
        </div>
        <div class="item-right">
          <button class="btn icon" onclick="deleteInvestment(${inv.id})">✕</button>
        </div>
      </div>`;
      }).join('');

  renderCharts(netWorth, monthlySavings);
  renderInvestChart();
}

function renderCharts(netWorth, monthlySavings) {
  // 순자산 성장 예측 (연도별, 10년)
  const years = ['현재'];
  const growthData = [netWorth];
  for (let i = 1; i <= 10; i++) {
    years.push(`${i}년 후`);
    growthData.push(netWorth + (monthlySavings > 0 ? monthlySavings * 12 * i : 0));
  }

  if (growthChart) growthChart.destroy();
  const growCtx = document.getElementById('growth-chart').getContext('2d');
  growthChart = new Chart(growCtx, {
    type: 'line',
    data: {
      labels: years,
      datasets: [{
        label: '예상 순자산',
        data: growthData,
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99,102,241,0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#6366f1',
        pointRadius: 4,
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#8b90a0' }, grid: { color: 'rgba(255,255,255,0.05)' } },
        y: {
          ticks: { color: '#8b90a0', callback: v => fmtShort(v) },
          grid: { color: 'rgba(255,255,255,0.05)' }
        }
      }
    }
  });
}

function fmtShort(v) {
  if (Math.abs(v) >= 100000000) return (v / 100000000).toFixed(1) + '억';
  if (Math.abs(v) >= 10000) return (v / 10000).toFixed(0) + '만';
  return v;
}

function renderInvestChart() {
  const { netWorth, monthlySavings } = calcTotals();
  const labels = ['현재'];
  for (let i = 1; i <= investYears; i++) labels.push(`${i}년`);

  // 저축만 (투자 없이)
  const savingsOnly = [netWorth];
  // 저축 + 투자 합산
  const totalWithInvest = [netWorth];

  for (let i = 1; i <= investYears; i++) {
    const savings = monthlySavings > 0 ? monthlySavings * 12 * i : 0;
    const investFV = data.investments.reduce((s, inv) => s + calcInvestFV(inv.monthly, inv.rate, i), 0);
    const debtGrowth = data.liabilities.reduce((s, l) => {
      const monthlyInt = l.rate ? l.total * (l.rate / 100) / 12 : 0;
      return s + Math.max(0, monthlyInt - l.monthly) * 12 * i;
    }, 0);
    savingsOnly.push(netWorth + savings - debtGrowth);
    totalWithInvest.push(netWorth + savings + investFV - debtGrowth);
  }

  const datasets = [
    {
      label: '저축만',
      data: savingsOnly,
      borderColor: '#60a5fa',
      backgroundColor: 'rgba(96,165,250,0.08)',
      fill: true,
      tension: 0.4,
      pointRadius: 3,
      borderDash: [5, 4],
    },
    {
      label: '저축 + 투자',
      data: totalWithInvest,
      borderColor: '#4ade80',
      backgroundColor: 'rgba(74,222,128,0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 3,
    }
  ];

  if (investChart) investChart.destroy();
  const ctx = document.getElementById('invest-chart').getContext('2d');
  investChart = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets },
    options: {
      plugins: {
        legend: { labels: { color: '#8b90a0', font: { family: 'Noto Sans KR' } } }
      },
      scales: {
        x: { ticks: { color: '#8b90a0' }, grid: { color: 'rgba(255,255,255,0.05)' } },
        y: {
          ticks: { color: '#8b90a0', callback: v => fmtShort(v) },
          grid: { color: 'rgba(255,255,255,0.05)' }
        }
      }
    }
  });

}

render();
