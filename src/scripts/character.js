const API_KEY = 'test_3c3ee9fcdbd9086a0a45c03537bc6180dd75379c7870ebbf5ce789b00a0d90e6efe8d04e6d233bd35cf2fabdeb93fb0d';
const BASE_URL = 'https://open.api.nexon.com/maplestory/v1';
const headers = { 'x-nxopen-api-key': API_KEY };

const charName = sessionStorage.getItem('charName') || new URLSearchParams(window.location.search).get('name');
if (!charName) window.location.href = 'index.html';

let globalOcid = null;
let globalStat = null;

// ── 탭 전환 ──────────────────────────────────
function switchTab(tab, el) {
  document.querySelectorAll('.detail-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('tab-content').innerHTML = '<div class="loading">불러오는 중...</div>';

  if (tab === 'stat')    renderStat();
  if (tab === 'charlist') loadCharList();
  if (tab === 'achieve') loadAchieve();
}

// ── Tab1: 전투 스탯 ───────────────────────────
function renderStat() {
  const keyStats = [
    { label: 'HP',         key: 'HP' },
    { label: 'MP',         key: 'MP' },
    { label: '공격력',     key: '공격력' },
    { label: '마력',       key: '마력' },
    { label: '데미지',     key: '데미지' },
    { label: '보스 데미지', key: '보스 몬스터 데미지' },
    { label: '방어율 무시', key: '방어율 무시' },
    { label: '크리티컬',   key: '크리티컬 확률' },
  ];

  const statMap = {};
  if (globalStat?.final_stat) {
    globalStat.final_stat.forEach(s => { statMap[s.stat_name] = s.stat_value; });
  }

  const cards = keyStats
    .filter(s => statMap[s.key] !== undefined)
    .map(s => `
      <div class="stat-card">
        <span class="stat-card-label">${s.label}</span>
        <span class="stat-card-value">${Number(statMap[s.key]).toLocaleString()}</span>
      </div>
    `).join('');

  document.getElementById('tab-content').innerHTML = cards
    ? `<div class="stat-grid">${cards}</div>`
    : '<div class="loading">스탯 정보가 없습니다.</div>';
}

// ── Tab2: 캐릭터 목록 ─────────────────────────
async function loadCharList() {
  try {
    const res = await fetch(`${BASE_URL}/character/list`, { headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`오류 ${res.status}: ${err.error?.message || err.message || '불러올 수 없습니다.'}`);
    }
    const data = await res.json();
    const list = data.account_list?.flatMap(a => a.character_list) || [];

    if (!list.length) {
      document.getElementById('tab-content').innerHTML = '<div class="loading">캐릭터 목록이 없습니다.</div>';
      return;
    }

    document.getElementById('tab-content').innerHTML = `
      <div class="char-list">
        ${list.map(c => `
          <div class="char-list-row" onclick="goCharacter('${c.character_name}')">
            <div class="char-list-info">
              <span class="char-list-name">${c.character_name}</span>
              <span class="char-list-sub">${c.world_name} · ${c.character_class}</span>
            </div>
            <span class="char-list-level">Lv. ${c.character_level}</span>
          </div>
        `).join('')}
      </div>
    `;
  } catch (err) {
    document.getElementById('tab-content').innerHTML = `<div class="loading" style="color:#ff7070">${err.message}</div>`;
  }
}

// ── Tab3: 업적 정보 ───────────────────────────
async function loadAchieve() {
  try {
    const res = await fetch(`${BASE_URL}/user/achievement`, { headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`오류 ${res.status}: ${err.error?.message || err.message || '불러올 수 없습니다.'}`);
    }
    const data = await res.json();
    const list = data.achievement || [];

    if (!list.length) {
      document.getElementById('tab-content').innerHTML = '<div class="loading">업적 정보가 없습니다.</div>';
      return;
    }

    document.getElementById('tab-content').innerHTML = `
      <div class="achieve-list">
        ${list.map(a => `
          <div class="achieve-row">
            <div class="achieve-info">
              <span class="achieve-name">${a.achievement_name}</span>
              <span class="achieve-sub">${a.achievement_description || ''}</span>
            </div>
            <span class="achieve-grade">${a.achievement_grade || ''}</span>
          </div>
        `).join('')}
      </div>
    `;
  } catch (err) {
    document.getElementById('tab-content').innerHTML = `<div class="loading" style="color:#ff7070">${err.message}</div>`;
  }
}

function goCharacter(name) {
  try { sessionStorage.setItem('charName', name); } catch(e) {}
  window.location.href = 'character.html';
}

// ── 페이지 로드 ───────────────────────────────
async function loadCharacter() {
  const main = document.getElementById('main-content');

  try {
    const ocidRes = await fetch(`${BASE_URL}/id?character_name=${encodeURIComponent(charName)}`, { headers });
    if (!ocidRes.ok) throw new Error(ocidRes.status === 404 ? '캐릭터를 찾을 수 없습니다.' : '오류가 발생했습니다.');
    const { ocid } = await ocidRes.json();
    globalOcid = ocid;

    const [basicRes, statRes] = await Promise.all([
      fetch(`${BASE_URL}/character/basic?ocid=${ocid}`, { headers }),
      fetch(`${BASE_URL}/character/stat?ocid=${ocid}`, { headers }),
    ]);

    if (!basicRes.ok) throw new Error('캐릭터 기본 정보를 불러올 수 없습니다.');
    const basic = await basicRes.json();
    globalStat = statRes.ok ? await statRes.json() : null;

    document.title = `${basic.character_name} - 건브로`;

    main.innerHTML = `
      <div class="detail-page">
        <a href="index.html" class="back-btn">← 검색으로 돌아가기</a>

        <!-- 프로필 -->
        <div class="profile-card">
          <div class="profile-image-wrap">
            <img src="${basic.character_image}" alt="${basic.character_name}" onerror="this.style.display='none'" />
          </div>
          <div class="profile-info">
            <h1 class="profile-name">${basic.character_name}</h1>
            <div class="profile-badges">
              <span class="badge world">${basic.world_name}</span>
              <span class="badge class">${basic.character_class}</span>
              ${basic.character_guild_name ? `<span class="badge guild">${basic.character_guild_name}</span>` : ''}
            </div>
            <div class="profile-meta-grid">
              <div class="meta-item">
                <span class="meta-label">레벨</span>
                <span class="meta-value accent">Lv. ${basic.character_level}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">경험치</span>
                <span class="meta-value">${basic.character_exp_rate ?? '-'}%</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">인기도</span>
                <span class="meta-value">${basic.character_popularity ?? '-'}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">성별</span>
                <span class="meta-value">${basic.character_gender ?? '-'}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 탭 -->
        <div class="detail-tabs">
          <button class="detail-tab active" onclick="switchTab('stat', this)">전투 스탯</button>
          <button class="detail-tab" onclick="switchTab('charlist', this)">캐릭터 목록</button>
          <button class="detail-tab" onclick="switchTab('achieve', this)">업적</button>
        </div>
        <div id="tab-content" class="tab-content"></div>

      </div>
    `;

    renderStat();

  } catch (err) {
    main.innerHTML = `
      <div class="detail-page">
        <a href="index.html" class="back-btn">← 검색으로 돌아가기</a>
        <div class="error-box" style="margin-top:40px">${err.message}</div>
      </div>
    `;
  }
}

loadCharacter();
