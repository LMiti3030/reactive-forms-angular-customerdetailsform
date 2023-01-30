import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, FormBuilder, Validators, AbstractControl, ValidatorFn } from '@angular/forms';
import { Customer } from './customer';
import { debounceTime } from 'rxjs';

// function ratingRange(c: AbstractControl) : {[key: string] : boolean} | null  {
//   if(c.value != null && (isNaN(c.value) || c.value < 1 || c.value > 5)){
//     return {'range' : true};
//   }
//   return null;
// }

function ratingRange(minValue: number, maxValue: number) : ValidatorFn {
    return (c : AbstractControl) : {[key: string] : boolean} | null  => {
      if(c.value != null && (isNaN(c.value) || c.value < minValue || c.value > maxValue)){
        return {'range' : true};
      }
      return null;
    };
}

function emailMatcher(c: AbstractControl) : { [key: string] : boolean} | null{
  const emailControl = c.get('email');
  const confirmControl = c.get('confirmEmail');
  if(emailControl?.pristine || confirmControl?.pristine) {
    return null;
  }
  if( emailControl?.value === confirmControl ?.value){
    return null;
  }
  return { 'match' : true };
}

@Component({
  selector: 'app-customer',
  templateUrl: './customer.component.html',
  styleUrls: ['./customer.component.css']
})
export class CustomerComponent implements OnInit{

  customerForm!: FormGroup;

  customer = new Customer();

  emailMessage: string='';

  private validationMessages = {
    required: 'Please enter your email address.',
    email: 'Please enter a valid email address.',
  };

  constructor(private fb: FormBuilder) { }

  ngOnInit(): void {
    // this.customerForm = new FormGroup({
    //    firstName: new FormControl(),
    //    lastName: new FormControl(),
    //    email: new FormControl(),
    //    sendCatalog : new FormControl(true)
    // });

    // this.customerForm = this.fb.group({
    //   firstName: ['', [Validators.required, Validators.minLength(3)]],
    //    lastName: ['', [Validators.required, Validators.maxLength(50)]],
    //    email: ['', [Validators.required, Validators.email]],
    //    phone: '',
    //    notification: 'email',
    //    rating: [null, ratingRange(1,5)],
    //    sendCatalog : true
    // });

    this.customerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(3)]],
       lastName: ['', [Validators.required, Validators.maxLength(50)]],
       emailGroup: this.fb.group({
          email: ['', [Validators.required, Validators.email]],
          confirmEmail: ['', [Validators.required]]
          }, { validator : emailMatcher}),
       phone: '',
       notification: 'email',
       rating: [null, ratingRange(1,5)],
       sendCatalog : true
    });

    // this.customerForm.get('firstName')?.valueChanges.subscribe({
    //   next: value => console.log(value),
    //   error: () => alert('eroare')
    // });
    this.customerForm.get('notification')?.valueChanges.subscribe({
      next: value => {
       //  console.log(value);
        this.setNotification(value);
      }
    });

    const emailControl = this.customerForm.get('emailGroup.email');
    emailControl?.valueChanges.pipe(
      debounceTime(1000)
    ).subscribe({
      next: value => {
        console.log(value);
        this.setMessage(emailControl)
      }
    });

  }

  save(): void {
    console.log(this.customerForm);
    console.log('Saved: ' + JSON.stringify(this.customerForm.value));
  }

  populateTestData(): void{
      this.customerForm.patchValue({
        firstName: 'Laura',
        lastName: 'Mititelu',
        sendCatalog: false
      });

      // this.customerForm.setValue({
      //   firstName: 'Laura',
      //   lastName: 'Mititelu',
      //   email: 'laura@mititelu.com',
      //   sendCatalog: false
      // });
  }

  // onEmailNotificationClick() : void{
  //   this.customerForm.get('phone')?.clearValidators();
  //   this.customerForm.get('phone')?.updateValueAndValidity();
  // }true

  // onTextNotificationClick(): void{
  //   this.customerForm.get('phone')?.addValidators(Validators.required);
  //   this.customerForm.get('phone')?.updateValueAndValidity();
  // }

  setMessage(c: AbstractControl) : void{
    this.emailMessage='';
    if((c.touched || c.dirty) && c.errors){
      this.emailMessage = Object.keys(c.errors).map(
        (key : string ) => this.validationMessages[key as keyof typeof this.validationMessages]
        // (key : string ) => this.validationMessages[key]
      ).join(' ');
    }
  }

  setNotification(notifyVia: String) : void{
      const phoneControl = this.customerForm.get('phone');
      if(notifyVia === 'text'){
        phoneControl?.setValidators([Validators.required, Validators.pattern('[0-9]{10}')]);
      } else {
        phoneControl?.clearValidators();
      }
      phoneControl?.updateValueAndValidity();
  }

}
