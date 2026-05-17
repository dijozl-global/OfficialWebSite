/**
 * DIJO Aeromaritime - Formulario "RESERVA DE FLETES"
 * WhatsApp + Email (EmailJS via SDK cargado estáticamente en <head>)
 */
(function () {
  "use strict";

  // ═══════════ ⚙️ PEGA TUS 3 DATOS DE EMAILJS AQUÍ ═══════════
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

  // ── Inicializar EmailJS ──
  var emailJSAvailable = false;
  function initEmailJS() {
    if (typeof emailjs === "undefined") {
      console.warn("[DIJO Form] ⚠️ EmailJS SDK no encontrado. ¿Agregaste el <script> en <head>? Solo WhatsApp.");
      return;
    }
    if (EMAILJS_PUBLIC_KEY === "c2LRgfhGqc2ZGjoDI") {
      console.log("[DIJO Form] ℹ️ Public Key sin configurar. Solo WhatsApp.");
      return;
    }
    emailjs.init(EMAILJS_PUBLIC_KEY);
    emailJSAvailable = true;
    console.log("[DIJO Form] ✅ EmailJS listo.");
  }

  function init() {
    initEmailJS();

    var seccion = document.getElementById("reserva") || document.querySelector('section[id*="reserv"]');
    if (!seccion) { setTimeout(init, 500); return; }

    var inputs = seccion.querySelectorAll("input, select, textarea");
    if (inputs.length === 0) { setTimeout(init, 500); return; }

    console.log("[DIJO Form] ✅ " + inputs.length + " campos detectados.");
    var campos = mapearCampos(inputs);

    var form = seccion.querySelector("form");
    if (form) {
      form.addEventListener("submit", function (e) { e.preventDefault(); procesarEnvio(campos, seccion); });
      form.setAttribute("novalidate", "");
    }
    var submitBtn = seccion.querySelector("button[type='submit'], button, a.button, a.btn");
    if (submitBtn && (!form || form.tagName !== "FORM")) {
      submitBtn.addEventListener("click", function (e) { e.preventDefault(); procesarEnvio(campos, seccion); });
    }
  }

  function mapearCampos(inputs) {
    var result = { nombre:null, empresa:null, email:null, telefono:null, puertoOrigen:null,
                   puertoDestino:null, tipoContenedor:null, cantidad:null, detalles:null };
    inputs.forEach(function (inp) {
      var tag = inp.tagName.toLowerCase();
      if (tag === "select" || tag === "input" || tag === "textarea") {
        var type = (inp.type || "").toLowerCase();
        var fp = ((inp.name||"") + " " + (inp.placeholder||"") + " " + (inp.id||"") + " " + (inp.getAttribute("aria-label")||"")).toLowerCase();
        if (!result.nombre && /nombre|name|nom/.test(fp) && type !== "email") result.nombre = inp;
        if (!result.empresa && /empresa|company|entreprise/.test(fp)) result.empresa = inp;
        if (!result.email && (type === "email" || /email|correo|mail/.test(fp))) result.email = inp;
        if (!result.telefono && /tel|whatsapp|phone|fono/.test(fp)) result.telefono = inp;
        if (!result.puertoOrigen && /origen|origin|origine/.test(fp)) result.puertoOrigen = inp;
        if (!result.puertoDestino && /destino|destination/.test(fp)) result.puertoDestino = inp;
        if (!result.tipoContenedor && /contenedor|container|conteneur|tipo/.test(fp)) result.tipoContenedor = inp;
        if (!result.cantidad && /cantidad|cant|quantity|quantit/.test(fp)) result.cantidad = inp;
        if (!result.detalles && /detalle|detail|carga|cargo|cargaison|mercan/.test(fp)) result.detalles = inp;
      }
    });
    var sinMapear = [];
    for (var key in result) { if (!result[key]) sinMapear.push(key); }
    if (sinMapear.length > 0) {
      inputs.forEach(function (inp) {
        var tag = inp.tagName.toLowerCase();
        if ((tag === "input" || tag === "select" || tag === "textarea") && sinMapear.length > 0) {
          var ya = false;
          for (var k in result) { if (result[k] === inp) ya = true; }
          if (!ya) result[sinMapear.shift()] = inp;
        }
      });
    }
    return result;
  }

  function getVal(campo) {
    if (!campo) return "";
    var v = (campo.value || "").trim();
    if (campo.tagName === "SELECT" && campo.selectedOptions && campo.selectedOptions[0])
      v = campo.selectedOptions[0].textContent.trim();
    return v;
  }

  function validar(campos) {
    var errores = [];
    if (!getVal(campos.nombre)) errores.push({ campo: campos.nombre, msg: t("required") });
    if (!getVal(campos.empresa)) errores.push({ campo: campos.empresa, msg: t("required") });
    if (!getVal(campos.telefono)) errores.push({ campo: campos.telefono, msg: t("required") });
    if (!getVal(campos.puertoOrigen)) errores.push({ campo: campos.puertoOrigen, msg: t("required") });
    if (!getVal(campos.puertoDestino)) errores.push({ campo: campos.puertoDestino, msg: t("required") });
    if (!getVal(campos.detalles)) errores.push({ campo: campos.detalles, msg: t("required") });
    var email = getVal(campos.email);
    if (!email) errores.push({ campo: campos.email, msg: t("required") });
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errores.push({ campo: campos.email, msg: t("invalidEmail") });
    return errores;
  }

  function mostrarErrores(errores) {
    document.querySelectorAll(".form-error-msg").forEach(function (el) { el.remove(); });
    document.querySelectorAll(".form-field-error").forEach(function (el) { el.classList.remove("form-field-error"); });
    errores.forEach(function (err) {
      if (err.campo) {
        err.campo.classList.add("form-field-error");
        var span = document.createElement("span");
        span.className = "form-error-msg";
        span.textContent = err.msg;
        span.style.cssText = "display:block;color:#f87171;font-size:0.7rem;margin-top:2px;animation:fadeInDown 0.2s ease-out";
        err.campo.parentNode.appendChild(span);
        setTimeout(function () { if (span.parentNode) span.parentNode.removeChild(span); err.campo.classList.remove("form-field-error"); }, 4000);
      }
    });
    if (errores[0] && errores[0].campo) { errores[0].campo.scrollIntoView({ behavior: "smooth", block: "center" }); setTimeout(function () { errores[0].campo.focus(); }, 400); }
  }

  function enviarWhatsApp(campos) {
    var mensaje =
      "\uD83D\uDEA2 *RESERVA DE FLETES — DIJO Aeromaritime S.A.*\n\n" +
      "\uD83D\uDCCB *Nombre:* " + getVal(campos.nombre) + "\n" +
      "\uD83C\uDFE2 *Empresa:* " + getVal(campos.empresa) + "\n" +
      "\uD83D\uDCE7 *Email:* " + getVal(campos.email) + "\n" +
      "\uD83D\uDCF1 *WhatsApp/Tel:* " + getVal(campos.telefono) + "\n\n" +
      "\uD83D\uDCCD *Puerto Origen:* " + getVal(campos.puertoOrigen) + "\n" +
      "\uD83D\uDCCD *Puerto Destino:* " + getVal(campos.puertoDestino) + "\n" +
      "\uD83D\uDCE6 *Tipo Contenedor:* " + getVal(campos.tipoContenedor) + "\n" +
      "\uD83D\uDD22 *Cantidad:* " + getVal(campos.cantidad) + "\n\n" +
      "\uD83D\uDCDD *Detalles de Carga:*\n" + getVal(campos.detalles);
    var url = "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(mensaje.trim());
    var nw = window.open(url, "_blank", "noopener,noreferrer");
    if (!nw || nw.closed || typeof nw.closed === "undefined") window.location.href = url;
  }

  function enviarEmail(campos) {
    if (!emailJSAvailable) { console.warn("[DIJO Form] ⚠️ EmailJS no disponible. Solo WhatsApp."); return; }

    var params = {
      nombre: getVal(campos.nombre), empresa: getVal(campos.empresa),
      email: getVal(campos.email), telefono: getVal(campos.telefono),
      puertoOrigen: getVal(campos.puertoOrigen), puertoDestino: getVal(campos.puertoDestino),
      tipoContenedor: getVal(campos.tipoContenedor), cantidad: getVal(campos.cantidad),
      detalles: getVal(campos.detalles),
    };

    emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, params).then(
      function () { console.log("[DIJO Form] ✅ Email enviado a dijoaeromaritime@gmail.com"); },
      function (err) { console.warn("[DIJO Form] ⚠️ EmailJS: " + (err.text || err.message)); }
    );
  }

  function mostrarExito(seccion, campos) {
    document.querySelectorAll(".form-error-msg").forEach(function (el) { el.remove(); });
    document.querySelectorAll(".form-field-error").forEach(function (el) { el.classList.remove("form-field-error"); });
    var existente = seccion.querySelector(".form-success-alert");
    if (existente) existente.remove();

    var div = document.createElement("div");
    div.className = "form-success-alert";
    div.innerHTML = "<span style='font-size:1.2rem;margin-right:6px;'>\u2705</span>" + t("success");
    div.style.cssText = "display:flex;align-items:center;gap:6px;margin-top:1rem;padding:0.75rem 1rem;background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2);border-radius:0.75rem;color:#6ee7b7;font-size:0.85rem;font-weight:500;animation:fadeInUp 0.4s ease-out";
    var panel = seccion.querySelector("form") || seccion.lastElementChild;
    (panel || seccion).appendChild(div);

    for (var key in campos) { if (campos[key]) { campos[key].value = ""; campos[key].dispatchEvent(new Event("change", { bubbles: true })); } }
    setTimeout(function () { if (div.parentNode) { div.style.opacity = "0"; div.style.transition = "opacity 0.3s ease-out"; setTimeout(function () { if (div.parentNode) div.parentNode.removeChild(div); }, 300); } }, SUCCESS_DURATION);
    div.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function procesarEnvio(campos, seccion) {
    var errores = validar(campos);
    if (errores.length > 0) { mostrarErrores(errores); return false; }
    enviarWhatsApp(campos);
    enviarEmail(campos);
    mostrarExito(seccion, campos);
    return true;
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();