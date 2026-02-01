/**
 * Utilidades y helpers para el dashboard
 */

/**
 * Formatea un número a formato de moneda
 */
export function formatCurrency(value: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(value);
}

/**
 * Formatea un número con separadores de miles
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('es-PE').format(value);
}

/**
 * Formatea un porcentaje
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Convierte una fecha a formato legible
 */
export function formatDate(date: Date | string, format: string = 'dd/MM/yyyy'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();

  return format
    .replace('dd', day)
    .replace('MM', month)
    .replace('yyyy', String(year));
}

/**
 * Obtiene el mes en español
 */
export function getMonthName(date: Date): string {
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  return months[date.getMonth()];
}

/**
 * Calcula la diferencia de días entre dos fechas
 */
export function daysBetween(date1: Date, date2: Date): number {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round(Math.abs((date1.getTime() - date2.getTime()) / oneDay));
}

/**
 * Verifica si una fecha es hoy
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

/**
 * Verifica si una fecha es en el mes actual
 */
export function isThisMonth(date: Date): boolean {
  const today = new Date();
  return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
}

/**
 * Trunca un texto a una longitud máxima
 */
export function truncateText(text: string, maxLength: number = 50): string {
  if (text.length > maxLength) {
    return text.substring(0, maxLength) + '...';
  }
  return text;
}

/**
 * Capitaliza la primera letra
 */
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Convierte un texto a "Title Case"
 */
export function toTitleCase(text: string): string {
  return text
    .toLowerCase()
    .split(' ')
    .map(word => capitalize(word))
    .join(' ');
}

/**
 * Genera un color hexadecimal aleatorio
 */
export function getRandomColor(): string {
  return '#' + Math.floor(Math.random() * 16777215).toString(16);
}

/**
 * Obtiene un color basado en un estado
 */
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    'resolved': '#10b981',
    'pending': '#f59e0b',
    'in-progress': '#3b82f6',
    'critical': '#ef4444',
    'high': '#f59e0b',
    'normal': '#3b82f6',
    'success': '#10b981',
    'warning': '#f59e0b',
    'error': '#ef4444',
    'info': '#3b82f6'
  };
  return colors[status] || '#6b7280';
}

/**
 * Obtiene un icono basado en un tipo
 */
export function getStatusIcon(status: string): string {
  const icons: Record<string, string> = {
    'resolved': '✓',
    'pending': '⏱',
    'in-progress': '⟳',
    'critical': '⚠',
    'high': '↑',
    'normal': '→',
    'success': '✓',
    'warning': '⚠',
    'error': '✕',
    'info': 'ℹ'
  };
  return icons[status] || '•';
}

/**
 * Calcula el porcentaje de cambio
 */
export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / Math.abs(previous)) * 100;
}

/**
 * Verifica si un número es positivo
 */
export function isPositive(value: number): boolean {
  return value >= 0;
}

/**
 * Obtiene la clase CSS según el estado
 */
export function getStatusClass(status: string): string {
  return `status-badge--${status}`;
}

/**
 * Genera un ID único
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Pausa la ejecución por un tiempo específico
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Obtiene el valor anidado de un objeto
 */
export function getNestedValue(obj: any, path: string): any {
  const parts = path.split('.');
  let current = obj;

  for (const part of parts) {
    current = current?.[part];
    if (current === undefined) return null;
  }

  return current;
}

/**
 * Ordena un array de objetos
 */
export function sortByProperty<T extends Record<string, any>>(
  array: T[],
  property: keyof T,
  ascending: boolean = true
): T[] {
  return [...array].sort((a, b) => {
    const aValue = a[property];
    const bValue = b[property];

    if (typeof aValue === 'string') {
      return ascending 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    return ascending ? aValue - bValue : bValue - aValue;
  });
}

/**
 * Filtra un array según múltiples criterios
 */
export function filterByProperties<T extends Record<string, any>>(
  array: T[],
  filters: Partial<T>
): T[] {
  return array.filter(item => {
    return Object.entries(filters).every(([key, value]) => {
      return item[key] === value;
    });
  });
}

/**
 * Agrupa un array por una propiedad
 */
export function groupByProperty<T extends Record<string, any>>(
  array: T[],
  property: keyof T
): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const key = String(item[property]);
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}

/**
 * Sumariza valores de un array
 */
export function sumByProperty<T extends Record<string, any>>(
  array: T[],
  property: keyof T
): number {
  return array.reduce((sum, item) => {
    const value = item[property];
    return sum + (typeof value === 'number' ? value : 0);
  }, 0);
}

/**
 * Calcula el promedio de valores
 */
export function averageByProperty<T extends Record<string, any>>(
  array: T[],
  property: keyof T
): number {
  if (array.length === 0) return 0;
  return sumByProperty(array, property) / array.length;
}

/**
 * Encuentra el máximo valor
 */
export function maxByProperty<T extends Record<string, any>>(
  array: T[],
  property: keyof T
): T | null {
  if (array.length === 0) return null;
  return array.reduce((max, item) => {
    return item[property] > max[property] ? item : max;
  });
}

/**
 * Encuentra el mínimo valor
 */
export function minByProperty<T extends Record<string, any>>(
  array: T[],
  property: keyof T
): T | null {
  if (array.length === 0) return null;
  return array.reduce((min, item) => {
    return item[property] < min[property] ? item : min;
  });
}

/**
 * Deduplicado un array
 */
export function deduplicate<T>(array: T[], property?: keyof T): T[] {
  if (property) {
    const seen = new Set();
    return array.filter(item => {
      const key = (item as any)[property];
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
  return [...new Set(array)];
}

/**
 * Paginación de un array
 */
export function paginate<T>(
  array: T[],
  page: number = 1,
  pageSize: number = 10
): { data: T[]; total: number; pages: number; currentPage: number } {
  const total = array.length;
  const pages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  const data = array.slice(start, start + pageSize);

  return { data, total, pages, currentPage: page };
}

/**
 * Busca en un array
 */
export function search<T extends Record<string, any>>(
  array: T[],
  query: string,
  searchFields: (keyof T)[]
): T[] {
  const lowerQuery = query.toLowerCase();
  return array.filter(item => {
    return searchFields.some(field => {
      const value = String(item[field]).toLowerCase();
      return value.includes(lowerQuery);
    });
  });
}

/**
 * Exporta datos a CSV
 */
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  filename: string = 'export.csv'
): void {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(','),
    ...data.map(row =>
      headers
        .map(header => {
          const value = row[header];
          const escaped = String(value).replace(/"/g, '""');
          return `"${escaped}"`;
        })
        .join(',')
    )
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Copia un texto al portapapeles
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Error al copiar:', err);
    return false;
  }
}

/**
 * Valida un email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida un número de teléfono
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
  return phoneRegex.test(phone);
}
