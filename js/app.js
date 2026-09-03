// მთავარი აპლიკაციის ლოგიკა: ინიციალიზაცია, ნავიგაცია, ძებნა, რეკომენდაციები, თემები

document.addEventListener("DOMContentLoaded", () => {
  // 1. Toast სისტემა
  const toastEl = document.getElementById("appToast");
  let toastTimer = null;

  window.showAppToast = (message) => {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add("visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.classList.remove("visible");
    }, 2800);
  };

  const safeCopyToClipboard = async (text, toastMessage) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        window.showAppToast(toastMessage);
        return;
      }
    } catch (e) {
      // Fallback below
    }

    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      textarea.style.top = "-9999px";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      window.showAppToast(toastMessage);
    } catch (err) {
      window.showAppToast(toastMessage);
    }
  };

  // 2. თემისა და შრიფტის მასშტაბირების სისტემა
  const themeToggleBtn = document.getElementById("themeToggleBtn");
  const fontDecreaseBtn = document.getElementById("fontDecreaseBtn");
  const fontIncreaseBtn = document.getElementById("fontIncreaseBtn");
  const ambientToggleBtn = document.getElementById("ambientToggleBtn");

  const THEME_KEY = "shentanvar_theme";
  const FONT_KEY = "shentanvar_fontsize";

  const applyTheme = (theme) => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);
    if (themeToggleBtn) {
      themeToggleBtn.setAttribute("aria-label", theme === "night" ? "დღის რეჟიმზე გადართვა" : "ღამის რეჟიმზე გადართვა");
      const icon = themeToggleBtn.querySelector("svg");
      if (icon) {
        if (theme === "night") {
          icon.innerHTML = `<path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`;
        } else {
          icon.innerHTML = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" stroke-width="2" fill="none"/>`;
        }
      }
    }
  };

  const savedTheme = localStorage.getItem(THEME_KEY) || "day";
  applyTheme(savedTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme") || "day";
      const next = current === "day" ? "night" : "day";
      applyTheme(next);
      window.showAppToast(next === "night" ? "ღამის მშვიდი რეჟიმი ჩაირთო" : "დღის ნათელი რეჟიმი ჩაირთო");
    });
  }

  // შრიფტის ზომის შეცვლა (ხანდაზმულთათვის და კომფორტისთვის)
  let currentFontScale = parseInt(localStorage.getItem(FONT_KEY), 10) || 100;
  const setFontScale = (scale) => {
    currentFontScale = Math.min(135, Math.max(90, scale));
    document.documentElement.style.fontSize = `${(currentFontScale / 100) * 16}px`;
    localStorage.setItem(FONT_KEY, currentFontScale);
  };
  setFontScale(currentFontScale);

  if (fontIncreaseBtn) {
    fontIncreaseBtn.addEventListener("click", () => {
      setFontScale(currentFontScale + 10);
      window.showAppToast(`ტექსტის ზომა: ${currentFontScale}%`);
    });
  }
  if (fontDecreaseBtn) {
    fontDecreaseBtn.addEventListener("click", () => {
      setFontScale(currentFontScale - 10);
      window.showAppToast(`ტექსტის ზომა: ${currentFontScale}%`);
    });
  }

  // 3. აუდიო ძრავი და წვიმის ხმა
  const soundEngine = new SoundEngine();
  const breathingTrainer = new BreathingTrainer(soundEngine);

  if (ambientToggleBtn) {
    ambientToggleBtn.addEventListener("click", () => {
      const isPlaying = soundEngine.toggleAmbient(
        () => {
          ambientToggleBtn.classList.add("playing");
          ambientToggleBtn.title = "წვიმის ხმის გამორთვა";
          window.showAppToast("წვიმის დამამშვიდებელი ხმა ჩაირთო");
        },
        () => {
          ambientToggleBtn.classList.remove("playing");
          ambientToggleBtn.title = "წვიმის დამამშვიდებელი ხმის ჩართვა";
          window.showAppToast("ხმა გაითიშა");
        }
      );
    });
  }

  // 4. მობილური მენიუ
  const navToggle = document.getElementById("navToggle");
  const siteNav = document.getElementById("siteNav");
  const navBackdrop = document.getElementById("navBackdrop");

  const setNavState = (open) => {
    if (!siteNav || !navToggle) return;
    siteNav.classList.toggle("open", open);
    if (navBackdrop) {
      navBackdrop.classList.toggle("show", open);
      navBackdrop.hidden = !open;
    }
    navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    document.body.style.overflow = open ? "hidden" : "";
  };

  if (navToggle) {
    navToggle.addEventListener("click", () => {
      const isOpen = siteNav.classList.contains("open");
      setNavState(!isOpen);
    });
  }
  const drawerCloseBtn = document.getElementById("drawerCloseBtn");
  if (drawerCloseBtn) drawerCloseBtn.addEventListener("click", () => setNavState(false));
  if (navBackdrop) navBackdrop.addEventListener("click", () => setNavState(false));
  if (siteNav) {
    siteNav.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => setNavState(false));
    });
  }

  // 5. კლავიატურის მართვა (Escape)
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      setNavState(false);
    }
  });

  // 6. სიტუაციების ძებნა და ფილტრაცია („რა ხდება ახლა“)
  const chipsContainer = document.getElementById("scenarioChips");
  const searchInput = document.getElementById("scenarioSearch");
  const activeScenarioContainer = document.getElementById("activeScenarioDetail");

  let currentCategory = "ყველა";
  let activeScenarioId = SCENARIOS[0]?.id || "";

  const renderChips = () => {
    if (!chipsContainer) return;
    chipsContainer.innerHTML = "";

    const categories = ["ყველა", ...new Set(SCENARIOS.map(s => s.category))];

    categories.forEach(cat => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = `chip ${cat === currentCategory ? "active" : ""}`;
      chip.textContent = cat;
      chip.addEventListener("click", () => {
        currentCategory = cat;
        renderChips();
        filterScenarios();
      });
      chipsContainer.append(chip);
    });
  };

  const renderScenarioDetails = (scenario) => {
    if (!activeScenarioContainer || !scenario) return;

    activeScenarioContainer.innerHTML = `
      <div class="scenario-head">
        <div class="scenario-tags">
          <span class="scenario-category-pill">${scenario.category}</span>
          <span class="scenario-tag-pill">${scenario.tag}</span>
        </div>
        <h3 class="scenario-title">${scenario.title}</h3>
      </div>

      <div class="scenario-section">
        <h4><span class="dot-icon why-dot"></span> რატომ ხდება ეს სინამდვილეში</h4>
        <p class="scenario-desc">${scenario.why}</p>
      </div>

      <div class="scenario-steps-box">
        <h4><span class="dot-icon steps-dot"></span> ნაბიჯ-ნაბიჯ მოქმედების გზა</h4>
        <ul class="scenario-steps-list">
          ${scenario.steps.map(s => `<li>${s}</li>`).join("")}
        </ul>
      </div>

      <div class="do-dont-grid">
        <div class="do-card">
          <h4>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#3F6B45"/><path d="M8 12l3 3 5-5" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>
            რა გვეხმარება
          </h4>
          <p>${scenario.doText}</p>
        </div>
        <div class="dont-card">
          <h4>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#9C3A2C"/><path d="M15 9l-6 6M9 9l6 6" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>
            რა აუარესებს
          </h4>
          <p>${scenario.dontText}</p>
        </div>
      </div>

      <div class="phrase-spotlight">
        <div class="phrase-quote-say">
          <div class="quote-label">
            <span>სამკურნალო ფრაზა (თქვი ასე)</span>
            <button type="button" class="copy-phrase-btn" data-quote="${encodeURIComponent(scenario.quoteSay)}" title="ფრაზის კოპირება">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              კოპირება
            </button>
          </div>
          <blockquote>${scenario.quoteSay}</blockquote>
        </div>

        <div class="phrase-quote-avoid">
          <div class="quote-label">ნუ იტყვი ასე</div>
          <blockquote>${scenario.quoteAvoid}</blockquote>
        </div>
      </div>
    `;

    // კოპირების ღილაკის ლოგიკა
    const copyBtn = activeScenarioContainer.querySelector(".copy-phrase-btn");
    if (copyBtn) {
      copyBtn.addEventListener("click", () => {
        const text = decodeURIComponent(copyBtn.getAttribute("data-quote") || "");
        safeCopyToClipboard(text, "ფრაზა დაკოპირდა ბუფერში");
      });
    }
  };

  const scenarioListEl = document.getElementById("scenarioButtonsList");

  const filterScenarios = () => {
    if (!scenarioListEl) return;
    const query = (searchInput ? searchInput.value.toLowerCase().trim() : "");

    const filtered = SCENARIOS.filter(s => {
      const matchCat = currentCategory === "ყველა" || s.category === currentCategory;
      const matchText = !query || 
        s.title.toLowerCase().includes(query) ||
        s.short.toLowerCase().includes(query) ||
        s.why.toLowerCase().includes(query) ||
        s.keywords.some(k => k.toLowerCase().includes(query));
      return matchCat && matchText;
    });

    scenarioListEl.innerHTML = "";

    if (!filtered.length) {
      scenarioListEl.innerHTML = `<p class="no-results">სიტუაცია ვერ მოიძებნა. სცადეთ სხვა სიტყვა (მაგ. „დაბანა“, „ქურდი“, „ღამე“).</p>`;
      return;
    }

    filtered.forEach(s => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `scenario-nav-btn ${s.id === activeScenarioId ? "active" : ""}`;
      btn.innerHTML = `
        <span class="scenario-btn-text">
          <span class="scenario-btn-tag">${s.category}</span>
          <strong>${s.short}</strong>
        </span>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
      `;

      btn.addEventListener("click", () => {
        activeScenarioId = s.id;
        scenarioListEl.querySelectorAll(".scenario-nav-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        renderScenarioDetails(s);
        if (window.innerWidth < 992 && activeScenarioContainer) {
          activeScenarioContainer.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });

      scenarioListEl.append(btn);
    });

    // თუ მიმდინარე აქტიური სცენარი გაფილტრულშია, გამოვაჩინოთ, წინააღმდეგ შემთხვევაში პირველი
    const currentStillVisible = filtered.find(s => s.id === activeScenarioId);
    if (currentStillVisible) {
      renderScenarioDetails(currentStillVisible);
    } else if (filtered[0]) {
      activeScenarioId = filtered[0].id;
      renderScenarioDetails(filtered[0]);
    }
  };

  if (searchInput) {
    searchInput.addEventListener("input", filterScenarios);
  }

  renderChips();
  filterScenarios();

  // 7. სიტყვების ხიდი (Word Bridges)
  const wordBridgeContainer = document.getElementById("wordBridgesGrid");
  if (wordBridgeContainer && typeof WORD_BRIDGES !== "undefined") {
    wordBridgeContainer.innerHTML = "";
    WORD_BRIDGES.forEach(bridge => {
      const card = document.createElement("article");
      card.className = "bridge-card";
      card.innerHTML = `
        <h4 class="bridge-situation">${bridge.situation}</h4>
        
        <div class="bridge-row bridge-hurtful">
          <div class="bridge-tag red-tag">❌ რა გვცდება ხშირად</div>
          <p class="bridge-phrase">${bridge.hurtful}</p>
        </div>

        <div class="bridge-row bridge-feeling">
          <div class="bridge-tag amber-tag">💔 რას გრძნობს პაციენტი ამ დროს</div>
          <p class="bridge-feeling-text">${bridge.patientFeels}</p>
        </div>

        <div class="bridge-row bridge-healing">
          <div class="bridge-header-healing">
            <span class="bridge-tag green-tag">✅ სამკურნალო ფრაზა (თქვი ასე)</span>
            <button type="button" class="copy-mini-btn" title="კოპირება">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            </button>
          </div>
          <p class="bridge-healing-text">${bridge.healing}</p>
        </div>
      `;

      const copyBtn = card.querySelector(".copy-mini-btn");
      if (copyBtn) {
        copyBtn.addEventListener("click", () => {
          safeCopyToClipboard(bridge.healing, "ფრაზა დაკოპირდა");
        });
      }

      wordBridgeContainer.append(card);
    });
  }

  // 8. სტუმრის მემორანდუმი (Visitor Memo)
  const visitorRulesList = document.getElementById("visitorRulesList");
  const printMemoBtn = document.getElementById("printMemoBtn");
  const copyMemoBtn = document.getElementById("copyMemoBtn");

  if (visitorRulesList && typeof VISITOR_MEMO !== "undefined") {
    visitorRulesList.innerHTML = "";
    VISITOR_MEMO.rules.forEach(rule => {
      const li = document.createElement("li");
      li.className = "visitor-rule-item";
      li.innerHTML = `
        <span class="visitor-rule-num">${rule.num}</span>
        <div class="visitor-rule-content">
          <strong>${rule.title}</strong>
          <p>${rule.desc}</p>
        </div>
      `;
      visitorRulesList.append(li);
    });
  }

  if (printMemoBtn) {
    printMemoBtn.addEventListener("click", () => {
      window.print();
    });
  }

  if (copyMemoBtn && typeof VISITOR_MEMO !== "undefined") {
    copyMemoBtn.addEventListener("click", () => {
      let text = `📜 ${VISITOR_MEMO.title}\n\n`;
      VISITOR_MEMO.rules.forEach(r => {
        text += `${r.num}. ${r.title}\n${r.desc}\n\n`;
      });
      text += `გთხოვთ გაითვალისწინოთ — ეს დაგვეხმარება სიმშვიდისა და სიყვარულის შენარჩუნებაში. ❤️`;

      safeCopyToClipboard(text, "სტუმრის მემორანდუმი დაკოპირდა. შეგიძლიათ გაუგზავნოთ მესენჯერში.");
    });
  }

  // 9. FAQ აკორდეონი
  document.querySelectorAll(".faq-item button").forEach((btn) => {
    btn.addEventListener("click", () => {
      const item = btn.parentElement;
      const isOpen = item.classList.contains("open");
      document.querySelectorAll(".faq-item").forEach((other) => {
        other.classList.remove("open");
        const b = other.querySelector("button");
        if (b) b.setAttribute("aria-expanded", "false");
      });
      if (!isOpen) {
        item.classList.add("open");
        btn.setAttribute("aria-expanded", "true");
      }
    });
  });

  // 10. მხედველობის ველის სიმულატორი (Vision Field Simulator)
  const btnVisionNormal = document.getElementById("btnVisionNormal");
  const btnVisionTunnel = document.getElementById("btnVisionTunnel");
  const visionViewport = document.getElementById("visionViewport");
  const visionNote = document.getElementById("visionSimulatorNote");

  if (btnVisionNormal && btnVisionTunnel && visionViewport) {
    btnVisionNormal.addEventListener("click", () => {
      btnVisionNormal.classList.add("active");
      btnVisionTunnel.classList.remove("active");
      visionViewport.classList.remove("tunnel-mode");
      if (visionNote) {
        visionNote.textContent = "ნორმალურ რეჟიმში ადამიანი ამჩნევს 180° პანორამას და გვერდით მოძრაობას.";
      }
    });

    btnVisionTunnel.addEventListener("click", () => {
      btnVisionTunnel.classList.add("active");
      btnVisionNormal.classList.remove("active");
      visionViewport.classList.add("tunnel-mode");
      if (visionNote) {
        visionNote.textContent = "დემენციის გვირაბისებრი ხედვისას (60°) პერიფერია ბნელდება. გვერდიდან მიახლოება უხილავია და იწვევს პანიკას!";
      }
    });
  }

  // 11. ინიციალიზაცია: მიმდინარე წელი
  const yearEl = document.getElementById("copyrightYear");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // დღის კლინიკური და პრაქტიკული რეკომენდაცია
  const dailyTips = [
    "კომუნიკაციის წესი: არასოდეს შეეკამათოთ ფაქტებზე. მოახდინეთ ემოციის ვალიდაცია და გადაიტანეთ ყურადღება.",
    "კვების რეკომენდაცია: კოვზის გაძნელებისას გამოიყენეთ ხელით მოსახერხებელი საკვები (Finger foods) და კონტრასტული თეფში.",
    "მომვლელის რესურსი: მომვლელის ემოციური გამოფიტვა პირდაპირ ზრდის პაციენტის აჟიტაციას. დაისვენეთ რეგულარულად.",
    "კოგნიტური მხარდაჭერა: ნუ შეამოწმებთ მეხსიერებას შეკითხვებით („გახსოვს?“). ეს იწვევს შფოთვასა და სირცხვილს.",
    "არავერბალური კონტაქტი: მიუახლოვდით ყოველთვის წინიდან, თვალის დონეზე, და არა მოულოდნელად გვერდიდან ან ზურგიდან.",
    "ჰიგიენის მართვა: თუ პაციენტი კატეგორიულ უარს ამბობს დაბანაზე, გადადეთ პროცედურა და სცადეთ მოგვიანებით ნაწილობრივ.",
    "ქცევის დეკოდირება: უეცარი აგრესია თითქმის ყოველთვის გამოწვეულია ფიზიკური ტკივილით, შიშით ან ინფექციით (მაგ. UTI)."
  ];
  const todayNoteEl = document.getElementById("todayInspirationalNote");
  if (todayNoteEl) {
    const dayIdx = new Date().getDay();
    todayNoteEl.textContent = dailyTips[dayIdx];
  }

  // 12. ბეჭდვა / PDF ექსპორტი
  const printBtns = [document.getElementById("headerPrintBtn"), document.getElementById("heroPrintBtn")];
  printBtns.forEach(btn => {
    if (btn) {
      btn.addEventListener("click", () => {
        window.print();
      });
    }
  });

  // 13. ინტერაქტიული PAINAD კალკულატორი
  const painadCalc = document.getElementById("painadCalculator");
  if (painadCalc) {
    const optButtons = painadCalc.querySelectorAll(".painad-opt");
    const scoreNumEl = document.getElementById("painadScoreNum");
    const verdictTitleEl = document.getElementById("painadVerdictTitle");
    const verdictDescEl = document.getElementById("painadVerdictDesc");
    const copyBtn = document.getElementById("painadCopyBtn");
    const resetBtn = document.getElementById("painadResetBtn");

    const categories = ["breathing", "vocalization", "expression", "body", "consolability"];

    const updateScore = () => {
      let total = 0;
      const details = [];

      categories.forEach(cat => {
        const item = painadCalc.querySelector(`.painad-item[data-category="${cat}"]`);
        if (item) {
          const activeOpt = item.querySelector(".painad-opt.active");
          const score = activeOpt ? parseInt(activeOpt.getAttribute("data-score"), 10) : 0;
          total += score;
          const label = item.querySelector(".painad-item-label")?.textContent.trim() || cat;
          const text = activeOpt ? activeOpt.querySelector("span")?.textContent.trim() : "";
          details.push(`${label}: ${score} ქულა (${text})`);
        }
      });

      if (scoreNumEl) scoreNumEl.textContent = total;

      let title = "";
      let desc = "";
      if (total === 0) {
        title = "ტკივილის ობიექტური ნიშნები არ ვლინდება (0 ქულა)";
        desc = "პაციენტის ქცევა და ფიზიოლოგიური ნიშნები მშვიდია. განაგრძეთ რეგულარული მონიტორინგი.";
      } else if (total <= 3) {
        title = `მსუბუქი დისკომფორტი / შესაძლო ტკივილი (${total} ქულა)`;
        desc = "შეამოწმეთ სხეულის პოზა, მოჭერილი ტანსაცმელი, წყურვილი, შარდის ბუშტი და შებერილობა. მიმართეთ დამამშვიდებელ არაფარმაკოლოგიურ მეთოდებს.";
      } else if (total <= 6) {
        title = `ზომიერი ტკივილი (${total} ქულა) — საყურადღებოა!`;
        desc = "დიდი ალბათობით არსებობს ფიზიკური ტკივილის წყარო (შარდის ინფექცია, ყაბზობა, კბილი, სახსრები). რეკომენდებულია ექიმის კონსულტაცია ტკივილგამაყუჩებლის შესარჩევად.";
      } else {
        title = `მწვავე, ძლიერი ტკივილი (${total} ქულა) — გადაუდებელია!`;
        desc = "პაციენტი განიცდის მძიმე ფიზიკურ ტანჯვას. საჭიროა ექიმის ან სასწრაფო სამედიცინო დახმარების დაუყოვნებლივი ჩართვა!";
      }

      if (verdictTitleEl) verdictTitleEl.textContent = title;
      if (verdictDescEl) verdictDescEl.textContent = desc;

      return { total, title, desc, details };
    };

    optButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        const item = btn.closest(".painad-item");
        if (item) {
          item.querySelectorAll(".painad-opt").forEach(b => b.classList.remove("active"));
          btn.classList.add("active");
          updateScore();
        }
      });
    });

    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        categories.forEach(cat => {
          const item = painadCalc.querySelector(`.painad-item[data-category="${cat}"]`);
          if (item) {
            item.querySelectorAll(".painad-opt").forEach(b => b.classList.remove("active"));
            const first = item.querySelector('.painad-opt[data-score="0"]');
            if (first) first.classList.add("active");
          }
        });
        updateScore();
        showToast("PAINAD კალკულატორი განულდა.");
      });
    }

    if (copyBtn) {
      copyBtn.addEventListener("click", () => {
        const res = updateScore();
        const textToCopy = `📋 PAINAD ტკივილის შეფასების შედეგი:\nსაერთო ქულა: ${res.total} / 10\nშეფასება: ${res.title}\nრეკომენდაცია: ${res.desc}\n\nდეტალები:\n- ${res.details.join("\n- ")}\n\n(წყარო: დემენცია ოჯახში — dementia-care-georgia.vercel.app)`;
        safeCopyToClipboard(textToCopy, "PAINAD შეფასების შედეგი დაკოპირდა!", "ტექსტი ვერ დაკოპირდა.");
      });
    }
  }

  // 14. ინტერაქტიული უსაფრთხო სახლის ჩექლისტი
  const safetyChecklist = document.getElementById("homeSafetyChecklist");
  if (safetyChecklist) {
    const checkboxes = safetyChecklist.querySelectorAll(".safety-check");
    const progressText = document.getElementById("safetyProgressText");
    const progressBar = document.getElementById("safetyProgressBar");
    const statusBadge = document.getElementById("safetyStatusBadge");

    const STORAGE_KEY = "dementia_home_safety_audit";

    // აღდგენა localStorage-დან
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      checkboxes.forEach((cb, idx) => {
        if (saved.includes(idx)) cb.checked = true;
      });
    } catch (e) {
      console.warn("Storage read error", e);
    }

    const updateProgress = () => {
      let checkedCount = 0;
      const savedIndices = [];
      checkboxes.forEach((cb, idx) => {
        if (cb.checked) {
          checkedCount++;
          savedIndices.push(idx);
        }
      });

      const total = checkboxes.length;
      const pct = Math.round((checkedCount / total) * 100);

      if (progressText) progressText.textContent = `${pct}% (${checkedCount} / ${total})`;
      if (progressBar) progressBar.style.width = `${pct}%`;

      if (statusBadge) {
        if (checkedCount === 0) {
          statusBadge.textContent = "საჭიროებს ადაპტაციას";
          statusBadge.style.background = "var(--danger-soft)";
          statusBadge.style.color = "var(--danger)";
        } else if (checkedCount <= 4) {
          statusBadge.textContent = "ნაწილობრივ ადაპტირებულია";
          statusBadge.style.background = "var(--amber-soft)";
          statusBadge.style.color = "var(--amber)";
        } else if (checkedCount < total) {
          statusBadge.textContent = "კარგად ადაპტირებულია";
          statusBadge.style.background = "var(--teal-light)";
          statusBadge.style.color = "var(--teal-mid)";
        } else {
          statusBadge.textContent = "მაქსიმალურად დაცულია 🎉";
          statusBadge.style.background = "var(--ok-soft)";
          statusBadge.style.color = "var(--ok)";
        }
      }

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(savedIndices));
      } catch (e) {
        console.warn("Storage write error", e);
      }
    };

    checkboxes.forEach(cb => {
      cb.addEventListener("change", updateProgress);
    });

    updateProgress();
  }
});
