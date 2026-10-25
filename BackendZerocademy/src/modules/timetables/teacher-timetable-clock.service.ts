import { Injectable } from '@nestjs/common';

@Injectable()
export class TeacherTimetableClock {
  now(): Date {
    return new Date();
  }
}
