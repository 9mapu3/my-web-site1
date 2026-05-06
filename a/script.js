/* NOIRÉ demo homepage interactions (no backend) */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const fmtYen = (n) =>
  `¥${Math.max(0, Math.round(n))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;

const prefersReducedMotion = () =>
  window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

function setText(el, text) {
  if (!el) return;
  el.textContent = text;
}

function showToast(title, detail = "") {
  const host = $("[data-toasts]");
  if (!host) return;

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `
    <div class="toast__icon" aria-hidden="true">✦</div>
    <div>
      <div class="toast__t"></div>
      <div class="toast__s"></div>
    </div>
    <button class="toast__close" type="button" aria-label="閉じる">✕</button>
  `;
  $(".toast__t", toast).textContent = title;
  $(".toast__s", toast).textContent = detail;

  const close = () => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(8px)";
    setTimeout(() => toast.remove(), prefersReducedMotion() ? 0 : 220);
  };
  $(".toast__close", toast).addEventListener("click", close);
  host.prepend(toast);
  setTimeout(close, 4200);
}

function withBackdrop(enabled) {
  const bd = $("[data-backdrop]");
  if (!bd) return;
  bd.hidden = !enabled;
}

function openDrawer(name) {
  const d = $(`[data-drawer="${name}"]`);
  if (!d) return;
  d.hidden = false;
  requestAnimationFrame(() => d.classList.add("is-open"));
  withBackdrop(true);
  document.documentElement.style.overflow = "hidden";
}

function closeDrawers() {
  $$("[data-drawer].is-open").forEach((d) => d.classList.remove("is-open"));
  $$("[data-drawer]").forEach((d) => {
    if (!d.classList.contains("is-open")) {
      setTimeout(() => (d.hidden = true), prefersReducedMotion() ? 0 : 260);
    }
  });
  withBackdrop(false);
  document.documentElement.style.overflow = "";
}

function openModal(name) {
  const m = $(`[data-modal="${name}"]`);
  if (!m) return;
  if (typeof m.showModal === "function") {
    m.showModal();
  } else {
    // Basic fallback: emulate modal with class
    m.setAttribute("open", "");
    withBackdrop(true);
  }
}

function closeModal(name) {
  const m = $(`[data-modal="${name}"]`);
  if (!m) return;
  if (typeof m.close === "function") m.close();
  else m.removeAttribute("open");
  withBackdrop(false);
}

function closeAllOverlays() {
  closeDrawers();
  closeSidepanel();
  $$("dialog[open]").forEach((d) => {
    try {
      d.close();
    } catch {
      d.removeAttribute("open");
    }
  });
  closeMega();
  withBackdrop(false);
  document.documentElement.style.overflow = "";
}

/* Theme */
function applyTheme(theme) {
  if (theme === "light") document.documentElement.setAttribute("data-theme", "light");
  else document.documentElement.removeAttribute("data-theme");
}
const savedTheme = localStorage.getItem("noire_theme");
if (savedTheme) applyTheme(savedTheme);

/* Header elevate on scroll */
(() => {
  const header = $("[data-elevate-on-scroll]");
  if (!header) return;
  const onScroll = () => {
    const elevated = window.scrollY > 8;
    header.classList.toggle("is-elevated", elevated);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
})();

/* Megamenu */
let megaOpen = false;
let megaActive = "";
function openMega(key) {
  const root = $("[data-mega-root]");
  if (!root) return;
  const panel = $(".megamenu");
  if (!panel) return;

  megaOpen = true;
  megaActive = key;
  panel.classList.add("is-open");
  $$("[data-menu]").forEach((b) => b.setAttribute("aria-expanded", b.dataset.menu === key ? "true" : "false"));
  $$("[data-mega]").forEach((s) => s.classList.toggle("is-active", s.dataset.mega === key));
}
function closeMega() {
  const panel = $(".megamenu");
  if (!panel) return;
  megaOpen = false;
  megaActive = "";
  panel.classList.remove("is-open");
  $$("[data-menu]").forEach((b) => b.setAttribute("aria-expanded", "false"));
  $$("[data-mega]").forEach((s) => s.classList.remove("is-active"));
}
$$("[data-menu]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const key = btn.dataset.menu;
    if (!key) return;
    if (megaOpen && megaActive === key) closeMega();
    else openMega(key);
  });
});
document.addEventListener("click", (e) => {
  const t = e.target;
  const inMenu = t instanceof Element && (t.closest?.(".megamenu") || t.closest?.("[data-menu]"));
  if (!inMenu) closeMega();
});
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeMega();
});

/* Sidepanel */
function openSidepanel() {
  const p = $("#navPanel");
  if (!p) return;
  p.hidden = false;
  requestAnimationFrame(() => p.classList.add("is-open"));
  withBackdrop(true);
  document.documentElement.style.overflow = "hidden";
  const burger = $("[data-action='toggle-nav']");
  burger?.setAttribute("aria-expanded", "true");
}
function closeSidepanel() {
  const p = $("#navPanel");
  if (!p) return;
  p.classList.remove("is-open");
  const burger = $("[data-action='toggle-nav']");
  burger?.setAttribute("aria-expanded", "false");
  setTimeout(() => (p.hidden = true), prefersReducedMotion() ? 0 : 260);
}
function toggleSidepanel() {
  const p = $("#navPanel");
  if (!p) return;
  const isOpen = !p.hidden && p.classList.contains("is-open");
  if (isOpen) {
    closeSidepanel();
    withBackdrop(false);
    document.documentElement.style.overflow = "";
  } else {
    closeMega();
    openSidepanel();
  }
}

/* Product data (from cards) */
function parseCardData(card) {
  const name = $(".pCard__name", card)?.textContent?.trim() ?? "Item";
  const priceText = $(".pCard__price", card)?.textContent ?? "¥0";
  const price = Number((priceText.match(/\d[\d,]*/)?.[0] ?? "0").replace(/,/g, ""));
  const sku = $("[data-action='add']", card)?.dataset?.sku ?? card.dataset?.sku ?? "SKU";
  const desc = $(".pCard__desc", card)?.textContent?.trim() ?? "";
  const img = $(".pCard__img", card)?.getAttribute("data-img") ?? "p1";
  return { name, price, sku, desc, img };
}

/* Cart state */
const cart = new Map();
function initCartFromDOM() {
  $$("[data-cart-list] .cartitem").forEach((item) => {
    const sku = item.dataset.sku;
    const priceText = $(".cartitem__price", item)?.textContent ?? "¥0";
    const price = Number((priceText.match(/\d[\d,]*/)?.[0] ?? "0").replace(/,/g, ""));
    const name = $(".cartitem__name", item)?.textContent?.trim() ?? sku;
    const qty = Number($(".qty__num", item)?.value ?? "1");
    cart.set(sku, { name, price, qty: Math.max(1, qty) });
  });
}

function cartCount() {
  let c = 0;
  cart.forEach((v) => (c += v.qty));
  return c;
}

function cartSubtotal() {
  let s = 0;
  cart.forEach((v) => (s += v.qty * v.price));
  return s;
}

function updateBadges() {
  const cc = cartCount();
  $$("[data-cart-count]").forEach((b) => setText(b, String(cc)));
  $$("[data-cart-count-pill]").forEach((p) => setText(p, String(cc)));
}

function updateSummary() {
  const subtotal = cartSubtotal();
  const shipping = subtotal >= 12000 ? 0 : subtotal === 0 ? 0 : 600;
  const total = subtotal + shipping;
  setText($("[data-subtotal]"), fmtYen(subtotal));
  setText($("[data-shipping]"), fmtYen(shipping));
  setText($("[data-total]"), fmtYen(total));
}

function addToCart({ sku, name, price }, qty = 1) {
  const cur = cart.get(sku);
  if (cur) cur.qty += qty;
  else cart.set(sku, { name, price, qty });
  syncCartDOM();
  updateBadges();
  updateSummary();
  showToast("カートに追加", `${name}（${fmtYen(price)}）`);
}

function removeFromCart(sku) {
  cart.delete(sku);
  syncCartDOM();
  updateBadges();
  updateSummary();
  showToast("削除しました", sku);
}

function setQty(sku, qty) {
  const v = cart.get(sku);
  if (!v) return;
  v.qty = Math.max(1, Math.min(99, qty));
  syncCartDOM();
  updateBadges();
  updateSummary();
}

function syncCartDOM() {
  const list = $("[data-cart-list]");
  if (!list) return;

  // Remove missing
  $$(":scope > .cartitem", list).forEach((item) => {
    const sku = item.dataset.sku;
    if (!cart.has(sku)) item.remove();
  });

  // Add/update existing
  cart.forEach((v, sku) => {
    let item = $(`.cartitem[data-sku="${CSS.escape(sku)}"]`, list);
    if (!item) {
      item = document.createElement("div");
      item.className = "cartitem";
      item.dataset.sku = sku;
      item.innerHTML = `
        <div class="cartitem__img" data-img="p1"></div>
        <div class="cartitem__body">
          <div class="cartitem__top">
            <div class="cartitem__name"></div>
            <div class="cartitem__price"></div>
          </div>
          <div class="muted">Color: Black · Size: M</div>
          <div class="cartitem__ctrl">
            <div class="qty" aria-label="数量">
              <button class="qty__btn" type="button" data-action="qty" data-delta="-1">−</button>
              <input class="qty__num" value="1" inputmode="numeric" aria-label="数量入力" />
              <button class="qty__btn" type="button" data-action="qty" data-delta="1">＋</button>
            </div>
            <button class="linklike" type="button" data-action="remove">削除</button>
          </div>
        </div>
      `;
      list.prepend(item);
    }
    setText($(".cartitem__name", item), v.name);
    setText($(".cartitem__price", item), fmtYen(v.price));
    const q = $(".qty__num", item);
    if (q) q.value = String(v.qty);
    $(".cartitem__img", item)?.setAttribute("data-img", sku.includes("BAG") ? "p3" : sku.includes("JKT") ? "p1" : "p2");
  });

  // Wire remove buttons for new items
  $$("[data-action='remove']", list).forEach((btn) => {
    if (btn.dataset.bound) return;
    btn.dataset.bound = "1";
    btn.addEventListener("click", () => {
      const item = btn.closest(".cartitem");
      const sku = btn.dataset.sku || item?.dataset?.sku;
      if (sku) removeFromCart(sku);
    });
  });
}

initCartFromDOM();
updateBadges();
updateSummary();

/* Global actions */
document.addEventListener("click", (e) => {
  const t = e.target;
  const el = t instanceof Element ? t.closest("[data-action]") : null;
  if (!el) return;

  const action = el.dataset.action;
  if (!action) return;

  switch (action) {
    case "toggle-nav":
      toggleSidepanel();
      break;
    case "open-search":
      closeMega();
      openModal("search");
      setTimeout(() => $("[data-modal='search'] .input")?.focus(), 50);
      break;
    case "open-filters":
      closeMega();
      openDrawer("filters");
      break;
    case "open-cart":
      closeMega();
      openDrawer("cart");
      break;
    case "close-drawer":
      closeDrawers();
      break;
    case "toast":
      showToast("OK", el.dataset.toast || "デモの通知です");
      break;
    case "open-size":
      showToast("サイズ", "デモ: サイズ表はモーダル表示（未実装）");
      break;
    case "open-size-guide":
      openInfo("サイズガイド", `
        <p><strong>デモUI</strong>：ここにサイズガイドが入ります。</p>
        <ul>
          <li>肩幅 / 身幅 / 着丈 / 袖丈</li>
          <li>おすすめサイズ（身長・体型）</li>
          <li>採寸方法</li>
        </ul>
      `);
      break;
    case "open-store":
      openInfo("店舗", `
        <p><strong>NOIRÉ Atelier</strong>（デモ）</p>
        <ul>
          <li>表参道 — 11:00-20:00</li>
          <li>中目黒 — 12:00-19:00</li>
          <li>大阪 — 11:00-20:00</li>
        </ul>
      `);
      break;
    case "open-help":
      openInfo("ヘルプ", `
        <p>よくある質問（デモ）</p>
        <ul>
          <li>配送日数</li>
          <li>返品/交換</li>
          <li>支払い方法</li>
        </ul>
      `);
      break;
    case "toggle-theme": {
      const isLight = document.documentElement.getAttribute("data-theme") === "light";
      const next = isLight ? "dark" : "light";
      applyTheme(next === "light" ? "light" : "dark");
      localStorage.setItem("noire_theme", next === "light" ? "light" : "dark");
      showToast("テーマ切替", next === "light" ? "ライト" : "ダーク");
      break;
    }
    case "wishlist":
      showToast("ほしい物に追加", "デモ: 永続化はしません");
      bumpWishlist();
      break;
    case "add": {
      const sku = el.dataset.sku || el.dataset.qvAdd || "SKU";
      const card = el.closest(".pCard");
      if (card) {
        const data = parseCardData(card);
        addToCart({ sku: data.sku, name: data.name, price: data.price }, 1);
      } else {
        // Quick view add
        const name = $("[data-qv-name]")?.textContent?.trim() ?? sku;
        const priceText = $("[data-qv-price]")?.textContent ?? "¥0";
        const price = Number((priceText.match(/\d[\d,]*/)?.[0] ?? "0").replace(/,/g, ""));
        addToCart({ sku, name, price }, 1);
      }
      break;
    }
    case "quick-add": {
      const sku = el.dataset.sku;
      if (!sku) break;
      const map = {
        "JKT-002": { name: "Satin Shell Jacket", price: 39800 },
        "TEE-011": { name: "Sheer Long Tee", price: 12400 },
      };
      addToCart({ sku, ...(map[sku] ?? { name: sku, price: 0 }) }, 1);
      break;
    }
    case "remove": {
      const sku = el.dataset.sku || el.closest(".cartitem")?.dataset?.sku;
      if (sku) removeFromCart(sku);
      break;
    }
    case "qty": {
      const item = el.closest(".cartitem");
      const sku = item?.dataset?.sku;
      const delta = Number(el.dataset.delta ?? "0");
      const input = $(".qty__num", item);
      if (!sku || !input) break;
      const cur = Number(input.value || "1");
      setQty(sku, cur + delta);
      break;
    }
    case "quickview": {
      const card = el.closest(".pCard");
      if (!card) break;
      const d = parseCardData(card);
      fillQuickView(d);
      openModal("quickview");
      break;
    }
    case "open-wishlist":
      showToast("ウィッシュリスト", "デモ: アイテム一覧は未実装");
      break;
    case "view": {
      const v = el.dataset.view;
      if (!v) break;
      $$("[data-action='view']").forEach((b) => b.classList.toggle("is-active", b === el));
      $("[data-products-view]")?.setAttribute("data-products-view", v);
      $("[data-products-view]")?.setAttribute("aria-busy", "false");
      showToast("表示", v);
      break;
    }
    case "toggle-tag":
      el.classList.toggle("tag--active");
      filterProducts();
      break;
    case "apply-filters":
      showToast("フィルタ", "適用しました（デモ）");
      closeDrawers();
      break;
    case "lb-filter": {
      const f = el.dataset.filter || "all";
      $$("[data-action='lb-filter']").forEach((b) => b.classList.toggle("is-active", b === el));
      filterLookbook(f);
      break;
    }
    case "lb-shuffle":
      shuffleLookbook();
      break;
    case "reviews-next":
      scrollReviews(1);
      break;
    case "reviews-prev":
      scrollReviews(-1);
      break;
    case "open-video":
      openInfo("ムービー", "<p>デモ: ここに埋め込み動画が入ります。</p>");
      break;
    case "open-tryon":
      openInfo("バーチャル試着", "<p>デモ: カメラ連携UIが入る想定です。</p>");
      break;
    case "open-quiz":
      openInfo("パーソナル診断", "<p>デモ: ここに質問フォームが入ります。</p>");
      break;
    case "search-suggest": {
      const q = el.dataset.q || "";
      const input = $("[data-modal='search'] input[name='q']");
      if (input) input.value = q;
      showToast("候補を入力", q);
      break;
    }
    case "search-submit": {
      const input = $("[data-modal='search'] input[name='q']");
      const q = input?.value?.trim() || "（空）";
      showToast("検索", q);
      break;
    }
    default:
      break;
  }
});

/* Backdrop click closes overlays */
(() => {
  const bd = $("[data-backdrop]");
  if (!bd) return;
  bd.addEventListener("click", () => closeAllOverlays());
})();

/* Dialog close sync backdrop */
$$("dialog.modal").forEach((d) => {
  d.addEventListener("close", () => {
    // If no drawers/panels are open, remove backdrop
    const anyDrawer = $$("[data-drawer].is-open").length > 0;
    const navOpen = !$("#navPanel")?.hidden && $("#navPanel")?.classList.contains("is-open");
    if (!anyDrawer && !navOpen) withBackdrop(false);
  });
});

/* Keyboard shortcuts */
window.addEventListener("keydown", (e) => {
  const isCmdK = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k";
  if (isCmdK) {
    e.preventDefault();
    openModal("search");
    setTimeout(() => $("[data-modal='search'] .input")?.focus(), 50);
  }
  if (e.key === "Escape") closeAllOverlays();
});

/* Sort / filter products */
function filterProducts() {
  const activeTags = $$("[data-action='toggle-tag'].tag--active").map((t) => t.dataset.tag).filter(Boolean);
  const cards = $$(".pCard");
  cards.forEach((c) => {
    const tags = (c.dataset.tags ?? "").split(/\s+/).filter(Boolean);
    const ok = activeTags.length === 0 ? true : activeTags.every((t) => tags.includes(t));
    c.style.display = ok ? "" : "none";
  });
  showToast("フィルタ", activeTags.length ? activeTags.join(", ") : "解除");
}

function sortProducts(mode) {
  const grid = $(".products");
  if (!grid) return;
  const cards = $$(".pCard", grid).filter((c) => c.style.display !== "none");
  const key = (c) => ({
    new: Number(c.dataset.price ?? 0), // demo: not actual date
    priceAsc: Number(c.dataset.price ?? 0),
    priceDesc: -Number(c.dataset.price ?? 0),
    rating: -Number(c.dataset.rating ?? 0),
    featured: 0,
  }[mode] ?? 0);

  if (mode === "featured") {
    // Keep original order
    return;
  }
  const sorted = [...cards].sort((a, b) => key(a) - key(b));
  sorted.forEach((c) => grid.appendChild(c));
  showToast("並び替え", mode);
}

$("#sortSelect")?.addEventListener("change", (e) => {
  const mode = e.target?.value ?? "featured";
  sortProducts(mode);
});

/* Lookbook filter/shuffle */
function filterLookbook(filter) {
  const shots = $$("[data-gallery] .shot");
  shots.forEach((s) => {
    const key = s.dataset.lb;
    const ok = filter === "all" ? true : key === filter;
    s.style.display = ok ? "" : "none";
  });
  showToast("Lookbook", filter);
}

function shuffleLookbook() {
  const g = $("[data-gallery]");
  if (!g) return;
  const shots = $$(".shot", g);
  const shuffled = [...shots].sort(() => Math.random() - 0.5);
  shuffled.forEach((s) => g.appendChild(s));
  showToast("Lookbook", "シャッフルしました");
}

/* Reviews nav */
function scrollReviews(dir) {
  const r = $("[data-reviews]");
  if (!r) return;
  const w = Math.min(420, r.clientWidth * 0.9);
  r.scrollBy({ left: dir * w, behavior: prefersReducedMotion() ? "auto" : "smooth" });
}

/* Quick view fill */
function fillQuickView(d) {
  setText($("[data-qv-name]"), d.name);
  setText($("[data-qv-price]"), fmtYen(d.price));
  setText($("[data-qv-desc]"), d.desc);
  $("[data-qv-img]")?.setAttribute("data-img", d.img);
  $("[data-qv-add]")?.setAttribute("data-sku", d.sku);
}

/* Info modal */
function openInfo(title, bodyHtml) {
  setText($("[data-info-title]"), title);
  const body = $("[data-info-body]");
  if (body) body.innerHTML = bodyHtml;
  openModal("info");
}

/* Newsletter submit */
document.querySelector("form[data-action='newsletter']")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const fd = new FormData(e.currentTarget);
  const email = String(fd.get("email") ?? "").trim();
  if (!email) return;
  showToast("登録しました", email);
  e.currentTarget.reset();
});

/* Wishlist bump demo */
function bumpWishlist() {
  const badge = $("[data-wishlist-count]");
  const pill = $("[data-wishlist-count-pill]");
  const cur = Number(badge?.textContent ?? "0");
  const next = Math.min(99, cur + 1);
  if (badge) badge.textContent = String(next);
  if (pill) pill.textContent = String(next);
}

/* Clicking gallery shots opens a light info */
$$("[data-gallery] .shot").forEach((s) => {
  s.addEventListener("click", () => {
    const t = $(".shot__t", s)?.textContent ?? "Look";
    const d = $(".shot__s", s)?.textContent ?? "";
    openInfo("Lookbook", `<p><strong>${escapeHtml(t)}</strong></p><p class="muted">${escapeHtml(d)}</p>`);
  });
});

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* Keep overlay state sane on resize */
window.addEventListener("resize", () => {
  closeMega();
});
