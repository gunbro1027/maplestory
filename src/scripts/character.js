const API_KEY = 'test_3c3ee9fcdbd9086a0a45c03537bc6180dd75379c7870ebbf5ce789b00a0d90e6efe8d04e6d233bd35cf2fabdeb93fb0d';
const BASE_URL = 'https://open.api.nexon.com/maplestory/v1';
const headers = { 'x-nxopen-api-key': API_KEY };

const charName = sessionStorage.getItem('charName') || new URLSearchParams(window.location.search).get('name');

if (!charName) {
  window.location.href = 'index.html';
}

async function loadCharacter() {
  const main = document.getElementById('main-content');

  try {
    // 1. OCID 조회
    const ocidRes = await fetch(`${BASE_URL}/id?character_name=${encodeURIComponent(charName)}`, { headers });
    if (!ocidRes.ok) throw new Error(ocidRes.status === 404 ? '캐릭터를 찾을 수 없습니다.' : '오류가 발생했습니다.');
    const { ocid } = await ocidRes.json();

    // 2. 기본 정보 + 스탯 병렬 조회
    const [basicRes, statRes] = await Promise.all([
      fetch(`${BASE_URL}/character/basic?ocid=${ocid}`, { headers }),
      fetch(`${BASE_URL}/character/stat?ocid=${ocid}`, { headers }),
    ]);

    if (!basicRes.ok) throw new Error('캐릭터 기본 정보를 불러올 수 없습니다.');
    const basic = await basicRes.json();
    const statData = statRes.ok ? await statRes.json() : null;

    document.title = `${basic.character_name} - 건브로`;

    // 주요 스탯 추출
    const statMap = {};
    if (statData?.final_stat) {
      statData.final_stat.forEach(s => { statMap[s.stat_name] = s.stat_value; });
    }

    const keyStats = [
      { label: 'HP', key: 'HP' },
      { label: 'MP', key: 'MP' },
      { label: '공격력', key: '공격력' },
      { label: '마력', key: '마력' },
      { label: '데미지', key: '데미지' },
      { label: '보스 데미지', key: '보스 몬스터 데미지' },
      { label: '방어율 무시', key: '방어율 무시' },
      { label: '크리티컬 확률', key: '크리티컬 확률' },
    ];

    main.innerHTML = `
      <div class="detail-page">

        <a href="index.html" class="back-btn">← 검색으로 돌아가기</a>

        <!-- 캐릭터 프로필 -->
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

        <!-- 전투 스탯 -->
        ${statData ? `
        <div class="section">
          <h2 class="section-title">전투 스탯</h2>
          <div class="stat-grid">
            ${keyStats.map(s => statMap[s.key] !== undefined ? `
              <div class="stat-card">
                <span class="stat-card-label">${s.label}</span>
                <span class="stat-card-value">${Number(statMap[s.key]).toLocaleString()}</span>
              </div>
            ` : '').join('')}
          </div>
        </div>
        ` : ''}

      </div>
    `;

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
