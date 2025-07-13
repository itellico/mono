export interface TagData {
  id: number;
  uuid: string;
  name: string;
  slug: string;
  category?: string;
  usageCount: number;
  isSystem: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface EntityTag {
  id: number;
  uuid: string;
  tagId: number;
  entityType: string;
  entityId: string;
  addedAt: string;
  tag?: TagData;
}

export interface TagSearchParams {
  search?: string;
  category?: string;
  limit?: number;
  popular?: boolean;
}

export interface EntityTagParams {
  entityType: string;
  entityId: string;
  includeMetadata?: boolean;
}

export interface BulkTagOperation {
  entityType: string;
  entityIds: string[];
  tagIds: number[];
}