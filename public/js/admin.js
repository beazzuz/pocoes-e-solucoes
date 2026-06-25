const state = { potions: [], query: "", pendingDelete: null };

const elements = {
  form: document.querySelector("#potion-form"),
  list: document.querySelector("#admin-list"),
  loading: document.querySelector("#admin-loading"),
  empty: document.querySelector("#admin-empty"),
  search: document.querySelector("#admin-search"),
  imageInput: document.querySelector("#image"),
  previewImg: document.querySelector("#preview-img"),
  previewPlaceholder: document.querySelector("#preview-placeholder"),
  description: document.querySelector("#description"),
  descriptionCount: document.querySelector("#description-count"),
  submit: document.querySelector("#submit-button"),
  deleteDialog: document.querySelector("#delete-dialog"),
  deleteMessage: document.querySelector("#delete-message"),
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

function renderStats() {
  const prices = state.potions.map((potion) => Number(potion.price));
  const average = prices.length ? prices.reduce((sum, price) => sum + price, 0) / prices.length : 0;
  const highest = prices.length ? Math.max(...prices) : 0;
  document.querySelector("#stat-count").textContent = state.potions.length;
  document.querySelector("#stat-average").textContent = formatCoins(average);
  document.querySelector("#stat-highest").textContent = formatCoins(highest);
}

function visiblePotions() {
  const query = state.query.toLocaleLowerCase("pt-BR");
  return state.potions.filter((potion) =>
    `${potion.name} ${potion.description}`.toLocaleLowerCase("pt-BR").includes(query),
  );
}

function renderList() {
  const potions = visiblePotions();
  elements.empty.hidden = potions.length > 0;
  elements.list.innerHTML = potions
    .map(
      (potion) => `
      <article class="admin-item" data-id="${potion.id}">
        <img class="remote-potion-image" src="${escapeHtml(safeImage(potion.image))}" alt="" loading="lazy" />
        <div class="admin-item-content">
          <div><span>Fórmula nº ${String(potion.id).padStart(3, "0")}</span><strong>${formatCoins(potion.price)}</strong></div>
          <h3>${escapeHtml(potion.name)}</h3>
          <p>${escapeHtml(potion.description)}</p>
        </div>
        <button class="delete-button" type="button" data-delete="${potion.id}" aria-label="Remover ${escapeHtml(potion.name)}">
          <span aria-hidden="true">×</span><span>Remover</span>
        </button>
      </article>`,
    )
    .join("");
  renderStats();
}

async function loadPotions() {
  try {
    const response = await fetch("/api/potions");
    if (!response.ok) throw new Error("Falha ao consultar o catálogo.");
    state.potions = await response.json();
    renderList();
  } catch (error) {
    elements.list.innerHTML = `<div class="error-card"><h3>Não foi possível carregar o catálogo.</h3><p>${escapeHtml(error.message)}</p></div>`;
  } finally {
    // O atributo hidden interrompe o shimmer assim que a requisição termina.
    elements.loading.hidden = true;
  }
}

function setLoading(isLoading) {
  elements.submit.disabled = isLoading;
  elements.submit.querySelector(".button-label").hidden = isLoading;
  elements.submit.querySelector(".button-loader").hidden = !isLoading;
}

function clearErrors() {
  document.querySelectorAll(".field-error").forEach((element) => (element.textContent = ""));
  document.querySelectorAll(".invalid").forEach((element) => element.classList.remove("invalid"));
}

function setError(field, message) {
  const input = document.querySelector(`#${field}`);
  const error = document.querySelector(`[data-error-for="${field}"]`);
  input?.classList.add("invalid");
  if (error) error.textContent = message;
}

function validateForm(formData) {
  clearErrors();
  let valid = true;

  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const price = Number(formData.get("price"));
  const image = formData.get("image");

  if (name.length < 2) {
    setError("name", "Informe um nome com pelo menos 2 caracteres.");
    valid = false;
  }
  if (description.length < 10) {
    setError("description", "Use pelo menos 10 caracteres.");
    valid = false;
  }
  if (!(image instanceof File) || image.size === 0) {
    setError("image", "Selecione uma imagem.");
    valid = false;
  } else {
    const acceptedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!acceptedTypes.includes(image.type)) {
      setError("image", "Use uma imagem JPG, PNG ou WEBP.");
      valid = false;
    } else if (image.size > 5 * 1024 * 1024) {
      setError("image", "A imagem deve ter no máximo 5 MB.");
      valid = false;
    }
  }
  if (!Number.isFinite(price) || price <= 0) {
    setError("price", "Informe um valor maior que zero.");
    valid = false;
  }
  return valid;
}

async function createPotion(event) {
  event.preventDefault();
  const formData = new FormData(elements.form);
  if (!validateForm(formData)) return;

  setLoading(true);
  try {
    const response = await fetch("/api/potions", {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.details?.join(" ") || data.error || "Cadastro não realizado.");
    state.potions.unshift(data);
    elements.form.reset();
    elements.descriptionCount.textContent = "0/600";
    resetPreview();
    renderList();
    showToast(`${data.name} foi cadastrada com sucesso.`);
    document.querySelector("#name").focus();
  } catch (error) {
    showToast(error.message, true);
  } finally {
    setLoading(false);
  }
}

function requestDelete(id) {
  const potion = state.potions.find((item) => item.id === Number(id));
  if (!potion) return;
  state.pendingDelete = potion;
  elements.deleteMessage.textContent = `“${potion.name}” será removida do catálogo. Esta ação não pode ser desfeita.`;
  elements.deleteDialog.showModal();
}

async function deletePotion() {
  if (!state.pendingDelete) return;
  const button = document.querySelector("#confirm-delete");
  button.disabled = true;
  try {
    const response = await fetch(`/api/potions/${state.pendingDelete.id}`, { method: "DELETE" });
    if (!response.ok) throw new Error("Não foi possível remover a poção.");
    const removedName = state.pendingDelete.name;
    state.potions = state.potions.filter((item) => item.id !== state.pendingDelete.id);
    state.pendingDelete = null;
    elements.deleteDialog.close();
    renderList();
    showToast(`${removedName} foi removida.`);
  } catch (error) {
    showToast(error.message, true);
  } finally {
    button.disabled = false;
  }
}

function resetPreview() {
  elements.previewImg.hidden = true;
  elements.previewImg.removeAttribute("src");
  elements.previewPlaceholder.hidden = false;
}

function updatePreview() {
  const file = elements.imageInput.files?.[0];
  if (!file) return resetPreview();

  if (!file.type.startsWith("image/")) {
    resetPreview();
    setError("image", "Selecione um arquivo de imagem.");
    return;
  }

  const temporaryUrl = URL.createObjectURL(file);
  elements.previewImg.onload = () => URL.revokeObjectURL(temporaryUrl);
  elements.previewImg.src = temporaryUrl;
  elements.previewImg.hidden = false;
  elements.previewPlaceholder.hidden = true;
}

function showToast(message, isError = false) {
  const toast = document.createElement("div");
  toast.className = `toast${isError ? " toast-error" : ""}`;
  toast.textContent = message;
  elements.toastRegion.append(toast);
  setTimeout(() => toast.remove(), 3800);
}

elements.form.addEventListener("submit", createPotion);
elements.search.addEventListener("input", (event) => {
  state.query = event.target.value;
  renderList();
});
elements.description.addEventListener("input", () => {
  elements.descriptionCount.textContent = `${elements.description.value.length}/600`;
});
elements.imageInput.addEventListener("change", updatePreview);
elements.previewImg.addEventListener("error", () => {
  resetPreview();
  setError("image", "Não foi possível carregar esta imagem.");
});
elements.list.addEventListener("click", (event) => {
  const button = event.target.closest("[data-delete]");
  if (button) requestDelete(button.dataset.delete);
});
document.querySelector("#cancel-delete").addEventListener("click", () => {
  state.pendingDelete = null;
  elements.deleteDialog.close();
});
document.querySelector("#confirm-delete").addEventListener("click", deletePotion);

loadPotions();
