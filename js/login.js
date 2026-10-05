/**
 * RICIN XPRESS — Admin login
 */
(function () {
  var ADMIN_PASSWORD = "Ricinxpress2003";

  if (sessionStorage.getItem("adminLoggedIn") === "true") {
    window.location.replace("dashboard.html");
    return;
  }

  document.addEventListener("DOMContentLoaded", function () {
    var form = document.getElementById("loginForm");
    var input = document.getElementById("password");
    var errorBox = document.getElementById("err-password");
    var btn = document.getElementById("loginBtn");

    input.addEventListener("input", function () {
      input.classList.remove("error");
      errorBox.classList.remove("show");
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var original = btn.innerHTML;
      btn.innerHTML = '<span class="spinner"></span> Signing in...';
      btn.disabled = true;

      setTimeout(function () {
        if (input.value === ADMIN_PASSWORD) {
          sessionStorage.setItem("adminLoggedIn", "true");
          RicinUtils.showToast("Welcome back.", "success");
          window.location.href = "dashboard.html";
        } else {
          input.classList.add("error");
          errorBox.textContent = "Incorrect password. Please try again.";
          errorBox.classList.add("show");
          input.value = "";
          input.focus();
          btn.innerHTML = original;
          btn.disabled = false;
        }
      }, 350);
    });
  });
})();
