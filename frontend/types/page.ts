export interface PageListItem {
  id: number;
  title: string;
  slug: string;
  sort_order: number;
  show_in_menu?: boolean;
}

export interface PageDetail extends PageListItem {
  content: string | null;
  meta_title: string | null;
  meta_description: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

