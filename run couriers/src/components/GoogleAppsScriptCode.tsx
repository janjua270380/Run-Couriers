import  React, { useState } from 'react';
import { Copy, CheckCircle, Code } from 'lucide-react';

export function GoogleAppsScriptCode() {
  const [copied, setCopied] = useState(false);

  const scriptCode = `function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    console.log('Received data:', data);
    
    // Handle different actions
    switch(data.action) {
      case 'registerUser':
      case 'createAccount':
        return handleUserRegistration(data);
        
      case 'saveBooking':
        return handleBookingSave(data);
        
      case 'authenticate':
        return handleAuthentication(data);
        
      default:
        return ContentService.createTextOutput(JSON.stringify({
          result: 'error',
          error: 'Unknown action: ' + data.action
        })).setMimeType(ContentService.MimeType.JSON);
    }
    
  } catch (error) {
    console.error('Script error:', error);
    return ContentService.createTextOutput(JSON.stringify({
      result: 'error',
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function handleUserRegistration(data) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Determine which sheet to use based on account type
    let sheetName;
    switch(data.accountType) {
      case 'customer':
        sheetName = 'Customer_Accounts';
        break;
      case 'worker':
      case 'employee':
        sheetName = 'Employee_Accounts';
        break;
      case 'admin':
        sheetName = 'Admin_Accounts';
        break;
      default:
        sheetName = 'Customer_Accounts'; // Default to customer
    }
    
    let sheet = ss.getSheetByName(sheetName);
    
    // Create sheet if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      
      // Add headers based on account type
      if (sheetName === 'Customer_Accounts') {
        sheet.getRange(1, 1, 1, 8).setValues([[
          'User ID', 'Name', 'Email', 'Phone', 'Company', 'Password', 'Created At', 'Status'
        ]]);
      } else if (sheetName === 'Employee_Accounts') {
        sheet.getRange(1, 1, 1, 10).setValues([[
          'User ID', 'Name', 'Email', 'Phone', 'Company', 'Password', 'Permissions', 'Role', 'Created At', 'Status'
        ]]);
      } else if (sheetName === 'Admin_Accounts') {
        sheet.getRange(1, 1, 1, 8).setValues([[
          'User ID', 'Name', 'Email', 'Phone', 'Company', 'Password', 'Created At', 'Status'
        ]]);
      }
    }
    
    // Check if user already exists
    const emailColumn = 3; // Email is in column C (3rd column)
    const existingEmails = sheet.getRange(2, emailColumn, sheet.getLastRow() - 1 || 1, 1).getValues().flat();
    
    if (existingEmails.includes(data.email)) {
      return ContentService.createTextOutput(JSON.stringify({
        result: 'error',
        error: 'User with this email already exists'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Add new row
    const newRow = sheet.getLastRow() + 1;
    
    if (sheetName === 'Customer_Accounts') {
      sheet.getRange(newRow, 1, 1, 8).setValues([[
        data.id,
        data.name,
        data.email,
        data.phone || '',
        data.company || '',
        data.password,
        new Date().toISOString(),
        'Active'
      ]]);
    } else if (sheetName === 'Employee_Accounts') {
      sheet.getRange(newRow, 1, 1, 10).setValues([[
        data.id,
        data.name,
        data.email,
        data.phone || '',
        data.company || '',
        data.password,
        JSON.stringify(data.workerPermissions || {}),
        data.accountType,
        new Date().toISOString(),
        'Active'
      ]]);
    } else if (sheetName === 'Admin_Accounts') {
      sheet.getRange(newRow, 1, 1, 8).setValues([[
        data.id,
        data.name,
        data.email,
        data.phone || '',
        data.company || '',
        data.password,
        new Date().toISOString(),
        'Active'
      ]]);
    }
    
    console.log(\`User registered in \${sheetName}: \${data.email}\`);
    
    return ContentService.createTextOutput(JSON.stringify({
      result: 'success',
      userId: data.id,
      sheetUsed: sheetName
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    console.error('Registration error:', error);
    return ContentService.createTextOutput(JSON.stringify({
      result: 'error',
      error: 'Registration failed: ' + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function handleBookingSave(data) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('Delivery_Bookings');
    
    if (!sheet) {
      sheet = ss.insertSheet('Delivery_Bookings');
      // Add headers
      sheet.getRange(1, 1, 1, 20).setValues([[
        'Timestamp', 'Booking ID', 'Collection Name', 'Collection Address', 'Collection Postcode',
        'Delivery Name', 'Delivery Address', 'Delivery Postcode', 'Delivery Date', 'Delivery Time',
        'Urgent', 'Vehicle Type', 'Parcel Count', 'Base Price', 'VAT', 'Total Price', 'User ID',
        'Status', 'Contact Email', 'Contact Phone'
      ]]);
    }
    
    const newRow = sheet.getLastRow() + 1;
    sheet.getRange(newRow, 1, 1, 20).setValues([[
      data.timestamp || new Date().toLocaleString(),
      data.bookingId,
      data.collectionName,
      data.collectionAddress,
      data.collectionPostcode,
      data.deliveryName,
      data.deliveryAddress,
      data.deliveryPostcode,
      data.date,
      data.deliveryTime,
      data.isUrgent,
      data.vehicleType,
      data.parcelCount,
      data.basePrice,
      data.vat,
      data.totalPrice,
      data.userId,
      data.status || 'pending',
      data.contactEmail,
      data.contactPhone
    ]]);
    
    return ContentService.createTextOutput(JSON.stringify({
      result: 'success',
      bookingId: data.bookingId
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      result: 'error',
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function handleAuthentication(data) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheets = ['Customer_Accounts', 'Employee_Accounts', 'Admin_Accounts'];
    
    for (const sheetName of sheets) {
      const sheet = ss.getSheetByName(sheetName);
      if (!sheet) continue;
      
      const lastRow = sheet.getLastRow();
      if (lastRow < 2) continue;
      
      const userData = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
      
      for (const row of userData) {
        const [id, name, email, phone, company, password] = row;
        
        if (email === data.email && password === data.password) {
          return ContentService.createTextOutput(JSON.stringify({
            result: 'success',
            user: {
              id: id,
              name: name,
              email: email,
              phone: phone,
              company: company,
              accountType: sheetName.replace('_Accounts', '').toLowerCase()
            }
          })).setMimeType(ContentService.MimeType.JSON);
        }
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      result: 'error',
      error: 'Invalid credentials'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      result: 'error',
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(scriptCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <Code className="w-5 h-5 text-blue-600" />
          Fixed Google Apps Script Code
        </h2>
        <button
          onClick={copyToClipboard}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          {copied ? (
            <>
              <CheckCircle className="w-4 h-4" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copy Code
            </>
          )}
        </button>
      </div>

      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
        <h3 className="font-semibold text-red-800 mb-2">CRITICAL FIX REQUIRED</h3>
        <p className="text-sm text-red-700">
          Your accounts are being saved to the wrong sheet because your Google Apps Script doesn't properly handle user registration. 
          Replace your entire Google Apps Script code with the code below to fix this issue.
        </p>
      </div>

      <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
        <pre className="text-sm whitespace-pre-wrap">
          {scriptCode}
        </pre>
      </div>

      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">What This Fixed Code Does:</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Routes customer accounts to "Customer_Accounts" sheet</li>
          <li>• Routes worker/employee accounts to "Employee_Accounts" sheet</li>
          <li>• Routes admin accounts to "Admin_Accounts" sheet</li>
          <li>• Routes booking data to "Delivery_Bookings" sheet</li>
          <li>• Creates proper headers for each sheet type</li>
          <li>• Prevents duplicate email registrations</li>
        </ul>
      </div>
    </div>
  );
}
 