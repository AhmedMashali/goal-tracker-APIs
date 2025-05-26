import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';

@Injectable()
export class ParseMongoIdPipe implements PipeTransform<string, Types.ObjectId> {
  transform(value: string): Types.ObjectId {
    const isValidObjectId = Types.ObjectId.isValid(value);
    if (!isValidObjectId) {
      throw new BadRequestException(`Invalid MongoDB ObjectId: ${value}`);
    }
    return new Types.ObjectId(value);
  }
}
