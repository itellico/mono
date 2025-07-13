

// Database connection for garbage collection


interface GarbageCollectionConfig {
  profilePictures: {
    deletionDelayHours: number; // 0 for dev, 24-72 for production
  };
  setCards: {
    deletionDelayHours: number; // 0 for immediate deletion
  };
  modelBooks: {
    deletionDelayHours: number; // Longer retention for portfolio items
  };
  applicationPhotos: {
    deletionDelayHours: number; // Keep for review period
  };
  verificationPhotos: {
    deletionDelayHours: number; // Keep for compliance
  };
}

// Get garbage collection configuration from environment
function getGarbageCollectionConfig(): GarbageCollectionConfig {
  const env = process.env.NODE_ENV;

  // Default configuration
  const config: GarbageCollectionConfig = {
    profilePictures: {
      deletionDelayHours: env === 'development' ? 0 : 24, // 0 hours in dev, 24 in production
    },
    setCards: {
      deletionDelayHours: 0, // Always immediate for set cards
    },
    modelBooks: {
      deletionDelayHours: env === 'development' ? 0 : 168, // 0 hours in dev, 7 days in production
    },
    applicationPhotos: {
      deletionDelayHours: env === 'development' ? 0 : 720, // 0 hours in dev, 30 days in production
    },
    verificationPhotos: {
      deletionDelayHours: env === 'development' ? 0 : 2160, // 0 hours in dev, 90 days in production
    }
  };

  // Override with environment variables if set
  if (process.env.GC_PROFILE_PICTURES_DELAY_HOURS) {
    config.profilePictures.deletionDelayHours = parseInt(process.env.GC_PROFILE_PICTURES_DELAY_HOURS);
  }

  if (process.env.GC_SET_CARDS_DELAY_HOURS) {
    config.setCards.deletionDelayHours = parseInt(process.env.GC_SET_CARDS_DELAY_HOURS);
  }

  if (process.env.GC_MODEL_BOOKS_DELAY_HOURS) {
    config.modelBooks.deletionDelayHours = parseInt(process.env.GC_MODEL_BOOKS_DELAY_HOURS);
  }

  if (process.env.GC_APPLICATION_PHOTOS_DELAY_HOURS) {
    config.applicationPhotos.deletionDelayHours = parseInt(process.env.GC_APPLICATION_PHOTOS_DELAY_HOURS);
  }

  if (process.env.GC_VERIFICATION_PHOTOS_DELAY_HOURS) {
    config.verificationPhotos.deletionDelayHours = parseInt(process.env.GC_VERIFICATION_PHOTOS_DELAY_HOURS);
  }

  return config;
}

/**
 * Mark media as deleted when new media replaces it (for set cards)
 */
export async function markReplacedMediaAsDeleted(
  userId: number,
  pictureType: 'set_card' | 'profile_picture',
  slotId?: string,
  excludeAssetId?: number
): Promise<void> {
  try {
    logger.info('Marking replaced media as deleted', { userId, pictureType, slotId, excludeAssetId });

    let whereCondition: Prisma.MediaAssetWhereInput;

    if (pictureType === 'set_card' && slotId) {
      whereCondition = {
        userId: userId,
        pictureType: 'set_card',
        deletionStatus: 'active',
        NOT: excludeAssetId ? { id: excludeAssetId } : undefined,
        // Note: slotId matching would need to be handled via metadata JSON query
        // For now, we'll mark all active set cards for this user (except the new one)
      };
    } else if (pictureType === 'profile_picture') {
      whereCondition = {
        userId: userId,
        pictureType: 'profile_picture',
        deletionStatus: 'active',
        NOT: excludeAssetId ? { id: excludeAssetId } : undefined,
      };
    } else {
      logger.warn('Invalid picture type or missing slotId for set card', { pictureType, slotId });
      return;
    }

    // Mark existing media as pending deletion
    const markedAssets = await prisma.mediaAsset.updateMany({
      where: whereCondition,
      data: {
        deletionStatus: 'pending_deletion',
        deletionRequestedAt: new Date(),
        deletionRequestedBy: userId,
      },
    });

    logger.info('Marked assets for deletion', { 
      count: markedAssets.count,
      excludedAssetId: excludeAssetId
    });

  } catch (error) {
    logger.error('Error marking replaced media as deleted', { error, userId, pictureType, slotId, excludeAssetId });
    throw error;
  }
}

/**
 * Physical deletion of files and database cleanup
 */
export async function deletePhysicalFiles(assetIds: number[]): Promise<void> {
  const config = getGarbageCollectionConfig();

  try {
    logger.info('Starting physical file deletion', { assetIds });

    // Get asset details for deletion using Prisma
    const assetsToDelete = await prisma.mediaAsset.findMany({
      where: {
        id: { in: assetIds },
      },
      include: {
        user: {
          include: {
            account: true,
          },
        },
      },
    });

    const storageBasePath = process.env.STORAGE_BASE_PATH || './public';
    let deletedCount = 0;
    let failedCount = 0;

    for (const asset of assetsToDelete) {
      try {
        // Construct file path
        const accountUuid = asset.user?.account?.uuid;
        if (!accountUuid) {
          logger.warn('Skipping physical deletion for asset with no associated account UUID', { assetId: asset.id });
          failedCount++;
          continue;
        }

        const filePath = path.join(
          storageBasePath,
          'media',
          accountUuid,
          asset.directoryHash.substring(0, 2),
          asset.directoryHash.substring(2, 4),
          asset.directoryHash.substring(4, 6),
          asset.directoryHash.substring(6, 8),
          asset.fileName
        );

        // Delete main file
        try {
          await fs.unlink(filePath);
          logger.info('Deleted main file', { filePath });
        } catch (error: any) {
          if (error.code !== 'ENOENT') {
            logger.warn('Failed to delete main file', { filePath, error: error.message });
          }
        }

        // Delete optimized versions and thumbnails
        const directory = path.dirname(filePath);
        const baseName = path.parse(asset.fileName).name;

        try {
          const files = await fs.readdir(directory);
          const relatedFiles = files.filter(file => 
            file.startsWith(baseName) && 
            (file.includes('_optimized') || file.includes('_150x150') || 
             file.includes('_300x300') || file.includes('_600x600'))
          );

          for (const relatedFile of relatedFiles) {
            const relatedPath = path.join(directory, relatedFile);
            try {
              await fs.unlink(relatedPath);
              logger.info('Deleted related file', { relatedPath });
            } catch (error: any) {
              if (error.code !== 'ENOENT') {
                logger.warn('Failed to delete related file', { relatedPath, error: error.message });
              }
            }
          }
        } catch (error: any) {
          logger.warn('Failed to read directory for cleanup', { directory, error: error.message });
        }

        deletedCount++;

      } catch (error) {
        logger.error('Failed to delete files for asset', { assetId: asset.id, error });
        failedCount++;
      }
    }

    // Remove from database
    if (deletedCount > 0) {
      await prisma.mediaAsset.deleteMany({
        where: {
          id: { in: assetIds },
        },
      });

      logger.info('Removed assets from database', { assetIds });
    }

    logger.info('Physical file deletion completed', { 
      deletedCount, 
      failedCount, 
      totalProcessed: assetIds.length 
    });

  } catch (error) {
    logger.error('Error in physical file deletion', { error, assetIds });
    throw error;
  }
}

/**
 * Run garbage collection process
 */
export async function runGarbageCollection(): Promise<void> {
  const config = getGarbageCollectionConfig();

  try {
    logger.info('Starting garbage collection process', { config });

    // Find assets eligible for deletion based on their type and delay configuration
    const now = new Date();
    const eligibleAssets = [];

    // Profile pictures
    if (config.profilePictures.deletionDelayHours >= 0) {
      const cutoffTime = new Date(now.getTime() - (config.profilePictures.deletionDelayHours * 60 * 60 * 1000));
      const profileAssets = await prisma.mediaAsset.findMany({
        where: {
          pictureType: 'profile_picture',
          deletionRequestedAt: { lt: cutoffTime },
        },
      });
      eligibleAssets.push(...profileAssets);
    }

    // Set cards
    if (config.setCards.deletionDelayHours >= 0) {
      const cutoffTime = new Date(now.getTime() - (config.setCards.deletionDelayHours * 60 * 60 * 1000));
      const setCardAssets = await prisma.mediaAsset.findMany({
        where: {
          pictureType: 'set_card',
          deletionRequestedAt: { lt: cutoffTime },
        },
      });
      eligibleAssets.push(...setCardAssets);
    }

    // Model books
    if (config.modelBooks.deletionDelayHours >= 0) {
      const cutoffTime = new Date(now.getTime() - (config.modelBooks.deletionDelayHours * 60 * 60 * 1000));
      const modelBookAssets = await prisma.mediaAsset.findMany({
        where: {
          pictureType: 'model_book',
          deletionRequestedAt: { lt: cutoffTime },
        },
      });
      eligibleAssets.push(...modelBookAssets);
    }

    // Application photos
    if (config.applicationPhotos.deletionDelayHours >= 0) {
      const cutoffTime = new Date(now.getTime() - (config.applicationPhotos.deletionDelayHours * 60 * 60 * 1000));
      const applicationAssets = await prisma.mediaAsset.findMany({
        where: {
          pictureType: 'application_photo',
          deletionRequestedAt: { lt: cutoffTime },
        },
      });
      eligibleAssets.push(...applicationAssets);
    }

    // Verification photos
    if (config.verificationPhotos.deletionDelayHours >= 0) {
      const cutoffTime = new Date(now.getTime() - (config.verificationPhotos.deletionDelayHours * 60 * 60 * 1000));
      const verificationAssets = await prisma.mediaAsset.findMany({
        where: {
          pictureType: 'verification_photo',
          deletionRequestedAt: { lt: cutoffTime },
        },
      });
      eligibleAssets.push(...verificationAssets);
    }

    if (eligibleAssets.length === 0) {
      logger.info('No assets eligible for garbage collection');
      return;
    }

    logger.info('Found assets eligible for deletion', { 
      count: eligibleAssets.length,
      assetIds: eligibleAssets.map(a => a.id)
    });

    // Delete eligible assets
    await deletePhysicalFiles(eligibleAssets.map(a => a.id));

    logger.info('Garbage collection completed successfully', { 
      deletedCount: eligibleAssets.length 
    });

  } catch (error) {
    logger.error('Error in garbage collection process', { error });
    throw error;
  }
}

/**
 * Queue cleanup job for background processing
 */
export async function queueGarbageCollection(): Promise<void> {
  // This would integrate with PG Boss for scheduled cleanup
  // For now, we'll run it directly
  await runGarbageCollection();
} 