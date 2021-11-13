import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Tile } from './tile.entity';

@Entity()
@Unique('tile_transfer_index', ['tile', 'tx'])
export class TransferHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  timeStamp: Date;

  @Column()
  blockNumber: number;

  @Column()
  tx: string;

  @Column()
  transferredFrom: string;

  @Column()
  transferredTo: string;

  @ManyToOne(() => Tile, (tile) => tile.wrappingHistory, { onDelete: 'CASCADE' })
  tile: Tile;
}
