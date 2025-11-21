import React from 'react';

export enum PromptStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED'
}

export enum Category {
  CREATIVE_WRITING = 'Creative Writing',
  CODING = 'Coding',
  MARKETING = 'Marketing',
  EDUCATION = 'Education',
  PRODUCTIVITY = 'Productivity',
  IMAGE_GEN = 'Image Generation',
  VIDEO_GEN = 'Video Generation',
  OTHER = 'Other'
}

export enum Copyright {
  NONE = 'None / Unspecified',
  CC0 = 'CC0 1.0 (Public Domain)',
  CC_BY = 'CC BY 4.0 (Attribution)',
  CC_BY_SA = 'CC BY-SA 4.0 (ShareAlike)',
  CC_BY_NC = 'CC BY-NC 4.0 (Non-Commercial)',
  MIT = 'MIT License (Code)',
  APACHE = 'Apache 2.0 (Code)',
  PROPRIETARY = 'Proprietary / All Rights Reserved',
  INTERNAL = 'Internal Use Only'
}

export interface PromptVersion {
  id: string;
  content: string;
  createdAt: number;
  note?: string;
}

export interface PromptData {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  category: Category;
  tags: string[];
  status: PromptStatus;
  copyright?: Copyright;
  author?: string;
  versions: PromptVersion[];
  currentVersionId: string;
  updatedAt: number;
  isFavorite?: boolean;
}

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}