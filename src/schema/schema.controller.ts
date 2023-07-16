import { Body, Controller, HttpCode, Post, UsePipes } from '@nestjs/common';
import Joi from 'joi';
import { NestedSchemaDto, SchemaDto } from './dto';
import { JoiValidationPipe, ClassValidationPipe } from './pipe';
import { SchemaService } from './schema.service';

const createSchema = Joi.object<SchemaDto>({
  attrNames: Joi.array<string>().required(),
  issuerId: Joi.string().required(),
  name: Joi.string().required(),
  version: Joi.string()
    .regex(/^[0-9.]+/)
    .required(),
  obj: Joi.object({
    name: Joi.string().required(),
    age: Joi.number().required(),
  })
    .required()
    .messages({
      'object.base': `"obj" should be a Javascript Object`,
      'object.schema': `"obj" must contain the property [name, age]`,
    }),
});

@Controller('schema')
export class SchemaController {
  constructor(private schemaService: SchemaService) {}

  @Post('joi-create')
  @UsePipes(new JoiValidationPipe(createSchema))
  async joi_create(@Body() createSchemaDto: SchemaDto) {
    return this.schemaService.joi_create(createSchemaDto);
  }

  @Post('class-validate-create')
  async class_validate_create(
    @Body(new ClassValidationPipe()) createNestedSchemaDto: NestedSchemaDto,
  ) {
    return this.schemaService.class_validate_create(createNestedSchemaDto);
  }
}
