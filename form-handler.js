/**
 * DIJO Aeromaritime - Formulario "RESERVA DE FLETES"
 * WhatsApp + Email (EmailJS REST API - sin SDK)
 */
(function () {
  "use strict";

  // ═══════════ ⚙️ PEGA TUS 3 DATOS REALES DE EMAILJS ═══════════
  var EMAILJS_PUBLIC_KEY = "c2LRgfhGqc2ZGjoDI";
  var EMAILJS_SERVICE_ID = "service_wyz2msk";
  var EMAILJS_TEMPLATE_ID = "template_n6zlmo2";
  // ═══════════════════════════════════════════════════════════════

  var WHATSAPP_NUMBER = "50768264309";
  var SUCCESS_DURATION = 8000;

  function getLang() {
    var lang = (document.documentElement.lang || navigator.language || "es").split("-")[0];
    return ["es", "en", "fr"].indexOf(lang) !== -1 ? lang : "es";
  }

  var MSG = {
    es: { required: "Este campo es requerido", invalidEmail: "Email inválido", success: "\u2713 Solicitud enviada. Te contactaremos en menos de 24 horas." },
    en: { required: "This field is required", invalidEmail: "Invalid email", success: "\u2713 Request sent. We will contact you within 24 hours." },
    fr: { required: "Ce champ est requis", invalidEmail: "Email invalide", success: "\u2713 Demande envoyée. Nous vous contacterons sous 24 heures." },
  };

  function t(key) { return MSG[getLang()][key] || MSG["es"][key]; }

  function init() {
    var seccion = document.getElementById("reserva") || document.querySelector('section[id*="reserv"]');
    if (!seccion) { setTimeout(init, 500); return; }
    var inputs = seccion.querySelectorAll("input, select, textarea");
    if (inputs.length === 0) { setTimeout(init, 500); return; }

    console.log("[DIJO Form] ✅ " + inputs.length + " campos detectados. EmailJS via REST API.");
    var campos = mapearCampos(inputs);

    var form = seccion.querySelector("form");
    if (form) {
      form.addEventListener("submit", function (e) { e.preventDefault(); procesarEnvio(campos, seccion); });
      form.setAttribute("novalidate", "");
    }
    var btn = seccion.querySelector("button[type='submit'], button, a.button, a.btn");
    if (btn && (!form || form.tagName !== "FORM")) {
      btn.addEventListener("click", function (e) { e.preventDefault(); procesarEnvio(campos, seccion); });
    }
  }

  function mapearCampos(inputs) {
    var r = { nombre:null, empresa:null, email:null, telefono:null, puertoOrigen:null, puertoDestino:null, tipoContenedor:null, cantidad:null, detalles:null };
    inputs.forEach(function (inp) {
      var tag = inp.tagName.toLowerCase();
      if (tag === "select" || tag === "input" || tag === "textarea") {
        var type = (inp.type || "").toLowerCase();
        var fp = ((inp.name||"") + " " + (inp.placeholder||"") + " " + (inp.id||"") + " " + (inp.getAttribute("aria-label")||"")).toLowerCase();
        if (!r.nombre && /nombre|name|nom/.test(fp) && type !== "email") r.nombre = inp;
        if (!r.empresa && /empresa|company|entreprise/.test(fp)) r.empresa = inp;
        if (!r.email && (type === "email" || /email|correo|mail/.test(fp))) r.email = inp;
        if (!r.telefono && /tel|whatsapp|phone|fono/.test(fp)) r.telefono = inp;
        if (!r.puertoOrigen && /origen|origin|origine/.test(fp)) r.puertoOrigen = inp;
        if (!r.puertoDestino && /destino|destination/.test(fp)) r.puertoDestino = inp;
        if (!r.tipoContenedor && /contenedor|container|conteneur|tipo/.test(fp)) r.tipoContenedor = inp;
        if (!r.cantidad && /cantidad|cant|quantity|quantit/.test(fp)) r.cantidad = inp;
        if (!r.detalles && /detalle|detail|carga|cargo|cargaison|mercan/.test(fp)) r.detalles = inp;
      }
    });
    var sin = [];
    for (var k in r) { if (!r[k]) sin.push(k); }
    if (sin.length > 0) {
      inputs.forEach(function (inp) {
        var tag = inp.tagName.toLowerCase();
        if ((tag === "input" || tag === "select" || tag === "textarea") && sin.length > 0) {
          var ya = false; for (var k in r) { if (r[k] === inp) ya = true; }
          if (!ya) r[sin.shift()] = inp;
        }
      });
    }
    return r;
  }

  function getVal(c) { if (!c) return ""; var v = (c.value || "").trim(); if (c.tagName === "SELECT" && c.selectedOptions && c.selectedOptions[0]) v = c.selectedOptions[0].textContent.trim(); return v; }

  function validar(c) {
    var e = [];
    if (!getVal(c.nombre)) e.push({ campo: c.nombre, msg: t("required") });
    if (!getVal(c.empresa)) e.push({ campo: c.empresa, msg: t("required") });
    if (!getVal(c.telefono)) e.push({ campo: c.telefono, msg: t("required") });
    if (!getVal(c.puertoOrigen)) e.push({ campo: c.puertoOrigen, msg: t("required") });
    if (!getVal(c.puertoDestino)) e.push({ campo: c.puertoDestino, msg: t("required") });
    if (!getVal(c.detalles)) e.push({ campo: c.detalles, msg: t("required") });
    var em = getVal(c.email);
    if (!em) e.push({ campo: c.email, msg: t("required") });
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) e.push({ campo: c.email, msg: t("invalidEmail") });
    return e;
  }

  function mostrarErrores(errs) {
    document.querySelectorAll(".form-error-msg").forEach(function (el) { el.remove(); });
    document.querySelectorAll(".form-field-error").forEach(function (el) { el.classList.remove("form-field-error"); });
    errs.forEach(function (er) {
      if (er.campo) {
        er.campo.classList.add("form-field-error");
        var sp = document.createElement("span"); sp.className = "form-error-msg"; sp.textContent = er.msg;
        sp.style.cssText = "display:block;color:#f87171;font-size:0.7rem;margin-top:2px;animation:fadeInDown 0.2s ease-out";
        er.campo.parentNode.appendChild(sp);
        setTimeout(function () { if (sp.parentNode) sp.parentNode.removeChild(sp); er.campo.classList.remove("form-field-error"); }, 4000);
      }
    });
    if (errs[0] && errs[0].campo) { errs[0].campo.scrollIntoView({ behavior: "smooth", block: "center" }); setTimeout(function () { errs[0].campo.focus(); }, 400); }
  }

  function enviarWhatsApp(c) {
    var msg =
      "\uD83D\uDEA2 *RESERVA DE FLETES — DIJO Aeromaritime S.A.*\n\n" +
      "\uD83D\uDCCB *Nombre:* " + getVal(c.nombre) + "\n\uD83C\uDFE2 *Empresa:* " + getVal(c.empresa) + "\n" +
      "\uD83D\uDCE7 *Email:* " + getVal(c.email) + "\n\uD83D\uDCF1 *WhatsApp/Tel:* " + getVal(c.telefono) + "\n\n" +
      "\uD83D\uDCCD *Puerto Origen:* " + getVal(c.puertoOrigen) + "\n\uD83D\uDCCD *Puerto Destino:* " + getVal(c.puertoDestino) + "\n" +
      "\uD83D\uDCE6 *Tipo Contenedor:* " + getVal(c.tipoContenedor) + "\n\uD83D\uDD22 *Cantidad:* " + getVal(c.cantidad) + "\n\n" +
      "\uD83D\uDCDD *Detalles de Carga:*\n" + getVal(c.detalles);
    var url = "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(msg.trim());
    var nw = window.open(url, "_blank", "noopener,noreferrer");
    if (!nw || nw.closed || typeof nw.closed === "undefined") window.location.href = url;
  }

  // ═══════════ ENVÍO DE EMAIL POR REST API (sin SDK) ═══════════
  function enviarEmail(c) {
    if (EMAILJS_PUBLIC_KEY === "TU_PUBLIC_KEY_AQUI") {
      console.log("[DIJO Form] ℹ️ EmailJS sin configurar.");
      return;
    }

    var xhr = new XMLHttpRequest();
    xhr.open("POST", "https://api.emailjs.com/api/v1.0/email/send", true);
    xhr.setRequestHeader("Content-Type", "application/json");

    xhr.onload = function () {
      if (xhr.status === 200) {
        console.log("[DIJO Form] ✅ Email enviado a dijoaeromaritime@gmail.com");
      } else {
        console.warn("[DIJO Form] ⚠️ EmailJS API: " + xhr.responseText);
      }
    };
    xhr.onerror = function () {
      console.warn("[DIJO Form] ⚠️ Error de red al enviar email");
    };

    xhr.send(JSON.stringify({
      service_id: EMAILJS_SERVICE_ID,
      template_id: EMAILJS_TEMPLATE_ID,
      user_id: EMAILJS_PUBLIC_KEY,
      template_params: {
        nombre: getVal(c.nombre), empresa: getVal(c.empresa), email: getVal(c.email),
        telefono: getVal(c.telefono), puertoOrigen: getVal(c.puertoOrigen),
        puertoDestino: getVal(c.puertoDestino), tipoContenedor: getVal(c.tipoContenedor),
        cantidad: getVal(c.cantidad), detalles: getVal(c.detalles),
      },
    }));
  }

  function mostrarExito(seccion, c) {
    document.querySelectorAll(".form-error-msg").forEach(function (el) { el.remove(); });
    document.querySelectorAll(".form-field-error").forEach(function (el) { el.classList.remove("form-field-error"); });
    var ex = seccion.querySelector(".form-success-alert"); if (ex) ex.remove();
    var div = document.createElement("div"); div.className = "form-success-alert";
    div.innerHTML = "<span style='font-size:1.2rem;margin-right:6px;'>\u2705</span>" + t("success");
    div.style.cssText = "display:flex;align-items:center;gap:6px;margin-top:1rem;padding:0.75rem 1rem;background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2);border-radius:0.75rem;color:#6ee7b7;font-size:0.85rem;font-weight:500;animation:fadeInUp 0.4s ease-out";
    var panel = seccion.querySelector("form") || seccion.lastElementChild;
    (panel || seccion).appendChild(div);

    for (var k in c) { if (c[k]) { c[k].value = ""; c[k].dispatchEvent(new Event("change", { bubbles: true })); } }
    setTimeout(function () { if (div.parentNode) { div.style.opacity = "0"; div.style.transition = "opacity 0.3s ease-out"; setTimeout(function () { if (div.parentNode) div.parentNode.removeChild(div); }, 300); } }, SUCCESS_DURATION);
    div.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function procesarEnvio(campos, seccion) {
    var e = validar(campos);
    if (e.length > 0) { mostrarErrores(e); return false; }
    enviarWhatsApp(campos);
    enviarEmail(campos);
    mostrarExito(seccion, campos);
    return true;
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();