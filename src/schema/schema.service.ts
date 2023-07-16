import { Injectable } from '@nestjs/common';
import { NestedSchemaDto, SchemaDto } from './dto';

@Injectable()
export class SchemaService {
  async joi_create(dto: SchemaDto) {
    console.log('Creating schema with data: ', dto);
    return 'Schema successfully created!';
  }

  async class_validate_create(dto: NestedSchemaDto) {
    console.log('Creating Nested Schema with data: ', dto);
    setTimeout(() => {
      console.log('Nested Schema successfully created!');
    }, 3000);
  }
}
