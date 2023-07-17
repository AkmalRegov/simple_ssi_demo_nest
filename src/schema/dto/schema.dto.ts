import { IsNotEmpty, IsObject, IsString } from 'class-validator';

export class SchemaDto {
  attrNames: string[];
  issuerId: string;
  name: string;
  version: string;
  obj: {
    name: string;
    age: number;
  };
}

export class NestedSchemaDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsObject()
  schema: SchemaDto;
}
