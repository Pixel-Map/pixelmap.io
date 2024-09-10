import {
	decompressTileCode,
	detectImageProperties,
} from "./decompressTileCode";
import { decodeBase91 } from "./decompressTileCode";
import { zlibInflate } from "./decompressTileCode";

it("successfully decodes a non-compressed regular hex triplet string", async () => {
	const regular_image =
		"000000000000000000000000000000000000000000000000000000000000000000022ffffff022000000000000000000000000000000000000ffffffffffff000000000000000000000000000000000000fff022022fff000000000000000000000000000000000000a75ffffffa75000000000000000000000000000000000022da8da8da8da8022000000000000000000000000000000022da8da8da8da8022000000000000000000000000000000022764c97c97764022000000000000000000000000000000a75355566566355a75000000000000000000000000000000a75a75022022a75a75000000000000000000000022466466fff022ceecee022fff4664660000000000000000220220220220a00a00a00a0022022022000000000000000022466466022ceeceeceecee022466466000000000000000000022022fff700700700700fff022022000000000000000000022022000022022022022000022022000000000000000000000000000000000000000000000000000000000";

	expect(decompressTileCode(regular_image)).toBe(regular_image);
});

it("successfully decodes a Pako compressed Base91 string", async () => {
	const compressedImage =
		// eslint-disable-next-line max-len
		'b#I@Y8KucA>C=C$amO}}.yB"wn7S4JMIgmxvTR#6?fMx89"gv=Ng~)}w.FaSy63j:PAgZ@8klfYnduUCA4jNfEe#:d~OC(~3NJ}r8.$_>rsm*vE}W0z7i~b~UV&6IsQ&@3r2.|8gWFd=vky~Y.|ookg=<hy4>*c?k[j.4{j)D|Txq?Hkb9?cYSf';
	expect(decompressTileCode(compressedImage)).toBe(
		// eslint-disable-next-line max-len
		"d84000000d84940000000000355355355355355134134355d84d84d849400001741742b5000355355134134355355355d84d84d849400001741742b50003553551341343553553559400000000001741741740006300000003553553553551340001741742b51740000006306300000001341341341341342b52b52b52b5174000000000c730000001341341341341342b52b52b52b5174000000000c730000001341341341341342b5174174174174000000c73c73000000466466466466466db1000000db1db1174174000c73000000466134134134355db1db1db1174174000000000000134134466355355355134db1db1db1174174000000000000134134466355355355134174174174000000900900000355134134466355355355355000000000900d50000000000134134134466355355355134000000000000000000000355355134134466134134134355000000000000000000000355355134134466134134134355000000000000134134134134134134134134134134134134",
	);
});

it("successfully decodes a regular hex triplet string with accidental whitespace", async () => {
	const compressedImage =
		// eslint-disable-next-line max-len
		"  000000000000000000000000000000000000000000000000000000000000000000022ffffff022000000000000000000000000000000000000ffffffffffff000000000000000000000000000000000000fff022022fff000000000000000000000000000000000000a75ffffffa75000000000000000000000000000000000022da8da8da8da8022000000000000000000000000000000022da8da8da8da8022000000000000000000000000000000022764c97c97764022000000000000000000000000000000a75355566566355a75000000000000000000000000000000a75a75022022a75a75000000000000000000000022466466fff022ceecee022fff4664660000000000000000220220220220a00a00a00a0022022022000000000000000022466466022ceeceeceecee022466466000000000000000000022022fff700700700700fff022022000000000000000000022022000022022022022000022022000000000000000000000000000000000000000000000000000000000";
	expect(decompressTileCode(compressedImage)).toBe(
		// eslint-disable-next-line max-len
		"000000000000000000000000000000000000000000000000000000000000000000022ffffff022000000000000000000000000000000000000ffffffffffff000000000000000000000000000000000000fff022022fff000000000000000000000000000000000000a75ffffffa75000000000000000000000000000000000022da8da8da8da8022000000000000000000000000000000022da8da8da8da8022000000000000000000000000000000022764c97c97764022000000000000000000000000000000a75355566566355a75000000000000000000000000000000a75a75022022a75a75000000000000000000000022466466fff022ceecee022fff4664660000000000000000220220220220a00a00a00a0022022022000000000000000022466466022ceeceeceecee022466466000000000000000000022022fff700700700700fff022022000000000000000000022022000022022022022000022022000000000000000000000000000000000000000000000000000000000",
	);
});
describe("decodeBase91", () => {
	it("correctly decodes a base91 encoded string", () => {
		// Arrange
		const encodedString =
			'I@Y8KucA>C=C$amO}}.yB"wn7S4JMIgmxvTR#6?fMx89"gv=Ng~)}w.FaSy63j:PAgZ@8klfYnduUCA4jNfEe#:d~OC(~3NJ}r8.$_>rsm*vE}W0z7i~b~UV&6IsQ&@3r2.|8gWFd=vky~Y.|ookg=<hy4>*c?k[j.4{j)D|Txq?Hkb9?cYSf';
		const expectedDecodedArray = Buffer.from([
			120, 156, 173, 146, 65, 14, 128, 32, 12, 4, 191, 4, 82, 64, 191, 131, 252,
			255, 13, 46, 212, 172, 13, 114, 33, 218, 204, 161, 135, 233, 166, 84, 235,
			46, 174, 87, 221, 229, 184, 219, 86, 33, 70, 139, 15, 2, 208, 64, 83, 84,
			246, 89, 192, 86, 34, 71, 104, 42, 171, 190, 221, 65, 101, 128, 62, 133,
			201, 98, 24, 180, 153, 106, 170, 76, 95, 243, 9, 52, 66, 31, 117, 230,
			240, 151, 207, 181, 233, 67, 166, 47, 41, 89, 106, 241, 247, 253, 139, 7,
			156, 178, 62, 195, 219, 61, 187, 102, 205, 231, 92, 221, 129, 111, 239,
			179, 234, 15, 155, 31, 29, 61, 251, 219, 7, 76, 131, 86, 227, 24, 254,
			206, 119, 179, 178, 127, 194, 240, 222, 47, 254, 240, 105, 166, 92, 135,
			148, 159, 249,
		]);

		// Act
		const result = decodeBase91(encodedString);

		// Assert
		expect(Buffer.isBuffer(result)).toBe(true);
		expect(result).toEqual(expectedDecodedArray);
	});

	it("returns an empty Buffer for an empty string", () => {
		// Arrange
		const encodedString = "";

		// Act
		const result = decodeBase91(encodedString);

		// Assert
		expect(Buffer.isBuffer(result)).toBe(true);
		expect(result).toEqual(Buffer.alloc(0));
	});

	it("does not throw an error for invalid base91 input", () => {
		// Arrange
		const invalidEncodedString = "!@#$%^&*()";

		// Act & Assert
		expect(() => decodeBase91(invalidEncodedString)).not.toThrow();
	});
});

describe("zlibInflate", () => {
	it("successfully inflates a Pako compressed Base91 string", async () => {
		const compressedImage = Buffer.from([
			120, 156, 173, 146, 65, 14, 128, 32, 12, 4, 191, 4, 82, 64, 191, 131, 252,
			255, 13, 46, 212, 172, 13, 114, 33, 218, 204, 161, 135, 233, 166, 84, 235,
			46, 174, 87, 221, 229, 184, 219, 86, 33, 70, 139, 15, 2, 208, 64, 83, 84,
			246, 89, 192, 86, 34, 71, 104, 42, 171, 190, 221, 65, 101, 128, 62, 133,
			201, 98, 24, 180, 153, 106, 170, 76, 95, 243, 9, 52, 66, 31, 117, 230,
			240, 151, 207, 181, 233, 67, 166, 47, 41, 89, 106, 241, 247, 253, 139, 7,
			156, 178, 62, 195, 219, 61, 187, 102, 205, 231, 92, 221, 129, 111, 239,
			179, 234, 15, 155, 31, 29, 61, 251, 219, 7, 76, 131, 86, 227, 24, 254,
			206, 119, 179, 178, 127, 194, 240, 222, 47, 254, 240, 105, 166, 92, 135,
			148, 159, 249,
		]);
		const expectedInflatedImage = Buffer.from([
			100, 56, 52, 48, 48, 48, 48, 48, 48, 100, 56, 52, 57, 52, 48, 48, 48, 48,
			48, 48, 48, 48, 48, 48, 51, 53, 53, 51, 53, 53, 51, 53, 53, 51, 53, 53,
			51, 53, 53, 49, 51, 52, 49, 51, 52, 51, 53, 53, 100, 56, 52, 100, 56, 52,
			100, 56, 52, 57, 52, 48, 48, 48, 48, 49, 55, 52, 49, 55, 52, 50, 98, 53,
			48, 48, 48, 51, 53, 53, 51, 53, 53, 49, 51, 52, 49, 51, 52, 51, 53, 53,
			51, 53, 53, 51, 53, 53, 100, 56, 52, 100, 56, 52, 100, 56, 52, 57, 52, 48,
			48, 48, 48, 49, 55, 52, 49, 55, 52, 50, 98, 53, 48, 48, 48, 51, 53, 53,
			51, 53, 53, 49, 51, 52, 49, 51, 52, 51, 53, 53, 51, 53, 53, 51, 53, 53,
			57, 52, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 49, 55, 52, 49, 55, 52,
			49, 55, 52, 48, 48, 48, 54, 51, 48, 48, 48, 48, 48, 48, 48, 51, 53, 53,
			51, 53, 53, 51, 53, 53, 51, 53, 53, 49, 51, 52, 48, 48, 48, 49, 55, 52,
			49, 55, 52, 50, 98, 53, 49, 55, 52, 48, 48, 48, 48, 48, 48, 54, 51, 48,
			54, 51, 48, 48, 48, 48, 48, 48, 48, 49, 51, 52, 49, 51, 52, 49, 51, 52,
			49, 51, 52, 49, 51, 52, 50, 98, 53, 50, 98, 53, 50, 98, 53, 50, 98, 53,
			49, 55, 52, 48, 48, 48, 48, 48, 48, 48, 48, 48, 99, 55, 51, 48, 48, 48,
			48, 48, 48, 49, 51, 52, 49, 51, 52, 49, 51, 52, 49, 51, 52, 49, 51, 52,
			50, 98, 53, 50, 98, 53, 50, 98, 53, 50, 98, 53, 49, 55, 52, 48, 48, 48,
			48, 48, 48, 48, 48, 48, 99, 55, 51, 48, 48, 48, 48, 48, 48, 49, 51, 52,
			49, 51, 52, 49, 51, 52, 49, 51, 52, 49, 51, 52, 50, 98, 53, 49, 55, 52,
			49, 55, 52, 49, 55, 52, 49, 55, 52, 48, 48, 48, 48, 48, 48, 99, 55, 51,
			99, 55, 51, 48, 48, 48, 48, 48, 48, 52, 54, 54, 52, 54, 54, 52, 54, 54,
			52, 54, 54, 52, 54, 54, 100, 98, 49, 48, 48, 48, 48, 48, 48, 100, 98, 49,
			100, 98, 49, 49, 55, 52, 49, 55, 52, 48, 48, 48, 99, 55, 51, 48, 48, 48,
			48, 48, 48, 52, 54, 54, 49, 51, 52, 49, 51, 52, 49, 51, 52, 51, 53, 53,
			100, 98, 49, 100, 98, 49, 100, 98, 49, 49, 55, 52, 49, 55, 52, 48, 48, 48,
			48, 48, 48, 48, 48, 48, 48, 48, 48, 49, 51, 52, 49, 51, 52, 52, 54, 54,
			51, 53, 53, 51, 53, 53, 51, 53, 53, 49, 51, 52, 100, 98, 49, 100, 98, 49,
			100, 98, 49, 49, 55, 52, 49, 55, 52, 48, 48, 48, 48, 48, 48, 48, 48, 48,
			48, 48, 48, 49, 51, 52, 49, 51, 52, 52, 54, 54, 51, 53, 53, 51, 53, 53,
			51, 53, 53, 49, 51, 52, 49, 55, 52, 49, 55, 52, 49, 55, 52, 48, 48, 48,
			48, 48, 48, 57, 48, 48, 57, 48, 48, 48, 48, 48, 51, 53, 53, 49, 51, 52,
			49, 51, 52, 52, 54, 54, 51, 53, 53, 51, 53, 53, 51, 53, 53, 51, 53, 53,
			48, 48, 48, 48, 48, 48, 48, 48, 48, 57, 48, 48, 100, 53, 48, 48, 48, 48,
			48, 48, 48, 48, 48, 48, 49, 51, 52, 49, 51, 52, 49, 51, 52, 52, 54, 54,
			51, 53, 53, 51, 53, 53, 51, 53, 53, 49, 51, 52, 48, 48, 48, 48, 48, 48,
			48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 51, 53, 53,
			51, 53, 53, 49, 51, 52, 49, 51, 52, 52, 54, 54, 49, 51, 52, 49, 51, 52,
			49, 51, 52, 51, 53, 53, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48,
			48, 48, 48, 48, 48, 48, 48, 48, 48, 51, 53, 53, 51, 53, 53, 49, 51, 52,
			49, 51, 52, 52, 54, 54, 49, 51, 52, 49, 51, 52, 49, 51, 52, 51, 53, 53,
			48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 49, 51, 52, 49, 51, 52,
			49, 51, 52, 49, 51, 52, 49, 51, 52, 49, 51, 52, 49, 51, 52, 49, 51, 52,
			49, 51, 52, 49, 51, 52, 49, 51, 52, 49, 51, 52,
		]);

		const result = zlibInflate(compressedImage);

		expect(result).toEqual(new Uint8Array(expectedInflatedImage));
	});
});

describe("detectImageProperties", () => {
	const IMAGE_COMPRESSED_V2 = "c#"; // Make sure this matches the actual constant

	it("should return default values for non-V2 compressed strings", () => {
		const result = detectImageProperties(new Uint8Array(0), "b#somedata");
		expect(result).toEqual({ pixelSize: 16, colorDepth: 12 });
	});

	it("should detect 4x4 images with 4-bit color depth", () => {
		const result = detectImageProperties(
			new Uint8Array(8),
			`${IMAGE_COMPRESSED_V2}data`,
		);
		expect(result).toEqual({ pixelSize: 4, colorDepth: 4 });
	});

	it("should detect 4x4 images with 8-bit color depth", () => {
		const result = detectImageProperties(
			new Uint8Array(16),
			`${IMAGE_COMPRESSED_V2}data`,
		);
		expect(result).toEqual({ pixelSize: 4, colorDepth: 8 });
	});

	it("should detect 4x4 images with 12-bit color depth", () => {
		const result = detectImageProperties(
			new Uint8Array(48),
			`${IMAGE_COMPRESSED_V2}data`,
		);
		expect(result).toEqual({ pixelSize: 4, colorDepth: 12 });
	});

	it("should detect 8x8 images with 4-bit color depth", () => {
		const result = detectImageProperties(
			new Uint8Array(32),
			`${IMAGE_COMPRESSED_V2}data`,
		);
		expect(result).toEqual({ pixelSize: 8, colorDepth: 4 });
	});

	it("should detect 8x8 images with 8-bit color depth", () => {
		const result = detectImageProperties(
			new Uint8Array(64),
			`${IMAGE_COMPRESSED_V2}data`,
		);
		expect(result).toEqual({ pixelSize: 8, colorDepth: 8 });
	});

	it("should detect 8x8 images with 12-bit color depth", () => {
		const result = detectImageProperties(
			new Uint8Array(192),
			`${IMAGE_COMPRESSED_V2}data`,
		);
		expect(result).toEqual({ pixelSize: 8, colorDepth: 12 });
	});

	it("should detect 16x16 images with 4-bit color depth", () => {
		const result = detectImageProperties(
			new Uint8Array(128),
			`${IMAGE_COMPRESSED_V2}data`,
		);
		expect(result).toEqual({ pixelSize: 16, colorDepth: 4 });
	});

	it("should detect 16x16 images with 8-bit color depth", () => {
		const result = detectImageProperties(
			new Uint8Array(256),
			`${IMAGE_COMPRESSED_V2}data`,
		);
		expect(result).toEqual({ pixelSize: 16, colorDepth: 8 });
	});

	it("should detect 16x16 images with 12-bit color depth", () => {
		const result = detectImageProperties(
			new Uint8Array(768),
			`${IMAGE_COMPRESSED_V2}data`,
		);
		expect(result).toEqual({ pixelSize: 16, colorDepth: 12 });
	});

	it("should return default values for unknown data lengths", () => {
		const result = detectImageProperties(
			new Uint8Array(1000),
			`${IMAGE_COMPRESSED_V2}data`,
		);
		expect(result).toEqual({ pixelSize: 16, colorDepth: 12 });
	});
});
