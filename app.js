    const DATA = window.REBIRTH_GAME_DATA || {};
    const years = Object.keys(DATA).sort();

    const els = {
      yearTabs: document.getElementById("yearTabs"),
      initialCapital: document.getElementById("initialCapital"),
      restartBtn: document.getElementById("restartBtn"),
      currentMonth: document.getElementById("currentMonth"),
      currentCapital: document.getElementById("currentCapital"),
      hitCount: document.getElementById("hitCount"),
      targetProgress: document.getElementById("targetProgress"),
      gameRoot: document.getElementById("gameRoot")
    };

    const state = {
      year: years[years.length - 1],
      initialCapital: 10000,
      capital: 10000,
      monthIndex: 0,
      selectedId: null,
      locked: false,
      finished: false,
      history: []
    };

    function dataset() {
      return DATA[state.year];
    }

    function parseCapital() {
      const value = Number(els.initialCapital.value);
      if (!Number.isFinite(value) || value <= 0) return 10000;
      return value;
    }

    function formatMoney(value) {
      if (!Number.isFinite(value)) return "--";
      const sign = value < 0 ? "-" : "";
      const abs = Math.abs(value);
      if (abs >= 100000000) return `${sign}¥${(abs / 100000000).toFixed(2)}亿`;
      if (abs >= 10000) return `${sign}¥${(abs / 10000).toFixed(2)}万`;
      return `${sign}¥${abs.toLocaleString("zh-CN", { maximumFractionDigits: 0 })}`;
    }

    function formatMoneyFull(value) {
      return `¥${value.toLocaleString("zh-CN", { maximumFractionDigits: 0 })}`;
    }

    function formatPct(rate) {
      if (!Number.isFinite(rate)) return "--";
      const pct = rate * 100;
      const sign = pct > 0 ? "+" : "";
      return `${sign}${pct.toFixed(2)}%`;
    }

    function compactDate(raw) {
      if (!raw || raw.length !== 8) return raw || "";
      return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
    }

    function startGame(year = state.year) {
      state.year = year;
      state.initialCapital = parseCapital();
      state.capital = state.initialCapital;
      state.monthIndex = 0;
      state.selectedId = null;
      state.locked = false;
      state.finished = false;
      state.history = [];
      render();
    }

    function renderYearTabs() {
      els.yearTabs.innerHTML = "";
      years.forEach((year) => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = `${year}版`;
        button.className = year === state.year ? "active" : "";
        button.addEventListener("click", () => startGame(year));
        els.yearTabs.appendChild(button);
      });
    }

    function optionClass(option) {
      if (!state.locked) return "option";
      if (option.isBest) return option.id === state.selectedId ? "option correct" : "option missed";
      if (option.id === state.selectedId) return "option wrong";
      return "option";
    }

    function renderOption(option) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = optionClass(option);
      button.disabled = state.locked;
      button.addEventListener("click", () => chooseOption(option));

      const returnClass = option.returnRate >= 0 ? "return up" : "return down";
      button.innerHTML = `
        <div class="option-top">
          <div class="stock-name">
            <strong>${escapeHtml(option.name)}</strong>
            <span>${escapeHtml(option.tsCode)}</span>
          </div>
          <span class="rank-badge">活跃 #${option.activeRank}</span>
        </div>
        <div class="meta">${escapeHtml(option.industry)} · ${escapeHtml(option.market || option.board || "A股")}</div>
        <div class="option-bottom">
          <span class="${state.locked ? returnClass : "hidden-return"}">
            ${state.locked ? formatPct(option.returnRate) : "月度收益待揭晓"}
          </span>
          <span class="meta">${state.locked ? `涨幅 #${option.returnRank}` : `交易日 ${option.tradingDays}`}</span>
        </div>
      `;
      return button;
    }

    function chooseOption(option) {
      if (state.locked || state.finished) return;
      const data = dataset();
      const month = data.months[state.monthIndex];
      const before = state.capital;
      const after = before * (1 + option.returnRate);
      state.capital = after;
      state.locked = true;
      state.selectedId = option.id;
      state.history.push({
        month: month.month,
        label: month.label,
        selected: option,
        best: month.best,
        before,
        after,
        hit: option.isBest
      });
      if (state.monthIndex >= data.months.length - 1) {
        state.finished = true;
      }
      render();
    }

    function nextMonth() {
      const data = dataset();
      if (state.finished) {
        startGame(state.year);
        return;
      }
      if (!state.locked) return;
      state.monthIndex = Math.min(state.monthIndex + 1, data.months.length - 1);
      state.locked = false;
      state.selectedId = null;
      render();
    }

    function renderStatus() {
      const data = dataset();
      const month = data?.months[state.monthIndex];
      const hits = state.history.filter((item) => item.hit).length;
      const target = data?.targetCapital || 100000000;
      els.currentMonth.textContent = month ? month.label : "--";
      els.currentCapital.textContent = formatMoney(state.capital);
      els.hitCount.textContent = `${hits}/${state.history.length || data?.months.length || 0}`;
      els.targetProgress.textContent = `${Math.min(9999, (state.capital / target) * 100).toFixed(2)}%`;
    }

    function renderGame() {
      const data = dataset();
      if (!data) {
        els.gameRoot.innerHTML = `
          <section class="empty-state">
            <h2>数据未生成</h2>
            <p>运行 scripts/build_data.py 后刷新页面。</p>
          </section>
        `;
        return;
      }

      const month = data.months[state.monthIndex];
      const last = state.history[state.history.length - 1];
      const resultText = state.locked
        ? `${last.hit ? "命中" : "未命中"}：${last.selected.name} ${formatPct(last.selected.returnRate)}`
        : "本月标的";
      const resultDetail = state.locked
        ? `最优为 ${month.best.name} ${formatPct(month.best.returnRate)}，账户 ${formatMoneyFull(last.before)} → ${formatMoneyFull(last.after)}`
        : `${compactDate(month.marketStart)} 至 ${compactDate(month.marketEnd)}，候选池 ${month.candidateCount} 只`;

      els.gameRoot.innerHTML = `
        <section class="play">
          <div class="question-panel">
            <div class="month-head">
              <h2>${escapeHtml(month.label)}</h2>
              <div class="dates">${escapeHtml(compactDate(month.marketStart))} / ${escapeHtml(compactDate(month.marketEnd))}</div>
            </div>
            <div class="options" id="options"></div>
            <div class="result-band">
              <div class="result-copy">
                <strong>${escapeHtml(resultText)}</strong>
                <span>${escapeHtml(resultDetail)}</span>
              </div>
              <button class="primary-button" id="nextBtn" type="button" ${state.locked ? "" : "disabled"}>
                ${state.finished ? "再来一次" : "下一月"}
              </button>
            </div>
          </div>
          <aside class="chart-panel">
            <div class="chart-title">
              <h2>资金曲线</h2>
              <span>${escapeHtml(data.year)} · ${escapeHtml(data.months.length)}个月</span>
            </div>
            <canvas id="capitalChart" width="720" height="500" aria-label="资金曲线"></canvas>
            <div class="legend">
              <span><i class="key"></i> 当前路线</span>
              <span><i class="key best"></i> 每月最优</span>
            </div>
          </aside>
        </section>
        ${renderHistory()}
      `;

      const optionsRoot = document.getElementById("options");
      month.options.forEach((option) => optionsRoot.appendChild(renderOption(option)));
      document.getElementById("nextBtn").addEventListener("click", nextMonth);
      drawChart();
    }

    function renderHistory() {
      if (!state.history.length) return "";
      const rows = state.history
        .map((item) => `
          <tr>
            <td>${escapeHtml(item.label)}</td>
            <td>${escapeHtml(item.selected.name)}<br><span class="meta">${escapeHtml(item.selected.tsCode)}</span></td>
            <td><span class="${item.selected.returnRate >= 0 ? "return up" : "return down"}">${formatPct(item.selected.returnRate)}</span></td>
            <td>${escapeHtml(item.best.name)}<br><span class="meta">${formatPct(item.best.returnRate)}</span></td>
            <td>${formatMoneyFull(item.after)}</td>
          </tr>
        `)
        .join("");
      return `
        <section class="history-panel">
          <div class="history-head">
            <h2>月度流水</h2>
            <span class="meta">${state.history.length} / ${dataset().months.length}</span>
          </div>
          <div class="history-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>月份</th>
                  <th>选择</th>
                  <th>收益</th>
                  <th>最优</th>
                  <th>期末资金</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        </section>
      `;
    }

    function drawChart() {
      const canvas = document.getElementById("capitalChart");
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const width = rect.width;
      const height = rect.height;
      const pad = { left: 44, right: 16, top: 18, bottom: 30 };
      ctx.clearRect(0, 0, width, height);

      const data = dataset();
      const selectedPath = [state.initialCapital];
      state.history.forEach((item) => selectedPath.push(item.after));

      const bestPath = [state.initialCapital];
      data.months.forEach((month, index) => {
        if (index < state.history.length) {
          const prev = bestPath[bestPath.length - 1];
          bestPath.push(prev * (1 + month.best.returnRate));
        }
      });

      const values = [...selectedPath, ...bestPath, data.targetCapital].filter((item) => item > 0);
      const minLog = Math.log10(Math.max(1, Math.min(...values) * 0.8));
      const maxLog = Math.log10(Math.max(...values) * 1.15);
      const maxSteps = data.months.length;
      const chartW = width - pad.left - pad.right;
      const chartH = height - pad.top - pad.bottom;

      function x(index) {
        return pad.left + (chartW * index) / maxSteps;
      }

      function y(value) {
        const log = Math.log10(Math.max(1, value));
        return pad.top + chartH - ((log - minLog) / (maxLog - minLog || 1)) * chartH;
      }

      ctx.strokeStyle = "#dce3e8";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i <= 4; i += 1) {
        const yy = pad.top + (chartH * i) / 4;
        ctx.moveTo(pad.left, yy);
        ctx.lineTo(width - pad.right, yy);
      }
      ctx.stroke();

      ctx.fillStyle = "#64727d";
      ctx.font = "12px Microsoft YaHei, sans-serif";
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      [state.initialCapital, data.targetCapital].forEach((value) => {
        const yy = y(value);
        ctx.fillText(formatMoney(value), pad.left - 8, yy);
      });

      function drawLine(path, color) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.beginPath();
        path.forEach((value, index) => {
          const xx = x(index);
          const yy = y(value);
          if (index === 0) ctx.moveTo(xx, yy);
          else ctx.lineTo(xx, yy);
        });
        ctx.stroke();
        ctx.fillStyle = color;
        path.forEach((value, index) => {
          ctx.beginPath();
          ctx.arc(x(index), y(value), 3.5, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      drawLine(bestPath, "#a86900");
      drawLine(selectedPath, "#138a54");

      ctx.strokeStyle = "#c43d3d";
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(pad.left, y(data.targetCapital));
      ctx.lineTo(width - pad.right, y(data.targetCapital));
      ctx.stroke();
      ctx.setLineDash([]);
    }

    function escapeHtml(value) {
      return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }

    function render() {
      renderYearTabs();
      renderStatus();
      renderGame();
    }

    els.restartBtn.addEventListener("click", () => startGame(state.year));
    els.initialCapital.addEventListener("change", () => startGame(state.year));
    window.addEventListener("resize", () => drawChart());

    if (years.length) {
      const selectedData = dataset();
      els.initialCapital.value = selectedData?.initialCapital || 10000;
      startGame(state.year);
    } else {
      renderStatus();
      renderGame();
    }
