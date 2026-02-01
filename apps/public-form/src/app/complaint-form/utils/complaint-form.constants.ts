export const FORM_LIMITS = {
  MIN_DESC_LENGTH: 100,
  MAX_DESC_LENGTH: 3000,
  MIN_GOOD_DESC_LENGTH: 50,
  MAX_GOOD_DESC_LENGTH: 1000,
  MIN_REQUEST_LENGTH: 50,
  MAX_REQUEST_LENGTH: 1000,
  MIN_ADDRESS_LENGTH: 15,
  MAX_ADDRESS_LENGTH: 150,
  MAX_FILE_SIZE: 153600
} as const;

export const NAME_PATTERN = "^[a-zA-ZÀ-ÿ\u00f1\u00d1]+([ .,'&()a-zA-ZÀ-ÿ\u00f1\u00d1]*)*$";
export const COMPANY_NAME_PATTERN = "^[A-Za-zÀ-ÿ0-9 .,'&()\-]+$";
export const EMAIL_PATTERN = '^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$';

export const DOCUMENT_RULES: Record<string, { min: number; max: number; pattern: RegExp; hint: string }> = {
  'DNI': { min: 8, max: 8, pattern: /^[0-9]+$/, hint: 'DNI: exactamente 8 dígitos' },
  'CARNET DE EXTRANJERIA': { min: 9, max: 12, pattern: /^[0-9]+$/, hint: 'Carnet de Extranjería: 9 a 12 dígitos' },
  'PASAPORTE': { min: 6, max: 12, pattern: /^[A-Za-z0-9]+$/, hint: 'Pasaporte: 6 a 12 caracteres (letras y números)' },
  'RUC': { min: 11, max: 11, pattern: /^[0-9]+$/, hint: 'RUC: exactamente 11 dígitos' },
  'BREVETE': { min: 8, max: 8, pattern: /^[0-9]+$/, hint: 'Brevete: exactamente 8 dígitos' }
};

export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];
