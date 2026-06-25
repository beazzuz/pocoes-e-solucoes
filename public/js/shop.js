const state = {
  potions: [],
  query: "",
  sort: "recent",
  cart: JSON.parse(localStorage.getItem("potion-cart") || "[]"),
};

const elements = {
  grid: document.querySelector("#product-grid"),
  loading: document.querySelector("#loading-state"),
  empty: document.querySelector("#empty-state"),
  resultCount: document.querySelector("#result-count"),
  search: document.querySelector("#search-input"),
  sort: document.querySelector("#sort-select"),
  clearSearch: document.querySelector("#clear-search"),
  cartDrawer: document.querySelector("#cart-drawer"),
  cartItems: document.querySelector("#cart-items"),
  cartCount: document.querySelector("#cart-count"),
  cartTotal: document.querySelector("#cart-total"),
  overlay: document.querySelector("#overlay"),
  productDialog: document.querySelector("#product-dialog"),
  dialogContent: document.querySelector("#dialog-content"),
  toastRegion: document.querySelector("#toast-region"),
};

function formatCoins(value) {
  return `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(Number(value))} moedas`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

const FALLBACK_IMAGE = "https://placehold.co/900x900/17131f/c9b7ff?text=Po%C3%A7%C3%A3o";

function safeImage(url) {
  const value = String(url || "").trim();
  return /^(https?:\/\/|\/uploads\/)/i.test(value) ? value : FALLBACK_IMAGE;
}


document.addEventListener(
  "error",
  (event) => {
    const image = event.target;
    if (!(image instanceof HTMLImageElement) || !image.classList.contains("remote-potion-image")) return;
    if (image.src === FALLBACK_IMAGE) return;
    image.src = FALLBACK_IMAGE;
  },
  true,
);

function visiblePotions() {
  const query = state.query.trim().toLocaleLowerCase("pt-BR");
  const filtered = state.potions.filter((potion) =>
    `${potion.name} ${potion.description}`.toLocaleLowerCase("pt-BR").includes(query),
  );

  return filtered.sort((a, b) => {
    if (state.sort === "name") return a.name.localeCompare(b.name, "pt-BR");
    if (state.sort === "price-asc") return Number(a.price) - Number(b.price);
    if (state.sort === "price-desc") return Number(b.price) - Number(a.price);
    return b.id - a.id;
  });
}

function productCard(potion) {
  return `
    <article class="product-card reveal visible" data-id="${potion.id}">
      <button class="product-image" type="button" data-action="details" aria-label="Ver detalhes de ${escapeHtml(potion.name)}">
        <img class="remote-potion-image" src="${escapeHtml(safeImage(potion.image))}" alt="${escapeHtml(potion.name)}" loading="lazy" />
        <span>Ver detalhes</span>
      </button>
      <div class="product-content">
        <div class="product-topline"><span>Fórmula nº ${String(potion.id).padStart(3, "0")}</span><span>Em estoque</span></div>
        <h3>${escapeHtml(potion.name)}</h3>
        <p>${escapeHtml(potion.description)}</p>
        <div class="product-footer">
          <strong>${formatCoins(potion.price)}</strong>
          <button class="button button-primary button-buy" type="button" data-action="buy">Comprar</button>
        </div>
      </div>
    </article>`;
}

function renderCatalog() {
  const potions = visiblePotions();
  elements.grid.innerHTML = potions.map(productCard).join("");
  elements.empty.hidden = potions.length > 0;
  elements.resultCount.textContent = `${potions.length} ${potions.length === 1 ? "poção encontrada" : "poções encontradas"}`;
}

async function loadPotions() {
  try {
    const response = await fetch("/api/potions");
    if (!response.ok) throw new Error("Não foi possível carregar as poções.");
    state.potions = await response.json();
    renderCatalog();
  } catch (error) {
    elements.grid.innerHTML = `<div class="error-card"><h3>O catálogo tirou uma pausa.</h3><p>${escapeHtml(error.message)}</p><button class="button button-ghost" onclick="location.reload()">Tentar novamente</button></div>`;
    elements.resultCount.textContent = "Catálogo indisponível";
  } finally {
    elements.loading.hidden = true;
  }
}

function openProductDialog(potion) {
  elements.dialogContent.innerHTML = `
    <div class="dialog-product">
      <div class="dialog-image"><img class="remote-potion-image" src="${escapeHtml(safeImage(potion.image))}" alt="${escapeHtml(potion.name)}" /></div>
      <div>
        <p class="eyebrow">Fórmula nº ${String(potion.id).padStart(3, "0")}</p>
        <h2>${escapeHtml(potion.name)}</h2>
        <p>${escapeHtml(potion.description)}</p>
        <div class="dialog-price"><span>Preço</span><strong>${formatCoins(potion.price)}</strong></div>
        <button class="button button-primary" type="button" data-dialog-buy="${potion.id}">Adicionar à sacola</button>
      </div>
    </div>`;
  elements.productDialog.showModal();
}

function saveCart() {
  localStorage.setItem("potion-cart", JSON.stringify(state.cart));
  renderCart();
}

function addToCart(id) {
  const potion = state.potions.find((item) => item.id === Number(id));
  if (!potion) return;
  const existing = state.cart.find((item) => item.id === potion.id);
  if (existing) existing.quantity += 1;
  else state.cart.push({ id: potion.id, name: potion.name, price: Number(potion.price), image: potion.image, quantity: 1 });
  saveCart();
  showToast(`${potion.name} foi adicionada à sacola.`);
}

function removeFromCart(id) {
  state.cart = state.cart.filter((item) => item.id !== Number(id));
  saveCart();
}

function changeQuantity(id, change) {
  const item = state.cart.find((entry) => entry.id === Number(id));
  if (!item) return;
  item.quantity += change;
  if (item.quantity <= 0) removeFromCart(id);
  else saveCart();
}

function renderCart() {
  const itemCount = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  elements.cartCount.textContent = itemCount;
  elements.cartTotal.textContent = formatCoins(total);

  if (!state.cart.length) {
    elements.cartItems.innerHTML = `<div class="cart-empty"><span>✦</span><h3>Sua sacola está vazia</h3><p>Escolha uma fórmula no catálogo para começar.</p></div>`;
    return;
  }

  elements.cartItems.innerHTML = state.cart
    .map(
      (item) => `
      <article class="cart-item">
        <img class="remote-potion-image" src="${escapeHtml(safeImage(item.image))}" alt="" />
        <div><h3>${escapeHtml(item.name)}</h3><strong>${formatCoins(item.price)}</strong>
          <div class="quantity-control" aria-label="Quantidade de ${escapeHtml(item.name)}">
            <button type="button" data-cart-action="decrease" data-id="${item.id}" aria-label="Diminuir quantidade">−</button>
            <span>${item.quantity}</span>
            <button type="button" data-cart-action="increase" data-id="${item.id}" aria-label="Aumentar quantidade">+</button>
          </div>
        </div>
        <button class="remove-cart" type="button" data-cart-action="remove" data-id="${item.id}" aria-label="Remover ${escapeHtml(item.name)}">×</button>
      </article>`,
    )
    .join("");
}

function openCart() {
  elements.cartDrawer.classList.add("open");
  elements.cartDrawer.setAttribute("aria-hidden", "false");
  elements.overlay.hidden = false;
  requestAnimationFrame(() => elements.overlay.classList.add("visible"));
  document.body.classList.add("no-scroll");
}

function closeCart() {
  elements.cartDrawer.classList.remove("open");
  elements.cartDrawer.setAttribute("aria-hidden", "true");
  elements.overlay.classList.remove("visible");
  setTimeout(() => (elements.overlay.hidden = true), 250);
  document.body.classList.remove("no-scroll");
}

function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  elements.toastRegion.append(toast);
  setTimeout(() => toast.remove(), 3600);
}

function setupReveal() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 },
  );
  document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));
}

elements.search.addEventListener("input", (event) => {
  state.query = event.target.value;
  renderCatalog();
});

elements.sort.addEventListener("change", (event) => {
  state.sort = event.target.value;
  renderCatalog();
});

elements.clearSearch.addEventListener("click", () => {
  state.query = "";
  elements.search.value = "";
  renderCatalog();
  elements.search.focus();
});

elements.grid.addEventListener("click", (event) => {
  const card = event.target.closest("[data-id]");
  const action = event.target.closest("[data-action]")?.dataset.action;
  if (!card || !action) return;
  const potion = state.potions.find((item) => item.id === Number(card.dataset.id));
  if (action === "details") openProductDialog(potion);
  if (action === "buy") addToCart(card.dataset.id);
});

elements.productDialog.addEventListener("click", (event) => {
  if (event.target.classList.contains("dialog-close")) elements.productDialog.close();
  const buyButton = event.target.closest("[data-dialog-buy]");
  if (buyButton) {
    addToCart(buyButton.dataset.dialogBuy);
    elements.productDialog.close();
    openCart();
  }
});

document.querySelector(".cart-button").addEventListener("click", openCart);
document.querySelector("#close-cart").addEventListener("click", closeCart);
elements.overlay.addEventListener("click", closeCart);

elements.cartItems.addEventListener("click", (event) => {
  const button = event.target.closest("[data-cart-action]");
  if (!button) return;
  const { cartAction, id } = button.dataset;
  if (cartAction === "increase") changeQuantity(id, 1);
  if (cartAction === "decrease") changeQuantity(id, -1);
  if (cartAction === "remove") removeFromCart(id);
});

document.querySelector("#checkout-button").addEventListener("click", () => {
  if (!state.cart.length) return showToast("Sua sacola ainda está vazia.");
  showToast("Demonstração concluída — nenhuma compra foi processada.");
});

document.querySelector("#newsletter-form").addEventListener("submit", (event) => {
  event.preventDefault();
  showToast("Inscrição registrada para demonstração.");
  event.target.reset();
});

const menuButton = document.querySelector(".menu-button");
menuButton.addEventListener("click", () => {
  const isOpen = menuButton.getAttribute("aria-expanded") === "true";
  menuButton.setAttribute("aria-expanded", String(!isOpen));
  document.querySelector(".nav-links").classList.toggle("open", !isOpen);
});

document.querySelectorAll(".nav-links a").forEach((link) => {
  link.addEventListener("click", () => {
    menuButton.setAttribute("aria-expanded", "false");
    document.querySelector(".nav-links").classList.remove("open");
  });
});

document.querySelector("#year").textContent = new Date().getFullYear();
renderCart();
setupReveal();
loadPotions();
