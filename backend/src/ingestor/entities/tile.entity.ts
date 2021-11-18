import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { DataHistory } from './dataHistory.entity';
import { WrappingHistory } from './wrappingHistory.entity';
import { PurchaseHistory } from './purchaseHistory.entity';
import { TransferHistory } from './transferHistory.entity';

/// ColumnNumericTransformer
export class ColumnNumericTransformer {
  to(data: number): number {
    return data;
  }
  from(data: string): number {
    return parseFloat(data);
  }
}

@Entity()
export class Tile {
  public constructor(init?: Partial<Tile>) {
    Object.assign(this, init);
  }
  @PrimaryColumn()
  id: number;

  @Column()
  image: string;

  @Column('numeric', {
    precision: 7,
    scale: 2,
    transformer: new ColumnNumericTransformer(),
  })
  price: number;

  @Column()
  url: string;

  @Column()
  owner: string;

  @Column()
  wrapped: boolean;

  @OneToMany(() => DataHistory, (dataHistory) => dataHistory.tile, { cascade: true, eager: false })
  dataHistory: DataHistory[];

  @OneToMany(() => WrappingHistory, (wrappingHistory) => wrappingHistory.tile, { cascade: true, eager: false })
  wrappingHistory: WrappingHistory[];

  @OneToMany(() => PurchaseHistory, (purchaseHistory) => purchaseHistory.tile, { cascade: true, eager: false })
  purchaseHistory: PurchaseHistory[];

  @OneToMany(() => TransferHistory, (transferHistory) => transferHistory.tile, { cascade: true, eager: false })
  transferHistory: TransferHistory[];
}
