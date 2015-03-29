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
	frame.add( _createIPbox( _("Server IP or URL"), _("The IP Address of the Socket Server") ));
	frame.add( _createPORTbox( _("Server Port"), _("The Port the Socket Server is listening on") ));	
	frame.show_all();
	return frame;
}






//***// preferences functions

function _createIPbox(text, tooltip) {
// create box with text entry for Server IP
	let box = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL });
	let label = new Gtk.Label({ label: text, xalign: 0, tooltip_text: tooltip });
	let textbox = new Gtk.Entry({ text : _getIP() });
	
	// connect to "text-changed" emit signal
    	textbox.connect('changed', function() { _setIP(textbox.get_text()); });

	//fill the box with content
	box.pack_start(label, true, true, 0);
	box.add(textbox, true, true, 5);

	return box;
}



function _createPORTbox(text, tooltip) {
// create box with text entry for Server Port
	let box = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL });
	let label = new Gtk.Label({ label: text, xalign: 0, tooltip_text: tooltip });
	let textbox = new Gtk.Entry({ text : _getPort() });

	// connect to "text-changed" emit signal
    	textbox.connect('changed', function() { _setPort(textbox.get_text()); });

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


