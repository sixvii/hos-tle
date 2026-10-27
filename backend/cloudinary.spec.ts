import { describe, expect, it } from "vitest";
import { createCloudinaryUploadSignature } from "./cloudinary";
import { getBackendConfig } from "./config";

describe("Cloudinary uploads", () => {
  it("does not create upload credentials when Cloudinary is unconfigured", () => {
    expect(createCloudinaryUploadSignature(getBackendConfig({}), "owner-id")).toBeNull();
  });

  it("creates a signed owner-scoped upload payload without returning the secret", () => {
    const secret = "cloudinary-secret";
    const config = getBackendConfig({
      CLOUDINARY_CLOUD_NAME: "arc-cloud",
      CLOUDINARY_API_KEY: "public-key",
      CLOUDINARY_API_SECRET: secret,
    });
    const result = createCloudinaryUploadSignature(config, "owner-id", 1700000000);

    expect(result).toMatchObject({ cloudName: "arc-cloud", apiKey: "public-key", folder: "arc/properties/owner-id", timestamp: 1700000000 });
    expect(result?.signature).not.toContain(secret);
  });
});
