import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class Block {
  public constructor(init?: Partial<Block>) {
    Object.assign(this, init);
  }
  @PrimaryColumn()
  id: number;

  @Column()
  currentDownloadedBlock: number;

  @Column()
  currentIngestedBlock: number;
}
