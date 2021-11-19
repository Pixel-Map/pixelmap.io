import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity()
@Unique('pixelmap_event_index', ['txHash', 'logIndex'])
export class PixelMapEvent {
  public constructor(init?: Partial<PixelMapEvent>) {
    Object.assign(this, init);
  }

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  block: number;

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
