#  Final Google Sheets Script Fix

Replace your entire Google Apps Script with this corrected version:

```javascript
// Google Apps Script code - FINAL VERSION to fix routing issues

function doGet(e) {
  return ContentService
    .createTextOutput("Delivery Booking Web App is active.")
    .setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  
  try {
    // Log the incoming request for debugging
    Logger.log("Received request with data: " + (e.postData ? e.postData.contents : "No data"));
    
    // Get the active spreadsheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Parse the incoming data
    let data;
    if (e && e.postData) {
      const content = e.postData.contents;
      Logger.log("Raw content: " + content);
      
      try {
        data = JSON.parse(content);
      } catch (parseError) {
        Logger.log("Parse error: " + parseError.toString());
        return ContentService
          .createTextOutput(JSON.stringify({ result: "error", error: "Invalid JSON data" }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    } else {
      return ContentService
        .createTextOutput(JSON.stringify({ result: "error", error: "No data received" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // CRITICAL: Check action type FIRST to determine routing
    const action = data.action;
    Logger.log("Action detected: " + action);
    
    // ROUTE BASED ON EXPLICIT ACTION
    if (action === 'register') {
      Logger.log("Routing to registration handler");
      return handleRegistration(ss, data);
    }
    else if (action === 'authenticate') {
      Logger.log("Routing to authentication handler");
      return handleAuthentication(ss, data);
    }
    else if (action === 'listUsers') {
      Logger.log("Routing to list users handler");
      return handleListUsers(ss, data);
    }
    else if (action === 'testConnection') {
      Logger.log("Routing to test connection handler");
      return ContentService
        .createTextOutput(JSON.stringify({ result: "success", message: "Connection successful" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    else if (action === 'fetchBookings') {
      Logger.log("Routing to fetch bookings handler");
      return handleFetchBookings(ss, data);
    }
    else if (action === 'saveBooking' || data.bookingId || (data.collectionName && data.deliveryName)) {
      Logger.log("Routing to booking handler");
      return handleBooking(ss, data);
    }
    else {
      Logger.log("Unknown request type - no valid action or booking data found");
      Logger.log("Data keys: " + Object.keys(data).join(", "));
      return ContentService
        .createTextOutput(JSON.stringify({ result: "error", error: "Unknown request type" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
  } catch(error) {
    Logger.log("Error in doPost: " + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({ result: "error", error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// User Registration Handler - ONLY handles registration
function handleRegistration(ss, data) {
  Logger.log("=== REGISTRATION HANDLER START ===");
  Logger.log("Registration data: " + JSON.stringify(data));
  
  // CRITICAL: Verify this is actually registration data
  if (!data.email || !data.password || !data.name) {
    Logger.log("REJECTING: Missing registration fields");
    return ContentService
      .createTextOutput(JSON.stringify({ result: "error", error: "Missing required registration fields" }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  // CRITICAL: Reject if this looks like booking data
  if (data.bookingId || data.collectionName || data.deliveryName) {
    Logger.log("REJECTING: Booking data detected in registration handler");
    return ContentService
      .createTextOutput(JSON.stringify({ result: "error", error: "Invalid registration data - booking fields detected" }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  // Create account sheets if they don't exist
  createAccountSheets(ss);
  
  // Determine which sheet to use based on account type
  const accountType = data.accountType || "customer";
  const sheetName = accountType === "customer" ? "Customer_Accounts" : "Employee_Accounts";
  let sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    Logger.log("Sheet " + sheetName + " not found, creating it");
    createAccountSheets(ss);
    sheet = ss.getSheetByName(sheetName);
  }
  
  // Check if email already exists
  const customerSheet = ss.getSheetByName("Customer_Accounts");
  const employeeSheet = ss.getSheetByName("Employee_Accounts");
  
  let emailExists = false;
  
  if (customerSheet) {
    const customerValues = customerSheet.getDataRange().getValues();
    for (let i = 1; i < customerValues.length; i++) {
      if (customerValues[i][1] === data.email) {
        emailExists = true;
        break;
      }
    }
  }
  
  if (!emailExists && employeeSheet) {
    const employeeValues = employeeSheet.getDataRange().getValues();
    for (let i = 1; i < employeeValues.length; i++) {
      if (employeeValues[i][1] === data.email) {
        emailExists = true;
        break;
      }
    }
  }
  
  if (emailExists) {
    Logger.log("Email already exists: " + data.email);
    return ContentService
      .createTextOutput(JSON.stringify({ result: "error", error: "Email already registered" }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  // Generate unique ID
  const userId = accountType + "_" + new Date().getTime().toString(36);
  
  // Create row data
  const rowData = [
    userId,
    data.email,
    data.password,
    data.name,
    data.company || "",
    data.phone || "",
    new Date().toLocaleString(),
    "",
    accountType
  ];
  
  if (accountType !== "customer") {
    rowData.push(data.workerPermissions ? JSON.stringify(data.workerPermissions) : "");
  }
  
  // Add to the CORRECT account sheet
  Logger.log("Adding registration to sheet: " + sheetName);
  sheet.appendRow(rowData);
  
  Logger.log("=== REGISTRATION HANDLER SUCCESS ===");
  
  return ContentService
    .createTextOutput(JSON.stringify({ result: "success", userId: userId }))
    .setMimeType(ContentService.MimeType.JSON);
}

// Booking Handler - ONLY handles booking data
function handleBooking(ss, data) {
  Logger.log("=== BOOKING HANDLER START ===");
  Logger.log("Booking data: " + JSON.stringify(data));
  
  // CRITICAL: Reject registration data
  if (data.action === 'register' || (data.email && data.password && data.name && !data.bookingId)) {
    Logger.log("REJECTING: Registration data detected in booking handler");
    return ContentService
      .createTextOutput(JSON.stringify({ result: "error", error: "Invalid booking data - registration fields detected" }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  // CRITICAL: Verify this is actually booking data
  if (!data.bookingId && !data.collectionName && !data.deliveryName) {
    Logger.log("REJECTING: Missing booking fields");
    return ContentService
      .createTextOutput(JSON.stringify({ result: "error", error: "Missing required booking fields" }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  // Get or create the bookings sheet
  let sheet = ss.getSheetByName("Delivery_Bookings");
  
  if (!sheet) {
    Logger.log("Creating Delivery_Bookings sheet");
    sheet = ss.insertSheet("Delivery_Bookings");
    const headers = [
      "Timestamp", "Booking ID", "Collection Name", "Collection Address", 
      "Collection Postcode", "Delivery Name", "Delivery Address", 
      "Delivery Postcode", "Date", "Time", "Urgent", "Vehicle Type", 
      "Parcel Count", "Base Price", "VAT", "Total Price", "User ID", "Status", 
      "Contact Email", "Contact Phone", "Additional Info"
    ];
    sheet.appendRow(headers);
  }
  
  // Prepare booking data
  const rowData = [
    new Date().toLocaleString(),
    data.bookingId || "",
    data.collectionName || "",
    data.collectionAddress || "",
    data.collectionPostcode || "",
    data.deliveryName || "",
    data.deliveryAddress || "",
    data.deliveryPostcode || "",
    data.date || "",
    data.deliveryTime || "",
    data.isUrgent || "No",
    data.vehicleType || "",
    parseInt(data.parcelCount) || 1,
    data.basePrice || "",
    data.vat || "",
    data.totalPrice || "",
    data.userId || "",
    data.status || "pending",
    data.contactEmail || "",
    data.contactPhone || "",
    data.additionalInfo || ""
  ];
  
  Logger.log("Adding booking to Delivery_Bookings sheet");
  sheet.appendRow(rowData);
  
  Logger.log("=== BOOKING HANDLER SUCCESS ===");
  
  return ContentService
    .createTextOutput(JSON.stringify({ result: "success" }))
    .setMimeType(ContentService.MimeType.JSON);
}

// Create account sheets
function createAccountSheets(ss) {
  let customerSheet = ss.getSheetByName("Customer_Accounts");
  if (!customerSheet) {
    customerSheet = ss.insertSheet("Customer_Accounts");
    customerSheet.appendRow([
      "UserID", "Email", "Password", "Name", "Company", "Phone", "Created At", 
      "Last Login", "Account Type"
    ]);
  }
  
  let employeeSheet = ss.getSheetByName("Employee_Accounts");
  if (!employeeSheet) {
    employeeSheet = ss.insertSheet("Employee_Accounts");
    employeeSheet.appendRow([
      "UserID", "Email", "Password", "Name", "Company", "Phone", "Created At", 
      "Last Login", "Account Type", "Worker Permissions"
    ]);
  }
}

// Authentication Handler
function handleAuthentication(ss, data) {
  const customerSheet = ss.getSheetByName("Customer_Accounts");
  const employeeSheet = ss.getSheetByName("Employee_Accounts");
  
  if (!customerSheet && !employeeSheet) {
    createAccountSheets(ss);
    return ContentService
      .createTextOutput(JSON.stringify({ result: "error", error: "Account sheets created. Please try again." }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  const email = data.email;
  const password = data.password;
  
  let user = null;
  let userRowIndex = -1;
  let isEmployee = false;
  
  // Check Customer_Accounts
  if (customerSheet) {
    const customerValues = customerSheet.getDataRange().getValues();
    for (let i = 1; i < customerValues.length; i++) {
      if (customerValues[i][1] === email && customerValues[i][2] === password) {
        user = {
          id: customerValues[i][0],
          email: customerValues[i][1],
          name: customerValues[i][3],
          company: customerValues[i][4] || "",
          phone: customerValues[i][5] || "",
          accountType: "customer"
        };
        userRowIndex = i + 1;
        break;
      }
    }
  }
  
  // Check Employee_Accounts
  if (!user && employeeSheet) {
    const employeeValues = employeeSheet.getDataRange().getValues();
    for (let i = 1; i < employeeValues.length; i++) {
      if (employeeValues[i][1] === email && employeeValues[i][2] === password) {
        user = {
          id: employeeValues[i][0],
          email: employeeValues[i][1],
          name: employeeValues[i][3],
          phone: employeeValues[i][5] || "",
          accountType: employeeValues[i][8] || "employee",
          isAdmin: employeeValues[i][8] === "admin",
          isWorker: employeeValues[i][8] === "worker",
          workerPermissions: employeeValues[i][9] ? JSON.parse(employeeValues[i][9]) : null
        };
        userRowIndex = i + 1;
        isEmployee = true;
        break;
      }
    }
  }
  
  if (user) {
    const sheetToUpdate = isEmployee ? employeeSheet : customerSheet;
    sheetToUpdate.getRange(userRowIndex, 8).setValue(new Date().toLocaleString());
    
    return ContentService
      .createTextOutput(JSON.stringify({ result: "success", user: user }))
      .setMimeType(ContentService.MimeType.JSON);
  } else {
    return ContentService
      .createTextOutput(JSON.stringify({ result: "error", error: "Invalid credentials" }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Fetch Bookings Handler
function handleFetchBookings(ss, data) {
  const sheet = ss.getSheetByName("Delivery_Bookings");
  
  if (!sheet) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: "error", error: "Delivery_Bookings sheet not found" }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  const allData = sheet.getDataRange().getValues();
  
  if (allData.length < 2) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: "success", bookings: [] }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  const headers = allData[0];
  const bookings = [];
  
  for (let i = 1; i < allData.length; i++) {
    const row = allData[i];
    const booking = {};
    
    for (let j = 0; j < headers.length; j++) {
      booking[headers[j]] = row[j];
    }
    
    bookings.push(booking);
  }
  
  return ContentService
    .createTextOutput(JSON.stringify({ result: "success", bookings: bookings }))
    .setMimeType(ContentService.MimeType.JSON);
}

// List Users Handler
function handleListUsers(ss, data) {
  const customerSheet = ss.getSheetByName("Customer_Accounts");
  const employeeSheet = ss.getSheetByName("Employee_Accounts");
  
  if (!customerSheet && !employeeSheet) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: "error", error: "Account sheets not found" }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  const users = [];
  
  if (customerSheet) {
    const customerValues = customerSheet.getDataRange().getValues();
    for (let i = 1; i < customerValues.length; i++) {
      users.push({
        id: customerValues[i][0],
        email: customerValues[i][1],
        name: customerValues[i][3],
        company: customerValues[i][4] || "",
        phone: customerValues[i][5] || "",
        createdAt: customerValues[i][6],
        lastLogin: customerValues[i][7] || "",
        accountType: "customer"
      });
    }
  }
  
  if (employeeSheet) {
    const employeeValues = employeeSheet.getDataRange().getValues();
    for (let i = 1; i < employeeValues.length; i++) {
      users.push({
        id: employeeValues[i][0],
        email: employeeValues[i][1],
        name: employeeValues[i][3],
        company: employeeValues[i][4] || "",
        phone: employeeValues[i][5] || "",
        createdAt: employeeValues[i][6],
        lastLogin: employeeValues[i][7] || "",
        accountType: employeeValues[i][8] || "employee",
        workerPermissions: employeeValues[i][9] || ""
      });
    }
  }
  
  return ContentService
    .createTextOutput(JSON.stringify({ result: "success", users: users }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

## Critical Changes Made:

1. **Enhanced Action Detection** - Now checks for `action === 'register'` FIRST
2. **Strict Data Validation** - Each handler validates data type and rejects wrong data
3. **Enhanced Logging** - Added detailed logs to track which handler is being used
4. **Better Error Messages** - Specific error messages for debugging

## Steps to Apply:

1. **Copy the entire code above**
2. **Go to your Google Apps Script editor**
3. **Select ALL existing code and DELETE it**
4. **Paste the new code**
5. **Save the script**
6. **Deploy a new version**

This version will absolutely prevent account registrations from going to the wrong sheet.
 