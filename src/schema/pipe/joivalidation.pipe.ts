import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { ObjectSchema } from 'joi';

@Injectable()
export class JoiValidationPipe implements PipeTransform {
  constructor(private schema: ObjectSchema) {}

  transform(value: any, metadata: ArgumentMetadata) {
    const { error } = this.schema.validate(value, {
      abortEarly: false,
      errors: { wrap: { label: false } },
    });
    if (error) {
      console.log('error message is: ', error.message);
      throw new BadRequestException('Validation failed', error.message);
    }
    return value;
  }
}
