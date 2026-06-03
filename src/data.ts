/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Expedition, Courier } from './types';

export const INITIAL_EXPEDITIONS: Expedition[] = [
  {
    id: 'shopee',
    name: 'Shopee Express',
    prefix: 'SPX',
    types: [
      { id: 'shopee_reg', name: 'Reguler', code: 'SPX-REG' },
      { id: 'shopee_ins', name: 'Instan', code: 'SPX-INS' }
    ]
  },
  {
    id: 'jnt',
    name: 'J&T Express',
    prefix: 'JNT',
    types: [
      { id: 'jnt_reg', name: 'Regular', code: 'JNT-REG' },
      { id: 'jnt_eco', name: 'Economic', code: 'JNT-ECO' }
    ]
  },
  {
    id: 'sicepat',
    name: 'SiCepat',
    prefix: 'SI',
    types: [
      { id: 'si_reg', name: 'Regular', code: 'SI-REG' },
      { id: 'si_best', name: 'Best', code: 'SI-BEST' }
    ]
  }
];

export const INITIAL_COURIERS: Courier[] = [
  {
    id: 'c1',
    name: 'Budi Santoso',
    phone: '081234567890',
    vehicle: 'Motor',
    code: 'spx1061'
  },
  {
    id: 'c2',
    name: 'Jaka Tarub',
    phone: '087798765432',
    vehicle: 'Van',
    code: 'spx1062'
  },
  {
    id: 'c3',
    name: 'Ahmad Yani',
    phone: '085211223344',
    vehicle: 'Mobil Box',
    code: 'spx1063'
  }
];

export const GOOGLE_APPS_SCRIPT_TEMPLATE = `/*
 * Google Apps Script for Verell Packing System
 * Deploy this script as a Web App:
 * 1. Open your Google Sheet.
 * 2. Click Extensions > Apps Script.
 * 3. Paste this code.
 * 4. Click Deploy > New Deployment.
 * 5. Under "Select type" choose "Web app".
 * 6. Set "Execute as" to "Me".
 * 7. Set "Who has access" to "Anyone".
 * 8. Copy the Web App URL and paste it into the Webhook field in the app.
 */

function doPost(e) {
  try {
    var json = JSON.parse(e.postData.contents);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Add headers if empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["Tanggal", "Nomor Resi", "Waktu Print", "Waktu Packing", "Waktu Pick Up", "Status Terakhir", "Last Updated", "Status Batal/Cancel"]);
    }
    
    var timestamp = json.timestamp || new Date().getTime();
    var dateString = json.tanggal || Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy");
    var timeString = json.time || Utilities.formatDate(new Date(), "GMT+7", "HH:mm:ss");
    
    var data = sheet.getDataRange().getValues();
    var rowIndex = -1;
    
    // Check if the barcode (resi) already exists
    for (var i = 1; i < data.length; i++) {
      if (data[i][1] === json.resi) {
        rowIndex = i + 1; // +1 for 1-based index
        break;
      }
    }
    
    if (rowIndex === -1) {
      // Create new row
      var row = [
        dateString,
        json.resi,
        json.status === "PRINTED" ? timeString : "-",
        (json.status === "SCANNING" || json.status === "PACKING_SELESAI") ? timeString : "-",
        json.status === "PICKED_UP" ? timeString : "-",
        json.status,
        timestamp,
        json.status_batal || ""
      ];
      sheet.appendRow(row);
    } else {
      // Update existing row
      if (json.status === "PRINTED") {
        sheet.getRange(rowIndex, 3).setValue(timeString);
      } else if (json.status === "SCANNING" || json.status === "PACKING_SELESAI") {
        sheet.getRange(rowIndex, 4).setValue(timeString);
      } else if (json.status === "PICKED_UP") {
        sheet.getRange(rowIndex, 5).setValue(timeString);
      }
      sheet.getRange(rowIndex, 6).setValue(json.status);
      sheet.getRange(rowIndex, 7).setValue(timestamp);
      if (json.status_batal) {
        sheet.getRange(rowIndex, 8).setValue(json.status_batal);
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = sheet.getDataRange().getValues();
    var records = [];
    
    if (data.length > 1) {
      for (var i = 1; i < data.length; i++) {
        records.push({
          tanggal: data[i][0],
          nomor_resi: data[i][1],
          waktu_print: data[i][2],
          waktu_packing: data[i][3],
          waktu_pick_up: data[i][4],
          status_terakhir: data[i][5],
          last_updated: data[i][6],
          status_batal: data[i][7] || ""
        });
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify(records))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
`;
