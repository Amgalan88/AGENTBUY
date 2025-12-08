/**
 * MongoDB дээрх base64 зурагнуудыг Cloudinary-д upload хийж, URL-аар солих script
 * 
 * Ажиллуулах:
 * node migrate-images-to-cloudinary.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const Order = require("./src/models/orderModel");
const { uploadImage, uploadImages } = require("./src/services/cloudinaryService");

async function migrateImages() {
  try {
    console.log("🔌 MongoDB холбож байна...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB холбогдлоо\n");

    // Бүх захиалгануудыг олох
    const orders = await Order.find({});
    console.log(`📦 Олдсон захиалга: ${orders.length}\n`);

    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const order of orders) {
      let updated = false;
      const updatedItems = [];

      if (!order.items || order.items.length === 0) {
        skippedCount++;
        continue;
      }

      for (const item of order.items) {
        const updatedItem = { ...item.toObject() };

        // images array-ийг migrate хийх
        if (item.images && Array.isArray(item.images) && item.images.length > 0) {
          const migratedImages = [];
          for (const img of item.images) {
            if (img && img.startsWith("data:image")) {
              // Base64 зураг байна, Cloudinary-д upload хийх
              try {
                console.log(`  📤 Uploading image for item: ${item.title || "Unknown"}...`);
                const cloudinaryUrl = await uploadImage(img);
                if (cloudinaryUrl && cloudinaryUrl.startsWith("http")) {
                  migratedImages.push(cloudinaryUrl);
                  updated = true;
                  console.log(`  ✅ Uploaded: ${cloudinaryUrl.substring(0, 60)}...`);
                } else {
                  migratedImages.push(img); // Upload амжилтгүй бол хуучин утгыг хадгална
                  console.log(`  ⚠️  Upload failed, keeping original`);
                }
              } catch (err) {
                console.error(`  ❌ Upload error: ${err.message}`);
                migratedImages.push(img); // Алдаа гарвал хуучин утгыг хадгална
                errorCount++;
              }
            } else if (img && img.startsWith("http")) {
              // Аль хэдийн Cloudinary URL байна
              migratedImages.push(img);
            } else {
              // Бусад формат
              migratedImages.push(img);
            }
          }
          updatedItem.images = migratedImages;
        }

        // imageUrl-ийг migrate хийх
        if (item.imageUrl && item.imageUrl.startsWith("data:image")) {
          try {
            console.log(`  📤 Uploading imageUrl for item: ${item.title || "Unknown"}...`);
            const cloudinaryUrl = await uploadImage(item.imageUrl);
            if (cloudinaryUrl && cloudinaryUrl.startsWith("http")) {
              updatedItem.imageUrl = cloudinaryUrl;
              updated = true;
              console.log(`  ✅ Uploaded imageUrl: ${cloudinaryUrl.substring(0, 60)}...`);
            }
          } catch (err) {
            console.error(`  ❌ Upload error: ${err.message}`);
            errorCount++;
          }
        }

        updatedItems.push(updatedItem);
      }

      // Хэрэв өөрчлөлт хийгдсэн бол хадгалах
      if (updated) {
        order.items = updatedItems;
        await order.save();
        migratedCount++;
        console.log(`✅ Захиалга #${order._id.toString().slice(-6)} migrate хийгдлээ\n`);
      } else {
        skippedCount++;
      }
    }

    console.log("\n=== Migration Summary ===");
    console.log(`✅ Migrated: ${migratedCount} захиалга`);
    console.log(`⏭️  Skipped: ${skippedCount} захиалга (зураг байхгүй эсвэл аль хэдийн Cloudinary URL)`);
    console.log(`❌ Errors: ${errorCount} зураг`);

    await mongoose.disconnect();
    console.log("\n✅ Migration дууссан!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Migration алдаа:", err);
    process.exit(1);
  }
}

migrateImages();

