import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class IngestedEvent {
  public constructor(init?: Partial<IngestedEvent>) {
    Object.assign(this, init);
  }
  @PrimaryColumn()
  id: number;

  @Column()
  lastIngestedEvent: number;
}
