
(() => {
  "use strict";

  const USERNAME = "Chandril6290Da";
  const API_URL = `https://api.github.com/users/${USERNAME}/repos`;

  const grid = document.getElementById("github-project-grid");
  if (!grid) return;

  const status = document.getElementById("github-status");
  const searchInput = document.getElementById("github-project-search");
  const languageFilter = document.getElementById("github-language-filter");
  const sortSelect = document.getElementById("github-sort");

  const totalEl = document.getElementById("github-total");
  const starsEl = document.getElementById("github-stars");
  const languagesEl = document.getElementById("github-languages");

  let repositories = [];

  const escapeHTML = (value = "") =>
    String(value).replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);

  const formatDate = date => {
    if (!date) return "Date unavailable";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  const getTopics = repo => {
    const topics = Array.isArray(repo.topics) ? repo.topics : [];

    return topics.slice(0, 4);
  };

  function renderStats() {
    totalEl.textContent = repositories.length;

    starsEl.textContent = repositories
      .reduce((sum, repo) => sum + repo.stargazers_count, 0);

    languagesEl.textContent = new Set(
      repositories.map(repo => repo.language).filter(Boolean)
    ).size;
  }

  function populateLanguages() {
    const languages = [...new Set(
      repositories.map(repo => repo.language).filter(Boolean)
    )].sort((a, b) => a.localeCompare(b));

    languageFilter.innerHTML =
      '<option value="all">All Languages</option>' +
      languages.map(language =>
        `<option value="${escapeHTML(language)}">${escapeHTML(language)}</option>`
      ).join("");
  }

  function renderProjects() {
    const query = searchInput.value.trim().toLowerCase();
    const selectedLanguage = languageFilter.value;
    const sortBy = sortSelect.value;

    let filtered = repositories.filter(repo => {
      const searchableText = [
        repo.name,
        repo.description || "",
        repo.language || "",
        ...(repo.topics || [])
      ].join(" ").toLowerCase();

      const matchesSearch = searchableText.includes(query);

      const matchesLanguage =
        selectedLanguage === "all" ||
        repo.language === selectedLanguage;

      return matchesSearch && matchesLanguage;
    });

    if (sortBy === "stars") {
      filtered.sort((a, b) =>
        b.stargazers_count - a.stargazers_count
      );
    } else if (sortBy === "name") {
      filtered.sort((a, b) =>
        a.name.localeCompare(b.name)
      );
    } else {
      filtered.sort((a, b) =>
        new Date(b.pushed_at || b.updated_at) -
        new Date(a.pushed_at || a.updated_at)
      );
    }

    if (!filtered.length) {
      grid.innerHTML = `
        <div class="github-project-message">
          <h3>No projects found</h3>
          <p>Try another search term or select a different language.</p>
          <button type="button" class="github-reset-button">
            Reset filters
          </button>
        </div>
      `;

      grid.querySelector(".github-reset-button")
        ?.addEventListener("click", () => {
          searchInput.value = "";
          languageFilter.value = "all";
          sortSelect.value = "updated";
          renderProjects();
        });

      return;
    }

    grid.innerHTML = filtered.map((repo, index) => {
      const language = repo.language || "Other";
      const description =
        repo.description || "Explore the source code and implementation.";

      const topics = getTopics(repo);

      const topicHTML = topics.map(topic =>
        `<span>${escapeHTML(topic)}</span>`
      ).join("");

      const demoLink = repo.homepage &&
        /^https?:\/\//i.test(repo.homepage)
        ? `<a href="${escapeHTML(repo.homepage)}"
              class="github-demo-link"
              target="_blank"
              rel="noopener noreferrer">
              Live Demo ↗
           </a>`
        : "";

      return `
        <article class="build-log-card github-project-card">

          <div class="build-log-meta">
            <span>REPO / ${String(index + 1).padStart(2, "0")}</span>
            <span>${escapeHTML(language)}</span>
          </div>

          <h3>${escapeHTML(repo.name)}</h3>

          <p class="github-project-description">
            ${escapeHTML(description)}
          </p>

          <div class="github-repo-metrics">
            <span>★ ${repo.stargazers_count}</span>
            <span>⑂ ${repo.forks_count}</span>
            <span>Updated ${formatDate(repo.pushed_at || repo.updated_at)}</span>
          </div>

          <div class="build-log-tags">
            ${topicHTML || `<span>${escapeHTML(language)}</span>`}
          </div>

          <div class="github-project-actions">
            <a
              href="${escapeHTML(repo.html_url)}"
              class="build-log-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              View Source ↗
            </a>
            ${demoLink}
          </div>

        </article>
      `;
    }).join("");

    // Preserve the portfolio's existing icon system, if available.
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  async function loadProjects() {
    try {
      status.textContent = "Fetching public repositories...";

      const allRepos = [];
      let page = 1;

      // Fetch every page; GitHub returns at most 100 per page.
      while (true) {
        const response = await fetch(
          `${API_URL}?type=owner&sort=updated&direction=desc&per_page=100&page=${page}`,
          {
            headers: {
              Accept: "application/vnd.github+json"
            }
          }
        );

        if (!response.ok) {
          throw new Error(
            response.status === 403
              ? "GitHub API rate limit reached. Please try again later."
              : `GitHub API error: ${response.status}`
          );
        }

        const batch = await response.json();

        if (!Array.isArray(batch)) {
          throw new Error("Unexpected response from GitHub.");
        }

        allRepos.push(...batch);

        if (batch.length < 100) break;
        page++;
      }

      // Exclude forks and archived repositories by default.
      // Change this filter if you want those included too.
      repositories = allRepos.filter(repo =>
        !repo.fork &&
        !repo.archived &&
        !repo.disabled
      );

      renderStats();
      populateLanguages();
      renderProjects();

      status.textContent =
        `${repositories.length} public projects loaded from GitHub`;

    } catch (error) {
      console.error("GitHub projects error:", error);

      status.textContent = "Unable to load GitHub projects";

      grid.innerHTML = `
        <div class="github-project-message">
          <h3>Projects could not be loaded</h3>
          <p>${escapeHTML(error.message)}</p>
          <button type="button" class="github-reset-button">
            Try Again
          </button>
          <p>
            You can also visit
            <a href="https://github.com/${USERNAME}"
               target="_blank"
               rel="noopener noreferrer">
              my GitHub profile
            </a>.
          </p>
        </div>
      `;

      grid.querySelector(".github-reset-button")
        ?.addEventListener("click", loadProjects);
    }
  }

  searchInput.addEventListener("input", renderProjects);
  languageFilter.addEventListener("change", renderProjects);
  sortSelect.addEventListener("change", renderProjects);

  loadProjects();
})();
