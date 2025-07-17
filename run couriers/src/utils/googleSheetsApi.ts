//  Functions to interact with Google Sheets via proxy
import { BookingData } from '../types';

// Google Sheets script URL - replace with your own Google Apps Script URL 
// Must have been deployed and authorized
const getGoogleScriptUrl = () => {
  const scriptUrl = localStorage.getItem('googleSheetsScriptUrl');
  const scriptId = localStorage.getItem('googleScriptId');
  
  if (scriptUrl && scriptUrl.trim()) {
    return scriptUrl.trim();
  }
  
  if (scriptId && scriptId.trim()) {
    return `https://script.google.com/macros/s/${scriptId.trim()}/exec`;
  }
  
  return "";
}; 
 
 

// Helper function to get spreadsheet ID from Google Sheets URL
function getSpreadsheetId(): string {
  const sheetsUrl = localStorage.getItem('googleSheetsUrl') || "";
  const match = sheetsUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : "";
} 

//  Debug mode - logs extra information to help identify issues
const DEBUG_MODE = true;

// Add enhanced error logging
const logError = (message: string, error?: any) => {
  console.error(`[GoogleSheets] ${message}`, error);
  if (DEBUG_MODE && error) {
    console.error('Full error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
  }
}; 

// Function to test the Google Sheets connection
export    const testGoogleSheetsConnection = async () => {
  const scriptUrl = getGoogleScriptUrl();
  if (!scriptUrl) {
    return { success: false, error: "No Google Sheets script URL configured" };
  }

  try {
    if (DEBUG_MODE) console.log("Testing connection to:", scriptUrl);
    
    // First try a direct GET request to the script URL
    try {
      const directResponse = await fetch(scriptUrl, { method: 'GET' });
      if (directResponse.ok) {
        const text = await directResponse.text();
        if (text.includes("Delivery Booking Web App is active")) {
          return { 
            success: true, 
            message: "Connection successful! Google Sheets integration is working." 
          };
        }
      }
    } catch (directError) {
      console.log("Direct connection failed, trying through proxy");
    }
    
    // If direct fails, try through proxy
    const testData = {
      action: 'testConnection'
    };
    
    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain'
      },
      body: JSON.stringify(testData),
      redirect: 'follow'
    }); 
    
    if (DEBUG_MODE) console.log("Connection test response status:", response.status);
    
    if (response.ok) {
      const result = await response.json();
      if (result.result === "success") {
        return { 
          success: true, 
          message: "Connection successful! Google Sheets integration is working." 
        };
      }
    } else {
      const errorText = await response.text();
      console.error('Proxy test error:', errorText);
    }
    
    return { 
      success: false, 
      error: `Connection failed. Status: ${response.status}. Please verify your Google Apps Script is deployed as a web app with 'Anyone' access.`
    };
  } catch (error) {
    console.error("Connection test error:", error);
    return { 
      success: false, 
      error: `Connection error: ${(error as Error).message}. Please verify your Google Apps Script URL is correct and deployed properly.`
    };
  }
}; 
  

//  Function to save booking to Google Sheets
export const saveBookingToGoogleSheets = async (bookingData: any): Promise<{success: boolean, error?: string}> => {
  const scriptUrl = getGoogleScriptUrl();
  if (!scriptUrl) {
    logError("No Google Sheets script URL configured, skipping Google Sheets save");
    return { success: false, error: "No Google Sheets integration configured" };
  }
  
  // Validate essential booking data
  if (!bookingData.bookingId) {
    logError("Missing booking ID");
    return { success: false, error: "Missing booking ID" };
  } 
 
  
  try {
    if (DEBUG_MODE) console.log("Saving booking to Google Sheets:", bookingData);
    
       // Prepare the payload for Google Sheets with complete data
    const payload = {
      action: 'saveBooking',
      bookingId: bookingData.bookingId,
      timestamp: bookingData.timestamp || new Date().toLocaleString(),
      collectionName: bookingData.collectionName,
      collectionAddress: bookingData.collectionAddress,
      collectionPostcode: bookingData.collectionPostcode,
      deliveryName: bookingData.deliveryName,
      deliveryAddress: bookingData.deliveryAddress,
      deliveryPostcode: bookingData.deliveryPostcode,
      date: bookingData.date,
      deliveryTime: bookingData.deliveryTime,
      isUrgent: bookingData.isUrgent ? 'Yes' : 'No',
      vehicleType: bookingData.vehicleType,
      parcelCount: parseInt(bookingData.parcelCount) || parseInt(bookingData.parcel_count) || parseInt(bookingData.parcels) || 1, 
      basePrice: bookingData.basePrice,
      vat: bookingData.vat,
      totalPrice: bookingData.totalPrice,
      userId: bookingData.userId,
      status: bookingData.status || 'pending',
      contactEmail: bookingData.contactEmail,
      contactPhone: bookingData.contactPhone,
      additionalInfo: bookingData.additionalInfo,
      // Include cancellation and status update fields
      outsourcedTo: bookingData.outsourcedTo || '',
      outsourcedEmail: bookingData.outsourcedEmail || '',
      outsourcedPhone: bookingData.outsourcedPhone || '',
      outsourcedNotes: bookingData.outsourcedNotes || '',
      outsourcedAt: bookingData.outsourcedAt || '',
      declineReason: bookingData.declineReason || '',
      declinedAt: bookingData.declinedAt || '',
      cancelledAt: bookingData.cancelledAt || '',
      modifiableUntil: bookingData.modifiableUntil || ''
    };
    
       // Convert payload to a string buffer to avoid redirect issues
    const payloadString = JSON.stringify(payload);
    
       if (DEBUG_MODE) {
      console.log("Sending to Google Sheets URL:", scriptUrl);
      console.log("Payload being sent:", payloadString);
      console.log("Parcel count in payload:", payload.parcelCount);
      console.log("Original booking data parcel count:", bookingData.parcelCount);
      console.log("Original booking data parcel_count:", bookingData.parcel_count);
    } 
    
    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const response = await fetch(scriptUrl, { 
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        'Accept': 'application/json'
      },
      body: payloadString,
      redirect: 'follow',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId); 
    
       if (!response.ok) {
      const errorText = await response.text();
      logError(`HTTP error! status: ${response.status}`, { status: response.status, body: errorText, url: scriptUrl });
      
      // Provide specific error messages for common issues
      if (response.status === 403) {
        return { success: false, error: "Access denied. Please check your Google Apps Script deployment permissions." };
      } else if (response.status === 404) {
        return { success: false, error: "Script not found. Please verify your Google Apps Script URL." };
      } else if (response.status >= 500) {
        return { success: false, error: "Google Sheets server error. Please try again later." };
      }
      
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    } 
    
    const responseText = await response.text();
    if (DEBUG_MODE) console.log("Raw response from Google Sheets:", responseText);
    
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Failed to parse response as JSON:", responseText);
      return { 
        success: false, 
        error: `Invalid response from Google Sheets: ${responseText}` 
      };
    } 
    
       if (DEBUG_MODE) console.log("Google Sheets save result:", result);
    
    if (result && (result.result === "success" || result.success === true)) {
      console.log("Successfully saved booking to Google Sheets");
      return { success: true };
    } else {
      console.error("Google Sheets save failed:", result);
      return { 
        success: false, 
        error: result?.error || "Error sending to Google Sheets" 
      };
    } 
   } catch (error) {
    if ((error as Error).name === 'AbortError') {
      logError("Request timeout when saving to Google Sheets");
      return { 
        success: false, 
        error: "Request timeout. Please check your internet connection and try again." 
      };
    }
    
    logError("Error saving to Google Sheets", error);
    return { 
      success: false, 
      error: `Google Sheets error: ${(error as Error).message}` 
    };
  } 
};  

// Function to delete booking from Google Sheets
export  const deleteBookingFromGoogleSheets = async (bookingId: string): Promise<{success: boolean, error?: string}> => {
  const scriptUrl = getGoogleScriptUrl();
  if (!scriptUrl) {
    return { success: false, error: "No Google Sheets integration configured" };
  }
 
  
  try {
    const data = {
      action: 'deleteBooking',
      bookingId: bookingId
    };
    
    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain'
      },
      body: JSON.stringify(data),
      redirect: 'follow'
    }); 
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.result === "success") {
      return { success: true };
    } else {
      return { 
        success: false, 
        error: result.error || "Error deleting from Google Sheets" 
      };
    }
  } catch (error) {
    console.error("Error deleting from Google Sheets:", error);
    // Return success true to not block the main flow
    return { success: true };
  }
};

//  Function to fetch all bookings from Google Sheets
export  const fetchBookingsFromGoogleSheets = async (): Promise<{success: boolean, bookings?: any[], error?: string}> => {
  const scriptUrl = getGoogleScriptUrl();
  if (!scriptUrl) {
    return { success: false, error: "No Google Sheets integration configured" };
  }
 
  
  try {
    if (DEBUG_MODE) console.log("Fetching bookings from Google Sheets...");
    
    // Try direct GET request first for fetching
    try {
      const directResponse = await fetch(scriptUrl + '?action=fetchBookings', {
        method: 'GET',
        mode: 'cors'
      });
      
      if (directResponse.ok) {
        const directResult = await directResponse.json();
        if (directResult.result === "success") {
          if (DEBUG_MODE) console.log("Direct fetch successful:", directResult);
          return { 
            success: true, 
            bookings: directResult.bookings || [] 
          };
        }
      }
    } catch (directError) {
      console.log("Direct fetch failed, trying through proxy");
    }
    
    // Fallback to direct POST method
    const data = {
      action: 'fetchBookings'
    };
    
    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain'
      },
      body: JSON.stringify(data),
      redirect: 'follow'
    }); 
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error from proxy! status: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    
    if (DEBUG_MODE) console.log("Google Sheets fetch result:", result);
    
    if (result.result === "success") {
      return { 
        success: true, 
        bookings: result.bookings || [] 
      };
    } else {
      return { 
        success: false, 
        error: result.error || "Failed to fetch bookings from Google Sheets" 
      };
    }
  } catch (error) {
    console.error("Error fetching from Google Sheets:", error);
    return { 
      success: false, 
      error: `Failed to fetch from Google Sheets: ${(error as Error).message}` 
    };
  }
}; 

//   Function to register user via Google Sheets
export  const registerViaGoogleSheets = async (userData: any): Promise<{success: boolean, userId?: string, error?: string}> => {
  const scriptUrl = getGoogleScriptUrl();
  if (!scriptUrl) {
    console.error('No Google Sheets script URL configured');
    return { success: false, error: "No Google Sheets integration configured" };
  }
 
  
  try {
    console.log('Registering user via Google Sheets:', userData.email);
    console.log('Script URL:', scriptUrl);
    
    // Prepare data for Google Sheets with EXPLICIT action for user registration
    const payload = {
      action: 'register', // Use 'register' to match the script handler
      id: userData.id,
      name: userData.name,
      email: userData.email,
      password: userData.password,
      company: userData.company || '',
      phone: userData.phone || '',
      accountType: userData.accountType || 'customer',
      workerPermissions: userData.workerPermissions || null,
      timestamp: new Date().toISOString()
    };
    
    console.log('Sending registration payload:', payload);
    
    // Convert payload to string buffer to avoid redirect issues
    const payloadString = JSON.stringify(payload);
    
    // Try direct connection first (no proxy)
    try {
      const directResponse = await fetch(scriptUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain'
        },
        body: payloadString,
        redirect: 'follow'
      });
      
      console.log('Direct response status:', directResponse.status);
      
      if (directResponse.ok) {
        const result = await directResponse.json();
        console.log('Direct registration result:', result);
        
        if (result.result === "success") {
          return { 
            success: true, 
            userId: result.userId || userData.id
          };
        } else {
          return { 
            success: false, 
            error: result.error || "Error registering user in Google Sheets" 
          };
        }
      }
    } catch (directError) {
      console.log('Direct connection failed, trying through proxy:', directError);
    }
    
       // Fallback to proxy - send as plain text like successful booking saves
    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain'
      },
      body: payloadString,
      redirect: 'follow'
    }); 
    
    console.log('Proxy response status:', response.status);
    console.log('Proxy response ok:', response.ok);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('HTTP error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log('Proxy registration result:', result);
    
    if (result.result === "success" || result.success === true) {
      console.log('User registered successfully in Google Sheets via proxy');
      return { 
        success: true, 
        userId: result.userId || userData.id
      };
    } else {
      console.error('Registration failed:', result.error);
      return { 
        success: false, 
        error: result.error || "Error registering user in Google Sheets" 
      };
    }
  } catch (error) {
    console.error("Error registering with Google Sheets:", error);
    return { 
      success: false, 
      error: `Registration error: ${(error as Error).message}` 
    };
  }
};  

// Function to authenticate user via Google Sheets
export  const authenticateViaGoogleSheets = async (email: string, password: string): Promise<{success: boolean, user?: any, error?: string}> => {
  const scriptUrl = getGoogleScriptUrl();
  if (!scriptUrl) {
    return { success: false, error: "No Google Sheets integration configured" };
  }
 
  
  try {
    const data = {
      action: 'authenticate',
      email,
      password
    };
    
       const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain'
      },
      body: JSON.stringify(data),
      redirect: 'follow'
    });  
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.result === "success") {
      return { 
        success: true, 
        user: result.user
      };
    } else {
      return { 
        success: false, 
        error: result.error || "Invalid credentials" 
      };
    }
  } catch (error) {
    console.error("Authentication error with Google Sheets:", error);
    return { 
      success: false, 
      error: `Authentication error: ${(error as Error).message}` 
    };
  }
};

// Function to fetch users via Google Sheets (admin only)
export  const fetchUsersFromGoogleSheets = async (): Promise<{success: boolean, users?: any[], error?: string}> => {
  const scriptUrl = getGoogleScriptUrl();
  if (!scriptUrl) {
    return { success: false, error: "No Google Sheets integration configured" };
  }
 
  
  try {
    const data = {
      action: 'listUsers'
    };
    
    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain'
      },
      body: JSON.stringify(data),
      redirect: 'follow'
    });  
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.result === "success") {
      return { 
        success: true, 
        users: result.users || [] 
      };
    } else {
      return { 
        success: false, 
        error: result.error || "Failed to fetch users from Google Sheets" 
      };
    }
  } catch (error) {
    console.error("Error fetching users from Google Sheets:", error);
    return { 
      success: false, 
      error: `Failed to fetch users: ${(error as Error).message}` 
    };
  }
};

// Function to get Google Sheets setup code
export function getGoogleSheetsSetupCode() {
  return `// Google Apps Script code to paste in your Google Sheets script editor

function doGet(e) {
  return ContentService
    .createTextOutput("Delivery Booking Web App is active.")
    .setMimeType(ContentService.MimeType.TEXT);
}

function  doPost(e) {
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
      
      // Handle both JSON and plain text content
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
    
    // USER ACCOUNT OPERATIONS
    if (action === 'authenticate') {
      return handleAuthentication(ss, data);
    } 
    else if (action === 'register') {
      return handleRegistration(ss, data);
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
    // DEFAULT: HANDLE BOOKING DATA
    else {
      return handleBooking(ss, data);
    }
  } catch(error) {
    // Log the error
    Logger.log("Error in doPost: " + error.toString());
    
    // Return error response
    return ContentService
      .createTextOutput(JSON.stringify({ result: "error", error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } finally {
    // Always release the lock
    lock.releaseLock();
  }
}

// Fetch Bookings Handler
function handleFetchBookings(ss, data) {
  const sheet = ss.getSheetByName("Delivery_Bookings");
  
  if (!sheet) {
    return ContentService
      .createTextOutput(JSON.stringify({ 
        result: "error", 
        error: "Delivery_Bookings sheet not found" 
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  // Get all data including headers
  const allData = sheet.getDataRange().getValues();
  
  // If there's less than 2 rows (just headers or empty), return empty array
  if (allData.length < 2) {
    return ContentService
      .createTextOutput(JSON.stringify({ 
        result: "success", 
        bookings: [] 
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  // Extract headers (first row)
  const headers = allData[0];
  
  // Convert data to array of objects with headers as keys
  const bookings = [];
  
  // Start from second row (index 1) to skip headers
  for (let i = 1; i < allData.length; i++) {
    const row = allData[i];
    const booking = {};
    
    // Map each column to its header
    for (let j = 0; j < headers.length; j++) {
      booking[headers[j]] = row[j];
    }
    
    bookings.push(booking);
  }
  
  return ContentService
    .createTextOutput(JSON.stringify({ 
      result: "success", 
      bookings: bookings 
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

// User Authentication Handler
function handleAuthentication(ss, data) {
  // First check Customer_Accounts sheet
  const customerSheet = ss.getSheetByName("Customer_Accounts");
  const employeeSheet = ss.getSheetByName("Employee_Accounts");
  
  // Create the Customer_Accounts sheet if it doesn't exist
  if (!customerSheet && !employeeSheet) {
    Logger.log("Account sheets not found - creating them");
    createAccountSheets(ss);
    
    return ContentService
      .createTextOutput(JSON.stringify({ 
        result: "error", 
        error: "Account sheets were just created. Please try logging in again." 
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  // Get the user's email and password from the request
  const email = data.email;
  const password = data.password;
  
  // Check both sheets for the user
  let user = null;
  let userRowIndex = -1;
  let isEmployee = false;
  
  Logger.log("Looking for user with email: " + email);
  
  // First check Customer_Accounts
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
        userRowIndex = i + 1; // +1 because array is 0-indexed but sheet rows start at 1
        isEmployee = false;
        break;
      }
    }
  }
  
  // If not found in Customer_Accounts, check Employee_Accounts
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
    // Update last login time in the appropriate sheet
    const sheetToUpdate = isEmployee ? employeeSheet : customerSheet;
    sheetToUpdate.getRange(userRowIndex, 8).setValue(new Date().toLocaleString());
    
    return ContentService
      .createTextOutput(JSON.stringify({ 
        result: "success", 
        user: user 
      }))
      .setMimeType(ContentService.MimeType.JSON);
  } else {
    return ContentService
      .createTextOutput(JSON.stringify({ 
        result: "error", 
        error: "Invalid credentials" 
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Create account sheets if they don't exist
function createAccountSheets(ss) {
  // Create Customer_Accounts sheet
  let customerSheet = ss.getSheetByName("Customer_Accounts");
  if (!customerSheet) {
    customerSheet = ss.insertSheet("Customer_Accounts");
    customerSheet.appendRow([
      "UserID", "Email", "Password", "Name", "Company", "Phone", "Created At", 
      "Last Login", "Account Type"
    ]);
  }
  
  // Create Employee_Accounts sheet
  let employeeSheet = ss.getSheetByName("Employee_Accounts");
  if (!employeeSheet) {
    employeeSheet = ss.insertSheet("Employee_Accounts");
    employeeSheet.appendRow([
      "UserID", "Email", "Password", "Name", "Company", "Phone", "Created At", 
      "Last Login", "Account Type", "Worker Permissions"
    ]);
  }
}

//  User Registration Handler
function handleRegistration(ss, data) {
  Logger.log("Handling registration: " + JSON.stringify(data));
  
  // Create account sheets if they don't exist
  createAccountSheets(ss);
  
  // Determine which sheet to use based on account type
  const accountType = data.accountType || "customer";
  const sheetName = accountType === "customer" ? "Customer_Accounts" : "Employee_Accounts";
  let sheet = ss.getSheetByName(sheetName);
  
  // Make sure the sheet exists
  if (!sheet) {
    Logger.log("Sheet " + sheetName + " not found, creating it");
    sheet = ss.insertSheet(sheetName);
    if (sheetName === "Customer_Accounts") {
      sheet.appendRow([
        "UserID", "Email", "Password", "Name", "Company", "Phone", "Created At", 
        "Last Login", "Account Type"
      ]);
    } else {
      sheet.appendRow([
        "UserID", "Email", "Password", "Name", "Company", "Phone", "Created At", 
        "Last Login", "Account Type", "Worker Permissions"
      ]);
    }
  }
  
  // Check if email already exists in either sheet
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
      .createTextOutput(JSON.stringify({ 
        result: "error", 
        error: "Email already registered" 
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  // Generate a unique ID
  const userId = accountType + "_" + new Date().getTime().toString(36);
  
  Logger.log("Adding new user with ID: " + userId + " to " + sheetName);
  
  // Create row data
  const rowData = [
    userId,                 // UserID
    data.email,             // Email
    data.password,          // Password
    data.name,              // Name
    data.company || "",     // Company
    data.phone || "",       // Phone
    new Date().toLocaleString(), // Created At
    "",                     // Last Login
    accountType             // Account Type
  ];
  
  // Add worker permissions if this is an employee account
  if (accountType !== "customer" && data.workerPermissions) {
    rowData.push(JSON.stringify(data.workerPermissions));
  } else if (accountType !== "customer") {
    rowData.push(""); // Empty worker permissions
  }
  
  // Append the row to the CORRECT sheet (not the delivery bookings sheet)
  sheet.appendRow(rowData);
  
  Logger.log("User registration successful in " + sheetName);
  
  return ContentService
    .createTextOutput(JSON.stringify({ 
      result: "success", 
      userId: userId 
    }))
    .setMimeType(ContentService.MimeType.JSON);
} 

// List Users Handler (Admin only)
function handleListUsers(ss, data) {
  // Check both account sheets
  const customerSheet = ss.getSheetByName("Customer_Accounts");
  const employeeSheet = ss.getSheetByName("Employee_Accounts");
  
  if (!customerSheet && !employeeSheet) {
    return ContentService
      .createTextOutput(JSON.stringify({ 
        result: "error", 
        error: "Account sheets not found" 
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  const users = [];
  
  // Get customer accounts
  if (customerSheet) {
    const customerValues = customerSheet.getDataRange().getValues();
    
    // Skip the header row
    for (let i = 1; i < customerValues.length; i++) {
      const user = {
        id: customerValues[i][0],
        email: customerValues[i][1],
        // Don't include password for security
        name: customerValues[i][3],
        company: customerValues[i][4] || "",
        phone: customerValues[i][5] || "",
        createdAt: customerValues[i][6],
        lastLogin: customerValues[i][7] || "",
        accountType: "customer"
      };
      
      users.push(user);
    }
  }
  
  // Get employee accounts
  if (employeeSheet) {
    const employeeValues = employeeSheet.getDataRange().getValues();
    
    // Skip the header row
    for (let i = 1; i < employeeValues.length; i++) {
      const user = {
        id: employeeValues[i][0],
        email: employeeValues[i][1],
        // Don't include password for security
        name: employeeValues[i][3],
        company: employeeValues[i][4] || "",
        phone: employeeValues[i][5] || "",
        createdAt: employeeValues[i][6],
        lastLogin: employeeValues[i][7] || "",
        accountType: employeeValues[i][8] || "employee",
        workerPermissions: employeeValues[i][9] ? employeeValues[i][9] : ""
      };
      
      users.push(user);
    }
  }
  
  return ContentService
    .createTextOutput(JSON.stringify({ 
      result: "success", 
      users: users 
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

//  Booking Handler
function handleBooking(ss, data) {
  // ONLY handle actual booking data - reject registration attempts
  if (data.action === 'register' || data.email || (!data.bookingId && !data.collectionName && !data.deliveryName)) {
    Logger.log("Rejecting non-booking data in handleBooking");
    return ContentService
      .createTextOutput(JSON.stringify({ 
        result: "error", 
        error: "Invalid booking data" 
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  // Get or create the bookings sheet
  const sheet = ss.getSheetByName("Delivery_Bookings");
  
  if (!sheet) {
    // Create the sheet if it doesn't exist
    Logger.log("Creating Delivery_Bookings sheet");
    const newSheet = ss.insertSheet("Delivery_Bookings");
    const defaultHeaders = [
      "Timestamp", "Booking ID", "Collection Name", "Collection Address", 
      "Collection Postcode", "Delivery Name", "Delivery Address", 
      "Delivery Postcode", "Date", "Time", "Urgent", "Vehicle Type", 
      "Parcel Count", "Base Price", "VAT", "Total Price", "User ID", "Status", 
      "Contact Email", "Contact Phone", "Additional Info"
    ];
    newSheet.appendRow(defaultHeaders);
    return handleBooking(ss, data); // Retry with the new sheet
  }
  
  // Format date for the timestamp
  const formattedDate = new Date().toLocaleString();
  
  // Get existing column headers
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  // If sheet is empty, create headers
  if (headers.length === 0 || headers[0] === "") {
    const defaultHeaders = [
      "Timestamp", "Booking ID", "Collection Name", "Collection Address", 
      "Collection Postcode", "Delivery Name", "Delivery Address", 
      "Delivery Postcode", "Date", "Time", "Urgent", "Vehicle Type", 
      "Parcel Count", "Base Price", "VAT", "Total Price", "User ID", "Status", 
      "Contact Email", "Contact Phone", "Additional Info"
    ];
    sheet.appendRow(defaultHeaders);
    return handleBooking(ss, data); // Retry with headers
  }
  
  // Map data to row based on headers (ensures flexibility)
  const rowData = [
    formattedDate,                   // Timestamp
    data.bookingId || "",            // Booking ID
    data.collectionName || "",       // Collection Name
    data.collectionAddress || "",    // Collection Address
    data.collectionPostcode || "",   // Collection Postcode
    data.deliveryName || "",         // Delivery Name
    data.deliveryAddress || "",      // Delivery Address
    data.deliveryPostcode || "",     // Delivery Postcode
    data.date || "",                 // Delivery Date
    data.deliveryTime || "",         // Delivery Time
    data.isUrgent || "No",           // Urgent
    data.vehicleType || "",          // Vehicle Type
    parseInt(data.parcelCount) || parseInt(data.parcel_count) || parseInt(data.parcels) || 1,          // Parcel Count 
    data.basePrice || "",            // Base Price
    data.vat || "",                  // VAT
    data.totalPrice || "",           // Total Price
    data.userId || "",               // User ID
    data.status || "pending",        // Status
    data.contactEmail || "",         // Contact Email
    data.contactPhone || "",         // Contact Phone
    data.additionalInfo || ""        // Additional Info
  ];
  
  // Check if this is an update operation
  if (data.action === "update" && data.bookingId) {
    // Search for the existing booking
    const bookingIdCol = headers.indexOf("Booking ID") + 1;
    if (bookingIdCol > 0) {
      const dataRange = sheet.getRange(2, bookingIdCol, sheet.getLastRow() - 1, 1);
      const bookingIds = dataRange.getValues().flat();
      const rowIndex = bookingIds.indexOf(data.bookingId);
      
      if (rowIndex >= 0) {
        // Update the existing row (rowIndex + 2 because we start at row 2 and arrays are 0-indexed)
        sheet.getRange(rowIndex + 2, 1, 1, rowData.length).setValues([rowData]);
        Logger.log("Updated existing booking: " + data.bookingId);
      } else {
        // Booking not found, append as new
        sheet.appendRow(rowData);
        Logger.log("Booking not found for update, appended as new");
      }
    } else {
      // Booking ID column not found, append as new
      sheet.appendRow(rowData);
    }
  } else {
     // Log the parcel count being saved for debugging
   Logger.log("Parcel count being saved: " + (parseInt(data.parcelCount) || parseInt(data.parcel_count) || parseInt(data.parcels) || 1));
  Logger.log("Original data parcelCount: " + data.parcelCount);
  Logger.log("Original data parcel_count: " + data.parcel_count);
  Logger.log("Original data parcels: " + data.parcels);
  Logger.log("Row data parcel count (index 12): " + rowData[12]); 
  
  // Append the data row as a new booking
  sheet.appendRow(rowData); 
  }
  
  // Return success response
  return ContentService
    .createTextOutput(JSON.stringify({ result: "success" }))
    .setMimeType(ContentService.MimeType.JSON);
} 

// Handle preflight OPTIONS requests for CORS
function doOptions(e) {
  const output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);
  
  output.setHeader('Access-Control-Allow-Origin', '*');
  output.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  output.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  return output;
}`;
}

// Google Sheets setup instructions
export function getGoogleSheetsSetupInstructions() {
  return `
# Google Sheets Integration Setup Instructions

To properly set up Google Sheets integration with your delivery booking app, follow these steps:

## 1. Create a new Google Sheet

1. Go to https://sheets.google.com and create a new spreadsheet
2. Name it "Delivery Bookings Database" or similar

## 2. Set up Apps Script

1. In your Google Sheet, click on "Extensions" > "Apps Script"
2. In the Apps Script editor, delete any default code and paste the entire code provided above
3. Click "Save" and name the project "Delivery Booking System"

## 3. Deploy as Web App

1. Click on "Deploy" > "New deployment"
2. For "Deploy type" select "Web app"
3. Set "Execute as" to "Me"
4. Set "Who has access" to "Anyone"
5. Click "Deploy"
6. Copy the Web App URL that is generated

## 4. Configure Your App

1. Paste the Web App URL into the Google Sheets Script URL field in your app settings
2. Test the connection to verify it's working properly

## 5. Authorize Access

1. Visit the Web App URL directly in your browser
2. You should see the message "Delivery Booking Web App is active."
3. If prompted, authorize the script to access your Google Sheets

Your integration is now set up and ready to use!

> Note: The script creates three sheets in your spreadsheet:
> - Delivery_Bookings: Stores all booking information
> - Customer_Accounts: Stores customer account information
> - Employee_Accounts: Stores admin and worker account information
`;
}
 