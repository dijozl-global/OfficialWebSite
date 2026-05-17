/**
 * DIJO Aeromaritime - Manejador del formulario "RESERVA DE FLETES"
 * Intercepta el submit, valida, y envía por WhatsApp al +507 6826-4309
 * Incluye fallback anti popup-blocker
 */
(function () {
  "use strict";

  const WHATSAPP_NUMBER = "50768264309";
  const SUCCESS_DURATION = 8000; // ms que se muestra el mensaje de éxito

  // ═══════════════ DETECTAR IDIOMA ═══════════════
  function getLang() {
    var lang = (document.documentElement.lang || navigator.language || "es").split("-")[0];
    return ["es", "en", "fr"].indexOf(lang) !== -1 ? lang : "es";
  }

  var MSG = {
    es: {
      required: "Este campo es requerido",
      invalidEmail: "Email inválido",
      success: "\u2713 Solicitud enviada. Te contactaremos en menos de 24 horas.",
      btnText: "\uD83D\uDEA2 Enviar Solicitud de Reserva",
    },
    en: {
      required: "This field is required",
      invalidEmail: "Invalid email",
      success: "\u2713 Request sent. We will contact you within 24 hours.",
      btnText: "\uD83D\uDEA2 Send Booking Request",
    },
    fr: {
      required: "Ce champ est requis",
      invalidEmail: "Email invalide",
      success: "\u2713 Demande envoyée. Nous vous contacterons sous 24 heures.",
      btnText: "\uD83D\uDEA2 Envoyer la Demande",
    },
  };

  function t(key) {
    return MSG[getLang()][key] || MSG["es"][key];
  }

  // ═══════════════ ESPERAR A QUE EL DOM ESTÉ LISTO ═══════════════
  function init() {
    // Buscar la sección de reserva (id="reserva" o la sección que contenga el form)
    var seccion = document.getElementById("reserva") || document.querySelector('section[id*="reserv"]');

    if (!seccion) {
      console.warn("[DIJO Form] No se encontró la sección de reserva (#reserva). Reintentando en 500ms...");
      setTimeout(init, 500);
      return;
    }

    // Buscar TODOS los inputs, selects y textarea dentro de la sección
    var inputs = seccion.querySelectorAll("input, select, textarea");
    var submitBtn = seccion.querySelector("button[type='submit'], button.btn-primary, button, a.button, a.btn");

    if (inputs.length === 0) {
      console.warn("[DIJO Form] No se encontraron campos de formulario. Reintentando en 500ms...");
      setTimeout(init, 500);
      return;
    }

    console.log("[DIJO Form] ✅ Formulario detectado con " + inputs.length + " campos.");

    // Mapear campos por orden o por placeholder/name
    var campos = mapearCampos(inputs, seccion);

    // ═══════════════ INTERCEPTAR SUBMIT ═══════════════
    // Estrategia: encontrar el form o el botón y prevenir el envío normal

    var form = seccion.querySelector("form");
    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        procesarEnvio(campos, seccion);
      });
      form.setAttribute("novalidate", "");
    }

    // También interceptar el botón directamente por si no hay <form>
    if (submitBtn) {
      submitBtn.addEventListener("click", function (e) {
        // Si ya hay form, dejar que el evento de submit se encargue
        if (!form || form.tagName !== "FORM") {
          e.preventDefault();
          procesarEnvio(campos, seccion);
        }
      });
    }

    // Si no hay form ni botón claro, interceptar clics en la sección
    if (!form && !submitBtn) {
      seccion.addEventListener("click", function (e) {
        var target = e.target;
        if (
          target.tagName === "BUTTON" ||
          (target.tagName === "A" && target.getAttribute("href") === "#") ||
          target.classList.contains("btn") ||
          target.closest("button")
        ) {
          e.preventDefault();
          procesarEnvio(campos, seccion);
        }
      });
    }
  }

  // ═══════════════ MAPEAR CAMPOS ═══════════════
  function mapearCampos(inputs, seccion) {
    var result = {
      nombre: null,
      empresa: null,
      email: null,
      telefono: null,
      puertoOrigen: null,
      puertoDestino: null,
      tipoContenedor: null,
      cantidad: null,
      detalles: null,
    };

    inputs.forEach(function (inp) {
      var tag = inp.tagName.toLowerCase();
      if (tag === "select" || tag === "input" || tag === "textarea") {
        var type = (inp.type || "").toLowerCase();
        var name = (inp.name || "").toLowerCase();
        var placeholder = (inp.placeholder || "").toLowerCase();
        var id = (inp.id || "").toLowerCase();
        var ariaLabel = (inp.getAttribute("aria-label") || "").toLowerCase();

        var fingerprint = name + " " + placeholder + " " + id + " " + ariaLabel;

        if (!result.nombre && /nombre|name|nom/.test(fingerprint) && type !== "email") result.nombre = inp;
        if (!result.empresa && /empresa|company|entreprise/.test(fingerprint)) result.empresa = inp;
        if (!result.email && (type === "email" || /email|correo|mail/.test(fingerprint))) result.email = inp;
        if (!result.telefono && /tel|whatsapp|phone|fono/.test(fingerprint)) result.telefono = inp;
        if (!result.puertoOrigen && /origen|origin|origine/.test(fingerprint)) result.puertoOrigen = inp;
        if (!result.puertoDestino && /destino|destination/.test(fingerprint)) result.puertoDestino = inp;
        if (!result.tipoContenedor && /contenedor|container|conteneur|tipo/.test(fingerprint))
          result.tipoContenedor = inp;
        if (!result.cantidad && /cantidad|cant|quantity|quantit/.test(fingerprint)) result.cantidad = inp;
        if (!result.detalles && /detalle|detail|carga|cargo|cargaison|mercan/.test(fingerprint))
          result.detalles = inp;
      }
    });

    // Fallback: asignar por orden si no se detectó por nombre
    var sinMapear = [];
    for (var key in result) {
      if (!result[key]) sinMapear.push(key);
    }

    if (sinMapear.length > 0) {
      inputs.forEach(function (inp) {
        var tag = inp.tagName.toLowerCase();
        if ((tag === "input" || tag === "select" || tag === "textarea") && sinMapear.length > 0) {
          var alreadyMapped = false;
          for (var k in result) {
            if (result[k] === inp) alreadyMapped = true;
          }
          if (!alreadyMapped) {
            result[sinMapear.shift()] = inp;
          }
        }
      });
    }

    return result;
  }

  // ═══════════════ OBTENER VALOR LIMPIO ═══════════════
  function getVal(campo) {
    if (!campo) return "";
    var v = (campo.value || "").trim();
    if (campo.tagName === "SELECT" && campo.selectedOptions && campo.selectedOptions[0]) {
      v = campo.selectedOptions[0].textContent.trim();
    }
    return v;
  }

  // ═══════════════ VALIDAR ═══════════════
  function validar(campos) {
    var errores = [];

    if (!getVal(campos.nombre)) errores.push({ campo: campos.nombre, msg: t("required") });
    if (!getVal(campos.empresa)) errores.push({ campo: campos.empresa, msg: t("required") });
    if (!getVal(campos.telefono)) errores.push({ campo: campos.telefono, msg: t("required") });
    if (!getVal(campos.puertoOrigen)) errores.push({ campo: campos.puertoOrigen, msg: t("required") });
    if (!getVal(campos.puertoDestino)) errores.push({ campo: campos.puertoDestino, msg: t("required") });
    if (!getVal(campos.detalles)) errores.push({ campo: campos.detalles, msg: t("required") });

    var email = getVal(campos.email);
    if (!email) {
      errores.push({ campo: campos.email, msg: t("required") });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errores.push({ campo: campos.email, msg: t("invalidEmail") });
    }

    return errores;
  }

  // ═══════════════ MOSTRAR ERROR ═══════════════
  function mostrarErrores(errores) {
    // Limpiar errores anteriores
    document.querySelectorAll(".form-error-msg").forEach(function (el) {
      el.remove();
    });
    document.querySelectorAll(".form-field-error").forEach(function (el) {
      el.classList.remove("form-field-error");
    });

    errores.forEach(function (err) {
      if (err.campo) {
        err.campo.classList.add("form-field-error");

        var span = document.createElement("span");
        span.className = "form-error-msg";
        span.textContent = err.msg;
        span.style.cssText =
          "display:block;color:#f87171;font-size:0.7rem;margin-top:2px;animation:fadeInDown 0.2s ease-out";

        err.campo.parentNode.appendChild(span);

        // Quitar después de 4s
        setTimeout(function () {
          if (span.parentNode) span.parentNode.removeChild(span);
          err.campo.classList.remove("form-field-error");
        }, 4000);
      }
    });

    // Scroll al primer error
    if (errores[0] && errores[0].campo) {
      errores[0].campo.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(function () {
        errores[0].campo.focus();
      }, 400);
    }
  }

  // ═══════════════ ENVIAR POR WHATSAPP ═══════════════
  function enviarWhatsApp(campos) {
    var mensaje =
      "\uD83D\uDEA2 *RESERVA DE FLETES — DIJO Aeromaritime S.A.*\n" +
      "\n" +
      "\uD83D\uDCCB *Nombre:* " +
      getVal(campos.nombre) +
      "\n" +
      "\uD83C\uDFE2 *Empresa:* " +
      getVal(campos.empresa) +
      "\n" +
      "\uD83D\uDCE7 *Email:* " +
      getVal(campos.email) +
      "\n" +
      "\uD83D\uDCF1 *WhatsApp/Tel:* " +
      getVal(campos.telefono) +
      "\n" +
      "\n" +
      "\uD83D\uDCCD *Puerto Origen:* " +
      getVal(campos.puertoOrigen) +
      "\n" +
      "\uD83D\uDCCD *Puerto Destino:* " +
      getVal(campos.puertoDestino) +
      "\n" +
      "\uD83D\uDCE6 *Tipo Contenedor:* " +
      getVal(campos.tipoContenedor) +
      "\n" +
      "\uD83D\uDD22 *Cantidad:* " +
      getVal(campos.cantidad) +
      "\n" +
      "\n" +
      "\uD83D\uDCDD *Detalles de Carga:*\n" +
      getVal(campos.detalles);

    var url = "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(mensaje.trim());

    // Intentar abrir en nueva pestaña
    var nuevaVentana = window.open(url, "_blank", "noopener,noreferrer");

    // Si el popup fue bloqueado, redirigir en la misma ventana
    if (!nuevaVentana || nuevaVentana.closed || typeof nuevaVentana.closed === "undefined") {
      window.location.href = url;
    }
  }

  // ═══════════════ MOSTRAR ÉXITO ═══════════════
  function mostrarExito(seccion, campos) {
    // Limpiar errores previos
    document.querySelectorAll(".form-error-msg").forEach(function (el) {
      el.remove();
    });
    document.querySelectorAll(".form-field-error").forEach(function (el) {
      el.classList.remove("form-field-error");
    });

    // Buscar si ya existe un mensaje de éxito
    var existente = seccion.querySelector(".form-success-alert");
    if (existente) existente.remove();

    var div = document.createElement("div");
    div.className = "form-success-alert";
    div.innerHTML = "<span style='font-size:1.2rem;margin-right:6px;'>\u2705</span>" + t("success");
    div.style.cssText =
      "display:flex;align-items:center;gap:6px;margin-top:1rem;padding:0.75rem 1rem;" +
      "background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2);" +
      "border-radius:0.75rem;color:#6ee7b7;font-size:0.85rem;font-weight:500;" +
      "animation:fadeInUp 0.4s ease-out";

    // Insertar después del form/último grupo de inputs
    var formPanel = seccion.querySelector("form") || seccion.querySelector(".form-panel") || seccion.lastElementChild;
    if (formPanel) {
      formPanel.appendChild(div);
    } else {
      seccion.appendChild(div);
    }

    // Limpiar campos
    for (var key in campos) {
      if (campos[key]) {
        campos[key].value = "";
        // Disparar evento change para frameworks reactivos
        campos[key].dispatchEvent(new Event("change", { bubbles: true }));
      }
    }

    // Remover después de SUCCESS_DURATION
    setTimeout(function () {
      if (div.parentNode) {
        div.style.opacity = "0";
        div.style.transition = "opacity 0.3s ease-out";
        setTimeout(function () {
          if (div.parentNode) div.parentNode.removeChild(div);
        }, 300);
      }
    }, SUCCESS_DURATION);

    // Scroll al mensaje
    div.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  // ═══════════════ PROCESAR ENVÍO ═══════════════
  function procesarEnvio(campos, seccion) {
    var errores = validar(campos);

    if (errores.length > 0) {
      mostrarErrores(errores);
      return false;
    }

    enviarWhatsApp(campos);
    mostrarExito(seccion, campos);
    return true;
  }

  // ═══════════════ INICIAR ═══════════════
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // También reintentar después de carga completa por si el DOM se modifica dinámicamente
  window.addEventListener("load", function () {
    setTimeout(init, 300);
  });
})();
