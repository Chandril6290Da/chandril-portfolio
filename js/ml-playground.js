/* ==================== ML PLAYGROUND LOGIC ==================== */
(function () {
  "use strict";

  const root = document.getElementById("ml-playground");
  if (!root || root.dataset.mlInitialized === "true") return;
  root.dataset.mlInitialized = "true";

  const $ = (selector) => root.querySelector(selector);
  const $$ = (selector) => Array.from(root.querySelectorAll(selector));

  /* Tabs */
  $$(".ml-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      const name = tab.dataset.panel;
      $$(".ml-tab").forEach((item) => {
        const active = item === tab;
        item.classList.toggle("active", active);
        item.setAttribute("aria-selected", String(active));
      });
      $$(".ml-panel").forEach((panel) => {
        const active = panel.id === "ml-panel-" + name;
        panel.hidden = !active;
        panel.classList.toggle("active", active);
      });
      if (name === "regression") drawRegression();
    });
  });

  /* NLP: transparent, simple word-lexicon demonstration */
  const positiveWords = new Set([
    "love", "loved", "lovely", "great", "excellent", "amazing", "awesome",
    "good", "best", "happy", "wonderful", "fantastic", "enjoy", "enjoyed",
    "success", "successful", "helpful", "beautiful", "positive", "brilliant",
    "like", "liked", "improve", "improved", "easy", "efficient", "perfect",
    "recommend", "reliable", "excited", "innovative", "smart", "effective",
    "friendly", "nice", "delightful", "impressive", "win", "winning"
  ]);
  const negativeWords = new Set([
    "hate", "hated", "terrible", "awful", "bad", "worst", "sad", "angry",
    "poor", "horrible", "disappointing", "disappointed", "failure", "fail",
    "broken", "difficult", "hard", "slow", "useless", "problem", "problems",
    "wrong", "negative", "annoying", "boring", "bug", "bugs", "error",
    "errors", "weak", "expensive", "waste", "risk", "risky", "unhappy",
    "damage", "damaged", "confusing", "confused", "inaccurate", "inefficient"
  ]);
  const negators = new Set(["not", "no", "never", "neither", "hardly", "isn't", "wasn't", "don't", "doesn't", "didn't", "cannot", "can't"]);
  const intensifiers = new Set(["very", "really", "extremely", "absolutely", "so", "highly", "incredibly"]);
  const diminishers = new Set(["slightly", "somewhat", "little", "barely", "mildly"]);
  const tokenize = (text) => text.toLowerCase().match(/[\p{L}\p{N}]+(?:['’][\p{L}]+)*/gu) || [];

  function analyzeNLP() {
    const text = $("#ml-nlp-input").value.trim();
    const tokens = tokenize(text);
    const steps = $$(".ml-step");
    steps.forEach((step, i) => {
      step.classList.toggle("done", true);
      step.querySelector("i").textContent = ["TOKENIZED", "CLEANED", "EXTRACTED", "SCORED"][i];
    });

    let score = 0;
    const tokenScores = tokens.map((token, i) => {
      let value = positiveWords.has(token) ? 1 : negativeWords.has(token) ? -1 : 0;
      const previous = tokens.slice(Math.max(0, i - 3), i);
      if (value && previous.some((word) => negators.has(word))) value *= -1;
      if (value && previous.some((word) => intensifiers.has(word))) value *= 1.5;
      if (value && previous.some((word) => diminishers.has(word))) value *= 0.5;
      score += value;
      return { token, value };
    });

    const sentiment = score > 0 ? "Positive" : score < 0 ? "Negative" : "Neutral";
    const normalized = tokens.length ? Math.max(-1, Math.min(1, score / Math.max(2, tokens.length * 0.25))) : 0;
    const sentimentIcon = sentiment === "Positive" ? "POS" : sentiment === "Negative" ? "NEG" : "NEU";
    $("#ml-sentiment-label").textContent = text ? sentiment : "No text entered";
    $("#ml-sentiment-icon").textContent = sentimentIcon;
    $("#ml-sentiment-score").textContent = text ? (normalized >= 0 ? "+" : "") + normalized.toFixed(2) : "0.00";
    $("#ml-sentiment-meter").style.width = ((normalized + 1) / 2 * 100) + "%";
    $("#ml-sentiment-meter").style.background = sentiment === "Positive" ? "#10b981" : sentiment === "Negative" ? "#ef4444" : "#6366f1";
    $("#ml-token-count").textContent = tokens.length;
    $("#ml-unique-count").textContent = new Set(tokens).size;
    $("#ml-char-count").textContent = tokens.join("").length;

    const tokenView = $("#ml-token-view");
    tokenView.replaceChildren();
    if (!tokens.length) {
      const empty = document.createElement("span");
      empty.textContent = "Enter some text to inspect its tokens.";
      tokenView.appendChild(empty);
    } else {
      tokenScores.forEach(({ token, value }) => {
        const chip = document.createElement("span");
        chip.className = "ml-token" + (value > 0 ? " positive" : value < 0 ? " negative" : "");
        chip.textContent = token;
        chip.title = value > 0 ? "Positive lexicon match" : value < 0 ? "Negative lexicon match" : "No sentiment match";
        tokenView.appendChild(chip);
      });
    }
  }

  $("#ml-analyze").addEventListener("click", analyzeNLP);
  $("#ml-nlp-input").addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") analyzeNLP();
  });
  $$(".ml-samples button").forEach((button) => {
    button.addEventListener("click", () => {
      $("#ml-nlp-input").value = button.dataset.sample;
      analyzeNLP();
    });
  });
  analyzeNLP();

  /* Classification: fixed illustrative dataset */
  const classificationData = [
    { name: "Sample A", detail: "Probability 0.92 · Actual positive", p: 0.92, y: 1 },
    { name: "Sample B", detail: "Probability 0.81 · Actual positive", p: 0.81, y: 1 },
    { name: "Sample C", detail: "Probability 0.68 · Actual negative", p: 0.68, y: 0 },
    { name: "Sample D", detail: "Probability 0.57 · Actual positive", p: 0.57, y: 1 },
    { name: "Sample E", detail: "Probability 0.48 · Actual negative", p: 0.48, y: 0 },
    { name: "Sample F", detail: "Probability 0.39 · Actual positive", p: 0.39, y: 1 },
    { name: "Sample G", detail: "Probability 0.21 · Actual negative", p: 0.21, y: 0 },
    { name: "Sample H", detail: "Probability 0.08 · Actual negative", p: 0.08, y: 0 }
  ];

  function renderClassification() {
    const threshold = Number($("#ml-threshold").value);
    $("#ml-threshold-value").textContent = threshold.toFixed(2);
    const list = $("#ml-class-samples");
    list.replaceChildren();
    let tp = 0, tn = 0, fp = 0, fn = 0;

    classificationData.forEach((item) => {
      const predicted = item.p >= threshold ? 1 : 0;
      if (predicted && item.y) tp++;
      else if (predicted && !item.y) fp++;
      else if (!predicted && item.y) fn++;
      else tn++;

      const row = document.createElement("div");
      row.className = "ml-class-row";
      const info = document.createElement("div");
      const title = document.createElement("b");
      title.textContent = item.name;
      const detail = document.createElement("small");
      detail.textContent = item.detail;
      info.append(title, detail);
      const badge = document.createElement("span");
      badge.className = predicted ? "" : "negative";
      badge.textContent = predicted ? "POSITIVE +" : "NEGATIVE −";
      row.append(info, badge);
      list.appendChild(row);
    });

    $("#ml-tp").textContent = tp;
    $("#ml-fn").textContent = fn;
    $("#ml-fp").textContent = fp;
    $("#ml-tn").textContent = tn;
    $("#ml-accuracy").textContent = ((tp + tn) / classificationData.length * 100).toFixed(1) + "%";
    $("#ml-precision").textContent = (tp + fp ? (tp / (tp + fp) * 100).toFixed(1) + "%" : "N/A");
    $("#ml-recall").textContent = (tp + fn ? (tp / (tp + fn) * 100).toFixed(1) + "%" : "N/A");
  }

  $("#ml-threshold").addEventListener("input", renderClassification);
  $("#ml-reset-class").addEventListener("click", () => {
    $("#ml-threshold").value = "0.50";
    renderClassification();
  });
  renderClassification();

  /* Regression: SVG visualization */
  const observations = [
    { x: 1, y: 8 }, { x: 2, y: 12 }, { x: 3, y: 15 },
    { x: 4, y: 20 }, { x: 5, y: 23 }, { x: 6, y: 30 },
    { x: 7, y: 32 }, { x: 8, y: 38 }, { x: 9, y: 39 }
  ];
  const chart = { left: 42, right: 420, top: 20, bottom: 240, xMin: 0, xMax: 10, yMin: -10, yMax: 70 };
  const px = (x) => chart.left + (x - chart.xMin) / (chart.xMax - chart.xMin) * (chart.right - chart.left);
  const py = (y) => chart.bottom - (y - chart.yMin) / (chart.yMax - chart.yMin) * (chart.bottom - chart.top);
  const svgNS = "http://www.w3.org/2000/svg";

  function svgElement(tag, attrs, text) {
    const el = document.createElementNS(svgNS, tag);
    Object.entries(attrs || {}).forEach(([key, value]) => el.setAttribute(key, String(value)));
    if (text !== undefined) el.textContent = text;
    return el;
  }

  function drawRegression() {
    const x = Number($("#ml-reg-x").value);
    const slope = Number($("#ml-reg-slope").value);
    const intercept = Number($("#ml-reg-intercept").value);
    const predict = (v) => intercept + slope * v;
    const grid = $("#ml-reg-grid");
    const line = $("#ml-reg-line");
    const points = $("#ml-reg-points");
    const marker = $("#ml-reg-marker");
    const labels = $("#ml-reg-labels");
    [grid, line, points, marker, labels].forEach((group) => group.replaceChildren());

    for (let y = -10; y <= 70; y += 20) {
      grid.appendChild(svgElement("line", { x1: chart.left, y1: py(y), x2: chart.right, y2: py(y), class: "ml-chart-grid" }));
      labels.appendChild(svgElement("text", { x: chart.left - 9, y: py(y) + 4, "text-anchor": "end", class: "ml-chart-tick" }, String(y)));
    }
    for (let xv = 0; xv <= 10; xv += 2) {
      grid.appendChild(svgElement("line", { x1: px(xv), y1: chart.top, x2: px(xv), y2: chart.bottom, class: "ml-chart-grid" }));
      labels.appendChild(svgElement("text", { x: px(xv), y: chart.bottom + 20, "text-anchor": "middle", class: "ml-chart-tick" }, String(xv)));
    }
    labels.appendChild(svgElement("text", { x: (chart.left + chart.right) / 2, y: 280, "text-anchor": "middle", class: "ml-chart-tick" }, "Input feature (x)"));
    line.appendChild(svgElement("line", {
      x1: px(0), y1: py(predict(0)), x2: px(10), y2: py(predict(10)),
      class: "ml-chart-fit", "clip-path": "none"
    }));

    observations.forEach((point) => {
      points.appendChild(svgElement("circle", { cx: px(point.x), cy: py(point.y), r: 5, class: "ml-chart-observed" }));
    });

    const predictedY = predict(x);
    const boundedY = Math.max(chart.yMin, Math.min(chart.yMax, predictedY));
    const nearestObserved = observations.reduce((best, p) => Math.abs(p.x - x) < Math.abs(best.x - x) ? p : best, observations[0]);
    marker.appendChild(svgElement("line", {
      x1: px(x), y1: py(nearestObserved.y), x2: px(x), y2: py(boundedY), class: "ml-chart-residual"
    }));
    marker.appendChild(svgElement("circle", { cx: px(x), cy: py(boundedY), r: 6, class: "ml-chart-selected" }));

    $("#ml-reg-x-value").textContent = Number.isInteger(x) ? x : x.toFixed(1);
    $("#ml-reg-slope-value").textContent = slope.toFixed(1);
    $("#ml-reg-intercept-value").textContent = intercept.toFixed(1);
    $("#ml-reg-prediction").textContent = predictedY.toFixed(2);
    $("#ml-reg-equation").textContent = "ŷ = " + intercept.toFixed(1) + " + (" + slope.toFixed(1) + " × " + x + ")";
    $("#ml-reg-slope-out").textContent = slope.toFixed(1);
    $("#ml-reg-intercept-out").textContent = intercept.toFixed(1);
    $("#ml-reg-y-out").textContent = predictedY.toFixed(2);
  }

  ["ml-reg-x", "ml-reg-slope", "ml-reg-intercept"].forEach((id) => {
    $("#" + id).addEventListener("input", drawRegression);
  });
  $("#ml-reg-reset").addEventListener("click", () => {
    $("#ml-reg-x").value = "6";
    $("#ml-reg-slope").value = "4";
    $("#ml-reg-intercept").value = "5";
    drawRegression();
  });
  drawRegression();

  /* ML pipeline explainer */
  const pipelineStages = [
    {
      title: "Collect Data",
      label: "STAGE 01 / DATA COLLECTION",
      body: "Gather relevant, representative examples. Each row may contain features such as age, size or price, and a label when supervised learning is used."
    },
    {
      title: "Preprocess Data",
      label: "STAGE 02 / DATA PREPARATION",
      body: "Inspect missing values, duplicates and outliers. Encode categorical values, scale numerical features when appropriate, and split data into training and testing sets without leakage."
    },
    {
      title: "Train Model",
      label: "STAGE 03 / LEARNING",
      body: "Choose an algorithm and fit it to the training data. Classification learns to predict categories; regression learns to estimate numerical values."
    },
    {
      title: "Evaluate",
      label: "STAGE 04 / VALIDATION",
      body: "Evaluate on held-out data. Classification can use precision, recall and F1; regression can use MAE, RMSE and R². Compare against a baseline and check for overfitting."
    },
    {
      title: "Predict",
      label: "STAGE 05 / INFERENCE",
      body: "Apply the same preprocessing steps to new observations, generate predictions and monitor model performance. A real deployment also needs testing, versioning and ongoing monitoring."
    }
  ];
  let pipelineIndex = 0;

  function renderPipeline() {
    const nodes = $$(".ml-pipeline-node");
    nodes.forEach((node, index) => {
      node.classList.toggle("active", index === pipelineIndex);
      node.classList.toggle("complete", index < pipelineIndex);
      node.setAttribute("aria-current", index === pipelineIndex ? "step" : "false");
    });
    const stage = pipelineStages[pipelineIndex];
    $("#ml-pipeline-detail").replaceChildren();
    const label = document.createElement("span");
    label.className = "ml-kicker";
    label.textContent = stage.label;
    const title = document.createElement("h3");
    title.textContent = stage.title;
    const body = document.createElement("p");
    body.textContent = stage.body;
    $("#ml-pipeline-detail").append(label, title, body);
    $("#ml-pipeline-counter").textContent = "Stage " + (pipelineIndex + 1) + " of " + pipelineStages.length;
    $("#ml-pipeline-prev").disabled = pipelineIndex === 0;
    $("#ml-pipeline-next").textContent = pipelineIndex === pipelineStages.length - 1 ? "Start Again ↺" : "Next Stage →";
  }

  $("#ml-pipeline-prev").addEventListener("click", () => {
    pipelineIndex = Math.max(0, pipelineIndex - 1);
    renderPipeline();
  });
  $("#ml-pipeline-next").addEventListener("click", () => {
    pipelineIndex = pipelineIndex === pipelineStages.length - 1 ? 0 : pipelineIndex + 1;
    renderPipeline();
  });
  $$(".ml-pipeline-node").forEach((node) => {
    node.tabIndex = 0;
    node.setAttribute("role", "button");
    node.setAttribute("aria-label", "View pipeline stage " + (Number(node.dataset.stage) + 1));
    const selectStage = () => {
      pipelineIndex = Number(node.dataset.stage);
      renderPipeline();
    };
    node.addEventListener("click", selectStage);
    node.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectStage();
      }
    });
  });
  renderPipeline();
})();
