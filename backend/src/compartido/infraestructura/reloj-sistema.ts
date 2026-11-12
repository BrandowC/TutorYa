import { Injectable } from '@nestjs/common';
import { Reloj } from '../dominio/reloj.js';

@Injectable()
export class RelojSistema extends Reloj {
  ahora(): Date {
    return new Date();
  }
}
