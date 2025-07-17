#  Google Sheets Script Fix

Replace your current Google Apps Script code with this updated version that properly routes registration requests:

```javascript
// Google Apps Script code to paste in your Google Sheets script editor

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
    
    // Check action type to determine which operation to perform
    const action = data.action || 'saveBooking';
    
    Logger.log("Action detected: " + action);
    
    // CRITICAL: Route registration requests to the correct handler
    if (action === 'register') {
      Logger.log("Routing to registration handler");
      return handleRegistration(ss, data);
    }
    else if (action === 'authenticate') {
      return handleAuthentication(ss, data);
    }
    else if (action === 'listUsers') {
      return handleListUsers(ss, data);
    }
    else if (action === 'testConnection') {
      return ContentService
        .createTextOutput(JSON.stringify({ result: "success", message: "Connection successful" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    else if (action === 'fetchBookings') {
      return handleFetchBookings(ss, data);
    }
    // ONLY handle booking data if it's actually booking data
    else if (data.bookingId || (data.collectionName && data.deliveryName)) {
      Logger.log("Routing to booking handler");
      return handleBooking(ss, data);
    }
    else {
      Logger.log("Unknown request type - rejecting");
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

// User Registration Handler - ONLY writes to account sheets
function handleRegistration(ss, data) {
  Logger.log("Handling registration: " + JSON.stringify(data));
  
  // CRITICAL: Reject if this looks like booking data
  if (data.bookingId || data.collectionName || data.deliveryName) {
    Logger.log("Rejecting booking data in registration handler");
    return ContentService
      .createTextOutput(JSON.stringify({ result: "error", error: "Invalid registration data" }))
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
  sheet.appendRow(rowData);
  
  Logger.log("User registered successfully in " + sheetName);
  
  return ContentService
    .createTextOutput(JSON.stringify({ result: "success", userId: userId }))
    .setMimeType(ContentService.MimeType.JSON);
}

// Booking Handler - ONLY handles booking data
function handleBooking(ss, data) {
  Logger.log("Handling booking: " + JSON.stringify(data));
  
  // CRITICAL: Reject registration data
  if (data.action === 'register' || (!data.bookingId && !data.collectionName && !data.deliveryName)) {
    Logger.log("Rejecting non-booking data in booking handler");
    return ContentService
      .createTextOutput(JSON.stringify({ result: "error", error: "Invalid booking data" }))
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
  
  sheet.appendRow(rowData);
  
  Logger.log("Booking saved successfully to Delivery_Bookings sheet");
  
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

## Steps to Fix:

1. **Copy the above code**
2. **Go to your Google Apps Script editor**
3. **Replace ALL existing code with this new code**
4. **Save the script**
5. **Deploy a new version (Deploy > New deployment)**

The key fixes:
- **Enhanced action routing** - properly separates registration from booking requests
- **Stricter data validation** - rejects booking data in registration handler and vice versa
- **Better logging** - shows which handler is being used
- **Proper sheet targeting** - registrations only go to account sheets

This will stop account registrations from appearing in your Delivery_Bookings sheet.
 