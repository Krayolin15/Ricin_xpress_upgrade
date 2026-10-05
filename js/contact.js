/**
 * RICIN XPRESS — Contact form -> WhatsApp
 */
(function () {
  var WHATSAPP = "27682937167";

  function setError(id, message) {
    var field = document.getElementById(id);
    var box = document.getElementById("err-" + id);
    if (field) field.classList.add("error");
    if (box) { box.textContent = message; box.classList.add("show"); }
  }

  function clearError(id) {
    var field = document.getElementById(id);
    var box = document.getElementById("err-" + id);
    if (field) field.classList.remove("error");
    if (box) box.classList.remove("show");
  }

  document.addEventListener("DOMContentLoaded", function () {
    var form = document.getElementById("contactForm");
    if (!form) return;

    form.querySelectorAll("input, textarea").forEach(function (el) {
      el.addEventListener("input", function () { clearError(el.id); });
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var name = document.getElementById("cName").value.trim();
      var contact = document.getElementById("cContact").value.trim();
      var message = document.getElementById("cMessage").value.trim();
      var ok = true;

      if (name.length < 2) { setError("cName", "Please enter your name."); ok = false; }
      if (contact.length < 5) { setError("cContact", "Please add a phone number or email."); ok = false; }
      if (message.length < 5) { setError("cMessage", "Please tell us how we can help."); ok = false; }
      if (!ok) return;

      var text =
        "*NEW ENQUIRY — RICIN XPRESS*\n\n" +
        "*Name:* " + name + "\n" +
        "*Contact:* " + contact + "\n\n" +
        "*Message:*\n" + message;

      window.open("https://wa.me/" + WHATSAPP + "?text=" + encodeURIComponent(text), "_blank");
      RicinUtils.showToast("Opening WhatsApp with your message…", "success");
      form.reset();
    });
  });
})();
