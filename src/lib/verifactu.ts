import "server-only";
import { createHash } from "crypto";
import QRCode from "qrcode";

/**
 * Verifactu (RD 1007/2023 / Orden HAC/1177/2024): construye el registro de
 * facturación con el formato oficial de la AEAT y lo deja listo para enviar.
 *
 * IMPORTANTE — esto NO envía nada a Hacienda todavía. El envío real requiere:
 *   1. Un certificado digital de la organización (FNMT, Cl@ve o similar).
 *   2. Una declaración responsable del software presentada ante la AEAT.
 * Ninguna de las dos cosas es algo que este código pueda generar — son
 * trámites del cliente/su gestoría. Mientras no existan, el registro se
 * calcula y se guarda igual (para no perder la cadena de huellas ni tener
 * que regenerar nada después), pero queda marcado como
 * `PENDIENTE_ENVIO` en vez de enviarse.
 *
 * El algoritmo de la huella y el contenido del QR siguen la especificación
 * técnica publicada por la AEAT al momento de escribir esto. Antes de activar
 * el envío real hay que verificar ambos contra la versión vigente de esa
 * especificación (puede haber cambiado).
 */

export type VerifactuInvoiceType = "F1" | "F2";

export type VerifactuChainLink = {
  number: string;
  issuedAt: Date;
  hash: string;
} | null;

export type VerifactuVatBreakdownLine = {
  vatRate: number;
  base: number;
  cuota: number;
};

export type VerifactuInvoiceInput = {
  organizationId: string;
  organizationTaxId: string;
  organizationName: string;
  number: string;
  issuedAt: Date;
  invoiceType: VerifactuInvoiceType;
  recipientTaxId: string | null;
  recipientName: string | null;
  vatBreakdown: VerifactuVatBreakdownLine[];
  cuotaTotal: number;
  total: number;
  previous: VerifactuChainLink;
};

// Identidad del software ante la AEAT. Es la misma para todas las
// organizaciones (todas usan el mismo software) — solo el número de
// instalación varía por organización. Los valores reales solo existen una
// vez presentada la declaración responsable; hasta entonces quedan como
// placeholders explícitos para que no se confundan con datos válidos.
const SOFTWARE_INFO = {
  productorNif: process.env.VERIFACTU_SOFTWARE_PRODUCER_TAXID ?? "PENDIENTE",
  productorNombre: process.env.VERIFACTU_SOFTWARE_PRODUCER_NAME ?? "Pendiente de declaración responsable",
  nombreSistema: "Intalva CRM",
  idSistema: process.env.VERIFACTU_SOFTWARE_ID ?? "PENDIENTE",
  version: "1.0",
};

// Entorno de pruebas de la AEAT (no producción) — no hay certificado ni alta
// en producción todavía, así que cualquier URL de validación generada apunta
// aquí. Cambiar a la URL de producción cuando el cliente esté dado de alta.
const AEAT_QR_BASE_URL = "https://prewww2.aeat.es/wlpl/TIKE-CONT/ValidarQR";

function installationNumber(organizationId: string) {
  return organizationId.slice(0, 8).toUpperCase();
}

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}

function formatFechaExpedicion(date: Date) {
  return `${pad2(date.getDate())}-${pad2(date.getMonth() + 1)}-${date.getFullYear()}`;
}

// ISO 8601 con el offset horario de Madrid (incluye horario de verano), tal
// como exige el campo FechaHoraHusoGenRegistro.
function formatFechaHoraHuso(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "shortOffset",
  }).formatToParts(date);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const offsetRaw = get("timeZoneName").replace("GMT", "") || "+0";
  const offsetSign = offsetRaw.startsWith("-") ? "-" : "+";
  const offsetHours = offsetRaw.replace(/[+-]/, "").padStart(2, "0");

  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:${get("second")}${offsetSign}${offsetHours}:00`;
}

function money2(n: number) {
  return n.toFixed(2);
}

/**
 * Cadena canónica sobre la que se calcula la huella (Anexo de la Orden
 * HAC/1177/2024): campos separados por "&", huella SHA-256 en hexadecimal
 * mayúsculas. Verificar el orden exacto contra la especificación vigente
 * antes de activar el envío real.
 */
function computeHuella(fields: {
  nifEmisor: string;
  numSerie: string;
  fechaExpedicion: string;
  tipoFactura: VerifactuInvoiceType;
  cuotaTotal: number;
  importeTotal: number;
  huellaAnterior: string;
  fechaHoraHuso: string;
}) {
  const canonical = [
    `IDEmisorFactura=${fields.nifEmisor}`,
    `NumSerieFactura=${fields.numSerie}`,
    `FechaExpedicionFactura=${fields.fechaExpedicion}`,
    `TipoFactura=${fields.tipoFactura}`,
    `CuotaTotal=${money2(fields.cuotaTotal)}`,
    `ImporteTotal=${money2(fields.importeTotal)}`,
    `Huella=${fields.huellaAnterior}`,
    `FechaHoraHusoGenRegistro=${fields.fechaHoraHuso}`,
  ].join("&");

  return createHash("sha256").update(canonical, "utf8").digest("hex").toUpperCase();
}

function buildQrUrl(input: { nifEmisor: string; numSerie: string; fechaExpedicion: string; total: number }) {
  const params = new URLSearchParams({
    nif: input.nifEmisor,
    numserie: input.numSerie,
    fecha: input.fechaExpedicion,
    importe: money2(input.total),
  });
  return `${AEAT_QR_BASE_URL}?${params.toString()}`;
}

export function buildVerifactuRegistro(input: VerifactuInvoiceInput) {
  const fechaExpedicion = formatFechaExpedicion(input.issuedAt);
  const fechaHoraHuso = formatFechaHoraHuso(input.issuedAt);
  const huellaAnterior = input.previous?.hash ?? "";

  const hash = computeHuella({
    nifEmisor: input.organizationTaxId,
    numSerie: input.number,
    fechaExpedicion,
    tipoFactura: input.invoiceType,
    cuotaTotal: input.cuotaTotal,
    importeTotal: input.total,
    huellaAnterior,
    fechaHoraHuso,
  });

  const qrUrl = buildQrUrl({
    nifEmisor: input.organizationTaxId,
    numSerie: input.number,
    fechaExpedicion,
    total: input.total,
  });

  const record = {
    IDVersion: "1.0",
    IDEmisorFactura: input.organizationTaxId,
    NombreRazonEmisor: input.organizationName,
    NumSerieFactura: input.number,
    FechaExpedicionFactura: fechaExpedicion,
    TipoFactura: input.invoiceType,
    Destinatarios: input.recipientTaxId
      ? [{ NIF: input.recipientTaxId, NombreRazon: input.recipientName ?? "" }]
      : [],
    Desglose: input.vatBreakdown.map((line) => ({
      TipoImpositivo: money2(line.vatRate),
      BaseImponible: money2(line.base),
      CuotaRepercutida: money2(line.cuota),
    })),
    CuotaTotal: money2(input.cuotaTotal),
    ImporteTotal: money2(input.total),
    Encadenamiento: input.previous
      ? {
          RegistroAnterior: {
            IDEmisorFactura: input.organizationTaxId,
            NumSerieFactura: input.previous.number,
            FechaExpedicionFactura: formatFechaExpedicion(input.previous.issuedAt),
            Huella: input.previous.hash,
          },
        }
      : { PrimerRegistro: "S" },
    SistemaInformatico: {
      NombreRazonProductor: SOFTWARE_INFO.productorNombre,
      NIFProductor: SOFTWARE_INFO.productorNif,
      NombreSistemaInformatico: SOFTWARE_INFO.nombreSistema,
      IdSistemaInformatico: SOFTWARE_INFO.idSistema,
      Version: SOFTWARE_INFO.version,
      NumeroInstalacion: installationNumber(input.organizationId),
    },
    TipoHuella: "01",
    Huella: hash,
    FechaHoraHusoGenRegistro: fechaHoraHuso,
  };

  return { record, hash, qrUrl };
}

/** true solo cuando exista un certificado digital configurado para envíos reales. */
export function isVerifactuSubmissionConfigured() {
  return Boolean(process.env.VERIFACTU_CERT_PATH);
}

export type VerifactuSubmissionResult =
  | { status: "PENDIENTE_ENVIO" }
  | { status: "ENVIADO" }
  | { status: "ERROR"; error: string };

/**
 * Punto de entrada para el envío real al webservice SOAP de la AEAT. Sin
 * certificado configurado, no intenta enviar nada — deja el registro listo
 * y marcado como pendiente. La llamada SOAP real (autenticación mTLS con el
 * certificado + firma XAdES del XML) no está implementada: no hay forma de
 * probarla sin un certificado real, y fingir que funciona sería peor que no
 * tenerla.
 */
export async function submitVerifactuRecord(): Promise<VerifactuSubmissionResult> {
  if (!isVerifactuSubmissionConfigured()) {
    return { status: "PENDIENTE_ENVIO" };
  }

  return {
    status: "ERROR",
    error:
      "Certificado detectado pero el envío SOAP real no está implementado todavía (falta cliente mTLS + firma XAdES).",
  };
}

/** Genera el QR como data URL (PNG en base64) a partir de la URL de validación guardada. */
export async function renderVerifactuQrDataUrl(qrUrl: string) {
  return QRCode.toDataURL(qrUrl, { margin: 1, width: 180 });
}
