export interface HttpErrorBody {
  errorCode: number;
  message: string | [];
  shouldReport?: boolean;
  data?: any;
}

export interface HttpDynamicErrorBody extends Omit<HttpErrorBody, 'message'> {
  message: (...msg: string[]) => string;
}

export const RequestValidation: HttpErrorBody = {
  errorCode: 10001,
  message: '',
  shouldReport: false,
};

export const InvalidSignature: HttpErrorBody = {
  errorCode: 10002,
  message: 'Invalid signature, please check your signature',
  shouldReport: false,
};

export const DuplicatePrimaryNumber: HttpErrorBody = {
  errorCode: 10003,
  message: 'Duplicate prime number, please check your number',
  shouldReport: false,
};

export const ClientNotFound: HttpErrorBody = {
  errorCode: 10004,
  message: 'Client not found, please check your client id',
  shouldReport: false,
};

export const GeneratePrimeNumberError: HttpErrorBody = {
  errorCode: 10005,
  message: 'Prime number generation error, please try again',
  shouldReport: false,
};

export const VerifySignatureError: HttpErrorBody = {
  errorCode: 10006,
  message: 'Signature verification error, please try again',
  shouldReport: false,
};

export const StartSendingPrimesError: HttpErrorBody = {
  errorCode: 10007,
  message: 'Error starting to send prime numbers, please try again',
  shouldReport: false,
};
