/**
 * RICIN XPRESS — Admin dashboard
 */
(function () {
  if (sessionStorage.getItem("adminLoggedIn") !== "true") {
    window.location.replace("login.html");
    return;
  }

  var allOrders = [];
  var currentOrderRef = null;
  var e = function (s) { return RicinUtils.escapeHtml(s); };

  function truncate(str, n) {
    if (!str) return "";
    return str.length > n ? str.substring(0, n) + "..." : str;
  }

  function updateStats() {
    var total = allOrders.length;
    var pending = allOrders.filter(function (o) { return o.status === "pending"; }).length;
    var progress = allOrders.filter(function (o) {
      return ["confirmed", "onway", "pickedup"].indexOf(o.status) > -1;
    }).length;
    var completed = allOrders.filter(function (o) { return o.status === "completed"; }).length;

    RicinUtils.animateCounter(document.getElementById("statTotal"), total);
    RicinUtils.animateCounter(document.getElementById("statPending"), pending);
    RicinUtils.animateCounter(document.getElementById("statInProgress"), progress);
    RicinUtils.animateCounter(document.getElementById("statCompleted"), completed);
  }

  function getFilteredOrders() {
    var search = document.getElementById("searchInput").value.toLowerCase().trim();
    var status = document.getElementById("statusFilter").value;
    var sort = document.getElementById("sortFilter").value;
    var list = allOrders.slice();

    if (search) {
      list = list.filter(function (o) {
        return (
          o.reference.toLowerCase().indexOf(search) > -1 ||
          (o.firstName + " " + o.lastName).toLowerCase().indexOf(search) > -1 ||
          (o.phone || "").indexOf(search) > -1 ||
          (o.pickupAddress || "").toLowerCase().indexOf(search) > -1 ||
          (o.dropoffAddress || "").toLowerCase().indexOf(search) > -1
        );
      });
    }
    if (status && status !== "all") list = list.filter(function (o) { return o.status === status; });

    list.sort(function (a, b) {
      if (sort === "collection") {
        return new Date(a.collectionDate) - new Date(b.collectionDate);
      }
      var da = new Date(a.createdAt), dbb = new Date(b.createdAt);
      return sort === "oldest" ? da - dbb : dbb - da;
    });
    return list;
  }

  function statusSelect(order) {
    var opts = RicinUtils.STATUS_ORDER.map(function (s) {
      return '<option value="' + s + '"' + (order.status === s ? " selected" : "") + ">" +
        e(RicinUtils.STATUS_LABELS[s]) + "</option>";
    }).join("");
    return '<select class="order-status-select status-' + order.status +
      '" aria-label="Order status" data-action="status" data-ref="' + e(order.reference) + '">' + opts + "</select>";
  }

  function actionButtons(ref) {
    return '<div class="order-actions">' +
      '<button class="btn-icon" data-action="view" data-ref="' + e(ref) + '" title="View details" aria-label="View details"><i class="fas fa-eye"></i></button>' +
      '<button class="btn-icon" data-action="pdf" data-ref="' + e(ref) + '" title="Download PDF" aria-label="Download PDF"><i class="fas fa-download"></i></button>' +
      '<button class="btn-icon btn-delete" data-action="delete" data-ref="' + e(ref) + '" title="Delete order" aria-label="Delete order"><i class="fas fa-trash"></i></button>' +
      "</div>";
  }

  function renderOrders() {
    var tbody = document.getElementById("ordersTableBody");
    var cards = document.getElementById("orderCards");
    var empty = document.getElementById("noOrders");
    var list = getFilteredOrders();

    if (!list.length) {
      tbody.innerHTML = "";
      cards.innerHTML = "";
      empty.hidden = false;
      return;
    }
    empty.hidden = true;

    tbody.innerHTML = list.map(function (o) {
      return "<tr>" +
        '<td><span class="order-ref">' + e(o.reference) + "</span></td>" +
        "<td><strong>" + e(o.firstName + " " + o.lastName) + "</strong><br><small class=\"muted\">" + e(o.phone) + "</small></td>" +
        "<td><small class=\"muted\">From</small> " + e(truncate(o.pickupAddress, 34)) + "<br><small class=\"muted\">To</small> " + e(truncate(o.dropoffAddress, 34)) + "</td>" +
        "<td style=\"white-space:nowrap\">" + e(RicinUtils.formatDate(o.collectionDate)) + "<br><small class=\"muted\">" + e(o.collectionTime) + "</small></td>" +
        "<td>" + statusSelect(o) + "</td>" +
        "<td>" + actionButtons(o.reference) + "</td>" +
        "</tr>";
    }).join("");

    cards.innerHTML = list.map(function (o) {
      return '<article class="order-card">' +
        '<div class="row"><span class="order-ref">' + e(o.reference) + "</span>" + statusSelect(o) + "</div>" +
        '<div class="row"><span>Customer</span><span>' + e(o.firstName + " " + o.lastName) + "</span></div>" +
        '<div class="row"><span>Phone</span><span>' + e(o.phone) + "</span></div>" +
        '<div class="row"><span>Pickup</span><span>' + e(truncate(o.pickupAddress, 34)) + "</span></div>" +
        '<div class="row"><span>Drop-off</span><span>' + e(truncate(o.dropoffAddress, 34)) + "</span></div>" +
        '<div class="row"><span>Collection</span><span>' + e(RicinUtils.formatDate(o.collectionDate) + " · " + o.collectionTime) + "</span></div>" +
        '<div style="margin-top:12px">' + actionButtons(o.reference) + "</div>" +
        "</article>";
    }).join("");
  }

  async function refresh() {
    allOrders = await RicinUtils.getOrders();
    updateStats();
    renderOrders();
  }

  async function updateStatus(ref, status, el) {
    var updated = await RicinUtils.updateOrderStatus(ref, status);
    if (updated) {
      el.className = "order-status-select status-" + status;
      RicinUtils.showToast("Order " + ref + " → " + RicinUtils.formatStatus(status), "success");
      await refresh();
    } else {
      RicinUtils.showToast("Could not update the order status.", "error");
    }
  }

  function modalRow(label, value) {
    return '<div class="modal-row"><span class="modal-label">' + e(label) + '</span><span class="modal-value">' + value + "</span></div>";
  }

  async function viewOrder(ref) {
    var order = await RicinUtils.getOrderByRef(ref);
    if (!order) return RicinUtils.showToast("Order not found.", "error");
    currentOrderRef = ref;
    document.getElementById("modalContent").innerHTML =
      modalRow("Reference", '<span class="order-ref">' + e(order.reference) + "</span>") +
      modalRow("Customer", e(order.firstName + " " + order.lastName)) +
      modalRow("Phone", '<a href="tel:' + e(order.phone) + '">' + e(order.phone) + "</a>") +
      modalRow("Pickup Address", e(order.pickupAddress)) +
      modalRow("Drop-off Address", e(order.dropoffAddress)) +
      modalRow("Collection Date", e(RicinUtils.formatDate(order.collectionDate))) +
      modalRow("Collection Time", e(order.collectionTime)) +
      modalRow("Item Description", e(order.itemDescription)) +
      (order.specialInstructions ? modalRow("Special Instructions", e(order.specialInstructions)) : "") +
      modalRow("Status", '<span class="status-badge status-' + order.status + '">' + e(RicinUtils.formatStatus(order.status)) + "</span>") +
      modalRow("Created", e(new Date(order.createdAt).toLocaleString("en-ZA")));
    document.getElementById("orderModal").classList.add("show");
  }

  async function downloadPDF(ref) {
    var order = await RicinUtils.getOrderByRef(ref);
    if (order) RicinUtils.generatePDF(order);
    else RicinUtils.showToast("Order not found.", "error");
  }

  async function removeOrder(ref) {
    if (!window.confirm("Delete order " + ref + "? This cannot be undone.")) return;
    try {
      await RicinUtils.deleteOrder(ref);
      RicinUtils.showToast("Order " + ref + " deleted.", "success");
      await refresh();
    } catch (err) {
      console.error(err);
      RicinUtils.showToast("Could not delete the order.", "error");
    }
  }

  function closeModal() {
    document.getElementById("orderModal").classList.remove("show");
    currentOrderRef = null;
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("searchInput").addEventListener("input", renderOrders);
    document.getElementById("statusFilter").addEventListener("change", renderOrders);
    document.getElementById("sortFilter").addEventListener("change", renderOrders);

    document.getElementById("logoutBtn").addEventListener("click", function () {
      sessionStorage.removeItem("adminLoggedIn");
      window.location.href = "login.html";
    });
    document.getElementById("refreshBtn").addEventListener("click", async function () {
      await refresh();
      RicinUtils.showToast("Orders refreshed.", "info");
    });

    // Event delegation for table + card actions
    document.addEventListener("click", function (ev) {
      var btn = ev.target.closest("[data-action]");
      if (!btn || btn.tagName === "SELECT") return;
      var ref = btn.getAttribute("data-ref");
      var action = btn.getAttribute("data-action");
      if (action === "view") viewOrder(ref);
      if (action === "pdf") downloadPDF(ref);
      if (action === "delete") removeOrder(ref);
    });
    document.addEventListener("change", function (ev) {
      var el = ev.target;
      if (el.matches('select[data-action="status"]')) {
        updateStatus(el.getAttribute("data-ref"), el.value, el);
      }
    });

    document.getElementById("modalClose").addEventListener("click", closeModal);
    document.getElementById("modalPdf").addEventListener("click", function () {
      if (currentOrderRef) downloadPDF(currentOrderRef);
    });
    document.getElementById("orderModal").addEventListener("click", function (ev) {
      if (ev.target === ev.currentTarget) closeModal();
    });
    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape") closeModal();
    });

    window.whenDbReady().then(async function (sb) {
      await refresh();
      sb.channel("orders-changes")
        .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, refresh)
        .subscribe();
      setInterval(refresh, 30000);
    });
  });
})();
