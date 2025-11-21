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