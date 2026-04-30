const defaults = {
  mode: "continuous",
  themes: ["customer support automation", "reduce support backlog", "AI customer experience"],
  formats: ["problem-solution", "founder-note"],
  runs: [],
  activeJob: null,
  stats: { runs: 0, queued: 0, published: 0 },
  logoData: null,
};

const state = loadState();
let localTimer = null;

const els = {
  apiBase: document.querySelector("#apiBase"),
  connectionPill: document.querySelector("#connectionPill"),
  generatorStatus: document.querySelector("#generatorStatus"),
  postizStatus: document.querySelector("#postizStatus"),
  logoInput: document.querySelector("#logoInput"),
  logoPreview: document.querySelector("#logoPreview"),
  startupName: document.querySelector("#startupName"),
  description: document.querySelector("#description"),
  audience: document.querySelector("#audience"),
  offer: document.querySelector("#offer"),
  tone: document.querySelector("#tone"),
  intervalMinutes: document.querySelector("#intervalMinutes"),
  scheduledAt: document.querySelector("#scheduledAt"),
  scheduledWrap: document.querySelector("#scheduledWrap"),
  intervalWrap: document.querySelector("#intervalWrap"),
  modeLabel: document.querySelector("#modeLabel"),
  themeInput: document.querySelector("#themeInput"),
  themeChips: document.querySelector("#themeChips"),
  autoPublish: document.querySelector("#autoPublish"),
  queueDrafts: document.querySelector("#queueDrafts"),
  startButton: document.querySelector("#startButton"),
  stopButton: document.querySelector("#stopButton"),
  runOnceButton: document.querySelector("#runOnceButton"),
  runOnceSide: document.querySelector("#runOnceSide"),
  stopSide: document.querySelector("#stopSide"),
  refreshStatus: document.querySelector("#refreshStatus"),
  engineLight: document.querySelector("#engineLight"),
  controlOrb: document.querySelector("#controlOrb"),
  orbState: document.querySelector("#orbState"),
  nextRun: document.querySelector("#nextRun"),
  runCount: document.querySelector("#runCount"),
  queuedCount: document.querySelector("#queuedCount"),
  publishedCount: document.querySelector("#publishedCount"),
  frameBrand: document.querySelector("#frameBrand"),
  frameTitle: document.querySelector("#frameTitle"),
  frameCaption: document.querySelector("#frameCaption"),
  frameCta: document.querySelector("#frameCta"),
  timeline: document.querySelector("#timeline"),
  copyBrief: document.querySelector("#copyBrief"),
  clearLog: document.querySelector("#clearLog"),
};

bindEvents();
render();
checkBackend();

function bindEvents() {
  document.querySelectorAll(".segment").forEach((button) => {
    button.addEventListener("click", () => {
      state.mode = button.dataset.mode;
      saveState();
      render();
    });
  });

  document.querySelectorAll(".format-card").forEach((button) => {
    button.addEventListener("click", () => {
      const format = button.dataset.format;
      state.formats = state.formats.includes(format)
        ? state.formats.filter((item) => item !== format)
        : [...state.formats, format];
      saveState();
      render();
    });
  });

  els.themeInput.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    const value = els.themeInput.value.trim();
    if (!value || state.themes.includes(value)) return;
    state.themes.push(value);
    els.themeInput.value = "";
    saveState();
    render();
  });

  [els.startupName, els.description, els.audience, els.offer, els.tone].forEach((input) => {
    input.addEventListener("input", () => {
      saveState();
      renderPreview();
    });
  });

  els.logoInput.addEventListener("change", async () => {
    const file = els.logoInput.files?.[0];
    if (!file) return;
    state.logoData = await readFileAsDataUrl(file);
    saveState();
    renderLogo();
    addRun("Logo updated", `${file.name} is now attached to future generation briefs.`, "queued");
  });

  els.startButton.addEventListener("click", startLoop);
  els.stopButton.addEventListener("click", stopLoop);
  els.runOnceButton.addEventListener("click", runOnce);
  els.runOnceSide.addEventListener("click", runOnce);
  els.stopSide.addEventListener("click", stopLoop);
  els.refreshStatus.addEventListener("click", checkBackend);
  els.clearLog.addEventListener("click", () => {
    state.runs = [];
    saveState();
    renderTimeline();
  });
  els.copyBrief.addEventListener("click", async () => {
    await navigator.clipboard.writeText(buildBrief());
    addRun("Brief copied", "The next video prompt was copied to your clipboard.", "queued");
  });
}

async function startLoop() {
  const payload = collectPayload(true);
  try {
    const job = await apiPost("/automation/jobs", payload);
    state.activeJob = job;
    addRun("Automation started", backendJobMessage(job), "running");
    setConnection("Backend connected", true);
  } catch (error) {
    state.activeJob = localJob(payload);
    addRun("Local automation preview started", "Backend is offline, so this browser will simulate the cadence until you connect FastAPI.", "running");
    startLocalPreviewTimer();
    setConnection("Local mode", false);
  }
  saveState();
  render();
}

async function stopLoop() {
  if (state.activeJob?.id && !state.activeJob.id.startsWith("local-")) {
    try {
      const stopped = await apiPost(`/automation/jobs/${state.activeJob.id}/stop`, {});
      state.activeJob = stopped;
      addRun("Automation stopped", "The backend job is stopped.", "stopped");
    } catch (error) {
      addRun("Stop request failed", error.message, "failed");
    }
  } else if (state.activeJob) {
    addRun("Automation stopped", "The local preview loop is stopped.", "stopped");
  }
  state.activeJob = null;
  clearInterval(localTimer);
  localTimer = null;
  saveState();
  render();
}

async function runOnce() {
  if (state.activeJob?.id && !state.activeJob.id.startsWith("local-")) {
    try {
      const run = await apiPost(`/automation/jobs/${state.activeJob.id}/run-now`, {});
      state.stats.runs += 1;
      state.stats.queued += run.candidates?.length || 0;
      addRun("Backend run complete", run.message, run.status);
      setConnection("Backend connected", true);
    } catch (error) {
      addRun("Run failed", error.message, "failed");
    }
  } else {
    try {
      const job = await apiPost("/automation/jobs", collectPayload(false));
      const run = await apiPost(`/automation/jobs/${job.id}/run-now`, {});
      state.stats.runs += 1;
      state.stats.queued += run.candidates?.length || 0;
      addRun("Backend run complete", run.message, run.status);
      setConnection("Backend connected", true);
    } catch (error) {
      state.stats.runs += 1;
      state.stats.queued += 1;
      addRun("Generated local draft", `Prepared one ${platformLabels().join(", ")} video brief for ${els.startupName.value}.`, "queued");
    }
  }
  saveState();
  render();
}

async function checkBackend() {
  try {
    await apiGet("/health");
    const integrations = await apiGet("/integrations");
    const openMontage = integrations.find((item) => item.key === "openmontage");
    const postiz = integrations.find((item) => item.key === "postiz");
    els.generatorStatus.textContent = openMontage?.status || "enabled";
    els.postizStatus.textContent = postiz?.status || "enabled";
    setConnection("Backend connected", true);
  } catch {
    els.generatorStatus.textContent = "configure env";
    els.postizStatus.textContent = "optional";
    setConnection("Local mode", false);
  }
}

function collectPayload(start) {
  const scheduledValue = els.scheduledAt.value;
  return {
    startup_name: els.startupName.value.trim() || "Untitled startup",
    description: els.description.value.trim(),
    audience: els.audience.value.trim(),
    offer: els.offer.value.trim(),
    tone: els.tone.value,
    keywords: state.themes,
    platforms: platformLabels(),
    mode: state.mode,
    interval_minutes: Number(els.intervalMinutes.value),
    scheduled_at: state.mode === "scheduled" && scheduledValue ? new Date(scheduledValue).toISOString() : null,
    auto_publish: els.autoPublish.checked,
    logo_path: state.logoData ? "uploaded-logo-reference" : null,
    start,
  };
}

function render() {
  document.querySelectorAll(".segment").forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === state.mode);
  });
  document.querySelectorAll(".format-card").forEach((button) => {
    button.classList.toggle("selected", state.formats.includes(button.dataset.format));
  });

  els.modeLabel.textContent = state.mode === "continuous" ? "Continuous" : "Scheduled";
  els.intervalWrap.classList.toggle("hidden", state.mode === "scheduled");
  els.scheduledWrap.classList.toggle("hidden", state.mode !== "scheduled");
  renderChips();
  renderLogo();
  renderEngine();
  renderPreview();
  renderTimeline();
}

function renderChips() {
  els.themeChips.innerHTML = "";
  state.themes.forEach((theme) => {
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.innerHTML = `<span>${escapeHtml(theme)}</span><button type="button" title="Remove">x</button>`;
    chip.querySelector("button").addEventListener("click", () => {
      state.themes = state.themes.filter((item) => item !== theme);
      saveState();
      renderChips();
      renderPreview();
    });
    els.themeChips.appendChild(chip);
  });
}

function renderLogo() {
  els.logoPreview.innerHTML = state.logoData
    ? `<img alt="Startup logo preview" src="${state.logoData}" />`
    : "<span>Σ</span>";
}

function renderEngine() {
  const active = state.activeJob && state.activeJob.status !== "stopped" && state.activeJob.status !== "completed";
  els.engineLight.className = `status-light ${active ? "running" : "stopped"}`;
  els.orbState.textContent = active ? "Running" : "Stopped";
  els.nextRun.textContent = active ? nextRunLabel(state.activeJob) : "No active cadence";
  els.runCount.textContent = state.stats.runs;
  els.queuedCount.textContent = state.stats.queued;
  els.publishedCount.textContent = state.stats.published;
}

function renderPreview() {
  const brand = els.startupName.value.trim() || "Startup";
  const theme = state.themes[0] || "startup growth";
  els.frameBrand.textContent = brand;
  els.frameTitle.textContent = theme;
  els.frameCaption.textContent = summarize(els.description.value);
  els.frameCta.textContent = els.offer.value.trim() || "learn more";
}

function renderTimeline() {
  els.timeline.innerHTML = "";
  if (state.runs.length === 0) {
    els.timeline.innerHTML = `
      <div class="timeline-item">
        <span class="timeline-dot"></span>
        <div>
          <strong>No runs yet</strong>
          <p>Start the loop, schedule a time, or run once.</p>
          <small>waiting</small>
        </div>
      </div>`;
    return;
  }
  state.runs.slice(0, 12).forEach((run) => {
    const item = document.createElement("div");
    item.className = "timeline-item";
    item.innerHTML = `
      <span class="timeline-dot"></span>
      <div>
        <strong>${escapeHtml(run.title)}</strong>
        <p>${escapeHtml(run.message)}</p>
        <small>${escapeHtml(run.status)} · ${new Date(run.at).toLocaleString()}</small>
      </div>`;
    els.timeline.appendChild(item);
  });
}

function addRun(title, message, status) {
  state.runs.unshift({ title, message, status, at: new Date().toISOString() });
  state.runs = state.runs.slice(0, 50);
  saveState();
  renderTimeline();
}

function startLocalPreviewTimer() {
  clearInterval(localTimer);
  const ms = Math.max(Number(els.intervalMinutes.value), 15) * 60 * 1000;
  localTimer = setInterval(runOnce, ms);
}

function localJob(payload) {
  const now = Date.now();
  const next = payload.mode === "scheduled" && payload.scheduled_at
    ? new Date(payload.scheduled_at)
    : new Date(now + Number(payload.interval_minutes) * 60 * 1000);
  return {
    id: `local-${now}`,
    status: "active",
    mode: payload.mode,
    next_run_at: next.toISOString(),
    interval_minutes: payload.interval_minutes,
  };
}

function backendJobMessage(job) {
  return job.mode === "scheduled"
    ? `Scheduled for ${new Date(job.next_run_at).toLocaleString()}.`
    : `Next run ${new Date(job.next_run_at).toLocaleString()}.`;
}

function nextRunLabel(job) {
  if (!job.next_run_at) return "Waiting for next trigger";
  return `Next run ${new Date(job.next_run_at).toLocaleString()}`;
}

function platformLabels() {
  return [...document.querySelectorAll(".platform:checked")].map((input) => input.value);
}

function buildBrief() {
  return [
    `Startup: ${els.startupName.value}`,
    `Description: ${els.description.value}`,
    `Audience: ${els.audience.value}`,
    `Offer: ${els.offer.value}`,
    `Tone: ${els.tone.value}`,
    `Themes: ${state.themes.join(", ")}`,
    `Formats: ${state.formats.join(", ")}`,
    `Platforms: ${platformLabels().join(", ")}`,
    `Mode: ${state.mode}`,
  ].join("\n");
}

function summarize(value) {
  const clean = value.trim().replace(/\s+/g, " ");
  if (!clean) return "A sharp original short about what your startup helps people do.";
  return clean.length > 92 ? `${clean.slice(0, 89)}...` : clean;
}

function setConnection(text, connected) {
  els.connectionPill.textContent = text;
  els.connectionPill.style.color = connected ? "rgba(51,214,159,0.95)" : "rgba(245,184,91,0.95)";
  els.connectionPill.style.borderColor = connected ? "rgba(51,214,159,0.24)" : "rgba(245,184,91,0.24)";
}

async function apiGet(path) {
  const response = await fetch(`${els.apiBase.value.replace(/\/$/, "")}${path}`);
  if (!response.ok) throw new Error(`GET ${path} failed`);
  return response.json();
}

async function apiPost(path, payload) {
  const response = await fetch(`${els.apiBase.value.replace(/\/$/, "")}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || data.error || `POST ${path} failed`);
  return data;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadState() {
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem("dedomena-video-studio") || "{}") };
  } catch {
    return { ...defaults };
  }
}

function saveState() {
  localStorage.setItem("dedomena-video-studio", JSON.stringify(state));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
