import { Entity, ManyToOne, PrimaryKey, Property, Unique } from '@mikro-orm/core';
import { Tile } from './tile.entity';

@Entity()
@Unique({ properties: ['tile', 'tx'] })
export class WrappingHistory {
  public constructor(init?: Partial<WrappingHistory>) {
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
  wrapped: boolean;

  @Property()
  updatedBy: string;

  @ManyToOne(() => Tile)
  tile: Tile;
}
