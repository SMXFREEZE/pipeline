const defaults = {
  mode: "continuous",
  themes: ["customer support automation", "reduce support backlog", "AI customer experience"],
  formats: ["problem-solution", "founder-note"],
  runs: [],
  activeJob: null,
  stats: { runs: 0, queued: 0, published: 0 },
  logoData: null,
  apiBase: "http://127.0.0.1:8000",
  profile: {
    startupName: "AcmeAI",
    description: "AI support assistant that helps small teams answer customer questions, reduce backlog, and spot product issues.",
    audience: "bootstrapped founders and support leads",
    offer: "start a free trial",
    tone: "clear, energetic, trustworthy",
    intervalMinutes: "30",
    scheduledAt: "",
    platformPreset: "all",
    autoPublish: false,
    queueDrafts: true,
  },
};

const state = loadState();
let localTimer = null;

const els = {
  apiBase: document.querySelector("#apiBase"),
  backendDot: document.querySelector("#backendDot"),
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
  platformPreset: document.querySelector("#platformPreset"),
  themeInput: document.querySelector("#themeInput"),
  themeChips: document.querySelector("#themeChips"),
  autoPublish: document.querySelector("#autoPublish"),
  queueDrafts: document.querySelector("#queueDrafts"),
  startButton: document.querySelector("#startButton"),
  startButtonSide: document.querySelector("#startButtonSide"),
  stopButton: document.querySelector("#stopButton"),
  stopSide: document.querySelector("#stopSide"),
  runOnceButton: document.querySelector("#runOnceButton"),
  runOnceSide: document.querySelector("#runOnceSide"),
  engineLight: document.querySelector("#engineLight"),
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

hydrateFields();
bindEvents();
render();
checkBackend();

function hydrateFields() {
  const profile = { ...defaults.profile, ...(state.profile || {}) };
  state.profile = profile;
  els.apiBase.value = state.apiBase || defaults.apiBase;
  els.startupName.value = profile.startupName;
  els.description.value = profile.description;
  els.audience.value = profile.audience;
  els.offer.value = profile.offer;
  els.tone.value = profile.tone;
  els.intervalMinutes.value = profile.intervalMinutes;
  els.scheduledAt.value = profile.scheduledAt;
  els.platformPreset.value = profile.platformPreset;
  els.autoPublish.checked = Boolean(profile.autoPublish);
  els.queueDrafts.checked = profile.queueDrafts !== false;
}

function bindEvents() {
  document.querySelectorAll(".mode-button").forEach((button) => {
    button.addEventListener("click", () => {
      state.mode = button.dataset.mode;
      if (state.mode === "scheduled" && !els.scheduledAt.value) {
        els.scheduledAt.value = toDatetimeLocal(new Date(Date.now() + 15 * 60 * 1000));
      }
      saveStateFromForm();
      render();
    });
  });

  document.querySelectorAll(".format-card").forEach((button) => {
    button.addEventListener("click", () => {
      const format = button.dataset.format;
      state.formats = state.formats.includes(format)
        ? state.formats.filter((item) => item !== format)
        : [...state.formats, format];
      saveStateFromForm();
      renderFormats();
      renderPreview();
    });
  });

  document.querySelectorAll(".suggestions button").forEach((button) => {
    button.addEventListener("click", () => {
      addTheme(button.dataset.theme);
    });
  });

  els.themeInput.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    addTheme(els.themeInput.value.trim());
    els.themeInput.value = "";
  });

  [
    els.apiBase,
    els.startupName,
    els.description,
    els.audience,
    els.offer,
    els.tone,
    els.intervalMinutes,
    els.scheduledAt,
    els.platformPreset,
    els.autoPublish,
    els.queueDrafts,
  ].forEach((input) => {
    input.addEventListener("input", () => {
      saveStateFromForm();
      renderPreview();
    });
    input.addEventListener("change", () => {
      saveStateFromForm();
      render();
    });
  });

  els.logoInput.addEventListener("change", async () => {
    const file = els.logoInput.files?.[0];
    if (!file) return;
    state.logoData = await readFileAsDataUrl(file);
    saveStateFromForm();
    renderLogo();
    addRun("Logo updated", `${file.name} is attached to future generation briefs.`, "ready");
  });

  els.startButton.addEventListener("click", startLoop);
  els.startButtonSide.addEventListener("click", startLoop);
  els.stopButton.addEventListener("click", stopLoop);
  els.stopSide.addEventListener("click", stopLoop);
  els.runOnceButton.addEventListener("click", runOnce);
  els.runOnceSide.addEventListener("click", runOnce);
  els.clearLog.addEventListener("click", () => {
    state.runs = [];
    saveStateFromForm();
    renderTimeline();
  });
  els.copyBrief.addEventListener("click", async () => {
    await navigator.clipboard.writeText(buildBrief());
    addRun("Brief copied", "The next video brief was copied to your clipboard.", "ready");
  });
}

async function startLoop() {
  setBusy(true);
  const payload = collectPayload(true);
  try {
    const job = await apiPost("/automation/jobs", payload);
    state.activeJob = job;
    addRun("Auto loop started", describeBackendJob(job), "running");
    setConnection(true, "Backend connected");
  } catch (error) {
    state.activeJob = localJob(payload);
    addRun("Local preview loop started", "Backend is offline. This browser will simulate the cadence until FastAPI is connected.", "local");
    startLocalPreviewTimer();
    setConnection(false, "Local preview mode");
  } finally {
    setBusy(false);
    saveStateFromForm();
    render();
  }
}

async function stopLoop() {
  setBusy(true);
  try {
    if (state.activeJob?.id && !state.activeJob.id.startsWith("local-")) {
      const stopped = await apiPost(`/automation/jobs/${state.activeJob.id}/stop`, {});
      addRun("Auto loop stopped", "The backend job is stopped.", "stopped");
      state.activeJob = stopped;
    } else if (state.activeJob) {
      addRun("Auto loop stopped", "The local preview loop is stopped.", "stopped");
    }
    state.activeJob = null;
    clearInterval(localTimer);
    localTimer = null;
  } catch (error) {
    addRun("Stop failed", error.message, "failed");
  } finally {
    setBusy(false);
    saveStateFromForm();
    render();
  }
}

async function runOnce() {
  setBusy(true);
  try {
    const jobId = state.activeJob?.id && !state.activeJob.id.startsWith("local-")
      ? state.activeJob.id
      : (await apiPost("/automation/jobs", collectPayload(false))).id;
    const run = await apiPost(`/automation/jobs/${jobId}/run-now`, {});
    recordBackendRun(run);
    setConnection(true, "Backend connected");
  } catch (error) {
    state.stats.runs += 1;
    state.stats.queued += 1;
    addRun("Local draft prepared", `Prepared one ${platformLabels().join(", ")} brief for ${els.startupName.value}.`, "queued");
  } finally {
    setBusy(false);
    saveStateFromForm();
    render();
  }
}

async function checkBackend() {
  try {
    await apiGet("/health");
    const integrations = await apiGet("/integrations");
    const openMontage = integrations.find((item) => item.key === "openmontage");
    const postiz = integrations.find((item) => item.key === "postiz");
    els.generatorStatus.textContent = titleCase(openMontage?.status || "enabled");
    els.postizStatus.textContent = titleCase(postiz?.status || "enabled");
    setConnection(true, "Backend connected");
  } catch {
    els.generatorStatus.textContent = "Configure webhook";
    els.postizStatus.textContent = "Optional";
    setConnection(false, "Local preview mode");
  }
}

function collectPayload(start) {
  if (state.mode === "scheduled" && !els.scheduledAt.value) {
    els.scheduledAt.value = toDatetimeLocal(new Date(Date.now() + 15 * 60 * 1000));
  }
  const scheduledValue = els.scheduledAt.value;
  return {
    startup_name: els.startupName.value.trim() || "Untitled startup",
    description: els.description.value.trim(),
    audience: els.audience.value.trim(),
    offer: els.offer.value.trim(),
    tone: els.tone.value,
    keywords: state.themes.length ? state.themes : [els.startupName.value.trim() || "startup"],
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
  renderMode();
  renderFormats();
  renderChips();
  renderLogo();
  renderEngine();
  renderPreview();
  renderTimeline();
}

function renderMode() {
  document.querySelectorAll(".mode-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === state.mode);
  });
  els.intervalWrap.classList.toggle("is-hidden", state.mode === "scheduled");
  els.scheduledWrap.classList.toggle("is-hidden", state.mode !== "scheduled");
}

function renderFormats() {
  document.querySelectorAll(".format-card").forEach((button) => {
    button.classList.toggle("selected", state.formats.includes(button.dataset.format));
  });
}

function renderChips() {
  els.themeChips.innerHTML = "";
  state.themes.forEach((theme) => {
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.innerHTML = `<span>${escapeHtml(theme)}</span><button type="button" aria-label="Remove ${escapeHtml(theme)}">x</button>`;
    chip.querySelector("button").addEventListener("click", () => {
      state.themes = state.themes.filter((item) => item !== theme);
      saveStateFromForm();
      renderChips();
      renderPreview();
    });
    els.themeChips.appendChild(chip);
  });
}

function renderLogo() {
  els.logoPreview.innerHTML = state.logoData
    ? `<img alt="Startup logo preview" src="${state.logoData}" />`
    : "Logo";
}

function renderEngine() {
  const active = state.activeJob && state.activeJob.status !== "stopped" && state.activeJob.status !== "completed";
  els.engineLight.className = `state-dot ${active ? "running" : ""}`;
  els.orbState.textContent = active ? "Loop running" : "Stopped";
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
          <strong>No activity yet</strong>
          <p>Generate once, start the loop, or schedule a run.</p>
          <small>waiting</small>
        </div>
      </div>`;
    return;
  }
  state.runs.slice(0, 10).forEach((run) => {
    const item = document.createElement("div");
    item.className = "timeline-item";
    item.innerHTML = `
      <span class="timeline-dot"></span>
      <div>
        <strong>${escapeHtml(run.title)}</strong>
        <p>${escapeHtml(run.message)}</p>
        <small>${escapeHtml(run.status)} | ${new Date(run.at).toLocaleString()}</small>
      </div>`;
    els.timeline.appendChild(item);
  });
}

function addTheme(theme) {
  const clean = String(theme || "").trim();
  if (!clean || state.themes.includes(clean)) return;
  state.themes.push(clean);
  saveStateFromForm();
  renderChips();
  renderPreview();
}

function addRun(title, message, status) {
  state.runs.unshift({ title, message, status, at: new Date().toISOString() });
  state.runs = state.runs.slice(0, 50);
  saveStateFromForm();
  renderTimeline();
}

function recordBackendRun(run) {
  state.stats.runs += 1;
  state.stats.queued += run.candidates?.length || 0;
  if (/scheduled posts:\s*[1-9]/i.test(run.message || "")) {
    state.stats.published += 1;
  }
  addRun("Backend run complete", run.message || "The backend run completed.", run.status || "done");
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

function describeBackendJob(job) {
  if (job.mode === "scheduled") {
    return job.next_run_at
      ? `Scheduled for ${new Date(job.next_run_at).toLocaleString()}.`
      : "Scheduled. Waiting for backend to assign the next run.";
  }
  return job.next_run_at
    ? `Next run ${new Date(job.next_run_at).toLocaleString()}.`
    : "Loop started. Waiting for backend to assign the next run.";
}

function nextRunLabel(job) {
  if (!job.next_run_at) return "Waiting for next trigger";
  return `Next run ${new Date(job.next_run_at).toLocaleString()}`;
}

function platformLabels() {
  const preset = els.platformPreset.value;
  if (preset === "all") return ["tiktok", "instagram_reels", "youtube_shorts"];
  return [preset];
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
  return clean.length > 108 ? `${clean.slice(0, 105)}...` : clean;
}

function setConnection(connected, text) {
  els.connectionPill.textContent = text;
  els.backendDot.className = `status-dot ${connected ? "ok" : "warn"}`;
}

function setBusy(isBusy) {
  [els.startButton, els.startButtonSide, els.runOnceButton, els.runOnceSide, els.stopButton, els.stopSide].forEach((button) => {
    button.disabled = isBusy;
  });
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

function saveStateFromForm() {
  state.apiBase = els.apiBase.value || defaults.apiBase;
  state.profile = {
    startupName: els.startupName.value,
    description: els.description.value,
    audience: els.audience.value,
    offer: els.offer.value,
    tone: els.tone.value,
    intervalMinutes: els.intervalMinutes.value,
    scheduledAt: els.scheduledAt.value,
    platformPreset: els.platformPreset.value,
    autoPublish: els.autoPublish.checked,
    queueDrafts: els.queueDrafts.checked,
  };
  localStorage.setItem("dedomena-video-studio", JSON.stringify(state));
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem("dedomena-video-studio") || "{}");
    return {
      ...defaults,
      ...saved,
      profile: { ...defaults.profile, ...(saved.profile || {}) },
      stats: { ...defaults.stats, ...(saved.stats || {}) },
    };
  } catch {
    return { ...defaults };
  }
}

function titleCase(value) {
  return String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function toDatetimeLocal(date) {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
