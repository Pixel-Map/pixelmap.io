import { Entity, OneToMany, PrimaryKey, Property } from '@mikro-orm/core';
import { DataHistory } from './dataHistory.entity';
import { WrappingHistory } from './wrappingHistory.entity';
import { PurchaseHistory } from './purchaseHistory.entity';
import { TransferHistory } from './transferHistory.entity';

@Entity()
export class Tile {
  public constructor(init?: Partial<Tile>) {
    Object.assign(this, init);
  }
  @PrimaryKey()
  id!: number;

  @Property()
  image: string;

  @Property({ columnType: 'decimal(10, 2)' })
  price: number;

  @Property()
  url: string;

  @Property()
  owner: string;

  @Property()
  wrapped: boolean;

  @OneToMany(() => DataHistory, (dataHistory) => dataHistory.tile)
  dataHistory: DataHistory[];

  @OneToMany(() => WrappingHistory, (wrappingHistory) => wrappingHistory.tile)
  wrappingHistory: WrappingHistory[];

  @OneToMany(() => PurchaseHistory, (purchaseHistory) => purchaseHistory.tile)
  purchaseHistory: PurchaseHistory[];

  @OneToMany(() => TransferHistory, (transferHistory) => transferHistory.tile)
  transferHistory: TransferHistory[];
}
