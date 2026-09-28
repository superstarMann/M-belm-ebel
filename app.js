const CATEGORY_META = {
  Sofa: { icon: "🛋️", colors: ["#e8e8fa", "#f7f7fc"] },
  Bett: { icon: "🛏️", colors: ["#e3eff8", "#f5f9fc"] },
  Schrank: { icon: "🚪", colors: ["#f2e9dd", "#fbf7f1"] },
  Esstisch: { icon: "🍽️", colors: ["#f7ead9", "#fcf7f0"] },
  Schreibtisch: { icon: "🖥️", colors: ["#dff1ee", "#f3faf9"] },
  Stuhl: { icon: "🪑", colors: ["#e5f2ea", "#f5faf7"] },
  Regal: { icon: "📚", colors: ["#eee6f4", "#faf7fc"] }
};

const RETAILER_META = {
  IKEA: {
    slug: "ikea",
    domain: "ikea.com/de/de",
    url: "https://www.ikea.com/de/de/",
    categoryURLs: { Sofa: "https://www.ikea.com/de/de/cat/sofas-fu003/" }
  },
  XXXLutz: {
    slug: "xxxlutz",
    domain: "xxxlutz.de",
    url: "https://www.xxxlutz.de/",
    categoryURLs: { Sofa: "https://www.xxxlutz.de/sofas-couches-C1C1" }
  },
  OTTO: {
    slug: "otto",
    domain: "otto.de/moebel",
    url: "https://www.otto.de/moebel/",
    categoryURLs: { Sofa: "https://www.otto.de/moebel/sofas/?view=productList" }
  },
  Home24: {
    slug: "home24",
    domain: "home24.de",
    url: "https://www.home24.de/moebel-sortiment/",
    categoryURLs: { Sofa: "https://www.home24.de/einzelsofas/" }
  }
};

const PRICING = {
  base: 89,
  additionalRetailer: 18,
  additionalItem: 8,
  floorWithoutElevator: 12,
  saturday: 19
};

const app = document.querySelector("#app");
const filterDialog = document.querySelector("#filter-dialog");
const toast = document.querySelector("#toast");

const store = {
  products: [],
  cart: loadArray("moebelplan-cart"),
  quantities: loadObject("moebelplan-quantities", {}),
  compare: loadArray("moebelplan-compare").slice(0, 3),
  filters: {
    query: "",
    category: "",
    retailers: [],
    onlySammel: false,
    maxTotal: 1500,
    sort: "recommended",
    moveMode: false
  },
  quote: loadObject("moebelplan-quote", {
    postalCode: "10115",
    floor: 1,
    elevator: true,
    date: nextSaturday()
  }),
  quoteSubmitted: localStorage.getItem("moebelplan-quote-submitted") === "true",
  compareExpanded: false
};

init();

async function init() {
  try {
    const response = await fetch("/data/products.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    store.products = await response.json();
    sanitizeStoredIDs();
    bindGlobalEvents();
    if (!location.hash) history.replaceState(null, "", "#home");
    render();

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/service-worker.js").catch(() => {});
    }
  } catch (error) {
    app.innerHTML = `
      <section class="page narrow">
        <div class="empty-state">
          <div><span>⚠️</span><h2>Produkte konnten nicht geladen werden</h2>
          <p>Bitte starte das Projekt über <strong>npm start</strong> und öffne die angezeigte lokale Adresse.</p></div>
        </div>
      </section>`;
    console.error(error);
  }
}

function bindGlobalEvents() {
  window.addEventListener("hashchange", render);

  document.addEventListener("click", (event) => {
    const nav = event.target.closest("[data-nav]");
    if (nav) {
      navigate(nav.dataset.nav);
      return;
    }

    const target = event.target.closest("[data-action]");
    if (!target) return;
    const { action, id, category } = target.dataset;

    if (action === "category") {
      resetFilters();
      store.filters.category = category;
      navigate("search");
    }

    if (action === "move-search") {
      resetFilters();
      store.filters.moveMode = true;
      store.filters.onlySammel = true;
      navigate("search");
    }

    if (action === "product") navigate("product", id);
    if (action === "back-results") navigate("search");
    if (action === "open-filter") openFilter();
    if (action === "close-filter") filterDialog.close();

    if (action === "toggle-compare") toggleCompare(id);
    if (action === "add-cart") addCart(id);
    if (action === "remove-cart") removeCart(id);
    if (action === "decrease-quantity") changeQuantity(id, -1);
    if (action === "increase-quantity") changeQuantity(id, 1);

    if (action === "quote") navigate("quote");
    if (action === "toggle-compare-details") {
      store.compareExpanded = !store.compareExpanded;
      render();
    }
  });
}

function render() {
  const route = parseRoute();
  updateNavigation(route.view);

  if (route.view === "home") renderHome();
  else if (route.view === "search") renderResults();
  else if (route.view === "product") renderProduct(route.id);
  else if (route.view === "compare") renderCompare();
  else if (route.view === "cart") renderCart();
  else if (route.view === "quote") renderQuote();
  else if (route.view === "tracking") renderTracking();
  else navigate("home");

  bindPageForms(route.view);
  document.title = pageTitle(route.view);
  window.scrollTo({ top: 0, behavior: "auto" });
}

function renderHome() {
  app.innerHTML = `
    <section class="page">
      <div class="hero">
        <div class="hero-copy">
          <p class="eyebrow">Dein Umzug. Einfach geplant.</p>
          <h1>Mehrere Shops.<br><span class="accent-text">Eine Lieferung.</span></h1>
          <p class="lead">Vergleiche offizielle Händlerpreise und sieh sofort, ob der Gesamtpreis inklusive Versand bereits feststeht.</p>
          <form class="search-box" id="hero-search-form">
            <input id="hero-search" type="search" placeholder="Was suchst du?" autocomplete="off" aria-label="Möbel suchen" />
            <button class="primary-button" type="submit">Suchen</button>
          </form>
        </div>
        <div class="hero-visual" aria-label="Illustration einer Sammellieferung">
          <span class="hero-chip shop">IKEA + OTTO + Home24</span>
          <span class="hero-symbol" aria-hidden="true">🛋️</span>
          <span class="hero-chip total">Gesamt mit Lieferung ✓</span>
        </div>
      </div>

      <section class="section">
        <div class="section-head">
          <div><p class="eyebrow">Schnell einsteigen</p><h2>Kategorien</h2></div>
          <p>28 geprüfte Produkt-Direktlinks · Datenstand 28.09.2026</p>
        </div>
        <div class="category-grid">
          ${Object.entries(CATEGORY_META).map(([category, meta]) => `
            <button class="category-card" type="button" data-action="category" data-category="${category}">
              <span class="category-icon" aria-hidden="true">${meta.icon}</span>
              <span class="category-name">${category}</span>
            </button>`).join("")}
        </div>
      </section>

      <section class="section">
        <button class="move-card" type="button" data-action="move-search">
          <span class="move-icon" aria-hidden="true">🏠</span>
          <span><strong>Neue Wohnung</strong><small>Preisbewusste Starter-Auswahl für deinen Umzug</small></span>
          <span aria-hidden="true">→</span>
        </button>
      </section>

      <section class="section">
        <div class="section-head">
          <div><p class="eyebrow">Händler-Transparenz</p><h2>Du siehst immer, wer verkauft.</h2></div>
          <p>Der Händler ist Kerninformation, kein Kleingedrucktes.</p>
        </div>
        <div class="retailer-strip">
          ${["IKEA", "XXXLutz", "OTTO", "Home24"].map((retailer) => `<div class="retailer-strip-item"><span>Händler</span>${retailerWordmark(retailer)}</div>`).join("")}
        </div>
      </section>
    </section>`;
}

function renderResults() {
  const products = filteredProducts();
  const title = store.filters.moveMode ? "Neue Wohnung" : store.filters.category || "Alle Möbel";
  const pills = activeFilterPills();

  app.innerHTML = `
    <section class="page">
      <div class="results-head">
        <div><p class="eyebrow">Transparent vergleichen</p><h2>${escapeHTML(title)}</h2><p id="results-count">${products.length} Angebote · Händlerdaten vom 28.09.2026</p></div>
      </div>
      <div class="toolbar-row">
        <form class="toolbar-search" id="results-search-form">
          <span aria-hidden="true">⌕</span>
          <input id="results-search" type="search" value="${escapeAttribute(store.filters.query)}" placeholder="Möbel durchsuchen" aria-label="Möbel durchsuchen" />
        </form>
        <button class="secondary-button" type="button" data-action="open-filter">☷ Filter${pills.length ? ` · ${pills.length}` : ""}</button>
      </div>
      ${pills.length ? `<div class="filter-summary">${pills.map((pill) => `<span class="filter-pill">${escapeHTML(pill)}</span>`).join("")}</div>` : ""}
      <div class="source-notice">
        <span class="source-notice-icon" aria-hidden="true">↗</span>
        <div><strong>Offizielle Daten, klar getrennt</strong><p>Artikelpreis, Händler-Versand und unsere MVP-Sammellieferung werden nicht vermischt. Jede Karte führt direkt zum Produkt.</p></div>
      </div>
      <div id="results-content">${products.length
        ? `<div class="product-grid">${products.map(productCard).join("")}</div>`
        : emptyState("Keine Treffer", "Passe Suche oder Filter an.", "⌕")}</div>
    </section>`;
}

function renderProduct(id) {
  const product = productByID(id);
  if (!product) {
    navigate("search");
    return;
  }
  const inCart = store.cart.includes(product.id);
  const inCompare = store.compare.includes(product.id);

  app.innerHTML = `
    <section class="page">
      <button class="ghost-button" type="button" data-action="back-results">← Zurück zu den Ergebnissen</button>
      <div class="detail-layout">
        ${retailerLinkPanel(product, "detail")}
        <div class="detail-copy">
          ${retailerHeading(product.retailerName)}
          <h1>${escapeHTML(product.title)}</h1>
          ${productMetaLine(product)}
          ${availabilityStatus(product)}
          <div class="price-panel">
            <div class="minor-price">Händlerpreis<br><strong>${euro(product.price)}</strong>${product.priceNote ? `<br><small>${escapeHTML(product.priceNote)}</small>` : ""}<br>Versand: ${escapeHTML(shippingText(product))}</div>
            ${totalPriceBlock(product)}
          </div>
          ${sammelStatus(product)}
          <div class="detail-actions">
            <button class="primary-button" type="button" data-action="add-cart" data-id="${product.id}" ${inCart || isUnavailable(product) ? "disabled" : ""}>${isUnavailable(product) ? "Derzeit ausverkauft" : inCart ? "✓ Im Warenkorb" : "+ In den Warenkorb"}</button>
            <button class="secondary-button" type="button" data-action="toggle-compare" data-id="${product.id}">${inCompare ? "✓ Verglichen" : "Vergleichen"}</button>
          </div>
          <div class="info-panel">
            <h3>Kerndaten</h3>
            ${specRow("Maße", dimensions(product))}
            ${specRow("Material", product.material)}
            ${specRow("Farbe", product.color)}
            <details>
              <summary>Alle Details anzeigen</summary>
              ${specRow("Kategorie", product.category)}
              ${specRow("Händler", product.retailerName)}
              ${specRow("Lieferzeit", product.deliveryLabel)}
              ${specRow("Verfügbarkeit", product.availabilityLabel)}
              ${specRow("Datenstand", formatVerifiedDate(product.verifiedAt))}
              ${specRow("Liefermodell", product.sammelLieferungAvailable ? "Sammel- oder Einzelversand" : "Nur Einzelversand")}
              ${specRow("Hinweis", "Preise und Verfügbarkeit können sich ändern; vor dem Kauf auf der verlinkten Händlerseite prüfen")}
            </details>
          </div>
        </div>
      </div>
    </section>`;
}

function renderCompare() {
  const products = store.compare.map(productByID).filter(Boolean);
  if (!products.length) {
    app.innerHTML = `<section class="page">${pageHeading("Vergleich", "Bis zu drei Produkte nebeneinander vergleichen.")}${emptyState("Noch kein Vergleich", "Füge Produkte aus den Suchergebnissen hinzu.", "▣")}</section>`;
    return;
  }

  const columnHeaders = products.map((product) => `
    <th>
      <div class="compare-product">
        <a class="compare-shop-link" href="${escapeAttribute(retailerURL(product))}" target="_blank" rel="noopener noreferrer" aria-label="Produktseite für ${escapeAttribute(product.title)} bei ${escapeAttribute(product.retailerName)} öffnen">
          ${retailerWordmark(product.retailerName, true)}
          <span>${escapeHTML(retailerMeta(product.retailerName).domain)} ↗</span>
        </a>
        <strong>${escapeHTML(product.title)}</strong>
        <button class="ghost-button danger-button" type="button" data-action="toggle-compare" data-id="${product.id}">Entfernen</button>
      </div>
    </th>`).join("");

  app.innerHTML = `
    <section class="page">
      ${pageHeading("Vergleich", "Offizieller Artikelpreis und Händler-Versand bleiben klar getrennt.")}
      <div class="comparison-scroll">
        <table class="comparison-table">
          <thead><tr><th>Produkt</th>${columnHeaders}</tr></thead>
          <tbody>
            ${compareRow("Händlerpreis", products, (p) => euro(p.price))}
            ${compareRow("Händler-Versand", products, shippingText)}
            ${compareRow("Gesamt mit Händler-Versand", products, totalText, "total-row")}
            ${compareRow("Maße", products, dimensions)}
            ${compareRow("Material", products, (p) => p.material)}
            ${compareRow("Farbe", products, (p) => p.color)}
            ${compareRow("Sammellieferung", products, (p) => p.sammelLieferungAvailable ? "Ja" : "Nein")}
            ${store.compareExpanded ? compareRow("Lieferzeit", products, (p) => p.deliveryLabel) : ""}
            ${store.compareExpanded ? compareRow("Verfügbarkeit", products, (p) => p.availabilityLabel) : ""}
            ${store.compareExpanded ? compareRow("Bewertung", products, (p) => p.rating?.toFixed(1) ?? "–") : ""}
            ${store.compareExpanded ? compareRow("Kategorie", products, (p) => p.category) : ""}
            ${store.compareExpanded ? compareRow("Datenstand", products, (p) => formatVerifiedDate(p.verifiedAt)) : ""}
          </tbody>
        </table>
      </div>
      <button class="secondary-button" style="margin-top:16px" type="button" data-action="toggle-compare-details">${store.compareExpanded ? "Weniger Details" : "Alle Details anzeigen"}</button>
    </section>`;
}

function renderCart() {
  const products = cartProducts();
  if (!products.length) {
    app.innerHTML = `<section class="page">${pageHeading("Universal Warenkorb", "Produkte verschiedener Händler gemeinsam planen.")}${emptyState("Dein Warenkorb ist leer", "Füge Produkte aus mehreren Shops hinzu.", "□")}</section>`;
    return;
  }
  const quote = calculateQuote(products, store.quote);
  const itemCount = cartItemCount(products);

  app.innerHTML = `
    <section class="page">
      ${pageHeading("Universal Warenkorb", `${new Set(products.map((p) => p.retailerName)).size} Händler · ${itemCount} Artikel`)}
      <div class="cart-layout">
        <div>
          <div class="value-banner"><span aria-hidden="true">🚚</span><div><strong>Eine Lieferung statt vieler</strong><p>Wir zeigen transparent, welche Artikel gebündelt werden können.</p></div></div>
          <div class="cart-list">
            ${products.map((product) => {
              const quantity = quantityFor(product);
              return `<article class="cart-item">
                <a class="cart-shop-link" href="${escapeAttribute(retailerURL(product))}" target="_blank" rel="noopener noreferrer" aria-label="Produktseite für ${escapeAttribute(product.title)} bei ${escapeAttribute(product.retailerName)} öffnen">
                  ${retailerWordmark(product.retailerName, true)}
                  <span>Shop ↗</span>
                </a>
                <div class="cart-item-copy">
                  <div class="retailer-label">Händler: ${escapeHTML(product.retailerName)}</div>
                  <h3>${escapeHTML(product.title)}</h3>
                  ${availabilityStatus(product)}
                  ${sammelStatus(product)}
                  <span class="unit-price">${euro(product.price)} pro Stück · Händler-Versand: ${escapeHTML(shippingText(product))}</span>
                </div>
                <button class="icon-button danger-button" type="button" data-action="remove-cart" data-id="${product.id}" aria-label="${escapeAttribute(product.title)} entfernen">×</button>
                <div class="cart-item-bottom">
                  <div class="quantity-stepper" role="group" aria-label="Menge für ${escapeAttribute(product.title)}">
                    <button type="button" data-action="decrease-quantity" data-id="${product.id}" aria-label="Menge von ${escapeAttribute(product.title)} verringern" ${quantity === 1 ? "disabled" : ""}>−</button>
                    <output aria-label="Menge">${quantity}</output>
                    <button type="button" data-action="increase-quantity" data-id="${product.id}" aria-label="Menge von ${escapeAttribute(product.title)} erhöhen" ${quantity === 99 ? "disabled" : ""}>+</button>
                  </div>
                  <div class="line-total"><span>Zwischensumme</span><strong>${euro(product.price * quantity)}</strong></div>
                </div>
              </article>`;
            }).join("")}
          </div>
        </div>
        <aside class="summary-card">
          <h3>Preisübersicht</h3>
          ${summaryRow(`Händler-Artikelwert (${itemCount})`, euro(quote.subtotal))}
          ${summaryRow("Händler-Versand einzeln", retailerShippingSummary(quote))}
          ${summaryRow("Unsere Sammellieferung · MVP", euro(quote.consolidatedShipping))}
          ${quote.savings === null ? `<div class="saving-row neutral"><span>Ersparnis</span><strong>Nach Händler-Versand</strong></div>` : quote.savings > 0 ? `<div class="saving-row"><span>✓ Du sparst</span><strong>${euro(quote.savings)}</strong></div>` : ""}
          <div class="grand-total"><span>${quote.grandTotalIsMinimum ? "Gesamtschätzung ab" : "Gesamtschätzung"}</span><strong>${euro(quote.grandTotal)}</strong></div>
          <p class="fine-print">Artikelpreise: Händlerdaten vom 28.09.2026. Sammellieferung: unverbindliche MVP-Kalkulation. Keine Bestellung oder Zahlung.</p>
          <button class="primary-button" type="button" data-action="quote">Lieferangebot konfigurieren</button>
        </aside>
      </div>
    </section>`;
}

function renderQuote() {
  const products = cartProducts();
  if (!products.length) {
    navigate("cart");
    return;
  }
  const quote = calculateQuote(products, store.quote);
  const itemCount = cartItemCount(products);

  app.innerHTML = `
    <section class="page narrow">
      ${pageHeading("Lieferangebot", "Lokale Richtpreisberechnung ohne Zahlung oder Buchung.")}
      <form class="form-card" id="quote-form">
        <div class="form-grid">
          <div class="field"><label for="postalCode">Postleitzahl</label><input id="postalCode" name="postalCode" inputmode="numeric" pattern="[0-9]{5}" maxlength="5" value="${escapeAttribute(store.quote.postalCode)}" required /></div>
          <div class="field"><label for="floor">Etage</label><select id="floor" name="floor">${Array.from({ length: 11 }, (_, value) => `<option value="${value}" ${Number(store.quote.floor) === value ? "selected" : ""}>${value}</option>`).join("")}</select></div>
          <label class="checkbox-field"><input name="elevator" type="checkbox" ${store.quote.elevator ? "checked" : ""} /> Aufzug vorhanden</label>
          <div class="field"><label for="date">Wunschdatum</label><input id="date" name="date" type="date" min="${todayISO()}" value="${escapeAttribute(store.quote.date)}" required /></div>
        </div>
        <div class="quote-total">
          <div><span class="field-label">Sammellieferung</span><p class="fine-print" style="margin-top:5px">${itemCount} Artikel · ${new Set(products.map((p) => p.retailerName)).size} Händler</p></div>
          <strong id="quote-delivery-price">${euro(quote.consolidatedShipping)}</strong>
        </div>
        <div class="summary-card" style="position:static;margin-top:16px">
          ${summaryRow(`Händler-Artikelwert (${itemCount})`, euro(quote.subtotal))}
          ${summaryRow("Händler-Versand einzeln", retailerShippingSummary(quote))}
          <div class="saving-row ${quote.savings === null ? "neutral" : ""}"><span>Voraussichtliche Ersparnis</span><strong id="quote-savings">${quote.savings === null ? "Nach Händler-Versand" : euro(quote.savings)}</strong></div>
          <div class="grand-total"><span id="quote-grand-label">${quote.grandTotalIsMinimum ? "Gesamtschätzung ab" : "Gesamtschätzung"}</span><strong id="quote-grand-total">${euro(quote.grandTotal)}</strong></div>
        </div>
        <button class="primary-button" style="width:100%;margin-top:18px" type="submit">Unverbindliche Anfrage erstellen</button>
      </form>
    </section>`;
}

function renderTracking() {
  const postcode = store.quoteSubmitted ? `Lieferung nach ${escapeHTML(store.quote.postalCode)}` : "Ein Beispiel für mehrere Händler";
  app.innerHTML = `
    <section class="page narrow">
      ${pageHeading("Lieferung", "Transparenter Status über alle Abholungen hinweg.")}
      <div class="tracking-card">
        <div class="tracking-hero">
          <div><p class="eyebrow">Sammellieferung</p><h2>${store.quoteSubmitted ? "Deine Lieferung ist geplant" : "So sieht Tracking später aus"}</h2><p>${postcode}</p></div>
          <span class="demo-tag">DEMO</span>
        </div>
        <div class="delivery-window"><small>Voraussichtliches Zeitfenster</small><strong>Samstag, 10:00–13:00</strong></div>
      </div>
      <div class="tracking-card" style="margin-top:16px">
        <h3>Status</h3>
        <p style="color:var(--muted)">Jeder Händler bleibt sichtbar.</p>
        <div class="timeline">
          ${timelineStep("IKEA abgeholt", "Heute, 08:35", "complete", "✓")}
          ${timelineStep("XXXLutz wird abgeholt", "Geplant für heute, 15:20", "active", "…")}
          ${timelineStep("Im Sammellager", "Alle Artikel werden geprüft und gebündelt", "upcoming", "•")}
          ${timelineStep("Lieferung", "Samstag, 10:00–13:00", "upcoming", "•")}
        </div>
      </div>
      <p class="fine-print">ⓘ MVP-Demo: keine echte Abholung, Bestellung oder Live-Ortung.</p>
    </section>`;
}

function bindPageForms(view) {
  if (view === "home") {
    document.querySelector("#hero-search-form")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const query = document.querySelector("#hero-search").value.trim();
      resetFilters();
      store.filters.query = query;
      navigate("search");
    });
  }

  if (view === "search") {
    document.querySelector("#results-search-form")?.addEventListener("submit", (event) => event.preventDefault());
    document.querySelector("#results-search")?.addEventListener("input", (event) => {
      store.filters.query = event.target.value;
      const products = filteredProducts();
      const content = document.querySelector("#results-content");
      const count = document.querySelector("#results-count");
      if (count) count.textContent = `${products.length} Angebote · Händlerdaten vom 28.09.2026`;
      if (content) {
        content.innerHTML = products.length
          ? `<div class="product-grid">${products.map(productCard).join("")}</div>`
          : emptyState("Keine Treffer", "Passe Suche oder Filter an.", "⌕");
      }
    });
  }

  if (view === "quote") {
    const form = document.querySelector("#quote-form");
    form?.addEventListener("input", updateQuoteFromForm);
    form?.addEventListener("change", updateQuoteFromForm);
    form?.addEventListener("submit", (event) => {
      event.preventDefault();
      updateQuoteFromForm(event);
      if (!form.reportValidity()) return;
      store.quoteSubmitted = true;
      localStorage.setItem("moebelplan-quote-submitted", "true");
      showToast("Demo-Anfrage erstellt – Tracking ist bereit.");
      navigate("tracking");
    });
  }
}

function updateQuoteFromForm() {
  const form = document.querySelector("#quote-form");
  if (!form) return;
  const data = new FormData(form);
  store.quote = {
    postalCode: String(data.get("postalCode") || "").replace(/\D/g, "").slice(0, 5),
    floor: Number(data.get("floor") || 0),
    elevator: data.get("elevator") === "on",
    date: String(data.get("date") || todayISO())
  };
  localStorage.setItem("moebelplan-quote", JSON.stringify(store.quote));
  const quote = calculateQuote(cartProducts(), store.quote);
  document.querySelector("#quote-delivery-price").textContent = euro(quote.consolidatedShipping);
  document.querySelector("#quote-savings").textContent = quote.savings === null ? "Nach Händler-Versand" : euro(quote.savings);
  document.querySelector("#quote-grand-label").textContent = quote.grandTotalIsMinimum ? "Gesamtschätzung ab" : "Gesamtschätzung";
  document.querySelector("#quote-grand-total").textContent = euro(quote.grandTotal);
}

function openFilter() {
  const retailers = ["IKEA", "XXXLutz", "OTTO", "Home24"];
  filterDialog.innerHTML = `
    <form class="sheet-body" id="filter-form">
      <div class="sheet-head"><h2 id="filter-title">Filter</h2><button class="icon-button" type="button" data-action="close-filter" aria-label="Filter schließen">×</button></div>
      <div class="filter-group">
        <h3>Sortierung</h3>
        <div class="field"><select name="sort">
          <option value="recommended" ${store.filters.sort === "recommended" ? "selected" : ""}>Empfohlen</option>
          <option value="total" ${store.filters.sort === "total" ? "selected" : ""}>Bekannter Gesamtpreis aufsteigend</option>
          <option value="fast" ${store.filters.sort === "fast" ? "selected" : ""}>Schnellste Lieferung</option>
        </select></div>
      </div>
      <div class="filter-group">
        <h3>Kategorie</h3>
        <div class="field"><select name="category"><option value="">Alle Kategorien</option>${Object.keys(CATEGORY_META).map((category) => `<option value="${category}" ${store.filters.category === category ? "selected" : ""}>${category}</option>`).join("")}</select></div>
      </div>
      <div class="filter-group">
        <h3>Händler</h3>
        <div class="choice-grid">${retailers.map((retailer) => `<label class="choice"><input type="checkbox" name="retailer" value="${retailer}" ${store.filters.retailers.includes(retailer) ? "checked" : ""} /> ${retailer}</label>`).join("")}</div>
      </div>
      <div class="filter-group">
        <div class="range-label"><strong>Artikelpreis + bekannter Versand</strong><span id="max-total-label">Bis ${euro(store.filters.maxTotal)}</span></div>
        <input name="maxTotal" type="range" min="100" max="1500" step="50" value="${store.filters.maxTotal}" />
      </div>
      <div class="filter-group"><label class="checkbox-field"><input type="checkbox" name="onlySammel" ${store.filters.onlySammel ? "checked" : ""} /> Nur Sammellieferung</label></div>
      <div class="sheet-actions"><button class="secondary-button" id="reset-filter" type="button">Zurücksetzen</button><button class="primary-button" type="submit">Ergebnisse anzeigen</button></div>
    </form>`;

  const form = filterDialog.querySelector("#filter-form");
  form.querySelector("[name=maxTotal]").addEventListener("input", (event) => {
    form.querySelector("#max-total-label").textContent = `Bis ${euro(Number(event.target.value))}`;
  });
  form.querySelector("#reset-filter").addEventListener("click", () => {
    resetFilters();
    filterDialog.close();
    render();
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    store.filters.sort = String(data.get("sort"));
    store.filters.category = String(data.get("category"));
    store.filters.retailers = data.getAll("retailer").map(String);
    store.filters.maxTotal = Number(data.get("maxTotal"));
    store.filters.onlySammel = data.get("onlySammel") === "on";
    store.filters.moveMode = false;
    filterDialog.close();
    render();
  });
  filterDialog.showModal();
}

function filteredProducts() {
  const query = store.filters.query.trim().toLocaleLowerCase("de");
  let result = store.products.filter((product) => {
    const text = `${product.title} ${product.category} ${product.material} ${product.color}`.toLocaleLowerCase("de");
    return (!query || text.includes(query))
      && (!store.filters.category || product.category === store.filters.category)
      && (!store.filters.retailers.length || store.filters.retailers.includes(product.retailerName))
      && (!store.filters.onlySammel || product.sammelLieferungAvailable)
      && planningTotal(product) <= store.filters.maxTotal
      && (!store.filters.moveMode || product.price <= 650);
  });

  if (store.filters.sort === "total") result.sort((a, b) => planningTotal(a) - planningTotal(b));
  else if (store.filters.sort === "fast") result.sort((a, b) => a.estimatedDeliveryDays - b.estimatedDeliveryDays);
  else result.sort((a, b) => Number(b.sammelLieferungAvailable) - Number(a.sammelLieferungAvailable) || (b.rating || 0) - (a.rating || 0));
  return result;
}

function productCard(product) {
  const inCart = store.cart.includes(product.id);
  const inCompare = store.compare.includes(product.id);
  const unavailable = isUnavailable(product);
  return `
    <article class="product-card">
      ${retailerHeading(product.retailerName)}
      ${retailerLinkPanel(product)}
      <button class="product-title-button" type="button" data-action="product" data-id="${product.id}">${escapeHTML(product.title)}</button>
      <div class="spec-line">${escapeHTML(product.material)} · ${escapeHTML(product.color)}<br>${dimensions(product)}</div>
      ${availabilityStatus(product)}
      ${sammelStatus(product)}
      <div class="price-row">
        <div class="minor-price">Händlerpreis <strong>${euro(product.price)}</strong><br>Versand ${escapeHTML(shippingText(product))}</div>
        ${totalPriceBlock(product)}
      </div>
      <div class="data-stamp">Händlerdaten · geprüft ${formatVerifiedDate(product.verifiedAt)}</div>
      <div class="card-actions">
        <button class="secondary-button" type="button" data-action="toggle-compare" data-id="${product.id}">${inCompare ? "✓ Verglichen" : "Vergleichen"}</button>
        <button class="primary-button" type="button" data-action="add-cart" data-id="${product.id}" ${inCart || unavailable ? "disabled" : ""}>${unavailable ? "Ausverkauft" : inCart ? "✓ Im Warenkorb" : "+ Warenkorb"}</button>
      </div>
    </article>`;
}

function retailerMeta(retailerName) {
  return RETAILER_META[retailerName] || {
    slug: "default",
    domain: retailerName,
    url: "#",
    categoryURLs: {}
  };
}

function retailerURL(product) {
  const meta = retailerMeta(product.retailerName);
  return product.productURL || meta.categoryURLs[product.category] || meta.url;
}

function retailerWordmark(retailerName, compact = false) {
  const meta = retailerMeta(retailerName);
  const compactClass = compact ? " retailer-wordmark--compact" : "";
  const label = retailerName === "Home24" ? `home<span>24</span>` : escapeHTML(retailerName);
  return `<span class="retailer-wordmark retailer-wordmark--${meta.slug}${compactClass}" role="img" aria-label="${escapeAttribute(retailerName)}">${label}</span>`;
}

function retailerHeading(retailerName) {
  return `<div class="retailer-heading"><span>Händler</span>${retailerWordmark(retailerName)}<small>Originalprodukt verlinkt</small></div>`;
}

function retailerLinkPanel(product, variant = "card") {
  const meta = retailerMeta(product.retailerName);
  return `
    <a class="retailer-link-panel retailer-link-panel--${variant} retailer-link-panel--${meta.slug}" href="${escapeAttribute(retailerURL(product))}" target="_blank" rel="noopener noreferrer" aria-label="Produktseite für ${escapeAttribute(product.title)} bei ${escapeAttribute(product.retailerName)} öffnen">
      <span class="official-label">Offizielle Produktseite</span>
      <strong>Bei ${escapeHTML(product.retailerName)} ansehen <span aria-hidden="true">↗</span></strong>
      <span class="retailer-link-copy"><span class="linked-product-title">${escapeHTML(product.title)}</span><span class="shop-domain">${escapeHTML(meta.domain)}</span></span>
      <span class="demo-source-tag">Direktlink</span>
    </a>`;
}

function toggleCompare(id) {
  if (store.compare.includes(id)) {
    store.compare = store.compare.filter((value) => value !== id);
    showToast("Aus dem Vergleich entfernt.");
  } else if (store.compare.length >= 3) {
    showToast("Du kannst maximal drei Produkte vergleichen.");
    return;
  } else {
    store.compare.push(id);
    showToast("Zum Vergleich hinzugefügt.");
  }
  saveArray("moebelplan-compare", store.compare);
  updateCounts();
  render();
}

function addCart(id) {
  const product = productByID(id);
  if (!product || isUnavailable(product)) {
    showToast("Dieses Produkt ist derzeit nicht verfügbar.");
    return;
  }
  if (!store.cart.includes(id)) {
    store.cart.push(id);
    store.quantities[id] = 1;
    saveArray("moebelplan-cart", store.cart);
    saveObject("moebelplan-quantities", store.quantities);
    showToast("Zum Universal Warenkorb hinzugefügt.");
    updateCounts();
    render();
  }
}

function removeCart(id) {
  store.cart = store.cart.filter((value) => value !== id);
  delete store.quantities[id];
  saveArray("moebelplan-cart", store.cart);
  saveObject("moebelplan-quantities", store.quantities);
  updateCounts();
  render();
}

function changeQuantity(id, delta) {
  if (!store.cart.includes(id)) return;
  const current = quantityFor(id);
  const next = Math.min(99, Math.max(1, current + delta));
  if (next === current) return;
  store.quantities[id] = next;
  saveObject("moebelplan-quantities", store.quantities);
  render();
}

function calculateQuote(products, profile) {
  const eligible = products.filter((product) => product.sammelLieferungAvailable);
  const individual = products.filter((product) => !product.sammelLieferungAvailable);
  const subtotal = products.reduce((sum, product) => sum + product.price * quantityFor(product), 0);
  const standardShipping = products.reduce((sum, product) => sum + (hasKnownShipping(product) ? product.shippingCost * quantityFor(product) : 0), 0);
  const unknownStandardShippingCount = products.reduce((sum, product) => sum + (hasKnownShipping(product) ? 0 : quantityFor(product)), 0);
  const retailerCount = new Set(eligible.map((product) => product.retailerName)).size;
  const eligibleItemCount = eligible.reduce((sum, product) => sum + quantityFor(product), 0);
  const individualShipping = individual.reduce((sum, product) => sum + (hasKnownShipping(product) ? product.shippingCost * quantityFor(product) : 0), 0);
  const unknownIndividualShippingCount = individual.reduce((sum, product) => sum + (hasKnownShipping(product) ? 0 : quantityFor(product)), 0);
  let consolidatedShipping = individualShipping;

  if (eligible.length) {
    const date = new Date(`${profile.date}T12:00:00`);
    consolidatedShipping += PRICING.base;
    consolidatedShipping += Math.max(0, retailerCount - 1) * PRICING.additionalRetailer;
    consolidatedShipping += Math.max(0, eligibleItemCount - 1) * PRICING.additionalItem;
    if (!profile.elevator) consolidatedShipping += Math.max(0, Number(profile.floor)) * PRICING.floorWithoutElevator;
    if (date.getDay() === 6) consolidatedShipping += PRICING.saturday;
  }

  const savings = unknownStandardShippingCount || unknownIndividualShippingCount ? null : Math.max(0, standardShipping - consolidatedShipping);
  return {
    subtotal,
    standardShipping,
    unknownStandardShippingCount,
    consolidatedShipping,
    savings,
    grandTotal: subtotal + consolidatedShipping,
    grandTotalIsMinimum: unknownIndividualShippingCount > 0
  };
}

function updateNavigation(view) {
  document.querySelectorAll("[data-nav]").forEach((button) => button.classList.toggle("active", button.dataset.nav === view || (view === "product" && button.dataset.nav === "home") || (view === "search" && button.dataset.nav === "home") || (view === "quote" && button.dataset.nav === "cart")));
  updateCounts();
}

function updateCounts() {
  document.querySelectorAll('[data-count="compare"]').forEach((node) => {
    node.textContent = store.compare.length;
    node.hidden = store.compare.length === 0;
  });
  document.querySelectorAll('[data-count="cart"]').forEach((node) => {
    const count = cartQuantityCount();
    node.textContent = count;
    node.hidden = count === 0;
  });
}

function navigate(view, id = "") {
  const next = id ? `#${view}/${encodeURIComponent(id)}` : `#${view}`;
  if (location.hash === next) render();
  else location.hash = next;
}

function parseRoute() {
  const [view = "home", id = ""] = location.hash.replace(/^#/, "").split("/");
  return { view, id: decodeURIComponent(id) };
}

function resetFilters() {
  store.filters = { query: "", category: "", retailers: [], onlySammel: false, maxTotal: 1500, sort: "recommended", moveMode: false };
}

function sanitizeStoredIDs() {
  const ids = new Set(store.products.filter((product) => !isUnavailable(product)).map((product) => product.id));
  store.cart = store.cart.filter((id) => ids.has(id));
  store.compare = store.compare.filter((id) => ids.has(id)).slice(0, 3);
  store.quantities = Object.fromEntries(store.cart.map((id) => [id, quantityFor(id)]));
  saveArray("moebelplan-cart", store.cart);
  saveArray("moebelplan-compare", store.compare);
  saveObject("moebelplan-quantities", store.quantities);
}

function cartProducts() {
  return store.cart.map(productByID).filter(Boolean);
}

function quantityFor(productOrID) {
  const id = typeof productOrID === "string" ? productOrID : productOrID.id;
  const value = Math.round(Number(store.quantities[id] || 1));
  return Math.min(99, Math.max(1, Number.isFinite(value) ? value : 1));
}

function cartItemCount(products = cartProducts()) {
  return products.reduce((sum, product) => sum + quantityFor(product), 0);
}

function cartQuantityCount() {
  return store.cart.reduce((sum, id) => sum + quantityFor(id), 0);
}

function productByID(id) {
  return store.products.find((product) => product.id === id);
}

function activeFilterPills() {
  const pills = [];
  if (store.filters.category) pills.push(store.filters.category);
  pills.push(...store.filters.retailers);
  if (store.filters.onlySammel) pills.push("Sammellieferung");
  if (store.filters.maxTotal < 1500) pills.push(`Bis ${euro(store.filters.maxTotal)}`);
  if (store.filters.moveMode) pills.push("Starter-Auswahl");
  return pills;
}

function hasKnownShipping(product) {
  return Number.isFinite(product.shippingCost);
}

function planningTotal(product) {
  return product.price + (hasKnownShipping(product) ? product.shippingCost : 0);
}

function totalText(product) {
  return hasKnownShipping(product) ? euro(planningTotal(product)) : `ab ${euro(product.price)} · Versand offen`;
}

function shippingText(product) {
  return product.shippingLabel || (hasKnownShipping(product) ? euro(product.shippingCost) : "Im Shop prüfen");
}

function totalPriceBlock(product) {
  if (hasKnownShipping(product)) {
    return `<div class="total-price"><small>Gesamt mit Händler-Versand</small><strong>${euro(planningTotal(product))}</strong></div>`;
  }
  return `<div class="total-price total-price--open"><small>Gesamt noch offen</small><strong>ab ${euro(product.price)}</strong><span>zzgl. Händler-Versand</span></div>`;
}

function dimensions(product) {
  return product.dimensionsLabel || `${formatNumber(product.width)} × ${formatNumber(product.height)} × ${formatNumber(product.depth)} cm`;
}

function euro(value) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(value);
}

function sammelStatus(product) {
  return `<div class="sammel-status ${product.sammelLieferungAvailable ? "" : "off"}">${product.sammelLieferungAvailable ? "✓ MVP-Sammellieferung möglich" : "○ Nur Händler-Versand"}</div>`;
}

function availabilityStatus(product) {
  const state = product.availability || "check";
  return `<div class="availability-status availability-status--${state}"><span aria-hidden="true">${state === "in_stock" ? "●" : state === "out_of_stock" ? "×" : "○"}</span>${escapeHTML(product.availabilityLabel || "Im Shop prüfen")}</div>`;
}

function productMetaLine(product) {
  const rating = Number.isFinite(product.rating) ? `★ ${product.rating.toFixed(1)} · ` : "";
  return `<p class="rating">${rating}${escapeHTML(product.deliveryLabel || "Lieferzeit im Shop prüfen")} · geprüft ${formatVerifiedDate(product.verifiedAt)}</p>`;
}

function isUnavailable(product) {
  return product.availability === "out_of_stock";
}

function retailerShippingSummary(quote) {
  if (!quote.unknownStandardShippingCount) return euro(quote.standardShipping);
  return quote.standardShipping > 0
    ? `mind. ${euro(quote.standardShipping)} + ${quote.unknownStandardShippingCount} offen`
    : `${quote.unknownStandardShippingCount} Position${quote.unknownStandardShippingCount === 1 ? "" : "en"} im Shop prüfen`;
}

function formatVerifiedDate(value) {
  if (!value) return "–";
  const [year, month, day] = String(value).split("-");
  return year && month && day ? `${day}.${month}.${year}` : String(value);
}

function formatNumber(value) {
  return new Intl.NumberFormat("de-DE", { maximumFractionDigits: 1 }).format(value);
}

function specRow(label, value) {
  return `<div class="spec-row"><span>${escapeHTML(label)}</span><strong>${escapeHTML(String(value))}</strong></div>`;
}

function summaryRow(label, value) {
  return `<div class="summary-row"><span>${escapeHTML(label)}</span><strong>${escapeHTML(value)}</strong></div>`;
}

function compareRow(label, products, value, className = "") {
  return `<tr class="${className}"><td>${escapeHTML(label)}</td>${products.map((product) => `<td>${escapeHTML(String(value(product)))}</td>`).join("")}</tr>`;
}

function timelineStep(title, detail, state, symbol) {
  return `<div class="timeline-step ${state}"><span class="timeline-dot">${symbol}</span><div><strong>${escapeHTML(title)}</strong><p>${escapeHTML(detail)}</p></div></div>`;
}

function pageHeading(title, subtitle) {
  return `<div class="page-head"><div><p class="eyebrow">MöbelPlan MVP</p><h2>${escapeHTML(title)}</h2><p>${escapeHTML(subtitle)}</p></div></div>`;
}

function emptyState(title, subtitle, symbol) {
  return `<div class="empty-state"><div><span aria-hidden="true">${symbol}</span><h2>${escapeHTML(title)}</h2><p>${escapeHTML(subtitle)}</p><button class="primary-button" type="button" data-nav="home">Produkte entdecken</button></div></div>`;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timeout);
  showToast.timeout = setTimeout(() => toast.classList.remove("show"), 2200);
}

function loadArray(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function loadObject(key, fallback) {
  try {
    return { ...fallback, ...JSON.parse(localStorage.getItem(key) || "{}") };
  } catch {
    return fallback;
  }
}

function saveArray(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function saveObject(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHTML(value).replaceAll("`", "&#096;");
}

function pageTitle(view) {
  const names = { home: "Entdecken", search: "Produkte", product: "Produkt", compare: "Vergleich", cart: "Warenkorb", quote: "Lieferangebot", tracking: "Lieferung" };
  return `${names[view] || "MöbelPlan"} – MöbelPlan`;
}

function todayISO() {
  const date = new Date();
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

function nextSaturday() {
  const date = new Date();
  const add = (6 - date.getDay() + 7) % 7 || 7;
  date.setDate(date.getDate() + add);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10);
}
