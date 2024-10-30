import { HttpException, HttpStatus, ValidationError } from '@nestjs/common';
import * as ErrorTypes from './types';

export class RequestValidationException extends HttpException {
  constructor(message: ValidationError[] | string[]) {
    super(
      HttpException.createBody({ ...ErrorTypes.RequestValidation, message }),
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class CustomException extends HttpException {
  constructor(type: ErrorTypes.HttpErrorBody) {
    super(
      HttpException.createBody({
        errorCode: type.errorCode,
        message: type.message,
      }),
      400,
    );
  }
}

export class GenericHttpException extends HttpException {
  constructor(
    type: ErrorTypes.HttpErrorBody,
    statusCode: number = HttpStatus.BAD_REQUEST,
    data?: object,
  ) {
    type.data = data;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    super(HttpException.createBody(type), statusCode);
  }
}
