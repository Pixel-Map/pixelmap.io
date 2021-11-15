import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Tile } from './tile.entity';

@Entity()
@Unique('tile_wrapping_index', ['tile', 'tx'])
export class WrappingHistory {
  public constructor(init?: Partial<WrappingHistory>) {
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
  wrapped: boolean;

  @Column()
  updatedBy: string;

  @ManyToOne(() => Tile, (tile) => tile.wrappingHistory, { onDelete: 'CASCADE' })
  tile: Tile;
}
