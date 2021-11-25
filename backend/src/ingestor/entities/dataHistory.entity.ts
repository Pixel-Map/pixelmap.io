import { Tile } from './tile.entity';
import { Entity, ManyToOne, PrimaryKey, Property, Unique } from '@mikro-orm/core';

@Entity()
@Unique({ properties: ['tile', 'tx'] })
export class DataHistory {
  public constructor(init?: Partial<DataHistory>) {
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

  @Property({ length: 800 })
  image: string;

  @Property({ columnType: 'decimal(10, 2)' })
  price: number;

  @Property()
  url: string;

  @Property()
  updatedBy: string;

  @ManyToOne(() => Tile)
  tile: Tile;
}
