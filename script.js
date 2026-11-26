(function () {
  "use strict";

  /* ==========================================================
     Configuration des bateaux
     - roles     : un de chaque = l'équipage idéal
     - dropOrder : rôles retirés en premier quand une équipe est
                   incomplète (ex. 7 joueurs en galion = 4 + 3)
     ========================================================== */
  var ROLE_LABELS = { helm: "Helm", bilge: "Bilge", flex: "Flex", mc: "MC" };

  var SHIPS = {
    sloop:  { label: "Sloop",  roles: ["helm", "mc"],                  dropOrder: ["mc", "helm"] },
    brig:   { label: "Brig",   roles: ["helm", "flex", "mc"],          dropOrder: ["mc", "flex", "helm"] },
    galion: { label: "Galion", roles: ["helm", "bilge", "flex", "mc"], dropOrder: ["mc", "flex", "helm", "bilge"] }
  };

  /* Points donnés à l'affectation : le rôle principal prime sur le sous-rôle */
  var SCORE_MAIN = 1000, SCORE_SUB = 500;

  var MIN_PLAYERS = 2, MAX_PLAYERS = 40;
  var STORAGE_KEY = "scrim-random-v2";

  var $ = function (id) { return document.getElementById(id); };
  var fieldsEl = $("fields"), countEl = $("count"), summaryEl = $("summary");
  var errorEl = $("error"), resultsEl = $("results"), teamsEl = $("teams");
  var noteEl = $("note"), statusEl = $("status");

  var names = [];            // noms, partagés entre les bateaux
  var roles = {};            // roles[bateau][i] = { main, sub } : chaque bateau a ses propres choix
  var activeShip = "galion"; // bateau affiché dans le formulaire
  var lastResult = null;

  /* ==========================================================
     Utilitaires
     ========================================================== */
  function clamp(n) {
    n = parseInt(n, 10);
    if (isNaN(n)) n = 8;
    return Math.min(MAX_PLAYERS, Math.max(MIN_PLAYERS, n));
  }
  function getCount() { return clamp(countEl.value); }
  function currentShip() {
    return document.querySelector('input[name="ship"]:checked').value;
  }
  function plural(n, one, many) { return n + " " + (n > 1 ? many : one); }

  function rand() {
    var buf = new Uint32Array(1);
    window.crypto.getRandomValues(buf);
    return buf[0] / 4294967296;
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
  function validRole(ship, role) {
    return ship.roles.indexOf(role) !== -1 ? role : "";
  }

  /* ==========================================================
     Lecture du formulaire et stockage
     ========================================================== */
  function readRows() {
    return Array.prototype.map.call(fieldsEl.querySelectorAll(".player"), function (row) {
      return {
        name: row.querySelector(".p-name").value.trim(),
        main: row.querySelector(".p-main").value,
        sub:  row.querySelector(".p-sub").value
      };
    });
  }

  /* Copie le formulaire dans names / roles[bateau actif].
     Les lignes au-delà du nombre de joueurs affiché sont conservées. */
  function syncState() {
    var rows = readRows();
    var saved = Array.isArray(roles[activeShip]) ? roles[activeShip] : [];
    rows.forEach(function (r, i) {
      names[i] = r.name;
      saved[i] = { main: r.main, sub: r.sub };
    });
    roles[activeShip] = saved;
  }

  function save() {
    syncState();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        ship: activeShip, count: getCount(), names: names, roles: roles
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
      if (data.roles && typeof data.roles === "object") roles = data.roles;
    } catch (e) { /* ignoré */ }
  }

  /* ==========================================================
     Équipes et rôles
     ========================================================== */

  /* Taille de chaque équipe : équilibrée, jamais plus que l'équipage du bateau */
  function plan(count, crew) {
    var teams = Math.ceil(count / crew);
    var base = Math.floor(count / teams);
    var extra = count % teams;
    var sizes = [];
    for (var i = 0; i < teams; i++) sizes.push(base + (i < extra ? 1 : 0));
    return sizes;
  }

  /* Rôles d'une équipe de `size` joueurs : on retire les rôles de dropOrder si elle est incomplète */
  function rolesFor(ship, size) {
    var list = ship.roles.slice();
    var missing = list.length - size;
    ship.dropOrder.forEach(function (role) {
      var idx = list.indexOf(role);
      if (missing > 0 && idx !== -1) { list.splice(idx, 1); missing--; }
    });
    while (missing > 0) { list.pop(); missing--; }
    return list;
  }

  function teamPlan(count, ship) {
    return plan(count, ship.roles.length).map(function (size) {
      return rolesFor(ship, size);
    });
  }

  /* Algorithme hongrois : affectation de coût minimal (matrice carrée) */
  function hungarian(a) {
    var n = a.length, INF = 1e18;
    var u = new Array(n + 1).fill(0), v = new Array(n + 1).fill(0);
    var p = new Array(n + 1).fill(0), way = new Array(n + 1).fill(0);
    for (var i = 1; i <= n; i++) {
      p[0] = i;
      var j0 = 0, j1 = 0, j;
      var minv = new Array(n + 1).fill(INF);
      var used = new Array(n + 1).fill(false);
      do {
        used[j0] = true;
        var i0 = p[j0], delta = INF;
        for (j = 1; j <= n; j++) {
          if (!used[j]) {
            var cur = a[i0 - 1][j - 1] - u[i0] - v[j];
            if (cur < minv[j]) { minv[j] = cur; way[j] = j0; }
            if (minv[j] < delta) { delta = minv[j]; j1 = j; }
          }
        }
        for (j = 0; j <= n; j++) {
          if (used[j]) { u[p[j]] += delta; v[j] -= delta; }
          else { minv[j] -= delta; }
        }
        j0 = j1;
      } while (p[j0] !== 0);
      do { j1 = way[j0]; p[j0] = p[j1]; j0 = j1; } while (j0);
    }
    var result = new Array(n);
    for (j = 1; j <= n; j++) result[p[j] - 1] = j - 1;
    return result;
  }

  /* Donne un rôle à chaque joueur en respectant au mieux principal > sous-rôle,
     puis répartit au hasard les joueurs d'un même rôle entre les équipes. */
  function assignRoles(players, teamRoles) {
    var slots = [];
    teamRoles.forEach(function (list) {
      list.forEach(function (role) { slots.push(role); });
    });

    var order = shuffled(players);
    var cost = order.map(function (p) {
      return slots.map(function (role) {
        var gain = p.main === role ? SCORE_MAIN : (p.sub === role ? SCORE_SUB : 0);
        return -(gain + rand());   // le bruit casse les égalités au hasard
      });
    });
    var match = hungarian(cost);

    var pools = {};
    order.forEach(function (p, i) {
      var role = slots[match[i]];
      var fit;
      if (!p.main && !p.sub) fit = "free";
      else if (p.main === role) fit = "main";
      else if (p.sub === role) fit = "sub";
      else fit = "off";
      (pools[role] = pools[role] || []).push({ name: p.name, role: role, fit: fit });
    });
    Object.keys(pools).forEach(function (role) { pools[role] = shuffled(pools[role]); });

    return teamRoles.map(function (list) {
      return list.map(function (role) { return pools[role].pop(); });
    });
  }

  /* ==========================================================
     Rendu
     ========================================================== */
  function renderSummary() {
    var ship = SHIPS[currentShip()];
    var count = getCount();
    var sizes = plan(count, ship.roles.length);
    var roleList = ship.roles.map(function (r) { return ROLE_LABELS[r]; }).join(", ");
    var text = plural(count, "joueur", "joueurs") + " · " + ship.label + " (" + roleList + ") · ";
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

  function makeSelect(cls, placeholder, ship, value, label) {
    var sel = document.createElement("select");
    sel.className = cls;
    sel.setAttribute("aria-label", label);
    var none = document.createElement("option");
    none.value = "";
    none.textContent = placeholder;
    sel.appendChild(none);
    ship.roles.forEach(function (role) {
      var o = document.createElement("option");
      o.value = role;
      o.textContent = ROLE_LABELS[role];
      sel.appendChild(o);
    });
    sel.value = value;
    return sel;
  }

  /* Le sous-rôle ne peut pas être le même que le rôle principal */
  function refreshSub(row) {
    var main = row.querySelector(".p-main").value;
    var sub = row.querySelector(".p-sub");
    Array.prototype.forEach.call(sub.options, function (o) {
      o.disabled = !!o.value && o.value === main;
    });
    if (sub.value === main) sub.value = "";
  }

  function renderFields() {
    var count = getCount();
    var ship = SHIPS[activeShip];
    var saved = Array.isArray(roles[activeShip]) ? roles[activeShip] : [];
    fieldsEl.innerHTML = "";
    for (var i = 0; i < count; i++) {
      var pref = saved[i] || {};

      var row = document.createElement("div");
      row.className = "player";
      row.dataset.index = i;

      var input = document.createElement("input");
      input.type = "text";
      input.className = "p-name";
      input.maxLength = 30;
      input.placeholder = "Joueur " + (i + 1);
      input.setAttribute("aria-label", "Nom du joueur " + (i + 1));
      input.autocomplete = "off";
      input.value = names[i] || "";

      var main = makeSelect("p-main", "Rôle principal", ship, validRole(ship, pref.main),
                            "Rôle principal du joueur " + (i + 1));
      var sub = makeSelect("p-sub", "Sous-rôle", ship, validRole(ship, pref.sub),
                           "Sous-rôle du joueur " + (i + 1));

      row.appendChild(input);
      row.appendChild(main);
      row.appendChild(sub);
      refreshSub(row);
      fieldsEl.appendChild(row);
    }
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
      members.forEach(function (m) {
        var li = document.createElement("li");

        var role = document.createElement("span");
        role.className = "role";
        role.textContent = ROLE_LABELS[m.role];

        var who = document.createElement("span");
        who.className = "who";
        who.textContent = m.name;

        li.appendChild(role);
        li.appendChild(who);

        if (m.fit === "sub" || m.fit === "off") {
          var tag = document.createElement("span");
          tag.className = "tag tag-" + m.fit;
          tag.textContent = m.fit === "sub" ? "sous-rôle" : "hors rôle";
          li.appendChild(tag);
        }
        ul.appendChild(li);
      });

      card.appendChild(h);
      card.appendChild(ul);
      teamsEl.appendChild(card);
    });
  }

  /* ==========================================================
     Actions
     ========================================================== */
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
    var rows = readRows();
    var list = rows.map(function (r) { return r.name; });
    var msg = validate(list);
    errorEl.textContent = msg;
    if (msg) {
      var idx = list.findIndex(function (n) { return !n; });
      if (idx >= 0) fieldsEl.querySelectorAll(".p-name")[idx].focus();
      return;
    }

    var ship = SHIPS[activeShip];
    var teams = assignRoles(rows, teamPlan(rows.length, ship));
    lastResult = { teams: teams, ship: ship };
    renderTeams(teams, ship);

    /* Messages d'information sous le titre */
    var notes = [];
    var even = teams.every(function (t) { return t.length === teams[0].length; });
    if (teams.length === 1) {
      notes.push("Une seule équipe : il faut au moins deux équipages pour un scrim.");
    } else if (!even) {
      var dropped = ship.dropOrder.map(function (r) { return ROLE_LABELS[r]; }).join(", ");
      notes.push("Le nombre de joueurs ne tombe pas juste : les équipes incomplètes perdent des rôles (retirés dans cet ordre : " + dropped + ").");
    }
    var subs = 0, offs = 0;
    teams.forEach(function (t) {
      t.forEach(function (m) {
        if (m.fit === "sub") subs++;
        if (m.fit === "off") offs++;
      });
    });
    if (subs) notes.push(plural(subs, "joueur", "joueurs") + (subs > 1 ? " ont leur" : " a son") + " sous-rôle.");
    if (offs) notes.push(plural(offs, "joueur", "joueurs") + (offs > 1 ? " n’ont" : " n’a") + " ni " + (offs > 1 ? "leur" : "son") + " rôle principal ni " + (offs > 1 ? "leur" : "son") + " sous-rôle.");

    noteEl.textContent = notes.join("\n");
    noteEl.hidden = notes.length === 0;

    resultsEl.hidden = false;
    statusEl.textContent = "";
    save();
    resultsEl.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function copyResult() {
    if (!lastResult) return;
    var text = lastResult.teams.map(function (members, i) {
      var line = members.map(function (m) { return ROLE_LABELS[m.role] + " " + m.name; }).join(", ");
      return "Équipe " + (i + 1) + " (" + lastResult.ship.label + ") : " + line;
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
    syncState();
    countEl.value = getCount();
    renderFields();
    renderSummary();
    errorEl.textContent = "";
    save();
  }

  /* ==========================================================
     Événements
     ========================================================== */
  $("minus").addEventListener("click", function () { setCount(getCount() - 1); });
  $("plus").addEventListener("click", function () { setCount(getCount() + 1); });
  countEl.addEventListener("change", onConfigChange);

  /* Changer de bateau : on garde les choix de l'ancien et on affiche ceux du nouveau */
  document.querySelectorAll('input[name="ship"]').forEach(function (r) {
    r.addEventListener("change", function () {
      syncState();
      activeShip = currentShip();
      renderFields();
      renderSummary();
      errorEl.textContent = "";
      save();
    });
  });

  fieldsEl.addEventListener("input", function () { errorEl.textContent = ""; save(); });
  fieldsEl.addEventListener("change", function (e) {
    if (e.target.classList.contains("p-main")) refreshSub(e.target.closest(".player"));
    errorEl.textContent = "";
    save();
  });
  fieldsEl.addEventListener("keydown", function (e) {
    if (e.key !== "Enter" || !e.target.classList.contains("p-name")) return;
    e.preventDefault();
    var inputs = fieldsEl.querySelectorAll(".p-name");
    var i = parseInt(e.target.closest(".player").dataset.index, 10);
    if (i < inputs.length - 1) inputs[i + 1].focus();
    else doShuffle();
  });

  $("shuffle").addEventListener("click", doShuffle);
  $("reshuffle").addEventListener("click", doShuffle);
  $("copy").addEventListener("click", copyResult);
  $("clear").addEventListener("click", function () {
    names = [];
    roles = {};
    renderFields();
    errorEl.textContent = "";
    resultsEl.hidden = true;
    save();
    var first = fieldsEl.querySelector(".p-name");
    if (first) first.focus();
  });

  /* ==========================================================
     Démarrage
     ========================================================== */
  load();
  activeShip = currentShip();
  countEl.value = getCount();
  renderFields();
  renderSummary();
})();