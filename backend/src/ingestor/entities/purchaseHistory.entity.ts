import { Entity, ManyToOne, PrimaryKey, Property, Unique } from '@mikro-orm/core';
import { Tile } from './tile.entity';

@Entity()
@Unique({ properties: ['tile', 'tx', 'logIndex'] })
export class PurchaseHistory {
  public constructor(init?: Partial<PurchaseHistory>) {
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
  soldBy: string;

  @Property()
  purchasedBy: string;

  @Property({ columnType: 'decimal(10, 2)' })
  price: number;

  @ManyToOne(() => Tile)
  tile: Tile;
}
