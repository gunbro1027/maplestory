const API_KEY = 'test_3c3ee9fcdbd9086a0a45c03537bc6180dd75379c7870ebbf5ce789b00a0d90e6efe8d04e6d233bd35cf2fabdeb93fb0d';
const BASE_URL = 'https://open.api.nexon.com/maplestory/v1';
const headers = { 'x-nxopen-api-key': API_KEY };

const charName = sessionStorage.getItem('charName') || new URLSearchParams(window.location.search).get('name');
if (!charName) window.location.href = 'index.html';

let globalStat      = null;
let globalHyperStat = null;
let globalPropensity = null;
let globalAbility   = null;
let currentTab = 'stat';

// ── 탭 전환 ───────────────────────────────────
function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.detail-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  renderTab();
}

function renderTab() {
  if (currentTab === 'stat')       renderStat();
  else if (currentTab === 'hyper') renderHyperStat();
  else if (currentTab === 'prop')  renderPropensity();
  else if (currentTab === 'ability') renderAbility();
}

// ── 전투 스탯 ─────────────────────────────────
function renderStat() {
  const keyStats = [
    { label: 'HP',          key: 'HP' },
    { label: 'MP',          key: 'MP' },
    { label: '공격력',      key: '공격력' },
    { label: '마력',        key: '마력' },
    { label: '데미지',      key: '데미지' },
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
    : '<div class="empty-msg">스탯 정보가 없습니다.</div>';
}

// ── 하이퍼스탯 ───────────────────────────────
function renderHyperStat() {
  if (!globalHyperStat) {
    document.getElementById('tab-content').innerHTML = '<div class="empty-msg">하이퍼스탯 정보가 없습니다.</div>';
    return;
  }

  const presetNo = globalHyperStat.use_preset_no || '1';
  const preset = globalHyperStat[`hyper_stat_preset_${presetNo}`] || [];
  const active = preset.filter(s => s.stat_level > 0);

  const rows = active.map(s => `
    <div class="hyper-row">
      <span class="hyper-type">${s.stat_type}</span>
      <span class="hyper-lv">Lv. ${s.stat_level}</span>
      <span class="hyper-val">${s.stat_increase}</span>
    </div>
  `).join('');

  document.getElementById('tab-content').innerHTML = rows
    ? `<div class="hyper-list">${rows}</div>`
    : '<div class="empty-msg">투자된 하이퍼스탯이 없습니다.</div>';
}

// ── 성향 ─────────────────────────────────────
function renderPropensity() {
  if (!globalPropensity) {
    document.getElementById('tab-content').innerHTML = '<div class="empty-msg">성향 정보가 없습니다.</div>';
    return;
  }

  const props = [
    { label: '카리스마', value: globalPropensity.charisma_level },
    { label: '감성',     value: globalPropensity.sensibility_level },
    { label: '통찰력',   value: globalPropensity.insight_level },
    { label: '의지',     value: globalPropensity.willingness_level },
    { label: '손재주',   value: globalPropensity.handicraft_level },
    { label: '매력',     value: globalPropensity.charm_level },
  ];

  const cards = props.map(p => `
    <div class="prop-card">
      <span class="prop-label">${p.label}</span>
      <div class="prop-bar-wrap">
        <div class="prop-bar" style="width:${Math.min(p.value, 100)}%"></div>
      </div>
      <span class="prop-value">Lv. ${p.value}</span>
    </div>
  `).join('');

  document.getElementById('tab-content').innerHTML = `<div class="prop-list">${cards}</div>`;
}

// ── 어빌리티 ─────────────────────────────────
function renderAbility() {
  if (!globalAbility) {
    document.getElementById('tab-content').innerHTML = '<div class="empty-msg">어빌리티 정보가 없습니다.</div>';
    return;
  }

  const gradeClass = {
    '레전드리': 'grade-legendary',
    '유니크':   'grade-unique',
    '에픽':     'grade-epic',
    '레어':     'grade-rare',
  };

  const list = globalAbility.ability_info || [];
  const rows = list.map(a => `
    <div class="ability-row">
      <span class="ability-grade ${gradeClass[a.ability_grade] || ''}">${a.ability_grade}</span>
      <span class="ability-value">${a.ability_value}</span>
    </div>
  `).join('');

  document.getElementById('tab-content').innerHTML = rows
    ? `<div class="ability-list">${rows}</div>`
    : '<div class="empty-msg">어빌리티 정보가 없습니다.</div>';
}

// ── 페이지 로드 ───────────────────────────────
async function loadCharacter() {
  const main = document.getElementById('main-content');

  try {
    const ocidRes = await fetch(`${BASE_URL}/id?character_name=${encodeURIComponent(charName)}`, { headers });
    if (!ocidRes.ok) throw new Error(ocidRes.status === 404 ? '캐릭터를 찾을 수 없습니다.' : '오류가 발생했습니다.');
    const { ocid } = await ocidRes.json();

    const yesterday = (() => {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      return d.toISOString().slice(0, 10);
    })();
    const q = `ocid=${ocid}&date=${yesterday}`;

    const [basicRes, statRes, hyperRes, propRes, abilityRes] = await Promise.all([
      fetch(`${BASE_URL}/character/basic?${q}`, { headers }),
      fetch(`${BASE_URL}/character/stat?${q}`, { headers }),
      fetch(`${BASE_URL}/character/hyper-stat?${q}`, { headers }),
      fetch(`${BASE_URL}/character/propensity?${q}`, { headers }),
      fetch(`${BASE_URL}/character/ability?${q}`, { headers }),
    ]);

    if (!basicRes.ok) throw new Error('캐릭터 기본 정보를 불러올 수 없습니다.');
    const basic = await basicRes.json();
    globalStat       = statRes.ok       ? await statRes.json()    : null;
    globalHyperStat  = hyperRes.ok      ? await hyperRes.json()   : null;
    globalPropensity = propRes.ok       ? await propRes.json()    : null;
    globalAbility    = abilityRes.ok    ? await abilityRes.json() : null;

    document.title = `${basic.character_name} - 건브로`;

    main.innerHTML = `
      <div class="detail-page">
        <a href="index.html" class="back-btn">← 검색으로 돌아가기</a>

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

        <div class="detail-tabs">
          <button class="detail-tab active" data-tab="stat"    onclick="switchTab('stat')">전투스탯</button>
          <button class="detail-tab"        data-tab="hyper"   onclick="switchTab('hyper')">하이퍼스탯</button>
          <button class="detail-tab"        data-tab="prop"    onclick="switchTab('prop')">성향</button>
          <button class="detail-tab"        data-tab="ability" onclick="switchTab('ability')">어빌리티</button>
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
