jQuery.support.cors = true; // force cross-site scripting 
jQuery.support.allowCrossDomainPages = true; // force cross-site scripting 
document.ontouchmove = function(e){ e.preventDefault(); }
var jquery_path = "http://ajax.googleapis.com/ajax/libs/jquery/2.2.0/jquery.min.js";
//variables and constants

//temporary username and password variables to simulate checking with server
var usernameFromServer = "admin";
var passwordFromServer = "admin";

//Login variables
var serverURL = "http://192.168.0.2:3000/"
var rememberLoginDetails;
var loginAutomatically;
var username;
var password;
var userDetails = {username: username, password: password};
var isLoggedIn = false;
var detailsFormatIsValid;
var userDetailsVerified;


//min and max username and password length constants
const MIN_USERNAME_LENGTH = 3;
const MAX_USERNAME_LENGTH = 20;
const MIN_PASSWORD_LENGTH = 3;
const MAX_PASSWORD_LENGTH = 20;

//settings variables
var displayOnlyOpenPharmacies = "yes";
var searchRange = 3.0;
var noOfResults = 10;
//to get stored user settings
var userSettings = [];

//pharmacies stored in local storage - not currently functional - future implementation
var storedPharmacies = [];

//for geolocation
var watchLocation;
var userLocation;
var pharmacyCoordsList = [];

//to store raw results obtained from Google Places API
var pharmacyResults = [];

//to store pharmacy names
var pharmacyNamesList = [];
//to store pharmacy place ids
var pharmacyPlaceIDsList = [];
//to store pharmacy distance values
var pharmacyDistValuesList = [];
//to store pharmacy distance text
var pharmacyDistTextList = [];
//to store boolean stating whether pharmacy is open
var pharmacyIsOpenList = [];

//boolean values to assist turning on and off button functionality dependant on data loading
var isLoadingGPS = true;
var isLoadingResults = false;

//used to iterate through and display max no. of items in a list
var maxPharmacyCount;

//variables used for displaying individual pharmacy details
var selectedPharmacyIndex;
var selectedPharmAddress;
var selectedPharmPhoneNo;
var selectedPharmOpeningHrs = [];

//set HTML code variables
var beginningHTML = "<li data-icon=\"false\"><a class=\"ui-btn\">";
var endingHTML = "</a></li>";


$(document).ready(function(){
	
	//### GET DATA FROM LOCALSTORAGE ###

	//If there are pharmacies in the local storage, JSON.parse them into the array - not currently functional - future implementation
	if (localStorage.getItem("storedPharmacies") != null) storedPharmacies = JSON.parse(localStorage.storedPharmacies || []);
	//get rememberLoginDetails boolean that determines whether to store login details
	if (localStorage.getItem("rememberLoginDetails") != null) {
		rememberLoginDetails = JSON.parse(localStorage.rememberLoginDetails);	
	}
	else {
		rememberLoginDetails = false;
		localStorage.rememberLoginDetails = JSON.stringify(rememberLoginDetails);
	}
	//if rememberLoginDetails = true, then get stored username and password
	if (rememberLoginDetails) {	
		//get loginAutomatically if it is not null
		if (localStorage.getItem("loginAutomatically") != null) {
			loginAutomatically = JSON.parse(localStorage.loginAutomatically);
		} else {
			//else set loginAutomatically to false
			loginAutomatically = false;	
			localStorage.loginAutomatically = JSON.stringify(loginAutomatically);
		}
		//get stored username if it is not null
		if (localStorage.getItem("username") != null) {
			username = JSON.parse(localStorage.username);
		} else {
			//else set username to blank
			username = "";
		}
		//get stored password if it is not null
		if (localStorage.getItem("password") != null) {
			password = JSON.parse(localStorage.password);
		} else {
			//else set password to blank
			password = "";
		}
	} else {
		//else set username, password and auto login to blank/false
		username = "";
		password = "";
		loginAutomatically = false;
		localStorage.loginAutomatically = JSON.stringify(loginAutomatically);
	}
	//If there are settings in the local storage, JSON.parse them into the array
	if (localStorage.getItem("userSettings") != null) {
		//get user settings from local storage
		userSettings = JSON.parse(localStorage.userSettings);
		//store user settings in local variables
		searchRange = userSettings.searchDistance;
		noOfResults = userSettings.resultsToDisplay;
		displayOnlyOpenPharmacies = userSettings.openPharmaciesOnly;
	}
		
	//login if variable is set to automatic
	if (loginAutomatically) {
		if (!isLoggedIn) {						
			
			detailsFormatIsValid = true;
			
			//if the format of the username and password is valid
			if (detailsFormatIsValid) {				
				//Code to send user details to server to verify
				sendUserDetailsToServer();	
				//change page display based on if the user is logged in or logged out
				changeHomePageOnLogin();
			}
		}				
	}
	
	//function to change page display based on if the user is logged in or logged out
	function changeHomePageOnLogin() {
		
		if (isLoggedIn) {
			//set home page login button text to "Logout"
			$("#login_page_button").html("Logout");
			//set personalised welcome message
			$("#welcome_message").html("Welcome " + username + "!");							
		}
		else {
			//set home page login button text to "Login"
			$("#login_page_button").html("Login");
			//set generic welcome message
			$("#welcome_message").html("Welcome!");	
		}	
	}
	
	//### PAGESHOW FUNCTIONS ###
	
	//when the home page is loaded
	$(document).on("pageshow", "#home", function(){
		
		//change page display based on if the user is logged in or logged out
		changeHomePageOnLogin();
	});
	
	//when the home page is loaded
	$(document).on("pageshow", "#register", function(){
		//clear textboxes
		$("#username_register_textbox").val("");
		$("#password_register_textbox").val("");
	});
	
	//when the login page is loaded
	$(document).on("pageshow", "#login", function(){
		//On page display, set settings, username and password to current details
		//set "show password" checkbox to default of false
		$('#show_pw_checkbox').prop('checked', false).checkboxradio('refresh');
		$('#password_textbox').get(0).type = 'password';	
		//change login page GUI based on isLoggedIn
		changeLoginStatus();			
		//if login details are remembered, load the details
		if (rememberLoginDetails) {	
			//if checkbox is set to login automatically
			if (loginAutomatically) {
				//set the "auto_login_checkbox" checkbox to checked
				$('#auto_login_checkbox').prop('checked', true).checkboxradio('refresh');				
			} else {
				//set the "auto_login_checkbox" checkbox to unchecked
				$('#auto_login_checkbox').prop('checked', false).checkboxradio('refresh');
				loginAutomatically = false;
			}	
			//load the username
			$("#username_textbox").val(username);
			//load the password
			$("#password_textbox").val(password);
			//set the "remember details" checkbox to checked
			$('#remember_login_checkbox').prop('checked', true).checkboxradio('refresh');
			//disable the username and password text boxes
			disableTextBoxes();					
		} else {	
			loginAutomatically = false;
			//set the "auto_login_checkbox" checkbox to unchecked
			$('#auto_login_checkbox').prop('checked', false).checkboxradio('refresh');
			//set the "auto_login_checkbox" checkbox to disabled
			$('#auto_login_checkbox').prop('disabled', true).checkboxradio('refresh');	
			//set username to blank
			$("#username_textbox").val("");
			//set the password to blank
			$("#password_textbox").val("");
			//set the "remember details" checkbox to unchecked
			$('#remember_login_checkbox').prop('checked', false).checkboxradio('refresh');
			//enable the username and password text boxes
			enableTextBoxes();	
		}

		//change password textbox in password field on login page to show or not show characters
		$('#show_pw_checkbox').click(function(){
			if(document.getElementById('show_pw_checkbox').checked) {
				$('#password_textbox').get(0).type = 'text';
			} else {
				$('#password_textbox').get(0).type = 'password';
			}
		});		
		//enable or disable username and password text fields based on if this item is selected
		$('#remember_login_checkbox').click(function(){
			if(document.getElementById('remember_login_checkbox').checked) {

				//get username and password from text boxes
				username = $("#username_textbox").val();
				password = $("#password_textbox").val();
				//set valid variable to default state
				detailsFormatIsValid = false;
				//checks that the user input is valid
				checkUserDetailsAreValid();
				
				//if the format of the username and password is valid
				if (detailsFormatIsValid) {			
					//set local and storage variables with current details
					rememberLoginDetails = true;
					username = $("#username_textbox").val();
					password = $("#password_textbox").val();
					//enable the auto login checkbox
					$('#auto_login_checkbox').attr("disabled",false).checkboxradio('refresh');
					if (loginAutomatically) {
						$('#auto_login_checkbox').prop('checked', true).checkboxradio('refresh');
					} else {
						$('#auto_login_checkbox').prop('checked', false).checkboxradio('refresh');
					}
					localStorage.username = JSON.stringify(username);
					localStorage.password = JSON.stringify(password);			
					localStorage.rememberLoginDetails = JSON.stringify(rememberLoginDetails);	
					//disable the username and password text boxes
					disableTextBoxes();	
				} else {
					rememberLoginDetails = false;	
					$('#remember_login_checkbox').prop('checked', false).checkboxradio('refresh');
				}
			} else {				
				//if it is unchecked, set local and storage variables to null/false
				rememberLoginDetails = false;	
				$('#auto_login_checkbox').prop('checked', false).checkboxradio('refresh');
				$('#auto_login_checkbox').attr("disabled",true).checkboxradio('refresh');
				localStorage.removeItem(username);
				localStorage.removeItem(password);						
				localStorage.rememberLoginDetails = JSON.stringify(rememberLoginDetails);
				//enable the username and password text boxes
				enableTextBoxes();				
				loginAutomatically = false;
				localStorage.loginAutomatically = JSON.stringify(loginAutomatically);
			}
		});
		
		//if auto login checkbox is clicked
		$('#auto_login_checkbox').click(function(){
			//if the checkbox is checked
			if(document.getElementById('auto_login_checkbox').checked) {
				//set local and storage variable to true
				loginAutomatically = true;
				localStorage.loginAutomatically = JSON.stringify(loginAutomatically);
			} else {
				//else set local and storage variable to false
				loginAutomatically = false;
				localStorage.loginAutomatically = JSON.stringify(loginAutomatically);
			}
		});
		//function to disable the username and password text boxes
		function disableTextBoxes() {		
			//change colour of text to show it is disabled
			$("#username_textbox").css("color", "LightGrey");
			$("#password_textbox").css("color", "LightGrey");			
			//disable the text field inputs
			$("#username_textbox").attr("disabled",true);
			$("#password_textbox").attr("disabled",true);			
		}
		//function to enable the username and password text boxes
		function enableTextBoxes() {		
			//change colour of text to show it is disabled
			$("#username_textbox").css("color", "Black");
			$("#password_textbox").css("color", "Black");			
			//enable the text field inputs
			$("#username_textbox").removeAttr("disabled");
			$("#password_textbox").removeAttr("disabled");			
		}
		
		//login if login button is clicked
		$('#login_button').tap(function(){
			if (!isLoggedIn) {			
				//get username and password from text boxes
				username = $("#username_textbox").val();
				password = $("#password_textbox").val();
				
				detailsFormatIsValid = false;
				
				//checks that the user input is valid
				checkUserDetailsAreValid();
				
				//if the format of the username and password is valid
				if (detailsFormatIsValid) {				
					//Code to send user details to server to verify
					sendUserDetailsToServer();			
				}
			}	
		});
		
		//logout if logout button is clicked
		$('#logout_button').click(function(){				
			if (isLoggedIn) {
				//set logged in variable to false
				isLoggedIn = false;
				//change login page GUI based on isLoggedIn
				changeLoginStatus();
				alert("Logged out.");
			}						
		});
		
		//change to register page if register page button is clicked
		$('#register_page_button').click(function(){				
			//change to pharmacy_details page
			$.mobile.changePage("index.html#register");
		});
		
		//change to register page if register page button is clicked
		$('#register_button').click(function(){				
	
			var userDetailsAreValid = false;
	
//TODO check username and password validity
	
//TODO check username availability with node.js server

			//temporary variable assigned to true - will get server result in future implementation
			userDetailsAreValid = true;
					
			if (userDetailsAreValid) {
				alert("Username and password registered successfully.");
				//change to home page
				$.mobile.changePage("index.html#home");
			} else {
				alert("Username and password not registered. Please try again");
			}
		});
			
		//checks that the user input is valid
		function checkUserDetailsAreValid() {		
			//if the username or password are outside bounds, then return
			if ((username.length < MIN_USERNAME_LENGTH) || (username.length > MAX_USERNAME_LENGTH)) {
					detailsFormatIsValid = false;	
					//clear username text field
					$("#username_textbox").val("");
					alert("Error. Username must be between " + MIN_USERNAME_LENGTH + " and " 
						+ MAX_USERNAME_LENGTH + " characters long. Please try again.");
					return;
			}
			else if ((password.length < MIN_PASSWORD_LENGTH) || (password.length > MAX_PASSWORD_LENGTH)) {						
				detailsFormatIsValid = false;	
				//clear password text field
				$("#password_textbox").val("");
				alert("Error. Password must be between " + MIN_PASSWORD_LENGTH + " and " 
					+ MAX_PASSWORD_LENGTH + " characters long. Please try again.");
				return;
			}
			else {
				//else if username and password are valid
				detailsFormatIsValid = true;
			}
		};
	});	
	
	//function that sends user data to the server for verification
	function sendUserDetailsToServer() {	
		//store username and password in userDetails object to send to node.js server
		userDetails.username = username;
		userDetails.password = password;

		
		
//TODO send username and password to server to check if they exist
//TODO implement code to send userDetails to node.js server to check if username and password exist			
		
		//temporary code to check if username and password are valid
		if ((usernameFromServer === userDetails.username) && (passwordFromServer === userDetails.password)) {
			userDetailsVerified = true;
		} else {
			userDetailsVerified = false;
		}	
		
		
		
		//if the username and password are correct and verified from server
		if (userDetailsVerified) {				
			//display logged in msg
			alert("Logged in.");
			//set logged in variable to true
			isLoggedIn = true;
			//change login page GUI based on isLoggedIn
			changeLoginStatus();					
		}
		else {
			//display error msg
			alert("Login details are invalid. Please contact the Find A Chemist administrator to obtain a valid username and password.");
			//clear username and password text boxes
			$("#username_textbox").val("");
			$("#password_textbox").val("");	
			//enable the username and password boxes
			enableTextBoxes();
			//reset "remember login" checkbox
			$('#remember_login_checkbox').prop('checked', false).checkboxradio('refresh');
			$('#auto_login_checkbox').prop('checked', false).checkboxradio('refresh');
			$('#auto_login_checkbox').prop('disabled', true).checkboxradio('refresh');
			//reset variables
			loginAutomatically = false;
			rememberLoginDetails = false;
			localStorage.loginAutomatically = JSON.stringify(loginAutomatically);
			localStorage.rememberLoginDetails = JSON.stringify(rememberLoginDetails);
		}
	}
	
	function changeLoginStatus() {		
		if (isLoggedIn) {
			//set "logged in" text
			$("#login_status").html("Currently logged in as:<br>" + username);
			//disable the login button and enable the logout button
			$("#login_button").attr("disabled", true);
			$("#logout_button").attr("disabled", false);
		}
		else {
			//set "logged out" text
			$("#login_status").html("Currently logged out");
			//enable the login button and disable the logout button
			$("#login_button").attr("disabled", false);
			$("#logout_button").attr("disabled", true);			
		}			
	}
	
	//function to help get target html element clicked
	function getEventTarget(ev) {
		ev = ev || window.event;
		return ev.target || ev.srcElement; 
	}
	//get html element pharmacy_list
	var pharmList = document.getElementById('pharmacy_list');
	//create onClick event for the <ul> html element pharmacy_list
	pharmList.onclick = function(event) {
		
		//reset selectedPharmacyIndex
		selectedPharmacyIndex = -1;
		
		//get the innerHTML contained in the element
		var target = getEventTarget(event).innerHTML;				
		//count through each pharmacy name
		for (var i = 0; i < pharmacyNamesList.length; i++) {
			//check if the pharmacy name is contained in the innerHTML of the <li> html element
			if (target.indexOf(pharmacyNamesList[i]) !== -1) {				
				//set selected pharmacy index for displaying pharmacy details
				selectedPharmacyIndex = i;
				break;
			}		
		}
		
		//if the index and name of the pharmacy have been found, and if no results are currently being loaded
		if ((selectedPharmacyIndex != -1) && (!isLoadingResults)) {
				
			//change to pharmacy_details page
			$.mobile.changePage("index.html#pharmacy_details");
			
			//set isLoadingResults bool to true while results are being retrieved
			isLoadingResults = true;
			//set loading pop-up while pharmacy details are received
			$.mobile.loading('show', { theme: "a", text: "Loading", textVisible: true});
					
			//Initiate Google Places API Place Details request
			function initGetPharmacyDetails() {

				//create a google.maps.LatLng object from user coords
				var userLoc = new google.maps.LatLng(userLocation.latitude,userLocation.longitude);
				//setup new map
				map = new google.maps.Map(document.getElementById('map'), {center: userLoc, zoom: 15});		
				//initialise the service
				var detailsService = new google.maps.places.PlacesService(map);

				//start the service request
				detailsService.getDetails({
					//set place id to current selected place
					placeId: pharmacyPlaceIDsList[selectedPharmacyIndex],
					fields: ['formatted_address', 'formatted_phone_number', 'opening_hours']}, 
					//set callback function
					function(place, status) {	
						//reset selected pharmacy variables
						selectedPharmAddress = null;
						selectedPharmPhoneNo = null;
						selectedPharmOpeningHrs = null;
					
						//set isLoadingResults bool to false once results have been retrieved
						isLoadingResults = false;
						//turn off loading pop-up
						$.mobile.loading('hide');
						
						//if Place Details request status is OK
						if (status === google.maps.places.PlacesServiceStatus.OK) {
							
							//store selected place details in variables	
							if (place.formatted_address) selectedPharmAddress = place.formatted_address;							
							if (place.formatted_phone_number) selectedPharmPhoneNo = place.formatted_phone_number;							
							if (place.opening_hours) selectedPharmOpeningHrs = place.opening_hours;		
		
							//split address on multiple lines
							var tempAddressArray = selectedPharmAddress.split(', ');		
							var tempFullAddress = "";
							//count through array and add <br> to go to next line
							for (var j = 0; j < tempAddressArray.length; j++) {		
								tempFullAddress += (tempAddressArray[j] + "<br>");		
							}
							//clear contents of html for pharmacy details input
							$('#pharmacy_name').html("");
							$('#details_page_dist_away').html("");
							$('#address').html("");		
							$('#phone_number').html("");
							$('#open_status').html("");
							$('#opening_hours_text').html("");
							
							//load pharmacy details
							$('#pharmacy_name').append(pharmacyNamesList[selectedPharmacyIndex]);
							$('#details_page_dist_away').append(pharmacyDistTextList[selectedPharmacyIndex] + " away<hr>");		
							$('#address').append(tempFullAddress);
							$('#phone_number').append("<hr>Phone: " + selectedPharmPhoneNo + "<hr>");
							
							if (selectedPharmOpeningHrs != null) {
								//if the pharmacy is open now
								if (selectedPharmOpeningHrs.open_now === true) {
									$('#open_status').append("Open now<hr>");
								}
								else if (selectedPharmOpeningHrs.open_now === false) {
									$('#open_status').append("Closed now<hr>");
								}
							}
							//if there are business hours
							if (selectedPharmOpeningHrs != null) {	
								var tempOpeningHrs = "";
								//count through each days opening hours and append them
								for (var i = 0; i < 7; i++) {
									tempOpeningHrs += (selectedPharmOpeningHrs.weekday_text[i] + "<br>");								
								}																									
								$('#opening_hours_text').append(tempOpeningHrs);
							}
							else {
								$('#opening_hours_text').append("*No opening hours listed*");
							}
						}						
						else {
							//display error message
							alert("Error. Cannot get pharmacy details. Please reload the app and try again.")							
						}
					});
				
			}	
			//Start the Google request for Place Details
			initGetPharmacyDetails()
		}
	};	
	
	//create getLocation function to get user latitude/longitude
	function getLocation() {	
	
		//set loading pop-up while initial gps coords are received
		$.mobile.loading('show', { theme: "a", text: "Loading", textVisible: true});
	
		//initialise parameters for geolocation.watchPosition on start
		function onSuccess(pos) {
			//set global variable userLocation to current latitude and longitude of user
			userLocation = pos.coords;	
			
			//hide the dialog
			if (isLoadingGPS) {								
				$.mobile.loading('hide');
				isLoadingGPS = false;
			}		
		}
		//error message variable function used as a parameter
		var onError = function(error) {
			var errorMsg;
			//switch to get error message
			switch(error.code) {
				case error.PERMISSION_DENIED: errorMsg = 'Error. Location permission denied. Please reload the app and enable location access.'; 
					break;
				case error.POSITION_UNAVAILABLE: errorMsg = 'Error. Location position unavailable. Please reload the app and ensure location access.'; 
					break;
				case error.TIMEOUT: errorMsg = 'Error. Location position lookup timed out. Please reload the app and ensure location access.'; 
					break;
				default: errorMsg = 'Error. Unknown position.'
				}
				//hide the dialog
				if (isLoadingGPS) {								
					$.mobile.loading('hide');
					isLoadingGPS = false;
				}								
			alert(errorMsg)
		};
		//options location timeout 60000 millisec = 60 sec
		var options = {timeout: 60000, enableHighAccuracy: true}
		//Start watching geolocation coords
		watchLocation = navigator.geolocation.watchPosition(onSuccess, onError, options);		
	};
	
	//start getting user latitude and longitude
	getLocation();
	
	//refresh the settings page on load with current settings stored
	$(document).on("pageshow", "#settings", function(){
		//On page display, set settings to current user settings
		$("#search_range_slider").val(searchRange).slider("refresh");
		$("#no_of_results_slider").val(noOfResults).slider("refresh");
		$("#only_open_pharmacies_checkbox").val(displayOnlyOpenPharmacies).flipswitch("refresh");				
	});	
	
	//when the settings_button is tapped/clicked
	$('#settings_button').tap(function(){		
		//if there is nothing loading, load settings page
		if (!isLoadingGPS)  {
			$.mobile.changePage("index.html#settings");
		}
	});
	
	//Save the user's settings to local storage
	$('#save_settings_button').tap(function(){	
		//set local variables to values selected
		searchRange = $("#search_range_slider").val();
		noOfResults = $("#no_of_results_slider").val();
		displayOnlyOpenPharmacies = $("#only_open_pharmacies_checkbox").val();	
		//create userSettings variable made up of the locally stored variables
		userSettings = { 
			searchDistance: searchRange, 
			resultsToDisplay: noOfResults,
			openPharmaciesOnly: displayOnlyOpenPharmacies};				
		//Store user settings in localstorage
		localStorage.userSettings = JSON.stringify(userSettings);	
		//display "settings saved" message
		alert("Settings saved.");		
		//go back to home page
		$.mobile.changePage("index.html#home");
	});
	
	//when the start_button is tapped/clicked
	$('#start_button').tap(function(){
		//if there is nothing loading, load page
		if (!isLoadingGPS) {
			//if logged in, load page
			if (isLoggedIn) {		
				if (userLocation != null) {				
					$.mobile.changePage("index.html#show_pharmacies");				
				}
				else {
					alert("Error. Location permission denied. Please reload the app and enable location access.");	
				}				
			} else {
				//if not logged in, display message
				alert("Error. Not logged in. Please login at the top left of the screen.");
			}
		}
	});	
	
	//when the settings_button is tapped/clicked
	$('#login_page_button').tap(function(){		
		//if there is nothing loading, load login page
		if (!isLoadingGPS)  {
			$.mobile.changePage("index.html#login");
		}
	});	
	
	//when the back_to_results_button is tapped/clicked
	$('#back_to_results_button').tap(function(){
		//if there is nothing loading, load show_pharmacies page
		if (!isLoadingResults) {
			if (userLocation != null) {				
				$.mobile.changePage("index.html#show_pharmacies");
			}
			else {
				alert("Error. Location permission denied. Please reload the app and enable location access.");	
			}
		}
	});	
	
	//when the show_pharmacies page is loaded
	$(document).on("pageshow", "#show_pharmacies", function(){
		//if there is nothing loading and gps is available, load show pharmacies page
		if (!isLoadingGPS) {	
			//if there is user location data available
			if (userLocation != null) {		
				//set loading results variable to true
				isLoadingResults = true;
			
				//if only open pharmacies are to be displayed, change title
				if (displayOnlyOpenPharmacies === "yes") {
					//$("#pharmacies_title").html("Open pharmacies nearby");
					$(".title").html("Open pharmacies<br>within " + searchRange + " km");
				} else {
					$(".title").html("All pharmacies<br>within " + searchRange + " km");
				}
				//set loading pop-up while results are received
				$.mobile.loading('show', { theme: "a", text: "Loading", textVisible: true});
				
				//create temporary range variable in metres for use in request parameter in google search request
				var searchRangeInMetres = searchRange * 1000;				
				
				//clear pharmacy_list div
				$('#pharmacy_list').html("");
				
				//set variables used to use Google Places API
				var map;
				var service;
				var infowindow;

				//start the function to get pharmacy data from Google Places API with Nearby Search
				function initGetPharmaciesList() {												
					//reset pharmacyCoordsList
					pharmacyCoordsList.length = 0;
					//create a google.maps.LatLng object from user coords
					var userLoc = new google.maps.LatLng(userLocation.latitude,userLocation.longitude);

					//setup new map
					map = new google.maps.Map(document.getElementById('map'), {center: userLoc, zoom: 15});
					
					//initialise request function
					var request = {
					location: userLoc,
					radius: searchRangeInMetres,					
					keyword: 'Pharmacy'};

					service = new google.maps.places.PlacesService(map);
					service.nearbySearch(request, callback);
								
					//callback function to retrieve results
					function callback(results, status) {
						if (status == google.maps.places.PlacesServiceStatus.OK) {
							
							//if the pharmacy search is ok, reset local array variables
							pharmacyNamesList.length = 0;
							pharmacyPlaceIDsList.length = 0;
							pharmacyResults.length = 0;
							pharmacyIsOpenList.length = 0;
							
							//count through each result
							for (var i = 0; i < results.length; i++) {
								var place = results[i];
					  
								//add results object to array
								pharmacyResults.push(results[i]);	
								
								//add latitude and longitude to coords list
								pharmacyCoordsList.push(results[i].geometry.location);
								
								//add pharmacy name to names array for getting distanceMatrix
								pharmacyNamesList.push(results[i].name);
								
								//add pharmacy place ID to IDs array for getting Google Place Details requests
								pharmacyPlaceIDsList.push(results[i].place_id);
								
								//add "pharmacy is open" variable to array
								if (results[i].opening_hours != null) {
									pharmacyIsOpenList.push(results[i].opening_hours.open_now);								
								}
								else {
									pharmacyIsOpenList.push(false);
								}									

								//split into individual words if name is longer than 25 characters
								if (pharmacyNamesList[i].length > 25) {	
									//initialise start and end indices
									var startIndex = 0;						
									var endIndex = 25;
									//while character not equal to space
									while (pharmacyNamesList[i].charAt(endIndex) != " ") {						
										endIndex--;													
									}
									//set line 1
									var line1 = pharmacyNamesList[i].slice(startIndex, endIndex);						
									//change start and end indices
									startIndex = endIndex;
									endIndex = pharmacyNamesList[i].length;						
									//set line 2
									var line2 = pharmacyNamesList[i].slice(startIndex, endIndex);						
									//insert html line break where needed
									pharmacyNamesList[i] = line1 + "<br>" + line2;	
								}								
							}
							
							//call Google Distance Matrix Service to get distance from user for each result						
							function initGetDistance() {
								var bounds = new google.maps.LatLngBounds;
								var markersArray = [];

								//set origin to user location
								var origin = [{lat: userLocation.latitude, lng: userLocation.longitude}];
								var latLngOrigin = new google.maps.LatLng(userLocation.latitude,userLocation.longitude);
								//set destinations to each pharmacy lat/long found
								var destinations = pharmacyCoordsList;								
						
								//create new distanceMatrixService
								var distService = new google.maps.DistanceMatrixService;
								//use the service to get the distance matrix
								distService.getDistanceMatrix(   {origins: origin, destinations: destinations, travelMode: 'DRIVING', unitSystem: google.maps.UnitSystem.METRIC}, 
									//set callback response function
									function(response, status) {
										//reset isloadingresults boolean
										isLoadingResults = false;
										//hide loading progress
										$.mobile.loading('hide');
										
										//if status is ok, get response
										if (status !== 'OK') {																														
											//display error alert
											alert ("Error loading results. Please try again");
											//change back to home page
											$.mobile.changePage("index.html#home");		
										} else {
											//reset pharmacy distance values arrays
											pharmacyDistValuesList.length = 0;
											pharmacyDistTextList.length = 0;
											
											//set lists of origins (only user location) and destinations (each pharmacy found)
											var originList = response.originAddresses;
											var destinationList = response.destinationAddresses;																				
											//get distance results from DistanceMatrix response
											var distResults = response.rows[0].elements;
											
											//set pharmacy list arrays from distResults										
											for (var j = 0; j < distResults.length; j++) {											
												
												pharmacyDistValuesList[j] = distResults[j].distance.value;
												pharmacyDistTextList[j] = distResults[j].distance.text;								
											}										
											//helper for sorting algorithm
											function swap(array, x, y) {
												var temp = array[x];
												array[x] = array[y];
												array[y] = temp;
											}
											//function that uses sorting algorithm to sort pharmacies into order, from closest to furthest away
											function sortPharmacies() {
												//initialise variables used for sorting algorithm
												var countOuter = 0;
												var countInner = 0;
												var countSwap = 0;
												var swapped;
												do {
													countOuter++;
													swapped = false;
													for(var i = 0; i < pharmacyDistValuesList.length; i++) {
														countInner++;
														//check if the values are to be swapped
														if(pharmacyDistValuesList[i] && pharmacyDistValuesList[i + 1] && pharmacyDistValuesList[i] > pharmacyDistValuesList[i + 1]) {
															//add 1 to countSwap and swap pharmacy details to be displayed
															countSwap++;
															//swap distance value (in metres) - this value is used to set the order
															swap(pharmacyDistValuesList, i, i + 1);
															//swap didtance text (in km with "km at end" - this value is used for displaying "km away"
															swap(pharmacyDistTextList, i, i + 1);
															//swap the pharmacy name - this value is used to display the name of the pharmacy
															swap(pharmacyNamesList, i, i + 1);
															//swap the pharmacy "is open" variable - used to determine if the pharmacy is currently open
															swap(pharmacyIsOpenList, i, i + 1);		
															//swap pharmacy Place IDs elements
															swap(pharmacyPlaceIDsList, i, i + 1);																
															swapped = true;
														}
													}
												} while(swapped);										
											}
											//start the pharmacy list sorting function			
											sortPharmacies();									
											
											//set the maximum number of pharmacies to display
											if (pharmacyNamesList.length >= noOfResults) {	
												//if there are more results than the number the user wants to see, limit the maximum number to the number the user wants to see
												maxPharmacyCount = noOfResults;
											}
											else {
												//otherwise set the maximum number to the number of results
												maxPharmacyCount = pharmacyNamesList.length;
											}										
											//count number of pharmacies found
											var pharmacyListCount = 0;
											//set no pharmacies found error msg
											var noPharmaciesFoundError = beginningHTML
																+ "No pharmacies found.<br>Please change search<br>settings and try again."																												
																+ endingHTML;		
											//count through the results array up to the max number of results to display
											for (var j = 0; j < maxPharmacyCount; j++) {												
												//Create a string representation of each pharmacy
													var tempString = beginningHTML
																+ pharmacyNamesList[j]												
																+ "<br><h2 class=\"distance_away\">"
																+ pharmacyDistTextList[j]												
																+ " away</h2>"						
																+ endingHTML;
												//if all pharmacies are to be displayed
												if (displayOnlyOpenPharmacies === "no") {
													//if the pharmacy is within the search range, then display
													if (pharmacyDistValuesList[j] <= (searchRange*1000)) {	
														//Add the string representation to the id "show_pharmacies"
														$('#pharmacy_list').append(tempString);	
														pharmacyListCount += 1;
													}
												}
												else {
													if (pharmacyIsOpenList[j] === true) {														
														//if the pharmacy is within the search range, then display
														if (pharmacyDistValuesList[j] <= (searchRange*1000)) {	
															//Add the string representation to the id "show_pharmacies"
															$('#pharmacy_list').append(tempString);	
															pharmacyListCount += 1;
														}
													}
												}
											}
											//if there are no pharmacies found, display error msg
											if (pharmacyListCount === 0) {
												$('#pharmacy_list').append(noPharmaciesFoundError);	
											}							
										}//end distanceMatrix results status
									}//end function(response,status)
								);//end getDistanceMatrix
							}//end function initGetDistance
							
							//Get distance from user location via google Distance Matrix service
							initGetDistance();							
				
						}//end if placesServiceStatus = OK
						//if google status not ok
						else {
							//hide loading progress
							$.mobile.loading('hide');
							//reset isloadingresults boolean
							isLoadingResults = false;
							//display error alert
							alert ("Error loading results. Please try again");
							//change back to home page
							$.mobile.changePage("index.html#home");
						}//end else
					}//end function callback
				}//end function initGetPharmaciesList
				
				//Start initGetPharmaciesList() function to get pharmacies list from Google Places API
				initGetPharmaciesList();			
			}
			else {
				//display alert box
				alert("Error. Cannot find user location. Please reload the app and enable location access.")
				//reload start page
				$.mobile.changePage("index.html#home");	 				
			}		
		}//end if !isLoadingGPS		
	});//end function $(document).on("pageshow", "#show_pharmacies"	
});// end function $(document).ready(function()

//Function for "loading" progress bar
$(document).bind( 'mobileinit', function(){
  $.mobile.loader.prototype.options.text = "loading";
  $.mobile.loader.prototype.options.textVisible = false;
  $.mobile.loader.prototype.options.theme = "a";
  $.mobile.loader.prototype.options.html = "";
});

//Function that stops geolocation watching when window closes
$(window).unload(function(){
	navigator.geolocation.clearWatch(watchLocation);
});

//SendJSON function to send details to the server - not yet implemented
 function sendjson(urlsuffix,obj,win,fail) {
  console.log("In sendjson");
  console.log(JSON.stringify(obj))
   crossdomain.ajax({
    url:urlsuffix,
    type:'POST',
    contentType:'application/json; charset=utf-8',
    dataType:'json',
    data:JSON.stringify(obj),
    success:function(result){
      win && win(result);
    },
    failure:function(){
      fail && fail();
    }
  });
  console.log("Exiting sendjson ");
}

function win(result) {
  console.log("Data sent: "+result);
}
function fail() {
  console.log("Failure to send: ");
}