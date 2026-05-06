const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

const fmtYen = (n) =>
  `¥${Math.max(0, Math.round(n))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;

const reduced = () =>
  window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

function toast(t, s = "") {
  const host = $("[data-toasts]");
  if (!host) return;
  const el = document.createElement("div");
  el.className = "toast";
  el.innerHTML = `
    <div class="toast__i" aria-hidden="true">✶</div>
    <div>
      <div class="toast__t"></div>
      <div class="toast__s"></div>
    </div>
    <button class="toast__x" type="button" aria-label="閉じる">✕</button>
  `;
  $(".toast__t", el).textContent = t;
  $(".toast__s", el).textContent = s;

  const close = () => {
    el.style.opacity = "0";
    el.style.transform = "translateY(8px)";
    setTimeout(() => el.remove(), reduced() ? 0 : 220);
  };
  $(".toast__x", el).addEventListener("click", close);
  host.prepend(el);
  setTimeout(close, 4200);
}

/* Header elevate */
(() => {
  const h = $("[data-elevate]");
  if (!h) return;
  const f = () => h.classList.toggle("is-elev", window.scrollY > 8);
  f();
  window.addEventListener("scroll", f, { passive: true });
})();

/* Theme */
function applyTheme(v) {
  // CSS側は html[data-theme="dark"] を見る（ライトはデフォルト）
  if (v === "dark") document.documentElement.setAttribute("data-theme", "dark");
  else document.documentElement.removeAttribute("data-theme");
}
const saved = localStorage.getItem("vivid_theme");
if (saved) applyTheme(saved);

/* Backdrop */
function setBack(on) {
  const b = $("[data-back]");
  if (!b) return;
  b.hidden = !on;
}

/* Drawers */
function openDrawer(name) {
  const d = $(`[data-drawer="${name}"]`);
  if (!d) return;
  d.hidden = false;
  requestAnimationFrame(() => d.classList.add("is-on"));
  setBack(true);
  document.documentElement.style.overflow = "hidden";
}

function closeDrawers() {
  $$("[data-drawer].is-on").forEach((d) => d.classList.remove("is-on"));
  setBack(false);
  document.documentElement.style.overflow = "";
  $$("[data-drawer]").forEach((d) =>
    setTimeout(() => (d.hidden = true), reduced() ? 0 : 260),
  );
}

/* Timer: 48min demo countdown */
(() => {
  const out = $("[data-timer-v]");
  if (!out) return;
  const start = Date.now();
  const total = 48 * 60; // seconds
  const tick = () => {
    const elapsed = Math.floor((Date.now() - start) / 1000);
    const left = Math.max(0, total - (elapsed % (total + 1)));
    const mm = String(Math.floor(left / 60)).padStart(2, "0");
    const ss = String(left % 60).padStart(2, "0");
    out.textContent = `${mm}:${ss}`;
  };
  tick();
  setInterval(tick, 1000);
})();

/* Cart state */
const cart = new Map();
function initCart() {
  $$("[data-cart] .item").forEach((it) => {
    const sku = it.dataset.sku;
    const price = Number(it.dataset.price ?? "0");
    const name = $(".item__t", it)?.textContent?.trim() ?? sku;
    const qty = Number($(".qty__n", it)?.value ?? "1");
    cart.set(sku, { sku, name, price, qty: Math.max(1, qty) });
  });
}
function cartCount() {
  let c = 0;
  cart.forEach((v) => (c += v.qty));
  return c;
}
function subtotal() {
  let s = 0;
  cart.forEach((v) => (s += v.qty * v.price));
  return s;
}
function syncSummary() {
  const sub = subtotal();
  const ship = sub >= 12000 || sub === 0 ? 0 : 600;
  const tot = sub + ship;
  $("[data-sub]") && ($("[data-sub]").textContent = fmtYen(sub));
  $("[data-ship]") && ($("[data-ship]").textContent = fmtYen(ship));
  $("[data-tot]") && ($("[data-tot]").textContent = fmtYen(tot));
  $("[data-cart-count]") && ($("[data-cart-count]").textContent = String(cartCount()));
}
function addItem(sku, name, price) {
  const cur = cart.get(sku);
  if (cur) cur.qty += 1;
  else cart.set(sku, { sku, name, price, qty: 1 });
  renderCart();
  syncSummary();
  toast("Added", `${name} / ${fmtYen(price)}`);
}
function rmItem(sku) {
  cart.delete(sku);
  renderCart();
  syncSummary();
  toast("Removed", sku);
}
function setQty(sku, qty) {
  const v = cart.get(sku);
  if (!v) return;
  v.qty = Math.max(1, Math.min(99, qty));
  renderCart();
  syncSummary();
}

function renderCart() {
  const host = $("[data-cart]");
  if (!host) return;
  // remove missing
  $$(":scope > .item", host).forEach((n) => {
    if (!cart.has(n.dataset.sku)) n.remove();
  });
  // upsert
  cart.forEach((v) => {
    let it = $(`.item[data-sku="${CSS.escape(v.sku)}"]`, host);
    if (!it) {
      it = document.createElement("div");
      it.className = "item";
      it.dataset.sku = v.sku;
      it.dataset.price = String(v.price);
      it.innerHTML = `
        <div class="item__img" data-img="p1"></div>
        <div class="item__b">
          <div class="item__t"></div>
          <div class="row">
            <div class="micro muted"></div>
            <div class="qty">
              <button type="button" class="qty__b" data-action="qty" data-d="--">−</button>
              <input class="qty__n" value="1" inputmode="numeric" />
              <button type="button" class="qty__b" data-action="qty" data-d="++">＋</button>
            </div>
          </div>
          <button class="link micro" type="button" data-action="rm">remove</button>
        </div>
      `;
      host.prepend(it);
    }
    $(".item__t", it).textContent = v.name;
    $(".micro.muted", it).textContent = fmtYen(v.price);
    $(".qty__n", it).value = String(v.qty);
    $(".item__img", it)?.setAttribute(
      "data-img",
      v.sku.startsWith("BG") ? "p3" : v.sku.startsWith("TS") ? "p2" : "p1",
    );
    const rm = $("[data-action='rm']", it);
    if (rm && !rm.dataset.bound) {
      rm.dataset.bound = "1";
      rm.addEventListener("click", () => rmItem(v.sku));
    }
  });
}

initCart();
syncSummary();

/* Quick view fill */
const catalog = {
  "HD-001": { name: "Hologram Hoodie", price: 18900, img: "p1", desc: "光る、でも軽い。反射で遊ぶフーディ。" },
  "TS-010": { name: "Glitch Tee", price: 12400, img: "p2", desc: "ノイズを着る。グリッチ風プリント。" },
  "BG-004": { name: "PVC Sling Bag", price: 9600, img: "p3", desc: "透明で“中身までコーデ”にする。" },
  "CP-002": { name: "Candy Cap", price: 14800, img: "p4", desc: "小物こそ派手に。色で完成させる。" },
};
function fillQV(sku) {
  const d = catalog[sku];
  if (!d) return;
  $("[data-qv-name]") && ($("[data-qv-name]").textContent = d.name);
  $("[data-qv-price]") && ($("[data-qv-price]").textContent = fmtYen(d.price));
  $("[data-qv-desc]") && ($("[data-qv-desc]").textContent = d.desc);
  $("[data-qv-img]")?.setAttribute("data-img", d.img);
  $("[data-qv-sku]")?.setAttribute("data-qv-sku", sku);
  const btn = $("[data-action='add-qv']");
  if (btn) btn.dataset.qvSku = sku;
}

/* Mix preview filters */
function setMixFx({ loud, glitch }) {
  const box = $("[data-mix-preview]");
  if (!box) return;
  const sat = 1 + loud / 160;
  const con = 1 + loud / 240;
  const hue = (glitch / 100) * 24;
  box.style.filter = `saturate(${sat}) contrast(${con}) hue-rotate(${hue}deg)`;
}
setMixFx({ loud: 74, glitch: 38 });

/* Global actions */
document.addEventListener("click", (e) => {
  const a = e.target instanceof Element ? e.target.closest("[data-action]") : null;
  if (!a) return;
  const act = a.dataset.action;
  if (!act) return;

  switch (act) {
    case "toast":
      toast("OK", a.dataset.toast || "demo");
      break;
    case "toggle-theme": {
      const cur = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
      const next = cur === "dark" ? "light" : "dark";
      applyTheme(next);
      localStorage.setItem("vivid_theme", next);
      toast("テーマ", next === "dark" ? "よるモード" : "ひるモード");
      break;
    }
    case "toggle-drawer": {
      const name = a.dataset.drawer;
      if (!name) break;
      const d = $(`[data-drawer="${name}"]`);
      const open = d && !d.hidden && d.classList.contains("is-on");
      if (open) closeDrawers();
      else {
        closeDrawers();
        openDrawer(name);
      }
      break;
    }
    case "close-drawer":
      closeDrawers();
      break;
    case "open-modal": {
      const m = a.dataset.modal;
      if (!m) break;
      if (m === "qv") {
        const sku = a.dataset.sku;
        if (sku) fillQV(sku);
      }
      $(`[data-modal="${m}"]`)?.showModal?.();
      break;
    }
    case "open-kbd":
      $("[data-modal='kbd']")?.showModal?.();
      setTimeout(() => $("[data-modal='kbd'] input[name='q']")?.focus(), 50);
      break;
    case "do-search": {
      const q = $("[data-modal='kbd'] input[name='q']")?.value?.trim() || "（空）";
      toast("Search", q);
      break;
    }
    case "sug": {
      const q = a.dataset.q || "";
      const inp = $("[data-modal='kbd'] input[name='q']");
      if (inp) inp.value = q;
      toast("Input", q);
      break;
    }
    case "view": {
      const v = a.dataset.view;
      const g = $("[data-grid]");
      if (!g || !v) break;
      g.dataset.view = v;
      $$("[data-action='view']").forEach((b) => b.classList.toggle("is-on", b === a));
      toast("View", v);
      break;
    }
    case "tag":
      a.classList.toggle("is-on");
      filterCards();
      break;
    case "sort": {
      const sel = a.closest("select");
      const mode = sel?.value ?? "featured";
      sortCards(mode);
      break;
    }
    case "add": {
      const sku = a.dataset.sku;
      if (!sku) break;
      const d = catalog[sku];
      if (!d) break;
      addItem(sku, d.name, d.price);
      break;
    }
    case "add-qv": {
      const sku = a.dataset.qvSku;
      const d = catalog[sku];
      if (!d) break;
      addItem(sku, d.name, d.price);
      break;
    }
    case "fav":
      toast("Fav", "saved (demo)");
      break;
    case "quick": {
      const sku = a.dataset.sku;
      const d = catalog[sku];
      if (!d) break;
      addItem(sku, d.name, d.price);
      break;
    }
    case "rm": {
      const sku = a.dataset.sku || a.closest(".item")?.dataset?.sku;
      if (sku) rmItem(sku);
      break;
    }
    case "qty": {
      const it = a.closest(".item");
      const sku = it?.dataset?.sku;
      const input = $(".qty__n", it);
      if (!sku || !input) break;
      const cur = Number(input.value || "1");
      const next = a.dataset.d === "++" ? cur + 1 : cur - 1;
      setQty(sku, next);
      break;
    }
    case "shuffle":
      shuffleMix();
      break;
    default:
      break;
  }
});

/* Close overlays */
document.addEventListener("keydown", (e) => {
  const isCtrlK = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k";
  if (isCtrlK) {
    e.preventDefault();
    $("[data-modal='kbd']")?.showModal?.();
    setTimeout(() => $("[data-modal='kbd'] input[name='q']")?.focus(), 50);
  }
  if (e.key === "Escape") {
    closeDrawers();
    $$("dialog[open]").forEach((d) => d.close?.());
  }
});

$("[data-back]")?.addEventListener("click", () => closeDrawers());

/* Filter/sort cards */
function filterCards() {
  const active = $$("[data-action='tag'].is-on").map((b) => b.dataset.tag).filter(Boolean);
  const cards = $$(".card");
  cards.forEach((c) => {
    const tags = (c.dataset.tags ?? "").split(/\s+/).filter(Boolean);
    const ok = active.length === 0 ? true : active.every((t) => tags.includes(t));
    c.style.display = ok ? "" : "none";
  });
  toast("Filter", active.length ? active.join(", ") : "off");
}

function sortCards(mode) {
  const g = $("[data-grid]");
  if (!g) return;
  const cards = $$(".card", g).filter((c) => c.style.display !== "none");
  if (mode === "featured") return;
  const key = (c) => {
    const price = Number(c.dataset.price ?? "0");
    const rating = Number(c.dataset.rating ?? "0");
    if (mode === "priceAsc") return price;
    if (mode === "priceDesc") return -price;
    if (mode === "rating") return -rating;
    return 0;
  };
  [...cards].sort((a, b) => key(a) - key(b)).forEach((c) => g.appendChild(c));
  toast("Sort", mode);
}

/* Mix shuffle */
function shuffleMix() {
  const box = $("[data-mix-preview]");
  if (!box) return;
  const tiles = $$(".tile", box);
  [...tiles]
    .sort(() => Math.random() - 0.5)
    .forEach((t) => box.appendChild(t));
  toast("Mix", "shuffled");
}

/* Range inputs */
$$("input[type='range'][data-action]").forEach((r) => {
  r.addEventListener("input", () => {
    const loud = Number($("input[data-action='loud']")?.value ?? "74");
    const glitch = Number($("input[data-action='glitch']")?.value ?? "38");
    setMixFx({ loud, glitch });
  });
});

/* Join */
document.querySelector("form[data-action='join']")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const fd = new FormData(e.currentTarget);
  const email = String(fd.get("email") ?? "").trim();
  if (!email) return;
  toast("Joined", email);
  e.currentTarget.reset();
});
