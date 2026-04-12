import { DiamondQuality } from '../constants/jewellery';

export type Diamond = {
  name?: string;
  carat: number;
  cost_per_carat: number;
};

export type DiamondSlot = {
  name?: string;
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
  diamonds: DiamondSlot[];
  other_stones?: StoneSlot[];
  making_charges_per_gram: number;
  override_diamond_costs?: boolean;
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

export type DiamondPricingTier = {
  id?: string;
  min_carat: number;
  max_carat: number;
  ef_vvs_offset: number;
  fg_vvs_si_offset: number;
  gh_vs_si_offset: number;
  lab_grown_offset: number;
  created_at?: string;
};

export type StoneSlot = {
  name: string;
  carat: number;
  cost_per_carat: number;
};