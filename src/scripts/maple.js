const API_KEY = 'test_3c3ee9fcdbd9086a0a45c03537bc6180dd75379c7870ebbf5ce789b00a0d90e6efe8d04e6d233bd35cf2fabdeb93fb0d';
const BASE_URL = 'https://open.api.nexon.com/maplestory/v1';
const headers = { 'x-nxopen-api-key': API_KEY };

// 어제 날짜 (API는 전날 데이터 제공)
function getYesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

// ── 검색 ──────────────────────────────────────
document.getElementById('char-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') searchCharacter();
});

function searchCharacter() {
  const name = document.getElementById('char-input').value.trim();
  if (!name) return;
  try { sessionStorage.setItem('charName', name); } catch(e) {}
  window.location.href = 'character.html';
}

// ── 랭킹 ──────────────────────────────────────
let currentTab = 'overall';

const RANK_CONFIG = {
  overall: { url: '/ranking/overall', key: 'ranking', nameKey: 'character_name', subKey: 'character_class', valueLabel: 'Lv.', valueKey: 'character_level' },
  union:   { url: '/ranking/union',   key: 'ranking', nameKey: 'character_name', subKey: 'character_class', valueLabel: '유니온', valueKey: 'union_level' },
  dojang:  { url: '/ranking/dojang',  key: 'ranking', nameKey: 'character_name', subKey: 'character_class', valueLabel: '층', valueKey: 'dojang_floor' },
  theseed: { url: '/ranking/theseed', key: 'ranking', nameKey: 'character_name', subKey: 'character_class', valueLabel: '층', valueKey: 'theseed_floor' },
};

async function loadRanking(type) {
  const list = document.getElementById('ranking-list');
  list.innerHTML = '<div class="loading">랭킹 불러오는 중...</div>';

  const cfg = RANK_CONFIG[type];
  const date = getYesterday();

  try {
    const res = await fetch(`${BASE_URL}${cfg.url}?date=${date}&page=1`, { headers });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(`오류 ${res.status}: ${errBody.error?.message || errBody.message || '랭킹 데이터를 불러올 수 없습니다.'}`);
    }
    const data = await res.json();
    const items = data[cfg.key] || [];

    if (!items.length) {
      list.innerHTML = '<div class="loading">데이터가 없습니다.</div>';
      return;
    }

    list.innerHTML = items.slice(0, 10).map((item, i) => `
      <div class="rank-row" onclick="goCharacter('${item[cfg.nameKey]}')">
        <span class="rank-num ${i < 3 ? 'top' : ''}">${item.ranking}</span>
        <div class="rank-info">
          <span class="rank-name">${item[cfg.nameKey]}</span>
          <span class="rank-sub">${item.world_name} · ${item[cfg.subKey] || ''}</span>
        </div>
        <span class="rank-value">${cfg.valueLabel} ${Number(item[cfg.valueKey] || 0).toLocaleString()}</span>
      </div>
    `).join('');
  } catch (err) {
    list.innerHTML = `<div class="loading" style="color:#ff7070">${err.message}</div>`;
  }
}

function switchTab(type, el) {
  currentTab = type;
  document.querySelectorAll('.rank-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  loadRanking(type);
}

function goCharacter(name) {
  try { sessionStorage.setItem('charName', name); } catch(e) {}
  window.location.href = 'character.html';
}

// 페이지 로드 시 랭킹 불러오기
loadRanking('overall');
