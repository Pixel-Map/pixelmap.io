import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity()
@Unique('pixelmap_event_index', ['txHash', 'logIndex'])
export class PixelMapEvent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  txHash: string;

  @Column()
  logIndex: string;

  @Column({
    type: 'jsonb',
  })
  eventData;

  @Column({
    type: 'jsonb',
  })
  txData;
}
