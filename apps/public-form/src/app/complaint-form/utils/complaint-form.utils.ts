import { Location } from '../../interfaces/location.interface';
import { PhoneCountry } from '../../interfaces/phone-country.interface';

export function scoreLocation(location: Location, rawTerm: string): number {
  if (!rawTerm) {
    return 0;
  }

  const term = rawTerm.toLowerCase();
  const district = location.district?.toLowerCase() || '';
  const province = location.province?.toLowerCase() || '';
  const department = location.department?.toLowerCase() || '';
  const displayName = location.displayName?.toLowerCase() || '';

  let score = 0;

  if (district === term) score += 100;
  else if (district.startsWith(term)) score += 80;
  else if (district.includes(term)) score += 60;

  if (province === term) score += 50;
  else if (province.startsWith(term)) score += 35;
  else if (province.includes(term)) score += 20;

  if (department === term) score += 30;
  else if (department.startsWith(term)) score += 15;

  if (displayName.includes(term)) score += 10;

  if (location.ubigeo?.startsWith(term)) score += 5;

  return score;
}

export function scorePhoneCountry(country: PhoneCountry, rawTerm: string): number {
  const term = rawTerm.toLowerCase();
  const name = country.name.toLowerCase();
  const code = country.code.toLowerCase();
  const iso = country.iso.toLowerCase();

  let score = 0;
  if (name === term) score += 100;
  else if (name.startsWith(term)) score += 70;
  else if (name.includes(term)) score += 40;

  if (code.startsWith(term)) score += 60;
  else if (code.includes(term)) score += 30;

  if (iso.startsWith(term)) score += 50;
  else if (iso.includes(term)) score += 20;

  return score;
}
