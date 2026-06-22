import { v2 as cloudinary } from "cloudinary";
import { getCloudinaryConfig } from "./config";

let isConfigured = false;

function ensureConfigured() {
  if (!isConfigured) {
    try {
      const config = getCloudinaryConfig();
      cloudinary.config({
        cloud_name: config.cloudName,
        api_key: config.apiKey,
        api_secret: config.apiSecret,
        secure: true,
      });
      isConfigured = true;
    } catch (e) {
      // If we are at build time (e.g. static compilation), don't fail immediately,
      // but throw the error if code is actually executed.
      if (process.env.NODE_ENV === "production" && !process.env.NEXT_PHASE) {
        throw e;
      }
    }
  }
}

const cloudinaryProxy = new Proxy(cloudinary, {
  get(target, prop, receiver) {
    ensureConfigured();
    return Reflect.get(target, prop, receiver);
  },
});

export { cloudinaryProxy as cloudinary };
