/**
 * RICIN XPRESS — Order tracking (used on track.html and services.html)
 */
(function () {
  function updateTimeline(status) {
    var steps = document.querySelectorAll(".timeline-step");
    var index = RicinUtils.STATUS_ORDER.indexOf(status);
    steps.forEach(function (step, i) {
      step.classList.remove("active", "completed");
      if (i < index) step.classList.add("completed");
      else if (i === index) step.classList.add("active");
    });
  }

  function setText(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = value || "-";
  }

  async function trackOrder() {
    var input = document.getElementById("trackInput");
    var btn = document.getElementById("trackBtn");
    var result = document.getElementById("trackResult");
    var errorCard = document.getElementById("trackError");
    if (!input) return;

    var ref = input.value.trim().toUpperCase();
    if (!ref) {
      RicinUtils.showToast("Please enter your order reference number.", "error");
      input.focus();
      return;
    }

    var original = btn ? btn.innerHTML : "";
    if (btn) {
      btn.innerHTML = '<span class="spinner"></span> Searching...';
      btn.disabled = true;
    }
    if (errorCard) errorCard.classList.remove("show");

    try {
      await window.whenDbReady();
      var order = await RicinUtils.getOrderByRef(ref);

      if (!order) {
        if (result) result.classList.remove("show");
        if (errorCard) errorCard.classList.add("show");
        RicinUtils.showToast("No order found for " + ref, "error");
        return;
      }

      setText("resultRef", order.reference);
      setText("resultDate", "Placed on " + new Date(order.createdAt).toLocaleDateString("en-ZA", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
      }));

      var badge = document.getElementById("resultStatus");
      if (badge) {
        badge.textContent = RicinUtils.formatStatus(order.status);
        badge.className = "status-badge status-" + order.status;
      }

      updateTimeline(order.status);

      setText("detailSender", order.firstName + " " + order.lastName);
      setText("detailPhone", order.phone);
      setText("detailPickup", order.pickupAddress);
      setText("detailDropoff", order.dropoffAddress);
      setText("detailDate", RicinUtils.formatDate(order.collectionDate));
      setText("detailTime", order.collectionTime);
      setText("detailItem", order.itemDescription);

      if (result) {
        result.classList.add("show");
        result.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } catch (e) {
      console.error("trackOrder:", e);
      RicinUtils.showToast("We couldn't reach the tracking service. Please try again.", "error");
    } finally {
      if (btn) {
        btn.innerHTML = original;
        btn.disabled = false;
      }
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    var input = document.getElementById("trackInput");
    var btn = document.getElementById("trackBtn");
    if (btn) btn.addEventListener("click", trackOrder);
    if (input) {
      input.addEventListener("keypress", function (e) {
        if (e.key === "Enter") { e.preventDefault(); trackOrder(); }
      });
      // Prefill from ?ref= or the last submitted order
      var ref = new URLSearchParams(window.location.search).get("ref");
      if (ref) {
        input.value = ref.toUpperCase();
        trackOrder();
      }
    }
  });

  window.trackOrder = trackOrder;
})();
