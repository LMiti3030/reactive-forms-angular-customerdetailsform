import { Component, OnInit } from '@angular/core';
import {
  FormGroup,
  FormControl,
  FormBuilder,
  Validators,
  AbstractControl,
  ValidatorFn,
  FormArray
} from '@angular/forms';
import { Customer } from './customer';
import { debounceTime } from 'rxjs';

function ratingRange(minValue: number, maxValue: number): ValidatorFn {
  return (c: AbstractControl): { [key: string]: boolean } | null => {
    if (
      c.value != null &&
      (isNaN(c.value) || c.value < minValue || c.value > maxValue)
    ) {
      return { range: true };
    }
    return null;
  };
}

function emailMatcher(c: AbstractControl): ValidationError | null {
  const emailControl = c.get('email');
  const confirmControl = c.get('confirmEmail');
  if (emailControl?.pristine || confirmControl?.pristine) {
    return null;
  }
  if (emailControl?.value === confirmControl?.value) {
    return null;
  }
  return { match: true };
}

type ValidationError = {
  [key: string]: boolean;
};

type ValidationMessage = {
  [key: string]: string;
};

@Component({
  selector: 'app-customer',
  templateUrl: './customer.component.html',
  styleUrls: ['./customer.component.css'],
})
export class CustomerComponent implements OnInit {
  customerForm!: FormGroup;

  customer = new Customer();

  emailMessage: string = '';

  get addresses() : FormArray{
    return <FormArray> this.customerForm.get('addresses');
  }


  private validationMessages: ValidationMessage = {
    required: 'Please enter your email address.',
    email: 'Please enter a valid email address.',
  };

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.customerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(3)]],
      lastName: ['', [Validators.required, Validators.maxLength(50)]],
      emailGroup: this.fb.group(
        {
          email: ['', [Validators.required, Validators.email]],
          confirmEmail: ['', [Validators.required]],
        },
        { validator: emailMatcher }
      ),
      phone: '',
      notification: 'email',
      rating: [null, ratingRange(1, 5)],
      sendCatalog: true,
      addresses: this.fb.array( [this.buildAddress()])
    });

    this.customerForm.get('notification')?.valueChanges.subscribe({
      next: (value) => {
        this.setNotification(value);
      },
    });

    const emailControl = this.customerForm.get('emailGroup.email');
    emailControl?.valueChanges.pipe(debounceTime(1000)).subscribe({
      next: (value) => {
        console.log(value);
        this.setMessage(emailControl);
      },
    });
  }

  buildAddress() : FormGroup{
    return this.fb.group({
        addressType: 'home',
        street1: ['', [Validators.required, Validators.minLength(3)]],
        street2: '',
        city: ['', [Validators.required, Validators.minLength(3)]],
        state: ['', [Validators.required]],
        zip: ['', [Validators.required]],
    });
  }

  addAddress() : void{
    this.addresses.push(this.buildAddress());
  }

  save(): void {
    console.log(this.customerForm);
    console.log('Saved: ' + JSON.stringify(this.customerForm.value));
  }

  populateTestData(): void {
    this.customerForm.patchValue({
      firstName: 'Laura',
      lastName: 'Mititelu',
      sendCatalog: false,
    });
  }

  setMessage(c: AbstractControl): void {
    this.emailMessage = '';
    if ((c.touched || c.dirty) && c.errors) {
      this.emailMessage = Object.keys(c.errors)
        .map((key: string) => this.validationMessages[key])
        .join(' ');
    }
  }

  setNotification(notifyVia: String): void {
    const phoneControl = this.customerForm.get('phone');
    if (notifyVia === 'text') {
      phoneControl?.setValidators([
        Validators.required,
        Validators.pattern('[0-9]{10}'),
      ]);
    } else {
      phoneControl?.clearValidators();
    }
    phoneControl?.updateValueAndValidity();
  }



}
