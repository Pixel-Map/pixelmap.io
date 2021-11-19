import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class DownloadedBlock {
  public constructor(init?: Partial<DownloadedBlock>) {
    Object.assign(this, init);
  }
  @PrimaryColumn()
  id: number;

  @Column()
  lastDownloadedBlock: number;
}
