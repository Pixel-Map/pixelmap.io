import {
	Collection,
	Entity,
	OneToMany,
	PrimaryKey,
	Property,
} from "@mikro-orm/core";
import { DataHistory } from "./dataHistory.entity";
import { WrappingHistory } from "./wrappingHistory.entity";
import { PurchaseHistory } from "./purchaseHistory.entity";
import { TransferHistory } from "./transferHistory.entity";
import { v4 } from "uuid";

@Entity()
export class Tile {
	public constructor(init?: Partial<Tile>) {
		Object.assign(this, init);
	}
	@PrimaryKey()
	uuid: string = v4();

	@Property()
	id!: number;

	@Property({ length: 800 })
	image: string;

	@Property({ columnType: "decimal(10, 2)" })
	price: number;

	@Property()
	url: string;

	@Property()
	owner: string;

	@Property()
	wrapped: boolean;

	@Property({ default: "" })
	ens: string;

	@Property({ default: 0.0, columnType: "decimal(10, 2)" })
	openseaPrice: number;

	@OneToMany(
		() => DataHistory,
		(dataHistory) => dataHistory.tile,
	)
	dataHistory = new Collection<DataHistory>(this);

	@OneToMany(
		() => WrappingHistory,
		(wrappingHistory) => wrappingHistory.tile,
	)
	wrappingHistory = new Collection<WrappingHistory>(this);

	@OneToMany(
		() => PurchaseHistory,
		(purchaseHistory) => purchaseHistory.tile,
	)
	purchaseHistory = new Collection<PurchaseHistory>(this);

	@OneToMany(
		() => TransferHistory,
		(transferHistory) => transferHistory.tile,
	)
	transferHistory = new Collection<TransferHistory>(this);
}
