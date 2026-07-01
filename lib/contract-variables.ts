import { formatDate, formatCurrency } from "./utils";

export const TEMPLATE_VARIABLES = [
  { key: "{{NOMBRE_INQUILINO}}", label: "Nombre completo del inquilino" },
  { key: "{{EMAIL_INQUILINO}}", label: "Email del inquilino" },
  { key: "{{TELEFONO_INQUILINO}}", label: "Teléfono del inquilino" },
  { key: "{{DNI_INQUILINO}}", label: "Documento de identidad del inquilino" },
  { key: "{{PROPIEDAD}}", label: "Nombre de la propiedad" },
  { key: "{{DIRECCION}}", label: "Dirección completa de la propiedad" },
  { key: "{{CIUDAD}}", label: "Ciudad" },
  { key: "{{CODIGO_POSTAL}}", label: "Código postal" },
  { key: "{{NUMERO_HABITACION}}", label: "Número de habitación" },
  { key: "{{RENTA_MENSUAL}}", label: "Renta mensual" },
  { key: "{{FIANZA}}", label: "Importe de la fianza" },
  { key: "{{FECHA_INICIO}}", label: "Fecha de inicio del contrato" },
  { key: "{{FECHA_FIN}}", label: "Fecha de fin del contrato" },
  { key: "{{FECHA_HOY}}", label: "Fecha actual" },
];

export interface ContractData {
  tenant_name: string;
  tenant_email: string;
  tenant_phone: string;
  tenant_id_number: string;
  property_name: string;
  property_address: string;
  property_city: string;
  property_postal_code: string;
  room_number: string;
  monthly_rent: number;
  deposit_amount: number;
  start_date: string;
  end_date: string | null;
}

export function applyVariables(template: string, data: ContractData): string {
  return template
    .replace(/\{\{NOMBRE_INQUILINO\}\}/g, data.tenant_name)
    .replace(/\{\{EMAIL_INQUILINO\}\}/g, data.tenant_email)
    .replace(/\{\{TELEFONO_INQUILINO\}\}/g, data.tenant_phone || "—")
    .replace(/\{\{DNI_INQUILINO\}\}/g, data.tenant_id_number || "—")
    .replace(/\{\{PROPIEDAD\}\}/g, data.property_name)
    .replace(/\{\{DIRECCION\}\}/g, data.property_address)
    .replace(/\{\{CIUDAD\}\}/g, data.property_city)
    .replace(/\{\{CODIGO_POSTAL\}\}/g, data.property_postal_code)
    .replace(/\{\{NUMERO_HABITACION\}\}/g, data.room_number)
    .replace(/\{\{RENTA_MENSUAL\}\}/g, formatCurrency(data.monthly_rent))
    .replace(/\{\{FIANZA\}\}/g, formatCurrency(data.deposit_amount))
    .replace(/\{\{FECHA_INICIO\}\}/g, formatDate(data.start_date))
    .replace(/\{\{FECHA_FIN\}\}/g, data.end_date ? formatDate(data.end_date) : "Indefinida")
    .replace(/\{\{FECHA_HOY\}\}/g, formatDate(new Date()));
}
