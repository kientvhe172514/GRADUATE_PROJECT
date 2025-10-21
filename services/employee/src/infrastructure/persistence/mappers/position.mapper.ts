import { Position } from '../../../domain/entities/position.entity';
import { PositionSchema } from '../typeorm/position.schema';

export class PositionMapper {
  static toDomain(schema: PositionSchema): Position {
    const position = new Position();
    position.id = schema.id;
    position.position_code = schema.position_code;
    position.position_name = schema.position_name;
    position.description = schema.description;
    position.level = schema.level;
    position.department_id = schema.department_id;
    position.suggested_role = schema.suggested_role;
    position.salary_min = schema.salary_min;
    position.salary_max = schema.salary_max;
    position.currency = schema.currency;
    position.status = schema.status;
    position.created_at = schema.created_at;
    position.updated_at = schema.updated_at;
    return position;
  }

  static toSchema(position: Position): PositionSchema {
    const schema = new PositionSchema();
    schema.id = position.id;
    schema.position_code = position.position_code;
    schema.position_name = position.position_name;
    schema.description = position.description;
    schema.level = position.level;
    schema.department_id = position.department_id;
    schema.suggested_role = position.suggested_role;
    schema.salary_min = position.salary_min;
    schema.salary_max = position.salary_max;
    schema.currency = position.currency;
    schema.status = position.status;
    schema.created_at = position.created_at || new Date();
    schema.updated_at = position.updated_at || new Date();
    return schema;
  }
}
