const { generateRandomMetadata } = require("../lambda/index");
test("generateRandomMetadata() returns valid metadata", () => {
	const metadata = generateRandomMetadata();
	expect(metadata).toHaveProperty("artist");
	expect(metadata).toHaveProperty("copyright");
	expect(metadata).toHaveProperty("description");
});
