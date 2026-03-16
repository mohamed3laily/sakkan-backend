import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class ParseIntOrBadRequestPipe implements PipeTransform {
  transform(value: string) {
    if (!/^\d+$/.test(value)) {
      throw new BadRequestException('INVALID_ID');
    }
    return parseInt(value, 10);
  }
}
