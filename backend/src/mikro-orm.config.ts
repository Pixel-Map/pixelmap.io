import { DataHistory } from "./ingestor/entities/dataHistory.entity";
import { PurchaseHistory } from "./ingestor/entities/purchaseHistory.entity";
import { Tile } from "./ingestor/entities/tile.entity";
import { TransferHistory } from "./ingestor/entities/transferHistory.entity";
import { WrappingHistory } from "./ingestor/entities/wrappingHistory.entity";
import { CurrentState } from "./ingestor/entities/currentState.entity";
import { PixelMapTransaction } from "./ingestor/entities/pixelMapTransaction.entity";

export default {
	entities: [
		DataHistory,
		CurrentState,
		PurchaseHistory,
		Tile,
		TransferHistory,
		WrappingHistory,
		PixelMapTransaction,
	],
	type: "postgresql",
	dbName: process.env.DB_NAME,
	host: process.env.DB_HOST,
	port: 5432,
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	debug: true,
	driverOptions: {
		connection: { ssl: { rejectUnauthorized: false } },
	},
};
