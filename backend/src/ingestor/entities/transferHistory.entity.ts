import { Entity, ManyToOne, PrimaryKey, Property, Unique } from '@mikro-orm/core';
import { Tile } from './tile.entity';

@Entity()
@Unique({ properties: ['tile', 'tx'] })
export class TransferHistory {
  public constructor(init?: Partial<TransferHistory>) {
    Object.assign(this, init);
  }
  @PrimaryKey()
  id!: number;

  @Property()
  timeStamp: Date;

  @Property()
  blockNumber: number;

  @Property()
  tx: string;

  @Property()
  logIndex: number;

  @Property()
  transferredFrom: string;

  @Property()
  transferredTo: string;

  @ManyToOne(() => Tile)
  tile: Tile;
}
