const API_KEY = 'test_3c3ee9fcdbd9086a0a45c03537bc6180dd75379c7870ebbf5ce789b00a0d90e6efe8d04e6d233bd35cf2fabdeb93fb0d';
const BASE_URL = 'https://open.api.nexon.com/maplestory/v1';

const headers = { 'x-nxopen-api-key': API_KEY };

document.getElementById('char-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') searchCharacter();
});

async function searchCharacter() {
  const name = document.getElementById('char-input').value.trim();
  if (!name) return;

  const resultSection = document.getElementById('result-section');
  resultSection.classList.remove('hidden');
  resultSection.innerHTML = '<div class="loading">검색 중...</div>';

  try {
    // 1. OCID 조회
    const ocidRes = await fetch(`${BASE_URL}/id?character_name=${encodeURIComponent(name)}`, { headers });
    if (!ocidRes.ok) throw new Error(ocidRes.status === 404 ? '캐릭터를 찾을 수 없습니다.' : '오류가 발생했습니다.');
    const { ocid } = await ocidRes.json();

    // 2. 기본 정보 조회
    const basicRes = await fetch(`${BASE_URL}/character/basic?ocid=${ocid}`, { headers });
    if (!basicRes.ok) throw new Error('캐릭터 정보를 불러올 수 없습니다.');
    const data = await basicRes.json();

    resultSection.innerHTML = `
      <div id="char-card" class="char-card">
        <div class="char-image-wrap">
          <img src="${data.character_image}" alt="${data.character_name}" onerror="this.style.display='none'" />
        </div>
        <div class="char-info">
          <div class="char-name">${data.character_name}</div>
          <div class="char-badges">
            <span class="badge world">${data.world_name}</span>
            <span class="badge class">${data.character_class}</span>
          </div>
          <div class="char-stats">
            <div class="stat-item">
              <span class="stat-label">레벨</span>
              <span class="stat-value">Lv. ${data.character_level}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">경험치</span>
              <span class="stat-value">${data.character_exp_rate ?? '-'}%</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">인기도</span>
              <span class="stat-value">${data.character_popularity ?? '-'}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">길드</span>
              <span class="stat-value">${data.character_guild_name || '없음'}</span>
            </div>
          </div>
        </div>
      </div>`;
  } catch (err) {
    resultSection.innerHTML = `
      <div class="error-box">
        <span>${err.message}</span>
      </div>`;
  }
}
