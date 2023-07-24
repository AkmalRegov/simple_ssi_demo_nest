import {
  IsArray,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class Schema {
  @IsOptional()
  @IsString()
  id?: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  attributes: string[];

  @IsNotEmpty()
  @IsString()
  version: string;

  @IsNotEmpty()
  @IsString()
  tag: string;
}

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
