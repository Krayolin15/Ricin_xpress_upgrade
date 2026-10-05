/**
 * RICIN XPRESS — Order success page
 */
(function () {
  function text(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = value || "—";
  }

  document.addEventListener("DOMContentLoaded", function () {
    var ref = sessionStorage.getItem("lastOrderRef");
    var order = null;
    try { order = JSON.parse(sessionStorage.getItem("lastOrder") || "null"); } catch (e) { order = null; }

    var trackLink = document.getElementById("trackLink");
    var pdfBtn = document.getElementById("pdfBtn");
    var copyBtn = document.getElementById("copyRefBtn");

    if (!ref) {
      document.getElementById("noOrderCard").hidden = false;
      text("successRef", "—");
      if (pdfBtn) pdfBtn.disabled = true;
      if (copyBtn) copyBtn.disabled = true;
      return;
    }

    text("successRef", ref);
    if (trackLink) trackLink.href = "track.html?ref=" + encodeURIComponent(ref);

    if (order) {
      document.getElementById("summaryCard").hidden = false;
      text("sumSender", (order.firstName || "") + " " + (order.lastName || ""));
      text("sumPhone", order.phone);
      text("sumPickup", order.pickupAddress);
      text("sumDropoff", order.dropoffAddress);
      text("sumDate", RicinUtils.formatDate(order.collectionDate));
      text("sumTime", order.collectionTime);
      text("sumItem", order.itemDescription);
    }

    if (copyBtn) {
      copyBtn.addEventListener("click", function () {
        function done() { RicinUtils.showToast("Reference copied to clipboard.", "success"); }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(ref).then(done).catch(function () {
            RicinUtils.showToast("Copy failed — please copy it manually.", "error");
          });
        } else {
          var ta = document.createElement("textarea");
          ta.value = ref;
          document.body.appendChild(ta);
          ta.select();
          try { document.execCommand("copy"); done(); } catch (e) {
            RicinUtils.showToast("Copy failed — please copy it manually.", "error");
          }
          ta.remove();
        }
      });
    }

    if (pdfBtn) {
      pdfBtn.addEventListener("click", function () {
        if (!order) {
          RicinUtils.showToast("Receipt details are no longer available.", "error");
          return;
        }
        try { RicinUtils.generatePDF(order); } catch (e) {
          console.error("PDF:", e);
          RicinUtils.showToast("We couldn't generate the receipt.", "error");
        }
      });
    }
  });
})();
