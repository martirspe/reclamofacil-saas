import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { FORM_LIMITS, NAME_PATTERN, COMPANY_NAME_PATTERN, EMAIL_PATTERN } from './complaint-form.constants';

export function createComplaintForm(
  fb: FormBuilder,
  phoneValidator: (control: AbstractControl) => ValidationErrors | null
): FormGroup {
  return fb.group({
    personType: ['natural'],
    documentType: ['', Validators.required],
    documentNumber: ['', Validators.required],
    firstName: ['', [Validators.required, Validators.pattern(NAME_PATTERN)]],
    lastName: ['', [Validators.required, Validators.pattern(NAME_PATTERN)]],
    minor: [false],
    tutorDocumentType: [''],
    tutorDocumentNumber: [''],
    tutorFirstName: ['', Validators.pattern(NAME_PATTERN)],
    tutorLastName: ['', Validators.pattern(NAME_PATTERN)],
    companyDocument: [''],
    companyName: ['', Validators.pattern(COMPANY_NAME_PATTERN)],
    legalRepDocumentType: [''],
    legalRepDocumentNumber: [''],
    legalRepFirstName: ['', Validators.pattern(NAME_PATTERN)],
    legalRepLastName: ['', Validators.pattern(NAME_PATTERN)],
    district: ['', [Validators.required, Validators.minLength(3)]],
    province: [''],
    department: [''],
    address: ['', [
      Validators.required,
      Validators.minLength(FORM_LIMITS.MIN_ADDRESS_LENGTH),
      Validators.maxLength(FORM_LIMITS.MAX_ADDRESS_LENGTH)
    ]],
    email: ['', [Validators.required, Validators.email, Validators.pattern(EMAIL_PATTERN)]],
    phone: ['', [Validators.required, phoneValidator as ValidatorFn]],
    goodType: ['product'],
    goodDescription: ['', [
      Validators.required,
      Validators.minLength(FORM_LIMITS.MIN_GOOD_DESC_LENGTH),
      Validators.maxLength(FORM_LIMITS.MAX_GOOD_DESC_LENGTH)
    ]],
    receipt: [false],
    receiptType: [''],
    receiptSeries: ['', [Validators.minLength(2), Validators.maxLength(10)]],
    receiptNumber: ['', [Validators.minLength(2), Validators.maxLength(20)]],
    money: [false],
    currency: [''],
    claimAmount: [''],
    claimType: ['complaint'],
    claimDescription: ['', [
      Validators.required,
      Validators.minLength(FORM_LIMITS.MIN_DESC_LENGTH),
      Validators.maxLength(FORM_LIMITS.MAX_DESC_LENGTH)
    ]],
    request: ['', [
      Validators.required,
      Validators.minLength(FORM_LIMITS.MIN_REQUEST_LENGTH),
      Validators.maxLength(FORM_LIMITS.MAX_REQUEST_LENGTH)
    ]],
    attachments: [[]],
    recaptcha: [''],
    confirm: [false, Validators.requiredTrue]
  });
}

export function createTrackForm(fb: FormBuilder): FormGroup {
  return fb.group({
    code: ['', [
      Validators.required,
      Validators.pattern(/^(REC|QUE)-\d{4}-\d{6}$/)
    ]]
  });
}
