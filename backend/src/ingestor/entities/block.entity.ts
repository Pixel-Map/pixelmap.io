import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class Block {
  @PrimaryColumn()
  id: number;

  @Column()
  currentDownloadedBlock: number;

  @Column()
  currentIngestedBlock: number;
}
