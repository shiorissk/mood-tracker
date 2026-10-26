import { request } from "./api.js";

/**
 * Everything that differs between the mood and the symptom tracker.
 * Badge classes are written out in full: Tailwind only generates classes it finds in the source.
 */
const TRACKERS = {
    mood: {
        hash: "#mood",
        formTitle: "How are you feeling?",
        listTitle: "Recent check-ins",
        lookupLabel: "Mood",
        lookupPath: "/moods",
        lookupKey: "moods",
        newLabel: "+ New mood",
        newPlaceholder: "e.g. grateful",
        entriesPath: "/mood-entries",
        entriesKey: "moodEntries",
        idField: "moodId",
        nameField: "moodName",
        scoreField: "feelingScore",
        scoreLegend: "Feeling score",
        scoreHint: "(1 = bad, 5 = good, optional)",
        submitLabel: "Save check-in",
        noun: "check-in",
        emptyText: "No check-ins yet.",
        // 5 = feels good
        badgeClass(score) {
            if (score >= 4) return "bg-emerald-100 text-emerald-800";
            if (score === 3) return "bg-slate-100 text-slate-700";
            return "bg-rose-100 text-rose-800";
        },
    },
    symptom: {
        hash: "#symptoms",
        formTitle: "Log a symptom",
        listTitle: "Recent symptoms",
        lookupLabel: "Symptom",
        lookupPath: "/symptoms",
        lookupKey: "symptoms",
        newLabel: "+ New symptom",
        newPlaceholder: "e.g. headache",
        entriesPath: "/symptom-entries",
        entriesKey: "symptomEntries",
        idField: "symptomId",
        nameField: "symptomName",
        scoreField: "intensity",
        scoreLegend: "Intensity",
        scoreHint: "(1 = mild, 5 = severe, optional)",
        submitLabel: "Save symptom",
        noun: "symptom entry",
        emptyText: "No symptoms logged yet.",
        // 5 = most severe — the opposite direction of feelingScore
        badgeClass(score) {
            if (score >= 4) return "bg-rose-100 text-rose-800";
            if (score === 3) return "bg-amber-100 text-amber-800";
            return "bg-slate-100 text-slate-700";
        },
    },
};

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });

// -- Helpers ----------------------------------------------------------------

/** Create an element. Text is always set via textContent, never parsed as HTML. */
function el(tag, { className, text, attrs } = {}, ...children) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    for (const [name, value] of Object.entries(attrs ?? {})) node.setAttribute(name, value);
    node.append(...children);
    return node;
}

function showError(container, message) {
    container.textContent = message;
    container.hidden = false;
}

function clearError(container) {
    container.textContent = "";
    container.hidden = true;
}

/** Names are stored lowercase by the API; capitalize only for display */
function displayName(name) {
    return name.charAt(0).toUpperCase() + name.slice(1);
}

// -- Tracker (one per tab) --------------------------------------------------

function createTracker(kind, config) {
    const panel = document.querySelector("#tracker-template").content.firstElementChild.cloneNode(true);
    const $ = selector => panel.querySelector(selector);

    const els = {
        form: $(".js-entry-form"),
        submit: $(".js-submit"),
        formError: $(".js-form-error"),
        lookupLabel: $(".js-lookup-label"),
        lookupSelect: $(".js-lookup-select"),
        triggerLabel: $(".js-trigger-label"),
        triggerInput: $(".js-trigger-input"),
        newToggle: $(".js-new-toggle"),
        newPanel: $(".js-new-panel"),
        newInput: $(".js-new-input"),
        newAdd: $(".js-new-add"),
        newCancel: $(".js-new-cancel"),
        newError: $(".js-new-error"),
        list: $(".js-entry-list"),
        count: $(".js-entry-count"),
        listError: $(".js-list-error"),
    };

    // Fill in the texts for this tracker
    panel.id = `panel-${kind}`;
    $(".js-form-title").textContent = config.formTitle;
    $(".js-list-title").textContent = config.listTitle;
    $(".js-score-legend").textContent = config.scoreLegend;
    $(".js-score-hint").textContent = config.scoreHint;
    els.lookupLabel.textContent = config.lookupLabel;
    els.newToggle.textContent = config.newLabel;
    els.newInput.placeholder = config.newPlaceholder;
    els.newInput.setAttribute("aria-label", `New ${config.lookupLabel.toLowerCase()} name`);
    els.submit.textContent = config.submitLabel;

    // Unique ids so the <label>s point at the right inputs in both panels
    els.lookupSelect.id = `${kind}-lookup`;
    els.lookupLabel.htmlFor = els.lookupSelect.id;
    els.triggerInput.id = `${kind}-trigger`;
    els.triggerLabel.htmlFor = els.triggerInput.id;

    // -- Lookup list (moods / symptoms) --

    async function loadLookup(selectedId) {
        const items = (await request(config.lookupPath))[config.lookupKey];

        const placeholderText = items.length
            ? `Choose a ${config.lookupLabel.toLowerCase()}`
            : `No ${config.lookupKey} yet — add one`;
        const placeholder = new Option(placeholderText, "", true, true);
        placeholder.disabled = true;

        els.lookupSelect.replaceChildren(placeholder, ...items.map(item => new Option(displayName(item.name), item.id)));

        if (selectedId !== undefined) {
            els.lookupSelect.value = String(selectedId);
        }
    }

    function openNew() {
        els.newPanel.hidden = false;
        els.newInput.focus();
    }

    function closeNew() {
        els.newInput.value = "";
        clearError(els.newError);
        els.newPanel.hidden = true;
    }

    async function addLookupItem() {
        clearError(els.newError);
        els.newAdd.disabled = true;
        try {
            const item = await request(config.lookupPath, {
                method: "POST",
                body: { name: els.newInput.value },
            });
            await loadLookup(item.id);   // reload and select the new item
            closeNew();
        } catch (error) {
            showError(els.newError, error.message);
        } finally {
            els.newAdd.disabled = false;
        }
    }

    // -- Entries --

    async function loadEntries() {
        clearError(els.listError);
        try {
            const entries = (await request(config.entriesPath))[config.entriesKey];
            // API returns oldest first; show newest first
            renderEntries(entries.toSorted((a, b) => b.id - a.id));
        } catch (error) {
            showError(els.listError, `Could not load entries: ${error.message}`);
        }
    }

    function renderEntries(entries) {
        els.count.textContent = entries.length;

        if (entries.length === 0) {
            els.list.replaceChildren(el("li", { className: "px-5 py-4 text-sm text-slate-500", text: config.emptyText }));
            return;
        }

        els.list.replaceChildren(...entries.map(renderEntry));
    }

    function renderEntry(entry) {
        const score = entry[config.scoreField];
        const name = displayName(entry[config.nameField]);   // the API JOINs the name in

        const heading = el("div", { className: "flex items-center gap-2 font-medium" }, name);
        if (score !== null) {
            heading.append(el("span", {
                className: `rounded-full px-2 py-0.5 text-xs font-semibold ${config.badgeClass(score)}`,
                text: `${score}/5`,
                attrs: { title: config.scoreLegend },
            }));
        }

        const details = el("div", { className: "min-w-0" }, heading);
        if (entry.trigger) {
            details.append(el("p", { className: "mt-0.5 text-sm break-words text-slate-500", text: entry.trigger }));
        }

        const time = el("time", {
            className: "text-xs text-slate-500",
            text: dateFormat.format(new Date(entry.createdAt)),
            attrs: { datetime: entry.createdAt },
        });

        const deleteButton = el("button", {
            className: "rounded-md px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-50",
            text: "Delete",
            attrs: { type: "button", "aria-label": `Delete ${name} ${config.noun}` },
        });
        deleteButton.addEventListener("click", () => deleteEntry(entry.id, deleteButton));

        const side = el("div", { className: "flex shrink-0 flex-col items-end gap-1" }, time, deleteButton);

        return el("li", { className: "flex items-start justify-between gap-4 px-5 py-4" }, details, side);
    }

    async function deleteEntry(id, button) {
        if (!confirm(`Delete this ${config.noun}?`)) return;

        button.disabled = true;
        try {
            await request(`${config.entriesPath}/${id}`, { method: "DELETE" });
            await loadEntries();
        } catch (error) {
            button.disabled = false;
            showError(els.listError, `Could not delete: ${error.message}`);
        }
    }

    // -- Form --

    async function submitEntry(event) {
        event.preventDefault();
        clearError(els.formError);

        const data = new FormData(els.form);
        const score = data.get("score");

        // The API requires real numbers: Number.isInteger("1") is false
        const body = {
            [config.idField]: Number(data.get("lookupId")),
            [config.scoreField]: score === "" ? null : Number(score),
            trigger: data.get("trigger"),   // the API trims it and stores "" as null
        };

        els.submit.disabled = true;
        try {
            await request(config.entriesPath, { method: "POST", body });
            els.form.reset();
            await loadEntries();
        } catch (error) {
            showError(els.formError, error.message);
        } finally {
            els.submit.disabled = false;
        }
    }

    // -- Wire up --

    els.form.addEventListener("submit", submitEntry);
    els.newToggle.addEventListener("click", () => (els.newPanel.hidden ? openNew() : closeNew()));
    els.newCancel.addEventListener("click", closeNew);
    els.newAdd.addEventListener("click", addLookupItem);
    els.newInput.addEventListener("keydown", event => {
        if (event.key === "Enter") {
            event.preventDefault();   // don't submit the entry form
            addLookupItem();
        }
        if (event.key === "Escape") closeNew();
    });

    async function load() {
        // Independent of each other: entries carry their own names now
        await Promise.all([
            loadLookup().catch(error => {
                showError(els.formError, `Could not load ${config.lookupKey}: ${error.message}`);
            }),
            loadEntries(),
        ]);
    }

    return { panel, load };
}

// -- Tabs -------------------------------------------------------------------

const TAB_ACTIVE = "bg-white text-slate-900 shadow-sm";
const TAB_INACTIVE = "text-slate-600 hover:text-slate-900";

const tabs = [...document.querySelectorAll(".js-tab")];
const trackers = Object.fromEntries(
    Object.entries(TRACKERS).map(([kind, config]) => [kind, createTracker(kind, config)])
);

function showTab(kind) {
    for (const tab of tabs) {
        const active = tab.dataset.kind === kind;
        tab.setAttribute("aria-selected", String(active));
        tab.setAttribute("aria-controls", `panel-${tab.dataset.kind}`);
        tab.className = `js-tab rounded-md px-4 py-1.5 ${active ? TAB_ACTIVE : TAB_INACTIVE}`;
    }
    for (const [trackerKind, tracker] of Object.entries(trackers)) {
        tracker.panel.hidden = trackerKind !== kind;
    }
}

function kindFromHash() {
    return Object.keys(TRACKERS).find(kind => TRACKERS[kind].hash === location.hash) ?? "mood";
}

// -- Start ------------------------------------------------------------------

document.querySelector(".js-panels").append(...Object.values(trackers).map(tracker => tracker.panel));

showTab(kindFromHash());
window.addEventListener("hashchange", () => showTab(kindFromHash()));

await Promise.all(Object.values(trackers).map(tracker => tracker.load()));
