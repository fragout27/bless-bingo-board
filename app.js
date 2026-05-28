import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getDatabase,
  ref,
  onValue,
  set,
  remove,
  serverTimestamp,
  get
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const BOARD_ITEMS = window.BINGO_ITEMS ?? [];
const PRESET_COLORS = ["#ef4444", "#f97316", "#facc15", "#22c55e", "#14b8a6", "#3b82f6", "#8b5cf6", "#ec4899", "#ffffff", "#94a3b8"];
const DEFAULT_COLOR = "#3b82f6";
const MAX_PROOF_URL_LENGTH = 500;

const elements = {
  setupWarning: document.querySelector("#setupWarning"),
  board: document.querySelector("#bingoBoard"),
  status: document.querySelector("#boardStatus"),
  totalPoints: document.querySelector("#totalPoints"),
  possiblePoints: document.querySelector("#possiblePoints"),
  name: document.querySelector("#playerName"),
  color: document.querySelector("#playerColor"),
  presetColors: document.querySelector("#presetColors"),
  saveProfile: document.querySelector("#saveProfileBtn"),
  clearMine: document.querySelector("#clearMineBtn"),
  participants: document.querySelector("#participantsList"),
  exportBtn: document.querySelector("#exportBtn"),
  copyLink: document.querySelector("#copyLinkBtn")
};

const boardId = new URLSearchParams(window.location.search).get("board") || "main";
const participantId = getOrCreateParticipantId();
let database = null;
let boardState = { participants: {}, cells: {} };
let profile = readProfile();

elements.name.value = profile.name;
elements.color.value = profile.color;

renderPresetColors();
renderBoard();
bootstrap();

function bootstrap() {
  if (!isFirebaseConfigured()) {
    elements.setupWarning.classList.remove("hidden");
    elements.status.textContent = "Board preview only. Firebase config is missing.";
    return;
  }

  const app = initializeApp(window.firebaseConfig);
  database = getDatabase(app);
  saveProfileToFirebase();

  onValue(ref(database, `boards/${boardId}`), snapshot => {
    boardState = snapshot.val() ?? { participants: {}, cells: {} };
    renderParticipants();
    renderBoard();
  });
}

function isFirebaseConfigured() {
  const cfg = window.firebaseConfig;
  return Boolean(
    cfg &&
    cfg.apiKey &&
    cfg.databaseURL &&
    !String(cfg.apiKey).includes("PASTE_") &&
    !String(cfg.databaseURL).includes("PASTE_")
  );
}

function getOrCreateParticipantId() {
  const existing = localStorage.getItem("osrsBingoParticipantId");
  if (existing) return existing;
  const id = crypto.randomUUID();
  localStorage.setItem("osrsBingoParticipantId", id);
  return id;
}

function readProfile() {
  const saved = JSON.parse(localStorage.getItem("osrsBingoProfile") || "{}");
  return {
    name: typeof saved.name === "string" ? saved.name : "",
    color: typeof saved.color === "string" ? saved.color : DEFAULT_COLOR
  };
}

function writeProfile(nextProfile) {
  profile = {
    name: String(nextProfile.name || "").trim().slice(0, 30),
    color: isHexColor(nextProfile.color) ? nextProfile.color : DEFAULT_COLOR
  };
  localStorage.setItem("osrsBingoProfile", JSON.stringify(profile));
}

function isHexColor(value) {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}

function cellId(index) {
  return `cell_${String(index + 1).padStart(2, "0")}`;
}

function getPointValue(item) {
  const points = Number(item?.points ?? 0);
  return Number.isFinite(points) && points > 0 ? points : 0;
}

function getTotalPossiblePoints() {
  return BOARD_ITEMS.reduce((sum, item) => sum + getPointValue(item), 0);
}

function getBoardPoints() {
  return BOARD_ITEMS.reduce((sum, item, index) => {
    const claims = getClaimsForCell(cellId(index));
    return claims.length > 0 ? sum + getPointValue(item) : sum;
  }, 0);
}

function getParticipantPoints(pid) {
  return BOARD_ITEMS.reduce((sum, item, index) => {
    const claims = getClaimsForCell(cellId(index));
    const participantClaimedTile = claims.some(claim => claim.participantId === pid);
    return participantClaimedTile ? sum + getPointValue(item) : sum;
  }, 0);
}

function getClaimsForCell(id) {
  const claimsObject = boardState.cells?.[id]?.claims ?? {};
  return Object.entries(claimsObject)
    .map(([pid, claim]) => {
      const participant = boardState.participants?.[pid] ?? {};
      return {
        participantId: pid,
        name: participant.name || "Unknown",
        color: participant.color || DEFAULT_COLOR,
        claimedAt: claim?.claimedAt || 0,
        proofUrl: typeof claim?.proofUrl === "string" ? claim.proofUrl : ""
      };
    })
    .sort((a, b) => Number(a.claimedAt || 0) - Number(b.claimedAt || 0));
}

function renderBoard() {
  const totalClaims = BOARD_ITEMS.reduce((count, _item, index) => count + getClaimsForCell(cellId(index)).length, 0);
  const claimedTiles = BOARD_ITEMS.filter((_item, index) => getClaimsForCell(cellId(index)).length > 0).length;
  const boardPoints = getBoardPoints();
  const possiblePoints = getTotalPossiblePoints();

  elements.totalPoints.textContent = String(boardPoints);
  elements.possiblePoints.textContent = `of ${possiblePoints} possible`;
  elements.status.textContent = `${claimedTiles} of ${BOARD_ITEMS.length} tiles claimed. ${boardPoints} points. ${totalClaims} total player marks.`;

  elements.board.innerHTML = BOARD_ITEMS.map((item, index) => {
    const id = cellId(index);
    const claims = getClaimsForCell(id);
    const mine = claims.some(claim => claim.participantId === participantId);
    const myClaim = claims.find(claim => claim.participantId === participantId);
    const points = getPointValue(item);
    const crossLines = claims.map((claim, claimIndex) => {
      const rotation = claimIndex % 2 === 0 ? "-32deg" : "32deg";
      const offset = ((claimIndex % 5) - 2) * 10;
      return `<span class="cross-line" style="--claim-color:${escapeHtml(claim.color)}; --rotation:${rotation}; --offset:${offset}px"></span>`;
    }).join("");
    const claimChips = claims.map(claim => `<span class="claim-chip" style="--claim-color:${escapeHtml(claim.color)}" title="${escapeHtml(claim.name)}">${escapeHtml(claim.name)}</span>`).join("");
    const proofButtons = claims
      .filter(claim => claim.proofUrl)
      .map((claim, claimIndex, proofClaims) => {
        const label = proofClaims.length === 1 ? "Copy link" : `Copy ${claim.name}`;
        return `<button class="copy-proof-btn" type="button" data-proof-url="${escapeHtml(claim.proofUrl)}" title="Copy ${escapeHtml(claim.name)}'s image link">${escapeHtml(label)}</button>`;
      })
      .join("");
    const myProofUrl = myClaim?.proofUrl || "";
    const proofHint = mine ? "Paste image link" : "Claim first or paste link";

    return `
      <article class="tile ${claims.length ? "claimed" : ""} ${mine ? "mine" : ""}" data-cell-id="${id}" data-index="${index}">
        <span class="tile-points">${points} pts</span>
        <span class="tile-number">${index + 1}</span>
        ${crossLines}
        <button class="tile-click-target" type="button" data-cell-id="${id}" aria-label="Toggle ${escapeHtml(item.title)} claim">
          <span class="tile-content">
            <span class="tile-title">${escapeHtml(item.title)}</span>
            <span class="tile-detail">${escapeHtml(item.detail)}</span>
          </span>
        </button>
        <span class="claims">${claimChips}</span>
        <div class="proof-area">
          <label class="proof-label" for="proof-${id}">Image link</label>
          <div class="proof-entry">
            <input id="proof-${id}" class="proof-input" type="url" inputmode="url" placeholder="${proofHint}" value="${escapeHtml(myProofUrl)}" data-proof-input-cell-id="${id}" />
            <button class="proof-save-btn" type="button" data-proof-cell-id="${id}">Save</button>
          </div>
          <div class="proof-links ${proofButtons ? "" : "hidden"}">${proofButtons}</div>
        </div>
      </article>
    `;
  }).join("");

  document.querySelectorAll(".tile-click-target").forEach(button => {
    button.addEventListener("click", () => toggleClaim(button.dataset.cellId));
  });

  document.querySelectorAll(".proof-save-btn").forEach(button => {
    button.addEventListener("click", () => {
      const input = button.closest(".proof-entry")?.querySelector(".proof-input");
      saveProofLink(button.dataset.proofCellId, input?.value || "");
    });
  });

  document.querySelectorAll(".proof-input").forEach(input => {
    input.addEventListener("keydown", event => {
      if (event.key === "Enter") {
        event.preventDefault();
        saveProofLink(input.dataset.proofInputCellId, input.value);
      }
    });
  });

  document.querySelectorAll(".copy-proof-btn").forEach(button => {
    button.addEventListener("click", () => copyProofLink(button.dataset.proofUrl, button));
  });
}

function renderParticipants() {
  const participants = Object.entries(boardState.participants ?? {})
    .map(([pid, participant]) => ({ pid, ...participant, points: getParticipantPoints(pid) }))
    .filter(participant => participant.name)
    .sort((a, b) => String(a.name).localeCompare(String(b.name)));

  if (!participants.length) {
    elements.participants.className = "participants-list empty-state";
    elements.participants.textContent = "No participants yet.";
    return;
  }

  elements.participants.className = "participants-list";
  elements.participants.innerHTML = participants.map(participant => `
    <div class="participant-pill">
      <span class="participant-name-wrap">
        <span class="participant-dot" style="--participant-color:${escapeHtml(participant.color || DEFAULT_COLOR)}"></span>
        <span class="participant-name">${escapeHtml(participant.name)}</span>
      </span>
      <span class="participant-actions">
        <span class="participant-score">${participant.points} pts</span>
        <button
          class="participant-remove-btn"
          type="button"
          title="Remove ${escapeHtml(participant.name)}"
          aria-label="Remove ${escapeHtml(participant.name)}"
          data-participant-id="${escapeHtml(participant.pid)}"
          data-participant-name="${escapeHtml(participant.name)}"
        >×</button>
      </span>
    </div>
  `).join("");

  elements.participants.querySelectorAll(".participant-remove-btn").forEach(button => {
    button.addEventListener("click", () => {
      removeParticipant(button.dataset.participantId, button.dataset.participantName);
    });
  });
}

function renderPresetColors() {
  elements.presetColors.innerHTML = PRESET_COLORS.map(color => `
    <button class="color-swatch" type="button" style="background:${color}" aria-label="Use ${color}" data-color="${color}"></button>
  `).join("");

  document.querySelectorAll(".color-swatch").forEach(button => {
    button.addEventListener("click", () => {
      elements.color.value = button.dataset.color;
      saveProfileFromInputs();
    });
  });
}

async function saveProfileFromInputs() {
  writeProfile({ name: elements.name.value, color: elements.color.value });
  if (!profile.name) {
    alert("Type your display name first.");
    elements.name.focus();
    return;
  }
  await saveProfileToFirebase();
}

async function saveProfileToFirebase() {
  if (!database || !profile.name) return;
  await set(ref(database, `boards/${boardId}/participants/${participantId}`), {
    name: profile.name,
    color: profile.color,
    updatedAt: serverTimestamp()
  });
}

async function toggleClaim(id) {
  if (!database) {
    alert("Firebase is not configured yet. Finish config.js first.");
    return;
  }

  writeProfile({ name: elements.name.value, color: elements.color.value });
  if (!profile.name) {
    alert("Type and save your display name first.");
    elements.name.focus();
    return;
  }

  await saveProfileToFirebase();

  const myClaimRef = ref(database, `boards/${boardId}/cells/${id}/claims/${participantId}`);
  const snapshot = await get(myClaimRef);
  if (snapshot.exists()) {
    await remove(myClaimRef);
  } else {
    await set(myClaimRef, { claimedAt: serverTimestamp() });
  }
}

async function saveProofLink(id, rawUrl) {
  if (!database) {
    alert("Firebase is not configured yet. Finish config.js first.");
    return;
  }

  writeProfile({ name: elements.name.value, color: elements.color.value });
  if (!profile.name) {
    alert("Type and save your display name first.");
    elements.name.focus();
    return;
  }

  const proofUrl = normalizeProofUrl(rawUrl);
  if (String(rawUrl || "").trim() && !proofUrl) {
    alert("Paste a valid http or https image link.");
    return;
  }

  await saveProfileToFirebase();

  const myClaimRef = ref(database, `boards/${boardId}/cells/${id}/claims/${participantId}`);
  const snapshot = await get(myClaimRef);
  const existingClaim = snapshot.val() || {};

  if (proofUrl) {
    await set(myClaimRef, {
      claimedAt: existingClaim.claimedAt || serverTimestamp(),
      proofUrl
    });
    return;
  }

  if (snapshot.exists()) {
    await set(myClaimRef, {
      claimedAt: existingClaim.claimedAt || serverTimestamp()
    });
  }
}

function normalizeProofUrl(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";

  try {
    const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const url = new URL(candidate);

    if (!["http:", "https:"].includes(url.protocol)) return "";
    const normalized = url.toString();
    return normalized.length <= MAX_PROOF_URL_LENGTH ? normalized : "";
  } catch (_error) {
    return "";
  }
}

async function copyProofLink(url, button) {
  if (!url) return;

  try {
    await navigator.clipboard.writeText(url);
    flashButtonText(button, "Copied");
  } catch (_error) {
    prompt("Copy this image link:", url);
  }
}

function flashButtonText(button, text) {
  if (!button) return;
  const original = button.textContent;
  button.textContent = text;
  setTimeout(() => {
    button.textContent = original;
  }, 1200);
}

async function clearMyMarks() {
  if (!database) return;
  if (!confirm("Remove all of your marks from this board?")) return;

  const removals = BOARD_ITEMS.map((_item, index) => remove(ref(database, `boards/${boardId}/cells/${cellId(index)}/claims/${participantId}`)));
  await Promise.all(removals);
}

async function removeParticipant(pid, participantName) {
  if (!database || !pid) return;

  const label = participantName || "this participant";
  const confirmed = confirm(`Remove ${label} from this board and delete all of their marks and proof links?`);
  if (!confirmed) return;

  const removals = [remove(ref(database, `boards/${boardId}/participants/${pid}`))];

  BOARD_ITEMS.forEach((_item, index) => {
    removals.push(remove(ref(database, `boards/${boardId}/cells/${cellId(index)}/claims/${pid}`)));
  });

  await Promise.all(removals);
}

function exportCsv() {
  const rows = [["Tile #", "Tile", "Details", "Points", "Participant", "Color", "Claimed At", "Image Link"]];

  BOARD_ITEMS.forEach((item, index) => {
    const claims = getClaimsForCell(cellId(index));
    const points = getPointValue(item);
    if (!claims.length) {
      rows.push([index + 1, item.title, item.detail, points, "", "", "", ""]);
      return;
    }

    claims.forEach(claim => {
      const date = claim.claimedAt ? new Date(Number(claim.claimedAt)).toISOString() : "";
      rows.push([index + 1, item.title, item.detail, points, claim.name, claim.color, date, claim.proofUrl || ""]);
    });
  });

  const csv = rows.map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `osrs-bingo-${boardId}-claims.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function copyShareLink() {
  const url = new URL(window.location.href);
  url.searchParams.set("board", boardId);
  await navigator.clipboard.writeText(url.toString());
  elements.copyLink.textContent = "Copied";
  setTimeout(() => { elements.copyLink.textContent = "Copy share link"; }, 1200);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

elements.saveProfile.addEventListener("click", saveProfileFromInputs);
elements.name.addEventListener("keydown", event => {
  if (event.key === "Enter") saveProfileFromInputs();
});
elements.color.addEventListener("input", () => writeProfile({ name: elements.name.value, color: elements.color.value }));
elements.clearMine.addEventListener("click", clearMyMarks);
elements.exportBtn.addEventListener("click", exportCsv);
elements.copyLink.addEventListener("click", copyShareLink);
