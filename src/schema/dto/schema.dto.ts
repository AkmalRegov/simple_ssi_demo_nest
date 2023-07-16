import { IsNotEmpty, IsObject, IsString } from 'class-validator';

export class SchemaDto {
  attrNames: Array<String>;
  issuerId: String;
  name: String;
  version: String;
  obj: {
    name: String;
    age: Number;
  };
}

export class NestedSchemaDto {
  @IsNotEmpty()
  @IsString()
  name: String;

  @IsNotEmpty()
  @IsObject()
  schema: SchemaDto;
}
