/*
 * Preferences for the extension which will be available in the 
 * "gnome-shell-extension-prefs" tool.
 *
 * In the preferences, you can set the Server IP and Port.
 * see: https://live.gnome.org/GnomeShell/Extensions#Extension_Preferences
 *
 */

//***// imports:

// main
const Gio  = imports.gi.Gio;
const Gtk  = imports.gi.Gtk;
const Lang = imports.lang;

// translations
const Gettext = imports.gettext.domain('arduinocontrol');
const _ = Gettext.gettext;

// own imports
const Me   = imports.misc.extensionUtils.getCurrentExtension();
const Utils = Me.imports.utils; 




// define global variables
let settings = {};





//***// basic preferences functions

function init() {

	// init translations
	Utils._initTranslations();

	// load the settings schema
    	settings = Utils._getSettingsSchema();

	// create custom command bindings for gsettings "bool" and "string"
    	let set_boolean = Lang.bind(settings, settings.set_boolean);
    	let set_string = Lang.bind(settings, settings.set_string);

    	settings.set_boolean = function(key, value) {
        	set_boolean(key, value);
        	Gio.Settings.sync();
    	};

    	settings.set_string = function(key, value) {
        	set_string(key, value);
        	Gio.Settings.sync();
    	};

}



function buildPrefsWidget() {
// build the Gtk preferences widget
	let frame = new Gtk.Box({orientation: Gtk.Orientation.VERTICAL, border_width: 10, margin: 20});

	// add items to the widget frame
	frame.add( _createTextBox( _("Server IP or URL"), _("The IP Address of the Socket Server"), _getIP, _setIP ));
	frame.add( _createTextBox( _("Server Port"), _("The Port the Socket Server is listening on"), _getPort, _setPort ));	
	frame.show_all();
	return frame;
}






//***// preferences functions

function _createTextBox(text, tooltip, getFunction, setFunction) {
// create box with text entry for Server IP
	let box = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, margin: 5 });
	let label = new Gtk.Label({ label: text, xalign: 0, tooltip_text: tooltip });
	let textbox = new Gtk.Entry({ text : getFunction(), tooltip_text: tooltip });
	
	// connect to "text-changed" emit signal
    	textbox.connect('changed', function() { setFunction(textbox.get_text()); });

	//fill the box with content
	box.pack_start(label, true, true, 0);
	box.add(textbox, true, true, 5);

	return box;
}




// functions to get/set gsettings entries
function _getIP() {
	return settings.get_string('ip');
}


function _getPort() {
	return settings.get_string('port');
}


function _setIP(command) {
	settings.set_string('ip', command);
}


function _setPort(command) {
	settings.set_string('port', command);
}


