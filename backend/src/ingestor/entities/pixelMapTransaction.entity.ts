import { Entity, PrimaryKey, Property, Unique } from '@mikro-orm/core';

@Entity()
@Unique({ properties: ['hash', 'transactionIndex'] })
export class PixelMapTransaction {
  public constructor(init?: Partial<PixelMapTransaction>) {
    Object.assign(this, init);
  }

  @PrimaryKey()
  id!: number;

  @Property()
  blockNumber: string;

  @Property()
  timeStamp: string;

  @Property()
  hash: string;

  @Property()
  nonce: string;

  @Property()
  blockHash: string;

  @Property()
  transactionIndex: string;

  @Property()
  from: string;

  @Property()
  to: string;

  @Property()
  value: string;

  @Property()
  gas: string;

  @Property()
  gasPrice: string;

  @Property()
  isError: string;

  @Property()
  txreceipt_status: string;

  @Property({ columnType: 'text' })
  input: string;

  @Property()
  contractAddress: string;

  @Property()
  cumulativeGasUsed: string;

  @Property()
  gasUsed: string;

  @Property()
  confirmations: string;
}
