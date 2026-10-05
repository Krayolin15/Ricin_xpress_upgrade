/**
 * RICIN XPRESS — Booking form
 */
(function () {
  var REQUIRED = [
    ["firstName", "Please enter your first name."],
    ["lastName", "Please enter your last name."],
    ["phone", "Please enter a contact number."],
    ["pickupAddress", "Please enter the pickup address."],
    ["dropoffAddress", "Please enter the drop-off address."],
    ["collectionDate", "Please choose a collection date."],
    ["collectionTime", "Please choose a collection time slot."],
    ["itemDescription", "Please describe the item."],
  ];

  function setError(id, message) {
    var field = document.getElementById(id);
    var box = document.getElementById("err-" + id);
    if (field) field.classList.add("error");
    if (box) {
      box.textContent = message;
      box.classList.add("show");
    }
  }

  function clearError(id) {
    var field = document.getElementById(id);
    var box = document.getElementById("err-" + id);
    if (field) field.classList.remove("error");
    if (box) box.classList.remove("show");
  }

  function validateForm() {
    var valid = true;

    REQUIRED.forEach(function (pair) {
      var el = document.getElementById(pair[0]);
      if (!el) return;
      if (!el.value.trim()) {
        setError(pair[0], pair[1]);
        valid = false;
      } else {
        clearError(pair[0]);
      }
    });

    var phone = document.getElementById("phone");
    if (phone && phone.value.trim() && !/^[0-9\s\-()+]{7,15}$/.test(phone.value.trim())) {
      setError("phone", "Enter a valid phone number (7–15 digits).");
      valid = false;
    }

    var dateEl = document.getElementById("collectionDate");
    if (dateEl && dateEl.value) {
      var picked = new Date(dateEl.value + "T00:00:00");
      var today = new Date();
      today.setHours(0, 0, 0, 0);
      if (picked < today) {
        setError("collectionDate", "Collection date cannot be in the past.");
        valid = false;
      }
    }

    if (!valid) {
      RicinUtils.showToast("Please correct the highlighted fields.", "error");
      var first = document.querySelector(".form-group .error");
      if (first) {
        first.scrollIntoView({ behavior: "smooth", block: "center" });
        first.focus({ preventScroll: true });
      }
    }
    return valid;
  }

  async function submitOrder(event) {
    event.preventDefault();
    var btn = document.getElementById("submitBtn");
    if (!validateForm()) return;

    var original = btn.innerHTML;
    btn.innerHTML = '<span class="spinner"></span> Processing...';
    btn.disabled = true;

    var order = {
      reference: RicinUtils.generateReference(),
      firstName: document.getElementById("firstName").value.trim(),
      lastName: document.getElementById("lastName").value.trim(),
      phone: document.getElementById("phone").value.trim(),
      pickupAddress: document.getElementById("pickupAddress").value.trim(),
      dropoffAddress: document.getElementById("dropoffAddress").value.trim(),
      collectionDate: document.getElementById("collectionDate").value,
      collectionTime: document.getElementById("collectionTime").value,
      itemDescription: document.getElementById("itemDescription").value.trim(),
      specialInstructions: document.getElementById("specialInstructions").value.trim(),
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    try {
      await window.whenDbReady();
      var saved = await RicinUtils.saveOrder(order);
      var stored = saved || order;
      sessionStorage.setItem("lastOrderRef", stored.reference);
      sessionStorage.setItem("lastOrder", JSON.stringify(stored));
      RicinUtils.showToast("Order submitted successfully!", "success");
      RicinUtils.sendWhatsAppMessage(stored);
      setTimeout(function () {
        try { RicinUtils.generatePDF(stored); } catch (e) { console.error("PDF:", e); }
      }, 400);
      setTimeout(function () { window.location.href = "order-success.html"; }, 1100);
    } catch (err) {
      console.error("Order submission error:", err);
      RicinUtils.showToast("We couldn't submit your order. Check your connection and try again.", "error");
      btn.innerHTML = original;
      btn.disabled = false;
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    var dateInput = document.getElementById("collectionDate");
    if (dateInput) {
      var today = new Date().toISOString().split("T")[0];
      dateInput.setAttribute("min", today);
      if (!dateInput.value) dateInput.value = today;
    }

    document.querySelectorAll("#bookingForm input, #bookingForm select, #bookingForm textarea")
      .forEach(function (el) {
        el.addEventListener("input", function () { clearError(el.id); });
        el.addEventListener("change", function () { clearError(el.id); });
      });

    var form = document.getElementById("bookingForm");
    if (form) form.addEventListener("submit", submitOrder);
  });
})();
