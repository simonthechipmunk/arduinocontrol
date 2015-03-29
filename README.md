# Arduino Control for GNOME Shell
This extension communicates with Arduino (Atmel µC) through a tcp Socket Server.

It is rather meant as a basic framework to show how to establish a Connection between Arduino and Clients. Go ahead and customize it to your needs: Add Sliders, Switches, etc. in the menu.js and Outputs/Inputs on the Arduino. Get Crazy and Control your Room Lights from any Computer on the Network ;)

**Warning**
If you update this extension from extensions.gnome.org, **ALL** files in the extension directory will be **OVERWRITTEN**. Any customization you made to 
the extension will then be lost, so please make a backup before you click on "update".



## Features
* Show menu including a switch, slider and sensor value in the panel (basic configuration).
* Send values of the switch and slider via serial or ethernet to the Arduino board and receive sensor values from it.
* Multiple clients can be connected to the Server.
* Data is automatically synced between every connected client and the Arduino.
* Auto reconnect in case of network failure.
* Scripts for Arduino are included in the extension directory (Ethernet or Serial)





## Setup
You have two options to get your Arduino running:


1. Use the Arduino as the Socket Server directly (You need an Ethernet Shield or sufficient adaptor like enc28J60 for this to work). Since this has the big advantage of not needing a Computer to serve as an interface between Arduino and the Clients, this is the recommended method.

2. Use a Computer to run a python based Socket Server that communicates with Arduino via Serial (No additional Hardware is needed for this to work).





  Method 1:

	Get the UIPEthernet library for Arduino (in case of an enc28J60 Controller) written by Norbert Truchsess and import it in your Arduino IDE:
	[https://github.com/ntruchsess/arduino_uip]
	
	Or uncomment the corresponding lines in the arduino sketch to use a w5100 controller

	Connect the Ethernet Module as follows:


		Module		Arduino

		CS (SS)		pin10	
		SI (MO)		pin11
		SO (MI)		pin12
		SCK(CK)		pin13
		RESET		RESET
		VCC		3.3V for enc28J60 (5V for w5100) Be careful. Selecting the wrong voltage can damage your controller!
		GND		GND


	Connect LEDs to pin2 and pin3 of the Arduino (and any sensor signal to pin A0 to get the values displayed in the Extension)

	Load the "Arduino_Sketch_SocketServer_UIPEthernet.ino" onto your Arduino (make sure to set up the desired IP and Port according to your configuration) and connect it to your network.

	Set up the IP and Port of the Server in the Extension Settings and start the Extension.

	Enjoy controlling your LEDs.




  Method 2:

	Connect your Arduino via USB-Serial with the PC

	Connect LEDs to pin2 and pin3 of the Arduino (and any sensor signal to pin A0 to get the values displayed in the Extension)

	Load the "Arduino_Sketch_SocketServer_PythonSocketServer.ino" onto your Arduino

	Determine what Serial Port your Arduino is connected to (IDE > Tools > SerialPort): something like [/dev/ttyUSB0] for generic Serial Converters 
	or [/dev/ttyACM0] for Arduinos with Atmel Serial Converter

	Make the python Script executable:

		chmod +x ~/.local/share/gnome-shell/extensions/arduinocontrol@simonthechipmunk.noreply.com/python/arduino_socketserver.py


	Start the python Server:

		   python ~/.local/share/gnome-shell/extensions/arduinocontrol@simonthechipmunk.noreply.com/python/arduino_socketserver.py "IP" "Port" "Device"

	  example: python ~/.local/share/gnome-shell/extensions/arduinocontrol@simonthechipmunk.noreply.com/python/arduino_socketserver.py 127.0.0.1 21567 /dev/ttyACM0

	Set the IP Address of the Server to 127.0.0.1 for a local Server or set it to your Comuter's Network IP to make it available to other clients on the Network

	Set up the IP and Port of the Server in the Extension Settings and start the Extension.

	Enjoy controlling your LEDs.





## Debugging:

	If you ever need to determine what the Server is sending at the moment, you can use a simple text based client to connect to it. You can find the Script 
	in the python directory:

			chmod +x ~/.local/share/gnome-shell/extensions/arduinocontrol@simonthechipmunk.noreply.com/python/debug_socketclient.py

			python ~/.local/share/gnome-shell/extensions/arduinocontrol@simonthechipmunk.noreply.com/python/debug_socketclient.py "IP" "Port"







## Missing features
* currently none. throw some ideas at me ;)





## Incomplete features





## Known issues
*(fix)(concerns: python Socket Server) The serial address of the Arduino board may vary between reboots. The correct device has to be set up manually when starting the python Socket Server. Setting up udev rules should resolve this issue.

*(concerns: w5100 Ethernet Module) I was only able to connect to this Module with one client at a time and it's output was also corrupted (Line break 
after very single character). Maybe the Module I purchased is fake since it was a cheap one from China. If you happen to have a genuine w5100 Module 
around (Arduino Ethernet Shield) please let me know if it is working in a multi client setup.






## Change log
Version numbering follows the uploads to the extension website.

**Version 3 (23-11-2014)**
* first public version

**Version 4 (29-03-2015)**
* auto reconnect and menu status messages
* seperate menu.js for easier customization of the menu entries
* github repository https://github.com/simonthechipmunk/arduinocontrol
* support for translations



