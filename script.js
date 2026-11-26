(function () {
  "use strict";

  var SHIPS = {
    sloop:  { label: "Sloop",  crew: 2 },
    brig:   { label: "Brig",   crew: 3 },
    galion: { label: "Galion", crew: 4 }
  };
  var MIN_PLAYERS = 2, MAX_PLAYERS = 40;
  var STORAGE_KEY = "scrim-random-v1";

  var $ = function (id) { return document.getElementById(id); };
  var fieldsEl = $("fields"), countEl = $("count"), summaryEl = $("summary");
  var errorEl = $("error"), resultsEl = $("results"), teamsEl = $("teams");
  var noteEl = $("note"), statusEl = $("status");

  var names = [];
  var lastTeams = null;

  /* ---------- Stockage (facultatif, ne casse rien s'il échoue) ---------- */
  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        ship: currentShip(), count: getCount(), names: readNames()
      }));
    } catch (e) { /* ignoré */ }
  }
  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var data = JSON.parse(raw);
      if (data.ship && SHIPS[data.ship]) {
        document.querySelector('input[name="ship"][value="' + data.ship + '"]').checked = true;
      }
      if (typeof data.count === "number") countEl.value = clamp(data.count);
      if (Array.isArray(data.names)) names = data.names.map(String);
    } catch (e) { /* ignoré */ }
  }

  /* ---------- Utilitaires ---------- */
  function clamp(n) {
    n = parseInt(n, 10);
    if (isNaN(n)) n = 8;
    return Math.min(MAX_PLAYERS, Math.max(MIN_PLAYERS, n));
  }
  function getCount() { return clamp(countEl.value); }
  function currentShip() {
    return document.querySelector('input[name="ship"]:checked').value;
  }
  function readNames() {
    return Array.prototype.map.call(fieldsEl.querySelectorAll("input"), function (i) {
      return i.value.trim();
    });
  }
  function randInt(max) {
    var buf = new Uint32Array(1);
    window.crypto.getRandomValues(buf);
    return buf[0] % max;
  }
  function shuffled(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = randInt(i + 1);
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function plural(n, one, many) { return n + " " + (n > 1 ? many : one); }

  /* Répartition équilibrée : jamais plus que la taille d'équipage du bateau */
  function plan(count, crew) {
    var teams = Math.ceil(count / crew);
    var base = Math.floor(count / teams);
    var extra = count % teams;
    var sizes = [];
    for (var i = 0; i < teams; i++) sizes.push(base + (i < extra ? 1 : 0));
    return sizes;
  }

  /* ---------- Rendu ---------- */
  function renderSummary() {
    var ship = SHIPS[currentShip()];
    var count = getCount();
    var sizes = plan(count, ship.crew);
    var text = plural(count, "joueur", "joueurs") + " · " + ship.label + " · ";
    var even = sizes.every(function (s) { return s === sizes[0]; });
    if (sizes.length === 1) {
      text += "1 seule équipe : ajoute des joueurs pour faire un scrim.";
    } else if (even) {
      text += sizes.length + " équipes de " + sizes[0];
    } else {
      text += sizes.length + " équipes (" + sizes.join(", ") + " joueurs)";
    }
    summaryEl.textContent = text;
  }

  function renderFields() {
    var count = getCount();
    var current = fieldsEl.querySelectorAll("input").length ? readNames() : names;
    fieldsEl.innerHTML = "";
    for (var i = 0; i < count; i++) {
      var input = document.createElement("input");
      input.type = "text";
      input.maxLength = 30;
      input.placeholder = "Joueur " + (i + 1);
      input.setAttribute("aria-label", "Nom du joueur " + (i + 1));
      input.autocomplete = "off";
      input.value = current[i] || "";
      input.dataset.index = i;
      fieldsEl.appendChild(input);
    }
    names = current;
  }

  function renderTeams(teams, ship) {
    teamsEl.innerHTML = "";
    teams.forEach(function (members, idx) {
      var card = document.createElement("div");
      card.className = "team reveal";
      card.style.animationDelay = (idx * 60) + "ms";

      var h = document.createElement("h3");
      h.textContent = "Équipe " + (idx + 1);
      var small = document.createElement("small");
      small.textContent = ship.label;
      h.appendChild(small);

      var ul = document.createElement("ul");
      members.forEach(function (name) {
        var li = document.createElement("li");
        li.textContent = name;
        ul.appendChild(li);
      });

      card.appendChild(h);
      card.appendChild(ul);
      teamsEl.appendChild(card);
    });
  }

  /* ---------- Actions ---------- */
  function validate(list) {
    var seen = {};
    for (var i = 0; i < list.length; i++) {
      if (!list[i]) return "Il manque le nom du joueur " + (i + 1) + ".";
      var key = list[i].toLowerCase();
      if (seen[key]) return "Le nom « " + list[i] + " » est utilisé deux fois.";
      seen[key] = true;
    }
    return "";
  }

  function doShuffle() {
    var list = readNames();
    var msg = validate(list);
    errorEl.textContent = msg;
    if (msg) {
      var idx = list.findIndex(function (n) { return !n; });
      if (idx >= 0) fieldsEl.querySelectorAll("input")[idx].focus();
      return;
    }

    var shipKey = currentShip(), ship = SHIPS[shipKey];
    var sizes = plan(list.length, ship.crew);
    var pool = shuffled(list);
    var teams = [], pos = 0;
    sizes.forEach(function (size) {
      teams.push(pool.slice(pos, pos + size));
      pos += size;
    });

    lastTeams = { teams: teams, ship: ship };
    renderTeams(teams, ship);

    var even = sizes.every(function (s) { return s === sizes[0]; });
    if (sizes.length === 1) {
      noteEl.textContent = "Une seule équipe : il faut au moins deux équipages pour un scrim.";
      noteEl.hidden = false;
    } else if (!even) {
      noteEl.textContent = "Le nombre de joueurs ne tombe pas juste : les équipes ne sont pas toutes de la même taille.";
      noteEl.hidden = false;
    } else {
      noteEl.hidden = true;
    }

    resultsEl.hidden = false;
    statusEl.textContent = "";
    save();
    resultsEl.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function copyResult() {
    if (!lastTeams) return;
    var text = lastTeams.teams.map(function (members, i) {
      return "Équipe " + (i + 1) + " (" + lastTeams.ship.label + ") : " + members.join(", ");
    }).join("\n");

    function done(ok) {
      statusEl.textContent = ok ? "Résultat copié." : "Impossible de copier, sélectionne le texte à la main.";
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
    } else {
      done(false);
    }
  }

  function setCount(n) {
    countEl.value = clamp(n);
    onConfigChange();
  }

  function onConfigChange() {
    countEl.value = getCount();
    renderFields();
    renderSummary();
    errorEl.textContent = "";
    save();
  }

  /* ---------- Événements ---------- */
  $("minus").addEventListener("click", function () { setCount(getCount() - 1); });
  $("plus").addEventListener("click", function () { setCount(getCount() + 1); });
  countEl.addEventListener("change", onConfigChange);
  document.querySelectorAll('input[name="ship"]').forEach(function (r) {
    r.addEventListener("change", function () { renderSummary(); save(); });
  });

  fieldsEl.addEventListener("input", function () { errorEl.textContent = ""; save(); });
  fieldsEl.addEventListener("keydown", function (e) {
    if (e.key !== "Enter" || e.target.tagName !== "INPUT") return;
    e.preventDefault();
    var inputs = fieldsEl.querySelectorAll("input");
    var i = parseInt(e.target.dataset.index, 10);
    if (i < inputs.length - 1) inputs[i + 1].focus();
    else doShuffle();
  });

  $("shuffle").addEventListener("click", doShuffle);
  $("reshuffle").addEventListener("click", doShuffle);
  $("copy").addEventListener("click", copyResult);
  $("clear").addEventListener("click", function () {
    fieldsEl.querySelectorAll("input").forEach(function (i) { i.value = ""; });
    errorEl.textContent = "";
    resultsEl.hidden = true;
    save();
    var first = fieldsEl.querySelector("input");
    if (first) first.focus();
  });

  /* ---------- Démarrage ---------- */
  load();
  countEl.value = getCount();
  renderFields();
  renderSummary();
})();