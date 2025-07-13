
import { db as prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

export async function getBundles() {
  return await prisma.bundle.findMany();
}

export async function getBundle(id: string) {
  const bundle = await prisma.bundle.findUnique({ where: { id: id } });
  return bundle;
}

export async function createBundle(bundle: any, featureIds: string[]) {
  const newBundle = await prisma.bundle.create({ data: bundle });
  if (featureIds && featureIds.length > 0) {
    await prisma.bundleFeature.createMany({
      data: featureIds.map(featureId => ({
        bundleId: newBundle.id,
        featureId: parseInt(featureId),
      })),
    });
  }
  return newBundle;
}

export async function updateBundle(id: string, bundle: any, featureIds: string[]) {
  const updatedBundle = await prisma.bundle.update({
    where: { id: id },
    data: bundle,
  });
  await prisma.bundleFeature.deleteMany({ where: { bundleId: id } });
  if (featureIds && featureIds.length > 0) {
    await prisma.bundleFeature.createMany({
      data: featureIds.map(featureId => ({
        bundleId: id,
        featureId: parseInt(featureId),
      })),
    });
  }
  return updatedBundle;
}

export async function deleteBundle(id: string) {
  await prisma.bundleFeature.deleteMany({ where: { bundleId: id } });
  return await prisma.bundle.delete({ where: { id: id } });
}
