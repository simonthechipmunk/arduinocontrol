/*
 * extension.js
 * Gnome3 Arduino Control Extension
 *
 * Simple bidirectional control of Arduino outputs through a gnome-shell panel menu
 *
 *
 * Author: Simon Junga (simonthechipmunk at gmx.de)
 *
 * This extension is mostly based on code found in the following gnome-extensions:
 * shutdowntimer@lusk.cz
 * ShutdownTimer@neumann
 * AdvancedVolumeMixer@harry.karvonen.gmail.com
 * chatstatus@zeten30.gmail.com
 * backslide@codeisland.org
 * lockkeys@vaina.lt
 *
 * Thanks to the authors of these great extensions. Since there is very little information on writing Gnome3 extensions,
 * well documented ones are a blessing.
 *
 * This program is free software; you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation; either version 2 of the License, or (at your option)
 * any later version.
 *
 */


//***// imports:

// icons and labels
const St = imports.gi.St;

// main functionality
const Main = imports.ui.main;
const Mainloop = imports.mainloop;

// menu items
const Panel = imports.ui.panel;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Slider = imports.ui.slider;

// utilities for external programs and command line
const Config = imports.misc.config;
const ShellVersion = Config.PACKAGE_VERSION.split('.');
const Util = imports.misc.util;
const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;

// messagetray notifications
const MessageTray = imports.ui.messageTray;

// clutter
const Clutter = imports.gi.Clutter;

// own imports
const Me = imports.misc.extensionUtils.getCurrentExtension();
const Prefs = Me.imports.prefs;
const Utils = Me.imports.utils;

const ArduinoMenuCreator = Me.imports.menu; // import menu module




// define global variables
let panelmenu, sectionBox, icon, inStr, sockClient, sockConnection, output_reader, cancel_read, cancel_connect;

let network_monitor, network_check;
let event=null, servernotresponding, firstrun;


//define Menu Icons
let initsyncIcon = 'mail-send-receive-symbolic';
let syncIcon = 'emblem-synchronizing-symbolic';
let runIcon = 'dialog-information-symbolic';




//***// basic extension functions

function init() {
	// initialize preferences
	Prefs.init();

}



function enable() {

	// set up the client and Gcancellable operation for the async calls 
	sockClient = new Gio.SocketClient({timeout: 7});
	cancel_read = new Gio.Cancellable();
	cancel_connect = new Gio.Cancellable();

	firstrun = true;

	// enable the menu button
	_ArduinoPanelMenu("enable");

	// connect to socket server
	_SocketConnect(null, null, null);



}




function disable() {

	// remove watchdog timer event
	Mainloop.source_remove(event);


	// cancel the async_read and async_connect calls
	cancel_read.cancel();
	cancel_connect.cancel();


	// disconnect active network-changed signal
	if (network_check) {			
		network_monitor.disconnect(network_check);
		network_check = null;
	}


	// close active socket connection
	if(sockConnection) {
	sockConnection.close(null);
	}


	// call function to remove panelmenu
	_ArduinoPanelMenu("disable");



}








//***// extension functions

function _ArduinoPanelMenu(set) {
// create the extension menu in the status area with slider and toggle switch


	if (set == "show" && panelmenu && (icon.get_icon_name() == syncIcon || icon.get_icon_name() == initsyncIcon) ) {
	// show the menu

		// change menu icon
		icon.set_icon_name(runIcon);

		// remove any child items in the panelmenu
		panelmenu.menu.removeAll();

		// add itembox to the menu
		sectionBox = null;
		sectionBox = new ArduinoMenuCreator.ControlMenu( _SocketSend, _CallNotify);
		panelmenu.menu.addMenuItem(sectionBox);

	}




	else if (set == "hide" && panelmenu) {
	// hide the menu

		// change menu icon
		icon.set_icon_name(syncIcon);

		// remove any child items in the panelmenu
		panelmenu.menu.removeAll();
		
		// add connect message
		let MessageRecon = new PopupMenu.PopupMenuItem( _("Reconnecting to Server..."), { reactive: false });
		// extension settings shortcut
		let settingsMenuItem = new PopupMenu.PopupMenuItem("Settings", { reactive: true });
		settingsMenuItem.connect('activate', function() { imports.misc.util.spawn(['gnome-shell-extension-prefs',
			 'arduinocontrol@simonthechipmunk.noreply.com']); });
		panelmenu.menu.addMenuItem(MessageRecon);
		panelmenu.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
		panelmenu.menu.addMenuItem(settingsMenuItem);

	}




	else if (set == "disable" && panelmenu) {
	// remove the panelmenu entirely
		panelmenu.destroy();
		panelmenu = null;
		sectionBox = null;
		icon = null;

	}




	else if (set == "enable" && !panelmenu) {
	// show connectivity icon in main panel
		
		// create seperate panelmenu button on the top panel
		panelmenu = new PanelMenu.Button(0.0);
		icon = new St.Icon({icon_name: initsyncIcon, style_class: 'system-status-icon'});
		panelmenu.actor.add_actor(icon);

		// add panelmenu to the main panel
		Main.panel.addToStatusArea("ArduinoControl", panelmenu, 0, "right");


		// add connect message
		let MessageInit = new PopupMenu.PopupMenuItem( _("Retrieving initial Connection..."), { reactive: false });
		// extension settings shortcut
		let settingsMenuItem = new PopupMenu.PopupMenuItem("Settings", { reactive: true });
		settingsMenuItem.connect('activate', function() { imports.misc.util.spawn(['gnome-shell-extension-prefs',
			 'arduinocontrol@simonthechipmunk.noreply.com']); });
		panelmenu.menu.addMenuItem(MessageInit);
		panelmenu.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
		panelmenu.menu.addMenuItem(settingsMenuItem);

	}



}





function _CallNotify(header, text, transient) {
// Call System Notification

	// create notification source
	let source = new MessageTray.Source("ArduinoControl", 'user-info-symbolic');
	let notification = new MessageTray.Notification(source, "" + header, "" + text);
	// display the notification
	Main.messageTray.add(source);
	source.notify(notification);
	// set the notification style
	notification.setTransient(transient);
}






function _SocketSend(actor, value) {
// Send data to server

	let outStr = sockConnection.get_output_stream();
	outStr.write(actor + ':' + value + '\n', null);

}





function _SocketRead(gobject, async_res, user_data) {
// Callback for reading incoming Server messages

	if (cancel_read.is_cancelled()) {
		return;
	}

	// cancel any read calls that may still be running
	cancel_read.cancel();
	cancel_read.reset();


	if (!gobject && firstrun) {
		// server message is expected within 2 seconds after initial connection
		Mainloop.source_remove(event);
		event = GLib.timeout_add_seconds(0, 3, _ConnectionLost);
		// set server status to 'not responding'
		servernotresponding = true;

		// start new read_async call
		output_reader.read_line_async(0, cancel_read, _SocketRead, null);

		return;

	}
		

	else if (gobject) {

		let lineout, charlength, error;

		// try reading from socketstream
		try {
			// finish async_read call
			[lineout, charlength, error] = gobject.read_line_finish(async_res);

		}

		catch (err) {
			// return and wait for auto-reconnect
			return;
		}


		if (lineout == null) {
			// check for invalid data, return and wait for auto-reconnet
			return;
		}

		else if (lineout == "client:connect") {
			// check for loopback
			global.log("The server is looping input! Check your serial port.");
		}


		// show the panelmenu
		_ArduinoPanelMenu("show");

		// set server monitoring variable
		servernotresponding = false;
		firstrun = true;

		// process received data
		if (sectionBox) {
			sectionBox._ProcessData(lineout);
		}

	}



	// reset watchdog timer for last successful read (minimum wait time is the server's heartbeat interval)
	Mainloop.source_remove(event);
	event = GLib.timeout_add_seconds(0, 8, _ConnectionLost);

	// start new read_async call
	output_reader.read_line_async(0, cancel_read, _SocketRead, null);

}






function _SocketConnect(gobject, async_res, user_data) {
// Callback for established connection with the Server

	if (cancel_connect.is_cancelled()) {
		return;
	}

	// cancel any connection calls that may still be running
	cancel_connect.cancel();
	cancel_connect.reset();


	// get default network connection state
	network_monitor = Gio.network_monitor_get_default();
	let connected = network_monitor.network_available;


	if(connected) {


		// disconnect active network-changed signal
		if (network_check) {
			network_monitor.disconnect(network_check);
			network_check = null;
		}


		if (!gobject) {
		
			// async connect to socket server
			sockClient.connect_to_host_async(Prefs._getIP() + ":" + Prefs._getPort(), null, 
				cancel_connect, _SocketConnect, null);
			return;
		}

		else {

			// try establishing the connection to remote server
			try {
				// finish async_connect call
				sockConnection = gobject.connect_to_host_finish(async_res, null);
			}

			catch (err) {

				// timed async connect to socket server
				Mainloop.source_remove(event);
				event = GLib.timeout_add_seconds(0, 3, function() {
					sockClient.connect_to_host_async(Prefs._getIP() + ":" + Prefs._getPort(), null, 
						cancel_connect, _SocketConnect, null);
				});
				return;
			}
			


		}		


		// create new input stream from sockConnection
		inStr = new Gio.DataInputStream({ base_stream: sockConnection.get_input_stream() });
		// create new consistent stream for output_reader from inStr (otherwise Shell crashes on read_line_async 
		// when the inputstream gets closed by the server)
		output_reader = new Gio.DataInputStream({ base_stream: inStr });


		// start waiting for server messages and initialize async read on firstrun
		_SocketRead(null, null, null);

		// establish initial connection to the server by sending some randomness 
		// (needed for Arduino with Ethernet Module)
		_SocketSend("client", "connect");

	}


	else if (!network_check) {
		// wait for network to be available
		network_check = network_monitor.connect('network-changed', function() {
			_SocketConnect(null, null, null);
		});

	}



}






function _ConnectionLost() {
// React on a lost connection to the Server
	
	// hide the panelmenu
	_ArduinoPanelMenu("hide");


	// close socket connection
	sockConnection.close(null);

	// notify user
	if (servernotresponding && firstrun){
		// set firstrun variable
		firstrun = false;
		_CallNotify( _("Arduino Control"), _("The Server is available on the Network but not responding. Please check the Server and restart it."), false);
	}


	// try to reconnect to the server
	_SocketConnect(null, null, null);


}



