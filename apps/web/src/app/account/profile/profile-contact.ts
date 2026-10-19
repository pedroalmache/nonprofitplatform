export function formatPhone(value: string): string {
  const hasCountryCode = value.trim().startsWith('+') || value.replace(/\D/g, '').length > 10;
  let digits = value.replace(/\D/g, '');
  let prefix = '';
  if (hasCountryCode && digits.startsWith('1')) {
    prefix = '+1 ';
    digits = digits.slice(1);
  }

  digits = digits.slice(0, 10);
  if (digits.length === 0) {
    return '';
  }
  if (digits.length < 4) {
    return `${prefix}(${digits}`;
  }
  if (digits.length < 7) {
    return `${prefix}(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  }
  return `${prefix}(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export function internationalPhone(value: string | null | undefined): string {
  const raw = value?.trim() ?? '';
  const digits = raw.replace(/\D/g, '');
  const national = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
  if (national.length !== 10) {
    return raw;
  }

  return formatPhone(`+1${national}`);
}

export function phoneError(value: string): string | null {
  if (value.trim().length === 0) {
    return null;
  }

  const digits = value.replace(/\D/g, '');
  const national = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
  return national.length === 10 ? null : 'Enter a 10-digit phone number.';
}

export function emailError(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }

  const atIndex = trimmed.indexOf('@');
  const valid =
    trimmed.length <= 256 &&
    atIndex > 0 &&
    atIndex === trimmed.lastIndexOf('@') &&
    atIndex < trimmed.length - 1 &&
    !trimmed.includes(' ');
  return valid ? null : 'Enter a valid email address.';
}
