const caseStudies = [
  {
    id:"CASE-001",name:"Luckin Coffee",category:"Startup Stories",tag:"Retail · Coffee",
    subtitle:"How a technology-led coffee startup challenged an established market.",
    description:"Luckin Coffee offers a useful study of digital-first retail, convenience, rapid expansion and the risks that can arise when growth targets outpace governance.",
    origin:"Founded in China in 2017, Luckin Coffee set out to build a technology-driven coffee business with a strong emphasis on mobile ordering and convenient pickup locations.",
    model:"The company used mobile ordering, delivery and smaller store formats to serve customers. Its approach placed technology and convenience at the centre of the customer experience.",
    strategy:"Luckin expanded rapidly through technology-enabled customer acquisition, promotions and a dense store network. Its accounting scandal also demonstrates why governance and trustworthy reporting matter.",
    lessons:["Convenience can be a powerful competitive advantage.","Technology can simplify customer interactions and operations.","Rapid growth needs strong internal controls.","Trust and transparent reporting are essential to long-term business success."],
    question:"If you were launching a coffee brand in your town, how would you make the buying experience more convenient than existing competitors?",
    color:"#164B3A",wordmark:"luckin",caption:"RETAIL · COFFEE"
  },
  {
    id:"CASE-002",name:"Netflix",category:"Global Brands",tag:"Entertainment · Technology",
    subtitle:"From DVD rentals to a global streaming and entertainment business.",
    description:"Netflix demonstrates how a company can evolve its business model as technology, customer behaviour and distribution channels change.",
    origin:"Netflix began in 1997 as a DVD rental business. It later introduced subscription-based DVD services and moved into online streaming as broadband internet became more widespread.",
    model:"Its subscription model gives customers access to a library of entertainment content. Over time, Netflix expanded into producing and distributing original content.",
    strategy:"Netflix invested in streaming technology, customer recommendations, international expansion and original programming. Its evolution shows the importance of adapting before a business model becomes outdated.",
    lessons:["A business model can evolve as technology changes.","Customer convenience can reshape an industry.","Data can help improve product recommendations.","Adaptation requires investment and a willingness to change."],
    question:"What traditional service in your area could be redesigned around a subscription or digital-access model?",
    color:"#D81F26",wordmark:"NETFLIX",caption:"ENTERTAINMENT · STREAMING"
  },
  {
    id:"CASE-003",name:"Airbnb",category:"Startup Stories",tag:"Travel · Marketplace",
    subtitle:"How a simple accommodation idea grew into a global marketplace.",
    description:"Airbnb is a case study in identifying unused resources, building trust between strangers and creating a marketplace that connects supply with demand.",
    origin:"Airbnb began in 2007 when its founders offered accommodation in their home to visitors. The idea developed into a platform where hosts could list spaces for travellers.",
    model:"The platform connects hosts and guests and earns revenue through service fees. Reviews, identity features and platform policies help support transactions between people who may not know each other.",
    strategy:"Airbnb focused on improving listings, photography, reviews, user experience and international reach. It built a recognisable brand around belonging and local travel experiences.",
    lessons:["An unused resource can become a business opportunity.","Trust is central to peer-to-peer marketplaces.","Good presentation can improve customer confidence.","A platform becomes more useful as its network grows."],
    question:"What unused resources in your community could be connected to people who need them?",
    color:"#FF5A5F",wordmark:"airbnb",caption:"TRAVEL · MARKETPLACE"
  },
  {
    id:"CASE-004",name:"Tesla",category:"Global Brands",tag:"Automotive · Energy",
    subtitle:"How a company built a brand around electric mobility and energy.",
    description:"Tesla provides a case for studying product positioning, technology investment, brand identity and the challenges of scaling manufacturing.",
    origin:"Tesla was founded in 2003 with a mission centred on electric vehicles. The company entered the automotive market by initially focusing on premium electric cars.",
    model:"Tesla sells electric vehicles and related products and services, including energy storage and charging solutions. Its model also includes software features and direct customer relationships.",
    strategy:"The company used performance-led positioning, a distinctive brand, charging infrastructure and investment in battery and vehicle technology to build its market presence.",
    lessons:["A strong mission can help shape brand identity.","New products can enter a market through a focused segment.","Infrastructure can strengthen a product ecosystem.","Scaling manufacturing presents challenges beyond product innovation."],
    question:"If you wanted to introduce an unfamiliar technology to your local market, which customer group would you target first and why?",
    color:"#C92A35",wordmark:"TESLA",caption:"MOBILITY · ENERGY"
  },
  {
    id:"CASE-005",name:"Amazon",category:"Global Brands",tag:"E-commerce · Technology",
    subtitle:"The evolution of an online bookstore into a broad digital commerce ecosystem.",
    description:"Amazon is useful for understanding customer obsession, logistics, platform development, experimentation and long-term investment.",
    origin:"Amazon started in 1994 as an online bookstore. It gradually expanded into many product categories and developed technology and logistics capabilities to support its growth.",
    model:"Its business includes online retail, third-party seller services, subscriptions, advertising and cloud computing. Multiple business lines support a broad ecosystem.",
    strategy:"Amazon focused on selection, convenience and customer experience. It invested in fulfilment infrastructure and technology, while experimenting with new products and services.",
    lessons:["Start with a clear customer problem.","Operational systems can become a competitive advantage.","A business can expand into adjacent opportunities over time.","Experimentation should be supported by disciplined execution."],
    question:"What is one customer inconvenience in your town that a better ordering or delivery system could solve?",
    color:"#172B4D",wordmark:"amazon",caption:"COMMERCE · TECHNOLOGY"
  },
  {
    id:"CASE-006",name:"Nike",category:"Marketing",tag:"Sportswear · Branding",
    subtitle:"How a sports brand built an identity beyond the products it sells.",
    description:"Nike is a strong example of emotional branding, athlete partnerships, storytelling and building a recognisable identity around a customer aspiration.",
    origin:"Nike's roots trace back to Blue Ribbon Sports, founded in 1964. The Nike brand emerged in 1971 and grew through product innovation and sports marketing.",
    model:"Nike sells footwear, apparel and equipment through direct channels and wholesale partners. Its brand and product ecosystem connect with athletes and everyday consumers.",
    strategy:"Nike built its identity through athlete endorsements, memorable campaigns, product innovation and storytelling that connects sport with personal achievement.",
    lessons:["People often connect with what a brand represents.","Consistent messaging strengthens brand recognition.","Partnerships can help a brand reach new audiences.","Product quality and brand promise need to support each other."],
    question:"If you were building a youth-focused brand, what identity or aspiration would you want customers to associate with it?",
    color:"#111827",wordmark:"NIKE",caption:"SPORTS · BRANDING"
  },
  {
    id:"CASE-007",name:"Zerodha",category:"Indian Startups",tag:"Fintech · Investing",
    subtitle:"How a bootstrapped Indian company challenged traditional brokerage pricing.",
    description:"Zerodha is an example of a focused business that used technology and a clear pricing proposition to simplify access to financial markets.",
    origin:"Zerodha was founded in India in 2010 by Nithin and Nikhil Kamath. It entered a brokerage market where pricing and service structures were often complex for retail customers.",
    model:"The company offers online trading and investing services, supported by technology platforms and related financial education.",
    strategy:"Zerodha focused on transparent pricing, product usability, educational resources and a relatively capital-efficient approach to growth.",
    lessons:["A clear pricing proposition can challenge established expectations.","Simple digital experiences can reduce customer friction.","Education can support trust in complex categories.","Focused growth can be an alternative to growth at any cost."],
    question:"What service in India could be made more accessible by simplifying pricing and improving its digital experience?",
    color:"#174A88",wordmark:"ZERODHA",caption:"FINTECH · INDIA"
  },
  {
    id:"CASE-008",name:"Zomato",category:"Indian Startups",tag:"Food · Technology",
    subtitle:"From restaurant discovery to a major food delivery and commerce platform.",
    description:"Zomato illustrates marketplace development, local network effects, delivery operations, customer acquisition and the economics of convenience.",
    origin:"Zomato began in 2008 as Foodiebay, a restaurant information and menu discovery service. It later expanded into food ordering and delivery.",
    model:"Its platform connects customers, restaurants and delivery partners. Revenue streams and operating economics have evolved as the business expanded into adjacent services.",
    strategy:"The company built brand awareness, expanded city by city, invested in app experience and developed delivery capabilities. Its history also shows how difficult unit economics and competition can be.",
    lessons:["A focused discovery product can open a path to a larger marketplace.","Local density matters in delivery businesses.","Convenience must be balanced against operating costs.","Market expansion requires adapting to local conditions."],
    question:"How would you test whether a food-delivery service could work sustainably in a smaller town?",
    color:"#E43D35",wordmark:"zomato",caption:"FOOD · MARKETPLACE"
  },
  {
    id:"CASE-009",name:"Canva",category:"Startup Stories",tag:"Software · Design",
    subtitle:"How an accessible design platform helped more people create visual content.",
    description:"Canva is a case in product-led growth, simplifying complex tools, freemium distribution, templates and collaboration.",
    origin:"Canva grew from the idea that design software could be easier for everyday users. Its founders first explored the concept through a yearbook design product before expanding the platform.",
    model:"A freemium software model gives users access to core design tools, with paid plans offering additional features, content and collaboration capabilities.",
    strategy:"Canva reduced the learning curve through templates, browser-based access, sharing and a broad content ecosystem. Product usability helped users discover and recommend the platform.",
    lessons:["Removing complexity can unlock a much larger audience.","Templates help users reach a useful outcome faster.","Freemium can support product discovery and adoption.","Collaboration can increase the value of a digital product."],
    question:"Which complicated task could you make easier for students, small businesses or local organisations with a simple digital tool?",
    color:"#16A6A1",wordmark:"Canva",caption:"SOFTWARE · DESIGN"
  },
  {
    id:"CASE-010",name:"Kodak",category:"Business Failures",tag:"Photography · Strategy",
    subtitle:"What the photography pioneer can teach us about technology shifts and organisational change.",
    description:"Kodak is frequently studied in discussions of disruption and adaptation. A careful case study should avoid the oversimplified claim that the company simply failed to invent digital photography; the deeper questions concern strategy, incentives and transition.",
    origin:"Kodak became a major photography company by making cameras and film accessible to consumers. It also developed important digital imaging technology, while its established film business remained highly significant.",
    model:"Its historic model relied heavily on cameras, film, processing and printing. Digital photography changed the economics and customer behaviour underpinning that model.",
    strategy:"The shift to digital imaging challenged established revenue streams and required a different business model. Kodak's experience highlights the difficulty of moving resources and incentives away from a profitable legacy business.",
    lessons:["Inventing a technology is not the same as building a successful business around it.","Established revenue streams can make change difficult.","Disruption changes customer behaviour and industry economics.","A transition strategy needs timely investment and organisational commitment."],
    question:"If a new technology threatens your most profitable product, how would you decide what to protect, transform or replace?",
    color:"#D7A72D",wordmark:"KODAK",caption:"PHOTOGRAPHY · TRANSFORMATION"
  }
];

const grid = document.getElementById("caseGrid");
const search = document.getElementById("caseSearch");
const filters = document.getElementById("caseFilters");
const sort = document.getElementById("caseSort");
const count = document.getElementById("caseCount");
const empty = document.getElementById("caseEmpty");
const modal = document.getElementById("caseModal");

let activeFilter = "All";
let lastFocused = null;

function cardTemplate(item) {
  const safe = s => String(s).replace(/[&<>"']/g, c => ({
    "&":"&amp;",
    "<":"&lt;",
    ">":"&gt;",
    '"':"&quot;",
    "'":"&#39;"
  }[c]));

  return `
    <article class="case-card"
      tabindex="0"
      role="button"
      aria-label="Open ${safe(item.name)} case study"
      data-id="${item.id}">
      <div class="case-card-art" style="--card-bg:${item.color}">
        <span class="case-card-tag">${safe(item.category)}</span>
        <span class="brand-wordmark">${safe(item.wordmark)}</span>
        <span class="brand-caption">${safe(item.caption)}</span>
      </div>
      <div class="case-card-body">
        <h3>${safe(item.name)}</h3>
        <p>${safe(item.subtitle)}</p>
        <div class="case-card-foot">
          <span>${item.id}</span>
          <i data-lucide="arrow-up-right"></i>
        </div>
      </div>
    </article>`;
}

function render() {
  const term = search.value.trim().toLowerCase();

  let items = caseStudies.filter(item => {
    const categoryMatch =
      activeFilter === "All" || item.category === activeFilter;

    const searchMatch =
      !term ||
      [
        item.name,
        item.category,
        item.tag,
        item.subtitle,
        item.description
      ].join(" ").toLowerCase().includes(term);

    return categoryMatch && searchMatch;
  });

  if (sort.value === "az") {
    items.sort((a, b) => a.name.localeCompare(b.name));
  }

  grid.innerHTML = items.map(cardTemplate).join("");

  count.textContent =
    `${items.length} ${items.length === 1 ? "case study" : "case studies"}`;

  empty.hidden = items.length !== 0;

  if (window.lucide) lucide.createIcons();
}

function openReader(item) {
  lastFocused = document.activeElement;

  document.getElementById("readerCategory").textContent =
    `${item.category.toUpperCase()} · ${item.tag.toUpperCase()}`;

  document.getElementById("readerTitle").textContent = item.name;
  document.getElementById("readerSubtitle").textContent = item.subtitle;
  document.getElementById("readerId").textContent = item.id;

  document.getElementById("readerDescription").textContent = item.description;
  document.getElementById("readerOriginText").textContent = item.origin;
  document.getElementById("readerModelText").textContent = item.model;
  document.getElementById("readerStrategyText").textContent = item.strategy;
  document.getElementById("readerQuestion").textContent = item.question;

  document.getElementById("readerLessonsList").innerHTML =
    item.lessons.map(x => `<li>${x}</li>`).join("");

  document.getElementById("readerMeta").innerHTML = `
    <span>${item.category}</span>
    <span>${item.tag}</span>
    <span>${item.id}</span>`;

  const cover = document.getElementById("readerCover");
  cover.style.background = `linear-gradient(105deg, ${item.color}, #07182D)`;

  modal.hidden = false;
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("case-modal-open");

  document.querySelector(".case-reader").scrollTop = 0;
  document.querySelector(".case-reader-close").focus();
}

function closeReader() {
  modal.hidden = true;
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("case-modal-open");

  if (lastFocused) lastFocused.focus();
}

/* Open a case study */
grid.addEventListener("click", e => {
  const card = e.target.closest(".case-card");
  if (!card) return;

  const item = caseStudies.find(x => x.id === card.dataset.id);
  if (item) openReader(item);
});

/* Keyboard support for case cards */
grid.addEventListener("keydown", e => {
  if (
    (e.key === "Enter" || e.key === " ") &&
    e.target.classList.contains("case-card")
  ) {
    e.preventDefault();

    const item = caseStudies.find(x => x.id === e.target.dataset.id);
    if (item) openReader(item);
  }
});

/* Search and sorting */
search.addEventListener("input", render);
sort.addEventListener("change", render);

/* Category filters */
filters.addEventListener("click", e => {
  const chip = e.target.closest("[data-filter]");
  if (!chip) return;

  activeFilter = chip.dataset.filter;

  filters.querySelectorAll(".filter-chip").forEach(x => {
    x.classList.toggle("selected", x === chip);
  });

  render();
});

/* Clear filters */
document.getElementById("clearFilters").addEventListener("click", () => {
  activeFilter = "All";
  search.value = "";

  filters.querySelectorAll(".filter-chip").forEach(x => {
    x.classList.toggle("selected", x.dataset.filter === "All");
  });

  render();
});

/* Close reader */
modal.addEventListener("click", e => {
  if (e.target.matches("[data-close-modal]")) {
    closeReader();
  }
});

document.addEventListener("keydown", e => {
  if (e.key === "Escape" && !modal.hidden) {
    closeReader();
  }
});

/* Mobile sidebar */
const app = document.getElementById("caseApp");
const sidebar = document.getElementById("caseSidebar");

const openMenu = () => {
  app.classList.add("sidebar-open");
  document.body.classList.add("case-sidebar-open");

  document.getElementById("caseMenu")
    .setAttribute("aria-expanded", "true");
};

const closeMenu = () => {
  app.classList.remove("sidebar-open");
  document.body.classList.remove("case-sidebar-open");

  document.getElementById("caseMenu")
    .setAttribute("aria-expanded", "false");
};

document.getElementById("caseMenu").addEventListener("click", openMenu);
document.getElementById("caseClose").addEventListener("click", closeMenu);
document.getElementById("caseBackdrop").addEventListener("click", closeMenu);

document.addEventListener("keydown", e => {
  if (e.key === "Escape") closeMenu();
});

/* Initial rendering */
render();