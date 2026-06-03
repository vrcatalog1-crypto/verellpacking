/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ScanStatus = 'PRINTED' | 'SCANNING' | 'PACKING_SELESAI' | 'PICKED_UP' | 'RETURNED' | 'CANCELLED';

export interface ReturnRecord {
  id: string;
  resi: string;
  tanggal: string;
  time: string;
  timestamp: number;
  courierName: string;
  condition: 'BAIK' | 'RUSAK' | 'TERBUKA';
  reason: string;
}

export interface ShopeeProduct {
  name: string;
  qty: number;
  variant: string;
  image?: string;
}

export interface ScanRecord {
  id: string;
  resi: string;
  tanggal: string;
  time: string;
  timestamp: number;
  status: ScanStatus;
  expedition?: string;
  courierCode?: string;
  noPesanan?: string;
  products?: ShopeeProduct[];
}

export interface ExpeditionType {
  id: string;
  name: string; // e.g. "Reguler", "Instan"
  code: string; // e.g. "SPX-REG"
}

export interface Expedition {
  id: string;
  name: string; // e.g. "Shopee Expression"
  prefix: string; // e.g. "SPXID"
  types: ExpeditionType[];
}

export interface Courier {
  id: string;
  name: string;
  phone: string;
  vehicle: string; // Motor / Mobil Box / Van
  code: string; // e.g. "spx1064"
}

export interface Order {
  id?: number;
  no_pesanan: string;
  no_resi: string;
  nama_produk: string;
  harga: number;
  jumlah: number;
  nama_penerima?: string;
  alamat_pengiriman?: string;
  kota?: string;
  provinsi?: string;
  created_at?: string;
  updated_at?: string;
}

