import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Tile } from './tile.entity';

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
@Unique('tile_purchase_index', ['tile', 'tx'])
export class PurchaseHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  timeStamp: Date;

  @Column()
  blockNumber: number;

  @Column()
  tx: string;

  @Column()
  soldBy: string;

  @Column()
  purchasedBy: string;

  @Column('numeric', {
    precision: 7,
    scale: 2,
    transformer: new ColumnNumericTransformer(),
  })
  price: number;

  @ManyToOne(() => Tile, (tile) => tile.purchaseHistory, { onDelete: 'CASCADE' })
  tile: Tile;
}
