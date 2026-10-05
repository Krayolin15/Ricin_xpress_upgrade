/**
 * RICIN XPRESS — Shared JavaScript
 * Navigation, animations, toasts, Supabase data access, PDF + WhatsApp helpers.
 */

/* ------------------------------------------------------------------ UI --- */
function initNavigation() {
  var header = document.querySelector(".header");
  var toggle = document.querySelector(".mobile-toggle");
  var nav = document.querySelector(".nav");
  var links = document.querySelectorAll(".nav-link");

  function onScroll() {
    if (!header) return;
    header.classList.toggle("scrolled", window.pageYOffset > 40);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.classList.toggle("active", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.style.overflow = open ? "hidden" : "";
    });
  }

  links.forEach(function (link) {
    link.addEventListener("click", function () {
      if (toggle) toggle.classList.remove("active");
      if (nav) nav.classList.remove("open");
      document.body.style.overflow = "";
    });
  });

  var page = window.location.pathname.split("/").pop() || "index.html";
  links.forEach(function (link) {
    var href = (link.getAttribute("href") || "").split("/").pop();
    if (href === page) {
      link.classList.add("active");
      link.setAttribute("aria-current", "page");
    }
  });
}

function initScrollAnimations() {
  var els = document.querySelectorAll(".animate-on-scroll");
  if (!("IntersectionObserver" in window)) {
    els.forEach(function (el) { el.classList.add("visible"); });
    return;
  }
  var obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.classList.add("visible");
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  els.forEach(function (el) { obs.observe(el); });
}

function showToast(message, type) {
  type = type || "success";
  var existing = document.querySelector(".toast");
  if (existing) existing.remove();
  var icons = { success: "fa-check", error: "fa-xmark", info: "fa-circle-info" };
  var toast = document.createElement("div");
  toast.className = "toast " + type;
  toast.setAttribute("role", "status");
  toast.innerHTML =
    '<span class="ico"><i class="fas ' + (icons[type] || icons.info) + '"></i></span>' +
    "<span></span>";
  toast.lastChild.textContent = message;
  document.body.appendChild(toast);
  requestAnimationFrame(function () { toast.classList.add("show"); });
  setTimeout(function () {
    toast.classList.remove("show");
    setTimeout(function () { toast.remove(); }, 400);
  }, 3600);
}

function animateCounter(el, target, duration) {
  duration = duration || 700;
  var start = parseInt(el.textContent, 10) || 0;
  if (start === target) return;
  var t0 = performance.now();
  function step(now) {
    var p = Math.min((now - t0) / duration, 1);
    el.textContent = Math.floor(start + (target - start) * p);
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function escapeHtml(str) {
  return String(str == null ? "" : str).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}

/* ------------------------------------------------------------- Data API --- */
function db() {
  if (!window.sb) throw new Error("Database not ready. Please refresh the page.");
  return window.sb;
}

function rowToOrder(r) {
  if (!r) return null;
  return {
    id: r.id,
    reference: r.reference,
    firstName: r.first_name,
    lastName: r.last_name,
    phone: r.phone,
    pickupAddress: r.pickup_address,
    dropoffAddress: r.dropoff_address,
    collectionDate: r.collection_date,
    collectionTime: r.collection_time,
    itemDescription: r.item_description,
    specialInstructions: r.special_instructions || "",
    status: r.status,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

async function getOrders() {
  try {
    var res = await db().from("orders").select("*").order("created_at", { ascending: false });
    if (res.error) throw res.error;
    return (res.data || []).map(rowToOrder);
  } catch (e) {
    console.error("getOrders:", e);
    return [];
  }
}

async function saveOrder(order) {
  var res = await db().from("orders").insert({
    reference: order.reference,
    first_name: order.firstName,
    last_name: order.lastName,
    phone: order.phone,
    pickup_address: order.pickupAddress,
    dropoff_address: order.dropoffAddress,
    collection_date: order.collectionDate,
    collection_time: order.collectionTime,
    item_description: order.itemDescription,
    special_instructions: order.specialInstructions || null,
    status: order.status || "pending",
  }).select().single();
  if (res.error) throw res.error;
  return rowToOrder(res.data);
}

async function getOrderByRef(ref) {
  var res = await db().from("orders").select("*").eq("reference", ref).maybeSingle();
  if (res.error) {
    console.error("getOrderByRef:", res.error);
    return null;
  }
  return rowToOrder(res.data);
}

async function updateOrderStatus(ref, status) {
  var res = await db().from("orders").update({ status: status }).eq("reference", ref).select().single();
  if (res.error) {
    console.error("updateOrderStatus:", res.error);
    return null;
  }
  return rowToOrder(res.data);
}

async function deleteOrderByRef(ref) {
  var res = await db().from("orders").delete().eq("reference", ref);
  if (res.error) throw res.error;
  return true;
}

function generateReference() {
  return "RXD" + Math.floor(100000 + Math.random() * 900000);
}

/* -------------------------------------------------------------- Helpers --- */
var STATUS_LABELS = {
  pending: "Order Received",
  confirmed: "Order Confirmed",
  onway: "On My Way",
  pickedup: "Picked Up",
  completed: "Delivered",
};
var STATUS_ORDER = ["pending", "confirmed", "onway", "pickedup", "completed"];

function formatStatus(status) {
  return STATUS_LABELS[status] || status;
}

function formatDate(dateStr) {
  if (!dateStr) return "-";
  var d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

function sendWhatsAppMessage(order) {
  var phoneNumber = "27682937167";
  var message = encodeURIComponent(
    "*New Delivery Order - " + order.reference + "*\n\n" +
    "*Sender:* " + order.firstName + " " + order.lastName + "\n" +
    "*Phone:* " + order.phone + "\n\n" +
    "*Pickup Address:*\n" + order.pickupAddress + "\n\n" +
    "*Drop-off Address:*\n" + order.dropoffAddress + "\n\n" +
    "*Collection Date:* " + order.collectionDate + "\n" +
    "*Collection Time:* " + order.collectionTime + "\n\n" +
    "*Item Description:*\n" + order.itemDescription + "\n\n" +
    (order.specialInstructions ? "*Special Instructions:*\n" + order.specialInstructions + "\n\n" : "") +
    "*Status:* " + order.status
  );
  window.open("https://wa.me/" + phoneNumber + "?text=" + message, "_blank");
}

function generatePDF(order) {
  if (!window.jspdf) {
    showToast("PDF library is still loading. Please try again.", "error");
    return;
  }
  var jsPDF = window.jspdf.jsPDF;
  var doc = new jsPDF();
  doc.setFillColor(255, 31, 38);
  doc.rect(0, 0, 210, 40, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("RICIN XPRESS", 20, 25);
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Delivery Receipt", 20, 33);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text("Reference: " + order.reference, 140, 20);
  doc.text("Date: " + new Date(order.createdAt || Date.now()).toLocaleDateString(), 140, 26);

  doc.setTextColor(30, 30, 30);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Order Details", 20, 55);
  doc.setDrawColor(255, 31, 38);
  doc.line(20, 58, 190, 58);

  var y = 68;
  doc.setFontSize(11);
  var fields = [
    ["Sender Name", order.firstName + " " + order.lastName],
    ["Phone Number", order.phone],
    ["Pickup Address", order.pickupAddress],
    ["Drop-off Address", order.dropoffAddress],
    ["Collection Date", order.collectionDate],
    ["Collection Time", order.collectionTime],
    ["Item Description", order.itemDescription],
  ];
  if (order.specialInstructions) fields.push(["Special Instructions", order.specialInstructions]);
  fields.push(["Status", formatStatus(order.status).toUpperCase()]);

  fields.forEach(function (f) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(110, 110, 110);
    doc.text(f[0] + ":", 20, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 30, 30);
    var split = doc.splitTextToSize(String(f[1] || "-"), 110);
    doc.text(split, 80, y);
    y += 10 + (split.length - 1) * 5;
  });

  y += 12;
  doc.setDrawColor(200, 200, 200);
  doc.line(20, y, 190, y);
  y += 10;
  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  doc.text("Thank you for choosing Ricin Xpress!", 20, y);
  doc.text("067 786 7203  |  068 293 7167  |  ricinxpress@outlook.com", 20, y + 5);
  doc.save("RicinXpress-Receipt-" + order.reference + ".pdf");
}

/* ------------------------------------------------ Smooth scrolling --- */
function prefersReducedMotion() {
  return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/* Anchor links glide instead of jumping, offset for the fixed header. */
function initSmoothAnchors() {
  document.addEventListener("click", function (ev) {
    var a = ev.target.closest ? ev.target.closest('a[href^="#"]') : null;
    if (!a) return;
    var id = a.getAttribute("href");
    if (!id || id === "#") return;
    var target = document.querySelector(id);
    if (!target) return;
    ev.preventDefault();
    var top = target.getBoundingClientRect().top + window.pageYOffset - 86;
    window.scrollTo({ top: top, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  });
}

/* Momentum wheel scrolling (desktop pointers only, easing towards target). */
/* Native scrolling is used on every device: it is GPU-accelerated, respects
   OS momentum/trackpad physics and never fights the mobile nav or inner
   scroll areas. Smoothness comes from CSS scroll-behavior + easing. */
function initSmoothWheel() {
  /* intentionally no-op — no wheel hijacking */
}


/* Reveal elements in sequence within each section for a fluid cascade. */
function initRevealStagger() {
  var groups = document.querySelectorAll(".grid, .steps, .feature-strip, .timeline");
  groups.forEach(function (group) {
    var items = group.querySelectorAll(".animate-on-scroll");
    items.forEach(function (el, i) {
      el.style.transitionDelay = Math.min(i * 70, 420) + "ms";
    });
  });
}

function safe(fn) {
  try { fn(); } catch (e) { console.error(e); }
}

document.addEventListener("DOMContentLoaded", function () {
  safe(initNavigation);
  safe(initRevealStagger);
  safe(initScrollAnimations);
  safe(initSmoothAnchors);
  safe(initSmoothWheel);
  safe(function () {
    var yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  });
});

/* Last-resort safety net: if anything above failed and content is still
   hidden, reveal everything so the page is never blank. */
window.addEventListener("load", function () {
  setTimeout(function () {
    var hidden = document.querySelectorAll(".animate-on-scroll:not(.visible)");
    if (hidden.length && !document.querySelector(".animate-on-scroll.visible")) {
      hidden.forEach(function (el) { el.classList.add("visible"); });
    }
  }, 1200);
});


window.RicinUtils = {
  showToast: showToast,
  animateCounter: animateCounter,
  escapeHtml: escapeHtml,
  getOrders: getOrders,
  saveOrder: saveOrder,
  getOrderByRef: getOrderByRef,
  updateOrderStatus: updateOrderStatus,
  deleteOrder: deleteOrderByRef,
  generateReference: generateReference,
  sendWhatsAppMessage: sendWhatsAppMessage,
  generatePDF: generatePDF,
  formatStatus: formatStatus,
  formatDate: formatDate,
  STATUS_ORDER: STATUS_ORDER,
  STATUS_LABELS: STATUS_LABELS,
};
