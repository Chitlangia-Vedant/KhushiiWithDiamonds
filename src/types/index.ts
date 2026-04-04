import { DIAMOND_QUALITIES } from '../constants/jewellery';

export type Diamond = {
  carat: number;
  cost_per_carat: number;
};

export type DiamondSlot = {
  carat: number;
  costs: Record<DiamondQuality, number>;
};

export type JewelleryItem = {
  id: string;
  name: string;
  description: string;
  category: string;
  image_url: string[];
  gold_weight: number;
  diamonds_lab_grown: Diamond[];
  diamonds_gh_vs_si: Diamond[];
  diamonds_fg_vvs_si: Diamond[];
  diamonds_ef_vvs: Diamond[];
  making_charges_per_gram: number;
  base_price: number;
  created_at: string;
  updated_at: string;
};

export type Category = {
  id: string;
  name: string;
  description: string;
  image_url: string;
  parent_id: string | null;
  created_at: string;
};

export type AdminSetting = {
  id: string;
  setting_key: string;
  setting_value: string;
  description: string;
  updated_at: string;
};

// 2. Automatically generate the Type from the Array!
export type DiamondQuality = typeof DIAMOND_QUALITIES[number];