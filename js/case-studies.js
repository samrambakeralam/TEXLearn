/*************************************************
 * TEXLEARN — CASE STUDIES
 * API-DRIVEN FRONTEND
 *
 * Uses the existing Google Apps Script Web App:
 *   ?action=casestudycatalogue
 *   ?action=casestudycontent&id=...&version=...
 *
 * The page HTML keeps its existing card, modal and
 * navigation structure. The reader itself is dynamic.
 *************************************************/

const CASE_STUDY_API =
  "https://script.google.com/macros/s/AKfycbzQFLeWMQAX7gbedsu859N8nEZnGoAFinj4dn1JgpX0La7GSy-2xGHK38MdjcHM2ckk/exec";

// Keep true while testing the Luckin Coffee draft.
// Change to false before public launch.
const SHOW_DRAFT_STUDIES = true;

const CASE_STUDY_REQUEST_TIMEOUT = 20000;

const CASE_CARD_COLORS = [
  "#0B1F3A",
  "#164B3A",
  "#173B63",
  "#3B315F",
  "#6B3A32",
  "#28545A"
];


/* -----------------------------------------------
   DOM REFERENCES
------------------------------------------------ */

const grid = document.getElementById("caseGrid");
const search = document.getElementById("caseSearch");
const filters = document.getElementById("caseFilters");
const sort = document.getElementById("caseSort");
const count = document.getElementById("caseCount");
const empty = document.getElementById("caseEmpty");
const modal = document.getElementById("caseModal");

const readerToc = document.getElementById("readerToc");
const readerArticle = document.getElementById("readerArticle");

let caseStudies = [];
let activeFilter = "All";
let lastFocused = null;
let activeReaderRequest = 0;


/* -----------------------------------------------
   SMALL UTILITIES
------------------------------------------------ */

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function normalise(value) {
  return String(value ?? "").trim();
}

function splitCategories(value) {
  if (Array.isArray(value)) {
    return value.map(normalise).filter(Boolean);
  }

  return String(value ?? "")
    .split(/[;,|]/)
    .map(item => item.trim())
    .filter(Boolean);
}

function categoryLabel(value) {
  return value
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function hashString(value) {
  let hash = 0;

  for (let index = 0; index < value.length; index++) {
    hash = ((hash << 5) - hash) + value.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash);
}

function cardColor(item) {
  return CASE_CARD_COLORS[
    hashString(item.id || item.name) % CASE_CARD_COLORS.length
  ];
}

function safeAssetURL(value) {
  const candidate = normalise(value);

  if (/^https:\/\/[^\s"'<>]+$/i.test(candidate)) {
    return candidate;
  }

  return "";
}


/* -----------------------------------------------
   JSONP API REQUEST
   Apps Script returns JSONP when callback is given.
------------------------------------------------ */

function apiJSONP(params) {
  return new Promise((resolve, reject) => {
    const callbackName =
      "texlearnCaseStudyCallback_" +
      Date.now() + "_" +
      Math.random().toString(36).slice(2);

    const script = document.createElement("script");
    const url = new URL(CASE_STUDY_API);

    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });

    url.searchParams.set("callback", callbackName);

    let settled = false;

    const cleanup = () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }

      delete window[callbackName];
      clearTimeout(timeout);
    };

    const finish = (callback, value) => {
      if (settled) return;
      settled = true;
      cleanup();
      callback(value);
    };

    const timeout = setTimeout(() => {
      finish(
        reject,
        new Error("The case study server took too long to respond.")
      );
    }, CASE_STUDY_REQUEST_TIMEOUT);

    window[callbackName] = data => {
      finish(resolve, data);
    };

    script.onerror = () => {
      finish(
        reject,
        new Error("Unable to connect to the case study server.")
      );
    };

    script.src = url.toString();
    document.head.appendChild(script);
  });
}


/* -----------------------------------------------
   CATALOGUE API
------------------------------------------------ */

function mapCatalogueRecord(record) {
  const categories = splitCategories(record.Category);
  const company = normalise(record.Company);
  const title = normalise(record.Title);

  return {
    id: normalise(record.CaseStudyID),
    versionId: normalise(record.VersionID),
    name: company || title,
    title: title || company,
    category: categories[0] || "Business",
    categories,
    tag: categories.join(" · "),
    subtitle: normalise(record.Subtitle),
    description: normalise(record.Description),
    pageCount: Number(record.PageCount || 0),
    readingTime: normalise(record.EstimatedReadingTime),
    coverAssetKey: normalise(record.CoverAssetKey),
    publicationStatus: normalise(record.PublicationStatus),
    researchCutoff: normalise(record.ResearchCutoff),
    color: CASE_CARD_COLORS[
      hashString(record.CaseStudyID || company || title) %
      CASE_CARD_COLORS.length
    ],
    wordmark: company || title,
    caption: categories.slice(0, 2).join(" · ").toUpperCase()
  };
}

async function loadCatalogue() {
  grid.innerHTML = `
    <div class="case-loading">
      Loading case studies...
    </div>
  `;

  try {
    const response = await apiJSONP({
      action: "casestudycatalogue"
    });

    if (!response || response.success !== true) {
      throw new Error(
        response?.message || "The catalogue could not be loaded."
      );
    }

    let records = Array.isArray(response.caseStudies)
      ? response.caseStudies
      : [];

    if (!SHOW_DRAFT_STUDIES) {
      records = records.filter(record =>
        normalise(record.PublicationStatus).toLowerCase() === "published"
      );
    }

    caseStudies = records
      .filter(record => record.CaseStudyID && record.VersionID)
      .map(mapCatalogueRecord);

    renderFilters();
    render();

  } catch (error) {
    console.error("TEXLearn case study catalogue:", error);

    grid.innerHTML = `
      <div class="case-load-error">
        <h3>Unable to load case studies</h3>
        <p>${escapeHTML(error.message)}</p>
        <button type="button" id="retryCaseCatalogue">Try again</button>
      </div>
    `;

    count.textContent = "Catalogue unavailable";

    const retryButton = document.getElementById("retryCaseCatalogue");
    if (retryButton) {
      retryButton.addEventListener("click", loadCatalogue);
    }
  }
}


/* -----------------------------------------------
   DYNAMIC CATEGORY FILTERS
------------------------------------------------ */

function renderFilters() {
  const categories = [
    ...new Set(caseStudies.flatMap(item => item.categories))
  ].sort((a, b) => a.localeCompare(b));

  filters.innerHTML = `
    <button
      class="filter-chip ${activeFilter === "All" ? "selected" : ""}"
      data-filter="All"
      type="button"
    >All case studies</button>

    ${categories.map(category => `
      <button
        class="filter-chip ${activeFilter === category ? "selected" : ""}"
        data-filter="${escapeHTML(category)}"
        type="button"
      >${escapeHTML(categoryLabel(category))}</button>
    `).join("")}
  `;
}


/* -----------------------------------------------
   CASE STUDY CARDS
------------------------------------------------ */

function cardTemplate(item) {
  const safeName = escapeHTML(item.name);
  const safeCategory = escapeHTML(item.category);
  const safeSubtitle = escapeHTML(item.subtitle);
  const safeID = escapeHTML(item.id);
  const safeWordmark = escapeHTML(item.wordmark);
  const safeCaption = escapeHTML(item.caption);

  return `
    <article
      class="case-card"
      tabindex="0"
      role="button"
      aria-label="Open ${safeName} case study"
      data-id="${safeID}"
    >
      <div class="case-card-art" style="--card-bg:${item.color}">
        <span class="case-card-tag">${safeCategory}</span>
        <span class="brand-wordmark">${safeWordmark}</span>
        <span class="brand-caption">${safeCaption}</span>
      </div>

      <div class="case-card-body">
        <h3>${safeName}</h3>
        <p>${safeSubtitle}</p>

        <div class="case-card-foot">
          <span>${safeID}</span>
          <i data-lucide="arrow-up-right"></i>
        </div>
      </div>
    </article>
  `;
}

function render() {
  if (!grid || !search || !sort) return;

  const term = search.value.trim().toLowerCase();

  let items = caseStudies.filter(item => {
    const categoryMatch =
      activeFilter === "All" ||
      item.categories.includes(activeFilter);

    const searchText = [
      item.name,
      item.title,
      item.category,
      item.tag,
      item.subtitle,
      item.description,
      item.publicationStatus
    ].join(" ").toLowerCase();

    const searchMatch = !term || searchText.includes(term);

    return categoryMatch && searchMatch;
  });

  if (sort.value === "az") {
    items.sort((a, b) => a.name.localeCompare(b.name));
  }

  grid.innerHTML = items.map(cardTemplate).join("");

  count.textContent =
    `${items.length} ${items.length === 1 ? "case study" : "case studies"}`;

  empty.hidden = items.length !== 0;

  if (window.lucide) {
    window.lucide.createIcons();
  }
}


/* -----------------------------------------------
   CONTENT BLOCK RENDERING
------------------------------------------------ */

function blockType(block) {
  return normalise(block.BlockType).toLowerCase().replace(/[\s_-]+/g, "");
}

function blockContent(block) {
  return normalise(block.Content);
}

function blockLabel(block) {
  return normalise(block.BlockLabel);
}

function renderTextParagraph(content) {
  return escapeHTML(content).replace(/\r?\n/g, "<br>");
}

function renderList(content) {
  const items = content
    .split(/\r?\n/)
    .map(item => item.replace(/^\s*(?:[-•●▪◦]|\d+[.)])\s*/, "").trim())
    .filter(Boolean);

  if (items.length <= 1) {
    return `<p>${renderTextParagraph(content)}</p>`;
  }

  return `
    <ul class="reader-content-list">
      ${items.map(item => `<li>${escapeHTML(item)}</li>`).join("")}
    </ul>
  `;
}

function renderBlock(block) {
  const type = blockType(block);
  const content = blockContent(block);
  const label = blockLabel(block);
  const safeContent = escapeHTML(content);

  if (!content && type !== "heading") {
    return "";
  }

  switch (type) {
    case "heading":
    case "title":
    case "subheading": {
      const headingText = content || label;
      return `<h3 class="reader-block-heading">${escapeHTML(headingText)}</h3>`;
    }

    case "paragraph":
    case "text":
    case "body":
      return `<p class="reader-block-paragraph">${renderTextParagraph(content)}</p>`;

    case "list":
    case "bulletlist":
    case "numberedlist":
      return renderList(content);

    case "lesson":
    case "keylesson":
      return `
        <div class="reader-insight reader-lesson">
          <span class="reader-insight-label">${escapeHTML(label || "KEY LESSON")}</span>
          <p>${renderTextParagraph(content)}</p>
        </div>
      `;

    case "highlight":
    case "callout":
      return `
        <div class="reader-insight reader-highlight">
          ${label ? `<strong>${escapeHTML(label)}</strong>` : ""}
          <p>${renderTextParagraph(content)}</p>
        </div>
      `;

    case "stat":
    case "metric":
      return `
        <div class="reader-stat">
          ${label ? `<span>${escapeHTML(label)}</span>` : ""}
          <strong>${safeContent.replace(/\r?\n/g, "<br>")}</strong>
        </div>
      `;

    case "comparison":
      return `
        <div class="reader-comparison">
          ${label ? `<h4>${escapeHTML(label)}</h4>` : ""}
          <p>${renderTextParagraph(content)}</p>
        </div>
      `;

    case "question":
    case "founderquestion":
      return `
        <div class="reader-insight reader-question">
          <span class="reader-insight-label">THINK LIKE A FOUNDER</span>
          ${label ? `<h4>${escapeHTML(label)}</h4>` : ""}
          <p>${renderTextParagraph(content)}</p>
        </div>
      `;

    case "image": {
      const imageURL = safeAssetURL(content);

      if (imageURL) {
        return `
          <figure class="reader-image">
            <img src="${escapeHTML(imageURL)}" alt="${escapeHTML(label || "Case study image")}" loading="lazy">
            ${label ? `<figcaption>${escapeHTML(label)}</figcaption>` : ""}
          </figure>
        `;
      }

      return `
        <div class="reader-image-placeholder">
          <i data-lucide="image"></i>
          <span>${escapeHTML(label || "Visual asset to be added")}</span>
        </div>
      `;
    }

    default:
      // Unknown block types are displayed as readable text
      // rather than silently discarded.
      return `
        <p class="reader-block-paragraph">
          ${renderTextParagraph(content)}
        </p>
      `;
  }
}


/* -----------------------------------------------
   PAGE TITLES AND READER NAVIGATION
------------------------------------------------ */

function pageTitle(page, index) {
  const headingBlock = (page.blocks || []).find(block => {
    const type = blockType(block);
    return ["heading", "title", "subheading"].includes(type);
  });

  const titleFromContent = headingBlock
    ? blockContent(headingBlock) || blockLabel(headingBlock)
    : "";

  return titleFromContent || `Page ${page.page || index + 1}`;
}

function renderReaderPages(data) {
  const pages = Array.isArray(data.pages) ? data.pages : [];

  if (!pages.length) {
    throw new Error("This case study does not contain any pages.");
  }

  readerToc.innerHTML = `
    <strong>IN THIS CASE STUDY</strong>
    ${pages.map((page, index) => {
      const pageNumber = Number(page.page || index + 1);
      const title = pageTitle(page, index);

      return `
        <a
          href="#readerPage-${pageNumber}"
          class="${index === 0 ? "toc-active" : ""}"
          data-reader-page="${pageNumber}"
        >
          <span class="toc-page-number">${String(pageNumber).padStart(2, "0")}</span>
          <span>${escapeHTML(title)}</span>
        </a>
      `;
    }).join("")}
  `;

  readerArticle.innerHTML = pages.map((page, index) => {
    const pageNumber = Number(page.page || index + 1);
    const title = pageTitle(page, index);
    const blocks = Array.isArray(page.blocks) ? page.blocks : [];

    return `
      <section
        class="reader-page"
        id="readerPage-${pageNumber}"
        data-reader-page-section="${pageNumber}"
      >
        <div class="reader-page-heading">
          <span class="chapter-number">${String(pageNumber).padStart(2, "0")}</span>
          <span class="reader-page-label">PAGE ${pageNumber}</span>
        </div>

        <div class="reader-page-content">
          ${blocks.map(renderBlock).join("")}
        </div>
      </section>
    `;
  }).join("");

  if (window.lucide) {
    window.lucide.createIcons();
  }

  setupReaderNavigation();
}


/* -----------------------------------------------
   READER NAVIGATION INTERACTIONS
------------------------------------------------ */

function setupReaderNavigation() {
  const links = [...readerToc.querySelectorAll("[data-reader-page]")];
  const sections = [...readerArticle.querySelectorAll("[data-reader-page-section]")];

  links.forEach(link => {
    link.addEventListener("click", event => {
      event.preventDefault();

      const target = document.getElementById(
        `readerPage-${link.dataset.readerPage}`
      );

      if (target) {
        target.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }

      setActiveReaderLink(link);
    });
  });

  if (!("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver(entries => {
    const visible = entries
      .filter(entry => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (!visible) return;

    const pageNumber = visible.target.dataset.readerPageSection;
    const activeLink = links.find(link =>
      link.dataset.readerPage === pageNumber
    );

    if (activeLink) {
      setActiveReaderLink(activeLink);
    }
  }, {
    root: document.querySelector(".case-reader"),
    rootMargin: "-15% 0px -65% 0px",
    threshold: [0, 0.15, 0.35, 0.6]
  });

  sections.forEach(section => observer.observe(section));

  // Keep the observer alive while the reader is open.
  modal._readerPageObserver?.disconnect();
  modal._readerPageObserver = observer;
}

function setActiveReaderLink(activeLink) {
  readerToc.querySelectorAll("a").forEach(link => {
    const isActive = link === activeLink;
    link.classList.toggle("toc-active", isActive);

    if (isActive) {
      link.setAttribute("aria-current", "location");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}


/* -----------------------------------------------
   INDIVIDUAL CASE STUDY CONTENT API
------------------------------------------------ */

async function loadCaseStudyContent(item) {
  const requestId = ++activeReaderRequest;

  readerToc.innerHTML = "<strong>IN THIS CASE STUDY</strong>";
  readerArticle.innerHTML = `
    <div class="reader-loading">
      Loading ${escapeHTML(item.name)}...
    </div>
  `;

  try {
    const response = await apiJSONP({
      action: "casestudycontent",
      id: item.id,
      version: item.versionId
    });

    // Ignore a late response if another study has been opened.
    if (requestId !== activeReaderRequest || modal.hidden) return;

    if (!response || response.success !== true) {
      throw new Error(
        response?.error ||
        response?.message ||
        "Unable to load this case study."
      );
    }

    const study = response.caseStudy || {};

    document.getElementById("readerCategory").textContent =
      splitCategories(study.Category || item.categories.join("; "))
        .join(" · ")
        .toUpperCase();

    document.getElementById("readerTitle").textContent =
      normalise(study.Title) || item.title || item.name;

    document.getElementById("readerSubtitle").textContent =
      normalise(study.Subtitle) || item.subtitle;

    document.getElementById("readerId").textContent =
      `${item.id} · ${normalise(study.EstimatedReadingTime || item.readingTime)}`;

    document.getElementById("readerMeta").innerHTML = `
      <span>${escapeHTML(item.name)}</span>
      <span>${escapeHTML(item.tag)}</span>
      <span>${escapeHTML(item.readingTime || "Case study")}</span>
    `;

    renderReaderPages(response);

    const reader = document.querySelector(".case-reader");
    if (reader) reader.scrollTop = 0;

  } catch (error) {
    if (requestId !== activeReaderRequest || modal.hidden) return;

    console.error("TEXLearn case study content:", error);

    readerToc.innerHTML = "<strong>IN THIS CASE STUDY</strong>";

    readerArticle.innerHTML = `
      <div class="reader-load-error">
        <h3>Unable to load this case study</h3>
        <p>${escapeHTML(error.message)}</p>
        <button type="button" id="retryReaderContent">Try again</button>
      </div>
    `;

    document.getElementById("retryReaderContent")
      ?.addEventListener("click", () => loadCaseStudyContent(item));
  }
}


/* -----------------------------------------------
   OPEN AND CLOSE READER
------------------------------------------------ */

function openReader(item) {
  if (!item) return;

  lastFocused = document.activeElement;

  const cover = document.getElementById("readerCover");

  cover.style.background =
    `linear-gradient(105deg, ${item.color}, #07182D)`;

  document.getElementById("readerCategory").textContent =
    item.categories.join(" · ").toUpperCase();

  document.getElementById("readerTitle").textContent = item.title || item.name;
  document.getElementById("readerSubtitle").textContent = item.subtitle;
  document.getElementById("readerId").textContent = item.id;

  document.getElementById("readerMeta").innerHTML = "";

  modal.hidden = false;
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("case-modal-open");

  const reader = document.querySelector(".case-reader");
  if (reader) reader.scrollTop = 0;

  document.querySelector(".case-reader-close")?.focus();

  loadCaseStudyContent(item);
}

function closeReader() {
  activeReaderRequest++;

  modal._readerPageObserver?.disconnect();
  modal._readerPageObserver = null;

  modal.hidden = true;
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("case-modal-open");

  if (lastFocused && typeof lastFocused.focus === "function") {
    lastFocused.focus();
  }
}


/* -----------------------------------------------
   CARD EVENTS
------------------------------------------------ */

grid.addEventListener("click", event => {
  const card = event.target.closest(".case-card");
  if (!card) return;

  const item = caseStudies.find(study => study.id === card.dataset.id);
  if (item) openReader(item);
});

grid.addEventListener("keydown", event => {
  if (
    (event.key === "Enter" || event.key === " ") &&
    event.target.classList.contains("case-card")
  ) {
    event.preventDefault();

    const item = caseStudies.find(study =>
      study.id === event.target.dataset.id
    );

    if (item) openReader(item);
  }
});


/* -----------------------------------------------
   SEARCH, SORT AND FILTER EVENTS
------------------------------------------------ */

search.addEventListener("input", render);
sort.addEventListener("change", render);

filters.addEventListener("click", event => {
  const chip = event.target.closest("[data-filter]");
  if (!chip) return;

  activeFilter = chip.dataset.filter;

  filters.querySelectorAll(".filter-chip").forEach(button => {
    button.classList.toggle("selected", button === chip);
  });

  render();
});

document.getElementById("clearFilters").addEventListener("click", () => {
  activeFilter = "All";
  search.value = "";

  filters.querySelectorAll(".filter-chip").forEach(button => {
    button.classList.toggle(
      "selected",
      button.dataset.filter === "All"
    );
  });

  render();
});


/* -----------------------------------------------
   MODAL CLOSE EVENTS
------------------------------------------------ */

modal.addEventListener("click", event => {
  if (event.target.matches("[data-close-modal]")) {
    closeReader();
  }
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && !modal.hidden) {
    closeReader();
  }
});


/* -----------------------------------------------
   MOBILE SIDEBAR
------------------------------------------------ */

const app = document.getElementById("caseApp");
const sidebar = document.getElementById("caseSidebar");
const menuButton = document.getElementById("caseMenu");

const openMenu = () => {
  app.classList.add("sidebar-open");
  document.body.classList.add("case-sidebar-open");
  menuButton.setAttribute("aria-expanded", "true");
};

const closeMenu = () => {
  app.classList.remove("sidebar-open");
  document.body.classList.remove("case-sidebar-open");
  menuButton.setAttribute("aria-expanded", "false");
};

menuButton.addEventListener("click", openMenu);
document.getElementById("caseClose").addEventListener("click", closeMenu);
document.getElementById("caseBackdrop").addEventListener("click", closeMenu);

document.addEventListener("keydown", event => {
  if (event.key === "Escape") closeMenu();
});


/* -----------------------------------------------
   INITIALISE
------------------------------------------------ */

loadCatalogue();

if (window.lucide) {
  window.lucide.createIcons();
}
