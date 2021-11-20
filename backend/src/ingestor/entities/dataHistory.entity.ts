import { Column, Entity, ManyToOne, PrimaryColumn, PrimaryGeneratedColumn, Unique } from 'typeorm';
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
@Unique('tile_data_index', ['tile', 'tx'])
export class DataHistory {
  public constructor(init?: Partial<DataHistory>) {
    Object.assign(this, init);
  }
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  timeStamp: Date;

  @Column()
  blockNumber: number;

  @Column()
  tx: string;

  @Column()
  logIndex: number;

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
  updatedBy: string;

  @ManyToOne(() => Tile, (tile) => tile.dataHistory, { onDelete: 'CASCADE' })
  tile: Tile;
}
