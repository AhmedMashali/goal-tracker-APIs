import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsISO8601,
  IsBoolean,
  IsMongoId,
  IsNumber,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateGoalDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsNotEmpty()
  @IsISO8601(
    { strict: true },
    { message: 'Deadline must be a valid ISO 8601 date string.' },
  )
  deadline: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsMongoId({ message: 'Parent ID must be a valid MongoDB ObjectId.' })
  parentId?: string | null;

  @IsOptional()
  @IsNumber()
  order?: number;
}
