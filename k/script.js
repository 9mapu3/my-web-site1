// 1. 物件データ（本来はサーバーから取得するもの）
const properties = [
    { location: "東京、日本", price: "15,000", rating: "4.9", date: "10月1日〜6日", desc: "個室 ・ ホスト：Tanakaさん" },
    { location: "京都、日本", price: "20,000", rating: "4.8", date: "11月3日〜8日", desc: "町家まるごと貸切" },
    { location: "北海道、日本", price: "12,000", rating: "4.7", date: "12月10日〜15日", desc: "雪山のログハウス" },
    { location: "沖縄、日本", price: "18,000", rating: "5.0", date: "9月20日〜25日", desc: "ビーチまで徒歩1分" },
    { location: "福岡、日本", price: "9,000", rating: "4.6", date: "1月5日〜10日", desc: "ラーメン屋の上" }
];

// 2. 物件カードを表示する関数（コンポーネントの原型）
function renderProperties() {
    const grid = document.getElementById('property-grid');
    grid.innerHTML = properties.map(p => `
        <div class="card">
            <div class="card-image">
                <span class="heart-btn">★</span>
            </div>
            <div class="card-info">
                <div class="card-title">
                    <strong>${p.location}</strong>
                    <span>★ ${p.rating}</span>
                </div>
                <p class="card-description">${p.desc}</p>
                <p class="card-date">${p.date}</p>
                <p class="card-price"><strong>¥${p.price}</strong> / 泊</p>
            </div>
        </div>
    `).join('');
    
    // カード生成後にイベントを再設定する必要がある
    setupHeartButtons();
}

// 既存のハートボタン処理を関数にまとめる
function setupHeartButtons() {
    const heartButtons = document.querySelectorAll('.heart-btn');
    heartButtons.forEach((button) => {
        button.addEventListener('click', (event) => {
            event.stopPropagation();
            button.classList.toggle('active');
        });
    });
}

// 実行！
renderProperties();

// モーダル制御用の要素を取得
const menuTrigger = document.getElementById('menu-trigger');
const loginModal = document.getElementById('login-modal');
const closeModal = document.getElementById('close-modal');

// メニュークリックで表示
menuTrigger.addEventListener('click', () => {
    loginModal.classList.add('show');
});

// 閉じるボタンで非表示
closeModal.addEventListener('click', () => {
    loginModal.classList.remove('show');
});

loginModal.addEventListener('click', (e) => {
    if (e.target === loginModal) {
        loginModal.classList.remove('show');
    }
});
