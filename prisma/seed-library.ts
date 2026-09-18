import { prisma } from "../src/lib/prisma";
import { SAMPLE_MEDIA } from "../src/lib/sample-media";

export { SAMPLE_MEDIA };

export async function seedLibrary(client = prisma) {
  console.log(`Seeding ${SAMPLE_MEDIA.length} media library items...`);

  for (const item of SAMPLE_MEDIA) {
    const originalKey = item.originalKey || item.storageKey;
    await client.mediaItem.upsert({
      where: { originalKey },
      update: {},
      create: {
        type: item.type,
        status: "READY",
        title_en: item.title_en,
        title_te: item.title_te,
        titleEn: item.titleEn,
        titleTe: item.titleTe,
        year: item.year,
        durationSeconds: item.durationSeconds,
        durationSec: item.durationSec,
        sizeBytes: item.sizeBytes,
        checksumSha256: item.checksumSha256,
        mimeType: item.mimeType,
        originalKey,
        storageKey: originalKey,
        posterKey: item.posterKey || null,
        thumbKey: item.thumbKey || null,
      },
    });
  }

  console.log(`Successfully seeded ${SAMPLE_MEDIA.length} media items!`);
}

if (require.main === module) {
  seedLibrary()
    .then(async () => {
      if (prisma.$disconnect) await prisma.$disconnect();
    })
    .catch(async (e) => {
      console.error(e);
      if (prisma.$disconnect) await prisma.$disconnect();
      process.exit(1);
    });
}
